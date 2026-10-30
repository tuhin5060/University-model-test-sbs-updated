// Search-engine pages: plain HTML copies of the site's content that Google can read
// without running the app (the app itself lives behind #hash links, which Google
// treats as one page). Every page links back into the app to practise.
//   mcq/                   all topics
//   mcq/<topic>/           every question of a topic with answer and explanation
//   tips/  tips/<slug>/    the Tips & Tricks posts
//   universities/          university profiles with official links
//   sitemap.xml            every page above + the home page
//   index.html             footer links to these pages (between seo-links markers) and a
//                          readable home intro inside #main (between seo-home markers)
//   data/seo-dates.json    when each page's content last changed (sitemap lastmod)
// Generated from data/ — never edit the output by hand.
//   node scripts/seo.mjs          → rewrite everything
//   node scripts/seo.mjs --check  → exit 1 if anything is out of date
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { TOPICS, QUESTIONS, GROUPS } from '../data/questions/index.js';
import { POSTS } from '../data/posts.js';
import { UNIVERSITIES, CONTENT_UPDATED } from '../data/universities.js';
import { SITE } from '../data/site.js';
import VOCAB from '../data/vocabulary.js';
import { esc, bn, markdown } from '../assets/js/lib/dom.js';
import { examRef } from '../assets/js/shared/source.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = SITE.url.replace(/\/$/, '');
const VERSION = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const LINKS_START = '<!-- seo-links:start -->';
const LINKS_END = '<!-- seo-links:end -->';
const HOME_START = '<!-- seo-home:start -->';
const HOME_END = '<!-- seo-home:end -->';
const DATES_FILE = 'data/seo-dates.json';
// Stands for a page's last-changed date until the page's fingerprint is known.
const LASTMOD = '__LASTMOD__';
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const OUT_DIRS = ['mcq', 'tips', 'universities'];

const posts = [...POSTS].sort((a, b) => String(b.date).localeCompare(String(a.date)));
const questionsOf = id => QUESTIONS.filter(q => q.topicId === id);
const lastPostDate = posts[0]?.date || CONTENT_UPDATED;

function jsonLd(data) {
  // `<` escaped so text can never close the script element.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function breadcrumbs(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: BASE + url })),
  };
}

function page({ url, title, description, crumbs, body, schema = [] }) {
  const full = BASE + url;
  return `<!doctype html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#0f5c45">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${full}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(SITE.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${full}">
  <meta property="og:locale" content="bn_BD">
  <meta property="og:image" content="${BASE}/assets/img/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <link rel="stylesheet" href="/assets/css/styles.css?v=${VERSION}">
  <script src="/assets/js/seo-theme.js?v=${VERSION}"></script>
  ${[breadcrumbs(crumbs), ...schema].map(jsonLd).join('\n  ')}
</head>
<body class="seo-page">
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="${esc(SITE.name)} — হোম">
        <img class="brand-mark" src="/assets/img/logo.svg" width="40" height="40" alt="">
        <span class="brand-text">${esc(SITE.name)}<small>ADMISSION PRACTICE</small></span>
      </a>
      <nav class="top-nav" aria-label="প্রধান মেনু">
        <a href="/">হোম</a>
        <a href="/mcq/">MCQ Topic</a>
        <a href="/#start/exam">⏱️ Model Test</a>
        <a href="/tips/">Tips & Tricks</a>
        <a href="/universities/">বিশ্ববিদ্যালয়</a>
      </nav>
    </div>
  </header>
  <main id="main" class="container narrow">
    <nav class="crumbs" aria-label="Breadcrumb">${crumbs.map(([name, u], i) => (i === crumbs.length - 1 ? `<span>${esc(name)}</span>` : `<a href="${u}">${esc(name)}</a>`)).join(' › ')}</nav>
${body}
  </main>
  <footer class="site-footer">
    <div class="container">
      <p class="seo-cta"><a class="btn" href="/#start/exam">⏱️ Model Test দাও</a> <a class="btn ghost" href="/#start/fun">🎮 Fun Quiz খেলো</a></p>
      <p class="footer-note">${esc(SITE.name)} — ${esc(SITE.initiative)}-এর উদ্যোগ · স্বতন্ত্র শিক্ষার্থী-সহায়ক উদ্যোগ, কোনো বিশ্ববিদ্যালয়ের official website নয়।</p>
    </div>
  </footer>
</body>
</html>
`;
}

