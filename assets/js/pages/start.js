// Setup screen for a new Fun Quiz / Model Test.
// Order on every screen: 1 name → 2 topic → 3 number of questions → one start button.
// Timer and negative marking are fixed (see shared/scoring.js), so there is nothing else to pick.

import { TOPICS, QUESTIONS, GROUPS } from '../../../data/questions/index.js';
import { AVATARS } from '../../../data/site.js';
import { esc, bn, $, toast } from '../lib/dom.js';
import { state, save, mistakeIds } from '../lib/store.js';
import { saveProfile } from '../lib/api.js';
import { playerFrom, syncCloud } from '../lib/cloud.js';
import { FUN_LIMIT, EXAM_SECONDS, EXAM_NEGATIVE } from '../shared/scoring.js';
import { MODE_INFO, pageHead, topicAccuracy, topicTitle } from '../components.js';
import { startSession } from '../quiz.js';

const MODES = ['fun', 'exam'];
const COUNTS = { fun: [10, 15, 20], exam: [10, 20, 30, 50] };
const DEFAULT_COUNT = { fun: 10, exam: 20 };
const RULES = {
  fun: `প্রতি প্রশ্নে ${bn(FUN_LIMIT)} সেকেন্ড · দ্রুত ঠিক উত্তরে বেশি points · 50:50 ও Freeze lifeline`,
  exam: `প্রতি প্রশ্নে ${bn(EXAM_SECONDS)} সেকেন্ড · প্রতি ভুল উত্তরে −${bn(EXAM_NEGATIVE)} নম্বর · শেষে পুরো উত্তরপত্র`,
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

const summary = (mode, topic, count) => `${MODE_INFO[mode].icon} ${topicTitle(topic)} · ${bn(count)}টি প্রশ্ন`;

export function render([mode = 'fun', topic = 'all']) {
  if (!MODES.includes(mode)) mode = 'fun';
  const info = MODE_INFO[mode];
  const mistakes = mistakeIds().length;
  if (topic === 'mistakes' && !mistakes) topic = 'all';
  if (topic !== 'all' && topic !== 'mistakes' && !GROUPS[topic] && !TOPICS.some(t => t.id === topic)) topic = 'all';
  const p = state.player || {};
  const prefs = state.prefs?.[mode] || {};
  const count = COUNTS[mode].includes(prefs.count) ? prefs.count : DEFAULT_COUNT[mode];

  return `<div class="container">
    ${pageHead(`${info.icon} ${info.label}`, RULES[mode], '', [[null, info.label]])}
    <nav class="mode-tabs" aria-label="Mode">${MODES
      .map(id => `<a href="#start/${id}/${esc(topic)}" class="${id === mode ? 'active' : ''} t-${MODE_INFO[id].color}" ${id === mode ? 'aria-current="page"' : ''}><span aria-hidden="true">${MODE_INFO[id].icon}</span>${esc(MODE_INFO[id].label)}</a>`)
      .join('')}</nav>
    <form class="setup" id="setup-form" data-mode="${mode}" novalidate>
      <section class="setup-name card">
        <h2 class="step"><span>১</span> তোমার নাম ও Roll</h2>
        <label class="label" for="player-name">পুরো নাম</label>
        <input id="player-name" name="name" maxlength="60" autocomplete="name" placeholder="যেমন: Rahim Uddin" value="${esc(p.name || '')}" required>
        <p class="field-error" id="name-error" hidden>Leaderboard-এর জন্য তোমার পুরো নাম লেখো (কমপক্ষে ২ অক্ষর)।</p>
        <label class="label" for="player-roll">Roll <small class="muted">(প্রথমবার খালি রাখলে নতুন roll নিজে থেকেই পাবে)</small></label>
        <input id="player-roll" name="roll" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="যেমন: 007" value="${p.roll ? rollText(p.roll) : ''}">
        <p class="hint">🔑 নিজের roll ব্যবহার করো, প্রতিবার একই roll দিয়ো। অন্য phone-এ একই নাম + roll দিলে তোমার সব score ফিরে পাবে।</p>
        <p class="field-error" id="roll-error" hidden></p>
        <p class="tag-preview" id="tag-preview">${tagPreview(p.name, p.roll)}</p>
        <div class="avatars" role="radiogroup" aria-label="Avatar">${AVATARS.map(a => `<label><input type="radio" name="avatar" value="${a}" ${(p.avatar || '🚂') === a ? 'checked' : ''}><span>${a}</span></label>`).join('')}</div>
      </section>
      <section class="setup-topic">
        <h2 class="step"><span>২</span> Topic বেছে নাও</h2>
        <div class="picks">
          ${topicOption('all', 'সব topic (মিশ্র)', 'পুরো question bank থেকে', QUESTIONS.length, '🎲', topic === 'all')}
          ${mistakes ? topicOption('mistakes', 'আমার ভুলগুলো', 'আগে যেগুলো ভুল করেছ (leaderboard-এ যায় না)', mistakes, '🔁', topic === 'mistakes', '#d64545') : ''}
        </div>
        ${Object.values(GROUPS).map(g => {
          const list = TOPICS.filter(t => t.group === g.id);
          if (!list.length) return '';
          const total = list.reduce((n, t) => n + t.count, 0);
          return `<h3 class="pick-group">${g.icon} ${esc(g.short)}</h3>
          <div class="picks">
            ${topicOption(g.id, g.title, g.bn, total, g.icon, topic === g.id)}
            ${list.map(t => topicOption(t.id, t.title, t.bn, t.count, t.icon, topic === t.id, t.color)).join('')}
          </div>`;
        }).join('')}
      </section>
      <section class="setup-count card">
        <h2 class="step"><span>৩</span> কয়টি প্রশ্ন?</h2>
        ${seg('count', COUNTS[mode], count, v => bn(v))}
      </section>
      <div class="start-bar">
        <span class="start-summary" id="start-summary">${esc(summary(mode, topic, count))}</span>
        <button class="btn big t-${info.color}" type="submit">শুরু করো →</button>
      </div>
    </form>
  </div>`;
}

const rollText = n => String(n).padStart(3, '0');
const cleanRoll = v => String(v || '').replace(/\D/g, '').slice(0, 5);
function tagPreview(name, roll) {
  const n = String(name || '').replace(/\s+/g, ' ').trim();
  if (n.length < 2) return '';
  return `Leaderboard-এ দেখাবে: <b>${esc(n)}.${roll ? rollText(roll) : '<span class="muted">নতুন roll</span>'}</b>`;
}

/**
 * Save name + roll on the server. Returns the player, null (offline: play
 * without the leaderboard) or false (fix the form first, e.g. roll taken).
 */
async function ensureProfile({ name, roll, avatar }, showRollError) {
  const p = state.player;
  if (p?.playerId && p.roll && p.name === name && rollText(p.roll) === (roll && rollText(roll)) && p.avatar === avatar) return p;
  try {
    const res = await Promise.race([
      saveProfile({ playerId: p?.playerId, name, roll, avatar }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
    ]);
    state.player = playerFrom(res.player);
    save();
    if (res.created) toast(`🎉 তোমার roll ${rollText(res.player.roll)}—পরের বার একই নাম আর roll দিয়ো।`);
    if (res.restored) {
      toast('✅ আবার স্বাগতম! তোমার আগের score ও অগ্রগতি আনা হলো।');
      syncCloud({ profile: false });
    }
    return state.player;
  } catch (err) {
    if (err.status === 409 || err.status === 400) {
      showRollError(err.body?.error || err.message, err.body?.suggest);
      return false;
    }
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
  const mode = form.dataset.mode;
  const nameInput = $('#player-name');
  const nameError = $('#name-error');
  const cleanName = () => String(nameInput.value || '').replace(/\s+/g, ' ').trim();
  const refresh = () => {
    const fd = new FormData(form);
    $('#start-summary').textContent = summary(mode, String(fd.get('topic') || 'all'), Number(fd.get('count')));
  };
  form.addEventListener('change', e => {
    if (e.target.name === 'topic') {
      history.replaceState(null, '', `#start/${mode}/${e.target.value}`);
      form.querySelectorAll('.pick').forEach(l => l.classList.toggle('is-checked', l.contains(e.target)));
    }
    refresh();
  });
  const rollInput = $('#player-roll');
  const rollError = $('#roll-error');
  const preview = () => { $('#tag-preview').innerHTML = tagPreview(nameInput.value, cleanRoll(rollInput.value)); };
  const showRollError = (message, suggest) => {
    rollError.innerHTML = `${esc(message)}${suggest ? ` <button type="button" class="link-btn" data-roll="${suggest}">Roll ${rollText(suggest)} নাও</button>` : ''}`;
    rollError.hidden = false;
    rollInput.setAttribute('aria-invalid', 'true');
    rollInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  rollError.addEventListener('click', e => {
    const b = e.target.closest('[data-roll]');
    if (!b) return;
    rollInput.value = rollText(b.dataset.roll);
    rollError.hidden = true;
    rollInput.removeAttribute('aria-invalid');
    preview();
  });
  nameInput.addEventListener('input', () => {
    if (cleanName().length >= 2) { nameError.hidden = true; nameInput.removeAttribute('aria-invalid'); }
    preview();
  });
  rollInput.addEventListener('input', () => {
    rollError.hidden = true;
    rollInput.removeAttribute('aria-invalid');
    preview();
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const btn = form.querySelector('button[type=submit]');
    const name = cleanName();
    if (name.length < 2) {
      nameError.hidden = false;
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInput.focus({ preventScroll: true });
      return;
    }
    const count = Number(fd.get('count'));
    state.prefs = { ...state.prefs, [mode]: { count } };
    btn.disabled = true;
    btn.textContent = 'প্রস্তুত হচ্ছে…';
    const player = await ensureProfile({ name, roll: cleanRoll(fd.get('roll')), avatar: String(fd.get('avatar') || '🚂') }, showRollError);
    btn.disabled = false;
    btn.textContent = 'শুরু করো →';
    if (player === false) return;
    const topic = String(fd.get('topic') || 'all');
    const ok = startSession({ mode, topic, count, settings: {}, player, kind: topic === 'mistakes' ? 'mistakes' : 'topic' });
    if (!ok) btn.textContent = 'আবার চেষ্টা করো';
  });
}
