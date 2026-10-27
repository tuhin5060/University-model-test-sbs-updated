// Neon Postgres access over HTTPS (works on Vercel Node functions and
// Cloudflare Pages Functions alike; no npm package needed). The connection
// string comes only from the host's environment settings: DATABASE_URL (set by the Vercel ↔ Neon
// integration) or POSTGRES_URL. It never reaches the browser.
import { neonHttp } from './neon-http.js';

export class NotConfigured extends Error {}

// Every statement is idempotent, so running them on each cold start is safe.
export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS students (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    name_key text NOT NULL,
    roll integer NOT NULL UNIQUE CHECK (roll BETWEEN 1 AND 99999),
    avatar text NOT NULL DEFAULT '🚂',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Added in 2.7: the student's college (full name, picked from data/colleges.js or typed).
  'ALTER TABLE students ADD COLUMN IF NOT EXISTS college text',
  `CREATE TABLE IF NOT EXISTS score_attempts (
    attempt_id text PRIMARY KEY,
    player_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    topic text NOT NULL,
    mode text NOT NULL CHECK (mode IN ('fun', 'exam')),
    score real NOT NULL,
    correct integer NOT NULL,
    wrong integer NOT NULL,
    total integer NOT NULL,
    best_streak integer NOT NULL DEFAULT 0,
    time_sec integer NOT NULL DEFAULT 0,
    at timestamptz NOT NULL DEFAULT now()
  )`,
  'CREATE INDEX IF NOT EXISTS score_attempts_board ON score_attempts (mode, topic, score DESC)',
  'CREATE INDEX IF NOT EXISTS score_attempts_player ON score_attempts (player_id, at DESC)',
  'CREATE TABLE IF NOT EXISTS presence (sid text PRIMARY KEY, at timestamptz NOT NULL)',
  // Added in 2.11: one row per browser per Bangladesh day, for "আজ ভিজিট করেছেন". Kept for 2 days.
  'CREATE TABLE IF NOT EXISTS daily_visits (day date NOT NULL, sid text NOT NULL, PRIMARY KEY (day, sid))',
  // Added in 2.16: usage sessions for the admin dashboard (who used the site, when, how long). Kept 60 days.
  `CREATE TABLE IF NOT EXISTS usage_sessions (
    id bigserial PRIMARY KEY,
    sid text NOT NULL,
    player_id uuid,
    started_at timestamptz NOT NULL DEFAULT now(),
    last_at timestamptz NOT NULL DEFAULT now(),
    beats integer NOT NULL DEFAULT 1
  )`,
  'CREATE INDEX IF NOT EXISTS usage_sessions_sid ON usage_sessions (sid, last_at DESC)',
  'CREATE INDEX IF NOT EXISTS usage_sessions_last ON usage_sessions (last_at DESC)',
  'CREATE TABLE IF NOT EXISTS progress (id uuid PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL)',
  // Community: question threads (by topic, with tags) and their replies.
  `CREATE TABLE IF NOT EXISTS threads (
    id bigserial PRIMARY KEY,
    author_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    topic text NOT NULL,
    title text NOT NULL,
    body text NOT NULL DEFAULT '',
    tags jsonb NOT NULL DEFAULT '[]',
    question_id text,
    resolved boolean NOT NULL DEFAULT false,
    solution_id bigint,
    replies integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    active_at timestamptz NOT NULL DEFAULT now()
  )`,
  'CREATE INDEX IF NOT EXISTS threads_active ON threads (active_at DESC)',
  `CREATE TABLE IF NOT EXISTS replies (
    id bigserial PRIMARY KEY,
    thread_id bigint NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  'CREATE INDEX IF NOT EXISTS replies_thread ON replies (thread_id, id)',
  // Browser push: one row per subscribed browser; settings holds the day's message and known topics.
  `CREATE TABLE IF NOT EXISTS push_subs (
    endpoint text PRIMARY KEY,
    player_id uuid REFERENCES students(id) ON DELETE SET NULL,
    pending jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_sent_at timestamptz
  )`,
  'CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value jsonb NOT NULL)',
  // Rate limits (server/ratelimit.js): one row per counted request, kept for a day.
  "CREATE TABLE IF NOT EXISTS hits (key text NOT NULL, at timestamptz NOT NULL DEFAULT now())",
  'CREATE INDEX IF NOT EXISTS hits_key ON hits (key, at)',
  `CREATE TABLE IF NOT EXISTS events (
    id bigserial PRIMARY KEY,
    kind text NOT NULL,
    payload jsonb NOT NULL,
    at timestamptz NOT NULL DEFAULT now()
  )`,
];

// A fingerprint of SCHEMA, stored in settings once the statements have run: a new
// instance then needs one small query instead of the whole list (faster cold starts).
export const SCHEMA_VERSION = `v1-${[...SCHEMA.join('\n')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36)}`;

export async function prepare(db) {
  try {
    const [row] = await db.query("SELECT value FROM settings WHERE key = 'schema'");
    if (row?.value === SCHEMA_VERSION) return;
  } catch { /* a new database: no settings table yet */ }
  // Two fresh instances creating a new table at the same moment (right after a
  // deploy) can collide once; the second try then finds the table and passes.
  const run = () => db.batch(SCHEMA.map(text => [text]));
  await run().catch(run);
  await db.query("INSERT INTO settings (key, value) VALUES ('schema', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [JSON.stringify(SCHEMA_VERSION)]);
}

let injected = null;
const pool = new Map();

/** Tests pass an object with query(text, params) → rows and batch([[text, params]]). */
export function useDatabase(db) {
  injected = db;
}

export const databaseUrl = env => env?.DATABASE_URL || env?.POSTGRES_URL || '';

/** A ready-to-use database for this request's environment (schema created once per instance). */
export async function getDb(env) {
  if (injected) return injected;
  const url = databaseUrl(env);
  if (!url) throw new NotConfigured('DATABASE_URL is not set');
  let entry = pool.get(url);
  if (!entry) {
    const db = neonHttp(url);
    entry = { db, ready: prepare(db) };
    entry.ready.catch(() => pool.delete(url)); // retry on the next request
    pool.set(url, entry);
  }
  await entry.ready;
  return entry.db;
}
