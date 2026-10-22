import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { preloadBlock, currentBlock, swBlock, currentSwBlock, withCsp } from '../scripts/preload.mjs';

const read = f => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('index.html preloads every module main.js imports', () => {
  assert.equal(currentBlock(read('index.html')), preloadBlock(), 'out of date — run: node scripts/preload.mjs');
});

test('sw.js lists the current files and a version matching their contents', () => {
  assert.equal(currentSwBlock(read('sw.js')), swBlock(read('index.html')), 'out of date — run: node scripts/preload.mjs');
});

test('the Content-Security-Policy lists the current inline scripts (vercel.json and _headers)', () => {
  const want = withCsp(read('vercel.json'), read('_headers'), read('index.html'));
  assert.equal(read('vercel.json'), want.vercel, 'out of date — run: npm run sync');
  assert.equal(read('_headers'), want.headers, 'out of date — run: npm run sync');
});
