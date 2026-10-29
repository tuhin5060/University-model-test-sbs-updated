// Leaderboard, About and 404 pages.

import { TOPICS, QUESTION_COUNT, GROUPS } from '../../../data/questions/meta.js';
import { UNIVERSITIES, CONTENT_UPDATED } from '../../../data/universities.js';
import { SITE, SBS, CU_PHOTOS } from '../../../data/site.js';
import { esc, bn, bnDate, duration, ext, $, navigate, toast } from '../lib/dom.js';
import { identityFields, wireIdentity, signIn } from '../lib/identity.js';
import { state, dailyStreak } from '../lib/store.js';
import { fetchMyStats, fetchTodayTop } from '../lib/api.js';
import { attemptPoints } from '../shared/scoring.js';
import { collegeShort } from '../../../data/colleges.js';
import { isMe, shownTag, pageHead, leaderboard, loadLeaderboards, empty, MODE_INFO, topicTitle } from '../components.js';

let lbMode = 'all';
let lbTopic = 'all';

// "My score" block: personal bests and recent results from this browser.
// Sign-in with an existing ID, for a student on a new phone or browser.
function loginCard() {
  if (state.player?.playerId) return '';
  return `<form class="card login-card" id="login-form" novalidate>
    <h3 class="h3">🔑 আগে খেলেছ?</h3>
    <p class="muted small">অন্য phone বা browser-এ পাওয়া ID দিয়ে ঢোকো—সব score ও অগ্রগতি চলে আসবে।</p>
    ${identityFields({ mode: 'login' })}
    <button class="btn" type="submit">ঢোকো</button>
  </form>`;
}

let scoreTab = 'board'; // which tab of the Score page is open: board | topics | tests

/** Bangla ordinal: ১ম, ২য়, ৩য়, ৪র্থ, ৬ষ্ঠ, ১১তম … */
const ordinal = n => `${bn(n)}${{ 1: 'ম', 2: 'য়', 3: 'য়', 4: 'র্থ', 6: 'ষ্ঠ' }[n] || (n <= 10 ? 'ম' : 'তম')}`;
const medal = rank => ['🥇', '🥈', '🥉'][rank - 1] || `#${bn(rank)}`;

// This browser's Fun Quiz / Model Test results (the Daily Quiz has its own page, #daily).
const myTests = () => state.history.filter(x => (x.mode === 'fun' || x.mode === 'exam') && x.kind !== 'daily');

// ---- my card: total points, position, Fun / Model Test / Daily, today -------------
function meCard() {
  const p = state.player;
  if (!p?.playerId) {
    return `${loginCard()}
      <div class="card me-empty"><p>নাম দিয়ে Fun Quiz বা Model Test দিলেই এখানে তোমার points আর অবস্থান দেখাবে।</p>
        <div class="actions"><a class="btn t-fun" href="#start/fun">🎮 Fun Quiz</a><a class="btn" href="#start/exam">⏱️ Model Test</a></div></div>`;
  }
  const local = myTests().reduce((n, x) => n + attemptPoints(x), 0);
  return `<section class="me-card" id="me-card" aria-live="polite">
    <div class="me-head">
      <span class="me-avatar" aria-hidden="true">${esc(p.avatar || '🚂')}</span>
      <div><b>${esc(p.tag || p.name)}</b>${p.college ? `<small>🏫 ${esc(p.college)}</small>` : ''}</div>
    </div>
    <div class="me-main">
      <div><small>মোট points</small><b data-me="points">${bn(local)}</b></div>
      <div class="me-rank"><small>সবার মধ্যে</small><b data-me="rank">—</b><small data-me="of"></small></div>
    </div>
    <div class="me-chips">
      <span>🎮 Fun <b data-me="fun">—</b></span>
      <span>⏱️ Test <b data-me="exam">—</b></span>
      <a href="#daily">📅 Daily 🔥 <b>${bn(dailyStreak())}</b> দিন</a>
    </div>
    <p class="me-today" data-me="today"></p>
  </section>`;
}

