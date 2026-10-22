// Backup → D1: the admin backup holds every row, and the converted SQL loads into
// SQLite (what Cloudflare D1 runs) with ids, rolls, scores and posts intact.
import test from 'node:test';
import assert from 'node:assert/strict';
import { useDatabase } from '../server/db.js';
import { createLocalDb } from '../server/local-db.js';
import * as profile from '../api/profile.js';
import * as scores from '../api/scores.js';
import * as progress from '../api/progress.js';
import * as backupApi from '../api/backup.js';
import { onRequest as cfCommunity } from '../functions/api/community.js';
import { backupToSql, D1_TABLES } from '../scripts/backup-to-d1.mjs';
import { QUESTIONS } from '../data/questions/index.js';

const db = await createLocalDb();
useDatabase(db);
test.after(() => db.close());

const ADMIN = 'backup-test-secret';
process.env.ADMIN_PASSWORD = ADMIN; // api/backup.js reads process.env, like on Vercel
const req = (url, body, cookie) => new Request(`https://site.test${url}`, {
  method: body ? 'POST' : 'GET',
  headers: { 'content-type': 'application/json', ...(cookie ? { cookie: `campus_player=${cookie}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

let backup;
test('admin backup: password required, every table included', async () => {
  const rahim = (await (await profile.POST(req('/api/profile', { name: "Rahim O'Neil" }))).json()).player.playerId;
  const sadia = (await (await profile.POST(req('/api/profile', { name: 'সাদিয়া ইসলাম', roll: '042', college: 'Chittagong College' }))).json()).player.playerId;
  const qs = QUESTIONS.filter(q => q.topicId === 'tense').slice(0, 4);
  for (const [id, n] of [[rahim, 'b1'], [sadia, 'b2']]) {
    const r = await scores.POST(req('/api/scores', { playerId: id, attemptId: n, mode: 'exam', topic: 'tense', answers: qs.map(q => ({ id: q.id, choice: q.a })) }, id));
    assert.equal(r.status, 201);
  }
  assert.equal((await progress.POST(req('/api/progress', { progress: { v: 2, history: [{ id: 'h1', title: "it's ১০০%" }] } }, rahim))).status, 200);
  const thread = await cfCommunity({ request: req('/api/community', { action: 'thread', topic: 'tense', title: 'Since না for? কোনটা বসবে', tags: ['since'] }, rahim), env: {} });
  const threadId = (await thread.json()).thread.id;
  await cfCommunity({ request: req('/api/community', { action: 'reply', threadId, body: "Since — it's a point of time" }, sadia), env: {} });
  await db.query("INSERT INTO push_subs (endpoint, player_id) VALUES ('https://fcm.googleapis.com/fcm/send/x', $1)", [sadia]);
  await db.query(`INSERT INTO settings (key, value) VALUES ('known_topics', '["tense"]'::jsonb)`);

  assert.equal((await backupApi.POST(req('/api/backup', { password: 'wrong' }))).status, 403);
  const res = await backupApi.POST(req('/api/backup', { password: ADMIN }));
  assert.equal(res.status, 200);
  backup = await res.json();
  assert.equal(backup.app, 'campus-pothe');
  for (const table of Object.keys(D1_TABLES)) assert.ok(Array.isArray(backup.tables[table]), table);
  assert.equal(backup.tables.students.length, 2);
  assert.equal(backup.tables.score_attempts.length, 2);
  assert.equal(backup.tables.replies.length, 1);
});

test('converted SQL loads into SQLite with everything connected', async t => {
  let DatabaseSync;
  try { ({ DatabaseSync } = await import('node:sqlite')); } catch { return t.skip('node:sqlite not available'); }
  const { sql, counts, tooBig } = backupToSql(JSON.parse(JSON.stringify(backup)));
  assert.deepEqual(tooBig, []);
  const lite = new DatabaseSync(':memory:');
  lite.exec(sql);
  for (const [table, n] of Object.entries(counts)) {
    assert.equal(lite.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, n, table);
  }
  const sadia = lite.prepare('SELECT id, roll, name, college FROM students WHERE roll = 42').get();
  assert.equal(sadia.name, 'সাদিয়া ইসলাম');
  assert.equal(sadia.college, 'Chittagong College');
  assert.equal(lite.prepare("SELECT name FROM students WHERE name LIKE 'Rahim%'").get().name, "Rahim O'Neil", 'quotes survive');
  // Leaderboard-style query (window function) works and joins back to students.
  const board = lite.prepare(`SELECT s.name, a.score, row_number() OVER (ORDER BY a.score DESC, a.at) AS rank
    FROM score_attempts a JOIN students s ON s.id = a.player_id WHERE a.mode = 'exam' AND a.topic = 'tense'`).all();
  assert.equal(board.length, 2);
  const reply = lite.prepare('SELECT r.body, t.title, s.roll FROM replies r JOIN threads t ON t.id = r.thread_id JOIN students s ON s.id = r.author_id').get();
  assert.equal(reply.roll, 42);
  assert.equal(reply.body, "Since — it's a point of time");
  assert.deepEqual(JSON.parse(lite.prepare('SELECT tags FROM threads').get().tags), ['since']);
  assert.equal(JSON.parse(lite.prepare('SELECT payload FROM progress').get().payload).history[0].title, "it's ১০০%");
  assert.equal(lite.prepare('SELECT player_id FROM push_subs').get().player_id, sadia.id);
  // New rows continue after the imported ids.
  lite.exec(`INSERT INTO threads (author_id, topic, title) VALUES ('${sadia.id}', 'general', 'next one')`);
  assert.equal(lite.prepare("SELECT id FROM threads WHERE title = 'next one'").get().id, backup.tables.threads[0].id + 1);
  lite.close();
});
