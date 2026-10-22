// Local dev server: static files + the /api routes (same handlers as Vercel/Cloudflare).
// With DATABASE_URL set it uses that Neon database; otherwise an in-memory
// Postgres (PGlite), so the whole site works offline. Data resets on restart.
//   npm run dev            → http://localhost:3000
//   PORT=4000 npm run dev
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT) || 3000;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.md': 'text/plain; charset=utf-8',
};
const ROUTES = ['profile', 'scores', 'visitors', 'progress', 'community', 'push'];

let apiReady = null;
async function api() {
  apiReady ||= (async () => {
    const db = await import('../server/db.js');
    if (!db.databaseUrl(process.env)) {
      const { createLocalDb } = await import('../server/local-db.js');
      db.useDatabase(await createLocalDb());
      console.log('ℹ️  DATABASE_URL not set — using an in-memory database (resets on restart).');
    }
    const routes = {};
    for (const r of ROUTES) routes[`/api/${r}`] = (await import(`../server/routes/${r}.js`)).default;
    return routes;
  })();
  return apiReady;
}

/** Node request → Web Request → route → Node response. */
async function runRoute(handler, req, res, url) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);
  const out = await handler(new Request(`https://localhost${url.pathname}${url.search}`, { method: req.method, headers: req.headers, body }), process.env);
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const routes = url.pathname.startsWith('/api/') ? await api() : null;
    if (routes) {
      const handler = routes[url.pathname];
      if (!handler) { res.writeHead(404); return res.end('Not found'); }
      return await runRoute(handler, req, res, url);
    }
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(bytes);
  } catch (error) {
    if (!res.headersSent) res.writeHead(error?.code === 'ENOENT' || error?.code === 'EISDIR' ? 404 : 500);
    res.end(error?.code === 'ENOENT' ? 'Not found' : 'Server error');
    if (error?.code !== 'ENOENT') console.error(error);
  }
}).listen(port, '127.0.0.1', () => console.log(`Open http://localhost:${port}`));
