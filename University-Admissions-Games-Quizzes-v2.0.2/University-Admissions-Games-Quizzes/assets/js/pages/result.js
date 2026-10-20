// Result + answer review for a finished attempt.

import { QUESTION_MAP } from '../../../data/questions/index.js';
import { esc, bn, duration, bnDate, $, $$, toast } from '../lib/dom.js';
import { state } from '../lib/store.js';
import { celebrate, beep } from '../lib/fx.js';
import { MODE_INFO, pageHead, scoreRing, leaderboard, loadLeaderboards, topicById, empty } from '../components.js';
import { startSession, sendScore } from '../quiz.js';

const L = 'ABCD';
let filter = 'all';
let lastShown = null;

function saveStatus(h) {
  if (h.kind !== 'topic' || h.mode === 'practice') return '';
  if (!h.player?.playerId) {
    return `<p class="notice">💡 পরের বার নাম দিয়ে শুরু করলে score leaderboard-এ উঠবে।</p>`;
  }
  const map = {
    saving: '<p class="notice" id="save-status">⏳ Leaderboard-এ score পাঠানো হচ্ছে…</p>',
    saved: '<p class="notice good" id="save-status">✅ Score leaderboard-এ save হয়েছে।</p>',
    local: `<p class="notice warn" id="save-status">⚠️ Server-এ save হয়নি (${esc(h.saveError || 'offline')})। <button class="link-btn" data-action="retry-save" data-id="${esc(h.id)}">আবার চেষ্টা করো</button></p>`,
  };
  return map[h.saved] || '';
}

function verdict(p) {
  if (p >= 90) return ['অসাধারণ! 🏆', 'এই topic তোমার দখলে।'];
  if (p >= 75) return ['দারুণ হয়েছে! 🎉', 'আর একটু হলেই নিখুঁত।'];
  if (p >= 50) return ['ভালো চেষ্টা! 💪', 'ভুলগুলো দেখে নিলেই score লাফ দেবে।'];
  return ['শেখার শুরু এখানেই 🌱', 'ব্যাখ্যাগুলো পড়ো, তারপর ভুলগুলো আবার practice করো।'];
}

function reviewItem(a, i, h) {
  const q = QUESTION_MAP.get(a.id);
  if (!q) return '';
  const status = a.choice < 0 ? 'skipped' : a.choice === q.a ? 'right' : 'wrong';
  const topic = topicById(q.topicId);
  const bnText = q.bn || (/[ঀ-৿]/.test(q.e) ? '' : topic?.tipBn);
  return `<article class="review ${status}" data-status="${status}" ${a.flag ? 'data-flag="1"' : ''}>
    <div class="q-meta"><span>${bn(i + 1)}. ${status === 'right' ? '✅ সঠিক' : status === 'wrong' ? '❌ ভুল' : '⏭️ উত্তর দাওনি'}${a.flag ? ' · 🚩' : ''}${h.points?.[a.id] ? ` · +${bn(h.points[a.id])}` : ''}</span><span class="src">${esc(q.source)}</span></div>
    <h3 lang="en">${esc(q.q)}</h3>
    <ul class="review-opts">${q.o
      .map((o, j) => `<li class="${j === q.a ? 'right' : ''} ${j === a.choice && j !== q.a ? 'wrong' : ''}"><span class="key">${L[j]}</span><span lang="en">${esc(o)}</span>${j === q.a ? ' ✓' : j === a.choice ? ' ✕' : ''}</li>`)
      .join('')}</ul>
    <details ${status !== 'right' ? 'open' : ''}><summary>ব্যাখ্যা</summary><p lang="en">${esc(q.e)}</p>${bnText ? `<p class="bn-note"><b>সহজ বাংলায়:</b> ${esc(bnText)}</p>` : ''}</details>
  </article>`;
}

function topicBreakdown(h) {
  const groups = new Map();
  for (const a of h.answers || []) {
    const q = QUESTION_MAP.get(a.id);
    if (!q) continue;
    const g = groups.get(q.topicId) || { title: q.topic, right: 0, total: 0 };
    g.total++;
    if (a.choice === q.a) g.right++;
    groups.set(q.topicId, g);
  }
  if (groups.size < 2) return '';
  return `<section class="card"><h2 class="h3">Topic অনুযায়ী</h2><div class="bars">${[...groups.values()]
    .sort((x, y) => x.right / x.total - y.right / y.total)
    .map(g => {
      const p = Math.round((g.right / g.total) * 100);
      return `<div class="bar-row"><span lang="en">${esc(g.title)}</span><span class="meter"><i style="width:${p}%"></i></span><b>${bn(g.right)}/${bn(g.total)}</b></div>`;
    })
    .join('')}</div></section>`;
}

