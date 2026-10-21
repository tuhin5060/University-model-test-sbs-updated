// The built-in Neon HTTPS client: request shape and result parsing (fake fetch, no network).
import test from 'node:test';
import assert from 'node:assert/strict';
import { neonHttp } from '../server/neon-http.js';

const URL_ = 'postgresql://user:pw@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

function fakeFetch(reply) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const { status = 200, json } = typeof reply === 'function' ? reply(calls.at(-1)) : reply;
    return new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json' } });
  };
  fn.calls = calls;
  return fn;
}

const result = (fields, rows) => ({ fields: fields.map(([name, dataTypeID]) => ({ name, dataTypeID })), rows });

test('neon-http: posts one query to the regional api host with the connection string header', async () => {
  const fetchFn = fakeFetch({ json: result([['n', 23]], [['7']]) });
  const db = neonHttp(URL_, fetchFn);
  assert.deepEqual(await db.query('SELECT $1::int AS n, $2 AS j, $3 AS z', [7, { a: 1 }, null]), [{ n: 7 }]);
  const { url, init, body } = fetchFn.calls[0];
  assert.equal(url, 'https://api.us-east-2.aws.neon.tech/sql');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['Neon-Connection-String'], URL_);
  assert.equal(init.headers['Neon-Raw-Text-Output'], 'true');
  assert.equal(init.headers['Neon-Array-Mode'], 'true');
  assert.deepEqual(body, { query: 'SELECT $1::int AS n, $2 AS j, $3 AS z', params: ['7', '{"a":1}', null] });
});

test('neon-http: parses Postgres text values by type', async () => {
  const fetchFn = fakeFetch({ json: result(
    [['i', 23], ['r', 700], ['f', 701], ['b', 16], ['j', 3802], ['t', 1184], ['big', 20], ['u', 2950], ['s', 25], ['nul', 25]],
    [['42', '12.5', '0.25', 't', '{"tag":"Arman.001"}', '2026-10-21 19:51:37.123456+00', '9007199254740993', '11111111-1111-4111-8111-111111111111', 'নাম', null]],
  ) });
  const [row] = await neonHttp(URL_, fetchFn).query('SELECT 1');
  assert.equal(row.i, 42);
  assert.equal(row.r, 12.5);
  assert.equal(row.f, 0.25);
  assert.equal(row.b, true);
  assert.deepEqual(row.j, { tag: 'Arman.001' });
  assert.equal(row.t.toISOString(), '2026-10-21T19:51:37.123Z');
  assert.equal(row.big, '9007199254740993', 'int8 stays a string');
  assert.equal(row.s, 'নাম');
  assert.equal(row.nul, null);
});

test('neon-http: batch sends one request and returns rows per statement', async () => {
  const fetchFn = fakeFetch({ json: { results: [result([], []), result([['n', 23]], [['1'], ['2']])] } });
  const out = await neonHttp(URL_, fetchFn).batch([['CREATE TABLE IF NOT EXISTS x (n int)'], ['SELECT n FROM x WHERE n > $1', [0]]]);
  assert.deepEqual(out, [[], [{ n: 1 }, { n: 2 }]]);
  assert.equal(fetchFn.calls.length, 1);
  assert.deepEqual(fetchFn.calls[0].body, { queries: [{ query: 'CREATE TABLE IF NOT EXISTS x (n int)', params: [] }, { query: 'SELECT n FROM x WHERE n > $1', params: ['0'] }] });
});

test('neon-http: database errors are thrown with the server message', async () => {
  const db = neonHttp(URL_, fakeFetch({ status: 400, json: { message: 'duplicate key value violates unique constraint "students_roll_key"' } }));
  await assert.rejects(db.query('INSERT …'), /students_roll_key/);
  const down = neonHttp(URL_, async () => { throw new Error('offline'); });
  await assert.rejects(down.query('SELECT 1'), /Error connecting to database: offline/);
});
