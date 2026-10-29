// Daily Quiz (#daily, #daily/<YYYY-MM-DD>): today's quiz, a row of round date
// buttons for every day so far, and for the chosen day: your result, the day's
// board, and the 20 questions with answers and explanations.
// Server: server/routes/daily.js. The questions stay hidden on today's page until
// you have taken today's quiz.

import { esc, bn, duration, $, toast } from '../lib/dom.js';
import { state, dailyStreak } from '../lib/store.js';
import { fetchDaily } from '../lib/api.js';
import { loadBank, getBank } from '../lib/bank.js';
import { examRef } from '../shared/source.js';
import { collegeShort } from '../../../data/colleges.js';
import { dhakaDay, DAY_RE, DAILY_SIZE, DAILY_SECONDS } from '../shared/daily.js';
import { EXAM_NEGATIVE } from '../shared/scoring.js';
import { pageHead, empty, isMe, shownTag, scoreRing } from '../components.js';
import { startSession } from '../quiz.js';
import { explainBlock } from './play.js';
import { hydratePush } from '../lib/push.js';

const L = 'ABCD';
const cache = new Map(); // day ('' = today) → last server answer
let shown = null; // what is on screen now

const asDate = day => new Date(`${day}T00:00:00Z`);
export const dayLong = day => asDate(day).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'UTC' });
export const dayShort = day => asDate(day).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', timeZone: 'UTC' });
export const dayNum = day => asDate(day).toLocaleDateString('bn-BD', { day: 'numeric', timeZone: 'UTC' });
export const dayMonth = day => asDate(day).toLocaleDateString('bn-BD', { month: 'short', timeZone: 'UTC' });

/** This browser's own try for a day (it may not have reached the server yet). */
export const localTry = day => state.history.find(h => h.kind === 'daily' && h.day === day && h.saved !== 'failed');

export const RULES = `${bn(DAILY_SIZE)}টি প্রশ্ন · ${bn(DAILY_SECONDS / 60)} মিনিট · প্রতি ভুলে −${bn(EXAM_NEGATIVE)} · দিনে একবারই গণনা হয়`;

/** Without the server (offline / no database): today plus the days taken on this phone. */
function localData(day) {
  const today = dhakaDay();
  const days = [...new Set([today, ...state.history.filter(h => h.kind === 'daily' && h.day).map(h => h.day)])]
    .sort().reverse().map(d => ({ day: d, participants: null, mine: localTry(d) ? { score: localTry(d).percent } : null }));
  const sel = day && days.some(d => d.day === day) ? day : today;
  return { offline: true, today, day: sel, ids: localTry(sel)?.answers?.map(a => a.id) || null, participants: null, board: [], mine: null, days };
}

/** Time left until midnight in Bangladesh (UTC+6), when the next Daily Quiz opens. */
export const msLeft = () => 86400000 - ((Date.now() + 6 * 3600000) % 86400000);
export const leftText = (ms = msLeft()) => {
  const m = Math.max(1, Math.ceil(ms / 60000));
  return m >= 60 ? `${bn(Math.floor(m / 60))} ঘণ্টা ${bn(m % 60)} মিনিট` : `${bn(m)} মিনিট`;
};

/** Keeps every [data-left] countdown on the page current (stops once none is left). */
let ticker = null;
export function tickLeft() {
  clearInterval(ticker);
  ticker = setInterval(() => {
    const els = document.querySelectorAll('[data-left]');
    if (!els.length) return clearInterval(ticker);
    for (const el of els) el.textContent = `⏳ ${el.dataset.left || 'শেষ হতে'} ${leftText()} পরে`;
  }, 30000);
}

const weekday = day => asDate(day).toLocaleDateString('bn-BD', { weekday: 'short', timeZone: 'UTC' });

