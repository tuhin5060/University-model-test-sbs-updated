// Offline outbox. A sign-up and the scores made while the server could not be
// reached (no network, or the database having trouble) wait in this browser with
// the rest of the progress, and go out by themselves once it can be reached again:
// at start, when the phone comes back online, when the tab is shown again, and
// every minute while something is waiting. The server ignores a score it already
// has (attemptId) and a sign-up it already made (newId), so sending twice is safe.

import { state, updateHistory } from './store.js';
import { submitScore, clearBoardCache, noteProblem } from './api.js';
import { finishPendingSignUp } from './identity.js';
import { bn } from './dom.js';

const RANKED = h => h.kind === 'topic' && ['fun', 'exam'].includes(h.mode) && h.answers && h.player?.playerId;
// 'saving' that never finished (the page was closed mid-request) is tried again after a minute.
const waiting = h => RANKED(h) && (h.saved === 'local' || (h.saved === 'saving' && Date.now() - (h.sentAt || 0) > 60_000));

export const pendingScores = () => state.history.filter(waiting).length;
const pending = () => pendingScores() + (state.player?.pending ? 1 : 0);

const tell = id => window.dispatchEvent(new CustomEvent('score-status', { detail: { id } }));

/** Send one stored result to the leaderboard. */
export async function sendScore(id) {
  const h = state.history.find(x => x.id === id);
  if (!h || !h.answers || !h.player?.playerId) return;
  if (h.player.pending) {
    // Not on the server yet: the sign-up goes first (flush), then this score.
    updateHistory(id, { saved: 'local' });
    return tell(id);
  }
  updateHistory(id, { saved: 'saving', sentAt: Date.now() });
  tell(id);
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
    updateHistory(id, { saved: 'saved', serverScore: res.entry?.score, rank: res.rank || null, newTop: !!res.newTop, saveError: undefined });
    clearBoardCache();
  } catch (err) {
    // The server answered "no" for good (e.g. a different student on this browser): do not retry forever.
    const final = err.status >= 400 && err.status < 500 && ![401, 408, 429].includes(err.status);
    updateHistory(id, { saved: final ? 'failed' : 'local', saveError: String(err.message || err).slice(0, 140) });
    noteProblem('score', err);
  }
  tell(id);
  paint();
}

let running = null;
/** Send everything that is waiting (one run at a time). */
export function flush() {
  running ||= (async () => {
    if (navigator.onLine === false) return;
    if (state.player?.pending && !(await finishPendingSignUp())) return;
    for (const h of state.history.filter(waiting)) {
      if (h.player.pending) {
        if (state.player?.pending || h.player.playerId !== state.player?.playerId) continue;
        updateHistory(h.id, { player: state.player });
      }
      await sendScore(h.id);
      if (state.history.find(x => x.id === h.id)?.saved === 'local') break; // still unreachable: try later
    }
  })().catch(() => {}).finally(() => {
    running = null;
    paint();
  });
  return running;
}

/** A thin bar under the header: offline, or results still waiting to go out. */
export function paint() {
  const offline = navigator.onLine === false;
  const n = pending();
  let bar = document.getElementById('net-bar');
  if (!offline && !n) return bar?.remove();
  if (!bar) {
    bar = Object.assign(document.createElement('div'), { id: 'net-bar', className: 'net-bar' });
    bar.setAttribute('role', 'status');
    document.querySelector('.site-header')?.after(bar);
  }
  bar.innerHTML = offline
    ? '📴 <span>অফলাইন—practice আর test চলবে; নাম ও score এই phone-এ জমা থাকছে, নেট এলে নিজে থেকেই পাঠানো হবে।</span>'
    : `⏳ <span>${n === 1 && state.player?.pending ? 'তোমার নাম' : `${bn(n)}টি জিনিস`} server-এ পাঠানোর অপেক্ষায়।</span> <button class="link-btn" type="button" data-net-retry>এখনই পাঠাও</button>`;
  bar.querySelector('[data-net-retry]')?.addEventListener('click', flush);
}

export function startOutbox() {
  addEventListener('online', flush);
  addEventListener('offline', paint);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') flush(); });
  setInterval(() => { if (pending()) flush(); }, 60_000);
  paint();
  flush();
}

