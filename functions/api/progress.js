import { cookie, json, PLAYER_COOKIE, PROGRESS_COOKIE, readCookie, readJSON } from "../_lib/shared.js";

function principal(request) {
  return readCookie(request, PLAYER_COOKIE) || readCookie(request, PROGRESS_COOKIE);
}
async function migrateAnonymousProgress(db, request, playerId) {
  if (!playerId || playerId !== readCookie(request, PLAYER_COOKIE)) return;
  const anonymousId = readCookie(request, PROGRESS_COOKIE);
  if (!anonymousId || anonymousId === playerId) return;
  const current = await db.prepare("SELECT id FROM progress WHERE id = ?").bind(playerId).first();
  if (!current) {
    await db.prepare("INSERT OR IGNORE INTO progress (id, payload, updated_at) SELECT ?, payload, updated_at FROM progress WHERE id = ?").bind(playerId, anonymousId).run();
  }
  await db.prepare("DELETE FROM progress WHERE id = ?").bind(anonymousId).run();
}
export async function onRequest({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "Database binding DB is missing." }, 503);
  let id = principal(request);
  const headers = new Headers();
  if (!id) {
    id = crypto.randomUUID();
    headers.append("Set-Cookie", cookie(PROGRESS_COOKIE, id));
  }
  try {
    await migrateAnonymousProgress(env.DB, request, id);
    if (request.method === "GET") {
      const row = await env.DB.prepare("SELECT payload, updated_at FROM progress WHERE id = ?").bind(id).first();
      return json({ ok: true, progress: row ? JSON.parse(row.payload) : null, updatedAt: row?.updated_at || null }, 200, headers);
    }
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, { Allow: "GET, POST" });
    const body = await readJSON(request);
    const progress = body?.progress;
    if (!progress || typeof progress !== "object" || Array.isArray(progress) || progress.v !== 2) return json({ ok: false, error: "Invalid progress payload." }, 400);
    const now = new Date().toISOString();
    await env.DB.prepare("INSERT INTO progress (id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at")
      .bind(id, JSON.stringify(progress), now).run();
    return json({ ok: true, updatedAt: now }, 200, headers);
  } catch (error) {
    console.error("Cloudflare progress API failed", error?.message || "unknown error");
    return json({ ok: false, error: "Could not save or load progress right now." }, 500, headers);
  }
}
