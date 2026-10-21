import { MongoClient } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const root = globalThis;

/** Swap in another database object (used by tests and the offline dev server). */
export function useDatabase(db) {
  root.__campusTestDb = db;
}

/**
 * The connection string. MONGODB_URI is preferred, but the Vercel ↔ MongoDB Atlas
 * integration may name it MONGODB_URL / STORAGE_URL / <PREFIX>_URL, so any
 * variable holding a mongodb:// or mongodb+srv:// string is accepted.
 */
export function mongoUri(env = process.env) {
  for (const key of ['MONGODB_URI', 'MONGODB_URL', 'MONGO_URL', 'STORAGE_URL', 'DATABASE_URL']) {
    if (/^mongodb(\+srv)?:\/\//.test(env[key] || '')) return env[key];
  }
  const key = Object.keys(env).sort().find(k => /(_URI|_URL)$/.test(k) && /^mongodb(\+srv)?:\/\//.test(env[k] || ''));
  return key ? env[key] : '';
}

/** Shared MongoDB client for warm Vercel function instances. */
export async function getDatabase() {
  if (root.__campusTestDb) return root.__campusTestDb;
  const uri = mongoUri();
  if (!uri) throw new Error('MongoDB connection string is not configured (set MONGODB_URI)');

  if (!root.__campusMongoClientPromise) {
    const client = new MongoClient(uri, {
      appName: 'campus-admission-companion',
      maxPoolSize: 8,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });
    attachDatabasePool(client);
    root.__campusMongoClientPromise = client.connect().catch(error => {
      delete root.__campusMongoClientPromise;
      throw error;
    });
  }

  const client = await root.__campusMongoClientPromise;
  const db = client.db(process.env.MONGODB_DB || 'admission_companion');

  if (!root.__campusMongoIndexesPromise) {
    root.__campusMongoIndexesPromise = Promise.all([
      db.collection('students').createIndex({ updatedAt: -1 }),
      db.collection('scoreAttempts').createIndex({ playerId: 1, score: -1, correct: -1, timeSec: 1 }),
      db.collection('scoreAttempts').createIndex({ attemptId: 1 }, { unique: true, sparse: true }),
      db.collection('scoreAttempts').createIndex({ at: -1 }),
      db.collection('scoreAttempts').createIndex({ mode: 1, topic: 1, score: -1 }),
      db.collection('presence').createIndex({ at: 1 }, { expireAfterSeconds: 600 })
    ]).catch(error => {
      delete root.__campusMongoIndexesPromise;
      throw error;
    });
  }
  await root.__campusMongoIndexesPromise;
  return db;
}