function topicPage(t) {
  const qs = questionsOf(t.id);
  const url = `/mcq/${t.id}/`;
  const title = `${t.title} MCQ — ভর্তি পরীক্ষার ${bn(qs.length)}টি প্রশ্ন, উত্তর ও বাংলা ব্যাখ্যা | ${SITE.name}`;
  const description = `বিশ্ববিদ্যালয় ভর্তি পরীক্ষার ${t.title} MCQ: ${bn(qs.length)}টি প্রশ্ন, সঠিক উত্তর ও সহজ বাংলা ব্যাখ্যা। ${t.bn ? `${t.bn}। ` : ''}বিনামূল্যে অনলাইনে Model Test দাও।`;
  const items = qs.map((q, i) => `      <li class="seo-q">
        <p class="seo-q-text"><b>${bn(i + 1)}.</b> ${esc(q.q)}${examRef(q.source) ? ` <span class="src-tag">📌 ${esc(examRef(q.source))}</span>` : ''}</p>
        <ol class="seo-opts" type="A">${q.o.map((o, k) => `<li${k === q.a ? ' class="ok"' : ''}>${esc(o)}</li>`).join('')}</ol>
        <details><summary>উত্তর ও ব্যাখ্যা</summary>
          <p><b>উত্তর: ${LETTERS[q.a]}. ${esc(q.o[q.a])}</b></p>${q.e ? `\n          <p>${esc(q.e)}</p>` : ''}${q.bn ? `\n          <p>${esc(q.bn)}</p>` : ''}
        </details>
      </li>`);
  const others = TOPICS.filter(x => x.id !== t.id && x.group === t.group);
  const guides = posts.filter(p => String(p.body).includes(`[[quiz:${t.id}]]`));
  return {
    file: `mcq/${t.id}/index.html`,
    url,
    lastmod: lastPostDate,
    html: page({
      url,
      title,
      description,
      crumbs: [['হোম', '/'], ['MCQ', '/mcq/'], [t.title, url]],
      body: `    <header class="page-head">
      <h1>${esc(t.icon)} ${esc(t.title)} MCQ — উত্তর ও ব্যাখ্যাসহ</h1>
      <p>${esc(t.bn || `${t.title} অংশের প্রশ্ন`)} · মোট ${bn(qs.length)}টি প্রশ্ন। প্রতিটি প্রশ্নের নিচে “উত্তর ও ব্যাখ্যা” চাপলে সঠিক উত্তর আর বাংলা ব্যাখ্যা দেখাবে।</p>
      ${t.tipBn ? `<aside class="callout"><span aria-hidden="true">💡</span><p>${esc(t.tipBn)}</p></aside>` : ''}
      <p class="seo-cta"><a class="btn" href="/#start/exam/${t.id}">⏱️ ${esc(t.title)} Model Test দাও</a> <a class="btn ghost" href="/#start/fun/${t.id}">🎮 Fun Quiz</a></p>
    </header>
    <ol class="seo-qs">
${items.join('\n')}
    </ol>${guides.length ? `
    <section class="section-tight">
      <h2 class="h3">📖 ${esc(t.title)}-এর নিয়ম পড়ো</h2>
      <ul class="seo-links">${guides.map(p => `<li><a href="/tips/${p.slug}/">${esc(p.title)}</a></li>`).join('')}</ul>
    </section>` : ''}
    <section class="section-tight">
      <h2 class="h3">আরও ${esc(GROUPS[t.group]?.short || '')} topic</h2>
      <ul class="seo-links">${others.map(x => `<li><a href="/mcq/${x.id}/">${esc(x.icon)} ${esc(x.title)} MCQ</a></li>`).join('')}</ul>
    </section>`,
      schema: [{
        '@context': 'https://schema.org',
        '@type': 'Quiz',
        name: `${t.title} MCQ`,
        about: t.title,
        inLanguage: ['bn', 'en'],
        educationalLevel: 'University admission',
        numberOfQuestions: qs.length,
        dateModified: LASTMOD,
        url: BASE + url,
        provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      }],
    }),
  };
}

