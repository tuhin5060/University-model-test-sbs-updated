import { randomUUID } from 'node:crypto';
import { getDatabase } from '../lib/mongodb.js';
import { readCookie, parseBody, sendJSON, ID_RE } from '../lib/http.js';

const PROGRESS_COOKIE = 'campus_progress';
const MAX_PAYLOAD_BYTES = 350_000;

function readProgressCookie(req) {
  const header = req.headers?.cookie || req.headers?.Cookie || '';
  const part = String(header).split(';').map(x => x.trim()).find(x => x.startsWith(PROGRESS_COOKIE + '='));
  let id = '';
  try { id = part ? decodeURIComponent(part.slice(PROGRESS_COOKIE.length + 1)) : ''; } catch {}
  return ID_RE.test(id) ? id : '';
}

function setProgressCookie(res, id) {
  res.setHeader('Set-Cookie', `${PROGRESS_COOKIE}=${encodeURIComponent(id)}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`);
}

async function resolveProgressId(db, req) {
  const playerId = readCookie(req);
  const anonymousId = readProgressCookie(req);
  if (playerId) {
    if (anonymousId && anonymousId !== playerId) {
      const snapshots = db.collection('progressSnapshots');
      const current = await snapshots.findOne({ _id: playerId });
      if (!current) {
        const anonymous = await snapshots.findOne({ _id: anonymousId });
        if (anonymous) await snapshots.updateOne({ _id: playerId }, { $set: { payload: anonymous.payload, updatedAt: anonymous.updatedAt } }, { upsert: true });
      }
      await snapshots.deleteOne({ _id: anonymousId });
    }
    return { id: playerId, headers: false };
  }
  if (anonymousId) return { id: anonymousId, headers: false };
  return { id: randomUUID(), headers: true };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const db = await getDatabase();
    const snapshots = db.collection('progressSnapshots');
    const { id, headers } = await resolveProgressId(db, req);
    if (headers) setProgressCookie(res, id);

    if (req.method === 'GET') {
      const row = await snapshots.findOne({ _id: id });
      return sendJSON(res, 200, { ok: true, progress: row?.payload || null, updatedAt: row?.updatedAt || null });
    }

    let body;
    try { body = parseBody(req); } catch { return sendJSON(res, 400, { ok: false, error: 'Invalid JSON.' }); }
    const progress = body?.progress;
    if (!progress || typeof progress !== 'object' || Array.isArray(progress) || progress.v !== 2) {
      return sendJSON(res, 400, { ok: false, error: 'Invalid progress payload.' });
    }
    const serialized = JSON.stringify(progress);
    if (Buffer.byteLength(serialized, 'utf8') > MAX_PAYLOAD_BYTES) {
      return sendJSON(res, 413, { ok: false, error: 'Progress snapshot is too large.' });
    }
    const updatedAt = new Date().toISOString();
    await snapshots.updateOne({ _id: id }, { $set: { payload: progress, updatedAt } }, { upsert: true });
    return sendJSON(res, 200, { ok: true, updatedAt });
  } catch (error) {
    console.error('progress API failed', error?.name || 'DatabaseError', error?.message);
    return sendJSON(res, 500, { ok: false, error: 'Could not load or save progress right now.' });
  }
}
