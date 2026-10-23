// Leaderboard, personal score stats and score submission.
// Scores are always recomputed here from the answer sheet (shared/scoring.js);
// the browser's own score is never trusted.
import { QUESTION_MAP, TOPICS, GROUPS, inTopic } from '../../data/questions/index.js';
import { scoreAttempt, attemptPoints, MAX_QUESTIONS, FUN_LIMIT, EXAM_NEGATIVE, EXAM_PACE, EXAM_POINTS } from '../../assets/js/shared/scoring.js';
import { route } from '../route.js';
import { json, clean, readCookie, readJSON, query, iso, ID_RE } from '../http.js';
import { publicTag } from '../../assets/js/shared/names.js';
import { limit } from '../ratelimit.js';

const RATE_WINDOW_MIN = 10;
const RATE_MAX = 20; // submissions per student per window
export const TOPIC_IDS = new Set(['all', ...Object.keys(GROUPS), ...TOPICS.map(t => t.id)]);

/** Validate the submitted answer sheet. Returns an error string or null. */
export function validateSubmission(body) {
  if (!['fun', 'exam'].includes(body.mode)) return 'Only Fun Quiz and Model Test scores are ranked.';
  if (!TOPIC_IDS.has(body.topic)) return 'Unknown topic.';
  const answers = body.answers;
  if (!Array.isArray(answers) || answers.length < 1 || answers.length > MAX_QUESTIONS) return `Between 1 and ${MAX_QUESTIONS} answers are required.`;
  const seen = new Set();
  for (const a of answers) {
    const q = a && QUESTION_MAP.get(a.id);
    if (!q) return 'Unknown question in answer sheet.';
    if (seen.has(a.id)) return 'Duplicate question in answer sheet.';
    seen.add(a.id);
    if (!inTopic(q, body.topic)) return 'Question does not belong to this topic.';
    if (!Number.isInteger(a.choice) || a.choice < -1 || a.choice >= q.o.length) return 'Invalid answer choice.';
    if (body.mode === 'fun' && a.sec !== undefined && !(Number(a.sec) >= 0 && Number(a.sec) <= FUN_LIMIT)) return 'Invalid answer time.';
  }
  return null;
}

/** The stored entry for a validated submission, with the score recomputed under the fixed rules. */
export function buildEntry(body, playerId, attemptId) {
  const settings = body.mode === 'fun' ? { perQuestion: FUN_LIMIT } : { pace: 'admission', negative: EXAM_NEGATIVE };
  const answers = body.answers.map(a => ({ id: a.id, choice: a.choice, sec: Number(a.sec) || 0, frozen: a.frozen === true }));
  const r = scoreAttempt({ mode: body.mode, settings, answers }, QUESTION_MAP);
  const maxTime = body.mode === 'exam' ? answers.length * EXAM_PACE.admission + 30 : answers.length * FUN_LIMIT + 600;
  return {
    attemptId,
    playerId,
    topic: body.topic,
    mode: body.mode,
    score: r.score,
    correct: r.correct,
    wrong: r.wrong,
    total: r.total,
    bestStreak: r.bestStreak,
    timeSec: Math.min(maxTime, Math.max(0, Math.round(Number(body.timeSec) || 0))),
  };
}

// Points of one stored attempt — the SQL twin of attemptPoints() in shared/scoring.js.
const POINTS = (t = '') => `(CASE WHEN ${t}mode = 'fun' THEN ${t}score ELSE GREATEST(0, ${t}correct * ${EXAM_POINTS.correct} - ${t}wrong * ${EXAM_POINTS.wrong}) END)`;
export const BOARD_MODES = new Set(['all', 'fun', 'exam']);
// A board = the tests of one mode ('all' = both) on one topic ('all' = every topic).
// Each student's points from those tests are added up; ties go to more correct answers,
// then to whoever got there first.
const TOTALS = `SELECT player_id, sum(${POINTS()}) AS pts, count(*)::int AS attempts, sum(correct)::int AS correct, sum(total)::int AS total, max(at) AS at
  FROM score_attempts WHERE ($1 = 'all' OR mode = $1) AND ($2 = 'all' OR topic = $2) GROUP BY player_id`;
const ORDER_TOTAL = 'pts DESC, correct DESC, at ASC';

const BOARD = `WITH t AS (${TOTALS})
  SELECT t.*, round(t.pts)::int AS points, s.name, s.roll, s.avatar, s.college, count(*) OVER ()::int AS players
  FROM t JOIN students s ON s.id = t.player_id
  ORDER BY ${ORDER_TOTAL} LIMIT 100`;

const RANK = `WITH t AS (${TOTALS}),
  r AS (SELECT player_id, round(pts)::int AS points, row_number() OVER (ORDER BY ${ORDER_TOTAL})::int AS rank, count(*) OVER ()::int AS players FROM t)
  SELECT rank, players, points FROM r WHERE player_id = $3`;

