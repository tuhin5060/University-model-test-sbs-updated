import { json, readJSON } from "../_lib/shared.js";
const ONLINE_MS = 75 * 1000;
const SID_RE = /^[a-z0-9]{16,40}$/i;

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, { Allow: "POST" });
  if (!env.DB) return json({ ok: false, error: "Database binding DB is missing." }, 503);
  let body;
  try { body = await readJSON(request, 5_000); } catch { return json({ ok: false, error: "Invalid JSON." }, 400); }
  const sid = String(body.sid || "");
  if (!SID_RE.test(sid)) return json({ ok: false, error: "Invalid visitor id." }, 400);
  try {
    const now = new Date();
    if (body.leave === true) await env.DB.prepare("DELETE FROM presence WHERE sid = ?").bind(sid).run();
    else await env.DB.prepare("INSERT INTO presence (sid, at) VALUES (?, ?) ON CONFLICT(sid) DO UPDATE SET at = excluded.at").bind(sid, now.toISOString()).run();
    const cutoff = new Date(now.getTime() - ONLINE_MS).toISOString();
    await env.DB.prepare("DELETE FROM presence WHERE at < ?").bind(new Date(now.getTime() - 10 * 60 * 1000).toISOString()).run();
    const result = await env.DB.prepare("SELECT COUNT(*) AS online FROM presence WHERE at >= ?").bind(cutoff).first();
    return json({ ok: true, online: result?.online || 0 });
  } catch (error) {
    console.error("Cloudflare visitor API failed", error?.message || "unknown error");
    return json({ ok: false, error: "Live visitor count is unavailable right now." }, 500);
  }
}
