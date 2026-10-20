// Tiny in-memory stand-in for the few MongoDB features the API uses.
// Only for `npm run dev` without MONGODB_URI and for the automated tests —
// production always uses real MongoDB (lib/mongodb.js).

const get = (doc, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), doc);
const TYPES = { string: v => typeof v === 'string', number: v => typeof v === 'number' && Number.isFinite(v) };

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, cond]) => {
    const v = get(doc, key);
    if (cond && typeof cond === 'object' && !Array.isArray(cond) && !(cond instanceof Date)) {
      return Object.entries(cond).every(([op, arg]) => {
        if (op === '$type') return TYPES[arg]?.(v);
        if (op === '$in') return arg.includes(v);
        if (op === '$gte') return v >= arg;
        if (op === '$lte') return v <= arg;
        throw new Error(`memory-db: unsupported operator ${op}`);
      });
    }
    return v === cond;
  });
}

function sorter(spec) {
  const keys = Object.entries(spec);
  return (a, b) => {
    for (const [k, dir] of keys) {
      const x = get(a, k), y = get(b, k);
      if (x < y) return -dir;
      if (x > y) return dir;
    }
    return 0;
  };
}

const resolve = (doc, expr) => (typeof expr === 'string' && expr.startsWith('$$ROOT') ? doc : typeof expr === 'string' && expr.startsWith('$') ? get(doc, expr.slice(1)) : expr);

function runPipeline(docs, pipeline) {
  let rows = docs.map(d => structuredClone(d));
  for (const stage of pipeline) {
    const [op, arg] = Object.entries(stage)[0];
    if (op === '$match') rows = rows.filter(d => matches(d, arg));
    else if (op === '$sort') rows.sort(sorter(arg));
    else if (op === '$limit') rows = rows.slice(0, arg);
    else if (op === '$group') {
      const groups = new Map();
      for (const d of rows) {
        const id = resolve(d, arg._id);
        const key = JSON.stringify(id);
        let g = groups.get(key);
        if (!g) groups.set(key, (g = { _id: id, __first: {} }));
        for (const [field, acc] of Object.entries(arg)) {
          if (field === '_id') continue;
          const [aop, aexpr] = Object.entries(acc)[0];
          if (aop === '$first') { if (!(field in g.__first)) { g.__first[field] = true; g[field] = resolve(d, aexpr); } }
          else if (aop === '$sum') g[field] = (g[field] || 0) + (typeof aexpr === 'number' ? aexpr : resolve(d, aexpr));
          else throw new Error(`memory-db: unsupported accumulator ${aop}`);
        }
      }
      rows = [...groups.values()].map(({ __first, ...g }) => g);
      if (pipeline.some(s => s.$group && JSON.stringify(s).includes('"$ROOT"'))) throw new Error('memory-db: use $$ROOT');
    } else if (op === '$replaceRoot') {
      const parts = arg.newRoot.$mergeObjects;
      rows = rows.map(d => Object.assign({}, ...parts.map(p => (typeof p === 'string' ? resolve(d, p) : Object.fromEntries(Object.entries(p).map(([k, e]) => [k, resolve(d, e)]))))));
    } else if (op === '$project') {
      const keep = Object.entries(arg).filter(([, v]) => v === 1).map(([k]) => k);
      rows = rows.map(d => Object.fromEntries(keep.filter(k => k in d).map(k => [k, d[k]])));
    } else throw new Error(`memory-db: unsupported stage ${op}`);
  }
  return rows;
}

export function createMemoryDb() {
  const store = new Map();
  const collection = name => {
    if (!store.has(name)) store.set(name, []);
    const docs = store.get(name);
    return {
      docs,
      async createIndex() {},
      async findOne(filter) { const d = docs.find(x => matches(x, filter)); return d ? structuredClone(d) : null; },
      async insertOne(doc) {
        if (name === 'scoreAttempts' && doc.attemptId && docs.some(d => d.attemptId === doc.attemptId)) {
          throw Object.assign(new Error('duplicate key'), { code: 11000 });
        }
        docs.push(structuredClone({ _id: doc._id ?? `${name}-${docs.length + 1}`, ...doc }));
        return { acknowledged: true };
      },
      async updateOne(filter, update) {
        const d = docs.find(x => matches(x, filter));
        if (d) Object.assign(d, update.$set || {});
        return { matchedCount: d ? 1 : 0 };
      },
      async updateMany(filter, update) {
        const hits = docs.filter(x => matches(x, filter));
        hits.forEach(d => Object.assign(d, update.$set || {}));
        return { matchedCount: hits.length };
      },
      async countDocuments(filter) { return docs.filter(x => matches(x, filter)).length; },
      aggregate(pipeline) { return { toArray: async () => runPipeline(docs, pipeline) }; },
    };
  };
  const cache = new Map();
  return { collection: name => (cache.has(name) ? cache.get(name) : cache.set(name, collection(name)).get(name)) };
}
