// Leaderboard, personal score stats and score submission.
// Scores are always recomputed here from the answer sheet (shared/scoring.js);
// the browser's own score is never trusted.
import { QUESTION_MAP, TOPICS, GROUPS, inTopic } from '../../data/questions/index.js';
import { scoreAttempt, MAX_QUESTIONS, FUN_LIMIT, EXAM_NEGATIVE, EXAM_PACE } from '../../assets/js/shared/scoring.js';
import { route } from '../route.js';
import { json, clean, readCookie, readJSON, query, iso, ID_RE } from '../http.js';
import { rollText } from './profile.js';
import { limit } from '../ratelimit.js';

const RATE_WINDOW_MIN = 10;
const RATE_MAX = 20; // submissions per student per window
export const TOPIC_IDS = new Set(['all', ...Object.keys(GROUPS), ...TOPICS.map(t => t.id)]);
const ORDER = 'score DESC, correct DESC, time_sec ASC, at ASC';

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

// Each student's best attempt on one board (mode + topic; topic 'all' = every topic).
const BEST = `SELECT DISTINCT ON (player_id) player_id, topic, score, correct, total, best_streak, time_sec, at
  FROM score_attempts WHERE mode = $1 AND ($2 = 'all' OR topic = $2)
  ORDER BY player_id, ${ORDER}`;

const BOARD = `WITH best AS (${BEST}),
  n AS (SELECT player_id, count(*)::int AS attempts FROM score_attempts WHERE mode = $1 AND ($2 = 'all' OR topic = $2) GROUP BY player_id)
  SELECT b.*, n.attempts, s.name, s.roll, s.avatar, s.college
  FROM best b JOIN n USING (player_id) JOIN students s ON s.id = b.player_id
  ORDER BY ${ORDER} LIMIT 100`;

const RANK = `WITH best AS (${BEST}),
  r AS (SELECT player_id, row_number() OVER (ORDER BY ${ORDER})::int AS rank, count(*) OVER ()::int AS players FROM best)
  SELECT rank, players FROM r WHERE player_id = $3`;

const row = (r, me) => ({
  name: r.name,
  roll: r.roll,
  tag: `${r.name}.${rollText(r.roll)}`,
  avatar: r.avatar || '🚂',
  college: r.college || null,
  topic: r.topic,
  score: Number(r.score),
  correct: r.correct,
  total: r.total,
  bestStreak: r.best_streak,
  timeSec: r.time_sec,
  at: iso(r.at),
  attempts: r.attempts,
  me: !!me && r.player_id === me,
});

async function myStats(db, me) {
  const [modes, ranks, recent, topics] = await db.batch([
    [`SELECT mode, count(*)::int AS tests, max(score)::float AS best, round(avg(score)::numeric, 1)::float AS avg,
        sum(correct)::int AS correct, sum(wrong)::int AS wrong, sum(total)::int AS answered
      FROM score_attempts WHERE player_id = $1 GROUP BY mode`, [me]],
    [`WITH best AS (SELECT DISTINCT ON (mode, player_id) mode, player_id, score, correct, time_sec, at FROM score_attempts ORDER BY mode, player_id, ${ORDER}),
      r AS (SELECT mode, player_id, row_number() OVER (PARTITION BY mode ORDER BY ${ORDER})::int AS rank, count(*) OVER (PARTITION BY mode)::int AS players FROM best)
      SELECT mode, rank, players FROM r WHERE player_id = $1`, [me]],
    [`SELECT attempt_id, topic, mode, score, correct, wrong, total, time_sec, at FROM score_attempts WHERE player_id = $1 ORDER BY at DESC LIMIT 20`, [me]],
    // Per board (mode + topic) this student played: tests, best, average and position on that board.
    [`WITH mine AS (SELECT mode, topic, count(*)::int AS tests, max(score)::float AS best, round(avg(score)::numeric, 1)::float AS avg, max(at) AS last
        FROM score_attempts WHERE player_id = $1 GROUP BY mode, topic),
      best AS (SELECT DISTINCT ON (a.mode, a.topic, a.player_id) a.mode, a.topic, a.player_id, a.score, a.correct, a.time_sec, a.at
        FROM score_attempts a JOIN mine m ON m.mode = a.mode AND m.topic = a.topic ORDER BY a.mode, a.topic, a.player_id, ${ORDER}),
      r AS (SELECT mode, topic, player_id, row_number() OVER (PARTITION BY mode, topic ORDER BY ${ORDER})::int AS rank,
        count(*) OVER (PARTITION BY mode, topic)::int AS players FROM best)
      SELECT m.mode, m.topic, m.tests, m.best, m.avg, r.rank, r.players FROM mine m
      JOIN r ON r.mode = m.mode AND r.topic = m.topic AND r.player_id = $1 ORDER BY m.last DESC LIMIT 40`, [me]],
  ]);
  const stats = {};
  for (const m of ['fun', 'exam']) {
    const s = modes.find(x => x.mode === m);
    const r = ranks.find(x => x.mode === m);
    stats[m] = s ? { tests: s.tests, best: s.best, avg: s.avg, correct: s.correct, wrong: s.wrong, answered: s.answered, rank: r?.rank ?? null, players: r?.players ?? null } : null;
  }
  return {
    stats,
    topics: topics.map(t => ({ mode: t.mode, topic: t.topic, tests: t.tests, best: t.best, avg: t.avg, rank: t.rank, players: t.players })),
    recent: recent.map(a => ({ id: a.attempt_id, topic: a.topic, mode: a.mode, score: Number(a.score), correct: a.correct, wrong: a.wrong, total: a.total, timeSec: a.time_sec, at: iso(a.at) })),
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
    const mode = q.mode === 'exam' ? 'exam' : 'fun';
    const topic = TOPIC_IDS.has(q.topic) ? q.topic : 'all';
    // The same for everyone (the browser marks its own row), so Vercel's edge can keep it
    // for 20 s: a flood of leaderboard requests then barely reaches the database.
    const rows = (await db.query(BOARD, [mode, topic])).map(r => row(r, null));
    return json({ ok: true, mode, topic, rows }, 200, { 'Cache-Control': 'public, max-age=0, s-maxage=20, stale-while-revalidate=60' });
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
    const tag = `${student.name}.${rollText(student.roll)}`;
    const writes = [
      [`INSERT INTO score_attempts (attempt_id, player_id, topic, mode, score, correct, wrong, total, best_streak, time_sec)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (attempt_id) DO NOTHING`,
        [attemptId, playerId, entry.topic, entry.mode, entry.score, entry.correct, entry.wrong, entry.total, entry.bestStreak, entry.timeSec]],
      ['UPDATE students SET last_seen_at = now() WHERE id = $1', [playerId]],
      [RANK, [entry.mode, entry.topic, playerId]],
    ];
    if (newTop) {
      writes.push(['INSERT INTO events (kind, payload) VALUES ($1, $2)',
        ['top', JSON.stringify({ tag, avatar: student.avatar, mode: entry.mode, topic: entry.topic, score: entry.score, playerId })]]);
    }
    const results = await db.batch(writes);
    const { playerId: _p, ...safe } = entry;
    return json({ ok: true, entry: safe, rank: results[2][0] || null, newTop }, 201);
  },
}, 'Could not read or save the leaderboard right now.');