function stats(d) {
  const taken = d.days.filter(x => x.mine);
  const best = taken.reduce((n, x) => Math.max(n, Math.round(x.mine.score)), 0);
  return `<ul class="daily-stats">
    <li><b>🔥 ${bn(dailyStreak())}</b><small>টানা দিন</small></li>
    <li><b>${bn(taken.length)}<i>/${bn(d.days.length)}</i></b><small>দিন দিয়েছ</small></li>
    <li><b>${taken.length ? `${bn(best)}%` : '—'}</b><small>সেরা</small></li>
  </ul>`;
}

function strip(d) {
  const days = [...d.days].reverse(); // oldest → newest (today at the right end)
  return `<nav class="day-strip" aria-label="তারিখ">${days.map(x => {
    const cls = [x.mine ? 'done' : x.day === d.today ? 'today' : 'missed', x.day === d.day ? 'sel' : ''].join(' ');
    return `<a class="day-dot ${cls}" href="#daily/${esc(x.day)}" ${x.day === d.day ? 'aria-current="date"' : ''} title="${esc(dayLong(x.day))}">
      <small>${x.day === d.today ? 'আজ' : esc(weekday(x.day))}</small><b>${dayNum(x.day)}</b><small>${esc(dayMonth(x.day))}</small>${x.mine ? `<i>${bn(Math.round(x.mine.score))}%</i>` : ''}</a>`;
  }).join('')}</nav>
  <p class="day-legend"><span class="dot-key done"></span> দিয়েছ <span class="dot-key today"></span> আজ <span class="dot-key missed"></span> দাওনি · তারিখে চাপ দিলে সেদিনের প্রশ্ন ও ফলাফল</p>`;
}

const chips = () => `<ul class="daily-chips"><li>📝 ${bn(DAILY_SIZE)}টি প্রশ্ন</li><li>⏱️ ${bn(DAILY_SECONDS / 60)} মিনিট</li><li>➖ ভুলে −${bn(EXAM_NEGATIVE)}</li><li>🎯 একবারই গণনা</li></ul>`;

