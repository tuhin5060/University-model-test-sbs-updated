// Admin dashboard: password required; usage from the heartbeat shows full names, minutes and sessions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { useDatabase } from '../server/db.js';
import { createLocalDb } from '../server/local-db.js';
import * as profile from '../api/profile.js';
import * as visitors from '../api/visitors.js';
import * as admin from '../api/admin.js';

const db = await createLocalDb();
useDatabase(db);
test.after(() => db.close());
process.env.ADMIN_PASSWORD = 'TestPass99';
delete process.env.VAPID_PRIVATE_JWK; // the build machine may have the real key: never send real notifications from a test

const req = (url, body, cookie) => new Request(`https://site.test${url}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...(cookie ? { cookie: `campus_player=${cookie}` } : {}) },
  body: JSON.stringify(body),
});

test('admin: wrong password refused; usage per student with full name, minutes and sessions', async () => {
  const rahim = (await (await profile.POST(req('/api/profile', { name: 'Rahim Uddin', college: 'Chittagong College' }))).json()).player.playerId;
  const sid = 'a1'.repeat(10);
  for (let i = 0; i < 3; i++) assert.equal((await visitors.POST(req('/api/visitors', { sid }, rahim))).status, 200);
  await visitors.POST(req('/api/visitors', { sid: 'b2'.repeat(10) })); // a visitor without a name
  // An earlier visit today (more than 5 minutes ago) is a separate session. Shortly after
  // midnight in Bangladesh "50 minutes ago" is yesterday, so never start before today's midnight.
  await db.query(`INSERT INTO usage_sessions (sid, player_id, started_at, last_at, beats)
    SELECT $1, $2, t, least(t + interval '10 minutes', now()), 10
    FROM (SELECT greatest(now() - interval '50 minutes', date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka') AT TIME ZONE 'Asia/Dhaka') AS t) x`, [sid, rahim]);

  assert.equal((await admin.POST(req('/api/admin', { password: 'wrong' }))).status, 403);
  const res = await admin.POST(req('/api/admin', { password: 'Test Pass 99' }));
  assert.equal(res.status, 200, 'spaces in the password are ignored');
  const body = await res.json();
  assert.equal(body.summary.online, 2);
  assert.equal(body.summary.students_today, 1);
  const r = body.students.find(s => s.name === 'Rahim Uddin');
  assert.ok(r, 'full name is shown to the admin');
  assert.equal(r.minutes, 13, '3 heartbeats in one session + the earlier 10-minute visit');
  assert.equal(r.sessions, 2);
  assert.equal(r.college, 'Chittagong College');
  assert.equal(body.sessions.filter(s => s.name === 'Rahim Uddin').length, 2);
  assert.equal(body.sessions.find(s => s.minutes === 3).name, 'Rahim Uddin', 'consecutive heartbeats extend one session');
  assert.ok(body.sessions.some(s => s.name === null), 'visitors without a name are listed too');
});

// ---- more admin actions (2.18) -----------------------------------------------------
import * as daily from '../api/daily.js';
import { safeLink } from '../server/routes/admin.js';
import { QUESTION_MAP } from '../data/questions/index.js';

const adminCall = async (body, password = 'TestPass99') => {
  const res = await admin.POST(req('/api/admin', { password, ...body }));
  return { status: res.status, body: await res.json() };
};

test('admin actions all need the password', async () => {
  for (const action of ['students', 'usage', 'daily', 'settings', 'save-settings', 'push']) {
    assert.equal((await adminCall({ action }, 'nope')).status, 403, action);
  }
  assert.equal((await adminCall({ action: 'drop-tables' })).status, 400);
});

test('overview: per-day rows include days without activity, tests and Daily Quiz counts', async () => {
  const { body } = await adminCall({ days: 7 });
  assert.equal(body.daily.length, 7);
  assert.ok(['tests', 'daily', 'signups', 'visitors'].every(k => k in body.daily[0]));
  assert.ok('push_subs' in body.summary && 'daily_today' in body.summary && 'tests_today' in body.summary);
});

test('students: search by name, roll or college with tests, points and Daily Quiz days', async () => {
  const id = (await (await profile.POST(req('/api/profile', { name: 'Karim Ahmed', college: 'Dhaka College' }))).json()).player;
  const { ids, day } = await (await daily.GET(new Request('https://site.test/api/daily'))).json();
  const sheet = ids.map(q => ({ id: q, choice: QUESTION_MAP.get(q).a }));
  assert.equal((await daily.POST(req('/api/daily', { playerId: id.playerId, attemptId: 'adm-d1', day, answers: sheet }, id.playerId))).status, 201);
  const byName = (await adminCall({ action: 'students', q: 'karim' })).body.students;
  assert.equal(byName.length, 1);
  assert.equal(byName[0].daily_days, 1);
  assert.equal(byName[0].tag, `Karim Ahmed.${String(id.roll).padStart(3, '0')}`);
  assert.equal((await adminCall({ action: 'students', q: String(id.roll).padStart(3, '0') })).body.students[0].name, 'Karim Ahmed');
  assert.equal((await adminCall({ action: 'students', q: 'dhaka' })).body.students[0].college, 'Dhaka College');
  assert.equal((await adminCall({ action: 'students', q: '%' })).body.students.length, 0, '% is a plain character, not a wildcard');

  const d = (await adminCall({ action: 'daily' })).body;
  assert.equal(d.day, day);
  assert.equal(d.questions.length, 20);
  assert.ok(d.questions.every(q => q.ref), 'every Daily Quiz question has its exam reference');
  assert.equal(d.rows[0].name, 'Karim Ahmed');
  assert.equal(d.rows[0].marks, 20);
  assert.equal(d.days[0].participants, 1);
});

test('settings: site notice goes out with the heartbeat; links are checked; morning text is kept', async () => {
  assert.equal((await adminCall({ action: 'save-settings', notice: { on: true, text: 'Exam tomorrow', url: 'javascript:alert(1)' } })).status, 400);
  const saved = (await adminCall({ action: 'save-settings', notice: { on: true, text: '<b>কাল</b> নতুন topic', url: '#daily' }, morning: { title: 'Good morning', body: 'Quiz ready' } })).body;
  assert.ok(!saved.notice.text.includes('<'), 'tags are stripped');
  assert.equal(saved.morning.title, 'Good morning');
  const beat = await (await visitors.POST(req('/api/visitors', { sid: 'c3'.repeat(10) }))).json();
  assert.equal(beat.notice.url, '#daily');
  assert.equal(beat.notice.id, saved.notice.id);
  await adminCall({ action: 'save-settings', notice: { on: false, text: 'Exam tomorrow', url: '' } });
  assert.equal((await (await visitors.POST(req('/api/visitors', { sid: 'c3'.repeat(10) }))).json()).notice, null);
  assert.equal(safeLink('#start/fun'), '#start/fun');
  assert.equal(safeLink('https://cu.ac.bd/'), 'https://cu.ac.bd/');
  assert.equal(safeLink('http://x.com'), '');
  assert.equal(safeLink('data:text/html,hi'), '');
});

test('push now: refused without notification keys, needs a title and text', async () => {
  const r = await adminCall({ action: 'push', title: 'Hi', body: 'Hello', url: '#daily' });
  assert.equal(r.status, 503, 'no VAPID key in this test environment');
});

test('usage: who is online now, minutes per person on a day, one student per day and visit', async () => {
  const roll = (await (await profile.POST(req('/api/profile', { name: 'Karim Online', college: 'Dhaka College' }))).json()).player;
  const sid = 'c7'.repeat(10);
  for (let i = 0; i < 2; i++) await visitors.POST(req('/api/visitors', { sid }, roll.playerId));
  // Yesterday: a 25-minute visit.
  await db.query("INSERT INTO usage_sessions (sid, player_id, started_at, last_at, beats) VALUES ($1, $2, now() - interval '1 day', now() - interval '1 day' + interval '25 minutes', 25)", [sid, roll.playerId]);
  const { status, body } = await adminCall({ action: 'usage', roll: String(roll.roll).padStart(3, '0') });
  assert.equal(status, 200);
  const live = body.online.find(o => o.name === 'Karim Online');
  assert.ok(live, 'signed-in student shows by full name in "online now"');
  assert.equal(live.minutes, 2);
  assert.equal(live.college, 'Dhaka College');
  assert.ok(body.online.some(o => o.name === null), 'visitors without a name are listed too');
  assert.equal(body.people.find(p => p.name === 'Karim Online').minutes, 2, 'today only (yesterday not counted)');
  assert.ok(body.anon.visitors >= 1);
  assert.ok(body.days.length >= 1);
  assert.equal(body.student.name, 'Karim Online');
  assert.equal(body.student.minutes, 27);
  assert.equal(body.student.days.length, 2, 'today and yesterday');
  assert.equal(body.student.visits.length, 2);
  const missing = await adminCall({ action: 'usage', roll: '999' });
  assert.equal(missing.body.student, null);
});