function mcqIndex() {
  const url = '/mcq/';
  const groups = Object.values(GROUPS).map(g => `    <section class="section-tight">
      <h2 class="h3">${esc(g.icon)} ${esc(g.short)}</h2>
      <ul class="seo-topics">${TOPICS.filter(t => t.group === g.id).map(t => `<li><a href="/mcq/${t.id}/"><b>${esc(t.icon)} ${esc(t.title)} MCQ</b><small>${bn(t.count)}টি প্রশ্ন · ${esc(t.bn)}</small></a></li>`).join('')}</ul>
    </section>`);
  return {
    file: 'mcq/index.html',
    url,
    lastmod: lastPostDate,
    html: page({
      url,
      title: `ভর্তি পরীক্ষার English MCQ — Topic অনুযায়ী ${bn(QUESTIONS.length)}+ প্রশ্ন ও ব্যাখ্যা | ${SITE.name}`,
      description: `বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English MCQ topic অনুযায়ী: Tense, Article, Preposition, Synonym, Antonym, Idioms সহ ${bn(TOPICS.length)}টি topic-এ ${bn(QUESTIONS.length)}+ প্রশ্ন, উত্তর ও বাংলা ব্যাখ্যা।`,
      crumbs: [['হোম', '/'], ['MCQ', url]],
      body: `    <header class="page-head">
      <h1>ভর্তি পরীক্ষার English MCQ — Topic অনুযায়ী</h1>
      <p>চবি, ঢাবি, জাবি, রাবি-সহ বিশ্ববিদ্যালয় ভর্তি পরীক্ষার ${bn(TOPICS.length)}টি topic-এ ${bn(QUESTIONS.length)}+ প্রশ্ন—প্রতিটির সঠিক উত্তর ও সহজ বাংলা ব্যাখ্যাসহ।</p>
    </header>
${groups.join('\n')}`,
    }),
  };
}

function tipLink(kind, topic) {
  if (kind === 'quiz' && topic) return `<p><a class="btn" href="/#start/fun/${esc(topic)}">🎮 এই topic অনুশীলন করো</a></p>`;
  if (kind === 'exam') return '<p><a class="btn" href="/#start/exam">⏱️ Model Test দাও</a></p>';
  if (kind === 'fun') return '<p><a class="btn" href="/#start/fun">🎮 Fun Quiz খেলো</a></p>';
  return '';
}

function tipPage(p) {
  const url = `/tips/${p.slug}/`;
  return {
    file: `tips/${p.slug}/index.html`,
    url,
    lastmod: p.date,
    html: page({
      url,
      title: `${p.title} | ${SITE.name}`,
      description: p.summary,
      crumbs: [['হোম', '/'], ['Tips & Tricks', '/tips/'], [p.title, url]],
      body: `    <article class="post">
      <header class="page-head">
        <p class="eyebrow">${esc(p.emoji || '')} ${esc(p.category)}</p>
        <h1>${esc(p.title)}</h1>
        <p>${esc(p.summary)}</p>
        <p class="post-meta">${bn(p.minutes)} মিনিট পড়া · <time datetime="${esc(p.date)}">${esc(p.date)}</time></p>
      </header>
      <div class="prose">${markdown(p.body, { topicLink: tipLink })}</div>
    </article>
    <section class="section-tight">
      <h2 class="h3">আরও লেখা</h2>
      <ul class="seo-links">${posts.filter(x => x.slug !== p.slug).map(x => `<li><a href="/tips/${x.slug}/">${esc(x.title)}</a></li>`).join('')}</ul>
    </section>`,
      schema: [{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: p.title,
        description: p.summary,
        datePublished: p.date,
        dateModified: LASTMOD,
        inLanguage: 'bn',
        mainEntityOfPage: BASE + url,
        image: `${BASE}/assets/img/og-image.jpg`,
        author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
        publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: `${BASE}/assets/img/icon-512.png` } },
      }],
    }),
  };
}

function tipsIndex() {
  const url = '/tips/';
  return {
    file: 'tips/index.html',
    url,
    lastmod: lastPostDate,
    html: page({
      url,
      title: `ভর্তি প্রস্তুতির Tips & Tricks — English, পরীক্ষার কৌশল ও রুটিন | ${SITE.name}`,
      description: 'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English প্রস্তুতি, MCQ কৌশল, পড়ার রুটিন ও পরীক্ষার দিনের টিপস—সহজ বাংলায়।',
      crumbs: [['হোম', '/'], ['Tips & Tricks', url]],
      body: `    <header class="page-head">
      <h1>ভর্তি প্রস্তুতির Tips & Tricks</h1>
      <p>English প্রস্তুতি, MCQ-এর কৌশল, রুটিন আর পরীক্ষার দিনের প্রস্তুতি—সহজ বাংলায়।</p>
    </header>
    <ul class="seo-topics">${posts.map(p => `<li><a href="/tips/${p.slug}/"><b>${esc(p.emoji || '')} ${esc(p.title)}</b><small>${esc(p.summary)}</small></a></li>`).join('')}</ul>`,
    }),
  };
}

