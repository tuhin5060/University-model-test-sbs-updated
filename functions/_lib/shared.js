export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PLAYER_COOKIE = "campus_player";
export const PROGRESS_COOKIE = "campus_progress";

export function clean(value, max = 100) {
  return String(value ?? "").replace(/[<>\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}
export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const part = header.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  try {
    const value = part ? decodeURIComponent(part.slice(name.length + 1)) : "";
    return UUID_RE.test(value) ? value : "";
  } catch { return ""; }
}
export function cookie(name, value) {
  return name + "=" + encodeURIComponent(value) + "; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax";
}
export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", ...headers }
  });
}
export async function readJSON(request, maxBytes = 1_500_000) {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new Error("Request body is too large.");
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new Error("Invalid JSON."); }
}
export const isoNow = () => new Date().toISOString();
export function appendCookie(headers, value) {
  headers.append("Set-Cookie", value);
  return headers;
}