export function render([id]) {
  const h = id ? state.history.find(x => x.id === id) : state.history[0];
  if (h && lastShown !== h.id) filter = 'all';
  if (!h) return `<div class="container narrow section">${empty('কোনো ফলাফল পাওয়া যায়নি।', '<a class="btn" href="#start/fun">নতুন Quiz শুরু করো</a>')}</div>`;
  const info = MODE_INFO[h.mode] || MODE_INFO.practice;
  const pct = h.total ? Math.round((h.correct / h.total) * 100) : 0;
  const [title, line] = verdict(pct);
  const answers = h.answers || [];
  const wrongIds = answers.filter(a => { const q = QUESTION_MAP.get(a.id); return q && a.choice !== q.a; }).map(a => a.id);
  const ring = h.mode === 'fun' ? scoreRing(pct, bn(h.score), 'points') : h.mode === 'exam' ? scoreRing(h.percent, `${bn(h.percent)}%`, h.marks === undefined ? 'নম্বর' : `${bn(h.marks)} নম্বর`) : scoreRing(pct, `${bn(pct)}%`, 'সঠিক');
  const counts = { right: h.correct, wrong: h.wrong, skip: h.skipped, flag: answers.filter(a => a.flag).length };

  return `<div class="container">
    ${pageHead(`${info.icon} ${title}`, line, `${info.label} · ${h.title}`, [['#progress', 'অগ্রগতি'], [null, 'ফলাফল']])}
    <section class="result-hero card">
      ${ring}
      <div class="result-stats">
        <div><b>${bn(h.correct)}</b><small>সঠিক</small></div>
        <div><b>${bn(h.wrong)}</b><small>ভুল</small></div>
        <div><b>${bn(h.skipped)}</b><small>বাদ</small></div>
        <div><b>${duration(h.timeSec)}</b><small>সময়</small></div>
        ${h.mode === 'fun' ? `<div><b>${bn(h.bestStreak)} 🔥</b><small>সেরা streak</small></div>` : ''}
        ${h.mode === 'exam' && h.settings?.negative ? `<div><b>−${bn(h.settings.negative)}</b><small>প্রতি ভুলে</small></div>` : ''}
      </div>
      <div class="result-actions">
        ${wrongIds.length ? `<button class="btn" data-action="retry-wrong" data-id="${esc(h.id)}">🔁 ভুলগুলো আবার practice (${bn(wrongIds.length)})</button>` : ''}
        <a class="btn ghost" href="#start/${esc(h.mode === 'practice' ? 'fun' : h.mode)}/${esc(['daily', 'retry'].includes(h.kind) ? 'all' : h.topic)}">আবার খেলো</a>
        <button class="btn ghost" data-action="share" data-id="${esc(h.id)}">📤 Share</button>
      </div>
      ${saveStatus(h)}
      ${h.auto ? '<p class="muted small">⏰ সময় শেষ হওয়ায় স্বয়ংক্রিয়ভাবে জমা হয়েছে।</p>' : ''}
      <p class="muted small">${bnDate(h.finished)}</p>
    </section>
    ${topicBreakdown(h)}
    ${h.kind === 'topic' && h.mode !== 'practice' ? `<section class="section"><div class="section-head"><h2>🏆 এই topic-এর leaderboard</h2></div>${leaderboard({ mode: h.mode, topic: h.topic, limit: 10 })}</section>` : ''}
    <section class="section" id="review">
      <div class="section-head"><h2>উত্তরপত্র</h2>
        ${answers.length ? `<div class="chips" role="group" aria-label="Filter">${[['all', 'সব', answers.length], ['wrong', '❌ ভুল', counts.wrong], ['skipped', '⏭️ বাদ', counts.skip], ['right', '✅ সঠিক', counts.right], ...(counts.flag ? [['flag', '🚩 Flag', counts.flag]] : [])]
          .map(([k, label, n]) => `<button class="chip ${filter === k ? 'active' : ''}" data-action="filter" data-filter="${k}">${label} ${bn(n)}</button>`)
          .join('')}</div>` : ''}
      </div>
      ${answers.length ? `<div class="reviews" data-filter="${filter}">${answers.map((a, i) => reviewItem(a, i, h)).join('')}</div>` : '<p class="empty">এই পুরোনো ফলাফলের উত্তরপত্র সংরক্ষিত নেই।</p>'}
    </section>
  </div>`;
}

export function mount([id]) {
  const h = id ? state.history.find(x => x.id === id) : state.history[0];
  if (!h) return;
  loadLeaderboards();
  if (lastShown !== h.id && Date.now() - h.finished < 5000) {
    const pct = h.total ? h.correct / h.total : 0;
    if (pct >= 0.7) { celebrate(['🎉', '🏆', '⭐', '✨'], 26); beep('win'); }
  }
  lastShown = h.id;
}

export function onAction(action, el) {
  const h = state.history.find(x => x.id === el.dataset.id) || state.history[0];
  if (action === 'filter') {
    filter = el.dataset.filter;
    const box = $('.reviews');
    if (box) box.dataset.filter = filter;
    $$('[data-action=filter]').forEach(b => b.classList.toggle('active', b === el));
  } else if (action === 'retry-wrong' && h) {
    const ids = (h.answers || []).filter(a => { const q = QUESTION_MAP.get(a.id); return q && a.choice !== q.a; }).map(a => a.id);
    startSession({ mode: 'practice', topic: h.topic, ids, kind: 'retry', title: 'ভুলগুলো আবার' });
  } else if (action === 'retry-save' && h) {
    sendScore(h.id);
  } else if (action === 'share' && h) {
    const text = `আমি "ক্যাম্পাস পথে"-তে ${h.title} ${MODE_INFO[h.mode]?.label || ''}-এ ${h.correct}/${h.total} সঠিক করেছি${h.mode === 'fun' ? ` (${h.score} points)` : ''}! তুমি পারবে? 🎯`;
    const url = location.origin + location.pathname;
    if (navigator.share) navigator.share({ text, url }).catch(() => {});
    else navigator.clipboard?.writeText(`${text} ${url}`).then(() => toast('📋 Copy হয়েছে—যেকোনো জায়গায় paste করো'), () => toast(text));
  }
}

window.addEventListener('score-status', e => {
  const el = document.getElementById('save-status');
  const h = state.history.find(x => x.id === e.detail.id);
  if (el && h && location.hash.includes(h.id)) {
    el.outerHTML = saveStatus(h);
    if (h.saved === 'saved') loadLeaderboards(document, true);
  }
});
