// Home page.

import { TOPICS, QUESTION_COUNT, VOCAB_COUNT } from '../../../data/questions/meta.js';
import { POSTS, QUICK_TIPS } from '../../../data/posts.js';
import { UNIVERSITIES } from '../../../data/universities.js';
import { SITE, SBS, CU_PHOTOS, CU_HERO } from '../../../data/site.js';
import { esc, bn, safeURL, ask } from '../lib/dom.js';
import { state, save, dailyStreak, mistakeIds } from '../lib/store.js';
import { topicCard, postCard, photo, credit, heroMedia, leaderboard, loadLeaderboards, hydratePhotos, modeInfo } from '../components.js';
import { fetchDaily } from '../lib/api.js';
import { dhakaDay } from '../shared/daily.js';
import { dayShort, localTry, RULES } from './daily.js';
import { loadLatest } from './community.js';
import { hydratePush } from '../lib/push.js';

function resumeBanner() {
  const s = state.session;
  if (!s) return '';
  const info = modeInfo(s);
  const answered = Object.keys(s.answers).length;
  return `<div class="container"><div class="resume">
    <span aria-hidden="true">${info.icon}</span>
    <div><b>অসমাপ্ত ${esc(info.label)} আছে</b><small>${esc(s.title)} · ${bn(answered)}/${bn(s.ids.length)} উত্তর দেওয়া</small></div>
    <a class="btn" href="#play">চালিয়ে যাও →</a>
    <button class="link-btn" data-action="discard">বাদ দাও</button>
  </div></div>`;
}

function dailyTaken(m) {
  return `<p class="done-today">✅ আজকের quiz দিয়েছ: <b>${bn(m.marks)}/${bn(m.total)}</b> নম্বর${m.rank ? ` · আজ <b>#${bn(m.rank)}</b>` : ''}</p>
    <a class="btn ghost" href="#daily">ফলাফল ও উত্তর দেখো →</a>`;
}

// Daily Quiz: the same 20 past-year questions for everyone today (pages/daily.js).
function daily() {
  const day = dhakaDay();
  const mine = localTry(day);
  const tip = QUICK_TIPS[Math.floor(Date.now() / 86400000) % QUICK_TIPS.length];
  return `<section class="container section daily-row">
    <div class="card daily" id="daily-card">
      <div class="daily-top"><span class="eyebrow">📅 Daily Quiz · ${esc(dayShort(day))}</span><span class="streak" title="টানা দিন">🔥 ${bn(dailyStreak())} দিন</span></div>
      <h2>আজকের কুইজে অংশ নাও</h2>
      <p class="muted">CU, DU-সহ বিগত বছরের ভর্তি পরীক্ষার প্রশ্ন—সবার জন্য একই। ${RULES}।</p>
      <div data-daily-status>${mine ? dailyTaken({ marks: mine.marks ?? mine.correct, total: mine.total }) : '<a class="btn" href="#start/daily">▶ অংশ নাও</a> <a class="btn ghost" href="#daily">আগের দিনের ফলাফল</a>'}</div>
      <p class="muted small" data-daily-count hidden>👥 আজ এখন পর্যন্ত <b></b> জন অংশ নিয়েছে</p>
      <p class="push-line" data-push hidden></p>
    </div>
    <div class="card tip-card">
      <span class="eyebrow">আজকের টিপ</span>
      <p class="tip-text">💡 ${esc(tip)}</p>
      <a class="text-link" href="#tips">আরও Tips & Tricks →</a>
    </div>
  </section>`;
}

/** Today's participants and, if taken, your marks and position (fails quietly offline). */
async function loadDailyCard() {
  try {
    const d = await fetchDaily();
    const count = document.querySelector('[data-daily-count]');
    if (count) {
      count.querySelector('b').textContent = bn(d.participants);
      count.hidden = false;
    }
    const box = document.querySelector('[data-daily-status]');
    if (box && d.mine) box.innerHTML = dailyTaken(d.mine);
  } catch { /* offline: the card still opens the quiz */ }
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
        <span class="mode-tags"><span>⏳ ৩০ সে/প্রশ্ন</span><span>🔥 x2 bonus</span><span>🏆 Leaderboard</span></span>
      </a>
      <a class="mode-card t-exam" href="#start/exam">
        <span class="mode-emoji" aria-hidden="true">⏱️</span>
        <h3>Model Test</h3>
        <p>ভর্তি পরীক্ষার মতো একটানা timer, flag, প্রশ্ন তালিকা আর negative marking। Submit-এর পরে পূর্ণ বিশ্লেষণ।</p>
        <span class="mode-tags"><span>📋 ১০–৫০ প্রশ্ন</span><span>➖ প্রতি ভুলে −০.২৫</span><span>📊 Topic report</span></span>
      </a>
    </div>
    ${m ? `<div class="mini-modes"><a href="#start/fun/mistakes">🔁 <b>আমার ভুলগুলো</b> — ${bn(m)}টি প্রশ্ন আবার চেষ্টা করো</a></div>` : ''}
  </section>`;
}

