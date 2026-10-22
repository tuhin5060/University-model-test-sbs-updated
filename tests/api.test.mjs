// API tests against an in-memory Postgres (PGlite) — no Neon account needed.
// The routes are called through both entry points (Vercel api/ and Cloudflare functions/).
import test from 'node:test';
import assert from 'node:assert/strict';
import { useDatabase } from '../server/db.js';
import { createLocalDb } from '../server/local-db.js';
import * as vercelProfile from '../api/profile.js';
import * as vercelScores from '../api/scores.js';
import { onRequest as cfVisitors } from '../functions/api/visitors.js';
import { onRequest as cfProgress } from '../functions/api/progress.js';
import { QUESTIONS } from '../data/questions/index.js';

const db = await createLocalDb();
useDatabase(db);
test.after(() => db.close());

const vercel = mod => request => mod[request.method]?.(request) ?? new Response(null, { status: 405 });
const cloudflare = onRequest => request => onRequest({ request, env: {} });
const profile = vercel(vercelProfile);
const scores = vercel(vercelScores);
const visitors = cloudflare(cfVisitors);
const progress = cloudflare(cfProgress);

async function call(handler, { method = 'GET', query = {}, body, cookie } = {}) {
  const qs = new URLSearchParams(query).toString();
  const request = new Request(`https://site.test/api/x${qs ? `?${qs}` : ''}`, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie: cookie.includes('=') ? cookie : `campus_player=${cookie}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await handler(request);
  return { statusCode: res.status, headers: Object.fromEntries(res.headers), body: await res.json().catch(() => null) };
}
const join = async body => (await call(profile, { method: 'POST', body })).body;

const tense = QUESTIONS.filter(q => q.topicId === 'tense').slice(0, 5);
const sheet = (pick = q => q.a) => tense.map(q => ({ id: q.id, choice: pick(q), sec: 3 }));

let alice;
test('profile: create with the first roll, cookie, validation', async () => {
  const r = await call(profile, { method: 'POST', body: { name: '  Alice   Rahman ', avatar: '🦊' } });
  assert.equal(r.statusCode, 201);
  alice = r.body.player.playerId;
  assert.equal(r.body.player.name, 'Alice Rahman');
  assert.equal(r.body.player.roll, 1);
  assert.equal(r.body.player.tag, 'Alice Rahman.001');
  assert.match(r.headers['set-cookie'], /campus_player=.*HttpOnly/);
  assert.equal((await call(profile, { method: 'POST', body: { name: 'A' } })).statusCode, 400);
  assert.equal((await call(profile, { method: 'POST', body: { name: 'Roll Bad', roll: 'abc' } })).statusCode, 400);
  const mallory = await join({ name: 'Mallory', avatar: '<b>' });
  assert.equal(mallory.player.avatar, '🚂');
  assert.equal(mallory.player.roll, 2, 'rolls are given in order');
});

test('profile: rolls are unique; a taken roll gets a suggestion', async () => {
  const taken = await call(profile, { method: 'POST', body: { name: 'Someone Else', roll: '001' } });
  assert.equal(taken.statusCode, 409);
  assert.equal(taken.body.code, 'roll_taken');
  assert.equal(taken.body.suggest, 3);
  const chosen = await join({ name: 'Rafi Hasan', roll: '050' });
  assert.equal(chosen.player.roll, 50, 'a free roll can be chosen');
  const next = await join({ name: 'Next Student' });
  assert.equal(next.player.roll, 3, 'automatic rolls take the lowest free number, so chosen rolls (050) stay apart');
  const rolls = (await db.query('SELECT roll FROM students')).map(r => r.roll);
  assert.equal(new Set(rolls).size, rolls.length);
});

test('profile: same name + roll on another device logs in to the same student', async () => {
  const r = await call(profile, { method: 'POST', body: { name: 'alice rahman', roll: '1', avatar: '🦊' } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.player.playerId, alice);
  assert.equal(r.body.restored, true);
  const again = await call(profile, { query: { playerId: alice } });
  assert.equal(again.body.player.tag, 'alice rahman.001');
  await call(profile, { method: 'POST', body: { name: 'Alice Rahman', roll: 1, avatar: '🦊' }, cookie: alice }); // rename back
});

test('profile: "আগে খেলেছি" sign-in never creates a student and explains what is wrong', async () => {
  const before = (await db.query('SELECT count(*)::int AS n FROM students'))[0].n;
  const ok = await call(profile, { method: 'POST', body: { login: true, name: '  ALICE   rahman ', roll: '001' } });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.player.playerId, alice);
  assert.equal(ok.body.player.name, 'Alice Rahman', 'sign-in keeps the stored spelling');
  const wrongName = await call(profile, { method: 'POST', body: { login: true, name: 'Alice', roll: '1' } });
  assert.equal(wrongName.statusCode, 409);
  assert.equal(wrongName.body.code, 'name_mismatch');
  assert.equal(wrongName.body.hint, 'A•••• R••••');
  const noRoll = await call(profile, { method: 'POST', body: { login: true, name: 'Alice Rahman', roll: '9999' } });
  assert.equal(noRoll.statusCode, 404);
  assert.equal(noRoll.body.code, 'roll_not_found');
  assert.equal((await call(profile, { method: 'POST', body: { login: true, name: 'Alice Rahman' } })).statusCode, 400);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM students'))[0].n, before, 'no new student');
});

test('profile: college is saved on registration, added on sign-in when missing, shown on the leaderboard', async () => {
  const r = await call(profile, { method: 'POST', body: { name: 'Mim Akter', college: '  Chittagong   College ' } });
  assert.equal(r.statusCode, 201);
  assert.equal(r.body.player.college, 'Chittagong College');
  const id = r.body.player.playerId;
  const roll = String(r.body.player.roll);
  const keep = await call(profile, { method: 'POST', body: { login: true, name: 'Mim Akter', roll, college: 'Other College' } });
  assert.equal(keep.body.player.college, 'Chittagong College', 'sign-in does not overwrite an existing college');
  await db.query('UPDATE students SET college = NULL WHERE id = $1', [id]);
  const add = await call(profile, { method: 'POST', body: { login: true, name: 'Mim Akter', roll, college: 'Notre Dame College' } });
  assert.equal(add.body.player.college, 'Notre Dame College', 'sign-in adds a missing college');
  const qs = QUESTIONS.filter(q => q.topicId === 'article').slice(0, 3);
  await call(scores, { method: 'POST', cookie: id, body: { playerId: id, attemptId: 'col-1', mode: 'fun', topic: 'article', answers: qs.map(q => ({ id: q.id, choice: q.a, sec: 2 })) } });
  const board = await call(scores, { query: { mode: 'fun', topic: 'article' } });
  assert.equal(board.body.rows.find(x => x.name === 'Mim Akter').college, 'Notre Dame College');
});

test('profile: cookie wins over a different id in the body; no roll + other name = new student', async () => {
  const bob = (await join({ name: 'Bob Ali' })).player;
  const r = await call(profile, { method: 'POST', body: { playerId: bob.playerId, name: 'Alice Rahman' }, cookie: alice });
  assert.equal(r.body.player.playerId, alice);
  const other = await call(profile, { method: 'POST', body: { name: 'Hacker' }, cookie: alice });
  assert.notEqual(other.body.player.playerId, alice, 'a different name without the roll does not rename Alice');
  const check = await call(profile, { query: { playerId: bob.playerId }, cookie: bob.playerId });
  assert.equal(check.body.player.name, 'Bob Ali');
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
  assert.deepEqual(r.body.rank, { rank: 1, players: 1 });
  assert.equal(r.body.newTop, false, 'the first score on a board is not announced');
  const again = await call(scores, { method: 'POST', cookie: alice, body: { playerId: alice, attemptId: 'a1', mode: 'fun', topic: 'tense', answers: sheet() } });
  assert.equal(again.statusCode, 200);
  assert.equal(again.body.duplicate, true);
});

test('scores: rejects foreign cookie, unknown questions, wrong topic, bad choices', async () => {
  const bob = (await join({ name: 'Bobby' })).player.playerId;
  const base = { playerId: alice, mode: 'exam', topic: 'tense', answers: sheet() };
  assert.equal((await call(scores, { method: 'POST', cookie: bob, body: { ...base, attemptId: 'x1' } })).statusCode, 403);
  assert.equal((await call(scores, { method: 'POST', cookie: alice, body: { ...base, attemptId: 'x2', answers: [{ id: 'nope', choice: 0 }] } })).statusCode, 400);
  const article = QUESTIONS.find(q => q.topicId === 'article');
  assert.equal((await call(scores, { method: 'POST', cookie: alice, body: { ...base, attemptId: 'x3', answers: [{ id: article.id, choice: 0 }] } })).statusCode, 400);
  assert.equal((await call(scores, { method: 'POST', cookie: alice, body: { ...base, attemptId: 'x4', answers: [{ id: tense[0].id, choice: 9 }] } })).statusCode, 400);
  assert.equal((await call(scores, { method: 'POST', cookie: alice, body: { ...base, attemptId: 'x5', mode: 'practice' } })).statusCode, 400);
  assert.equal((await call(scores, { method: 'POST', body: { ...base, playerId: '11111111-1111-4111-8111-111111111111', attemptId: 'x6' } })).statusCode, 401);
});

test('scores: group topics (Grammar / Memorising) are accepted', async () => {
  const groupQs = QUESTIONS.filter(q => q.group === 'grammar').slice(0, 3);
  const r = await call(scores, { method: 'POST', cookie: alice, body: { playerId: alice, attemptId: 'g1', mode: 'fun', topic: 'grammar', answers: groupQs.map(q => ({ id: q.id, choice: q.a, sec: 2 })) } });
  assert.equal(r.statusCode, 201);
  const memo = QUESTIONS.find(q => q.group === 'memorising');
  if (memo) {
    const bad = await call(scores, { method: 'POST', cookie: alice, body: { playerId: alice, attemptId: 'g2', mode: 'fun', topic: 'grammar', answers: [{ id: memo.id, choice: 0 }] } });
    assert.equal(bad.statusCode, 400, 'a Memorising question is not part of the Grammar group');
  }
});

test('leaderboard: best score per student with roll tag, no personal data', async () => {
  await call(scores, { method: 'POST', cookie: alice, body: { playerId: alice, attemptId: 'e1', mode: 'exam', topic: 'tense', settings: { negative: 0 }, answers: sheet() } });
  await call(scores, { method: 'POST', cookie: alice, body: { playerId: alice, attemptId: 'e2', mode: 'exam', topic: 'tense', answers: sheet(q => (q.a + 1) % 4) } });
  const r = await call(scores, { query: { mode: 'exam', topic: 'all' }, cookie: alice });
  assert.equal(r.statusCode, 200);
  const mine = r.body.rows.filter(x => x.name === 'Alice Rahman');
  assert.equal(mine.length, 1, 'one row per student');
  assert.equal(mine[0].score, 100);
  assert.equal(mine[0].attempts, 2);
  assert.equal(mine[0].me, false, 'the board is the same for everyone (cacheable); the browser marks its own row by tag');
  assert.equal(mine[0].tag, 'Alice Rahman.001');
  assert.ok(r.body.rows.every(x => !('playerId' in x) && !('player_id' in x)));
  const fun = await call(scores, { query: { mode: 'fun', topic: 'tense' } });
  assert.equal(fun.body.rows.length, 1);
});

test('scores: my stats show tests, marks and rank', async () => {
  const r = await call(scores, { query: { me: '1' }, cookie: alice });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.stats.exam.tests, 2);
  assert.equal(r.body.stats.exam.best, 100);
  assert.equal(r.body.stats.exam.rank, 1);
  assert.equal(r.body.stats.fun.tests, 2);
  assert.ok(r.body.recent.length >= 4);
  const examTense = r.body.topics.find(t => t.mode === 'exam' && t.topic === 'tense');
  assert.deepEqual([examTense.tests, examTense.best, examTense.rank], [2, 100, 1], 'rank on the exam/tense board');
  assert.ok(r.body.topics.some(t => t.mode === 'fun' && t.topic === 'grammar'), 'group boards are listed too');
  const anon = await call(scores, { query: { me: '1' } });
  assert.equal(anon.body.stats, null);
});

test('new highest score creates one popup event for everyone', async () => {
  const rafi = (await call(profile, { method: 'POST', body: { name: 'Rafi Hasan', roll: '050' } })).body.player.playerId;
  const low = await call(scores, { method: 'POST', cookie: rafi, body: { playerId: rafi, attemptId: 't1', mode: 'fun', topic: 'tense', answers: sheet(q => (q.a + 1) % 4) } });
  assert.equal(low.body.newTop, false);
  const first = await call(visitors, { method: 'POST', body: { sid: 'c'.repeat(24) } });
  assert.deepEqual(first.body.events, [], 'no old events on the first heartbeat');
  const top = await call(scores, { method: 'POST', cookie: rafi, body: { playerId: rafi, attemptId: 't2', mode: 'fun', topic: 'tense', answers: sheet() } });
  assert.equal(top.body.newTop, true);
  assert.equal(top.body.rank.rank, 1);
  const beat = await call(visitors, { method: 'POST', body: { sid: 'c'.repeat(24), since: first.body.lastEvent }, cookie: alice });
  assert.equal(beat.body.events.length, 1);
  const e = beat.body.events[0];
  assert.equal(e.tag, 'Rafi Hasan.050');
  assert.equal(e.mode, 'fun');
  assert.equal(e.topic, 'tense');
  assert.equal(e.mine, false);
  assert.equal(e.playerId, undefined, 'player ids are not broadcast');
  const own = await call(visitors, { method: 'POST', body: { sid: 'c'.repeat(24), since: first.body.lastEvent }, cookie: rafi });
  assert.equal(own.body.events[0].mine, true);
});

test('scores: rate limit', async () => {
  const p = (await join({ name: 'Speedy' })).player.playerId;
  let last;
  for (let i = 0; i < 21; i++) {
    last = await call(scores, { method: 'POST', cookie: p, body: { playerId: p, attemptId: `r${i}`, mode: 'fun', topic: 'tense', answers: sheet() } });
  }
  assert.equal(last.statusCode, 429);
});

test('visitors: counts distinct live browsers, leave removes, bad ids rejected', async () => {
  const { ONLINE_SEC } = await import('../server/routes/visitors.js');
  await db.query('DELETE FROM presence');
  const a = 'a'.repeat(24), b = 'b'.repeat(24);
  assert.equal((await call(visitors, { method: 'POST', body: { sid: a } })).body.online, 1);
  assert.equal((await call(visitors, { method: 'POST', body: { sid: a } })).body.online, 1, 'same browser counted once');
  assert.equal((await call(visitors, { method: 'POST', body: { sid: b } })).body.online, 2);
  await db.query(`UPDATE presence SET at = now() - interval '${ONLINE_SEC + 5} seconds' WHERE sid = $1`, [b]);
  assert.equal((await call(visitors, { method: 'POST', body: { sid: a } })).body.online, 1, 'stale heartbeat not counted');
  await call(visitors, { method: 'POST', body: { sid: a, leave: true } });
  assert.equal((await db.query('SELECT count(*)::int AS n FROM presence WHERE sid = $1', [a]))[0].n, 0);
  assert.equal((await call(visitors, { method: 'POST', body: { sid: '<x>' } })).statusCode, 400);
  assert.equal((await call(visitors, { method: 'GET' })).statusCode, 405);
});

test('progress: anonymous snapshot moves to the student and comes back on another device', async () => {
  const first = await call(progress, { method: 'POST', body: { progress: { v: 2, history: [{ id: 'h1' }] } } });
  assert.equal(first.statusCode, 200);
  const anon = /campus_progress=([^;]+)/.exec(first.headers['set-cookie'])[1];
  const moved = await call(progress, { cookie: `campus_progress=${anon}; campus_player=${alice}` });
  assert.deepEqual(moved.body.progress.history, [{ id: 'h1' }]);
  // New phone: log in with name + roll, then read progress with the returned cookie.
  const login = await call(profile, { method: 'POST', body: { name: 'Alice Rahman', roll: '001' } });
  const cookie = /campus_player=([^;]+)/.exec(login.headers['set-cookie'])[1];
  const back = await call(progress, { cookie });
  assert.deepEqual(back.body.progress.history, [{ id: 'h1' }]);
  assert.equal((await call(progress, { method: 'POST', body: { progress: { v: 1 } } })).statusCode, 400);
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

test('no database configured → 503 with a clear message', async () => {
  useDatabase(null);
  const res = await cfVisitors({ request: new Request('https://site.test/api/visitors', { method: 'POST', body: JSON.stringify({ sid: 'd'.repeat(24) }) }), env: {} });
  assert.equal(res.status, 503);
  useDatabase(db);
});
