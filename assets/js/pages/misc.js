// Leaderboard, About and 404 pages.

import { TOPICS, QUESTIONS, GROUPS } from '../../../data/questions/index.js';
import { UNIVERSITIES, CONTENT_UPDATED } from '../../../data/universities.js';
import { SITE, SBS, CU_PHOTOS } from '../../../data/site.js';
import { esc, bn, bnDate, duration, ext, $, navigate } from '../lib/dom.js';
import { identityFields, wireIdentity, signIn } from '../lib/identity.js';
import { state, dailyStreak } from '../lib/store.js';
import { fetchMyStats } from '../lib/api.js';
import { pageHead, leaderboard, loadLeaderboards, empty, MODE_INFO, topicTitle } from '../components.js';

let lbMode = 'fun';
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

function myScores() {
  const ranked = state.history.filter(x => x.mode === 'fun' || x.mode === 'exam');
  if (!ranked.length && !state.player?.playerId) {
    return loginCard() + empty('এখনো কোনো test দাওনি। একটা দিলেই তোমার score এখানে দেখাবে।', '<a class="btn t-fun" href="#start/fun">🎮 Fun Quiz</a> <a class="btn" href="#start/exam">⏱️ Model Test</a>');
  }
  const best = mode => ranked.filter(x => x.mode === mode).reduce((m, x) => Math.max(m, mode === 'fun' ? x.score || 0 : x.percent || 0), -1);
  const fun = best('fun');
  const exam = best('exam');
  const p = state.player;
  return `${loginCard()}${p?.name ? `<p class="my-name"><span aria-hidden="true">${esc(p.avatar || '🚂')}</span> <b>${esc(p.tag || p.name)}</b>${p.playerId ? '' : ' <small class="muted">(এই device-এ)</small>'}${p.college ? `<small class="my-college">🏫 ${esc(p.college)}</small>` : ''}</p>` : ''}
    <div id="my-stats">${p?.playerId ? '<div class="skeleton"></div>' : ''}</div>
    <div class="stat-grid" id="local-stats">
      <div class="stat"><b>${fun < 0 ? '—' : bn(fun)}</b><small>Fun Quiz সেরা points</small></div>
      <div class="stat"><b>${exam < 0 ? '—' : `${bn(exam)}%`}</b><small>Model Test সেরা নম্বর</small></div>
      <div class="stat"><b>${bn(ranked.length)}</b><small>মোট test</small></div>
      <div class="stat"><b>🔥 ${bn(dailyStreak())}</b><small>দৈনিক streak</small></div>
    </div>
    <div class="history">${ranked.slice(0, 5).map(x => {
      const m = MODE_INFO[x.mode];
      return `<a class="history-row" href="#result/${esc(x.id)}"><span class="h-icon" aria-hidden="true">${m.icon}</span><span><b>${esc(x.title)}</b><small>${esc(m.label)} · ${bnDate(x.finished)} · ${duration(x.timeSec)}</small></span><span class="h-score">${x.mode === 'fun' ? `${bn(x.score)} pts` : `${bn(x.percent ?? 0)}%`}${x.saved === 'saved' ? ' <small title="Leaderboard-এ save">🏆</small>' : ''}</span></a>`;
    }).join('')}</div>
    <p><a class="text-link" href="#progress">সব ফলাফল, ভুল ও topic অনুযায়ী অগ্রগতি →</a></p>`;
}

