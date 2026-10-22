// Wraps a route's method handlers with database setup and error handling.
import { getDb, NotConfigured } from './db.js';
import { json, methodNotAllowed, BadRequest } from './http.js';

/**
 * handlers: { GET?(request, db, env), POST?(request, db, env) } → (request, env) => Response
 * failure: the message students see if the database call fails.
 */
/** True unless the browser says the request came from another website. */
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return !origin;
  try {
    const host = new URL(origin).host;
    return [new URL(request.url).host, request.headers.get('host'), request.headers.get('x-forwarded-host')].includes(host);
  } catch { return false; }
}

export function route(name, handlers, failure) {
  const allow = Object.keys(handlers).join(', ');
  return async function handle(request, env = {}) {
    const fn = handlers[request.method];
    if (!fn) return methodNotAllowed(allow);
    // Changes may only come from this site's own pages (no cross-site form or script posts).
    if (request.method !== 'GET' && !sameOrigin(request)) return json({ ok: false, error: 'Cross-site request refused.' }, 403);
    try {
      return await fn(request, await getDb(env), env);
    } catch (error) {
      if (error instanceof BadRequest) return json({ ok: false, error: error.message, ...error.extra }, error.status || 400);
      if (error instanceof NotConfigured) {
        console.error(`${name} API: database is not configured (set DATABASE_URL)`);
        return json({ ok: false, error: 'Database is not configured on this server yet.' }, 503);
      }
      console.error(`${name} API failed`, error?.name || 'DatabaseError', error?.message);
      return json({ ok: false, error: failure }, 500);
    }
  };
}
