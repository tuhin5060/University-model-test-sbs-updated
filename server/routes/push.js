// Browser notifications: a daily 8 PM reminder and "new topic" news.
//
// GET  ?                       → { enabled, publicKey } (enabled = keys are set on this server)
// GET  ?message=1&endpoint=…   → the text the service worker shows when a push arrives
// POST { action: 'subscribe', subscription: { endpoint }, playerId }
// POST { action: 'unsubscribe', endpoint }
// POST { action: 'test', endpoint } → one push to this browser now
// cron (api/push-cron.js, daily at 14:00 UTC = 8 PM in Bangladesh) → runDaily()
//
// Pushes carry no payload (no encryption needed): the browser wakes up, asks
// ?message=1 and shows that text. Sending is signed with VAPID (ES256) using
// WebCrypto only — no npm package, so it runs on Vercel and Cloudflare alike.
// The private key lives only in the host environment (VAPID_PRIVATE_JWK).
import { TOPICS } from '../../data/questions/index.js';
import { getDb, NotConfigured } from '../db.js';
import { route } from '../route.js';
import { json, readJSON, query, BadRequest } from '../http.js';
import { resolvePlayerId } from './profile.js';

export const SITE_URL = 'https://sbs-university-admission-model-test.vercel.app/';
// Only real browser push services are contacted (never an arbitrary URL).
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];

export function validEndpoint(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && String(value).length <= 1000 && PUSH_HOSTS.some(re => re.test(url.hostname)) ? url.href : '';
  } catch {
    return '';
  }
}

// ---- VAPID ------------------------------------------------------------------------

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

function vapidKeys(env) {
  try {
    const jwk = JSON.parse(env?.VAPID_PRIVATE_JWK || '');
    if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.d || !jwk.x || !jwk.y) return null;
    // Public key for the browser: uncompressed point 0x04 ‖ x ‖ y.
    const publicKey = b64url(new Uint8Array([4, ...fromB64url(jwk.x), ...fromB64url(jwk.y)]));
    return { jwk, publicKey };
  } catch {
    return null;
  }
}

/** "vapid t=<JWT>, k=<public key>" for one push service origin. */
export async function vapidHeader(endpoint, keys, now = Date.now()) {
  const enc = obj => b64url(new TextEncoder().encode(JSON.stringify(obj)));
  const unsigned = `${enc({ typ: 'JWT', alg: 'ES256' })}.${enc({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: SITE_URL })}`;
  const key = await crypto.subtle.importKey('jwk', { ...keys.jwk, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned));
  return `vapid t=${unsigned}.${b64url(sig)}, k=${keys.publicKey}`;
}

/** → 'ok' | 'gone' (subscription expired: delete it) | 'error'. */
export async function sendPush(endpoint, keys, fetchFn = fetch) {
  try {
    const res = await fetchFn(endpoint, {
      method: 'POST',
      headers: { Authorization: await vapidHeader(endpoint, keys), TTL: '43200', Urgency: 'normal', 'Content-Length': '0' },
    });
    if (res.status === 404 || res.status === 410) return 'gone';
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

// ---- messages ---------------------------------------------------------------------

const DAILY = [
  { title: '📝 আজকের Model Test দিয়েছ?', body: '১০ মিনিট সময় দাও—আজকের practice তোমাকে স্বপ্নের ক্যাম্পাসের এক ধাপ কাছে নেবে।', url: '/#start/exam' },
  { title: '🔥 Streak ধরে রাখো!', body: 'আজকের ৫টি প্রশ্নের চ্যালেঞ্জ অপেক্ষা করছে—মাত্র ২ মিনিট।', url: '/#home' },
  { title: '🎮 একটা Fun Quiz হয়ে যাক?', body: 'খেলতে খেলতে ১০টি প্রশ্ন—দেখো আজ কত points পাও।', url: '/#start/fun' },
  { title: '📖 আজ কয়টা নতুন শব্দ শিখলে?', body: 'Vocabulary-তে ৫ মিনিট দাও, পরীক্ষার হলে কাজে লাগবে।', url: '/#vocab' },
];
const FALLBACK = DAILY[0];

/** Calendar date in Bangladesh (UTC+6), e.g. "2026-10-22". */
const dhakaDate = now => new Date(now + 6 * 3600_000).toISOString().slice(0, 10);

async function getSetting(db, key) {
  return (await db.query('SELECT value FROM settings WHERE key = $1', [key]))[0]?.value ?? null;
}
const putSetting = (db, key, value) =>
  db.query('INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, value]);

/**
 * The 8 PM job. New topics since the last run are announced to everyone; otherwise
 * the day's reminder goes to every subscriber who has not taken a test today.
 */
export async function runDaily(db, env, { now = Date.now(), fetchFn = fetch, topics = TOPICS } = {}) {
  const keys = vapidKeys(env);
  if (!keys) throw new BadRequest('VAPID_PRIVATE_JWK is not set.', 503);
  const today = dhakaDate(now);
  const known = await getSetting(db, 'known_topics');
  const fresh = known ? topics.filter(t => !known.includes(t.id)) : [];
  await putSetting(db, 'known_topics', topics.map(t => t.id));

  let message;
  if (fresh.length) {
    message = {
      title: '🆕 নতুন topic যোগ হয়েছে',
      body: `${fresh.map(t => t.title).join(', ')} — ${fresh.reduce((n, t) => n + t.count, 0)}টি নতুন প্রশ্ন। এখনই practice করো!`,
      url: `/#start/fun/${fresh[0].id}`,
    };
  } else {
    message = DAILY[Math.floor(now / 86400_000) % DAILY.length];
  }
  await putSetting(db, 'push_message', { ...message, date: today });

  // Everyone gets news; the plain reminder skips students who already practised today.
  const subs = await db.query(
    `SELECT p.endpoint FROM push_subs p
     WHERE $1::boolean OR p.player_id IS NULL OR NOT EXISTS (
       SELECT 1 FROM score_attempts a WHERE a.player_id = p.player_id AND (a.at AT TIME ZONE 'Asia/Dhaka')::date = $2::date)
     LIMIT 5000`,
    [fresh.length > 0, today],
  );
  const total = (await db.query('SELECT count(*)::int AS n FROM push_subs'))[0].n;
  const result = { sent: 0, gone: 0, failed: 0, skipped: total - subs.length };
  for (let i = 0; i < subs.length; i += 25) {
    const batch = subs.slice(i, i + 25);
    const outcomes = await Promise.all(batch.map(s => sendPush(s.endpoint, keys, fetchFn)));
    const gone = batch.filter((_, j) => outcomes[j] === 'gone').map(s => s.endpoint);
    const ok = batch.filter((_, j) => outcomes[j] === 'ok').map(s => s.endpoint);
    if (gone.length) await db.query('DELETE FROM push_subs WHERE endpoint = ANY($1::text[])', [toPgArray(gone)]);
    if (ok.length) await db.query('UPDATE push_subs SET last_sent_at = now() WHERE endpoint = ANY($1::text[])', [toPgArray(ok)]);
    result.sent += ok.length;
    result.gone += gone.length;
    result.failed += outcomes.filter(o => o === 'error').length;
  }
  return { ...result, message };
}

/** Text parameter for a Postgres text[] (Neon receives every parameter as text). */
const toPgArray = list => `{${list.map(s => `"${s.replace(/["\\]/g, c => `\\${c}`)}"`).join(',')}}`;

