// Push notification tests: VAPID signature, daily job, subscribe / message / test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createPublicKey, verify } from 'node:crypto';
import { useDatabase } from '../server/db.js';
import { createLocalDb } from '../server/local-db.js';
import { onRequest as cfPush } from '../functions/api/push.js';
import * as vercelProfile from '../api/profile.js';
import * as vercelScores from '../api/scores.js';
import { cron as cronEntry } from '../server/routes/push.js';
import { runDaily, vapidHeader, validEndpoint } from '../server/routes/push.js';
import { QUESTIONS } from '../data/questions/index.js';

const db = await createLocalDb();
useDatabase(db);
test.after(() => db.close());

const pair = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const jwk = await webcrypto.subtle.exportKey('jwk', pair.privateKey);
const env = { VAPID_PRIVATE_JWK: JSON.stringify({ kty: jwk.kty, crv: jwk.crv, d: jwk.d, x: jwk.x, y: jwk.y }), CRON_SECRET: 'cron-secret' };
const keys = { jwk: JSON.parse(env.VAPID_PRIVATE_JWK), publicKey: '' };

const EP = n => `https://fcm.googleapis.com/fcm/send/device-${n}`;
async function call({ method = 'GET', query = {}, body, cookie, e = env } = {}) {
  const qs = new URLSearchParams(query).toString();
  const request = new Request(`https://site.test/api/push${qs ? `?${qs}` : ''}`, {
    method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie: `campus_player=${cookie}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await cfPush({ request, env: e });
  return { status: res.status, body: await res.json() };
}

test('only real push services are accepted as endpoints', () => {
  assert.ok(validEndpoint(EP(1)));
  assert.ok(validEndpoint('https://web.push.apple.com/abc'));
  assert.equal(validEndpoint('https://evil.example.com/x'), '');
  assert.equal(validEndpoint('http://fcm.googleapis.com/x'), '');
  assert.equal(validEndpoint('not a url'), '');
});

test('VAPID header is a valid ES256 JWT for the push service origin', async () => {
  const header = await vapidHeader(EP(1), keys, Date.UTC(2026, 0, 1));
  const [, jwt] = header.match(/^vapid t=([^,]+), k=/);
  const [h, p, s] = jwt.split('.');
  const claims = JSON.parse(Buffer.from(p, 'base64url'));
  assert.equal(claims.aud, 'https://fcm.googleapis.com');
  assert.match(claims.sub, /^https:\/\//);
  const pub = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y }, format: 'jwk' });
  assert.ok(verify('sha256', Buffer.from(`${h}.${p}`), { key: pub, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url')));
});

test('config, subscribe, message with a one-time pending text', async () => {
  const off = await call({ e: {} });
  assert.equal(off.body.enabled, false);
  const on = await call();
  assert.equal(on.body.enabled, true);
  assert.equal(Buffer.from(on.body.publicKey, 'base64url').length, 65, 'uncompressed P-256 point');

  assert.equal((await call({ method: 'POST', body: { action: 'subscribe', subscription: { endpoint: 'https://evil.example.com/x' } } })).status, 400);
  assert.equal((await call({ method: 'POST', body: { action: 'subscribe', subscription: { endpoint: EP(1) } } })).status, 200);
  assert.equal((await call({ method: 'POST', body: { action: 'subscribe', subscription: { endpoint: EP(1) } } })).status, 200, 'idempotent');

  await db.query('UPDATE push_subs SET pending = $2::jsonb WHERE endpoint = $1', [EP(1), { title: 'Hi', body: 'x', url: '/' }]);
  assert.equal((await call({ query: { message: '1', endpoint: EP(1) } })).body.message.title, 'Hi');
  assert.notEqual((await call({ query: { message: '1', endpoint: EP(1) } })).body.message.title, 'Hi', 'pending text is shown once');
});

test('test push: sends one signed push, refuses a second within 30 s', async () => {
  const sent = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, opts) => { sent.push({ url, opts }); return new Response(null, { status: 201 }); };
  try {
    assert.equal((await call({ method: 'POST', body: { action: 'test', endpoint: EP(1) } })).status, 200);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].url, EP(1));
    assert.match(sent[0].opts.headers.Authorization, /^vapid t=.+, k=.+/);
    assert.equal((await call({ method: 'POST', body: { action: 'test', endpoint: EP(1) } })).status, 429);
  } finally {
    globalThis.fetch = real;
  }
  assert.equal((await call({ query: { message: '1', endpoint: EP(1) } })).body.message.title, '✅ Notification চালু আছে');
});

test('daily job: skips students who practised today, removes expired subscriptions, announces new topics', async () => {
  const join = async name => (await vercelProfile.POST(new Request('https://site.test/api/profile', { method: 'POST', body: JSON.stringify({ name }) })).then(r => r.json())).player.playerId;
  const busy = await join('Busy Student');
  const lazy = await join('Lazy Student');
  const qs = QUESTIONS.filter(q => q.topicId === 'tense').slice(0, 3);
  const res = await vercelScores.POST(new Request('https://site.test/api/scores', {
    method: 'POST', headers: { cookie: `campus_player=${busy}` },
    body: JSON.stringify({ playerId: busy, attemptId: 'push-1', mode: 'fun', topic: 'tense', answers: qs.map(q => ({ id: q.id, choice: q.a, sec: 2 })) }),
  }));
  assert.equal(res.status, 201);
  await db.query('DELETE FROM push_subs');
  for (const [n, player] of [[2, busy], [3, lazy], [4, null]]) {
    await db.query('INSERT INTO push_subs (endpoint, player_id) VALUES ($1, $2)', [EP(n), player]);
  }

  const hits = [];
  const fetchFn = async url => { hits.push(url); return new Response(null, { status: url === EP(4) ? 410 : 201 }); };
  const topics = [{ id: 'tense', title: 'Tense', count: 50 }];
  const first = await runDaily(db, env, { fetchFn, topics });
  assert.deepEqual(hits.sort(), [EP(3), EP(4)], 'the student who practised today is skipped');
  assert.deepEqual([first.sent, first.gone, first.skipped], [1, 1, 1]);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM push_subs WHERE endpoint = $1', [EP(4)]))[0].n, 0, 'expired subscription removed');
  assert.notEqual(first.message.title, '🆕 নতুন topic যোগ হয়েছে', 'first run only remembers the topics');

  hits.length = 0;
  const second = await runDaily(db, env, { fetchFn, topics: [...topics, { id: 'idioms', title: 'Idioms', count: 40 }] });
  assert.equal(second.message.title, '🆕 নতুন topic যোগ হয়েছে');
  assert.match(second.message.body, /Idioms/);
  assert.equal(second.message.url, '/#start/fun/idioms');
  assert.deepEqual(hits.sort(), [EP(2), EP(3)], 'news goes to everyone');
  assert.equal((await call({ query: { message: '1' } })).body.message.title, '🆕 নতুন topic যোগ হয়েছে');
});

test('cron entry needs the secret', async () => {
  const req = auth => new Request('https://site.test/api/push-cron', { headers: auth ? { authorization: auth } : {} });
  assert.equal((await cronEntry(req(), env)).status, 401);
  assert.equal((await cronEntry(req('Bearer wrong'), env)).status, 401);
  assert.equal((await cronEntry(req('Bearer x'), {})).status, 401, 'no secret configured → refused');
});
