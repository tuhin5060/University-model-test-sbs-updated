// In-memory Postgres (PGlite) with the same query/batch interface as Neon.
// Used by the tests and by `npm run dev` when DATABASE_URL is not set.
import { PGlite } from '@electric-sql/pglite';
import { SCHEMA } from './db.js';

export async function createLocalDb() {
  const pg = new PGlite();
  for (const text of SCHEMA) await pg.query(text);
  const query = async (text, params = []) => (await pg.query(text, params)).rows;
  return {
    query,
    batch: list => pg.transaction(async tx => {
      const out = [];
      for (const [text, params = []] of list) out.push((await tx.query(text, params)).rows);
      return out;
    }),
    close: () => pg.close(),
  };
}
