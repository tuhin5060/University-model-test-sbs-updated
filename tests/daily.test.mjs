// Daily Quiz: the question picker (no repeats, CU/DU focus) and the API (one ranked try a day).
import test from 'node:test';
import assert from 'node:assert/strict';
import { useDatabase } from '../server/db.js';
import { createLocalDb } from '../server/local-db.js';
import * as vercelProfile from '../api/profile.js';
import * as vercelDaily from '../api/daily.js';
import { onRequest as cfDaily } from '../functions/api/daily.js';
import { QUESTIONS, QUESTION_MAP } from '../data/questions/index.js';
import { pickDaily, dailyPools, isFocus, dhakaDay, shiftDay, DAILY_SIZE, DAILY_FOCUS } from '../assets/js/shared/daily.js';
import { examRef } from '../assets/js/shared/source.js';

test('picker: 20 different past-year questions, half CU/DU, same for everyone that day', () => {
  const { ids } = pickDaily('2026-10-29', QUESTIONS);
  assert.equal(ids.length, DAILY_SIZE);
  assert.equal(new Set(ids).size, DAILY_SIZE);
  const qs = ids.map(id => QUESTION_MAP.get(id));
  assert.ok(qs.every(q => examRef(q.source)), 'every question has a real exam reference');
  assert.equal(qs.filter(isFocus).length, DAILY_FOCUS);
  assert.deepEqual(pickDaily('2026-10-29', QUESTIONS).ids, ids, 'deterministic');
  assert.notDeepEqual(pickDaily('2026-10-30', QUESTIONS).ids, ids);
});

test('picker: no question repeats until its rotation is used up', () => {
  const pools = dailyPools(QUESTIONS);
  const focusDays = Math.floor(pools.focus.length / DAILY_FOCUS);
  const otherDays = Math.floor(pools.other.length / (DAILY_SIZE - DAILY_FOCUS));
  let state = {};
  let day = '2026-10-29';
  const seen = new Map();
  for (let i = 0; i < Math.max(focusDays, otherDays) + 5; i++) {
    const pick = pickDaily(day, QUESTIONS, state);
    assert.equal(new Set(pick.ids).size, DAILY_SIZE, `day ${i}: no duplicates inside one day`);
    for (const id of pick.ids) {
      const first = seen.get(id);
      const q = QUESTION_MAP.get(id);
      const fresh = isFocus(q) ? focusDays : otherDays;
      if (first !== undefined) assert.ok(i >= fresh, `${id} repeated on day ${i} (first on day ${first}) before its rotation ended`);
      else seen.set(id, i);
    }
    state = JSON.parse(JSON.stringify(pick.state)); // what the server stores in daily_sets.meta
    day = shiftDay(day, 1);
  }
  assert.ok(focusDays >= 10 && otherDays >= 20, `rotations last ${focusDays} (CU/DU) and ${otherDays} (others) days`);
});

// ---- API ------------------------------------------------------------------------

const db = await createLocalDb();
useDatabase(db);
test.after(() => db.close());

const vercel = mod => request => mod[request.method]?.(request) ?? new Response(null, { status: 405 });
const profile = vercel(vercelProfile);
const daily = vercel(vercelDaily);
const dailyCf = request => cfDaily({ request, env: {} });

