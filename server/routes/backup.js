// Admin data backup: every stored table as one JSON file.
// POST { password } → { app, version, exportedAt, tables: { students: [...], ... } }
// Used for safe-keeping and for moving to another database (scripts/backup-to-d1.mjs).
// Short-lived tables (presence, events) are left out.
import { route } from '../route.js';
import { json, readJSON } from '../http.js';
import { requireAdmin } from '../admin.js';

export const BACKUP_TABLES = {
  students: 'SELECT id, name, name_key, roll, avatar, college, created_at, updated_at, last_seen_at FROM students ORDER BY roll',
  score_attempts: 'SELECT attempt_id, player_id, topic, mode, score, correct, wrong, total, best_streak, time_sec, at FROM score_attempts ORDER BY at',
  progress: 'SELECT id, payload, updated_at FROM progress',
  threads: 'SELECT id, author_id, topic, title, body, tags, question_id, resolved, solution_id, replies, created_at, active_at FROM threads ORDER BY id',
  replies: 'SELECT id, thread_id, author_id, body, created_at FROM replies ORDER BY id',
  push_subs: 'SELECT endpoint, player_id, created_at, last_sent_at FROM push_subs',
  settings: 'SELECT key, value FROM settings',
};

export default route('backup', {
  async POST(request, db, env) {
    const body = await readJSON(request, 2_000);
    await requireAdmin(body.password, env, db, request);
    const names = Object.keys(BACKUP_TABLES);
    const results = await db.batch(names.map(name => [BACKUP_TABLES[name]]));
    const tables = Object.fromEntries(names.map((name, i) => [name, results[i]]));
    return json({ ok: true, app: 'campus-pothe', version: 1, exportedAt: new Date().toISOString(), tables });
  },
}, 'Backup তৈরি করা গেল না—একটু পরে আবার চেষ্টা করো।');
