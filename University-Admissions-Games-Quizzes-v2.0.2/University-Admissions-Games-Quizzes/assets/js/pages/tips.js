// Tips & Tricks: post list (#tips) and single post (#tips/<slug>).

import { POSTS, QUICK_TIPS } from '../../../data/posts.js';
import { esc, bn, bnDate, markdown, toast } from '../lib/dom.js';
import { pageHead, postCard, topicById, empty } from '../components.js';

let category = 'all';
const sorted = () => [...POSTS].sort((a, b) => String(b.date).localeCompare(String(a.date)));

function cta(kind, topicId) {
  if (kind === 'quiz') {
    const t = topicById(topicId);
    if (!t) return '';
    return `<div class="post-cta" style="--tone:${esc(t.color)}"><span aria-hidden="true">${esc(t.icon)}</span><div><b>এখনই practice করো: <span lang="en">${esc(t.title)}</span></b><small>${bn(t.count)}টি প্রশ্ন · ${esc(t.bn)}</small></div>
      <a class="btn small t-fun" href="#start/fun/${esc(t.id)}">🎮 Fun</a><a class="btn small ghost" href="#start/exam/${esc(t.id)}">⏱️ Test</a></div>`;
  }
  if (kind === 'exam') return `<div class="post-cta"><span aria-hidden="true">⏱️</span><div><b>সময় ধরে নিজেকে যাচাই করো</b><small>Model Test: timer, flag, negative marking</small></div><a class="btn small" href="#start/exam">Model Test →</a></div>`;
  if (kind === 'fun') return `<div class="post-cta"><span aria-hidden="true">🎮</span><div><b>খেলতে খেলতে শেখো</b><small>Fun Quiz: points, streak, lifeline</small></div><a class="btn small t-fun" href="#start/fun">Fun Quiz →</a></div>`;
  return '';
}

function list() {
  const cats = ['all', ...new Set(POSTS.map(p => p.category))];
  const posts = sorted().filter(p => category === 'all' || p.category === category);
  const [first, ...rest] = posts;
  return `<div class="container">
    ${pageHead('Tips & Tricks', 'ভর্তি প্রস্তুতির কৌশল, grammar cheat-sheet, পড়ার routine আর পরীক্ষার দিনের checklist।', 'STUDY BLOG')}
    <div class="chips scroll" role="group" aria-label="Category">${cats
      .map(c => `<button class="chip ${category === c ? 'active' : ''}" data-action="cat" data-cat="${esc(c)}">${c === 'all' ? 'সব লেখা' : esc(c)}</button>`)
      .join('')}</div>
    ${first ? `<div class="post-grid">${postCard(first, true)}${rest.map(p => postCard(p)).join('')}</div>` : empty('এই category-তে এখনো লেখা নেই।')}
    <section class="section">
      <div class="section-head"><h2>⚡ এক লাইনের টিপস</h2></div>
      <div class="quick-tips">${QUICK_TIPS.map(t => `<p>💡 ${esc(t)}</p>`).join('')}</div>
    </section>
  </div>`;
}

function single(slug) {
  const all = sorted();
  const i = all.findIndex(p => p.slug === slug);
  const p = all[i];
  if (!p) return `<div class="container narrow section">${empty('লেখাটি পাওয়া যায়নি।', '<a class="btn" href="#tips">সব Tips দেখো</a>')}</div>`;
  const prev = all[i + 1], next = all[i - 1];
  const related = all.filter(x => x.slug !== p.slug && x.category === p.category).slice(0, 2);
  return `<article class="container narrow post">
    ${pageHead(p.title, p.summary, `${p.emoji || ''} ${p.category}`, [['#tips', 'Tips & Tricks'], [null, p.category]])}
    <p class="post-meta">${bn(p.minutes)} মিনিট পড়া · ${bnDate(p.date)} <button class="link-btn" data-action="share-post">📤 Share</button></p>
    <div class="prose">${markdown(p.body, { topicLink: cta })}</div>
    <nav class="post-nav">
      ${prev ? `<a href="#tips/${esc(prev.slug)}"><small>← আগের লেখা</small><b>${esc(prev.title)}</b></a>` : '<span></span>'}
      ${next ? `<a class="right" href="#tips/${esc(next.slug)}"><small>পরের লেখা →</small><b>${esc(next.title)}</b></a>` : '<span></span>'}
    </nav>
    ${related.length ? `<section class="section"><h2 class="h3">একই ধরনের লেখা</h2><div class="post-grid">${related.map(r => postCard(r)).join('')}</div></section>` : ''}
  </article>`;
}

export function render([slug]) {
  return slug ? single(slug) : list();
}

export function onAction(action, el) {
  if (action === 'cat') {
    category = el.dataset.cat;
    document.getElementById('main').innerHTML = list();
  } else if (action === 'share-post') {
    const url = location.href;
    if (navigator.share) navigator.share({ title: document.title, url }).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => toast('📋 Link copy হয়েছে'));
  }
}
