import { AVATARS } from "../../data/site.js";
import { clean, cookie, json, PLAYER_COOKIE, readCookie, readJSON, UUID_RE } from "../_lib/shared.js";

const ALLOWED_AVATARS = new Set(AVATARS);
const view = row => row ? ({
  playerId: row.id, name: row.name, avatar: row.avatar || "🚂",
  createdAt: row.created_at, updatedAt: row.updated_at
}) : null;

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return json({ ok: false, error: "Database binding DB is missing." }, 503);
  try {
    if (request.method === "GET") {
      const requested = new URL(request.url).searchParams.get("playerId") || "";
      const cookieId = readCookie(request, PLAYER_COOKIE);
      const id = cookieId || (UUID_RE.test(requested) ? requested : "");
      if (!id) return json({ ok: true, player: null });
      const row = await db.prepare("SELECT id, name, avatar, created_at, updated_at FROM students WHERE id = ?").bind(id).first();
      if (!row) return json({ ok: true, player: null });
      await db.prepare("UPDATE students SET last_seen_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
      return json({ ok: true, player: view(row) }, 200, { "Set-Cookie": cookie(PLAYER_COOKIE, id) });
    }
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, { Allow: "GET, POST" });
    const body = await readJSON(request, 20_000);
    const name = clean(body.name, 60);
    const avatar = ALLOWED_AVATARS.has(body.avatar) ? body.avatar : "🚂";
    if (name.length < 2) return json({ ok: false, error: "Enter your full name (at least 2 characters)." }, 400);

    const now = new Date().toISOString();
    const fromCookie = readCookie(request, PLAYER_COOKIE);
    const requested = UUID_RE.test(String(body.playerId || "")) ? String(body.playerId) : "";
    const id = fromCookie || requested || crypto.randomUUID();
    const existing = await db.prepare("SELECT id FROM students WHERE id = ?").bind(id).first();
    if (existing) {
      await db.prepare("UPDATE students SET name = ?, avatar = ?, updated_at = ?, last_seen_at = ? WHERE id = ?").bind(name, avatar, now, now, id).run();
      await db.prepare("UPDATE score_attempts SET name = ?, avatar = ? WHERE player_id = ?").bind(name, avatar, id).run();
    } else {
      await db.prepare("INSERT INTO students (id, name, avatar, created_at, updated_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, name, avatar, now, now, now).run();
    }
    const row = await db.prepare("SELECT id, name, avatar, created_at, updated_at FROM students WHERE id = ?").bind(id).first();
    return json({ ok: true, player: view(row) }, 201, { "Set-Cookie": cookie(PLAYER_COOKIE, id) });
  } catch (error) {
    return json({ ok: false, error: error?.message === "Invalid JSON." ? error.message : "Could not load or save your student profile right now." }, 500);
  }
}
