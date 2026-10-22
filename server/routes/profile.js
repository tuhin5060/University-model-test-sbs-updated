// Student profile: name + roll number.
//
// Every student gets a unique roll (001, 002, … in sign-up order) shown as
// "Name.007". Name + roll together identify a student, so typing the same pair
// on another phone brings back the same profile, scores and progress.
// A roll is never given to two students: asking for a taken roll returns 409
// with the nearest free roll as a suggestion.
import { AVATARS } from '../../data/site.js';
import { route } from '../route.js';
import { json, clean, readCookie, readJSON, query, cookie, iso, ID_RE, PLAYER_COOKIE, BadRequest } from '../http.js';

const ALLOWED_AVATARS = new Set(AVATARS);
export const MAX_ROLL = 99999;

export const rollText = n => String(n).padStart(3, '0');
export const nameKey = name => clean(name, 60).normalize('NFC').toLowerCase();

export function view(s) {
  if (!s) return null;
  return {
    playerId: s.id,
    name: s.name,
    roll: s.roll,
    tag: `${s.name}.${rollText(s.roll)}`,
    avatar: s.avatar || '🚂',
    createdAt: iso(s.created_at),
  };
}

/** '' / null → null (assign the next roll); "7", "007" → 7; anything else is rejected. */
export function parseRoll(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (!/^\d{1,5}$/.test(text) || Number(text) < 1) throw new BadRequest('Roll হবে একটি সংখ্যা, যেমন 007।');
  return Number(text);
}

/** The cookie wins; the id kept in localStorage is used only when the cookie is gone. */
export function resolvePlayerId(request, requested) {
  return readCookie(request) || (ID_RE.test(String(requested || '')) ? String(requested) : '');
}

const COLUMNS = 'id, name, name_key, roll, avatar, created_at';
const byId = async (db, id) => (await db.query(`SELECT ${COLUMNS} FROM students WHERE id = $1`, [id]))[0] || null;
const byRoll = async (db, roll) => (await db.query(`SELECT ${COLUMNS} FROM students WHERE roll = $1`, [roll]))[0] || null;

export async function freeRoll(db, from = 1) {
  const rows = await db.query(
    'SELECT s AS roll FROM generate_series($1::int, $2::int) s WHERE NOT EXISTS (SELECT 1 FROM students WHERE roll = s) LIMIT 1',
    [from, MAX_ROLL],
  );
  return rows[0]?.roll ?? null;
}

async function rollTaken(db, roll) {
  const suggest = await freeRoll(db, roll + 1) ?? await freeRoll(db, 1);
  return json({
    ok: false,
    code: 'roll_taken',
    suggest,
    error: `Roll ${rollText(roll)} আগে থেকেই অন্য একজনের। ${suggest ? `খালি roll: ${rollText(suggest)}। ` : ''}আগে এই site-এ খেলে থাকলে নিজের আগের roll আর একই নাম লেখো।`,
  }, 409);
}

async function insertStudent(db, { name, key, avatar, roll }) {
  // roll === null → next number after the highest one. A parallel sign-up can
  // take the same number first; then try again with the new highest.
  for (let i = 0; i < 5; i++) {
    const rows = await db.query(
      `INSERT INTO students (id, name, name_key, roll, avatar)
       SELECT $1, $2, $3, COALESCE($4::int, COALESCE(MAX(roll), 0) + 1), $5 FROM students
       ON CONFLICT (roll) DO NOTHING RETURNING ${COLUMNS}`,
      [crypto.randomUUID(), name, key, roll, avatar],
    );
    if (rows[0] || roll !== null) return rows[0] || null;
  }
  return null;
}

/** "Rahim Uddin" → "R•••• U••••": enough to recognise your own name, not to read someone else's. */
export const maskName = name => String(name).split(' ').map(w => { const c = Array.from(w); return c[0] + '•'.repeat(Math.min(4, c.length - 1)); }).join(' ');

const ok = (student, status, extra = {}) =>
  json({ ok: true, player: view(student), ...extra }, status, { 'Set-Cookie': cookie(PLAYER_COOKIE, student.id) });

export default route('profile', {
  async GET(request, db) {
    const id = resolvePlayerId(request, query(request).playerId);
    const student = id ? await byId(db, id) : null;
    if (!student) return json({ ok: true, player: null });
    await db.query('UPDATE students SET last_seen_at = now() WHERE id = $1', [id]);
    return ok(student, 200);
  },

  async POST(request, db) {
    const body = await readJSON(request, 10_000);
    const name = clean(body.name, 60);
    if (name.length < 2) throw new BadRequest('Enter your full name (at least 2 characters).');
    const key = nameKey(name);
    const avatar = ALLOWED_AVATARS.has(body.avatar) ? body.avatar : '🚂';
    const roll = parseRoll(body.roll);
    const myId = resolvePlayerId(request, body.playerId);

    // "আগে খেলেছি": sign in to an existing name + roll only — never create a new student.
    if (body.login === true) {
      if (roll === null) throw new BadRequest('তোমার roll লেখো (যেমন 007)।');
      const owner = await byRoll(db, roll);
      if (!owner) {
        return json({ ok: false, code: 'roll_not_found', error: `Roll ${rollText(roll)}-এ কোনো শিক্ষার্থী নেই। ID কার্ডে যে roll ছিল সেটা দাও। প্রথমবার হলে roll-এর ঘর খালি রাখো।` }, 404);
      }
      if (owner.name_key !== key) {
        return json({ ok: false, code: 'name_mismatch', hint: maskName(owner.name), error: `Roll ${rollText(roll)}-এর সাথে এই নাম মিলছে না। প্রথমবার যে নাম দিয়েছিলে হুবহু সেটা লেখো (${maskName(owner.name)})।` }, 409);
      }
      return ok(owner, 200, { restored: owner.id !== myId });
    }

    const me = myId ? await byId(db, myId) : null;

    const update = async (id, fields) => {
      const rows = await db.query(
        `UPDATE students SET name = $2, name_key = $3, avatar = $4, roll = COALESCE($5::int, roll), updated_at = now(), last_seen_at = now()
         WHERE id = $1 RETURNING ${COLUMNS}`,
        [id, fields.name, fields.key, fields.avatar, fields.roll ?? null],
      );
      return rows[0];
    };

    if (roll !== null) {
      const owner = await byRoll(db, roll);
      if (owner && me && owner.id === me.id) return ok(await update(me.id, { name, key, avatar }), 200); // rename
      if (owner && owner.name_key === key) return ok(await update(owner.id, { name, key, avatar }), 200, { restored: owner.id !== myId });
      if (owner) return rollTaken(db, roll);
      if (me && me.name_key === key) {
        // Same student moving to a free roll they prefer.
        try { return ok(await update(me.id, { name, key, avatar, roll }), 200); } catch { return rollTaken(db, roll); }
      }
      const created = await insertStudent(db, { name, key, avatar, roll });
      return created ? ok(created, 201, { created: true }) : rollTaken(db, roll);
    }

    if (me && me.name_key === key) return ok(await update(me.id, { name, key, avatar }), 200);
    const created = await insertStudent(db, { name, key, avatar, roll: null });
    if (!created) throw new Error('Could not assign a roll number');
    return ok(created, 201, { created: true });
  },
}, 'Could not load or save your student profile right now.');
