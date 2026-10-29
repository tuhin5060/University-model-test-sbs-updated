// Browser end-to-end check (optional, needs Playwright):
//   npm i -D playwright && npx playwright install chromium
//   npm run test:e2e
// Starts the dev server (in-memory DB), then on a phone and a desktop viewport:
// visits every page (no JS errors, no horizontal scroll), plays a Fun Quiz,
// a Model Test and the Daily Quiz, and checks the Score page, Daily page and sign-in.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.log('Playwright is not installed — skipping e2e. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(0);
}

const PORT = 3000 + Math.floor(Math.random() * 900);
const BASE = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(PORT), DATABASE_URL: '', POSTGRES_URL: '' }, stdio: 'pipe' });
await new Promise(r => server.stdout.on('data', d => String(d).includes('Open') && r()));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ROUTES = ['home', 'start/fun', 'start/exam/article', 'start/practice', 'tips', 'tips/cu-english-roadmap', 'universities', 'university/cu', 'university/du', 'university/cou', 'vocab', 'start/fun/memorising', 'progress', 'score', 'daily', 'about'];
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
    // Accept whatever in-page dialog is open (new-student Roll ID card, "submit now?" question).
    const okDialogs = async p => {
      const ok = p.locator('dialog[open] .btn:not(.ghost)');
      if (await ok.count()) await ok.first().click();
    };
    const playUntilResult = async (p, cls) => {
      await p.waitForSelector(cls);
      for (let i = 0; i < 80 && !(await p.locator('.result-hero').count()); i++) {
        await okDialogs(p);
        const opt = p.locator('.opt:not([disabled])').first();
        if (await opt.count()) await opt.click({ timeout: 2000 }).catch(() => {}); // the page may re-render meanwhile
        const next = p.locator('[data-action=next]:visible, [data-action=submit]:visible').first();
        if (await next.count()) await next.click({ timeout: 2000 }).catch(() => {});
        await p.waitForTimeout(80);
      }
      await okDialogs(p);
      await p.waitForSelector('.result-hero');
    };
    // Fun Quiz: a name (and college) is required before starting.
    await page.goto(BASE + '#start/fun/tense');
    await page.locator('#setup-form button[type=submit]:visible').first().click();
    await page.waitForSelector('[data-id-error]:not([hidden])');
    assert.equal(await page.locator('.play-fun').count(), 0, 'quiz did not start without a name');
    await page.fill('#setup-form [name=name]', `Tester ${viewport.width}`);
    await page.fill('#setup-form [name=college]', 'Test College');
    await page.locator('#setup-form button[type=submit]:visible').first().click();
    await page.waitForSelector('dialog.id-card[open]');
    const tag = (await page.textContent('dialog.id-card .id-tag')).trim();
    assert.match(tag, new RegExp(`^Tester ${viewport.width}\\.\\d{3}$`), 'new student gets a roll');
    await page.click('dialog.id-card .btn:not(.ghost)');
    await playUntilResult(page, '.play-fun');
    await page.waitForFunction(() => /যোগ হয়েছে/.test(document.getElementById('save-status')?.textContent || ''));
    // Model Test
    await page.goto(BASE + '#start/exam/article');
    await page.locator('#setup-form button[type=submit]:visible').first().click();
    await page.waitForSelector('.play-exam');
    await page.locator('.opt').first().click();
    await page.click('[data-action=flag]');
    if (viewport.width < 960) await page.click('[data-action=palette]');
    await page.locator('.palette [data-action=submit]').click();
    await okDialogs(page);
    await page.waitForSelector('.result-hero');
    assert.ok(await page.locator('.review').count() >= 10, 'answer review shown');
    // Daily Quiz: home card → start → 20 questions → result; then the Daily page shows it.
    await page.goto(BASE + '#home');
    await page.click('#daily-card a[href="#start/daily"]');
    await page.locator('#setup-form button[type=submit]:visible').first().click();
    await playUntilResult(page, '.play-exam');
    await page.goto(BASE + '#daily');
    await page.waitForSelector('.daily-hero.is-done .ring');
    await page.waitForSelector('.day-dot.done.sel');
    await page.waitForSelector('#daily-questions details.review');
    // Score page: my card fills in from the server; leaderboard lists me.
    await page.goto(BASE + '#score');
    await page.waitForSelector('.lb-list li.me');
    await page.waitForFunction(() => /^[🥇🥈🥉#]/u.test(document.querySelector('[data-me=rank]')?.textContent || ''));
    assert.equal((await page.textContent('.me-head b')).trim(), tag, 'my card shows my ID');
    await page.click('[data-score-tab=topics]');
    await page.waitForSelector('#my-topics .tr-row');
    // Same name + roll on a "new phone" brings the student back; a wrong name for a taken roll is refused.
    const phone = await (await browser.newContext({ viewport })).newPage();
    phone.on('pageerror', e => errors.push(e.message));
    await phone.goto(BASE + '#score');
    await phone.fill('#login-form [name=name]', 'Someone Else');
    await phone.fill('#login-form [name=roll]', tag.split('.').pop());
    await phone.click('#login-form button[type=submit]');
    await phone.waitForSelector('#login-form [data-id-error]:not([hidden])');
    await phone.fill('#login-form [name=name]', tag.split('.')[0]);
    await phone.click('#login-form button[type=submit]');
    await phone.waitForSelector('.me-head b');
    assert.equal((await phone.textContent('.me-head b')).trim(), tag, 'logged in as the same student');
    await phone.context().close();
    assert.deepEqual(errors, [], 'no JavaScript errors');
    console.log(`✅ e2e passed at ${viewport.width}px`);
  }
} catch (e) {
  failed = true;
  console.error('❌', e.message, (e.stack.match(/run\.mjs:\d+/g) || []).join(' '));
} finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
