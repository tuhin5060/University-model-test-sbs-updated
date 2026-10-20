// My progress: stats, topic accuracy, mistake bank, history, backup.

import { TOPICS } from '../../../data/questions/index.js';
import { UNIVERSITIES } from '../../../data/universities.js';
import { esc, bn, bnDate, duration, toast } from '../lib/dom.js';
import { state, storageOK, mistakeIds, dailyStreak, replaceState, resetState, validBackup } from '../lib/store.js';
import { pageHead, MODE_INFO, topicAccuracy, empty } from '../components.js';

export function render() {
  const h = state.history;
  const answered = Object.values(state.stats).reduce((n, s) => n + s.seen, 0);
  const correct = Object.values(state.stats).reduce((n, s) => n + s.correct, 0);
  const acc = answered ? Math.round((correct / answered) * 100) : 0;
  const mistakes = mistakeIds().length;
  const saved = state.saved.filter(k => k.startsWith('u:')).map(k => UNIVERSITIES.find(u => u.id === k.slice(2))).filter(Boolean);
  const name = state.player?.name;

  return `<div class="container">
    ${pageHead(name ? `${name}-এর অগ্রগতি` : 'আমার অগ্রগতি', 'তোমার সব practice, ভুল আর উন্নতি—এই browser-এ save থাকে।', 'MY PROGRESS')}
    ${storageOK ? '' : '<p class="notice warn">⚠️ Browser storage কাজ করছে না (private mode?)। Backup download করে রাখো।</p>'}
    <div class="stat-grid">
      <div class="stat"><b>${bn(h.length)}</b><small>মোট session</small></div>
      <div class="stat"><b>${bn(answered)}</b><small>প্রশ্নের উত্তর</small></div>
      <div class="stat"><b>${bn(acc)}%</b><small>গড় accuracy</small></div>
      <div class="stat"><b>🔥 ${bn(dailyStreak())}</b><small>দৈনিক streak (সেরা ${bn(state.daily.best || 0)})</small></div>
    </div>

    <section class="section">
      <div class="section-head"><div><h2>🔁 আমার ভুলগুলো</h2><p>ভুল করা প্রশ্ন এখানে জমা হয়; পরপর দুবার ঠিক করলে সরে যায়।</p></div></div>
      ${mistakes
        ? `<div class="card mistake-card"><b class="big-num">${bn(mistakes)}</b><span>টি প্রশ্ন আবার দেখার অপেক্ষায়</span><a class="btn" href="#start/practice/mistakes">Practice শুরু →</a><a class="btn ghost" href="#start/fun/mistakes">🎮 Fun mode-এ</a></div>`
        : empty('এখনো কোনো ভুল জমা নেই। একটা test দিয়ে দেখো!', '<a class="btn" href="#start/fun">🎮 Fun Quiz</a>')}
    </section>

    <section class="section">
      <div class="section-head"><div><h2>📊 Topic অনুযায়ী দক্ষতা</h2><p>কম accuracy-র topic আগে practice করো।</p></div></div>
      <div class="bars card">${TOPICS.map(t => {
        const a = topicAccuracy(t.id);
        const s = state.stats[t.id];
        return `<div class="bar-row"><span lang="en">${esc(t.icon)} ${esc(t.title)}</span><span class="meter ${a === null ? 'none' : ''}"><i style="width:${a || 0}%"></i></span><b>${a === null ? '—' : `${bn(a)}%`}</b>${s ? `<small class="muted">${bn(s.seen)}টি</small>` : `<a class="small text-link" href="#start/practice/${esc(t.id)}">শুরু</a>`}</div>`;
      }).join('')}</div>
    </section>

    <section class="section">
      <div class="section-head"><h2>🕘 সাম্প্রতিক ফলাফল</h2></div>
      ${h.length ? `<div class="history">${h.slice(0, 20).map(x => {
        const m = MODE_INFO[x.mode] || MODE_INFO.practice;
        return `<a class="history-row" href="#result/${esc(x.id)}"><span class="h-icon" aria-hidden="true">${m.icon}</span><span><b>${esc(x.title)}</b><small>${esc(m.label)} · ${bnDate(x.finished)} · ${duration(x.timeSec)}</small></span><span class="h-score">${x.mode === 'fun' ? `${bn(x.score)} pts` : `${bn(x.correct)}/${bn(x.total)}`}${x.saved === 'saved' ? ' <small title="Leaderboard-এ save">🏆</small>' : ''}</span></a>`;
      }).join('')}</div>` : empty('প্রথম test শেষ করলে এখানে দেখাবে।')}
    </section>

    ${saved.length ? `<section class="section"><div class="section-head"><h2>★ পছন্দের বিশ্ববিদ্যালয়</h2></div><div class="chips">${saved.map(u => `<a class="chip" href="#university/${esc(u.id)}">${esc(u.short)} · ${esc(u.name)}</a>`).join('')}</div></section>` : ''}

    <section class="section">
      <div class="section-head"><div><h2>💾 Backup ও privacy</h2><p>অগ্রগতি শুধু এই browser-এ থাকে। অন্য phone/computer-এ নিতে backup file ব্যবহার করো। Leaderboard-এ শুধু নাম, avatar ও score যায়—কোনো password বা phone number নয়।</p></div></div>
      <div class="actions">
        <button class="btn ghost" data-action="export">⬇️ Backup download</button>
        <label class="btn ghost" for="import-file">⬆️ Backup import</label><input id="import-file" type="file" accept=".json,application/json" hidden>
        <button class="btn danger" data-action="clear">🗑️ সব মুছে ফেলো</button>
      </div>
    </section>
  </div>`;
}

export function onAction(action) {
  if (action === 'export') {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ ...state, session: null }, null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `campus-pothe-backup-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else if (action === 'clear') {
    if (confirm('সব ফলাফল, ভুলের তালিকা ও অগ্রগতি মুছে যাবে। নিশ্চিত?')) {
      resetState();
      document.getElementById('main').innerHTML = render();
      toast('মুছে ফেলা হয়েছে');
    }
  }
}

export async function onChange(el) {
  if (el.id !== 'import-file') return;
  const f = el.files[0];
  el.value = '';
  if (!f) return;
  try {
    if (f.size > 3_000_000) throw new Error('size');
    const data = JSON.parse(await f.text());
    if (!validBackup(data)) throw new Error('format');
    if (!confirm('এই browser-এর অগ্রগতি backup দিয়ে বদলে দেবে?')) return;
    replaceState(data);
    document.getElementById('main').innerHTML = render();
    toast('✅ Backup import হয়েছে');
  } catch {
    toast('⚠️ এটি সঠিক “ক্যাম্পাস পথে” backup file নয়।');
  }
}