// Today's board: points from tests taken since midnight Bangladesh time (every mode and
// topic), same tie-break as the boards. The first row is today's top scorer; nobody with
// 0 points is crowned, but everyone who tested today counts in `players`.
const SINCE_MIDNIGHT = "at >= date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka') AT TIME ZONE 'Asia/Dhaka'";
const TODAY_TOTALS = `SELECT player_id, sum(${POINTS()}) AS pts, count(*)::int AS attempts, sum(correct)::int AS correct, sum(total)::int AS total, max(at) AS at
    FROM score_attempts WHERE ${SINCE_MIDNIGHT} GROUP BY player_id`;
const TODAY_BOARD = `WITH t AS (${TODAY_TOTALS})
  SELECT t.*, round(t.pts)::int AS points, s.name, s.roll, s.avatar, s.college, count(*) OVER ()::int AS players
  FROM t JOIN students s ON s.id = t.player_id
  ORDER BY ${ORDER_TOTAL} LIMIT 10`;

const row = r => ({
  roll: r.roll,
  tag: publicTag(r.name, r.roll), // never the full name: name + roll is the sign-in key
  avatar: r.avatar || '🚂',
  college: r.college || null,
  points: r.points,
  score: r.points, // (older pages read `score`)
  attempts: r.attempts,
  correct: r.correct,
  total: r.total,
  at: iso(r.at),
  me: false, // the same for everyone (cacheable); the browser marks its own row by tag
});

async function myStats(db, me) {
  const [modes, boards, recent, topics, today] = await db.batch([
    [`SELECT mode, count(*)::int AS tests, max(score)::float AS best, round(avg(score)::numeric, 1)::float AS avg,
        sum(correct)::int AS correct, sum(wrong)::int AS wrong, sum(total)::int AS answered
      FROM score_attempts WHERE player_id = $1 GROUP BY mode`, [me]],
    // Total points and position on the all-topics boards: both modes ('all'), Fun, Model Test.
    [`WITH b AS (
        SELECT 'all' AS board, player_id, sum(${POINTS()}) AS pts, sum(correct) AS correct, max(at) AS at FROM score_attempts GROUP BY player_id
        UNION ALL
        SELECT mode, player_id, sum(${POINTS()}), sum(correct), max(at) FROM score_attempts GROUP BY mode, player_id),
      r AS (SELECT board, player_id, round(pts)::int AS points, row_number() OVER (PARTITION BY board ORDER BY ${ORDER_TOTAL})::int AS rank,
        count(*) OVER (PARTITION BY board)::int AS players FROM b)
      SELECT board, points, rank, players FROM r WHERE player_id = $1`, [me]],
    [`SELECT attempt_id, topic, mode, score, correct, wrong, total, time_sec, at FROM score_attempts WHERE player_id = $1 ORDER BY at DESC LIMIT 20`, [me]],
    // Every topic this student played (both modes): tests, points and position on that topic's board.
    [`WITH mine AS (SELECT topic, count(*)::int AS tests, max(at) AS last FROM score_attempts WHERE player_id = $1 GROUP BY topic),
      b AS (SELECT a.topic, a.player_id, sum(${POINTS('a.')}) AS pts, sum(a.correct) AS correct, max(a.at) AS at
        FROM score_attempts a JOIN mine m ON m.topic = a.topic GROUP BY a.topic, a.player_id),
      r AS (SELECT topic, player_id, round(pts)::int AS points, row_number() OVER (PARTITION BY topic ORDER BY ${ORDER_TOTAL})::int AS rank,
        count(*) OVER (PARTITION BY topic)::int AS players FROM b)
      SELECT m.topic, m.tests, r.points, r.rank, r.players FROM mine m
      JOIN r ON r.topic = m.topic AND r.player_id = $1 ORDER BY m.last DESC LIMIT 40`, [me]],
    // Position on today's board (since midnight Bangladesh time), if this student tested today.
    [`WITH t AS (${TODAY_TOTALS}),
      r AS (SELECT player_id, round(pts)::int AS points, attempts, row_number() OVER (ORDER BY ${ORDER_TOTAL})::int AS rank, count(*) OVER ()::int AS players FROM t)
      SELECT points, attempts, rank, players FROM r WHERE player_id = $1`, [me]],
  ]);
  const stats = {};
  for (const m of ['all', 'fun', 'exam']) {
    const board = boards.find(x => x.board === m);
    const rows = m === 'all' ? modes : modes.filter(x => x.mode === m);
    if (!board || !rows.length) { stats[m] = null; continue; }
    const sum = k => rows.reduce((n, x) => n + (x[k] || 0), 0);
    stats[m] = { points: board.points, rank: board.rank, players: board.players, tests: sum('tests'), correct: sum('correct'), wrong: sum('wrong'), answered: sum('answered') };
    if (m !== 'all') Object.assign(stats[m], { best: rows[0].best, avg: rows[0].avg });
  }
  return {
    stats,
    today: today[0] || null,
    topics: topics.map(t => ({ topic: t.topic, tests: t.tests, points: t.points, rank: t.rank, players: t.players })),
    recent: recent.map(a => ({ id: a.attempt_id, topic: a.topic, mode: a.mode, score: Number(a.score), points: attemptPoints({ ...a, score: Number(a.score) }), correct: a.correct, wrong: a.wrong, total: a.total, timeSec: a.time_sec, at: iso(a.at) })),
  };
}

