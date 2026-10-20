// Quiz engine: creates sessions, records answers, runs timers and finishes
// attempts for all three modes (fun / exam / practice). UI lives in pages/play.js.

import { QUESTIONS, QUESTION_MAP } from '../../data/questions/index.js';
import { scoreAttempt, funPoints, EXAM_PACE, FUN_SECONDS, MAX_QUESTIONS } from './shared/scoring.js';
import { state, save, recordAttempt, updateHistory, mistakeIds } from './lib/store.js';
import { shuffle, seeded, today, uid, toast, navigate } from './lib/dom.js';
import { submitScore, clearBoardCache } from './lib/api.js';
import { topicTitle } from './components.js';

export const session = () => state.session;
export const sessionQuestions = s => (s?.ids || []).map(id => QUESTION_MAP.get(id)).filter(Boolean);
export const currentQuestion = (s = state.session) => (s ? QUESTION_MAP.get(s.ids[s.index || 0]) : null);
export const isAnswered = (s, id) => Number.isInteger(s.answers[id]);
export const isDone = (s, id) => isAnswered(s, id) || (s.fun?.timeouts || []).includes(id);

export function poolFor(topic) {
  if (topic === 'all') return QUESTIONS;
  if (topic === 'mistakes') return mistakeIds().map(id => QUESTION_MAP.get(id));
  return QUESTIONS.filter(q => q.topicId === topic);
}

export function dailyIds(n = 5) {
  return shuffle(QUESTIONS, seeded('daily-' + today())).slice(0, n).map(q => q.id);
}

/**
 * Start a new session and open the play screen.
 * opts: { mode, topic, count, settings, kind, ids, title, player }
 */
export function startSession(opts) {
  if (state.session && !confirm('আগের অসমাপ্ত test বাদ দিয়ে নতুন শুরু করবে?')) return false;
  const mode = ['fun', 'exam', 'practice'].includes(opts.mode) ? opts.mode : 'practice';
  const count = Math.min(MAX_QUESTIONS, Math.max(1, Number(opts.count) || 10));
  const ids = opts.ids || shuffle(poolFor(opts.topic)).slice(0, count).map(q => q.id);
  if (!ids.length) {
    toast('এখানে কোনো প্রশ্ন পাওয়া যায়নি।');
    return false;
  }
  const settings = { ...opts.settings };
  if (mode === 'fun') settings.perQuestion = FUN_SECONDS.includes(+settings.perQuestion) ? +settings.perQuestion : 30;
  if (mode === 'exam') {
    settings.pace = settings.pace in EXAM_PACE ? settings.pace : 'admission';
    settings.negative = +settings.negative === 0.25 ? 0.25 : 0;
  }
  const now = Date.now();
  state.session = {
    id: uid(),
    mode,
    kind: opts.kind || 'topic',
    topic: opts.topic,
    title: opts.title || topicTitle(opts.topic),
    ids,
    answers: {},
    secs: {},
    flags: {},
    index: 0,
    started: now,
    settings,
    player: opts.player || null,
    deadline: mode === 'exam' ? now + ids.length * EXAM_PACE[settings.pace] * 1000 : null,
    fun: mode === 'fun'
      ? { score: 0, streak: 0, best: 0, fifty: 1, freeze: 1, hidden: {}, frozen: false, timeouts: [], points: {}, qStart: now, qDeadline: now + settings.perQuestion * 1000 }
      : null,
  };
  save();
  navigate('#play');
  return true;
}

/** Returns a result object for the UI: {correct, gained} or null if ignored. */
export function answer(choice) {
  const s = state.session;
  if (!s) return null;
  const q = currentQuestion(s);
  if (!q) return null;
  if (s.mode === 'exam') {
    if (Date.now() >= s.deadline) { finish({ auto: true }); return null; }
    s.answers[q.id] = choice;
    save();
    return { correct: null };
  }
  if (isDone(s, q.id)) return null;
  if (s.mode === 'practice') {
    s.answers[q.id] = choice;
    save();
    return { correct: choice === q.a };
  }
  // fun
  const f = s.fun;
  const now = Date.now();
  if (!f.frozen && now >= f.qDeadline) { timeoutFun(); return null; }
  const limit = s.settings.perQuestion;
  const sec = Math.min(limit, Math.round((now - f.qStart) / 100) / 10);
  s.answers[q.id] = choice;
  s.secs[q.id] = f.frozen ? 0 : sec;
  let gained = 0;
  if (choice === q.a) {
    f.streak++;
    f.best = Math.max(f.best, f.streak);
    gained = funPoints(f.streak, f.frozen ? limit : limit - sec, limit);
    f.points[q.id] = gained;
    f.score += gained;
  } else {
    f.streak = 0;
  }
  if (f.frozen) s.flags[q.id] = 'frozen';
  save();
  return { correct: choice === q.a, gained, streak: f.streak };
}

