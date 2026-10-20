// Local dev server: static files + the /api routes.
// With MONGODB_URI set it uses MongoDB; otherwise an in-memory database so the
// whole site (including the leaderboard) works offline. Data resets on restart.
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

let apiReady = null;
async function api() {
  apiReady ||= (async () => {
    const db = await import('../lib/mongodb.js');
    if (!process.env.MONGODB_URI) {
      const { createMemoryDb } = await import('../lib/memory-db.js');
      db.useDatabase(createMemoryDb());
      console.log('ℹ️  MONGODB_URI not set — using an in-memory database (resets on restart).');
    }
    return {
      '/api/profile': (await import('../api/profile.js')).default,
      '/api/scores': (await import('../api/scores.js')).default,
    };
  })();
  return apiReady;
}

function vercelish(req, res, url, body) {
  req.query = Object.fromEntries(url.searchParams);
  req.body = body;
  res.status = code => { res.statusCode = code; return res; };
  res.json = obj => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); return res; };
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const routes = url.pathname.startsWith('/api/') ? await api() : null;
    if (routes) {
      const handler = routes[url.pathname];
      if (!handler) { res.writeHead(404); return res.end('Not found'); }
      let raw = '';
      for await (const chunk of req) raw += chunk;
      vercelish(req, res, url, raw || undefined);
      return await handler(req, res);
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
