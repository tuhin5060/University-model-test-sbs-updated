// Daily Quiz: 20 past-year questions a day, the same for everyone, one ranked try each.
//
// GET  ?day=YYYY-MM-DD (default today) → { today, day, ids, participants, board, mine, days }
//      Today's set is made (and locked in daily_sets) the first time anyone asks for it,
//      continuing the no-repeat rotation of the previous day (shared/daily.js).
// POST { playerId, attemptId, day, answers: [{ id, choice }], timeSec }
//      → { entry, rank } · 409 { code: 'already' } when this student already took that day's quiz.
// The score is recomputed here with the Model Test rules (−0.25 per wrong answer).
import { QUESTIONS, QUESTION_MAP } from '../../data/questions/index.js';
import { scoreAttempt, EXAM_NEGATIVE } from '../../assets/js/shared/scoring.js';
import { pickDaily, dhakaDay, shiftDay, DAY_RE, DAILY_SECONDS } from '../../assets/js/shared/daily.js';
import { publicTag } from '../../assets/js/shared/names.js';
import { route } from '../route.js';
import { json, clean, readCookie, readJSON, query, iso, ID_RE, BadRequest } from '../http.js';
import { limit } from '../ratelimit.js';

const ORDER = 'score DESC, correct DESC, time_sec ASC, at ASC';
const RANKED = `SELECT a.*, row_number() OVER (ORDER BY ${ORDER})::int AS rank, count(*) OVER ()::int AS players
  FROM daily_attempts a WHERE a.day = $1::date`;

/** The day's question ids; today's set is created on first use. Past days without a set → null. */
export async function daySet(db, day, today = dhakaDay(), questions = QUESTIONS) {
  const [row] = await db.query('SELECT ids FROM daily_sets WHERE day = $1::date', [day]);
  if (row || day !== today) return row?.ids || null;
  const [prev] = await db.query('SELECT meta FROM daily_sets WHERE day < $1::date ORDER BY day DESC LIMIT 1', [day]);
  const { ids, state } = pickDaily(day, questions, prev?.meta || {});
  // Two first visitors at the same moment compute the same set; the second insert is ignored.
  await db.query('INSERT INTO daily_sets (day, ids, meta) VALUES ($1::date, $2::jsonb, $3::jsonb) ON CONFLICT (day) DO NOTHING', [day, JSON.stringify(ids), JSON.stringify(state)]);
  return (await db.query('SELECT ids FROM daily_sets WHERE day = $1::date', [day]))[0].ids;
}

const boardRow = r => ({
  rank: r.rank,
  tag: publicTag(r.name, r.roll),
  avatar: r.avatar || '🚂',
  college: r.college || null,
  score: Number(r.score),
  marks: Number(r.marks),
  correct: r.correct,
  wrong: r.wrong,
  total: r.total,
  timeSec: r.time_sec,
});

const mineRow = r => (r ? {
  rank: r.rank,
  players: r.players,
  score: Number(r.score),
  marks: Number(r.marks),
  correct: r.correct,
  wrong: r.wrong,
  total: r.total,
  timeSec: r.time_sec,
  answers: r.answers,
  at: iso(r.at),
} : null);

