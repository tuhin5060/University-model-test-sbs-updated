// Same-origin API calls (Vercel api/ or Cloudflare functions/, both backed by
// Neon Postgres). Every call fails soft: the app keeps working offline and
// simply skips the leaderboard.

async function call(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin',
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
  } catch {
    throw new Error('Network unavailable');
  }
  let body = null;
  try { body = await res.json(); } catch { /* not JSON: API not deployed here */ }
  if (!res.ok || !body?.ok) {
    const error = new Error(body?.error || (res.status >= 500 ? 'Leaderboard service is not available right now' : `Request failed (${res.status})`));
    error.status = res.status;
    error.body = body;
    throw error;
  }
  return body;
}

export async function fetchProfile(playerId) {
  const q = playerId ? `?playerId=${encodeURIComponent(playerId)}` : '';
  return (await call(`/api/profile${q}`)).player;
}

/** → { player, created?, restored? }. A taken roll throws with error.body = { code: 'roll_taken', suggest }. */
export async function saveProfile({ playerId, name, roll, avatar }) {
  return call('/api/profile', { method: 'POST', body: JSON.stringify({ playerId, name, roll, avatar }) });
}

export async function submitScore(payload) {
  return call('/api/scores', { method: 'POST', body: JSON.stringify(payload) });
}

/** This student's tests, marks and leaderboard position (null stats when not signed up). */
export async function fetchMyStats() {
  return call('/api/scores?me=1');
}

const boardCache = new Map();
export async function fetchLeaderboard(mode = 'fun', topic = 'all', { fresh = false } = {}) {
  const key = `${mode}:${topic}`;
  const hit = boardCache.get(key);
  if (!fresh && hit && Date.now() - hit.at < 30000) return hit.rows;
  const body = await call(`/api/scores?mode=${encodeURIComponent(mode)}&topic=${encodeURIComponent(topic)}`);
  boardCache.set(key, { at: Date.now(), rows: body.rows || [] });
  return body.rows || [];
}
export const clearBoardCache = () => boardCache.clear();

// Progress backup: debounced upload of the local state after each change.
let progressSyncEnabled = false;
let progressTimer = null;
export async function restoreProgress() {
  return (await call('/api/progress')).progress;
}
export function enableProgressSync() {
  progressSyncEnabled = true;
}
export function queueProgressSync(state) {
  if (!progressSyncEnabled) return;
  clearTimeout(progressTimer);
  progressTimer = setTimeout(() => {
    call('/api/progress', { method: 'POST', body: JSON.stringify({ progress: state }) }).catch(() => {
      // Keep the local copy usable during outages; the next change retries the sync.
    });
  }, 900);
}