async function call(handler, { method = 'GET', query = {}, body, cookie } = {}) {
  const qs = new URLSearchParams(query).toString();
  const request = new Request(`https://site.test/api/daily${qs ? `?${qs}` : ''}`, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie: `campus_player=${cookie}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await handler(request);
  return { status: res.status, body: await res.json().catch(() => null) };
}
const join = async name => (await call(profile, { method: 'POST', body: { name } })).body.player.playerId;
const today = dhakaDay();
const sheetFor = (ids, pick = q => q.a) => ids.map(id => ({ id, choice: pick(QUESTION_MAP.get(id)) }));

let ids;
let alice;
test('GET: today\'s set is made once, continues yesterday\'s rotation and is the same on both hosts', async () => {
  const yesterday = pickDaily(shiftDay(today, -1), QUESTIONS);
  await db.query('INSERT INTO daily_sets (day, ids, meta) VALUES ($1::date, $2::jsonb, $3::jsonb)', [shiftDay(today, -1), JSON.stringify(yesterday.ids), JSON.stringify(yesterday.state)]);
  const r = await call(daily);
  assert.equal(r.status, 200);
  assert.equal(r.body.day, today);
  ids = r.body.ids;
  assert.equal(ids.length, 20);
  assert.ok(ids.every(id => !yesterday.ids.includes(id)), 'nothing from yesterday repeats');
  assert.deepEqual((await call(dailyCf)).body.ids, ids, 'Cloudflare entry gives the same set');
  assert.equal(r.body.participants, 0);
  assert.equal(r.body.mine, null);
  assert.deepEqual(r.body.days.map(d => d.day), [today, shiftDay(today, -1)]);
  assert.equal((await call(daily, { query: { day: '2020-01-01' } })).status, 404, 'no quiz on a day before the start');
});

test('POST: score recomputed, one ranked try per day, repeats are idempotent', async () => {
  alice = await join('Alice Rahman');
  const body = { playerId: alice, attemptId: 'd1', day: today, timeSec: 300, answers: sheetFor(ids) };
  const r = await call(daily, { method: 'POST', cookie: alice, body: { ...body, score: 0 } });
  assert.equal(r.status, 201);
  assert.equal(r.body.entry.score, 100);
  assert.equal(r.body.entry.marks, 20);
  assert.deepEqual(r.body.rank, { rank: 1, players: 1 });
  const again = await call(daily, { method: 'POST', cookie: alice, body });
  assert.equal(again.status, 200);
  assert.equal(again.body.duplicate, true);
  const second = await call(daily, { method: 'POST', cookie: alice, body: { ...body, attemptId: 'd2' } });
  assert.equal(second.status, 409);
  assert.equal(second.body.code, 'already');
  assert.equal(second.body.mine.score, 100);
});

test('POST: rejects other questions, missing answers, old days and a foreign cookie', async () => {
  const bob = await join('Bob Ali');
  const base = { playerId: bob, attemptId: 'b1', day: today, answers: sheetFor(ids) };
  const other = QUESTIONS.find(q => !ids.includes(q.id));
  assert.equal((await call(daily, { method: 'POST', cookie: bob, body: { ...base, answers: [...sheetFor(ids.slice(1)), { id: other.id, choice: 0 }] } })).status, 400);
  assert.equal((await call(daily, { method: 'POST', cookie: bob, body: { ...base, answers: sheetFor(ids.slice(1)) } })).status, 400);
  assert.equal((await call(daily, { method: 'POST', cookie: bob, body: { ...base, answers: sheetFor(ids, () => 7) } })).status, 400);
  assert.equal((await call(daily, { method: 'POST', cookie: bob, body: { ...base, day: shiftDay(today, -3) } })).status, 400);
  assert.equal((await call(daily, { method: 'POST', cookie: alice, body: base })).status, 403);
});

test('board, my rank and the date list; a new highest score makes a popup event', async () => {
  const bob = await join('Bob Ali');
  // Bob: half right, half wrong → 10 − 2.5 = 7.5 marks.
  const half = sheetFor(ids, q => (ids.indexOf(q.id) % 2 ? q.a : (q.a + 1) % 4));
  const r = await call(daily, { method: 'POST', cookie: bob, body: { playerId: bob, attemptId: 'b2', day: today, timeSec: 500, answers: half } });
  assert.equal(r.status, 201);
  assert.equal(r.body.entry.marks, 7.5);
  assert.deepEqual(r.body.rank, { rank: 2, players: 2 });
  const view = await call(daily, { cookie: bob });
  assert.equal(view.body.participants, 2);
  assert.equal(view.body.board[0].tag, 'Rahman.001');
  assert.match(view.body.board[1].tag, /^Ali\.\d{3}$/);
  assert.ok(view.body.board.every(b => !('player_id' in b) && !('answers' in b)), 'no ids or answer sheets of others');
  assert.equal(view.body.mine.rank, 2);
  assert.equal(view.body.mine.answers.length, 20);
  assert.deepEqual(view.body.days[0], { day: today, participants: 2, mine: { score: Number(r.body.entry.score), marks: 7.5, rank: 2 } });
  const events = await db.query("SELECT payload FROM events WHERE kind = 'top'");
  assert.equal(events.length, 0, 'a lower score is not announced');
  // Pretend the day's best so far is 60%: Carol's 100% is a new highest score.
  await db.query('UPDATE daily_attempts SET score = 60 WHERE player_id = $1::uuid', [alice]);
  const carol = await join('Carol Das');
  await call(daily, { method: 'POST', cookie: carol, body: { playerId: carol, attemptId: 'c1', day: today, answers: sheetFor(ids) } });
  const [top] = await db.query("SELECT payload FROM events WHERE kind = 'top'");
  assert.equal(top.payload.mode, 'daily');
  assert.match(top.payload.tag, /^Das\.\d{3}$/);
});
