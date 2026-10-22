// Security layers: admin password lockout, per-address limits, cross-site refusal,
// a cacheable (non-personal) leaderboard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { useDatabase } from '../server/db.js';
import { createLocalDb } from '../server/local-db.js';
import * as profile from '../api/profile.js';
import * as scores from '../api/scores.js';
import * as backup from '../api/backup.js';
import { sameOrigin } from '../server/route.js';

const db = await createLocalDb();
useDatabase(db);
test.after(() => db.close());
process.env.ADMIN_PASSWORD = 'right-password';

const req = (url, { body, ip = '203.0.113.7', origin, cookie } = {}) => new Request(`https://site.test${url}`, {
  method: body ? 'POST' : 'GET',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': `${ip}, 10.0.0.1`, ...(origin ? { origin } : {}), ...(cookie ? { cookie } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

test('admin password: 10 wrong guesses from one address lock it out for a while, even with the right one', async () => {
  for (let i = 0; i < 10; i++) assert.equal((await backup.POST(req('/api/backup', { body: { password: `guess-${i}` } }))).status, 403);
  const locked = await backup.POST(req('/api/backup', { body: { password: 'right-password' } }));
  assert.equal(locked.status, 429);
  assert.match((await locked.json()).error, /১৫ মিনিট/);
  const other = await backup.POST(req('/api/backup', { body: { password: 'right-password' }, ip: '198.51.100.9' }));
  assert.equal(other.status, 200, 'another address is not affected');
});

test('sign-ups: at most 40 new students per address per hour', async () => {
  for (let i = 0; i < 40; i++) {
    assert.equal((await profile.POST(req('/api/profile', { body: { name: `Bot Student ${i}` }, ip: '192.0.2.50' }))).status, 201);
  }
  assert.equal((await profile.POST(req('/api/profile', { body: { name: 'Bot Student 41' }, ip: '192.0.2.50' }))).status, 429);
  assert.equal((await profile.POST(req('/api/profile', { body: { name: 'Real Student' }, ip: '192.0.2.51' }))).status, 201);
});

test('posts from another website are refused; same site and no Origin are allowed', async () => {
  assert.equal(sameOrigin(new Request('https://site.test/api/x', { headers: { origin: 'https://site.test' } })), true);
  assert.equal(sameOrigin(new Request('https://site.test/api/x')), true);
  assert.equal(sameOrigin(new Request('https://site.test/api/x', { headers: { origin: 'https://evil.example' } })), false);
  const r = await profile.POST(req('/api/profile', { body: { name: 'Cross Site' }, origin: 'https://evil.example', ip: '192.0.2.60' }));
  assert.equal(r.status, 403);
});

test('leaderboard is the same for everyone and cacheable at the edge', async () => {
  const r = await scores.GET(req('/api/scores?mode=fun&topic=all'));
  assert.equal(r.status, 200);
  assert.match(r.headers.get('cache-control'), /public.*s-maxage=20/);
  const mine = await scores.GET(req('/api/scores?me=1'));
  assert.match(mine.headers.get('cache-control'), /private, no-store/, 'personal stats are never cached');
});