function myResult(d) {
  const m = d.mine;
  const local = localTry(d.day);
  if (m) {
    const skipped = m.total - m.correct - m.wrong;
    return `<div class="daily-mine">
      ${scoreRing(Math.round(m.score), `${bn(Math.round(m.score))}%`, `${bn(m.marks)}/${bn(m.total)} নম্বর`)}
      <dl>
        <div><dt>অবস্থান</dt><dd>${['🥇', '🥈', '🥉'][m.rank - 1] || `#${bn(m.rank)}`} <small>/ ${bn(m.players)}</small></dd></div>
        <div><dt>✅ সঠিক</dt><dd>${bn(m.correct)}</dd></div>
        <div><dt>❌ ভুল</dt><dd>${bn(m.wrong)}</dd></div>
        <div><dt>⏭️ বাদ</dt><dd>${bn(skipped)}</dd></div>
        <div><dt>⏱️ সময়</dt><dd>${duration(m.timeSec)}</dd></div>
      </dl>
    </div>`;
  }
  if (local) {
    const pct = Math.round(local.percent ?? 0);
    return `<div class="daily-mine">
      ${scoreRing(pct, `${bn(pct)}%`, `${bn(local.marks ?? local.correct)}/${bn(local.total)} নম্বর`)}
      <p class="daily-sync">${local.saved === 'saved' ? '✅ Server-এ জমা হয়েছে।' : '📴 এখনো server-এ যায়নি—নেট এলে নিজে থেকেই যাবে।'} <a href="#result/${esc(local.id)}">পুরো উত্তরপত্র →</a></p>
    </div>`;
  }
  return '';
}

function dayCard(d) {
  const isToday = d.day === d.today;
  const taken = d.mine || localTry(d.day);
  const people = d.participants !== null ? `<span>👥 ${bn(d.participants)} জন অংশ নিয়েছে</span>` : '';
  let body = myResult(d);
  if (!taken) {
    body = isToday
      ? `<p class="daily-lead">CU, DU-সহ বিগত বছরের ভর্তি পরীক্ষার ${bn(DAILY_SIZE)}টি প্রশ্ন—সবার জন্য একই। যত কম ভুল, তত ওপরে।</p>
         ${chips()}
         <a class="btn big daily-go" href="#start/daily">▶ আজকের Quiz শুরু করো</a>`
      : '<p class="daily-lead">এই দিনের quiz তুমি দাওনি। নিচে প্রশ্ন, সঠিক উত্তর ও ব্যাখ্যা দেখে নাও—চাইলে practice-ও করতে পারো।</p>';
  }
  return `<section class="daily-hero ${isToday ? 'is-today' : 'is-past'} ${taken ? 'is-done' : ''}">
    <div class="daily-hero-head">
      <span class="daily-date"><b>${dayNum(d.day)}</b><small>${esc(dayMonth(d.day))}</small></span>
      <div><small>${isToday ? 'আজকের Daily Quiz' : 'Daily Quiz'}</small><h2>${esc(dayLong(d.day))}</h2><p>${people}${isToday ? `<span data-left="${taken ? 'পরেরটা' : 'শেষ হতে'}">⏳ ${taken ? 'পরেরটা' : 'শেষ হতে'} ${leftText()} পরে</span>` : ''}</p></div>
    </div>
    ${body}
    ${isToday ? '<p class="push-line" data-push hidden></p>' : ''}
  </section>`;
}

function board(d) {
  if (d.offline) return '<p class="notice">📴 Server-এ পৌঁছানো যাচ্ছে না—সবার ফলাফল নেট এলে দেখা যাবে।</p>';
  if (!d.board.length) return `<section class="section-tight"><h2 class="h3">🏆 এই দিনের সেরা</h2>${empty(d.day === d.today ? 'এখনো কেউ দেয়নি—প্রথম হওয়ার সুযোগ তোমার!' : 'এই দিনে কেউ অংশ নেয়নি।')}</section>`;
  return `<section class="section-tight"><h2 class="h3">🏆 এই দিনের সেরা</h2>
    <ol class="lb-list">${d.board.map(r => ({ ...r, me: isMe(r.tag) })).map(r => `<li class="${r.me ? 'me' : ''}">
      <span class="lb-rank">${['🥇', '🥈', '🥉'][r.rank - 1] || bn(r.rank)}</span>
      <span class="lb-avatar" aria-hidden="true">${esc(r.avatar)}</span>
      <span class="lb-name"><b>${esc(shownTag(r))}${r.me ? ' <em>(তুমি)</em>' : ''}</b><small>${r.college ? `🏫 ${esc(collegeShort(r.college))} · ` : ''}${bn(r.correct)}/${bn(r.total)} সঠিক · ${duration(r.timeSec)}</small></span>
      <span class="lb-score">${bn(r.marks)}<small>নম্বর</small></span></li>`).join('')}</ol>
    ${d.participants > d.board.length ? `<p class="muted small">প্রথম ${bn(d.board.length)} জন দেখানো হলো।</p>` : ''}
  </section>`;
}

function questionsBox(d) {
  const isToday = d.day === d.today;
  if (isToday && !d.mine && !localTry(d.day)) return '<p class="muted small daily-hidden">🔒 আজকের quiz দেওয়ার পর এখানে প্রশ্ন, সঠিক উত্তর ও ব্যাখ্যা দেখতে পাবে।</p>';
  if (!d.ids?.length) return '';
  return `<section class="section-tight">
    <div class="section-head"><h2 class="h3">📝 এই দিনের ${bn(d.ids.length)}টি প্রশ্ন ও উত্তর</h2>
      ${isToday ? '' : '<button class="btn small ghost" data-action="daily-practice">আবার practice করো</button>'}</div>
    <div id="daily-questions"><div class="skeleton"></div><div class="skeleton"></div></div>
  </section>`;
}

function questionItem(q, i, choice) {
  const status = choice === undefined ? '' : choice < 0 ? 'skipped' : choice === q.a ? 'right' : 'wrong';
  const icon = { right: '✅', wrong: '❌', skipped: '⏭️' }[status] || '•';
  return `<details class="review ${status}">
    <summary><span>${bn(i + 1)}. ${icon}</span> <span lang="en">${esc(q.q)}</span></summary>
    ${examRef(q.source) ? `<span class="src-tag">📌 ${esc(examRef(q.source))}</span>` : ''}
    <ul class="review-opts">${q.o.map((o, j) => `<li class="${j === q.a ? 'right' : ''} ${j === choice && j !== q.a ? 'wrong' : ''}"><span class="key">${L[j]}</span><span lang="en">${esc(o)}</span>${j === q.a ? ' ✓' : j === choice ? ' ✕' : ''}</li>`).join('')}</ul>
    ${explainBlock(q)}
  </details>`;
}

async function fillQuestions(d) {
  const box = $('#daily-questions');
  if (!box) return;
  try {
    const bank = await loadBank();
    if (shown !== d) return;
    const answers = d.mine?.answers || localTry(d.day)?.answers || [];
    const picked = new Map(answers.map(a => [a.id, a.choice]));
    const qs = d.ids.map(id => bank.QUESTION_MAP.get(id)).filter(Boolean);
    box.innerHTML = `<div class="reviews">${qs.map((q, i) => questionItem(q, i, picked.get(q.id))).join('')}</div>`;
  } catch {
    box.innerHTML = '<p class="notice">প্রশ্নগুলো লোড করা যায়নি—নেট দেখে আবার খোলো।</p>';
  }
}

function view(d) {
  return `${dayCard(d)}${stats(d)}${strip(d)}${board(d)}${questionsBox(d)}`;
}

function paint(d) {
  shown = d;
  const el = $('#daily-view');
  if (!el) return;
  el.innerHTML = view(d);
  el.querySelector('.day-dot.sel')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  hydratePush(el);
  tickLeft();
  fillQuestions(d);
}

export function render([day = '']) {
  const key = DAY_RE.test(day) ? day : '';
  return `<div class="container narrow daily-page">
    ${pageHead('📅 Daily Quiz', 'প্রতিদিন নতুন ২০টি প্রশ্ন, সবার জন্য একই—CU, DU-সহ বিগত বছরের ভর্তি পরীক্ষা থেকে।', '', [[null, 'Daily Quiz']])}
    <div id="daily-view">${cache.has(key) ? view(cache.get(key)) : '<div class="skeleton tall"></div><div class="skeleton"></div><div class="skeleton"></div>'}</div>
  </div>`;
}

export async function mount([day = '']) {
  const key = DAY_RE.test(day) ? day : '';
  if (cache.has(key)) paint(cache.get(key));
  try {
    const d = await fetchDaily(key);
    cache.set(key, d);
    const [page, open = ''] = location.hash.replace(/^#\/?/, '').split('/');
    if (page === 'daily' && (DAY_RE.test(open) ? open : '') === key) paint(d); // still on this page
  } catch (err) {
    if (err.status === 404) {
      const el = $('#daily-view');
      if (el) el.innerHTML = empty('এই দিনে কোনো Daily Quiz ছিল না।', '<a class="btn" href="#daily">আজকের Daily Quiz →</a>');
      return;
    }
    if (!cache.has(key)) paint(localData(key));
  }
}

export async function onAction(action) {
  if (action !== 'daily-practice' || !shown?.ids?.length) return;
  await loadBank();
  // Unranked practice of a past day's questions (kind 'retry' never goes to a leaderboard).
  if (!(await startSession({ mode: 'practice', kind: 'retry', topic: 'all', ids: shown.ids, title: `Daily Quiz · ${dayShort(shown.day)} (practice)` }))) toast('শুরু করা যায়নি।');
}
