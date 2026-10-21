// Private progress backup (history, mistakes, stats…) for one browser or student.
// localStorage stays the fast offline copy; this snapshot lets a student who logs
// in with the same name + roll on another phone get their progress back.
import { route } from '../route.js';
import { json, readCookie, readJSON, cookie, iso, PLAYER_COOKIE, PROGRESS_COOKIE, BadRequest } from '../http.js';

const MAX_BYTES = 350_000;

/** The student's id when known, else an anonymous id for this browser (created on first use). */
async function owner(request, db) {
  const playerId = readCookie(request, PLAYER_COOKIE);
  const anonymousId = readCookie(request, PROGRESS_COOKIE);
  if (playerId) {
    if (anonymousId && anonymousId !== playerId) {
      // First visit after picking a name: move the anonymous snapshot over unless the student already has one.
      await db.batch([
        ['INSERT INTO progress (id, payload, updated_at) SELECT $1, payload, updated_at FROM progress WHERE id = $2 ON CONFLICT (id) DO NOTHING', [playerId, anonymousId]],
        ['DELETE FROM progress WHERE id = $1', [anonymousId]],
      ]);
    }
    return { id: playerId, headers: {} };
  }
  if (anonymousId) return { id: anonymousId, headers: {} };
  const id = crypto.randomUUID();
  return { id, headers: { 'Set-Cookie': cookie(PROGRESS_COOKIE, id) } };
}

export default route('progress', {
  async GET(request, db) {
    const { id, headers } = await owner(request, db);
    const [row] = await db.query('SELECT payload, updated_at FROM progress WHERE id = $1', [id]);
    return json({ ok: true, progress: row?.payload || null, updatedAt: iso(row?.updated_at) }, 200, headers);
  },

  async POST(request, db) {
    const body = await readJSON(request, MAX_BYTES + 1_000);
    const progress = body?.progress;
    if (!progress || typeof progress !== 'object' || Array.isArray(progress) || progress.v !== 2) throw new BadRequest('Invalid progress payload.');
    const { id, headers } = await owner(request, db);
    const [row] = await db.query(
      `INSERT INTO progress (id, payload, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at RETURNING updated_at`,
      [id, JSON.stringify(progress)],
    );
    return json({ ok: true, updatedAt: iso(row.updated_at) }, 200, headers);
  },
}, 'Could not save or load progress right now.');
