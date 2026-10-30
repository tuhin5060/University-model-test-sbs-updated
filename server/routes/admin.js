// Admin dashboard (password: ADMIN_PASSWORD, kept only in the host environment).
// POST { password, action?, … } — every action checks the password first.
//   (no action) → { summary, daily, students, sessions }  overview for the last `days` days
//   'students' { q } → students matching a name / roll / college, with tests, points and use
//   'usage' { day?, roll? } → who is online now, everyone's minutes on one day, the last 30 days;
//                             with roll: that student's minutes per day and every visit
//   'daily' { day? } → that day's Daily Quiz: questions, every participant (full names), all days
//   'settings' → { notice, morning }            site notice + morning reminder text
//   'save-settings' { notice?, morning? } → saves them (notice shows on every page)
//   'push' { title, body, url } → one notification to every subscriber now (5 per hour)
// Usage comes from the visitors heartbeat (usage_sessions): one beat ≈ one minute with the
// site open and visible. Full names are only ever sent here, after the password check.
import { QUESTION_MAP } from '../../data/questions/index.js';
import { examRef } from '../../assets/js/shared/source.js';
import { dhakaDay, DAY_RE } from '../../assets/js/shared/daily.js';
import { EXAM_POINTS } from '../../assets/js/shared/scoring.js';
import { route } from '../route.js';
import { json, readJSON, iso, clean, BadRequest } from '../http.js';
import { requireAdmin } from '../admin.js';
import { limit } from '../ratelimit.js';
import { ONLINE_SEC } from './visitors.js';
import { getSetting, putSetting, vapidKeys, sendAll, MORNING } from './push.js';

const BD = "AT TIME ZONE 'Asia/Dhaka'";
const TODAY = `(now() ${BD})::date`;
const POINTS = `(CASE WHEN a.mode = 'fun' THEN a.score ELSE GREATEST(0, a.correct * ${EXAM_POINTS.correct} - a.wrong * ${EXAM_POINTS.wrong}) END)`;

