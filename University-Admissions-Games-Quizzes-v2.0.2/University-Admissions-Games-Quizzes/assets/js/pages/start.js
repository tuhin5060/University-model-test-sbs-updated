// Setup screen for a new Fun Quiz / Model Test / Practice session.

import { TOPICS, QUESTIONS } from '../../../data/questions/index.js';
import { AVATARS } from '../../../data/site.js';
import { esc, bn, $, toast } from '../lib/dom.js';
import { state, save, mistakeIds } from '../lib/store.js';
import { saveProfile } from '../lib/api.js';
import { EXAM_PACE } from '../shared/scoring.js';
import { MODE_INFO, pageHead, topicAccuracy } from '../components.js';
import { startSession } from '../quiz.js';

const OPTIONS = {
  fun: { counts: [10, 15, 20], default: 10 },
  exam: { counts: [10, 20, 30, 50], default: 20 },
  practice: { counts: [10, 20, 30], default: 10 },
};

const MODE_TEXT = {
  fun: ['প্রতি প্রশ্নে countdown', 'ঠিক উত্তরে points, streak-এ x1.5 / x2 bonus', '50:50 ও Freeze lifeline', 'সঙ্গে সঙ্গে ব্যাখ্যা'],
  exam: ['পুরো test-এ একটি timer', 'প্রশ্ন বাদ দিয়ে পরে ফেরা, 🚩 flag', 'চাইলে negative marking', 'Submit-এর পরে answer key ও বিশ্লেষণ'],
  practice: ['কোনো timer নেই', 'প্রতিটি উত্তরের পরেই ব্যাখ্যা', 'নতুন rule শেখার জন্য সেরা', 'ভুলগুলো আলাদা করে জমা থাকে'],
};

function topicOption(id, title, sub, count, icon, checked, tone = '') {
  const acc = topicAccuracy(id);
  return `<label class="pick ${checked ? 'is-checked' : ''}" style="${tone ? `--tone:${esc(tone)}` : ''}">
    <input type="radio" name="topic" value="${esc(id)}" ${checked ? 'checked' : ''} ${count ? '' : 'disabled'}>
    <span class="pick-icon" aria-hidden="true">${esc(icon)}</span>
    <span class="pick-text"><b lang="en">${esc(title)}</b><small>${esc(sub)}</small></span>
    <span class="pick-count">${bn(count)}${acc === null ? '' : `<small>${bn(acc)}%</small>`}</span>
  </label>`;
}

function seg(name, values, current, label = v => v) {
  return `<div class="seg" role="radiogroup">${values
    .map(v => `<label><input type="radio" name="${name}" value="${esc(v)}" ${String(v) === String(current) ? 'checked' : ''}><span>${label(v)}</span></label>`)
    .join('')}</div>`;
}

