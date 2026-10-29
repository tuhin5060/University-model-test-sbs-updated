// Daily Quiz: the same 20 questions for everyone each day (Bangladesh date).
// Used by the server (server/routes/daily.js, which locks each day's set in the
// database) and by the browser only as an offline fallback. Keep it dependency-free.
//
// Every question comes from a real past admission exam (it has a 📌 reference, see
// source.js). Half of each day is CU / DU, half is the other universities. Each half
// is its own rotation: no question repeats until all of that half has been used,
// then a new round starts.
import { examRef } from './source.js';
import { EXAM_SECONDS } from './scoring.js';

export const DAILY_SIZE = 20;
export const DAILY_FOCUS = 10; // CU + DU questions per day
export const DAILY_SECONDS = DAILY_SIZE * EXAM_SECONDS; // 12 minutes
export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date in Bangladesh (UTC+6), e.g. "2026-10-29". */
export const dhakaDay = (now = Date.now()) => new Date(now + 6 * 3600_000).toISOString().slice(0, 10);
/** The day before / after a "YYYY-MM-DD" key. */
export const shiftDay = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

const FOCUS = /(?:^|[^A-Za-z])(?:CU|DU)(?![A-Za-z])|চবি|ঢাবি/;
export const isFocus = q => FOCUS.test(examRef(q.source));

/** The two rotations: CU/DU past-year questions and all other past-year questions. */
export function dailyPools(questions) {
  const past = questions.filter(q => examRef(q.source)).sort((a, b) => (a.id < b.id ? -1 : 1));
  return { focus: past.filter(isFocus), other: past.filter(q => !isFocus(q)) };
}

function random(seedText) {
  let h = 2166136261;
  for (const ch of String(seedText)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, seedText) {
  const out = [...list];
  const rand = random(seedText);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * n questions from one rotation. `used` = ids already given in the current round.
 * When fewer than n are left, those come first and a new round fills the rest.
 * → { ids, round, roundIds } (roundIds = the ids that count as used in `round`).
 */
function fromRotation(pool, n, { round = 0, used = [] } = {}, seed) {
  const seen = new Set(used);
  const left = shuffled(pool.filter(q => !seen.has(q.id)), `${seed}-${round}`).slice(0, n).map(q => q.id);
  if (left.length === n || pool.length <= left.length) return { ids: left, round, roundIds: [...used, ...left] };
  const next = round + 1;
  const taken = new Set(left);
  const fresh = shuffled(pool.filter(q => !taken.has(q.id)), `${seed}-${next}`).slice(0, n - left.length).map(q => q.id);
  return { ids: [...left, ...fresh], round: next, roundIds: fresh };
}

/**
 * The day's set. `state` = { focus: { round, used }, other: { round, used } } from the
 * previous days (server); without it (offline fallback) the pick is still the same
 * for everyone that day, just without the no-repeat guarantee.
 * → { ids, state } where state is what the next day continues from.
 */
export function pickDaily(day, questions, state = {}) {
  const pools = dailyPools(questions);
  const focusN = Math.min(DAILY_FOCUS, pools.focus.length);
  const focus = fromRotation(pools.focus, focusN, state.focus, `daily-cudu-${day}`);
  const other = fromRotation(pools.other, DAILY_SIZE - focus.ids.length, state.other, `daily-other-${day}`);
  return {
    ids: shuffled([...focus.ids, ...other.ids], `daily-mix-${day}`),
    state: { focus: { round: focus.round, used: focus.roundIds }, other: { round: other.round, used: other.roundIds } },
  };
}
