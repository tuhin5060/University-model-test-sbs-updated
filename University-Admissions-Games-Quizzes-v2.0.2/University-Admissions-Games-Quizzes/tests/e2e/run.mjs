// Browser end-to-end check (optional, needs Playwright):
//   npm i -D playwright && npx playwright install chromium
//   npm run test:e2e
// Starts the dev server (in-memory DB), then on a phone and a desktop viewport:
// visits every page (no JS errors, no horizontal scroll), plays a Fun Quiz,
// a Model Test and the daily challenge, and checks the leaderboard save.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.log('Playwright is not installed — skipping e2e. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(0);
}

const PORT = 3999;
const BASE = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(PORT), MONGODB_URI: '' }, stdio: 'pipe' });
await new Promise(r => server.stdout.on('data', d => String(d).includes('Open') && r()));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ROUTES = ['home', 'start/fun', 'start/exam/article', 'start/practice', 'tips', 'tips/cu-english-roadmap', 'universities', 'university/cu', 'university/du', 'progress', 'leaderboard', 'about'];
let failed = false;
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 900 }]) {
    const page = await (await browser.newContext({ viewport })).newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    for (const r of ROUTES) {
      await page.goto(BASE + '#' + r);
      await page.waitForSelector('#main h1, #main h2');
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(width <= viewport.width, `${r}: page is wider than the screen (${width}px)`);
    }
    // Fun Quiz
    await page.goto(BASE + '#start/fun/tense');
    await page.fill('#player-name', `Tester ${viewport.width}`);
    await page.locator('#setup-form button[type=submit]:visible').first().click();
    await page.waitForSelector('.play-fun');
    for (let i = 0; i < 10; i++) {
      await page.locator('.opt:not([disabled])').first().click();
      await page.click('[data-action=next]');
    }
    await page.waitForSelector('.result-hero');
    await page.waitForFunction(() => /save হয়েছে/.test(document.getElementById('save-status')?.textContent || ''));
    // Model Test
    await page.goto(BASE + '#start/exam/article');
    await page.locator('#setup-form button[type=submit]:visible').first().click();
    await page.waitForSelector('.play-exam');
    await page.locator('.opt').first().click();
    await page.click('[data-action=flag]');
    if (viewport.width < 960) await page.click('[data-action=palette]');
    await page.locator('.palette [data-action=submit]').click();
    await page.waitForSelector('.result-hero');
    assert.equal(await page.locator('.review').count(), 20);
    // Daily challenge
    await page.goto(BASE + '#home');
    await page.click('[data-action=daily]');
    for (let i = 0; i < 5; i++) {
      await page.locator('.opt').first().click();
      await page.click('[data-action=next]');
    }
    await page.waitForSelector('.result-hero');
    await page.goto(BASE + '#leaderboard');
    await page.waitForSelector('.lb-list li');
    assert.deepEqual(errors, [], 'no JavaScript errors');
    console.log(`✅ e2e passed at ${viewport.width}px`);
  }
} catch (e) {
  failed = true;
  console.error('❌', e.message);
} finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
