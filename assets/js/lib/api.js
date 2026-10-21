// Same-origin API calls for Cloudflare Pages Functions + D1.
async function call(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch { throw new Error("Network unavailable"); }
  let body = null;
  try { body = await res.json(); } catch {}
  if (!res.ok || !body?.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body;
}

export async function fetchProfile(playerId) {
  const q = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
  return (await call(`/api/profile${q}`)).player;
}
export async function saveProfile({ playerId, name, avatar }) {
  return (await call("/api/profile", { method: "POST", body: JSON.stringify({ playerId, name, avatar }) })).player;
}
export async function submitScore(payload) {
  return call("/api/scores", { method: "POST", body: JSON.stringify(payload) });
}
const boardCache = new Map();
export async function fetchLeaderboard(mode = "fun", topic = "all", { fresh = false } = {}) {
  const key = `${mode}:${topic}`;
  const hit = boardCache.get(key);
  if (!fresh && hit && Date.now() - hit.at < 30000) return hit.rows;
  const body = await call(`/api/scores?mode=${encodeURIComponent(mode)}&topic=${encodeURIComponent(topic)}`);
  const rows = (body.rows || []).map(row => ({ ...row, playerId: row.playerId || row.player_id }));
  boardCache.set(key, { at: Date.now(), rows });
  return rows;
}
export const clearBoardCache = () => boardCache.clear();

// LocalStorage remains a fast offline cache; a private server-side snapshot in D1
// lets the same browser restore progress and lets progress survive local cache loss.
let progressSyncEnabled = false;
let progressTimer = null;
export async function restoreProgress() {
  return (await call("/api/progress")).progress;
}
export function enableProgressSync() {
  progressSyncEnabled = true;
}
export function queueProgressSync(state) {
  if (!progressSyncEnabled) return;
  clearTimeout(progressTimer);
  progressTimer = setTimeout(() => {
    call("/api/progress", { method: "POST", body: JSON.stringify({ progress: state }) }).catch(() => {
      // Keep the local copy usable during outages; the next change retries the sync.
    });
  }, 900);
}