// ---- routes -----------------------------------------------------------------------

export default route('push', {
  async GET(request, db, env) {
    const q = query(request);
    if (q.message !== undefined) {
      const endpoint = validEndpoint(q.endpoint);
      if (endpoint) {
        const [row] = await db.query(
          `UPDATE push_subs p SET pending = NULL FROM (SELECT endpoint, pending FROM push_subs WHERE endpoint = $1 AND pending IS NOT NULL) old
           WHERE p.endpoint = old.endpoint RETURNING old.pending`,
          [endpoint],
        );
        if (row?.pending) return json({ ok: true, message: row.pending });
      }
      return json({ ok: true, message: (await getSetting(db, 'push_message')) || FALLBACK });
    }
    const keys = vapidKeys(env);
    return json({ ok: true, enabled: !!keys, publicKey: keys?.publicKey || null });
  },

  async POST(request, db, env) {
    const body = await readJSON(request, 5_000);
    const endpoint = validEndpoint(body.subscription?.endpoint ?? body.endpoint);
    if (!endpoint) throw new BadRequest('Unsupported notification service.');
    if (body.action === 'subscribe') {
      const id = resolvePlayerId(request, body.playerId);
      const player = id ? (await db.query('SELECT id FROM students WHERE id = $1', [id]))[0]?.id || null : null;
      await db.query(
        `INSERT INTO push_subs (endpoint, player_id) VALUES ($1, $2) ON CONFLICT (endpoint) DO UPDATE SET player_id = COALESCE(EXCLUDED.player_id, push_subs.player_id)`,
        [endpoint, player],
      );
      return json({ ok: true });
    }
    if (body.action === 'unsubscribe') {
      await db.query('DELETE FROM push_subs WHERE endpoint = $1', [endpoint]);
      return json({ ok: true });
    }
    if (body.action === 'test') {
      const keys = vapidKeys(env);
      if (!keys) throw new BadRequest('Notification এই server-এ এখনো চালু হয়নি।', 503);
      const [row] = await db.query(
        `UPDATE push_subs SET pending = $2::jsonb WHERE endpoint = $1
           AND (last_sent_at IS NULL OR last_sent_at < now() - interval '30 seconds') RETURNING endpoint`,
        [endpoint, { title: '✅ Notification চালু আছে', body: 'প্রতিদিন রাত ৮টায় practice-এর কথা মনে করিয়ে দেব, নতুন topic এলেও জানাব।', url: '/#home' }],
      );
      if (!row) throw new BadRequest('একটু পরে আবার চেষ্টা করো।', 429);
      const outcome = await sendPush(endpoint, keys);
      await db.query(outcome === 'gone' ? 'DELETE FROM push_subs WHERE endpoint = $1' : 'UPDATE push_subs SET last_sent_at = now() WHERE endpoint = $1', [endpoint]);
      if (outcome !== 'ok') throw new BadRequest('Notification পাঠানো গেল না—browser-এর notification অনুমতি দেখে আবার চালু করো।', 502);
      return json({ ok: true });
    }
    throw new BadRequest('Unknown action.');
  },
}, 'Notification service is unavailable right now.');

/** Vercel Cron entry: needs `Authorization: Bearer <CRON_SECRET>` (Vercel adds it). */
export async function cron(request, env = {}) {
  const secret = env.CRON_SECRET || '';
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json({ ok: false, error: 'Unauthorized' }, 401);
  try {
    const result = await runDaily(await getDb(env), env);
    console.log('push cron', JSON.stringify({ ...result, message: result.message.title }));
    return json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof BadRequest) return json({ ok: false, error: error.message }, error.status);
    if (error instanceof NotConfigured) return json({ ok: false, error: 'Database is not configured.' }, 503);
    console.error('push cron failed', error?.message);
    return json({ ok: false, error: 'Push job failed.' }, 500);
  }
}
