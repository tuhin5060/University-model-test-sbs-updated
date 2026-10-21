// Live visitor count. Every open tab sends a heartbeat (POST { sid }) about
// every 30 s while it is visible; the answer is the number of distinct browsers
// seen in the last ONLINE_MS. Nothing is estimated: no heartbeat, no count.
// Old heartbeats are removed by a TTL index (lib/mongodb.js).
import { getDatabase } from '../lib/mongodb.js';
import { parseBody, sendJSON } from '../lib/http.js';

export const ONLINE_MS = 75 * 1000;
const SID_RE = /^[a-z0-9]{16,40}$/i;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  }
  let body;
  try { body = parseBody(req); } catch { return sendJSON(res, 400, { ok: false, error: 'Invalid JSON.' }); }
  const sid = String(body.sid || '');
  if (!SID_RE.test(sid)) return sendJSON(res, 400, { ok: false, error: 'Invalid visitor id.' });
  try {
    const presence = (await getDatabase()).collection('presence');
    const now = new Date();
    if (body.leave) await presence.deleteOne({ _id: sid });
    else await presence.updateOne({ _id: sid }, { $set: { at: now } }, { upsert: true });
    const online = await presence.countDocuments({ at: { $gte: new Date(now.getTime() - ONLINE_MS) } });
    return sendJSON(res, 200, { ok: true, online });
  } catch (error) {
    console.error('visitors API failed', error?.name || 'DatabaseError', error?.message);
    return sendJSON(res, 500, { ok: false, error: 'Live visitor count is unavailable right now.' });
  }
}