async function loadMyStats() {
  if (!state.player?.playerId || !$('#me-card')) return;
  const set = (k, html) => { const el = $(`[data-me="${k}"]`); if (el) el.innerHTML = html; };
  try {
    const { stats, topics = [], today = null } = await fetchMyStats();
    if (!$('#me-card')) return; // page changed meanwhile
    if (stats?.all) {
      set('points', bn(stats.all.points));
      set('rank', medal(stats.all.rank));
      set('of', `${bn(stats.all.players)} জনের মধ্যে`);
    } else {
      set('of', 'এখনো কোনো test নেই');
    }
    set('fun', stats?.fun ? `${bn(stats.fun.points)} <small>#${bn(stats.fun.rank)}</small>` : '—');
    set('exam', stats?.exam ? `${bn(stats.exam.points)} <small>#${bn(stats.exam.rank)}</small>` : '—');
    set('today', today
      ? `আজ: <b>${ordinal(today.rank)}</b> · ${bn(today.points)} pts · ${bn(today.attempts)}টি test (${bn(today.players)} জনের মধ্যে)`
      : 'আজ এখনো test দাওনি—একটা দিলেই আজকের তালিকায় উঠে যাবে।');
    const box = $('#my-topics');
    if (box) box.innerHTML = topicRanks(topics);
  } catch {
    set('of', '📴 Server-এ পৌঁছানো যায়নি');
  }
}

// ---- 📚 my topics -------------------------------------------------------------
function topicRanks(list) {
  if (!list.length) return empty('যে topic-এ নাম দিয়ে test দেবে, সেখানে সবার মধ্যে তোমার অবস্থান এখানে দেখাবে।');
  return `<p class="muted small">প্রতিটি topic-এ ওই topic-এর সব test-এর points যোগ করে তুমি কততম। চাপ দিলে ওই topic-এর leaderboard খুলবে।</p>
    <ul class="tr-list">${list.map(t => `<li><button class="tr-row" data-action="lb-board" data-mode="all" data-topic="${esc(t.topic)}">
      <span class="tr-rank">${medal(t.rank)}</span>
      <span class="tr-text"><b lang="en">${esc(topicTitle(t.topic))}</b><small>${bn(t.players)} জনের মধ্যে ${ordinal(t.rank)} · ${bn(t.tests)}টি test</small></span>
      <span class="tr-score">${bn(t.points)}<small>pts</small></span>
    </button></li>`).join('')}</ul>`;
}

// ---- 🕘 my tests (this phone) -----------------------------------------------------
function testsPanel() {
  const list = myTests();
  const rows = list.slice(0, 10).map(x => {
    const m = MODE_INFO[x.mode];
    return `<a class="history-row" href="#result/${esc(x.id)}"><span class="h-icon" aria-hidden="true">${m.icon}</span><span><b>${esc(x.title)}</b><small>${esc(m.label)} · ${x.mode === 'exam' ? `${bn(x.percent ?? 0)}% · ` : ''}${bnDate(x.finished)} · ${duration(x.timeSec)}</small></span><span class="h-score">+${bn(attemptPoints(x))}<small>pts</small>${x.saved === 'saved' ? '' : ' <small title="এখনো server-এ যায়নি">⏳</small>'}</span></a>`;
  }).join('');
  return `${list.length ? `<div class="history">${rows}</div>` : empty('এই phone-এ এখনো কোনো Fun Quiz বা Model Test নেই।')}
    <div class="score-links">
      <a class="text-link" href="#progress">📊 সব ফলাফল, ভুল ও topic অনুযায়ী অগ্রগতি →</a>
      <a class="text-link" href="#daily">📅 Daily Quiz-এর ফলাফল (তারিখ অনুযায়ী) →</a>
    </div>`;
}