export default route('scores', {
  async GET(request, db) {
    const q = query(request);
    const me = readCookie(request);
    if (q.me !== undefined) {
      if (!me) return json({ ok: true, stats: null, recent: [] });
      return json({ ok: true, ...(await myStats(db, me)) });
    }
    if (q.today !== undefined) {
      const rows = await db.query(TODAY_BOARD);
      const top = rows[0]?.pts > 0 ? row(rows[0]) : null;
      return json({ ok: true, top, rows: rows.map(row), players: rows[0]?.players || 0 }, 200, { 'Cache-Control': 'public, max-age=0, s-maxage=20, stale-while-revalidate=60' });
    }
    const mode = BOARD_MODES.has(q.mode) ? q.mode : 'all';
    const topic = TOPIC_IDS.has(q.topic) ? q.topic : 'all';
    // The same for everyone (the browser marks its own row), so Vercel's edge can keep it
    // for 20 s: a flood of leaderboard requests then barely reaches the database.
    const found = await db.query(BOARD, [mode, topic]);
    return json({ ok: true, mode, topic, players: found[0]?.players || 0, rows: found.map(row) }, 200, { 'Cache-Control': 'public, max-age=0, s-maxage=20, stale-while-revalidate=60' });
  },

  async POST(request, db) {
    const body = await readJSON(request);
    const playerId = String(body.playerId || '');
    if (!ID_RE.test(playerId)) return json({ ok: false, error: 'Register a student name before submitting a score.' }, 400);
    const cookieId = readCookie(request);
    if (cookieId && cookieId !== playerId) return json({ ok: false, error: 'This score belongs to a different student on this browser.' }, 403);
    const invalid = validateSubmission(body);
    if (invalid) return json({ ok: false, error: invalid }, 400);
    await limit(db, request, 'score', 600, 600);

    const attemptId = clean(body.attemptId, 100) || crypto.randomUUID();
    const [students, existing, recent, prev] = await db.batch([
      ['SELECT id, name, roll, avatar FROM students WHERE id = $1', [playerId]],
      ['SELECT player_id, topic, mode, score, correct, wrong, total, best_streak, time_sec FROM score_attempts WHERE attempt_id = $1', [attemptId]],
      [`SELECT count(*)::int AS n FROM score_attempts WHERE player_id = $1 AND at > now() - interval '${RATE_WINDOW_MIN} minutes'`, [playerId]],
      ['SELECT max(score)::float AS top, count(DISTINCT player_id)::int AS players FROM score_attempts WHERE mode = $1 AND topic = $2', [body.mode, body.topic]],
    ]);
    const student = students[0];
    if (!student) return json({ ok: false, error: 'Student profile not found. Please save your name and try again.' }, 401);
    if (existing[0]) {
      const e = existing[0];
      if (e.player_id !== playerId) return json({ ok: false, error: 'This submission ID has already been used.' }, 409);
      return json({ ok: true, duplicate: true, entry: { attemptId, topic: e.topic, mode: e.mode, score: Number(e.score), correct: e.correct, wrong: e.wrong, total: e.total, bestStreak: e.best_streak, timeSec: e.time_sec } });
    }
    if (recent[0].n >= RATE_MAX) return json({ ok: false, error: 'Too many submissions. Take a short break and try again.' }, 429);

    const entry = buildEntry(body, playerId, attemptId);
    // A new highest score on a board someone else has already played → show everyone a popup.
    const { top, players } = prev[0];
    const newTop = entry.score > 0 && players > 0 && top !== null && entry.score > top;
    const tag = publicTag(student.name, student.roll);
    const writes = [
      [`INSERT INTO score_attempts (attempt_id, player_id, topic, mode, score, correct, wrong, total, best_streak, time_sec)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (attempt_id) DO NOTHING`,
        [attemptId, playerId, entry.topic, entry.mode, entry.score, entry.correct, entry.wrong, entry.total, entry.bestStreak, entry.timeSec]],
      ['UPDATE students SET last_seen_at = now() WHERE id = $1', [playerId]],
      [RANK, ['all', 'all', playerId]], // total points and position among everyone
      [RANK, ['all', entry.topic, playerId]], // … and on this topic's board
    ];
    if (newTop) {
      writes.push(['INSERT INTO events (kind, payload) VALUES ($1, $2)',
        ['top', JSON.stringify({ tag, avatar: student.avatar, mode: entry.mode, topic: entry.topic, score: entry.score, playerId })]]);
    }
    const results = await db.batch(writes);
    const { playerId: _p, ...safe } = entry;
    safe.points = attemptPoints(entry);
    return json({ ok: true, entry: safe, rank: results[2][0] || null, topicRank: results[3][0] || null, newTop }, 201);
  },
}, 'Could not read or save the leaderboard right now.');
