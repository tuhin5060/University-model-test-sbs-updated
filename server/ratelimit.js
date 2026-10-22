// Limits per network address, so a script cannot flood the site with sign-ups,
// posts or password guesses. Addresses are stored only as a short hash, and
// rows older than a day are cleared. Mobile networks put many students behind
// one address, so the limits are generous for normal use.
import { BadRequest } from './http.js';

export function clientIp(request) {
  return request.headers.get('cf-connecting-ip')
    || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

async function keyFor(bucket, request) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`campus:${clientIp(request)}`)));
  return `${bucket}:${[...bytes.slice(0, 8)].map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

/** How many times this address hit `bucket` in the last `windowSec` seconds. */
export async function hitCount(db, request, bucket, windowSec) {
  const [row] = await db.query('SELECT count(*)::int AS n FROM hits WHERE key = $1 AND at > now() - make_interval(secs => $2::int)', [await keyFor(bucket, request), windowSec]);
  return row.n;
}

/** Records one hit (and now and then clears old ones). */
export async function recordHit(db, request, bucket) {
  await db.query('INSERT INTO hits (key) VALUES ($1)', [await keyFor(bucket, request)]);
  if (Math.random() < 0.02) await db.query("DELETE FROM hits WHERE at < now() - interval '1 day'");
}

/** Records a hit and refuses (429) once there are more than `max` in the window. */
export async function limit(db, request, bucket, max, windowSec, message = 'অনেক বেশি চেষ্টা হয়েছে—কিছুক্ষণ পরে আবার চেষ্টা করো।') {
  await recordHit(db, request, bucket);
  if ((await hitCount(db, request, bucket, windowSec)) > max) throw new BadRequest(message, 429);
}
