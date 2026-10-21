// In-memory Postgres (PGlite) with the same query/batch interface as Neon.
// Used by the tests and by `npm run dev` when DATABASE_URL is not set.
import { PGlite } from '@electric-sql/pglite';
import { SCHEMA } from './db.js';

// Neon's HTTP API receives every parameter as text; do the same so tests catch
// SQL that only works with typed parameters.
const asText = v => (v === null || v === undefined ? null : typeof v === 'object' ? JSON.stringify(v) : String(v));

export async function createLocalDb() {
  const pg = new PGlite();
  for (const text of SCHEMA) await pg.query(text);
  const query = async (text, params = []) => (await pg.query(text, params.map(asText))).rows;
  return {
    query,
    batch: list => pg.transaction(async tx => {
      const out = [];
      for (const [text, params = []] of list) out.push((await tx.query(text, params.map(asText))).rows);
      return out;
    }),
    close: () => pg.close(),
  };
}
