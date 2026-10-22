// Community API tests against an in-memory Postgres (PGlite), through both entry points.
import test from 'node:test';
import assert from 'node:assert/strict';
import { useDatabase } from '../server/db.js';
import { createLocalDb } from '../server/local-db.js';
import * as vercelProfile from '../api/profile.js';
import { onRequest as cfCommunity } from '../functions/api/community.js';
import { cleanTags, cleanText } from '../server/routes/community.js';

const db = await createLocalDb();
useDatabase(db);
test.after(() => db.close());

const ADMIN = 'test-admin-secret';
const community = (request, env = { ADMIN_PASSWORD: ADMIN }) => cfCommunity({ request, env });

async function call(handler, { method = 'GET', query = {}, body, cookie, env } = {}) {
  const qs = new URLSearchParams(query).toString();
  const request = new Request(`https://site.test/api/community${qs ? `?${qs}` : ''}`, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie: `campus_player=${cookie}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await handler(request, env);
  return { status: res.status, body: await res.json().catch(() => null) };
}
const post = (body, cookie, env) => call(community, { method: 'POST', body, cookie, env });
const join = async name => (await call(r => vercelProfile.POST(r), { method: 'POST', body: { name } })).body.player.playerId;

const asker = await join('Nadia Islam');
const helper = await join('Tanvir Ahmed');
let threadId;

test('posting needs a profile; bad input is refused', async () => {
  const anon = await post({ action: 'thread', topic: 'tense', title: 'Present perfect কখন হয়?' });
  assert.equal(anon.status, 401);
  assert.equal(anon.body.code, 'need_profile');
  assert.equal((await post({ action: 'thread', topic: 'tense', title: 'short' }, asker)).status, 400);
  assert.equal((await post({ action: 'thread', topic: 'Bad Topic!', title: 'Present perfect কখন হয়?' }, asker)).status, 400);
  assert.equal((await post({ action: 'nope' }, asker)).status, 400);
});

test('create a thread with tags; it shows in the list and by tag/topic/status/search', async () => {
  const r = await post({
    action: 'thread', topic: 'tense', title: 'Since আর for-এর পার্থক্য কী?',
    body: 'Line one\n\n\n\nline <b>two</b>', tags: ['#Since', 'for', 'since', 'x'], questionId: 'tense-1pb4od6',
  }, asker);
  assert.equal(r.status, 201);
  threadId = r.body.thread.id;
  assert.deepEqual(r.body.thread.tags, ['since', 'for']);
  assert.equal(r.body.thread.body, 'Line one\n\nline btwo/b');
  assert.equal(r.body.thread.author.tag, 'Nadia Islam.001');
  assert.equal(r.body.thread.mine, true);
  assert.equal(r.body.thread.questionId, 'tense-1pb4od6');

  const list = (await call(community, { query: {} })).body;
  assert.equal(list.threads[0].id, threadId);
  assert.equal(list.threads[0].mine, false, 'no cookie → not mine');
  assert.deepEqual(list.tags.map(t => t.tag).sort(), ['for', 'since']);
  assert.equal((await call(community, { query: { tag: 'since' } })).body.threads.length, 1);
  assert.equal((await call(community, { query: { tag: 'article' } })).body.threads.length, 0);
  assert.equal((await call(community, { query: { topic: 'article' } })).body.threads.length, 0);
  assert.equal((await call(community, { query: { status: 'resolved' } })).body.threads.length, 0);
  assert.equal((await call(community, { query: { q: 'পার্থক্য' } })).body.threads.length, 1);
  assert.equal((await call(community, { query: { q: '100%' } })).body.threads.length, 0);
});

let replyId;
test('reply, then only the author can mark a reply as the solution', async () => {
  const r = await post({ action: 'reply', threadId, body: 'Since + সময়ের শুরু, for + সময়ের দৈর্ঘ্য।' }, helper);
  assert.equal(r.status, 201);
  assert.equal(r.body.thread.replies, 1);
  replyId = r.body.thread.replyList[0].id;
  assert.equal(r.body.thread.replyList[0].author.tag, 'Tanvir Ahmed.002');
  assert.equal((await post({ action: 'reply', threadId: 999999, body: 'hello there' }, helper)).status, 404);

  assert.equal((await post({ action: 'resolve', threadId, resolved: true, replyId }, helper)).status, 403);
  const ok = await post({ action: 'resolve', threadId, resolved: true, replyId }, asker);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.thread.resolved, true);
  assert.equal(ok.body.thread.solutionId, replyId);
  assert.equal((await call(community, { query: { status: 'resolved' } })).body.threads.length, 1);

  const undo = await post({ action: 'resolve', threadId, resolved: false }, asker);
  assert.equal(undo.body.thread.resolved, false);
  assert.equal(undo.body.thread.solutionId, null);
  await post({ action: 'resolve', threadId, resolved: true, replyId }, asker);
});

test('admin delete: wrong or missing password is refused; reply then thread are removed', async () => {
  assert.equal((await post({ action: 'delete', kind: 'reply', id: replyId, password: 'guess' }, helper)).status, 403);
  assert.equal((await post({ action: 'delete', kind: 'reply', id: replyId, password: ADMIN }, null, {})).status, 503);

  const gone = await post({ action: 'delete', kind: 'reply', id: replyId, password: ADMIN });
  assert.equal(gone.status, 200);
  const t = (await call(community, { query: { id: threadId } })).body.thread;
  assert.equal(t.replies, 0);
  assert.equal(t.solutionId, null, 'deleting the solution clears it');

  assert.equal((await post({ action: 'delete', kind: 'thread', id: threadId, password: ADMIN })).status, 200);
  assert.equal((await call(community, { query: { id: threadId } })).status, 404);
});

test('rate limit: at most 3 new threads in 10 minutes', async () => {
  for (let i = 0; i < 3; i++) {
    assert.equal((await post({ action: 'thread', topic: 'general', title: `Admission প্রশ্ন নম্বর ${i}` }, helper)).status, 201);
  }
  assert.equal((await post({ action: 'thread', topic: 'general', title: 'আরও একটা প্রশ্ন আছে' }, helper)).status, 429);
});

test('text and tag cleaning', () => {
  assert.equal(cleanText('  a \t b \r\n\r\n\r\n c <script> ', 100), 'a b\n\nc script');
  assert.deepEqual(cleanTags('Tense, #Article,  tense ,a'), ['tense', 'article']);
  assert.equal(cleanTags(Array.from({ length: 9 }, (_, i) => `tag${i}`)).length, 5);
});
