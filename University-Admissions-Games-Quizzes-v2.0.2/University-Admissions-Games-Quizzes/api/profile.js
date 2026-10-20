import { randomUUID } from 'node:crypto';
import { getDatabase } from '../lib/mongodb.js';
import { readCookie, setCookie, ID_RE, parseBody, clean, sendJSON } from '../lib/http.js';
import { AVATARS } from '../data/site.js';

const ALLOWED_AVATARS = new Set(AVATARS);

function view(student) {
  if (!student) return null;
  const iso = d => (d instanceof Date ? d.toISOString() : d);
  return { playerId: String(student._id), name: student.name, avatar: student.avatar || '🚂', createdAt: iso(student.createdAt), updatedAt: iso(student.updatedAt) };
}

/**
 * The browser's student id: the HttpOnly cookie wins. The id saved in
 * localStorage is only accepted when the cookie is missing (e.g. it expired),
 * so one browser can never act as a different student.
 */
export function resolvePlayerId(req, requested) {
  const fromCookie = readCookie(req);
  if (fromCookie) return fromCookie;
  return ID_RE.test(String(requested || '')) ? String(requested) : '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const db = await getDatabase();
    const students = db.collection('students');

    if (req.method === 'GET') {
      const playerId = resolvePlayerId(req, req.query?.playerId);
      if (!playerId) return sendJSON(res, 200, { ok: true, player: null });
      const student = await students.findOne({ _id: playerId });
      if (!student) return sendJSON(res, 200, { ok: true, player: null });
      await students.updateOne({ _id: playerId }, { $set: { lastSeenAt: new Date() } });
      setCookie(res, playerId);
      return sendJSON(res, 200, { ok: true, player: view(student) });
    }

    if (req.method === 'POST') {
      let body;
      try { body = parseBody(req); } catch { return sendJSON(res, 400, { ok: false, error: 'Invalid JSON.' }); }
      const name = clean(body.name, 60);
      const avatar = ALLOWED_AVATARS.has(body.avatar) ? body.avatar : '🚂';
      if (name.length < 2) return sendJSON(res, 400, { ok: false, error: 'Enter your full name (at least 2 characters).' });

      const now = new Date();
      const playerId = resolvePlayerId(req, body.playerId);
      let student = playerId ? await students.findOne({ _id: playerId }) : null;
      if (student) {
        await students.updateOne({ _id: playerId }, { $set: { name, avatar, updatedAt: now, lastSeenAt: now } });
        student = { ...student, name, avatar, updatedAt: now };
        // Keep the leaderboard name in sync with the profile.
        await db.collection('scoreAttempts').updateMany({ playerId }, { $set: { name, avatar } });
      } else {
        student = { _id: randomUUID(), name, avatar, createdAt: now, updatedAt: now, lastSeenAt: now };
        await students.insertOne(student);
      }
      const result = view(student);
      setCookie(res, result.playerId);
      return sendJSON(res, 201, { ok: true, player: result });
    }

    res.setHeader('Allow', 'GET, POST');
    return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('student profile API failed', error?.name || 'DatabaseError', error?.message);
    return sendJSON(res, 500, { ok: false, error: 'Could not load or save your student profile right now.' });
  }
}
