// Turns a data backup (downloaded from #backup) into SQL for Cloudflare D1 (SQLite):
// the tables, then every row. Students keep their ids and roll numbers, so scores,
// progress and community posts stay connected.
//   node scripts/backup-to-d1.mjs campus-backup-2026-10-22.json > d1-import.sql
//   npx wrangler d1 execute campus-admission-companion --remote --file=d1-import.sql
// See docs/MIGRATE_TO_D1.md.
import fs from 'node:fs';

// Same tables and columns as server/db.js, in SQLite types:
// uuid/text → TEXT, timestamptz → TEXT (ISO 8601, UTC), jsonb → TEXT (JSON), boolean → INTEGER 0/1.
export const D1_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL,
    roll INTEGER NOT NULL UNIQUE CHECK (roll BETWEEN 1 AND 99999),
    avatar TEXT NOT NULL DEFAULT '🚂',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `CREATE TABLE IF NOT EXISTS score_attempts (
    attempt_id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('fun', 'exam')),
    score REAL NOT NULL,
    correct INTEGER NOT NULL,
    wrong INTEGER NOT NULL,
    total INTEGER NOT NULL,
    best_streak INTEGER NOT NULL DEFAULT 0,
    time_sec INTEGER NOT NULL DEFAULT 0,
    at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  'CREATE INDEX IF NOT EXISTS score_attempts_board ON score_attempts (mode, topic, score DESC)',
  'CREATE INDEX IF NOT EXISTS score_attempts_player ON score_attempts (player_id, at DESC)',
  'CREATE TABLE IF NOT EXISTS presence (sid TEXT PRIMARY KEY, at TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS progress (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)',
  `CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    question_id TEXT,
    resolved INTEGER NOT NULL DEFAULT 0,
    solution_id INTEGER,
    replies INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    active_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  'CREATE INDEX IF NOT EXISTS threads_active ON threads (active_at DESC)',
  `CREATE TABLE IF NOT EXISTS replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  'CREATE INDEX IF NOT EXISTS replies_thread ON replies (thread_id, id)',
  `CREATE TABLE IF NOT EXISTS push_subs (
    endpoint TEXT PRIMARY KEY,
    player_id TEXT REFERENCES students(id) ON DELETE SET NULL,
    pending TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_sent_at TEXT
  )`,
  'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    payload TEXT NOT NULL,
    at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
];

// Insert order respects foreign keys (students first).
export const D1_TABLES = {
  students: ['id', 'name', 'name_key', 'roll', 'avatar', 'created_at', 'updated_at', 'last_seen_at'],
  score_attempts: ['attempt_id', 'player_id', 'topic', 'mode', 'score', 'correct', 'wrong', 'total', 'best_streak', 'time_sec', 'at'],
  progress: ['id', 'payload', 'updated_at'],
  threads: ['id', 'author_id', 'topic', 'title', 'body', 'tags', 'question_id', 'resolved', 'solution_id', 'replies', 'created_at', 'active_at'],
  replies: ['id', 'thread_id', 'author_id', 'body', 'created_at'],
  push_subs: ['endpoint', 'player_id', 'created_at', 'last_sent_at'],
  settings: ['key', 'value'],
};

const MAX_STATEMENT = 100_000; // D1 limit per SQL statement (bytes)

export function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  const text = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return `'${text.replace(/'/g, "''")}'`;
}

/** → { sql, counts, tooBig } */
export function backupToSql(backup) {
  if (backup?.app !== 'campus-pothe' || !backup.tables) throw new Error('This is not a ক্যাম্পাসের পথে backup file.');
  const lines = ['-- ক্যাম্পাসের পথে → Cloudflare D1', `-- backup taken ${backup.exportedAt}`, 'PRAGMA foreign_keys = ON;', ...D1_SCHEMA.map(s => `${s};`)];
  const counts = {};
  const tooBig = [];
  for (const [table, columns] of Object.entries(D1_TABLES)) {
    const rows = backup.tables[table] || [];
    counts[table] = rows.length;
    for (const row of rows) {
      const statement = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(c => sqlValue(row[c])).join(', ')});`;
      if (Buffer.byteLength(statement) > MAX_STATEMENT) tooBig.push(`${table}:${row[columns[0]]}`);
      lines.push(statement);
    }
  }
  return { sql: `${lines.join('\n')}\n`, counts, tooBig };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/backup-to-d1.mjs <backup.json> > d1-import.sql');
    process.exit(1);
  }
  const { sql, counts, tooBig } = backupToSql(JSON.parse(fs.readFileSync(file, 'utf8')));
  process.stdout.write(sql);
  console.error(`Rows: ${Object.entries(counts).map(([t, n]) => `${t} ${n}`).join(', ')}`);
  if (tooBig.length) console.error(`⚠️ Larger than D1's 100 KB statement limit (import these by hand): ${tooBig.join(', ')}`);
}
