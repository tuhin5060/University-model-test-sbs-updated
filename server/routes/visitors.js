// Live visitor count + "new highest score" popups.
// Every open tab sends a heartbeat (POST { sid, since }) about once a minute
// while visible. The answer is the number of distinct browsers seen in the last
// ONLINE_SEC seconds (nothing is estimated) plus any score events after `since`.
import { route } from '../route.js';
import { json, readJSON, readCookie, iso, BadRequest } from '../http.js';

export const ONLINE_SEC = 150;
const SID_RE = /^[a-z0-9]{16,40}$/i;

export default route('visitors', {
  async POST(request, db) {
    const body = await readJSON(request, 5_000);
    const sid = String(body.sid || '');
    if (!SID_RE.test(sid)) throw new BadRequest('Invalid visitor id.');
    if (body.leave === true) {
      await db.query('DELETE FROM presence WHERE sid = $1', [sid]);
      return json({ ok: true });
    }
    const since = Number.isSafeInteger(body.since) && body.since >= 0 ? body.since : null;
    const [, , , [count], events, [last]] = await db.batch([
      ['INSERT INTO presence (sid, at) VALUES ($1, now()) ON CONFLICT (sid) DO UPDATE SET at = now()', [sid]],
      ["DELETE FROM presence WHERE at < now() - interval '10 minutes'"],
      ["DELETE FROM events WHERE at < now() - interval '1 day'"],
      [`SELECT count(*)::int AS online FROM presence WHERE at >= now() - interval '${ONLINE_SEC} seconds'`],
      // Only events from the last 10 minutes, and none on the first heartbeat (since = null).
      ["SELECT id, kind, payload, at FROM events WHERE $1::bigint IS NOT NULL AND id > $1::bigint AND at > now() - interval '10 minutes' ORDER BY id LIMIT 5", [since]],
      ['SELECT COALESCE(max(id), 0)::int AS id FROM events'],
    ]);
    const me = readCookie(request);
    return json({
      ok: true,
      online: count.online,
      lastEvent: last.id,
      events: events.map(e => {
        const { playerId, ...payload } = e.payload || {};
        return { id: Number(e.id), kind: e.kind, at: iso(e.at), ...payload, mine: !!me && playerId === me };
      }),
    });
  },
}, 'Live visitor count is unavailable right now.');
