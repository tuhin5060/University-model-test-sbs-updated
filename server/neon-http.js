// Minimal client for Neon's SQL-over-HTTPS endpoint (the same protocol the
// official @neondatabase/serverless driver uses). No npm dependency, so the API
// bundles on Cloudflare Pages even when no `npm install` runs there.

// Postgres type ids → parsers for the text values Neon returns.
const toDate = text => {
  // "2026-10-21 19:51:37.123456+00" → ISO 8601 that every JS engine parses.
  const iso = text.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1').replace(/([+-]\d\d)$/, '$1:00');
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? text : date;
};
const PARSERS = {
  16: v => v === 't', // bool
  21: Number, // int2
  23: Number, // int4
  26: Number, // oid
  700: Number, // float4
  701: Number, // float8
  114: JSON.parse, // json
  3802: JSON.parse, // jsonb
  1114: v => toDate(`${v}+00`), // timestamp (stored as UTC)
  1184: toDate, // timestamptz
  // int8 (20) and numeric (1700) stay strings, as in node-postgres.
};

const param = v => (v === null || v === undefined ? null : typeof v === 'object' ? JSON.stringify(v) : String(v));
const prepare = ([query, params = []]) => ({ query, params: params.map(param) });

function rowsOf(result) {
  const names = result.fields.map(f => f.name);
  const parse = result.fields.map(f => PARSERS[f.dataTypeID] || (v => v));
  return result.rows.map(r => Object.fromEntries(r.map((v, i) => [names[i], v === null ? null : parse[i](v)])));
}

export function neonHttp(connectionString, fetchFn = (...a) => fetch(...a)) {
  const host = new URL(connectionString).hostname;
  const endpoint = `https://${host.replace(/^[^.]+\./, 'api.')}/sql`;
  async function send(body) {
    let res;
    try {
      res = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Neon-Connection-String': connectionString,
          'Neon-Raw-Text-Output': 'true',
          'Neon-Array-Mode': 'true',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error(`Error connecting to database: ${error?.message || error}`);
    }
    if (res.ok) return res.json();
    const detail = res.status === 400 ? (await res.json().catch(() => ({}))).message : await res.text().catch(() => '');
    throw new Error(`Database error (HTTP ${res.status}): ${detail || 'no details'}`);
  }
  return {
    /** One statement → rows as objects. */
    query: async (text, params = []) => rowsOf(await send(prepare([text, params]))),
    /** Several statements in one transaction (one HTTP request) → array of row lists. */
    batch: async list => (await send({ queries: list.map(prepare) })).results.map(rowsOf),
  };
}
