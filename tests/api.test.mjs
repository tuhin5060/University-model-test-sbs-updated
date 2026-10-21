// API handler tests against the in-memory database (no MongoDB needed).
import test from 'node:test';
import assert from 'node:assert/strict';
import { useDatabase } from '../lib/mongodb.js';
import { createMemoryDb } from '../lib/memory-db.js';
import profile from '../api/profile.js';
import scores from '../api/scores.js';
import { QUESTIONS } from '../data/questions/index.js';

const db = createMemoryDb();
useDatabase(db);

async function call(handler, { method = 'GET', query = {}, body, cookie } = {}) {
  const res = { statusCode: 0, headers: {}, body: null };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.status = code => { res.statusCode = code; return res; };
  res.json = obj => { res.body = obj; return res; };
  await handler({ method, query, body, headers: cookie ? { cookie: `campus_player=${cookie}` } : {} }, res);
  return res;
}

const tense = QUESTIONS.filter(q => q.topicId === 'tense').slice(0, 5);
const sheet = (pick = q => q.a) => tense.map(q => ({ id: q.id, choice: pick(q), sec: 3 }));

let alice;
test('profile: create, cookie, rename', async () => {
  const r = await call(profile, { method: 'POST', body: { name: '  Alice   Rahman ', avatar: '🦊' } });
  assert.equal(r.statusCode, 201);
  alice = r.body.player.playerId;
  assert.equal(r.body.player.name, 'Alice Rahman');
  assert.match(r.headers['set-cookie'], /campus_player=.*HttpOnly/);
  const bad = await call(profile, { method: 'POST', body: { name: 'A' } });
  assert.equal(bad.statusCode, 400);
  const avatar = await call(profile, { method: 'POST', body: { name: 'Mallory', avatar: '<b>' } });
  assert.equal(avatar.body.player.avatar, '🚂');
});

test('profile: cookie wins over a different id in the body', async () => {
  const other = (await call(profile, { method: 'POST', body: { name: 'Bob Ali' } })).body.player.playerId;
  const r = await call(profile, { method: 'POST', body: { playerId: other, name: 'Hacker' }, cookie: alice });
  assert.equal(r.body.player.playerId, alice);
  const bob = await call(profile, { query: { playerId: other }, cookie: other });
  assert.equal(bob.body.player.name, 'Bob Ali', 'Bob was not renamed');
  await call(profile, { method: 'POST', body: { name: 'Alice Rahman', avatar: '🦊' }, cookie: alice });
});

test('scores: server recomputes the score and ignores client values', async () => {
  const r = await call(scores, { method: 'POST', cookie: alice, body: {
    playerId: alice, attemptId: 'a1', mode: 'fun', topic: 'tense', settings: { perQuestion: 30 }, timeSec: 20,
    score: 999999, correct: 5, answers: sheet(q => (q === tense[0] ? (q.a + 1) % 4 : q.a)),
  } });
  assert.equal(r.statusCode, 201);
  assert.equal(r.body.entry.correct, 4);
  assert.ok(r.body.entry.score < 200);
  assert.equal(r.body.entry.playerId, undefined, 'player ids are not exposed');
  const again = await call(scores, { method: 'POST', cookie: alice, body: { playerId: alice, attemptId: 'a1', mode: 'fun', topic: 'tense', answers: sheet() } });
  assert.equal(again.statusCode, 200);
  assert.equal(again.body.duplicate, true);
});

test('scores: rejects foreign cookie, unknown questions, wrong topic, bad choices', async () => {
  const bob = (await call(profile, { method: 'POST', body: { name: 'Bobby' } })).body.player.playerId;
  const base = { playerId: alice, mode: 'exam', topic: 'tense', answers: sheet() };
  assert.equal((await call(scores, { method: 'POST', cookie: bob, body: { ...base, attemptId: 'x1' } })).statusCode, 403);
  assert.equal((await call(scores, { method: 'POST', cookie: alice, body: { ...base, attemptId: 'x2', answers: [{ id: 'nope', choice: 0 }] } })).statusCode, 400);
  const article = QUESTIONS.find(q => q.topicId === 'article');
  assert.equal((await call(scores, { method: 'POST', cookie: alice, body: { ...base, attemptId: 'x3', answers: [{ id: article.id, choice: 0 }] } })).statusCode, 400);
  assert.equal((await call(scores, { method: 'POST', cookie: alice, body: { ...base, attemptId: 'x4', answers: [{ id: tense[0].id, choice: 9 }] } })).statusCode, 400);
  assert.equal((await call(scores, { method: 'POST', cookie: alice, body: { ...base, attemptId: 'x5', mode: 'practice' } })).statusCode, 400);
  assert.equal((await call(scores, { method: 'POST', body: { ...base, playerId: '11111111-1111-4111-8111-111111111111', attemptId: 'x6' } })).statusCode, 401);
});

