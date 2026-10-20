// Leaderboard, About and 404 pages.

import { TOPICS, QUESTIONS } from '../../../data/questions/index.js';
import { UNIVERSITIES, CONTENT_UPDATED } from '../../../data/universities.js';
import { SITE, CU_PHOTOS } from '../../../data/site.js';
import { esc, bn, bnDate, ext, $ } from '../lib/dom.js';
import { pageHead, leaderboard, loadLeaderboards, empty } from '../components.js';

let lbMode = 'fun';
let lbTopic = 'all';

export const leaderboardPage = {
  render() {
    return `<div class="container narrow">
      ${pageHead('🏆 Leaderboard', 'প্রত্যেক শিক্ষার্থীর সেরা score। Fun Quiz-এ points, Model Test-এ শতকরা নম্বর।', 'TOP STUDENTS')}
      <div class="field"><label class="label" for="lb-topic">Topic</label>
        <select id="lb-topic"><option value="all">সব topic</option>${TOPICS.map(t => `<option value="${esc(t.id)}" ${lbTopic === t.id ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</select></div>
      ${leaderboard({ mode: lbMode, topic: lbTopic, limit: 50, tabs: true })}
      <p class="muted small">Score server-এ আবার হিসাব করে যাচাই করা হয়। শুধু topic-ভিত্তিক Fun Quiz ও Model Test leaderboard-এ গোনা হয় (ভুলের practice বা দৈনিক চ্যালেঞ্জ নয়)।</p>
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
        <p>প্রতিটি প্রশ্নে source label (যেমন “CU A Unit 2016–17”) রাখা আছে। কিছু প্রশ্ন বিগত বছরের, কিছু adapted, কিছু সাধারণ practice-এর জন্য তৈরি। Source label থাকলেই সেটি সম্পূর্ণ official প্রশ্নপত্র—এমন দাবি করা হচ্ছে না। কোনো উত্তরে ভুল পেলে আমাদের জানাও।</p>
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
        <p>Initiative by <b>${esc(SITE.initiative)}</b> · Developed by ${ext(SITE.developer.url, SITE.developer.name)}</p>
      </div>
    </div>`;
  },
};

export const notFound = {
  render() {
    return `<div class="container narrow section">${empty('এই পাতাটি পাওয়া যায়নি।', '<a class="btn" href="#home">হোমে ফিরে যাও</a>')}</div>`;
  },
};