export default route('daily', {
  async GET(request, db) {
    const q = query(request);
    const today = dhakaDay();
    const day = DAY_RE.test(q.day || '') && q.day <= today ? q.day : today;
    const ids = await daySet(db, day, today);
    if (!ids) return json({ ok: false, error: 'এই দিনে কোনো Daily Quiz ছিল না।' }, 404);
    const me = readCookie(request) || '00000000-0000-4000-8000-000000000000';
    const [board, mine, days, myDays] = await db.batch([
      [`WITH r AS (${RANKED}) SELECT r.*, s.name, s.roll, s.avatar, s.college FROM r JOIN students s ON s.id = r.player_id ORDER BY r.rank LIMIT 20`, [day]],
      [`WITH r AS (${RANKED}) SELECT * FROM r WHERE player_id = $2::uuid`, [day, me]],
      [`SELECT d.day::text AS day, (SELECT count(*) FROM daily_attempts a WHERE a.day = d.day)::int AS participants
        FROM daily_sets d WHERE d.day <= $1::date ORDER BY d.day DESC LIMIT 60`, [today]],
      [`WITH r AS (SELECT day, player_id, score, marks, row_number() OVER (PARTITION BY day ORDER BY ${ORDER})::int AS rank
          FROM daily_attempts WHERE day > $1::date - 60)
        SELECT day::text AS day, score, marks, rank FROM r WHERE player_id = $2::uuid`, [today, me]],
    ]);
    const mineByDay = new Map(myDays.map(r => [r.day, { score: Number(r.score), marks: Number(r.marks), rank: r.rank }]));
    return json({
      ok: true,
      today,
      day,
      ids,
      participants: board[0]?.players || 0,
      board: board.map(boardRow),
      mine: mineRow(mine[0]),
      days: days.map(d => ({ day: d.day, participants: d.participants, mine: mineByDay.get(d.day) || null })),
    });
  },

  async POST(request, db) {
    const body = await readJSON(request, 20_000);
    const playerId = String(body.playerId || '');
    if (!ID_RE.test(playerId)) throw new BadRequest('Register a student name before submitting a score.');
    const cookieId = readCookie(request);
    if (cookieId && cookieId !== playerId) throw new BadRequest('This score belongs to a different student on this browser.', 403);
    const day = String(body.day || '');
    const today = dhakaDay();
    // Today's quiz, or yesterday's when it was taken before midnight and sent later (offline).
    if (!DAY_RE.test(day) || (day !== today && day !== shiftDay(today, -1))) throw new BadRequest('এই দিনের Daily Quiz-এর সময় শেষ হয়ে গেছে।');
    await limit(db, request, 'daily', 120, 600);
    const attemptId = clean(body.attemptId, 100) || crypto.randomUUID();
    const [students, sets, already] = await db.batch([
      ['SELECT id, name, roll, avatar FROM students WHERE id = $1::uuid', [playerId]],
      ['SELECT ids FROM daily_sets WHERE day = $1::date', [day]],
      ['SELECT attempt_id FROM daily_attempts WHERE day = $1::date AND player_id = $2::uuid', [day, playerId]],
    ]);
    const student = students[0];
    if (!student) throw new BadRequest('Student profile not found. Please save your name and try again.', 401);
    const ids = sets[0]?.ids;
    if (!ids) throw new BadRequest('এই দিনের Daily Quiz পাওয়া যায়নি।', 404);

    const ranked = async () => (await db.query(`WITH r AS (${RANKED}) SELECT * FROM r WHERE player_id = $2::uuid`, [day, playerId]))[0];
    if (already[0]) {
      const r = await ranked();
      if (already[0].attempt_id !== attemptId) {
        throw new BadRequest('এই দিনের Daily Quiz তুমি আগেই দিয়েছ—একদিনে একবারই গণনা হয়।', 409, { code: 'already', mine: mineRow(r) });
      }
      return json({ ok: true, duplicate: true, entry: { day, ...mineRow(r) }, rank: { rank: r.rank, players: r.players } });
    }

    // The answer sheet must be exactly that day's questions, each once.
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const want = new Set(ids);
    const seen = new Set();
    for (const a of answers) {
      const qn = a && QUESTION_MAP.get(a.id);
      if (!qn || !want.has(a.id) || seen.has(a.id)) throw new BadRequest('Answer sheet does not match this day\'s questions.');
      if (!Number.isInteger(a.choice) || a.choice < -1 || a.choice >= qn.o.length) throw new BadRequest('Invalid answer choice.');
      seen.add(a.id);
    }
    if (seen.size !== ids.filter(id => QUESTION_MAP.has(id)).length) throw new BadRequest('Answer sheet does not match this day\'s questions.');

    const sheet = answers.map(a => ({ id: a.id, choice: a.choice }));
    const r = scoreAttempt({ mode: 'exam', settings: { pace: 'admission', negative: EXAM_NEGATIVE }, answers: sheet }, QUESTION_MAP);
    const timeSec = Math.min(DAILY_SECONDS + 30, Math.max(0, Math.round(Number(body.timeSec) || 0)));
    const [[top], inserted] = await db.batch([
      ['SELECT max(score)::float AS top, count(*)::int AS players FROM daily_attempts WHERE day = $1::date', [day]],
      [`INSERT INTO daily_attempts (day, player_id, attempt_id, score, marks, correct, wrong, total, time_sec, answers)
        VALUES ($1::date, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10::jsonb) ON CONFLICT DO NOTHING RETURNING attempt_id`,
        [day, playerId, attemptId, r.score, r.marks, r.correct, r.wrong, r.total, timeSec, JSON.stringify(sheet)]],
    ]);
    if (!inserted.length) throw new BadRequest('এই দিনের Daily Quiz তুমি আগেই দিয়েছ—একদিনে একবারই গণনা হয়।', 409, { code: 'already', mine: mineRow(await ranked()) });
    // The day's new highest score (someone else already took it) → a popup for everyone online.
    if (day === today && r.score > 0 && top.players > 0 && r.score > top.top) {
      await db.query('INSERT INTO events (kind, payload) VALUES ($1, $2::jsonb)',
        ['top', JSON.stringify({ tag: publicTag(student.name, student.roll), avatar: student.avatar, mode: 'daily', topic: 'daily', score: r.score, playerId })]);
    }
    const mine = await ranked();
    return json({ ok: true, entry: { day, ...mineRow(mine) }, rank: { rank: mine.rank, players: mine.players } }, 201);
  },
}, 'Daily Quiz is unavailable right now.');