test('leaderboard: best score per student, legacy "test" rows count as exam, "me" flag', async () => {
  await call(scores, { method: 'POST', cookie: alice, body: { playerId: alice, attemptId: 'e1', mode: 'exam', topic: 'tense', settings: { negative: 0 }, answers: sheet() } });
  await call(scores, { method: 'POST', cookie: alice, body: { playerId: alice, attemptId: 'e2', mode: 'exam', topic: 'tense', answers: sheet(q => (q.a + 1) % 4) } });
  await db.collection('scoreAttempts').insertOne({ attemptId: 'old', playerId: '22222222-2222-4222-8222-222222222222', name: 'Old Timer', mode: 'test', topic: 'Tense', score: 70, correct: 7, total: 10, timeSec: 50, at: '2026-01-01T00:00:00Z' });
  const r = await call(scores, { query: { mode: 'exam', topic: 'all' }, cookie: alice });
  assert.equal(r.statusCode, 200);
  const mine = r.body.rows.filter(x => x.name === 'Alice Rahman');
  assert.equal(mine.length, 1, 'one row per student');
  assert.equal(mine[0].score, 100);
  assert.equal(mine[0].attempts, 2);
  assert.equal(mine[0].me, true);
  assert.ok(r.body.rows.some(x => x.name === 'Old Timer' && x.me === false));
  assert.ok(r.body.rows.every(x => !('playerId' in x)));
  const byTopic = await call(scores, { query: { mode: 'exam', topic: 'tense' } });
  assert.ok(byTopic.body.rows.some(x => x.name === 'Old Timer'), 'v1 rows saved under the topic title are included');
  const fun = await call(scores, { query: { mode: 'fun', topic: 'tense' } });
  assert.equal(fun.body.rows.length, 1);
});

test('scores: rate limit', async () => {
  const p = (await call(profile, { method: 'POST', body: { name: 'Speedy' } })).body.player.playerId;
  let last;
  for (let i = 0; i < 21; i++) {
    last = await call(scores, { method: 'POST', cookie: p, body: { playerId: p, attemptId: `r${i}`, mode: 'fun', topic: 'tense', answers: sheet() } });
  }
  assert.equal(last.statusCode, 429);
});

test('visitors: counts distinct live browsers, leave removes, bad ids rejected', async () => {
  const { default: visitors, ONLINE_MS } = await import('../api/visitors.js');
  const a = 'a'.repeat(24), b = 'b'.repeat(24);
  assert.equal((await call(visitors, { method: 'POST', body: { sid: a } })).body.online, 1);
  assert.equal((await call(visitors, { method: 'POST', body: { sid: a } })).body.online, 1, 'same browser counted once');
  assert.equal((await call(visitors, { method: 'POST', body: { sid: b } })).body.online, 2);
  db.collection('presence').docs.find(d => d._id === b).at = new Date(Date.now() - ONLINE_MS - 1000);
  assert.equal((await call(visitors, { method: 'POST', body: { sid: a } })).body.online, 1, 'stale heartbeat not counted');
  assert.equal((await call(visitors, { method: 'POST', body: { sid: a, leave: true } })).body.online, 0);
  assert.equal((await call(visitors, { method: 'POST', body: { sid: '<x>' } })).statusCode, 400);
  assert.equal((await call(visitors, { method: 'GET' })).statusCode, 405);
});

test('scores: Model Test always deducts 0.25 per wrong answer', async () => {
  const r = await call(scores, { method: 'POST', cookie: alice, body: {
    playerId: alice, attemptId: 'neg1', mode: 'exam', topic: 'tense', settings: { negative: 0, pace: 'relaxed' }, timeSec: 60,
    answers: sheet(q => (q === tense[0] ? (q.a + 1) % 4 : q.a)),
  } });
  assert.equal(r.statusCode, 201);
  assert.equal(r.body.entry.correct, 4);
  assert.equal(r.body.entry.score, 75, '(4 − 0.25) / 5 = 75%');
});
