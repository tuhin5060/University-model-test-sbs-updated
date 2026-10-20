// Home page.

import { TOPICS, QUESTIONS } from '../../../data/questions/index.js';
import { POSTS, QUICK_TIPS } from '../../../data/posts.js';
import { UNIVERSITIES } from '../../../data/universities.js';
import { SITE, CU_PHOTOS, CU_HERO } from '../../../data/site.js';
import { esc, bn, today, safeURL } from '../lib/dom.js';
import { state, save, dailyStreak, mistakeIds } from '../lib/store.js';
import { topicCard, postCard, photo, credit, heroMedia, leaderboard, loadLeaderboards, hydratePhotos, MODE_INFO, topicTitle } from '../components.js';
import { startSession, dailyIds } from '../quiz.js';

function resumeBanner() {
  const s = state.session;
  if (!s) return '';
  const info = MODE_INFO[s.mode];
  const answered = Object.keys(s.answers).length;
  return `<div class="container"><div class="resume">
    <span aria-hidden="true">${info.icon}</span>
    <div><b>অসমাপ্ত ${esc(info.label)} আছে</b><small>${esc(s.title)} · ${bn(answered)}/${bn(s.ids.length)} উত্তর দেওয়া</small></div>
    <a class="btn" href="#play">চালিয়ে যাও →</a>
    <button class="link-btn" data-action="discard">বাদ দাও</button>
  </div></div>`;
}

function daily() {
  const doneToday = state.daily?.done?.[today()];
  const streak = dailyStreak();
  const tip = QUICK_TIPS[Math.floor(Date.now() / 86400000) % QUICK_TIPS.length];
  return `<section class="container section daily-row">
    <div class="card daily">
      <div class="daily-top"><span class="eyebrow">আজকের চ্যালেঞ্জ</span><span class="streak" title="টানা দিন">🔥 ${bn(streak)} দিন</span></div>
      <h2>৫টি প্রশ্ন, ২ মিনিট</h2>
      <p class="muted">প্রতিদিন সবার জন্য একই ৫টি প্রশ্ন। প্রতিদিন শেষ করে streak ধরে রাখো।</p>
      ${doneToday !== undefined
        ? `<p class="done-today">✅ আজ শেষ করেছ: <b>${bn(doneToday)}/৫</b> সঠিক। কাল আবার এসো!</p><button class="btn ghost" data-action="daily">আবার খেলো</button>`
        : '<button class="btn" data-action="daily">▶ আজকের চ্যালেঞ্জ শুরু</button>'}
    </div>
    <div class="card tip-card">
      <span class="eyebrow">আজকের টিপ</span>
      <p class="tip-text">💡 ${esc(tip)}</p>
      <a class="text-link" href="#tips">আরও Tips & Tricks →</a>
    </div>
  </section>`;
}

function modes() {
  const m = mistakeIds().length;
  return `<section class="container section">
    <div class="section-head"><div><h2>কীভাবে practice করবে?</h2><p>খেলার মতো মজা, নয়তো পরীক্ষার হলের মতো চাপ—দুটোই।</p></div></div>
    <div class="mode-cards">
      <a class="mode-card t-fun" href="#start/fun">
        <span class="mode-emoji" aria-hidden="true">🎮</span>
        <h3>Fun Quiz</h3>
        <p>Countdown timer, points, streak bonus, 50:50 আর Freeze lifeline। ঠিক-ভুল সঙ্গে সঙ্গে, ব্যাখ্যাসহ।</p>
        <span class="mode-tags"><span>⏳ ২০–৩০ সে/প্রশ্ন</span><span>🔥 x2 bonus</span><span>🏆 Leaderboard</span></span>
        <span class="btn">খেলা শুরু →</span>
      </a>
      <a class="mode-card t-exam" href="#start/exam">
        <span class="mode-emoji" aria-hidden="true">⏱️</span>
        <h3>Model Test</h3>
        <p>ভর্তি পরীক্ষার মতো একটানা timer, flag, প্রশ্ন তালিকা আর negative marking। Submit-এর পরে পূর্ণ বিশ্লেষণ।</p>
        <span class="mode-tags"><span>📋 ১০–৫০ প্রশ্ন</span><span>➖ −০.২৫ option</span><span>📊 Topic report</span></span>
        <span class="btn">Test দাও →</span>
      </a>
    </div>
    <div class="mini-modes">
      <a href="#start/practice">📖 <b>Practice</b> — timer ছাড়া, প্রতিটি উত্তরে ব্যাখ্যা</a>
      ${m ? `<a href="#start/practice/mistakes">🔁 <b>আমার ভুলগুলো</b> — ${bn(m)}টি প্রশ্ন অপেক্ষা করছে</a>` : ''}
    </div>
  </section>`;
}

