import { QUESTION_MAP, TOPICS } from "../../data/questions/index.js";
import { scoreAttempt, MAX_QUESTIONS, FUN_LIMIT, EXAM_NEGATIVE, EXAM_PACE } from "../../assets/js/shared/scoring.js";
import { clean, json, PLAYER_COOKIE, readCookie, readJSON, UUID_RE } from "../_lib/shared.js";

const TOPIC_IDS = new Set(["all", ...TOPICS.map(t => t.id)]);
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 20;

function validate(body) {
  if (!["fun", "exam"].includes(body.mode)) return "Only Fun Quiz and Model Test scores are ranked.";
  if (!TOPIC_IDS.has(body.topic)) return "Unknown topic.";
  if (!Array.isArray(body.answers) || body.answers.length < 1 || body.answers.length > MAX_QUESTIONS) return "Between 1 and " + MAX_QUESTIONS + " answers are required.";
  const seen = new Set();
  for (const a of body.answers) {
    const q = a && QUESTION_MAP.get(a.id);
    if (!q) return "Unknown question in answer sheet.";
    if (seen.has(a.id)) return "Duplicate question in answer sheet.";
    seen.add(a.id);
    if (body.topic !== "all" && q.topicId !== body.topic) return "Question does not belong to this topic.";
    if (!Number.isInteger(a.choice) || a.choice < -1 || a.choice >= q.o.length) return "Invalid answer choice.";
    if (body.mode === "fun" && a.sec !== undefined && !(Number(a.sec) >= 0 && Number(a.sec) <= FUN_LIMIT)) return "Invalid answer time.";
  }
  return null;
}
function entryFor(body, student, attemptId) {
  const settings = body.mode === "fun" ? { perQuestion: FUN_LIMIT } : { pace: "admission", negative: EXAM_NEGATIVE };
  const answers = body.answers.map(a => ({ id: a.id, choice: a.choice, sec: Number(a.sec) || 0, frozen: a.frozen === true }));
  const result = scoreAttempt({ mode: body.mode, settings, answers }, QUESTION_MAP);
  const maxTime = body.mode === "exam" ? answers.length * EXAM_PACE.admission + 30 : answers.length * FUN_LIMIT + 600;
  return {
    attemptId, playerId: student.id, name: student.name, avatar: student.avatar || "🚂",
    topic: body.topic, mode: body.mode, score: result.score, correct: result.correct, wrong: result.wrong,
    total: result.total, bestStreak: result.bestStreak,
    timeSec: Math.min(maxTime, Math.max(0, Math.round(Number(body.timeSec) || 0))),
    at: new Date().toISOString()
  };
}
export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return json({ ok: false, error: "Database binding DB is missing." }, 503);
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const mode = url.searchParams.get("mode") === "exam" ? "exam" : "fun";
      const rawTopic = url.searchParams.get("topic") || "all";
      const topic = TOPIC_IDS.has(rawTopic) ? rawTopic : "all";
      const topicTitle = TOPICS.find(t => t.id === topic)?.title || topic;
      const params = [mode, mode === "exam" ? "test" : mode, topic === "all" ? "" : topic, topicTitle];
      const rows = await db.prepare(`
        WITH ranked AS (
          SELECT player_id, name, avatar, topic, mode, score, correct, total, best_streak AS bestStreak,
                 time_sec AS timeSec, at,
                 COUNT(*) OVER (PARTITION BY player_id) AS attempts,
                 ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY score DESC, correct DESC, time_sec ASC, at ASC) AS rn
          FROM score_attempts
          WHERE mode IN (?, ?) AND (? = '' OR topic = ? OR topic = ?)
        )
        SELECT player_id, name, avatar, topic, mode, score, correct, total, bestStreak, timeSec, at, attempts
        FROM ranked WHERE rn = 1
        ORDER BY score DESC, correct DESC, timeSec ASC, at ASC LIMIT 100
      `).bind(params[0], params[1], params[2], params[2], params[3]).all();
      const me = readCookie(request, PLAYER_COOKIE);
      return json({ ok: true, mode, topic, rows: (rows.results || []).map(row => ({ ...row, me: !!me && row.player_id === me, playerId: undefined })).map(({ player_id, ...row }) => row) });
    }
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, { Allow: "GET, POST" });
    const body = await readJSON(request, 100_000);
    const playerId = String(body.playerId || "");
    if (!UUID_RE.test(playerId)) return json({ ok: false, error: "Register a student name before submitting a score." }, 400);
    const cookieId = readCookie(request, PLAYER_COOKIE);
    if (cookieId && cookieId !== playerId) return json({ ok: false, error: "This score belongs to a different student on this browser." }, 403);
    const student = await db.prepare("SELECT id, name, avatar FROM students WHERE id = ?").bind(playerId).first();
    if (!student) return json({ ok: false, error: "Student profile not found. Please save your name and try again." }, 401);
    const invalid = validate(body);
    if (invalid) return json({ ok: false, error: invalid }, 400);

    const attemptId = clean(body.attemptId, 100) || crypto.randomUUID();
    const existing = await db.prepare("SELECT attempt_id, player_id, name, avatar, topic, mode, score, correct, wrong, total, best_streak, time_sec, at FROM score_attempts WHERE attempt_id = ?").bind(attemptId).first();
    if (existing) {
      if (existing.player_id !== playerId) return json({ ok: false, error: "This submission ID has already been used." }, 409);
      return json({ ok: true, duplicate: true, entry: { attemptId: existing.attempt_id, name: existing.name, avatar: existing.avatar, topic: existing.topic, mode: existing.mode, score: existing.score, correct: existing.correct, wrong: existing.wrong, total: existing.total, bestStreak: existing.best_streak, timeSec: existing.time_sec, at: existing.at } });
    }
    const cutoff = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const recent = await db.prepare("SELECT COUNT(*) AS count FROM score_attempts WHERE player_id = ? AND at >= ?").bind(playerId, cutoff).first();
    if ((recent?.count || 0) >= RATE_MAX) return json({ ok: false, error: "Too many submissions. Take a short break and try again." }, 429);
    const entry = entryFor(body, student, attemptId);
    await db.prepare(`INSERT INTO score_attempts (attempt_id, player_id, name, avatar, topic, mode, score, correct, wrong, total, best_streak, time_sec, at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(entry.attemptId, entry.playerId, entry.name, entry.avatar, entry.topic, entry.mode, entry.score, entry.correct, entry.wrong, entry.total, entry.bestStreak, entry.timeSec, entry.at).run();
    await db.prepare("UPDATE students SET last_seen_at = ? WHERE id = ?").bind(new Date().toISOString(), playerId).run();
    const { playerId: _playerId, ...safe } = entry;
    return json({ ok: true, entry: safe }, 201);
  } catch (error) {
    console.error("Cloudflare score API failed", error?.message || "unknown error");
    return json({ ok: false, error: "Could not read or save the leaderboard right now." }, 500);
  }
}
