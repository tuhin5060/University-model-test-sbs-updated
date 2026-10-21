// Leaderboard, About and 404 pages.

import { TOPICS, QUESTIONS } from '../../../data/questions/index.js';
import { UNIVERSITIES, CONTENT_UPDATED } from '../../../data/universities.js';
import { SITE, CU_PHOTOS } from '../../../data/site.js';
import { esc, bn, bnDate, duration, ext, $ } from '../lib/dom.js';
import { state, dailyStreak } from '../lib/store.js';
import { pageHead, leaderboard, loadLeaderboards, empty, MODE_INFO } from '../components.js';

let lbMode = 'fun';
let lbTopic = 'all';

// "My score" block: personal bests and recent results from this browser.
function myScores() {
  const ranked = state.history.filter(x => x.mode === 'fun' || x.mode === 'exam');
  if (!ranked.length) {
    return empty('এখনো কোনো test দাওনি। একটা দিলেই তোমার score এখানে দেখাবে।', '<a class="btn t-fun" href="#start/fun">🎮 Fun Quiz</a> <a class="btn" href="#start/exam">⏱️ Model Test</a>');
  }
  const best = mode => ranked.filter(x => x.mode === mode).reduce((m, x) => Math.max(m, mode === 'fun' ? x.score || 0 : x.percent || 0), -1);
  const fun = best('fun');
  const exam = best('exam');
  const p = state.player;
  return `${p?.name ? `<p class="my-name"><span aria-hidden="true">${esc(p.avatar || '🚂')}</span> <b>${esc(p.name)}</b>${p.playerId ? '' : ' <small class="muted">(এই device-এ)</small>'}</p>` : ''}
    <div class="stat-grid">
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
          <select id="lb-topic"><option value="all">সব topic</option>${TOPICS.map(t => `<option value="${esc(t.id)}" ${lbTopic === t.id ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</select></div>
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
    loadLeaderboards();
    $('#lb-topic')?.addEventListener('change', e => {
      lbTopic = e.target.value;
      const box = $('.lb');
      box.dataset.topic = lbTopic;
      loadLeaderboards();
    });
  },
};

export function switchBoardMode(el) {
  const box = el.closest('.lb');
  lbMode = el.dataset.lbMode;
  box.dataset.mode = lbMode;
  box.querySelectorAll('[data-lb-mode]').forEach(b => b.setAttribute('aria-selected', b === el));
  loadLeaderboards(box.parentElement);
}

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
        <p>তোমার practice history, ভুলের তালিকা ও checklist শুধু এই browser-এ থাকে। Leaderboard-এ অংশ নিলে শুধু নাম, avatar ও score server-এ (MongoDB) save হয়। কোনো password, roll বা phone number চাওয়া হয় না।</p>
        <h2>Official links</h2>
        <ul>${UNIVERSITIES.map(u => `<li><b>${esc(u.short)}</b> — ${ext(u.site, 'Website')}${u.admission ? ` · ${ext(u.admission, 'Admission')}` : ''}</li>`).join('')}</ul>
        <h2>ছবির credit</h2>
        <ul>${CU_PHOTOS.map(p => `<li>${esc(p.caption)} — ${p.creditUrl ? ext(p.creditUrl, p.credit) : esc(p.credit)}</li>`).join('')}</ul>
        <p class="muted small">Wikimedia Commons-এর ছবিগুলো তাদের নিজ নিজ licence (সাধারণত CC BY-SA) অনুযায়ী ব্যবহৃত; বিস্তারিত file page-এ।</p>
        <h2>উদ্যোগ</h2>
        <div class="dev-credit"><img src="${esc(SITE.developer.photo)}" width="44" height="44" alt="${esc(SITE.developer.name)}" loading="lazy" decoding="async">
          <p>Initiative by <b>${esc(SITE.initiative)}</b><br>Developed by ${ext(SITE.developer.url, SITE.developer.name)}</p></div>
        <h2>Feedback</h2>
        <p>কোনো উত্তরে ভুল পেলে, নতুন প্রশ্ন বা topic চাইলে সরাসরি WhatsApp-এ জানাও: ${ext(SITE.feedback, 'WhatsApp-এ message পাঠাও')}</p>
      </div>
    </div>`;
  },
};

export const notFound = {
  render() {
    return `<div class="container narrow section">${empty('এই পাতাটি পাওয়া যায়নি।', '<a class="btn" href="#home">হোমে ফিরে যাও</a>')}</div>`;
  },
};
