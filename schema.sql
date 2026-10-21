-- Cloudflare D1 schema for ক্যাম্পাস পথে (University-model-test-sbs-updated)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🚂',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_students_updated ON students(updated_at DESC);
CREATE TABLE IF NOT EXISTS score_attempts (
  attempt_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🚂',
  topic TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('fun','exam')),
  score REAL NOT NULL,
  correct INTEGER NOT NULL,
  wrong INTEGER NOT NULL,
  total INTEGER NOT NULL,
  best_streak INTEGER NOT NULL DEFAULT 0,
  time_sec INTEGER NOT NULL DEFAULT 0,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scores_player_best ON score_attempts(player_id, score DESC, correct DESC, time_sec ASC, at ASC);
CREATE INDEX IF NOT EXISTS idx_scores_mode_topic ON score_attempts(mode, topic, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_at ON score_attempts(at DESC);
CREATE TABLE IF NOT EXISTS presence (sid TEXT PRIMARY KEY, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_presence_at ON presence(at);
CREATE TABLE IF NOT EXISTS progress (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_progress_updated ON progress(updated_at DESC);
