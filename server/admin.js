// Admin password check shared by community delete and the data backup.
// The password lives only in the host environment (ADMIN_PASSWORD).
import { BadRequest } from './http.js';

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

/** Throws 403 (after a short delay that slows down guessing) unless the password is right. */
export async function requireAdmin(password, env) {
  if (await isAdmin(password, env)) return;
  await new Promise(r => setTimeout(r, 800));
  throw new BadRequest('Admin password ভুল।', 403);
}