function community() {
  return `<section class="container section">
    <div class="section-head"><div><h2>💬 কমিউনিটি</h2><p>আটকে গেলে প্রশ্ন করো, অন্যরা উত্তর দেবে। তুমিও কারও প্রশ্নের উত্তর দাও।</p></div><a class="text-link" href="#community">সব আলোচনা →</a></div>
    <div class="cm-list" id="home-community"><div class="skeleton"></div><div class="skeleton"></div></div>
    <a class="btn" href="#community/new">✍️ প্রশ্ন করো</a>
  </section>`;
}

function memorising() {
  const list = TOPICS.filter(t => t.group === 'memorising');
  if (!list.length) return '';
  return `<section class="container section">
    <div class="section-head"><div><h2>🧠 Memorising</h2><p>Vocabulary, Synonym-Antonym আর Appropriate Preposition—মুখস্থের অংশ, খেলতে খেলতে।</p></div><a class="text-link" href="#vocab">শব্দতালিকা →</a></div>
    <div class="topic-grid">
      <a class="topic-card" href="#vocab" style="--tone:#7a5af8"><span class="topic-icon" aria-hidden="true">📖</span><span class="topic-text"><b>শব্দতালিকা</b><small>বাংলা অর্থ, Synonym ও Antonym—খুঁজে দেখো</small></span><span class="topic-meta"><span>${bn(VOCAB_COUNT)}টি শব্দ</span></span></a>
      ${list.map(t => topicCard(t)).join('')}
    </div>
  </section>`;
}

function sbsCard() {
  return `<section class="container section">
    <div class="card sbs-card">
      <span class="sbs-badge" aria-hidden="true">SBS</span>
      <div>
        <span class="eyebrow">এই উদ্যোগের পেছনে</span>
        <h2>${esc(SBS.name)}</h2>
        <p>${esc(SBS.intro)}</p>
        <p class="sbs-chips">${SBS.work.map(([icon, title]) => `<span>${icon} ${esc(title)}</span>`).join('')}</p>
        <div class="actions"><a class="btn" href="#sbs">SBS সম্পর্কে →</a><a class="btn ghost fb-btn" href="${esc(SBS.facebook)}" target="_blank" rel="noopener noreferrer">📘 Facebook ↗</a></div>
      </div>
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
  return `
  <section class="hero">
    <div class="container hero-grid">
    <div class="hero-inner">
      <a class="eyebrow light" href="#sbs">${esc(SITE.initiative)}</a>
      <h1>স্বপ্নটা সেরা ক্যাম্পাসের,<br>প্রস্তুতিও হোক সেরা।</h1>
      <p>বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English MCQ—খেলার মতো মজায়, পরীক্ষার মতো নিয়মে। প্রতিটি উত্তরের সঙ্গে সহজ বাংলা ব্যাখ্যা।</p>
      <div class="hero-cta">
        <a class="btn big t-fun" href="#start/fun">🎮 Fun Quiz খেলো</a>
        <a class="btn big light" href="#start/exam">⏱️ Model Test দাও</a>
      </div>
      <ul class="hero-stats">
        <li><b>${bn(QUESTION_COUNT)}+</b><span>প্রশ্ন</span></li>
        <li><b>${bn(TOPICS.length)}</b><span>Topic</span></li>
        <li><b>${bn(UNIVERSITIES.length)}</b><span>বিশ্ববিদ্যালয়</span></li>
      </ul>
      <p class="live-pill" data-live hidden><i aria-hidden="true"></i><b></b> জন এখন অনলাইনে</p>
      <p class="today-visits" data-today hidden>আজ ভিজিট করেছেন <b></b> জন</p>
    </div>
    ${heroMedia(hero)}
    </div>
  </section>
  ${resumeBanner()}
  ${daily()}
  ${modes()}
  ${community()}
  <section class="container section">
    <div class="section-head"><div><h2>📘 Grammar</h2><p>যে topic-এ দুর্বল, সেখান থেকে শুরু করো।</p></div></div>
    <div class="topic-grid">${TOPICS.filter(t => t.group === 'grammar').map(t => topicCard(t)).join('')}</div>
  </section>
  ${memorising()}
  ${cuSpotlight()}
  ${sbsCard()}
  <section class="container section">
    <div class="section-head"><div><h2>Tips & Tricks</h2><p>কী পড়বে, কীভাবে পড়বে, পরীক্ষার হলে কী করবে।</p></div><a class="text-link" href="#tips">সব লেখা →</a></div>
    <div class="post-grid">${featured.map((p, i) => postCard(p, i === 0)).join('')}</div>
  </section>
  <section class="container section">
    <div class="section-head"><div><h2>🏆 Leaderboard</h2><p>প্রতিটা test-এর points যোগ হয়—যত test, তত points।</p></div><a class="text-link" href="#leaderboard">পুরো তালিকা →</a></div>
    ${leaderboard({ mode: 'all', limit: 5, tabs: true })}
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
  loadLatest(document.getElementById('home-community'));
  hydratePush();
  loadDailyCard();
}

export async function onAction(action) {
  if (action === 'discard') {
    if (await ask('অসমাপ্ত test বাদ দেবে? এর উত্তরগুলো মুছে যাবে।', { yes: 'বাদ দাও', no: 'না' })) {
      state.session = null;
      save();
      document.querySelector('.resume')?.remove();
    }
  }
}
