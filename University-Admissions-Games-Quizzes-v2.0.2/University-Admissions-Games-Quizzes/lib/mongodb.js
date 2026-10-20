import { MongoClient } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const root = globalThis;

/** Swap in another database object (used by tests and the offline dev server). */
export function useDatabase(db) {
  root.__campusTestDb = db;
}

/** Shared MongoDB client for warm Vercel function instances. */
export async function getDatabase() {
  if (root.__campusTestDb) return root.__campusTestDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');

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
      db.collection('scoreAttempts').createIndex({ mode: 1, topic: 1, score: -1 })
    ]).catch(error => {
      delete root.__campusMongoIndexesPromise;
      throw error;
    });
  }
  await root.__campusMongoIndexesPromise;
  return db;
}