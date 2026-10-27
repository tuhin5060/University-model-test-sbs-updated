// Admin dashboard (password: ADMIN_PASSWORD): who uses the site, when and for how long.
// POST { password, days? } → { summary, daily, students, sessions }
// Usage comes from the visitors heartbeat (usage_sessions): one beat ≈ one minute with
// the site open and visible; a gap over 5 minutes starts a new session. Full names are
// only ever sent here, after the admin password check.
import { route } from '../route.js';
import { json, readJSON, iso } from '../http.js';
import { requireAdmin } from '../admin.js';
import { ONLINE_SEC } from './visitors.js';

const BD = "AT TIME ZONE 'Asia/Dhaka'";
const TODAY = `(now() ${BD})::date`;

export default route('admin', {
  async POST(request, db, env) {
    const body = await readJSON(request, 2_000);
    await requireAdmin(body.password, env, db, request);
    const days = Math.min(30, Math.max(1, Number.parseInt(body.days, 10) || 7));
    const [[summary], daily, students, sessions] = await db.batch([
      [`SELECT
          (SELECT count(*)::int FROM presence WHERE at >= now() - interval '${ONLINE_SEC} seconds') AS online,
          (SELECT count(*)::int FROM daily_visits WHERE day = ${TODAY}) AS visitors_today,
          (SELECT count(DISTINCT player_id)::int FROM usage_sessions WHERE player_id IS NOT NULL AND (last_at ${BD})::date = ${TODAY}) AS students_today,
          (SELECT COALESCE(sum(beats), 0)::int FROM usage_sessions WHERE (last_at ${BD})::date = ${TODAY}) AS minutes_today,
          (SELECT count(*)::int FROM students) AS students_total`],
      // Per day (Bangladesh time): visitors, signed-in students and minutes of use.
      [`SELECT to_char((started_at ${BD})::date, 'YYYY-MM-DD') AS day, count(DISTINCT sid)::int AS visitors,
          count(DISTINCT player_id)::int AS students, sum(beats)::int AS minutes, count(*)::int AS sessions
        FROM usage_sessions WHERE started_at >= now() - make_interval(days => $1)
        GROUP BY 1 ORDER BY 1 DESC`, [days]],
      // Per student over the chosen days, most minutes first.
      [`SELECT s.name, s.roll, s.college, sum(u.beats)::int AS minutes, count(*)::int AS sessions,
          count(DISTINCT (u.started_at ${BD})::date)::int AS active_days,
          COALESCE(sum(u.beats) FILTER (WHERE (u.last_at ${BD})::date = ${TODAY}), 0)::int AS minutes_today,
          min(u.started_at) FILTER (WHERE (u.last_at ${BD})::date = ${TODAY}) AS first_today,
          max(u.last_at) AS last_at,
          (SELECT count(*)::int FROM score_attempts a WHERE a.player_id = s.id AND a.at >= now() - make_interval(days => $1)) AS tests
        FROM usage_sessions u JOIN students s ON s.id = u.player_id
        WHERE u.started_at >= now() - make_interval(days => $1)
        GROUP BY s.id ORDER BY minutes DESC, last_at DESC LIMIT 300`, [days]],
      // Today's sessions with from–to times (newest first).
      [`SELECT s.name, s.roll, u.started_at, u.last_at, u.beats AS minutes
        FROM usage_sessions u LEFT JOIN students s ON s.id = u.player_id
        WHERE (u.last_at ${BD})::date = ${TODAY} ORDER BY u.last_at DESC LIMIT 300`],
    ]);
    return json({
      ok: true,
      days,
      summary,
      daily,
      students: students.map(r => ({ ...r, first_today: iso(r.first_today), last_at: iso(r.last_at) })),
      sessions: sessions.map(r => ({ name: r.name, roll: r.roll, from: iso(r.started_at), to: iso(r.last_at), minutes: r.minutes })),
    }, 200, { 'Cache-Control': 'no-store' });
  },
}, 'Admin dashboard এখন লোড করা গেল না—একটু পরে আবার চেষ্টা করো।');
