// Lists every module main.js imports (directly or through other modules) as
// <link rel="modulepreload"> in index.html, so the browser fetches them all at
// once instead of discovering them one import level at a time.
//   node scripts/preload.mjs          → rewrite the list in index.html
//   node scripts/preload.mjs --check  → exit 1 if the list is out of date
import fs from 'node:fs';
import path from 'node:path';

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = path.join(root, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const now = currentBlock(html);
  const want = preloadBlock();
  if (!now) throw new Error(`index.html needs ${START} … ${END} markers`);
  if (process.argv.includes('--check')) {
    if (now !== want) { console.error('modulepreload list is out of date — run: node scripts/preload.mjs'); process.exit(1); }
  } else {
    fs.writeFileSync(file, html.replace(now, want));
    console.log(`index.html: ${moduleGraph().length} modulepreload links`);
  }
}
