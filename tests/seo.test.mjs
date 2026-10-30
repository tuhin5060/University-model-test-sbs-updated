// Search pages (scripts/seo.mjs): up to date, one per topic and post, all in the sitemap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wanted, stale, dated, buildPages } from '../scripts/seo.mjs';
import { TOPICS, QUESTIONS } from '../data/questions/index.js';
import { POSTS } from '../data/posts.js';

const read = f => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('generated search pages, sitemap and footer links are up to date', () => {
  for (const [file, html] of wanted()) assert.equal(read(file), html, `${file} out of date — run: npm run sync`);
  assert.deepEqual(stale(), [], 'leftover pages — run: npm run sync');
});

test('every topic and post has a page in the sitemap, every question is on its topic page', () => {
  const files = wanted();
  const map = files.get('sitemap.xml');
  for (const t of TOPICS) {
    assert.ok(map.includes(`/mcq/${t.id}/</loc>`), t.id);
    const html = files.get(`mcq/${t.id}/index.html`);
    assert.equal((html.match(/class="seo-q"/g) || []).length, QUESTIONS.filter(q => q.topicId === t.id).length, t.id);
    assert.ok(html.includes(`<link rel="canonical" href="https://sbs-university-admission-model-test.vercel.app/mcq/${t.id}/">`));
  }
  for (const p of POSTS) assert.ok(map.includes(`/tips/${p.slug}/</loc>`), p.slug);
  assert.ok(files.get('index.html').includes('<a href="/mcq/adverb/">Adverb MCQ</a>'));
});

test('search pages run no inline script (the CSP only allows our own files there)', () => {
  for (const [file, html] of wanted()) {
    if (file === 'index.html' || !file.endsWith('.html')) continue;
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].filter(m => !m[1].includes('application/ld+json'));
    assert.equal(inline.length, 0, file);
  }
});

test('home page HTML has readable text and a link to every topic before the app starts', () => {
  const main = read('index.html').split('<main')[1].split('</main>')[0];
  assert.match(main, /<h1>[^<]*ভর্তি পরীক্ষার English প্রস্তুতি<\/h1>/);
  for (const t of TOPICS) assert.ok(main.includes(`href="/mcq/${t.id}/"`), t.id);
});

test('sitemap dates stay put while a page is unchanged and move when its content changes', () => {
  const pages = buildPages();
  const { dates } = dated(pages);
  for (const p of dated(pages, dates).pages) assert.equal(p.lastmod, dates[p.url].date, p.url);
  const edited = dated([{ ...pages[0], html: pages[0].html + '<!-- edit -->' }], dates).dates[pages[0].url];
  assert.notEqual(edited.fp, dates[pages[0].url].fp);
  assert.match(edited.date, /^\d{4}-\d{2}-\d{2}$/);
});
