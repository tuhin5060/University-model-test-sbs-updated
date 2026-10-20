// Shared helpers for the API routes.

export const COOKIE = 'campus_player';
export const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function clean(value, max) {
  return String(value ?? '').replace(/[<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) return JSON.parse(req.body);
  return {};
}

/** The student id stored in the HttpOnly cookie, or '' if missing/invalid. */
export function readCookie(req) {
  const header = req.headers?.cookie || req.headers?.Cookie || '';
  const part = String(header).split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`));
  let id = '';
  try { id = part ? decodeURIComponent(part.slice(COOKIE.length + 1)) : ''; } catch { id = ''; }
  return ID_RE.test(id) ? id : '';
}

export function setCookie(res, playerId) {
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(playerId)}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`);
}

export function sendJSON(res, status, body) {
  return res.status(status).json(body);
}