// Server stats: tests taken, marks and leaderboard position per mode.
function rankCard(mode, s) {
  const m = MODE_INFO[mode];
  const unit = v => (mode === 'fun' ? `${bn(v)}` : `${bn(v)}%`);
  if (!s) return `<div class="rank-card t-${m.color}"><span class="rank-mode">${m.icon} ${esc(m.label)}</span><b>—</b><small>এখনো দাওনি</small></div>`;
  return `<div class="rank-card t-${m.color}">
    <span class="rank-mode">${m.icon} ${esc(m.label)}</span>
    <b>#${bn(s.rank)}</b><small>সব topic মিলিয়ে · ${bn(s.players)} জনের মধ্যে</small>
    <dl>
      <div><dt>মোট test</dt><dd>${bn(s.tests)}</dd></div>
      <div><dt>সেরা</dt><dd>${unit(s.best)}</dd></div>
      <div><dt>গড়</dt><dd>${unit(s.avg)}</dd></div>
      <div><dt>সঠিক / ভুল</dt><dd>${bn(s.correct)} / ${bn(s.wrong)}</dd></div>
    </dl>
  </div>`;
}

/** Bangla ordinal: ১ম, ২য়, ৩য়, ৪র্থ, ৬ষ্ঠ, ১১তম … */
const ordinal = n => `${bn(n)}${{ 1: 'ম', 2: 'য়', 3: 'য়', 4: 'র্থ', 6: 'ষ্ঠ' }[n] || (n <= 10 ? 'ম' : 'তম')}`;

// Position on each board (mode + topic) the student has played; a tap opens that leaderboard.
function topicRanks(list) {
  if (!list.length) return '';
  const rows = list.map(t => {
    const m = MODE_INFO[t.mode];
    const unit = v => (t.mode === 'fun' ? `${bn(v)} pts` : `${bn(v)}%`);
    return `<li><button class="tr-row" data-action="lb-board" data-mode="${esc(t.mode)}" data-topic="${esc(t.topic)}">
      <span class="tr-rank">${['🥇', '🥈', '🥉'][t.rank - 1] || `#${bn(t.rank)}`}</span>
      <span class="tr-text"><b lang="en">${esc(topicTitle(t.topic))}</b><small>${m.icon} ${esc(m.label)} · ${bn(t.players)} জনের মধ্যে ${ordinal(t.rank)} · ${bn(t.tests)} বার</small></span>
      <span class="tr-score"><small>সেরা</small>${unit(t.best)}</span>
    </button></li>`;
  }).join('');
  return `<div class="topic-ranks">
    <h3 class="h3">📚 Topic অনুযায়ী অবস্থান</h3>
    <p class="muted small">যে topic-এ test দিয়েছ, সেই topic-এর সবার মধ্যে তুমি কততম। চাপ দিলে ওই topic-এর leaderboard দেখাবে।</p>
    <ul class="tr-list">${rows}</ul>
  </div>`;
}

async function loadMyStats() {
  const box = $('#my-stats');
  if (!box || !state.player?.playerId) return;
  try {
    const { stats, topics = [] } = await fetchMyStats();
    if (!stats) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="rank-cards">${rankCard('fun', stats.fun)}${rankCard('exam', stats.exam)}</div>${topicRanks(topics)}`;
    $('#local-stats')?.remove();
  } catch {
    box.innerHTML = '';
  }
}

export const leaderboardPage = {
  render() {
    return `<div class="container narrow">
      ${pageHead('🏆 Score', 'তোমার নিজের score আর সবার সেরা score—এক জায়গায়।')}
      <section class="section-tight">
        <h2 class="h3">তোমার score</h2>
        ${myScores()}
      </section>
      <section class="section-tight">
        <h2 class="h3">Leaderboard</h2>
        <div class="field"><label class="label" for="lb-topic">Topic</label>
          <select id="lb-topic"><option value="all">সব topic</option>${Object.values(GROUPS).map(g => `<optgroup label="${esc(g.short)}"><option value="${g.id}" ${lbTopic === g.id ? 'selected' : ''}>${esc(g.title)}</option>${TOPICS.filter(t => t.group === g.id).map(t => `<option value="${esc(t.id)}" ${lbTopic === t.id ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</optgroup>`).join('')}</select></div>
        ${leaderboard({ mode: lbMode, topic: lbTopic, limit: 50, tabs: true })}
        <p class="muted small">প্রত্যেকের সেরা score দেখানো হয়। Fun Quiz-এ points, Model Test-এ শতকরা নম্বর (প্রতি ভুলে −০.২৫)। নাম দিয়ে শুরু করা Fun Quiz ও Model Test-এর score এখানে আসে।</p>
      </section>
      <section class="section-tight card feedback-card">
        <h2 class="h3">মতামত দাও</h2>
        <p>কোনো প্রশ্নে ভুল পেলে, নতুন topic চাইলে বা কিছু বুঝতে সমস্যা হলে সরাসরি জানাও।</p>
        <a class="btn wa-btn" href="${esc(SITE.feedback)}" target="_blank" rel="noopener noreferrer">💬 WhatsApp-এ feedback দাও</a>
      </section>
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
      });
    }
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

