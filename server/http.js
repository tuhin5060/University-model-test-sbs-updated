// Web-standard Request/Response helpers shared by every API route.
// The same code runs on Vercel (api/*.js) and Cloudflare Pages (functions/api/*.js).

export const PLAYER_COOKIE = 'campus_player';
export const PROGRESS_COOKIE = 'campus_progress';
export const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function clean(value, max) {
  return String(value ?? '').replace(/[<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** A UUID stored in the named cookie, or '' if missing/invalid. */
export function readCookie(request, name = PLAYER_COOKIE) {
  const header = request.headers.get('cookie') || '';
  const part = header.split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  let id = '';
  try { id = part ? decodeURIComponent(part.slice(name.length + 1)) : ''; } catch { id = ''; }
  return ID_RE.test(id) ? id : '';
}

export const cookie = (name, value) => `${name}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`;

export function json(body, status = 200, extra = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const [k, v] of Object.entries(extra)) {
    for (const value of [].concat(v)) headers.append(k, value);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

/** A client error shown to the student as is (400 unless another status is given). */
export class BadRequest extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export async function readJSON(request, maxBytes = 200_000) {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new BadRequest('Request body is too large.');
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new BadRequest('Invalid JSON.'); }
}

export const query = request => Object.fromEntries(new URL(request.url).searchParams);
export const iso = v => (v instanceof Date ? v.toISOString() : v ?? null);
export const methodNotAllowed = allow => json({ ok: false, error: 'Method not allowed' }, 405, { Allow: allow });
