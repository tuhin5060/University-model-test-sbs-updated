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
  // An earlier visit today (more than 5 minutes ago) is a separate session.
  await db.query("INSERT INTO usage_sessions (sid, player_id, started_at, last_at, beats) VALUES ($1, $2, now() - interval '50 minutes', now() - interval '40 minutes', 10)", [sid, rahim]);

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
