// Calls to the Vercel API (MongoDB-backed). Every call fails soft: the app keeps
// working offline / on a static host and simply skips the leaderboard.

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
    throw new Error('Network unavailable. Your local practice progress is still available.');
  }
  let body = null;
  try { body = await res.json(); } catch { /* not JSON: API not deployed here */ }
  if (!res.ok || !body?.ok) {
    const message = body?.error || `Request failed (${res.status})`;
    if (res.status >= 500) throw new Error('Leaderboard service is not configured yet. You can continue practicing; your progress stays on this device.');
    throw new Error(message);
  }
  return body;
}

export async function fetchProfile(playerId) {
  const q = playerId ? `?playerId=${encodeURIComponent(playerId)}` : '';
  return (await call(`/api/profile${q}`)).player;
}

export async function saveProfile({ playerId, name, avatar }) {
  return (await call('/api/profile', { method: 'POST', body: JSON.stringify({ playerId, name, avatar }) })).player;
}

export async function submitScore(payload) {
  return call('/api/scores', { method: 'POST', body: JSON.stringify(payload) });
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
