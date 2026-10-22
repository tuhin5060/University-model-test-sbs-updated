// Cloud sync: the student profile (name + roll) and a progress backup on the server.
// localStorage stays the offline source of truth; the server copy lets a student
// who types the same name + roll on another phone get everything back.

import { state, save, replaceState, trimHistory } from './store.js';
import { fetchProfile, restoreProgress, enableProgressSync, queueProgressSync } from './api.js';

/** Keep only what the browser needs from a server profile. */
export const playerFrom = p => ({ playerId: p.playerId, name: p.name, roll: p.roll, tag: p.tag, avatar: p.avatar, college: p.college || null });

/** Merge a server snapshot into the local state (newest wins, nothing local is lost). */
function mergeProgress(remote) {
  const local = state;
  const historyById = new Map();
  for (const item of [...(remote.history || []), ...(local.history || [])]) {
    if (item?.id) historyById.set(item.id, { ...historyById.get(item.id), ...item });
  }
  // `finished` is a number (Date.now()); older copies may hold a date string.
  const time = x => (typeof x.finished === 'number' ? x.finished : Date.parse(x.finished)) || 0;
  const history = trimHistory([...historyById.values()].sort((a, b) => time(b) - time(a)));
  const mistakes = { ...(remote.mistakes || {}) };
  for (const [id, item] of Object.entries(local.mistakes || {})) {
    const old = mistakes[id];
    if (!old || Number(item.t || 0) >= Number(old.t || 0)) mistakes[id] = item;
  }
  const stats = { ...(remote.stats || {}) };
  for (const [id, item] of Object.entries(local.stats || {})) {
    stats[id] = { seen: Math.max(stats[id]?.seen || 0, item?.seen || 0), correct: Math.max(stats[id]?.correct || 0, item?.correct || 0) };
  }
  const daily = (local.daily?.last || '') >= (remote.daily?.last || '') ? local.daily || remote.daily : remote.daily || local.daily;
  replaceState({
    ...remote,
    ...local,
    player: local.player || remote.player,
    history,
    mistakes,
    stats,
    saved: [...new Set([...(remote.saved || []), ...(local.saved || [])])],
    checks: [...new Set([...(remote.checks || []), ...(local.checks || [])])],
    daily: { ...(remote.daily || {}), ...(daily || {}), best: Math.max(remote.daily?.best || 0, local.daily?.best || 0), done: { ...(remote.daily?.done || {}), ...(local.daily?.done || {}) } },
    prefs: { ...(remote.prefs || {}), ...(local.prefs || {}) },
    // A test finished offline must not come back as unfinished from the older server copy.
    session: local.session || (remote.session && !history.some(h => h.id === remote.session.id) ? remote.session : null),
  });
}

/** Pull the profile (unless skipped) and the progress backup, then keep syncing changes. */
export async function syncCloud({ profile = true } = {}) {
  // A sign-up still waiting in the outbox must not be replaced by this browser's older cookie profile.
  if (profile && !state.player?.pending) {
    try {
      const p = await fetchProfile(state.player?.playerId);
      if (p?.playerId) {
        state.player = playerFrom(p);
        save();
      }
    } catch { /* offline: keep the local copy */ }
  }
  try {
    const remote = await restoreProgress();
    if (remote?.v === 2) mergeProgress(remote);
  } catch { /* offline or no database: localStorage keeps working */ }
  enableProgressSync();
  queueProgressSync(state);
}
