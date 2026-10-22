// Cold starts: the schema statements run once per database, later instances only check the stored version.
import test from 'node:test';
import assert from 'node:assert/strict';
import { prepare, SCHEMA_VERSION } from '../server/db.js';
import { createLocalDb } from '../server/local-db.js';

test('schema runs once, then one small query per new instance', async () => {
  const db = await createLocalDb();
  let batches = 0;
  const counted = { ...db, batch: list => { batches++; return db.batch(list); } };
  await prepare(counted);
  assert.equal(batches, 1);
  assert.equal((await db.query("SELECT value FROM settings WHERE key = 'schema'"))[0].value, SCHEMA_VERSION);
  await prepare(counted);
  await prepare(counted);
  assert.equal(batches, 1, 'already up to date');
  await db.query("UPDATE settings SET value = '\"old\"' WHERE key = 'schema'");
  await prepare(counted);
  assert.equal(batches, 2, 'a changed schema runs again');
  await db.close();
});
