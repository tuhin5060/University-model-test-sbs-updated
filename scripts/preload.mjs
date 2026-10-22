// Keeps two generated lists in sync with the code:
// 1. index.html: every module main.js imports (directly or through other
//    modules) as <link rel="modulepreload">, so the browser fetches them all at
//    once instead of discovering them one import level at a time.
// 2. sw.js: the files kept on the phone (PRECACHE) and VERSION, a hash of their
//    contents — any change to them gives a new version, so phones update.
//   node scripts/preload.mjs          → rewrite both
//   node scripts/preload.mjs --check  → exit 1 if either is out of date
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const START = '<!-- modulepreload:start -->';
const END = '<!-- modulepreload:end -->';

export function moduleGraph(entry = 'assets/js/main.js') {
  const seen = new Set();
  const walk = rel => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const [, spec] of src.matchAll(/^\s*(?:import|export)\s[^;]*?from\s*['"](\.{1,2}\/[^'"]+)['"]/gm)) {
      walk(path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec)));
    }
  };
  walk(entry);
  seen.delete(entry);
  return [...seen].sort();
}

export function preloadBlock() {
  const links = moduleGraph().map(f => `  <link rel="modulepreload" href="${f}">`);
  return [`${START}`, ...links, `  ${END}`].join('\n');
}

export function currentBlock(html) {
  const a = html.indexOf(START), b = html.indexOf(END);
  return a < 0 || b < 0 ? null : html.slice(a, b + END.length);
}

const SW_START = '// precache:start';
const SW_END = '// precache:end';
// Small files every page view needs besides the modules (the hero photo in two sizes).
const STATIC = ['manifest.webmanifest', 'assets/img/logo.svg', 'assets/img/favicon.svg', 'assets/img/icon-192.png', 'assets/img/cu-gate-480.webp', 'assets/img/cu-gate-768.webp'];

/** URLs exactly as index.html requests them ('./' is index.html itself). */
export function precacheList(html) {
  const entry = [...html.matchAll(/(?:href|src)="(assets\/(?:css\/styles\.css|js\/main\.js)[^"]*)"/g)].map(m => m[1]);
  return ['./', ...entry, ...moduleGraph(), ...STATIC];
}

export function swBlock(html) {
  const list = precacheList(html);
  const hash = crypto.createHash('sha256');
  for (const url of list) {
    const file = url === './' ? 'index.html' : url.split('?')[0];
    hash.update(`${url}\n`).update(fs.readFileSync(path.join(root, file)));
  }
  const version = hash.digest('hex').slice(0, 12);
  return [SW_START, `const VERSION = '${version}';`, `const PRECACHE = ${JSON.stringify(list, null, 2).replace(/"/g, "'")};`, SW_END].join('\n');
}

export function currentSwBlock(sw) {
  const a = sw.indexOf(SW_START), b = sw.indexOf(SW_END);
  return a < 0 || b < 0 ? null : sw.slice(a, b + SW_END.length);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = path.join(root, 'index.html');
  const swFile = path.join(root, 'sw.js');
  let html = fs.readFileSync(file, 'utf8');
  const now = currentBlock(html);
  const want = preloadBlock();
  if (!now) throw new Error(`index.html needs ${START} … ${END} markers`);
  const check = process.argv.includes('--check');
  if (check && now !== want) { console.error('modulepreload list is out of date — run: node scripts/preload.mjs'); process.exit(1); }
  if (!check) {
    html = html.replace(now, want);
    fs.writeFileSync(file, html);
    console.log(`index.html: ${moduleGraph().length} modulepreload links`);
  }
  const sw = fs.readFileSync(swFile, 'utf8');
  const swNow = currentSwBlock(sw);
  if (!swNow) throw new Error(`sw.js needs ${SW_START} … ${SW_END} markers`);
  const swWant = swBlock(html);
  if (check && swNow !== swWant) { console.error('sw.js is out of date — run: node scripts/preload.mjs'); process.exit(1); }
  if (!check) {
    fs.writeFileSync(swFile, sw.replace(swNow, swWant));
    console.log(`sw.js: ${precacheList(html).length} files, version ${swWant.match(/VERSION = '(\w+)'/)[1]}`);
  }
}
