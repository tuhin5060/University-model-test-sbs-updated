// Security layers: admin password lockout, per-address limits, cross-site refusal,
// a cacheable (non-personal) leaderboard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { useDatabase } from '../server/db.js';
import { createLocalDb } from '../server/local-db.js';
import * as profile from '../api/profile.js';
import { SIGNUP_MAX } from '../server/routes/profile.js';
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

test('sign-ups: a whole class can join from one address, a script cannot flood', async () => {
  for (let i = 0; i < SIGNUP_MAX; i++) {
    assert.equal((await profile.POST(req('/api/profile', { body: { name: `Bot Student ${i}` }, ip: '192.0.2.50' }))).status, 201);
  }
  assert.equal((await profile.POST(req('/api/profile', { body: { name: 'Bot Student over' }, ip: '192.0.2.50' }))).status, 429);
  assert.equal((await profile.POST(req('/api/profile', { body: { name: 'Real Student' }, ip: '192.0.2.51' }))).status, 201);
});

test('posts from another website are refused; same site and no Origin are allowed', async () => {
  assert.equal(sameOrigin(new Request('https://site.test/api/x', { headers: { origin: 'https://site.test' } })), true);
  assert.equal(sameOrigin(new Request('https://site.test/api/x')), true);
  assert.equal(sameOrigin(new Request('https://site.test/api/x', { headers: { origin: 'https://evil.example' } })), false);
  assert.equal(sameOrigin(new Request('https://site.test/api/x', { headers: { origin: 'null', 'sec-fetch-site': 'same-origin' } })), true, 'a privacy-mode Safari');
  assert.equal(sameOrigin(new Request('https://site.test/api/x', { headers: { origin: 'https://site.test', 'sec-fetch-site': 'cross-site' } })), false);
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

// The repository is public: no password, database address, private key or old source ZIP
// may ever be committed. Real values live only in the Vercel / Cloudflare settings.
test('no secrets in the repository', async () => {
  const { execFileSync } = await import('node:child_process');
  const { readFileSync } = await import('node:fs');
  let files;
  try { files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean); } catch { return; } // not a git checkout
  assert.ok(!files.some(f => /(^|\/)\.env$|\.env\.local$|\.zip$|\.pem$/i.test(f)), 'no .env, key or ZIP files');
  const rules = [
    [/postgres(ql)?:\/\/[^\s'"`:@/]+:(?!pw@)[^\s'"`@]+@/i, 'database URL with a password'],
    [/mongodb(\+srv)?:\/\/[^\s'"`]*@/i, 'MongoDB URL with a password'],
    [/\bnpg_[A-Za-z0-9]{10,}/, 'Neon password'],
    [/ADMIN_PASSWORD\s*[=:]\s*['"]?[^\s'"`,)]{3,}/, 'admin password value'],
    [/"d"\s*:\s*"[A-Za-z0-9_-]{40,}"/, 'private key (JWK)'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key (PEM)'],
  ];
  const bad = [];
  for (const f of files) {
    if (!/\.(m?js|json|md|html|toml|ya?ml|txt|example|sh|css)$|^[^.]+$|^\.[^/]+$/.test(f) || f.startsWith('tests/')) continue;
    let text;
    try { text = readFileSync(f, 'utf8'); } catch { continue; }
    for (const [re, what] of rules) if (re.test(text)) bad.push(`${f}: ${what}`);
  }
  assert.deepEqual(bad, []);
});