// ---- 👑 today's top (most points since midnight Bangladesh time) ------------------
async function loadTodayTop(fresh = false) {
  const box = $('#today-top');
  if (!box) return;
  try {
    const { top, rows, players } = await fetchTodayTop({ fresh });
    if (!$('#today-top')) return; // page changed meanwhile
    const next = top ? rows.slice(1, 5).filter(r => r.points > 0) : [];
    box.innerHTML = top
      ? `<div class="tt-line"><span class="tt-crown" aria-hidden="true">👑</span>
          <span class="tt-body"><small>আজকের সেরা · ${bn(players)} জন test দিয়েছে</small>
          <b><span aria-hidden="true">${esc(top.avatar || '🚂')}</span> ${esc(shownTag(top))}${isMe(top.tag) ? ' <em>(তুমি!)</em>' : ''}</b>
          ${top.college ? `<span>🏫 ${esc(collegeShort(top.college))}</span>` : ''}</span>
          <span class="tt-pts">${bn(top.points)}<small>pts</small></span></div>
        ${next.length ? `<details class="tt-more"><summary>আজকের ২য়–${bn(next.length + 1)}${next.length + 1 === 2 ? 'য়' : 'ম'} দেখো</summary><ol class="tt-list">${next.map((r, i) => `<li${isMe(r.tag) ? ' class="me"' : ''}>
          <span class="tt-rank">${['🥈', '🥉'][i] || ordinal(i + 2)}</span>
          <span class="tt-who"><b><span aria-hidden="true">${esc(r.avatar || '🚂')}</span> ${esc(shownTag(r))}${isMe(r.tag) ? ' <em>(তুমি)</em>' : ''}</b>${r.college ? `<small>🏫 ${esc(collegeShort(r.college))}</small>` : ''}</span>
          <span class="tt-p">${bn(r.points)}<small>pts</small></span></li>`).join('')}</ol></details>` : ''}`
      : `<div class="tt-line"><span class="tt-crown" aria-hidden="true">👑</span><span class="tt-body"><small>আজকের সেরা</small><b>আজ এখনো কেউ score করেনি</b><span>এখনই একটা test দাও—আজকের মুকুট তোমার হতে পারে!</span></span></div>`;
    box.hidden = false;
  } catch {
    box.hidden = true; // server unreachable: show nothing rather than a guess
  }
}

function showTab(id) {
  scoreTab = id;
  document.querySelectorAll('[data-score-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.scoreTab === id)));
  document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== id; });
}