// The organisation behind the site, with its Facebook page (Facebook's own page box,
// loaded only when it scrolls into view so the page stays fast).
export const sbsPage = {
  render() {
    return `<div class="container narrow">
      ${pageHead(SBS.name, SBS.intro, SBS.area, [[null, 'SBS']])}
      <div class="sbs-work">${SBS.work.map(([icon, title, text]) => `<div class="card sbs-item"><span aria-hidden="true">${icon}</span><div><b>${esc(title)}</b><p>${esc(text)}</p></div></div>`).join('')}</div>
      <p class="actions"><a class="btn fb-btn" href="${esc(SBS.facebook)}" target="_blank" rel="noopener noreferrer">📘 Facebook পেজে যাও ↗</a></p>
      <section class="section-tight">
        <h2 class="h3">📣 Facebook-এ সর্বশেষ</h2>
        <div class="fb-embed" id="fb-embed"><p class="muted small">Facebook পেজ লোড হচ্ছে…</p></div>
        <p class="muted small">পোস্ট দেখা না গেলে (নেট বা browser-এর কারণে) ${ext(SBS.facebook, 'সরাসরি Facebook-এ দেখো')}</p>
      </section>
      <p class="muted">“${esc(SITE.name)}” SBS-এর উদ্যোগ—ভর্তিচ্ছুরা যেন ঘরে বসেই প্রস্তুতি নিতে পারে।</p>
    </div>`;
  },
  mount() {
    const box = $('#fb-embed');
    if (!box) return;
    const width = Math.max(280, Math.min(500, Math.floor(box.clientWidth)));
    const src = `https://www.facebook.com/plugins/page.php?${new URLSearchParams({
      href: SBS.facebook, tabs: 'timeline', width, height: 620, small_header: 'true', adapt_container_width: 'true', hide_cover: 'false', show_facepile: 'false',
    })}`;
    box.innerHTML = `<iframe src="${esc(src)}" width="${width}" height="620" loading="lazy" title="${esc(SBS.name)} — Facebook" allow="encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  },
};

export const aboutPage = {
  render() {
    return `<div class="container narrow">
      ${pageHead('আমাদের কথা', SITE.tagline, 'ABOUT')}
      <div class="prose">
        <h2>কার জন্য?</h2>
        <p>বিশ্ববিদ্যালয় ভর্তি পরীক্ষার্থীদের জন্য একটি free practice platform—বিশেষ করে যারা চট্টগ্রাম বিশ্ববিদ্যালয়ের স্বপ্ন দেখে। এখানে ${bn(QUESTIONS.length)}টি English MCQ, ${bn(TOPICS.length)}টি topic, ব্যাখ্যা ও সহজ বাংলা নোট রয়েছে, আর নিয়মিত নতুন প্রশ্ন যোগ হচ্ছে।</p>
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
        <p class="muted small">File-টা নিরাপদ জায়গায় রাখো—এতে সবার নাম ও roll আছে। নতুন database-এ নেওয়ার নিয়ম: <code>docs/MIGRATE_TO_D1.md</code>।</p>
      </form>
    </div>`;
  },
  mount() {
    const form = $('#backup-form');
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
