import { randomUUID } from 'node:crypto';
import { getDatabase } from '../lib/mongodb.js';
import { readCookie, ID_RE, parseBody, clean, sendJSON } from '../lib/http.js';
import { QUESTION_MAP, TOPICS } from '../data/questions/index.js';
import { scoreAttempt, MAX_QUESTIONS, FUN_SECONDS, EXAM_PACE } from '../assets/js/shared/scoring.js';

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 20; // submissions per student per window
const TOPIC_IDS = new Set(['all', ...TOPICS.map(t => t.id)]);

/** Validate the submitted answer sheet. Returns an error string or null. */
export function validateSubmission(body) {
  if (!['fun', 'exam'].includes(body.mode)) return 'Only Fun Quiz and Model Test scores are ranked.';
  if (!TOPIC_IDS.has(body.topic)) return 'Unknown topic.';
  const answers = body.answers;
  if (!Array.isArray(answers) || answers.length < 1 || answers.length > MAX_QUESTIONS) return `Between 1 and ${MAX_QUESTIONS} answers are required.`;
  const seen = new Set();
  const limit = FUN_SECONDS.includes(Number(body.settings?.perQuestion)) ? Number(body.settings.perQuestion) : 30;
  for (const a of answers) {
    const q = a && QUESTION_MAP.get(a.id);
    if (!q) return 'Unknown question in answer sheet.';
    if (seen.has(a.id)) return 'Duplicate question in answer sheet.';
    seen.add(a.id);
    if (body.topic !== 'all' && q.topicId !== body.topic) return 'Question does not belong to this topic.';
    if (!Number.isInteger(a.choice) || a.choice < -1 || a.choice >= q.o.length) return 'Invalid answer choice.';
    if (body.mode === 'fun' && a.sec !== undefined && !(Number(a.sec) >= 0 && Number(a.sec) <= limit)) return 'Invalid answer time.';
  }
  return null;
}

/** Build the stored entry from a validated submission (score is recomputed here, never trusted). */
export function buildEntry(body, student, attemptId) {
  const settings = body.mode === 'fun'
    ? { perQuestion: FUN_SECONDS.includes(Number(body.settings?.perQuestion)) ? Number(body.settings.perQuestion) : 30 }
    : { pace: body.settings?.pace in EXAM_PACE ? body.settings.pace : 'admission', negative: Number(body.settings?.negative) === 0.25 ? 0.25 : 0 };
  const answers = body.answers.map(a => ({ id: a.id, choice: a.choice, sec: Number(a.sec) || 0, frozen: a.frozen === true }));
  const r = scoreAttempt({ mode: body.mode, settings, answers }, QUESTION_MAP);
  const maxTime = body.mode === 'exam' ? answers.length * EXAM_PACE[settings.pace] + 30 : answers.length * settings.perQuestion + 600;
  return {
    attemptId,
    playerId: student._id,
    name: student.name,
    avatar: student.avatar || '🚂',
    topic: body.topic,
    mode: body.mode,
    settings,
    score: r.score,
    correct: r.correct,
    wrong: r.wrong,
    total: r.total,
    bestStreak: r.bestStreak,
    timeSec: Math.min(maxTime, Math.max(0, Math.round(Number(body.timeSec) || 0))),
    at: new Date().toISOString(),
    v: 2,
  };
}

export function leaderboardPipeline(mode, topic, limit = 100) {
  const match = { playerId: { $type: 'string' }, score: { $type: 'number' }, mode: mode === 'exam' ? { $in: ['exam', 'test'] } : 'fun' };
  // v1 stored topic titles ("Tense"); v2 stores ids ("tense").
  if (topic !== 'all') match.topic = { $in: [topic, TOPICS.find(t => t.id === topic)?.title].filter(Boolean) };
  return [
    { $match: match },
    { $sort: { score: -1, correct: -1, timeSec: 1, at: 1 } },
    { $group: { _id: '$playerId', best: { $first: '$$ROOT' }, attempts: { $sum: 1 } } },
    { $replaceRoot: { newRoot: { $mergeObjects: ['$best', { attempts: '$attempts' }] } } },
    { $sort: { score: -1, correct: -1, timeSec: 1 } },
    { $limit: limit },
    { $project: { _id: 0, playerId: 1, name: 1, avatar: 1, topic: 1, mode: 1, score: 1, correct: 1, total: 1, bestStreak: 1, timeSec: 1, at: 1, attempts: 1 } },
  ];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const db = await getDatabase();
    const attempts = db.collection('scoreAttempts');

    if (req.method === 'GET') {
      const mode = req.query?.mode === 'exam' ? 'exam' : 'fun';
      const topic = TOPIC_IDS.has(req.query?.topic) ? req.query.topic : 'all';
      const me = readCookie(req);
      const rows = (await attempts.aggregate(leaderboardPipeline(mode, topic)).toArray()).map(({ playerId, ...r }) => ({
        ...r,
        me: !!me && playerId === me,
      }));
      return sendJSON(res, 200, { ok: true, mode, topic, rows });
    }

    if (req.method === 'POST') {
      let body;
      try { body = parseBody(req); } catch { return sendJSON(res, 400, { ok: false, error: 'Invalid JSON.' }); }
      const playerId = String(body.playerId || '');
      if (!ID_RE.test(playerId)) return sendJSON(res, 400, { ok: false, error: 'Register a student name before submitting a score.' });
      const cookieId = readCookie(req);
      if (cookieId && cookieId !== playerId) return sendJSON(res, 403, { ok: false, error: 'This score belongs to a different student on this browser.' });
      const student = await db.collection('students').findOne({ _id: playerId });
      if (!student) return sendJSON(res, 401, { ok: false, error: 'Student profile not found. Please save your name and try again.' });

      const invalid = validateSubmission(body);
      if (invalid) return sendJSON(res, 400, { ok: false, error: invalid });

      const attemptId = clean(body.attemptId, 100) || randomUUID();
      const existing = await attempts.findOne({ attemptId });
      if (existing) {
        if (existing.playerId !== playerId) return sendJSON(res, 409, { ok: false, error: 'This submission ID has already been used.' });
        const { _id, playerId: _p, ...entry } = existing;
        return sendJSON(res, 200, { ok: true, duplicate: true, entry });
      }

      const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
      const recent = await attempts.countDocuments({ playerId, at: { $gte: since } });
      if (recent >= RATE_MAX) return sendJSON(res, 429, { ok: false, error: 'Too many submissions. Take a short break and try again.' });

      const entry = buildEntry(body, student, attemptId);
      try {
        await attempts.insertOne(entry);
      } catch (error) {
        if (error?.code !== 11000) throw error; // duplicate attemptId from a parallel retry
      }
      await db.collection('students').updateOne({ _id: playerId }, { $set: { lastSeenAt: new Date() } });
      const { _id, playerId: _p, ...safe } = entry;
      return sendJSON(res, 201, { ok: true, entry: safe });
    }

    res.setHeader('Allow', 'GET, POST');
    return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('leaderboard API failed', error?.name || 'DatabaseError', error?.message);
    return sendJSON(res, 500, { ok: false, error: 'Could not read or save the leaderboard right now.' });
  }
}