export const leaderboardPage = {
  render() {
    const tab = (id, icon, label) => `<button type="button" role="tab" data-score-tab="${id}" aria-selected="${scoreTab === id}"><span aria-hidden="true">${icon}</span>${label}</button>`;
    return `<div class="container narrow score-page">
      ${pageHead('🏆 Score', 'তোমার points, অবস্থান আর সবার সেরা—এক জায়গায়।')}
      ${meCard()}
      <section id="today-top" class="today-top" aria-live="polite" hidden></section>
      <nav class="score-tabs" role="tablist" aria-label="Score">
        ${tab('board', '🏆', 'Leaderboard')}${tab('topics', '📚', 'আমার topic')}${tab('tests', '🕘', 'আমার test')}
      </nav>
      <section data-panel="board" ${scoreTab === 'board' ? '' : 'hidden'}>
        <div class="field lb-filter"><label class="label" for="lb-topic">Topic</label>
          <select id="lb-topic"><option value="all">সব topic</option>${Object.values(GROUPS).map(g => `<optgroup label="${esc(g.short)}"><option value="${g.id}" ${lbTopic === g.id ? 'selected' : ''}>${esc(g.title)}</option>${TOPICS.filter(t => t.group === g.id).map(t => `<option value="${esc(t.id)}" ${lbTopic === t.id ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</optgroup>`).join('')}</select></div>
        ${leaderboard({ mode: lbMode, topic: lbTopic, limit: 50, tabs: true })}
        <details class="rules"><summary>ℹ️ Points কীভাবে গোনা হয়?</summary>
          <ul>
            <li>প্রতিটা test-এর points যোগ হয়—যত test, তত points।</li>
            <li>Fun Quiz: দ্রুত সঠিক উত্তরে বেশি points, টানা সঠিকে bonus।</li>
            <li>Model Test: প্রতি সঠিক +২০, প্রতি ভুল −৫ (ভর্তি পরীক্ষার −০.২৫ নিয়মে)।</li>
            <li>Daily Quiz-এর ফলাফল আলাদা—<a href="#daily">Daily Quiz পাতায়</a>।</li>
            <li>🔒 পুরো নাম গোপন থাকে: অন্যরা দেখে শুধু নামের শেষ অংশ, roll আর কলেজ।</li>
          </ul>
        </details>
      </section>
      <section data-panel="topics" ${scoreTab === 'topics' ? '' : 'hidden'}>
        <div id="my-topics">${state.player?.playerId ? '<div class="skeleton"></div>' : empty('নাম দিয়ে test দিলে topic অনুযায়ী তোমার অবস্থান এখানে দেখাবে।')}</div>
      </section>
      <section data-panel="tests" ${scoreTab === 'tests' ? '' : 'hidden'}>${testsPanel()}</section>
      <p class="score-feedback">কোনো প্রশ্নে ভুল পেলে বা নতুন topic চাইলে <a href="${esc(SITE.feedback)}" target="_blank" rel="noopener noreferrer">💬 WhatsApp-এ জানাও</a></p>
    </div>`;
  },
  mount() {
    const login = $('#login-form');
    if (login) {
      wireIdentity(login);
      login.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = login.querySelector('[type=submit]');
        btn.disabled = true;
        const player = await signIn(login);
        btn.disabled = false;
        if (player?.playerId) navigate(location.hash || '#leaderboard');
        else if (player === null) toast('⚠️ Server-এ পৌঁছানো গেল না—নেট দেখে আবার চেষ্টা করো।');
      });
    }
    document.querySelectorAll('[data-score-tab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.scoreTab)));
    loadTodayTop();
    loadMyStats();
    loadLeaderboards();
    $('#lb-topic')?.addEventListener('change', e => {
      lbTopic = e.target.value;
      const box = $('.lb');
      box.dataset.topic = lbTopic;
      loadLeaderboards();
    });
  },
};

leaderboardPage.onAction = (action, el) => {
  if (action !== 'lb-board') return;
  showTab('board');
  lbMode = el.dataset.mode;
  lbTopic = el.dataset.topic;
  const select = $('#lb-topic');
  if (select) select.value = lbTopic;
  const box = $('.lb');
  box.dataset.mode = lbMode;
  box.dataset.topic = lbTopic;
  box.querySelectorAll('[data-lb-mode]').forEach(b => b.setAttribute('aria-selected', b.dataset.lbMode === lbMode));
  loadLeaderboards(box.parentElement);
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export function switchBoardMode(el) {
  const box = el.closest('.lb');
  lbMode = el.dataset.lbMode;
  box.dataset.mode = lbMode;
  box.querySelectorAll('[data-lb-mode]').forEach(b => b.setAttribute('aria-selected', b === el));
  loadLeaderboards(box.parentElement);
}

// The organisation behind the site, with a link to its Facebook page.
export const sbsPage = {
  render() {
    return `<div class="container narrow">
      ${pageHead(SBS.name, SBS.intro, SBS.area, [[null, 'SBS']])}
      <div class="sbs-work">${SBS.work.map(([icon, title, text]) => `<div class="card sbs-item"><span aria-hidden="true">${icon}</span><div><b>${esc(title)}</b><p>${esc(text)}</p></div></div>`).join('')}</div>
      <p class="actions"><a class="btn fb-btn" href="${esc(SBS.facebook)}" target="_blank" rel="noopener noreferrer">📘 Facebook পেজে যাও ↗</a></p>
      <p class="muted small">সর্বশেষ খবর, কার্যক্রমের ছবি আর ঘোষণা SBS-এর Facebook পেজে।</p>
      <p class="muted">“${esc(SITE.name)}” SBS-এর উদ্যোগ—ভর্তিচ্ছুরা যেন ঘরে বসেই প্রস্তুতি নিতে পারে।</p>
    </div>`;
  },
};

export const aboutPage = {
  render() {
    return `<div class="container narrow">
      ${pageHead('আমাদের কথা', SITE.tagline, 'ABOUT')}
      <div class="prose">
        <h2>কার জন্য?</h2>
        <p>বিশ্ববিদ্যালয় ভর্তি পরীক্ষার্থীদের জন্য একটি free practice platform—বিশেষ করে যারা চট্টগ্রাম বিশ্ববিদ্যালয়ের স্বপ্ন দেখে। এখানে ${bn(QUESTION_COUNT)}টি English MCQ, ${bn(TOPICS.length)}টি topic, ব্যাখ্যা ও সহজ বাংলা নোট রয়েছে, আর নিয়মিত নতুন প্রশ্ন যোগ হচ্ছে।</p>
        <h2>প্রশ্নের উৎস</h2>
        <p>প্রতিটি প্রশ্নে source label (যেমন “CU A Unit 2016–17”) রাখা আছে। কিছু প্রশ্ন বিগত বছরের, কিছু adapted, কিছু সাধারণ practice-এর জন্য তৈরি। Source label থাকলেই সেটি সম্পূর্ণ official প্রশ্নপত্র—এমন দাবি করা হচ্ছে না। কোনো উত্তরে ভুল পেলে নিচের WhatsApp link-এ জানাও।</p>
        <h2>তথ্যের নির্ভরযোগ্যতা</h2>
        <p>Admission-এর তারিখ, fee, যোগ্যতা বা আসন সংখ্যার জন্য সংশ্লিষ্ট বিশ্ববিদ্যালয়ের বর্তমান official circular-ই চূড়ান্ত। এই site কোনো বিশ্ববিদ্যালয়ের official website নয়। Content সর্বশেষ যাচাই: ${bnDate(CONTENT_UPDATED)}।</p>
        <h2>Privacy</h2>
        <p>তোমার practice history, ভুলের তালিকা ও checklist এই browser-এ থাকে, আর একটা backup copy server-এ (Neon database) রাখা হয়। নাম + roll-ই তোমার পরিচয়—কোনো password বা phone number চাওয়া হয় না। তাই নিজের roll অন্যকে দিয়ো না।</p>
        <h2>Official links</h2>
        <ul>${UNIVERSITIES.map(u => `<li><b>${esc(u.short)}</b> — ${ext(u.site, 'Website')}${u.admission ? ` · ${ext(u.admission, 'Admission')}` : ''}</li>`).join('')}</ul>
        <h2>ছবির credit</h2>
        <ul>${CU_PHOTOS.map(p => `<li>${esc(p.caption)} — ${p.creditUrl ? ext(p.creditUrl, p.credit) : esc(p.credit)}</li>`).join('')}</ul>
        <p class="muted small">Wikimedia Commons-এর ছবিগুলো তাদের নিজ নিজ licence (সাধারণত CC BY-SA) অনুযায়ী ব্যবহৃত; বিস্তারিত file page-এ।</p>
        <h2>উদ্যোগ</h2>
        <div class="dev-credit"><img src="${esc(SITE.developer.photo)}" width="44" height="44" alt="${esc(SITE.developer.name)}" loading="lazy" decoding="async">
          <p>Initiative by <a href="#sbs"><b>${esc(SITE.initiative)}</b></a> · ${ext(SBS.facebook, 'Facebook')}<br>Developed by ${ext(SITE.developer.url, SITE.developer.name)}</p></div>
        <h2>Feedback</h2>
        <p>কোনো উত্তরে ভুল পেলে, নতুন প্রশ্ন বা topic চাইলে সরাসরি WhatsApp-এ জানাও: ${ext(SITE.feedback, 'WhatsApp-এ message পাঠাও')}</p>
        <p class="muted small"><a href="#backup">🔒 Admin: data backup</a></p>
      </div>
    </div>`;
  },
};

// Admin: download every stored table as one JSON file (keep it safe; see docs/MIGRATE_TO_D1.md).
export const backupPage = {
  render() {
    return `<div class="container narrow">
      ${pageHead('🔒 Data backup', 'সব শিক্ষার্থী, roll, score, অগ্রগতি আর কমিউনিটির লেখা একটা file-এ download হবে। শুধু admin-এর জন্য।', '', [[null, 'Backup']])}
      <form class="card cm-form" id="backup-form">
        <label class="label" for="backup-password">Admin password</label>
        <input id="backup-password" type="password" name="password" autocomplete="current-password" required>
        <p class="field-error" id="backup-error" hidden></p>
        <button class="btn" type="submit">⬇️ Backup download করো</button>
        <button class="btn ghost" type="button" id="usage-btn">📊 Database কতটুকু ভরেছে?</button>
        <div id="usage-box" hidden></div>
        <p class="muted small">File-টা নিরাপদ জায়গায় রাখো—এতে সবার নাম ও roll আছে। নতুন database-এ নেওয়ার নিয়ম: <code>docs/MIGRATE_TO_D1.md</code>।</p>
      </form>
    </div>`;
  },
  mount() {
    const form = $('#backup-form');
    $('#usage-btn')?.addEventListener('click', async e => {
      const box = $('#usage-box');
      e.target.disabled = true;
      try {
        const res = await fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: form.elements.password.value, stats: true }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || `(${res.status})`);
        const mb = data.size / 1048576;
        const pct = data.size / (1024 ** 3) * 100; // Neon free plan: 1 GB per project
        box.innerHTML = `<p><b>Storage:</b> ${esc(mb.toFixed(1))} MB / 1 GB (${esc(pct < 0.1 ? '<0.1' : pct.toFixed(1))}%)</p>
          <p class="muted small">${Object.entries(data.rows).map(([t, n]) => `${esc(t)}: ${bn(n)}`).join(' · ')}</p>
          <p class="muted small">Compute (মাসে ১০০ CU-hour) দেখা যায় শুধু Neon console-এ: Vercel → Storage → database → Open in Neon → Usage।</p>`;
      } catch (err) {
        box.innerHTML = `<p class="field-error">${esc(err.message)}</p>`;
      } finally {
        box.hidden = false;
        e.target.disabled = false;
      }
    });
    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const error = $('#backup-error');
      const btn = form.querySelector('[type=submit]');
      error.hidden = true;
      btn.disabled = true;
      btn.textContent = 'তৈরি হচ্ছে…';
      try {
        const res = await fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: form.elements.password.value }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || `Backup failed (${res.status})`);
        const { ok, ...backup } = data;
        const a = Object.assign(document.createElement('a'), {
          href: URL.createObjectURL(new Blob([JSON.stringify(backup, null, 1)], { type: 'application/json' })),
          download: `campus-backup-${backup.exportedAt.slice(0, 10)}.json`,
        });
        a.click();
        URL.revokeObjectURL(a.href);
        const counts = Object.entries(backup.tables).map(([t, rows]) => `${t}: ${rows.length}`).join(', ');
        error.textContent = `✅ Download হয়েছে (${counts})`;
        error.style.color = 'var(--good)';
        error.hidden = false;
        form.elements.password.value = '';
      } catch (err) {
        error.textContent = err.message;
        error.style.color = '';
        error.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = '⬇️ Backup download করো';
      }
    });
  },
};

export const notFound = {
  render() {
    return `<div class="container narrow section">${empty('এই পাতাটি পাওয়া যায়নি।', '<a class="btn" href="#home">হোমে ফিরে যাও</a>')}</div>`;
  },
};
