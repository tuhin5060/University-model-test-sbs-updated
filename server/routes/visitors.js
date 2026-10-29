// Live visitor count + "new highest score" popups.
// Every open tab sends a heartbeat (POST { sid, since }) about once a minute
// while visible. The answer is the number of distinct browsers seen in the last
// ONLINE_SEC seconds (nothing is estimated), the number of distinct browsers seen
// today (Bangladesh time), any score events after `since` and the admin's site notice.
import { route } from '../route.js';
import { json, readJSON, readCookie, iso, BadRequest } from '../http.js';

export const ONLINE_SEC = 150;
export const SESSION_GAP_MIN = 5;
// "Today" starts at midnight Bangladesh time.
const TODAY = "(now() AT TIME ZONE 'Asia/Dhaka')::date";
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
    // Why saving failed on a student's phone (noted there, sent once it is back online): to the server log.
    if (Array.isArray(body.problems) && body.problems.length) {
      const ua = request.headers.get('user-agent') || '';
      const phone = /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : 'other';
      const inApp = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp/.test(ua) ? ' in-app' : '';
      console.error(`client save problem (${phone}${inApp})`, body.problems.slice(0, 5).map(p => String(p).slice(0, 120)).join(' | '));
    }
    const since = Number.isSafeInteger(body.since) && body.since >= 0 ? body.since : null;
    const me = readCookie(request);
    const [, , , , , , , [count], [visits], events, [last], [notice]] = await db.batch([
      // Usage for the admin dashboard: one heartbeat ≈ one minute with the site open and visible.
      // A gap of more than 5 minutes starts a new session (from–to times per visit).
      [`WITH upd AS (
          UPDATE usage_sessions SET last_at = now(), beats = beats + 1, player_id = COALESCE($2::uuid, player_id)
          WHERE id = (SELECT id FROM usage_sessions WHERE sid = $1 AND last_at > now() - interval '${SESSION_GAP_MIN} minutes' ORDER BY last_at DESC LIMIT 1)
          RETURNING id)
        INSERT INTO usage_sessions (sid, player_id) SELECT $1, $2::uuid WHERE NOT EXISTS (SELECT 1 FROM upd)`, [sid, me || null]],
      ["DELETE FROM usage_sessions WHERE last_at < now() - interval '60 days'"],
      ['INSERT INTO presence (sid, at) VALUES ($1, now()) ON CONFLICT (sid) DO UPDATE SET at = now()', [sid]],
      [`INSERT INTO daily_visits (day, sid) VALUES (${TODAY}, $1) ON CONFLICT DO NOTHING`, [sid]],
      ["DELETE FROM presence WHERE at < now() - interval '10 minutes'"],
      [`DELETE FROM daily_visits WHERE day < ${TODAY} - 1`],
      ["DELETE FROM events WHERE at < now() - interval '1 day'"],
      [`SELECT count(*)::int AS online FROM presence WHERE at >= now() - interval '${ONLINE_SEC} seconds'`],
      // Distinct browsers that opened the site since midnight Bangladesh time (counted, not estimated).
      [`SELECT count(*)::int AS today FROM daily_visits WHERE day = ${TODAY}`],
      // Only events from the last 10 minutes, and none on the first heartbeat (since = null).
      ["SELECT id, kind, payload, at FROM events WHERE $1::bigint IS NOT NULL AND id > $1::bigint AND at > now() - interval '10 minutes' ORDER BY id LIMIT 5", [since]],
      ['SELECT COALESCE(max(id), 0)::int AS id FROM events'],
      // The admin's site notice (admin page → Notice), shown as a bar on every page while on.
      ["SELECT value FROM settings WHERE key = 'notice'"],
    ]);
    return json({
      ok: true,
      online: count.online,
      today: visits.today,
      lastEvent: last.id,
      notice: notice?.value?.on ? { id: notice.value.id, text: notice.value.text, url: notice.value.url || '' } : null,
      events: events.map(e => {
        const { playerId, ...payload } = e.payload || {};
        return { id: Number(e.id), kind: e.kind, at: iso(e.at), ...payload, mine: !!me && playerId === me };
      }),
    });
  },
}, 'Live visitor count is unavailable right now.');