export function render([mode = 'fun', topic = 'all']) {
  if (!MODE_INFO[mode]) mode = 'fun';
  const info = MODE_INFO[mode];
  const mistakes = mistakeIds().length;
  if (topic === 'mistakes' && !mistakes) topic = 'all';
  if (topic !== 'all' && topic !== 'mistakes' && !TOPICS.some(t => t.id === topic)) topic = 'all';
  const p = state.player || {};
  const prefs = state.prefs?.[mode] || {};
  const count = prefs.count || OPTIONS[mode].default;

  const settings = mode === 'fun'
    ? `<div class="field"><span class="label">প্রতি প্রশ্নে সময়</span>${seg('perQuestion', [20, 30], prefs.perQuestion || 30, v => `${bn(v)} সেকেন্ড`)}</div>`
    : mode === 'exam'
      ? `<div class="field"><span class="label">সময়ের চাপ</span>${seg('pace', Object.keys(EXAM_PACE), prefs.pace || 'admission', v => (v === 'admission' ? `ভর্তি পরীক্ষার গতি (${bn(EXAM_PACE[v])} সে/প্রশ্ন)` : `আরামে (${bn(EXAM_PACE[v])} সে/প্রশ্ন)`))}</div>
         <div class="field"><span class="label">Negative marking</span>${seg('negative', [0, 0.25], prefs.negative ?? 0, v => (v ? 'প্রতি ভুলে −০.২৫' : 'নেই'))}</div>`
      : '';

  const ranked = mode !== 'practice';
  return `<div class="container">
    ${pageHead(`${info.icon} ${info.label}`, info.bn, 'নতুন session', [[null, info.label]])}
    <nav class="mode-tabs" aria-label="Mode">${Object.entries(MODE_INFO)
      .map(([id, m]) => `<a href="#start/${id}/${esc(topic)}" class="${id === mode ? 'active' : ''} t-${m.color}" ${id === mode ? 'aria-current="page"' : ''}><span aria-hidden="true">${m.icon}</span>${esc(m.label)}</a>`)
      .join('')}</nav>
    <form class="setup" id="setup-form" data-mode="${mode}">
      <section class="setup-main">
        <h2 class="step"><span>১</span> Topic বেছে নাও</h2>
        <div class="picks">
          ${topicOption('all', 'সব topic (মিশ্র)', 'পুরো question bank থেকে', QUESTIONS.length, '🎲', topic === 'all')}
          ${mistakes ? topicOption('mistakes', 'আমার ভুলগুলো', 'আগে যেগুলো ভুল করেছ', mistakes, '🔁', topic === 'mistakes', '#d64545') : ''}
          ${TOPICS.map(t => topicOption(t.id, t.title, t.bn, t.count, t.icon, topic === t.id, t.color)).join('')}
        </div>
      </section>
      <aside class="setup-side">
        <div class="card sticky">
          <h2 class="step"><span>২</span> Setting</h2>
          <div class="field"><span class="label">কয়টি প্রশ্ন?</span>${seg('count', OPTIONS[mode].counts, count, v => bn(v))}</div>
          ${settings}
          ${ranked ? `<div class="field">
            <label class="label" for="player-name">নাম <small class="muted">(leaderboard-এর জন্য, ঐচ্ছিক)</small></label>
            <input id="player-name" name="name" maxlength="60" autocomplete="name" placeholder="তোমার নাম" value="${esc(p.name || '')}">
            <div class="avatars" role="radiogroup" aria-label="Avatar">${AVATARS.map(a => `<label><input type="radio" name="avatar" value="${a}" ${(p.avatar || '🚂') === a ? 'checked' : ''}><span>${a}</span></label>`).join('')}</div>
          </div>` : ''}
          <ul class="mode-points">${MODE_TEXT[mode].map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <button class="btn big block t-${info.color}" type="submit">${info.icon} শুরু করো</button>
        </div>
      </aside>
      <button class="btn big start-fab t-${info.color}" type="submit" aria-hidden="true" tabindex="-1">${info.icon} শুরু করো →</button>
    </form>
  </div>`;
}

async function ensureProfile(name, avatar) {
  if (!name) return null;
  const p = state.player;
  if (p?.playerId && p.name === name && p.avatar === avatar) return p;
  try {
    const saved = await Promise.race([
      saveProfile({ playerId: p?.playerId, name, avatar }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
    ]);
    state.player = { playerId: saved.playerId, name: saved.name, avatar: saved.avatar };
    save();
    return state.player;
  } catch {
    toast('⚠️ Server-এ নাম save হয়নি—এবারের score শুধু এই device-এ থাকবে।');
    if (p?.playerId) return p; // keep the existing identity; "retry save" works later
    state.player = { name, avatar }; // remember the name for next time
    save();
    return null;
  }
}

export function mount() {
  const form = $('#setup-form');
  if (!form) return;
  form.addEventListener('change', e => {
    if (e.target.name !== 'topic') return;
    history.replaceState(null, '', `#start/${form.dataset.mode}/${e.target.value}`);
    form.querySelectorAll('.pick').forEach(l => l.classList.toggle('is-checked', l.contains(e.target)));
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const mode = form.dataset.mode;
    const btn = e.submitter || form.querySelector('button[type=submit]');
    const name = String(fd.get('name') || '').replace(/\s+/g, ' ').trim();
    if (name && name.length < 2) return toast('নাম কমপক্ষে ২ অক্ষরের হতে হবে।');
    const settings = {
      perQuestion: Number(fd.get('perQuestion')) || undefined,
      pace: fd.get('pace') || undefined,
      negative: fd.get('negative') !== null ? Number(fd.get('negative')) : undefined,
    };
    const count = Number(fd.get('count'));
    state.prefs = { ...state.prefs, [mode]: { ...settings, count } };
    btn.disabled = true;
    btn.textContent = 'প্রস্তুত হচ্ছে…';
    const player = mode === 'practice' ? null : await ensureProfile(name, String(fd.get('avatar') || '🚂'));
    btn.disabled = false;
    const topic = String(fd.get('topic') || 'all');
    const ok = startSession({ mode, topic, count, settings, player, kind: topic === 'mistakes' ? 'mistakes' : 'topic' });
    if (!ok) btn.textContent = 'আবার চেষ্টা করো';
  });
}