/** A link students can follow from a notice or notification: a page of this site or an https address. */
export function safeLink(value) {
  const v = String(value ?? '').trim();
  if (!v) return '';
  if (/^#[\w/-]{0,80}$/.test(v)) return v;
  if (/^\/(#[\w/-]{0,80})?$/.test(v)) return v;
  try {
    const url = new URL(v);
    return url.protocol === 'https:' && v.length <= 300 ? url.href : '';
  } catch { return ''; }
}

const roll = r => String(r).padStart(3, '0');

async function overview(db, days) {
  const [[summary], daily, students, sessions] = await db.batch([
    [`SELECT
        (SELECT count(*)::int FROM presence WHERE at >= now() - interval '${ONLINE_SEC} seconds') AS online,
        (SELECT count(*)::int FROM daily_visits WHERE day = ${TODAY}) AS visitors_today,
        (SELECT count(DISTINCT player_id)::int FROM usage_sessions WHERE player_id IS NOT NULL AND (last_at ${BD})::date = ${TODAY}) AS students_today,
        (SELECT COALESCE(sum(beats), 0)::int FROM usage_sessions WHERE (last_at ${BD})::date = ${TODAY}) AS minutes_today,
        (SELECT count(*)::int FROM students) AS students_total,
        (SELECT count(*)::int FROM students WHERE (created_at ${BD})::date = ${TODAY}) AS signups_today,
        (SELECT count(*)::int FROM score_attempts WHERE (at ${BD})::date = ${TODAY}) AS tests_today,
        (SELECT count(*)::int FROM score_attempts) AS tests_total,
        (SELECT count(*)::int FROM daily_attempts WHERE day = ${TODAY}) AS daily_today,
        (SELECT count(*)::int FROM push_subs) AS push_subs,
        (SELECT count(*)::int FROM threads) AS threads_total`],
    // One row per day (Bangladesh time), days without activity included.
    [`WITH d AS (SELECT generate_series(${TODAY} - ($1::int - 1), ${TODAY}, interval '1 day')::date AS day)
      SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
        (SELECT count(DISTINCT sid) FROM usage_sessions u WHERE (u.started_at ${BD})::date = d.day)::int AS visitors,
        (SELECT count(DISTINCT player_id) FROM usage_sessions u WHERE u.player_id IS NOT NULL AND (u.started_at ${BD})::date = d.day)::int AS students,
        (SELECT COALESCE(sum(beats), 0) FROM usage_sessions u WHERE (u.started_at ${BD})::date = d.day)::int AS minutes,
        (SELECT count(*) FROM usage_sessions u WHERE (u.started_at ${BD})::date = d.day)::int AS sessions,
        (SELECT count(*) FROM score_attempts a WHERE (a.at ${BD})::date = d.day)::int AS tests,
        (SELECT count(*) FROM daily_attempts x WHERE x.day = d.day)::int AS daily,
        (SELECT count(*) FROM students s WHERE (s.created_at ${BD})::date = d.day)::int AS signups
      FROM d ORDER BY d.day DESC`, [days]],
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
  return {
    days,
    summary,
    daily,
    students: students.map(r => ({ ...r, first_today: iso(r.first_today), last_at: iso(r.last_at) })),
    sessions: sessions.map(r => ({ name: r.name, roll: r.roll, from: iso(r.started_at), to: iso(r.last_at), minutes: r.minutes })),
  };
}

async function students(db, q) {
  const text = clean(q, 60);
  const rows = await db.query(
    `SELECT s.name, s.roll, s.college, s.created_at, s.last_seen_at,
        (SELECT count(*) FROM score_attempts a WHERE a.player_id = s.id)::int AS tests,
        (SELECT COALESCE(round(sum(${POINTS})), 0) FROM score_attempts a WHERE a.player_id = s.id)::int AS points,
        (SELECT COALESCE(sum(a.correct), 0) FROM score_attempts a WHERE a.player_id = s.id)::int AS correct,
        (SELECT COALESCE(sum(a.total), 0) FROM score_attempts a WHERE a.player_id = s.id)::int AS answered,
        (SELECT count(*) FROM daily_attempts d WHERE d.player_id = s.id)::int AS daily_days,
        (SELECT COALESCE(sum(beats), 0) FROM usage_sessions u WHERE u.player_id = s.id)::int AS minutes
      FROM students s
      WHERE $1 = '' OR s.name ILIKE $2 OR COALESCE(s.college, '') ILIKE $2 OR s.roll::text = ltrim($1, '0')
      ORDER BY s.last_seen_at DESC LIMIT 100`,
    [text, `%${text.replace(/[%_\\]/g, c => `\\${c}`)}%`],
  );
  return { q: text, students: rows.map(r => ({ ...r, tag: `${r.name}.${roll(r.roll)}`, created_at: iso(r.created_at), last_seen_at: iso(r.last_seen_at) })) };
}

// One Bangladesh day of usage_sessions, by the day a visit started.
const ON_DAY = `(u.started_at ${BD})::date = $1::date`;

async function usage(db, day, r) {
  const d = DAY_RE.test(day || '') ? day : dhakaDay();
  const [online, people, [anon], days] = await db.batch([
    // Every browser open right now, with the visit it is on (name if signed in).
    [`SELECT s.name, s.roll, s.college, u.started_at, u.beats AS minutes, p.at,
        (SELECT COALESCE(sum(x.beats), 0) FROM usage_sessions x WHERE x.sid = p.sid AND (x.started_at ${BD})::date = ${TODAY})::int AS minutes_today
      FROM presence p
      LEFT JOIN LATERAL (SELECT * FROM usage_sessions x WHERE x.sid = p.sid ORDER BY x.last_at DESC LIMIT 1) u ON true
      LEFT JOIN students s ON s.id = u.player_id
      WHERE p.at >= now() - interval '${ONLINE_SEC} seconds'
      ORDER BY s.name IS NULL, u.started_at`],
    // Everyone with a name on that day: total minutes, visits, first and last time.
    [`SELECT s.name, s.roll, s.college, sum(u.beats)::int AS minutes, count(*)::int AS sessions,
        min(u.started_at) AS first_at, max(u.last_at) AS last_at
      FROM usage_sessions u JOIN students s ON s.id = u.player_id
      WHERE ${ON_DAY} GROUP BY s.id ORDER BY minutes DESC, last_at DESC LIMIT 500`, [d]],
    [`SELECT count(DISTINCT sid)::int AS visitors, COALESCE(sum(beats), 0)::int AS minutes
      FROM usage_sessions u WHERE u.player_id IS NULL AND ${ON_DAY}`, [d]],
    [`SELECT to_char((started_at ${BD})::date, 'YYYY-MM-DD') AS day, count(DISTINCT player_id)::int AS students,
        count(DISTINCT sid)::int AS visitors, sum(beats)::int AS minutes
      FROM usage_sessions WHERE started_at >= now() - interval '30 days' GROUP BY 1 ORDER BY 1 DESC`],
  ]);
  const out = {
    day: d,
    online: online.map(o => ({ name: o.name, roll: o.roll, college: o.college, from: iso(o.started_at), minutes: o.minutes || 0, minutes_today: o.minutes_today, seen: iso(o.at) })),
    people: people.map(x => ({ ...x, first_at: iso(x.first_at), last_at: iso(x.last_at) })),
    anon,
    days,
  };
  const n = Number.parseInt(String(r ?? '').replace(/\D/g, ''), 10);
  if (n > 0) out.student = await studentUsage(db, n);
  return out;
}

/** One student (by roll): minutes on each of the last 30 days and every visit. */
async function studentUsage(db, r) {
  const [[s]] = await db.batch([['SELECT id, name, roll, college, created_at, last_seen_at FROM students WHERE roll = $1', [r]]]);
  if (!s) return null;
  const [perDay, visits] = await db.batch([
    [`SELECT to_char((started_at ${BD})::date, 'YYYY-MM-DD') AS day, sum(beats)::int AS minutes, count(*)::int AS sessions
      FROM usage_sessions WHERE player_id = $1 GROUP BY 1 ORDER BY 1 DESC LIMIT 60`, [s.id]],
    ['SELECT started_at, last_at, beats FROM usage_sessions WHERE player_id = $1 ORDER BY started_at DESC LIMIT 100', [s.id]],
  ]);
  return {
    name: s.name, roll: s.roll, college: s.college, created_at: iso(s.created_at), last_seen_at: iso(s.last_seen_at),
    minutes: perDay.reduce((t, x) => t + x.minutes, 0),
    days: perDay,
    visits: visits.map(v => ({ from: iso(v.started_at), to: iso(v.last_at), minutes: v.beats })),
  };
}

async function dailyDetail(db, day) {
  const d = DAY_RE.test(day || '') ? day : dhakaDay();
  const [sets, rows, days] = await db.batch([
    ['SELECT ids FROM daily_sets WHERE day = $1::date', [d]],
    [`SELECT s.name, s.roll, s.college, a.score, a.marks, a.correct, a.wrong, a.total, a.time_sec, a.at,
        row_number() OVER (ORDER BY a.score DESC, a.correct DESC, a.time_sec ASC, a.at ASC)::int AS rank
      FROM daily_attempts a JOIN students s ON s.id = a.player_id WHERE a.day = $1::date ORDER BY rank`, [d]],
    [`SELECT to_char(x.day, 'YYYY-MM-DD') AS day, (SELECT count(*) FROM daily_attempts a WHERE a.day = x.day)::int AS participants
      FROM daily_sets x ORDER BY x.day DESC LIMIT 60`],
  ]);
  const ids = sets[0]?.ids || [];
  return {
    day: d,
    days,
    questions: ids.map(id => QUESTION_MAP.get(id)).filter(Boolean).map(q => ({ id: q.id, q: q.q, answer: q.o[q.a], ref: examRef(q.source), topic: q.topic })),
    rows: rows.map(r => ({ ...r, score: Number(r.score), marks: Number(r.marks), at: iso(r.at) })),
  };
}

async function settings(db) {
  const [notice, morning] = await Promise.all([getSetting(db, 'notice'), getSetting(db, 'morning')]);
  return { notice: notice || { on: false, text: '', url: '' }, morning: morning || { title: MORNING.title, body: MORNING.body } };
}

async function saveSettings(db, body) {
  if (body.notice) {
    const text = clean(body.notice.text, 200);
    const url = safeLink(body.notice.url);
    if (body.notice.url && !url) throw new BadRequest('Link হবে site-এর একটা পাতা (যেমন #daily) বা https:// দিয়ে শুরু।');
    if (body.notice.on && !text) throw new BadRequest('Notice চালু করতে লেখা দাও।');
    // A new id each time the text changes, so students who closed the old notice see the new one.
    const old = await getSetting(db, 'notice');
    const id = old?.text === text && old?.url === url ? old.id : Date.now().toString(36);
    await putSetting(db, 'notice', { on: !!body.notice.on, text, url, id });
  }
  if (body.morning) {
    const title = clean(body.morning.title, 80) || MORNING.title;
    const text = clean(body.morning.body, 200) || MORNING.body;
    await putSetting(db, 'morning', { title, body: text });
  }
  return settings(db);
}

async function sendNow(db, env, request, body) {
  const keys = vapidKeys(env);
  if (!keys) throw new BadRequest('Notification-এর key (VAPID_PRIVATE_JWK) এই server-এ set করা নেই।', 503);
  const title = clean(body.title, 80);
  const text = clean(body.body, 200);
  const url = safeLink(body.url) || '/#home';
  if (!title || !text) throw new BadRequest('শিরোনাম আর লেখা—দুটোই দাও।');
  await limit(db, request, 'admin-push', 5, 3600, 'এক ঘণ্টায় ৫টির বেশি notification পাঠানো যাবে না।');
  await putSetting(db, 'push_message', { title, body: text, url, date: dhakaDay() });
  const subs = await db.query('SELECT endpoint FROM push_subs LIMIT 5000');
  return { result: await sendAll(db, keys, subs, fetch) };
}

export default route('admin', {
  async POST(request, db, env) {
    const body = await readJSON(request, 4_000);
    await requireAdmin(body.password, env, db, request);
    const days = Math.min(60, Math.max(1, Number.parseInt(body.days, 10) || 7));
    const action = String(body.action || '');
    let data;
    if (!action) data = await overview(db, days);
    else if (action === 'students') data = await students(db, body.q);
    else if (action === 'usage') data = await usage(db, body.day, body.roll);
    else if (action === 'daily') data = await dailyDetail(db, body.day);
    else if (action === 'settings') data = await settings(db);
    else if (action === 'save-settings') data = await saveSettings(db, body);
    else if (action === 'push') data = await sendNow(db, env, request, body);
    else throw new BadRequest('Unknown action.');
    return json({ ok: true, ...data }, 200, { 'Cache-Control': 'no-store' });
  },
}, 'Admin dashboard এখন লোড করা গেল না—একটু পরে আবার চেষ্টা করো।');
