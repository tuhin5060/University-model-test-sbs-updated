// Local progress: everything here lives only in this browser (localStorage).
// Shape is versioned; older "campus-companion.v1" data is migrated once.

import { QUESTION_MAP } from '../../../data/questions/index.js';
import { today } from './dom.js';

const KEY = 'campus-pothe.v2';
const LEGACY_KEY = 'campus-companion.v1';
const MAX_HISTORY = 40;
const KEEP_ANSWERS = 15; // full answer sheets kept for the most recent attempts

const blank = () => ({
  v: 2,
  player: null,
  history: [],
  mistakes: {},
  stats: {},
  daily: { last: '', streak: 0, best: 0, done: {} },
  saved: [],
  checks: [],
  session: null,
  prefs: { sound: true },
});

export let storageOK = true;
export let state = load();

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { storageOK = false; return null; }
}

function load() {
  const current = read(KEY);
  if (current && current.v === 2) return sanitise({ ...blank(), ...current });
  const next = blank();
  const old = read(LEGACY_KEY);
  if (old && Array.isArray(old.attempts)) {
    next.player = old.player?.playerId ? { playerId: old.player.playerId, name: old.player.name, avatar: old.player.avatar } : null;
    next.saved = (old.saved || []).filter(s => typeof s === 'string' && s.startsWith('university/')).map(s => 'u:' + s.split('/')[1]);
    next.checks = Array.isArray(old.checks) ? old.checks.filter(Number.isInteger) : [];
    next.history = old.attempts.slice(0, MAX_HISTORY).map(a => ({
      id: String(a.attemptId || a.finished),
      mode: a.mode === 'test' ? 'exam' : a.mode === 'learn' ? 'practice' : a.mode,
      topic: a.topic,
      title: a.topic === 'all' ? 'সব topic' : a.topic,
      total: a.total,
      correct: a.correct,
      wrong: Math.max(0, Object.keys(a.answers || {}).length - a.correct),
      skipped: a.total - Object.keys(a.answers || {}).length,
      score: a.mode === 'fun' ? a.score || 0 : Math.round((a.correct / a.total) * 100),
      percent: Math.round((a.correct / a.total) * 100),
      timeSec: a.timeSec || 0,
      finished: a.finished,
      saved: a.leaderboardStatus === 'saved' ? 'saved' : 'none',
      legacy: true,
    })).filter(h => h.total > 0);
  }
  if (!next.player) {
    const p = read('campus-player');
    if (p?.playerId) next.player = { playerId: p.playerId, name: p.name, avatar: p.avatar };
  }
  return next;
}

function sanitise(s) {
  if (!Array.isArray(s.history)) s.history = [];
  if (!s.mistakes || typeof s.mistakes !== 'object') s.mistakes = {};
  if (!s.stats || typeof s.stats !== 'object') s.stats = {};
  if (!Array.isArray(s.saved)) s.saved = [];
  if (!Array.isArray(s.checks)) s.checks = [];
  // Drop mistakes / sessions pointing to questions that were deleted from the bank.
  for (const id of Object.keys(s.mistakes)) if (!QUESTION_MAP.has(id)) delete s.mistakes[id];
  if (s.session && !(Array.isArray(s.session.ids) && s.session.ids.every(id => QUESTION_MAP.has(id)))) s.session = null;
  return s;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOK = true;
  } catch {
    storageOK = false;
  }
}

export function replaceState(next) {
  state = sanitise({ ...blank(), ...next, v: 2 });
  save();
}

export function resetState() {
  const player = state.player;
  state = blank();
  state.player = player;
  save();
}

/** Record a finished attempt: history, per-topic stats, mistake bank, daily streak. */
export function recordAttempt(entry, answers) {
  for (const ans of answers) {
    const q = QUESTION_MAP.get(ans.id);
    if (!q || ans.choice === undefined) continue;
    const st = (state.stats[q.topicId] ||= { seen: 0, correct: 0 });
    st.seen++;
    if (ans.choice === q.a) {
      st.correct++;
      const m = state.mistakes[q.id];
      if (m) {
        m.ok = (m.ok || 0) + 1;
        if (m.ok >= 2) delete state.mistakes[q.id];
      }
    } else if (ans.choice >= 0) {
      const m = (state.mistakes[q.id] ||= { n: 0, ok: 0 });
      m.n++;
      m.ok = 0;
      m.t = Date.now();
    }
  }
  if (entry.kind === 'daily') {
    const d = today();
    if (state.daily.last !== d) {
      const y = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
      state.daily.streak = state.daily.last === y ? state.daily.streak + 1 : 1;
      state.daily.best = Math.max(state.daily.best || 0, state.daily.streak);
      state.daily.last = d;
    }
    state.daily.done = { ...Object.fromEntries(Object.entries(state.daily.done || {}).slice(-30)), [d]: entry.correct };
  }
  state.history.unshift({ ...entry, answers });
  state.history = state.history.slice(0, MAX_HISTORY).map((h, i) => (i < KEEP_ANSWERS ? h : { ...h, answers: undefined }));
  save();
}

export function updateHistory(id, patch) {
  const h = state.history.find(x => x.id === id);
  if (h) Object.assign(h, patch);
  save();
  return h;
}

export const mistakeIds = () => Object.keys(state.mistakes).filter(id => QUESTION_MAP.has(id));
export const dailyStreak = () => {
  const d = state.daily;
  const y = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
  return d.last === today() || d.last === y ? d.streak : 0;
};

export function toggleSaved(key) {
  state.saved = state.saved.includes(key) ? state.saved.filter(x => x !== key) : [...state.saved, key];
  save();
  return state.saved.includes(key);
}

export function validBackup(d) {
  return !!d && typeof d === 'object' && d.v === 2 && Array.isArray(d.history) && d.history.length <= MAX_HISTORY &&
    typeof d.mistakes === 'object' && typeof d.stats === 'object' &&
    d.history.every(h => h && typeof h.id === 'string' && Number.isInteger(h.total) && Number.isInteger(h.correct));
}