function universitiesPage() {
  const url = '/universities/';
  const cards = UNIVERSITIES.map(u => `    <section class="card seo-uni" id="${esc(u.id)}">
      <h2 class="h3">${esc(u.name)} <small>(${esc(u.english)}${u.short ? ` · ${esc(u.short)}` : ''})</small></h2>
      <p class="muted small">${esc(u.place || '')}${u.type ? ` · ${esc(u.type)}` : ''}</p>
      ${u.text ? `<p>${esc(u.text)}</p>` : ''}
      <p>${u.site ? `<a class="text-link" href="${esc(u.site)}" rel="noopener noreferrer">Official website ↗</a>` : ''}${u.admission ? ` · <a class="text-link" href="${esc(u.admission)}" rel="noopener noreferrer">ভর্তি (Admission) portal ↗</a>` : ''}</p>
    </section>`);
  return {
    file: 'universities/index.html',
    url,
    lastmod: CONTENT_UPDATED,
    html: page({
      url,
      title: `বিশ্ববিদ্যালয় ভর্তি — official website ও admission portal-এর তালিকা | ${SITE.name}`,
      description: `চট্টগ্রাম বিশ্ববিদ্যালয়, ঢাকা বিশ্ববিদ্যালয়-সহ ${bn(UNIVERSITIES.length)}টি বিশ্ববিদ্যালয়ের পরিচিতি, official website ও ভর্তি portal-এর link এক জায়গায়।`,
      crumbs: [['হোম', '/'], ['বিশ্ববিদ্যালয়', url]],
      body: `    <header class="page-head">
      <h1>বিশ্ববিদ্যালয় ভর্তি — official links</h1>
      <p>${bn(UNIVERSITIES.length)}টি বিশ্ববিদ্যালয়ের পরিচিতি, official website ও ভর্তি portal। তারিখ, আসন ও যোগ্যতার জন্য সবসময় official circular দেখো। (হালনাগাদ: ${esc(CONTENT_UPDATED)})</p>
    </header>
${cards.join('\n')}`,
    }),
  };
}

export function buildPages() {
  return [mcqIndex(), ...TOPICS.map(topicPage), tipsIndex(), ...posts.map(tipPage), universitiesPage()];
}

const dhakaToday = () => new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 10);
/** Content fingerprint: ignores the ?v= cache-buster, so a version bump alone is not a change. */
const fingerprint = html => createHash('sha1').update(html.split(`?v=${VERSION}`).join('')).digest('hex').slice(0, 16);

/**
 * Give every page the date its content last changed: kept from data/seo-dates.json while the
 * fingerprint is the same, today (Bangladesh) when it changed, the page's own date when new.
 */
export function dated(pages, saved = readDates()) {
  const dates = {};
  const out = pages.map(p => {
    const fp = fingerprint(p.html);
    const lastmod = saved[p.url]?.fp === fp ? saved[p.url].date : saved[p.url] ? dhakaToday() : p.lastmod;
    dates[p.url] = { fp, date: lastmod };
    return { ...p, lastmod, html: p.html.split(LASTMOD).join(lastmod) };
  });
  return { pages: out, dates };
}

function readDates() {
  const f = path.join(root, DATES_FILE);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
}

