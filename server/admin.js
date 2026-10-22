// Admin password check shared by community delete and the data backup.
// The password lives only in the host environment (ADMIN_PASSWORD).
import { BadRequest } from './http.js';
import { hitCount, recordHit } from './ratelimit.js';

async function sha256(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text))));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Compares digests so the answer time does not depend on how much of the password matched. */
export async function isAdmin(password, env) {
  const secret = env?.ADMIN_PASSWORD || '';
  if (!secret) throw new BadRequest('Admin password এই server-এ এখনো set করা হয়নি।', 503);
  const [a, b] = await Promise.all([sha256(password), sha256(secret)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const MAX_FAILS = 10; // wrong passwords per address …
const FAIL_WINDOW = 15 * 60; // … per 15 minutes

/**
 * Throws 403 unless the password is right. Wrong guesses are slowed down and,
 * after 10 from one address within 15 minutes, refused outright for a while.
 */
export async function requireAdmin(password, env, db, request) {
  if ((await hitCount(db, request, 'admin-fail', FAIL_WINDOW)) >= MAX_FAILS) {
    throw new BadRequest('অনেকবার ভুল password দেওয়া হয়েছে—১৫ মিনিট পরে আবার চেষ্টা করো।', 429);
  }
  if (await isAdmin(password, env)) return;
  await recordHit(db, request, 'admin-fail');
  await new Promise(r => setTimeout(r, 800));
  throw new BadRequest('Admin password ভুল।', 403);
}