export function timeoutFun() {
  const s = state.session;
  if (!s || s.mode !== 'fun') return;
  const q = currentQuestion(s);
  if (!q || isDone(s, q.id)) return;
  s.fun.timeouts.push(q.id);
  s.fun.streak = 0;
  s.secs[q.id] = s.settings.perQuestion;
  save();
}

export function go(index) {
  const s = state.session;
  if (!s) return;
  s.index = Math.max(0, Math.min(s.ids.length - 1, index));
  if (s.mode === 'fun') {
    s.fun.frozen = false;
    s.fun.qStart = Date.now();
    s.fun.qDeadline = Date.now() + s.settings.perQuestion * 1000;
  }
  save();
}

export function clearAnswer() {
  const s = state.session;
  const q = currentQuestion(s);
  if (!q || s.mode !== 'exam') return;
  delete s.answers[q.id];
  save();
}

export function toggleFlag() {
  const s = state.session;
  const q = currentQuestion(s);
  if (!q || s.mode !== 'exam') return;
  if (s.flags[q.id]) delete s.flags[q.id];
  else s.flags[q.id] = true;
  save();
}

export function useLifeline(kind) {
  const s = state.session;
  const q = currentQuestion(s);
  if (!q || s.mode !== 'fun' || isDone(s, q.id)) return false;
  const f = s.fun;
  if (kind === 'fifty' && f.fifty) {
    f.hidden[q.id] = shuffle([0, 1, 2, 3].filter(n => n !== q.a && n < q.o.length)).slice(0, 2);
    f.fifty = 0;
  } else if (kind === 'freeze' && f.freeze) {
    f.frozen = true;
    f.freeze = 0;
  } else return false;
  save();
  return true;
}

export function finish({ auto = false } = {}) {
  const s = state.session;
  if (!s) return null;
  const qs = sessionQuestions(s);
  const answers = qs.map(q => ({
    id: q.id,
    choice: isAnswered(s, q.id) ? s.answers[q.id] : -1,
    ...(s.mode === 'fun' ? { sec: s.secs[q.id] ?? s.settings.perQuestion, frozen: s.flags[q.id] === 'frozen' || undefined } : {}),
    ...(s.mode === 'exam' && s.flags[q.id] ? { flag: true } : {}),
  }));
  // A fun round ended early only scores the questions actually reached.
  const reached = s.mode === 'fun' ? answers.slice(0, (s.index || 0) + (isDone(s, qs[s.index]?.id) ? 1 : 0)) : answers;
  if (s.mode !== 'exam' && !reached.some(a => a.choice >= 0)) {
    state.session = null;
    save();
    toast('কোনো প্রশ্নের উত্তর দেওয়া হয়নি, তাই ফলাফল সংরক্ষণ করা হয়নি।');
    navigate('#home');
    return null;
  }
  const result = scoreAttempt({ mode: s.mode, settings: s.settings, answers: reached }, QUESTION_MAP);
  const finished = Date.now();
  const entry = {
    id: s.id,
    mode: s.mode,
    kind: s.kind,
    topic: s.topic,
    title: s.title,
    settings: s.settings,
    total: result.total,
    correct: result.correct,
    wrong: result.wrong,
    skipped: result.skipped,
    marks: result.marks,
    percent: result.percent,
    score: result.score,
    bestStreak: result.bestStreak,
    points: result.points,
    timeSec: Math.round((Math.min(finished, s.deadline || finished) - s.started) / 1000),
    finished,
    auto,
    player: s.player,
    saved: 'none',
  };
  const ranked = ['fun', 'exam'].includes(s.mode) && s.kind === 'topic' && s.player?.playerId && result.total > 0;
  if (ranked) entry.saved = 'saving';
  state.session = null;
  recordAttempt(entry, reached);
  navigate(`#result/${entry.id}`);
  if (ranked) sendScore(entry.id);
  return entry;
}

export async function sendScore(id) {
  const h = state.history.find(x => x.id === id);
  if (!h || !h.answers || !h.player?.playerId) return;
  updateHistory(id, { saved: 'saving' });
  window.dispatchEvent(new CustomEvent('score-status', { detail: { id } }));
  try {
    const res = await submitScore({
      playerId: h.player.playerId,
      attemptId: h.id,
      mode: h.mode,
      topic: h.topic,
      settings: h.settings,
      timeSec: h.timeSec,
      answers: h.answers.map(({ id: qid, choice, sec, frozen }) => ({ id: qid, choice, sec, frozen })),
    });
    updateHistory(id, { saved: 'saved', serverScore: res.entry?.score });
    clearBoardCache();
  } catch (err) {
    updateHistory(id, { saved: 'local', saveError: String(err.message || err).slice(0, 140) });
  }
  window.dispatchEvent(new CustomEvent('score-status', { detail: { id } }));
}