export function sitemap(pages = dated(buildPages()).pages) {
  const newest = pages.map(p => p.lastmod).sort().at(-1) || lastPostDate;
  const urls = [{ url: '/', lastmod: newest }, ...pages];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(p => `  <url><loc>${BASE}${p.url}</loc><lastmod>${p.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

/** index.html with plain links to the topic pages in the footer (they stay outside #main, so the app never removes them). */
export function withFooterLinks(html) {
  const a = html.indexOf(LINKS_START), b = html.indexOf(LINKS_END);
  if (a < 0 || b < 0) throw new Error(`index.html needs ${LINKS_START} … ${LINKS_END} markers`);
  const links = [
    '<a href="/mcq/">📚 সব MCQ topic</a>',
    ...TOPICS.map(t => `<a href="/mcq/${t.id}/">${esc(t.title)} MCQ</a>`),
    '<a href="/tips/">💡 Tips & Tricks</a>',
    '<a href="/universities/">🏛️ বিশ্ববিদ্যালয়ের official links</a>',
  ];
  const block = `${LINKS_START}\n      <nav class="footer-links seo-footer" aria-label="MCQ topic">\n        ${links.join('\n        ')}\n      </nav>\n      ${LINKS_END}`;
  return html.slice(0, a) + block + html.slice(b + LINKS_END.length);
}

/** A readable intro for search engines inside #main; the app replaces it as soon as it starts. */
export function withHomeContent(html) {
  const a = html.indexOf(HOME_START), b = html.indexOf(HOME_END);
  if (a < 0 || b < 0) throw new Error(`index.html needs ${HOME_START} … ${HOME_END} markers`);
  const group = g => TOPICS.filter(t => t.group === g).map(t => `<li><a href="/mcq/${t.id}/">${esc(t.title)} MCQ <small>(${bn(t.count)}টি)</small></a></li>`).join('');
  const block = `${HOME_START}
    <section class="container section seo-home">
      <h1>${esc(SITE.name)} — বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English প্রস্তুতি</h1>
      <p>চবি, ঢাবি, জাবি, রাবি-সহ বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English অংশের ${bn(QUESTIONS.length)}+ MCQ—প্রতিটির সঠিক উত্তর ও সহজ বাংলা ব্যাখ্যাসহ। বিনামূল্যে অনলাইন Model Test (প্রতি প্রশ্নে ৩৬ সেকেন্ড, ভুলে −০.২৫), Fun Quiz আর প্রতিদিনের Daily Quiz।</p>
      <h2 class="h3">Grammar MCQ</h2>
      <ul class="seo-links">${group('grammar')}</ul>
      <h2 class="h3">Vocabulary ও Memorising MCQ</h2>
      <ul class="seo-links">${group('memorising')}</ul>
      <h2 class="h3">ভর্তি প্রস্তুতির Tips & Tricks</h2>
      <ul class="seo-links">${posts.slice(0, 8).map(p => `<li><a href="/tips/${p.slug}/">${esc(p.title)}</a></li>`).join('')}</ul>
      <p><a href="/mcq/">সব MCQ topic</a> · <a href="/tips/">সব লেখা</a> · <a href="/universities/">বিশ্ববিদ্যালয়ের official links</a></p>
      <noscript>
        <p class="notice">Quiz চালাতে JavaScript চালু করুন। Official links:
          <a href="https://admission.cu.ac.bd/">চবি Admission</a> ·
          <a href="https://cu.ac.bd/">cu.ac.bd</a> ·
          <a href="https://admission.eis.du.ac.bd/">ঢাবি Admission</a></p>
      </noscript>
    </section>
    ${HOME_END}`;
  return html.slice(0, a) + block + html.slice(b + HOME_END.length);
}

/** Topic list and counts for the pages, without the ~1.3 MB question bank (assets/js/lib/bank.js loads that when needed). */
export function metaModule() {
  return `// GENERATED by scripts/seo.mjs (npm run sync) from data/questions/ — do not edit.
// Topic names and counts, so the home page opens without loading every question.
export const TOPICS = ${JSON.stringify(TOPICS, null, 2)};
export const GROUPS = ${JSON.stringify(GROUPS, null, 2)};
export const QUESTION_COUNT = ${QUESTIONS.length};
export const VOCAB_COUNT = ${VOCAB.length};
`;
}

/** Every generated file → its wanted content. */
export function wanted() {
  const { pages, dates } = dated(buildPages());
  const files = new Map(pages.map(p => [p.file, p.html]));
  files.set('sitemap.xml', sitemap(pages));
  files.set(DATES_FILE, `${JSON.stringify(dates, null, 2)}\n`);
  files.set('index.html', withHomeContent(withFooterLinks(fs.readFileSync(path.join(root, 'index.html'), 'utf8'))));
  files.set('data/questions/meta.js', metaModule());
  return files;
}

/** Generated page files on disk that no longer belong to any topic or post. */
export function stale(files = wanted()) {
  const out = [];
  for (const dir of OUT_DIRS) {
    const walk = rel => {
      const abs = path.join(root, rel);
      if (!fs.existsSync(abs)) return;
      for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
        const r = path.posix.join(rel, e.name);
        if (e.isDirectory()) walk(r);
        else if (!files.has(r)) out.push(r);
      }
    };
    walk(dir);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  const files = wanted();
  const old = stale(files);
  const changed = [...files].filter(([f, html]) => !fs.existsSync(path.join(root, f)) || fs.readFileSync(path.join(root, f), 'utf8') !== html).map(([f]) => f);
  if (check) {
    if (changed.length || old.length) {
      console.error(`Search pages out of date (${[...changed, ...old].slice(0, 5).join(', ')}…) — run: npm run sync`);
      process.exit(1);
    }
  } else {
    for (const f of old) fs.rmSync(path.join(root, f));
    for (const f of changed) {
      fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
      fs.writeFileSync(path.join(root, f), files.get(f));
    }
    console.log(`seo: ${files.size - 4} pages, sitemap.xml (${files.size - 3} URLs), ${changed.length} updated${old.length ? `, ${old.length} removed` : ''}`);
  }
}