function cuSpotlight() {
  const cu = UNIVERSITIES.find(u => u.id === 'cu');
  const facts = cu?.campusStory?.facts || [];
  return `<section class="cu-spot section">
    <div class="container">
      <div class="section-head"><div><span class="eyebrow">Spotlight</span><h2>চট্টগ্রাম বিশ্ববিদ্যালয়</h2><p>পাহাড়ের পাশে, নতুন জীবনের শুরু। ১৯৬৬ থেকে উচ্চশিক্ষার ঠিকানা।</p></div><a class="text-link" href="#university/cu">পুরো CU guide →</a></div>
      <div class="gallery" tabindex="0" aria-label="চবি ছবির গ্যালারি">
        ${CU_PHOTOS.map((p, i) => `<figure class="${i === 0 ? 'wide' : ''}">${photo(p, { sizes: i === 0 ? '(min-width:900px) 60vw, 90vw' : '(min-width:900px) 30vw, 80vw' })}<figcaption>${esc(p.caption)} ${credit(p)}</figcaption></figure>`).join('')}
      </div>
      <div class="cu-facts">${facts.map(([h, t]) => `<div><small lang="en">${esc(h)}</small><b>${esc(t)}</b></div>`).join('')}</div>
      <div class="cu-links">
        <a class="btn" href="${safeURL(cu?.admission)}" target="_blank" rel="noopener noreferrer">📝 CU Admission Portal ↗</a>
        <a class="btn ghost" href="${safeURL(cu?.site)}" target="_blank" rel="noopener noreferrer">🌐 cu.ac.bd ↗</a>
        <a class="btn ghost" href="#tips/cu-english-roadmap">🗺️ CU English roadmap</a>
      </div>
    </div>
  </section>`;
}

export function render() {
  const hero = CU_HERO;
  const featured = [...POSTS].filter(p => p.featured).concat(POSTS.filter(p => !p.featured)).slice(0, 3);
  const name = state.player?.name;
  return `
  <section class="hero">
    ${heroMedia(hero)}
    <div class="container hero-inner">
      <span class="eyebrow light">${esc(SITE.initiative)}</span>
      <h1>${name ? `${esc(name.split(' ')[0])}, ` : ''}স্বপ্নের ক্যাম্পাসের<br>প্রস্তুতি শুরু হোক আজ।</h1>
      <p>বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English MCQ—খেলার মতো মজায়, পরীক্ষার মতো নিয়মে। প্রতিটি উত্তরের সঙ্গে সহজ বাংলা ব্যাখ্যা।</p>
      <div class="hero-cta">
        <a class="btn big t-fun" href="#start/fun">🎮 Fun Quiz খেলো</a>
        <a class="btn big light" href="#start/exam">⏱️ Model Test দাও</a>
      </div>
      <ul class="hero-stats">
        <li><b>${bn(QUESTIONS.length)}+</b><span>প্রশ্ন</span></li>
        <li><b>${bn(TOPICS.length)}</b><span>Topic</span></li>
        <li><b>${bn(UNIVERSITIES.length)}</b><span>বিশ্ববিদ্যালয়</span></li>
      </ul>
    </div>
    <span class="hero-credit">${credit(hero)}</span>
  </section>
  ${resumeBanner()}
  ${daily()}
  ${modes()}
  <section class="container section">
    <div class="section-head"><div><h2>Topic ধরে প্রস্তুতি</h2><p>যেকোনো topic-এ চাপ দাও, তারপর mode বেছে নাও। নিয়মিত নতুন প্রশ্ন যোগ হচ্ছে।</p></div><a class="text-link" href="#start/exam">সব topic →</a></div>
    <div class="topic-grid">${TOPICS.map(t => topicCard(t)).join('')}</div>
  </section>
  ${cuSpotlight()}
  <section class="container section">
    <div class="section-head"><div><h2>Tips & Tricks</h2><p>কী পড়বে, কীভাবে পড়বে, পরীক্ষার হলে কী করবে।</p></div><a class="text-link" href="#tips">সব লেখা →</a></div>
    <div class="post-grid">${featured.map((p, i) => postCard(p, i === 0)).join('')}</div>
  </section>
  <section class="container section">
    <div class="section-head"><div><h2>🏆 Leaderboard</h2><p>সব topic মিলিয়ে সেরা শিক্ষার্থীরা।</p></div><a class="text-link" href="#leaderboard">পুরো তালিকা →</a></div>
    ${leaderboard({ mode: 'fun', limit: 5, tabs: true })}
  </section>
  <section class="container section">
    <div class="section-head"><div><h2>Official ভর্তি তথ্য</h2><p>তারিখ, যোগ্যতা ও আবেদন—শুধু official site থেকে যাচাই করো।</p></div><a class="text-link" href="#universities">সব বিশ্ববিদ্যালয় →</a></div>
    <div class="uni-strip">${UNIVERSITIES.slice(0, 8)
      .map(u => `<a href="${safeURL(u.admission || u.site)}" target="_blank" rel="noopener noreferrer"><b>${esc(u.short)}</b><small>${esc(u.admission ? 'Admission ↗' : 'Website ↗')}</small></a>`)
      .join('')}</div>
  </section>`;
}

export function mount() {
  hydratePhotos();
  loadLeaderboards();
}

export function onAction(action) {
  if (action === 'daily') {
    startSession({ mode: 'practice', topic: 'daily', ids: dailyIds(5), kind: 'daily', title: topicTitle('daily') });
  } else if (action === 'discard') {
    if (confirm('অসমাপ্ত test বাদ দেবে? এর উত্তরগুলো মুছে যাবে।')) {
      state.session = null;
      save();
      document.querySelector('.resume')?.remove();
    }
  }
}
