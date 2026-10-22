import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { preloadBlock, currentBlock } from '../scripts/preload.mjs';

test('index.html preloads every module main.js imports', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(currentBlock(html), preloadBlock(), 'out of date — run: node scripts/preload.mjs');
});
