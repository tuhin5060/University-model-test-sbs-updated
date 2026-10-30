// Admin dashboard (#admin). Loaded only when opened (main.js imports it on demand), so it
// never slows the other pages. Everything comes from POST /api/admin, which checks the
// password (ADMIN_PASSWORD, set only in Vercel) on every request. The password typed here is
// kept only for this tab (sessionStorage) and is never part of the site's code or repository.
//
// Tabs: 📊 সারাংশ · 🟢 ব্যবহার · 👩‍🎓 শিক্ষার্থী · 📅 Daily Quiz · 📢 Notice ও Notification · 💾 Data
import { esc, bn, $, toast, ask } from '../lib/dom.js';
import { pageHead } from '../components.js';

const KEY = 'campus-admin';
let days = 7;
let tab = 'overview';
let dailyDay = '';
let search = '';
let usageDay = '';
let usageRoll = '';
let liveTimer = null;

const pass = {
  get: () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } },
  set: v => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch {} },
};
const time = iso => (iso ? new Date(iso).toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit' }) : '—');
const when = iso => (iso ? new Date(iso).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
const dayLabel = ymd => new Date(`${ymd}T12:00:00+06:00`).toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'short', day: 'numeric', month: 'short' });
const mins = m => (m >= 60 ? `${bn(Math.floor(m / 60))} ঘ ${bn(m % 60)} মি` : `${bn(m)} মি`);
const roll = r => String(r).padStart(3, '0');
const who = r => (r.name ? `${esc(r.name)} <small class="muted">.${roll(r.roll)}</small>` : '<span class="muted">নাম ছাড়া visitor</span>');
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const TABS = [
  ['overview', '📊', 'সারাংশ'],
  ['usage', '🟢', 'ব্যবহার'],
  ['students', '👩‍🎓', 'শিক্ষার্থী'],
  ['daily', '📅', 'Daily Quiz'],
  ['notice', '📢', 'Notice'],
  ['data', '💾', 'Data'],
];

/** POST to an admin endpoint with the saved password. 403/429 → back to the login form. */
async function api(body, url = '/api/admin') {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass.get(), ...body }),
    });
  } catch {
    throw Object.assign(new Error('Server-এ পৌঁছানো গেল না—নেট দেখে আবার চেষ্টা করো।'), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw Object.assign(new Error(data.error || `Server error (${res.status})`), { status: res.status });
  return data;
}

export function render() {
  return `<div class="container">
    ${pageHead('🔐 Admin', 'Site-এর ব্যবহার, শিক্ষার্থী, Daily Quiz আর notice—শুধু admin-এর জন্য।', 'ADMIN')}
    <div id="admin-box">${pass.get() ? shell() : loginForm()}</div>
  </div>`;
}

function loginForm(error = '') {
  return `<form id="admin-login" class="card admin-login">
    <label class="label" for="admin-pass">Admin password</label>
    <input id="admin-pass" type="password" autocomplete="current-password" required>
    ${error ? `<p class="error">${esc(error)}</p>` : ''}
    <button class="btn" type="submit">ঢোকো</button>
    <p class="muted small">Password শুধু Vercel-এর settings-এ থাকে; এখানে লিখলে শুধু এই tab-এ মনে থাকে, tab বন্ধ করলে মুছে যায়।</p>
  </form>`;
}

function shell() {
  return `<div class="adm-top">
      <nav class="adm-tabs" aria-label="Admin">${TABS.map(([id, icon, label]) => `<button type="button" data-adm-tab="${id}" aria-selected="${id === tab}"><span aria-hidden="true">${icon}</span>${label}</button>`).join('')}</nav>
      <div class="adm-actions"><button class="btn small ghost" type="button" data-admin-refresh>🔄</button><button class="btn small ghost" type="button" data-admin-out>বের হও</button></div>
    </div>
    <div id="adm-view"><div class="skeleton"></div><div class="skeleton"></div></div>`;
}

export function mount() {
  const box = $('#admin-box');
  if (pass.get()) return wireShell(box);
  wireLogin(box);
}

function wireLogin(box) {
  $('#admin-login', box)?.addEventListener('submit', e => {
    e.preventDefault();
    pass.set($('#admin-pass', box).value);
    box.innerHTML = shell();
    wireShell(box);
  });
  $('#admin-pass', box)?.focus();
}

function wireShell(box) {
  box.querySelectorAll('[data-adm-tab]').forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.admTab;
    box.querySelectorAll('[data-adm-tab]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    show(box);
  }));
  $('[data-admin-refresh]', box).addEventListener('click', () => show(box));
  $('[data-admin-out]', box).addEventListener('click', () => { pass.set(''); box.innerHTML = loginForm(); wireLogin(box); });
  show(box);
}

const VIEWS = { overview, usage, students, daily, notice, data };

async function show(box) {
  const view = $('#adm-view', box);
  if (!view) return;
  view.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
  clearInterval(liveTimer);
  view.onclick = null;
  try {
    await VIEWS[tab](view);
  } catch (err) {
    if (err.status === 403 || err.status === 429) {
      pass.set('');
      box.innerHTML = loginForm(err.message);
      return wireLogin(box);
    }
    view.innerHTML = `<p class="notice">${esc(err.message)} <button class="btn small" type="button" data-retry>আবার চেষ্টা করো</button></p>`;
    $('[data-retry]', view).addEventListener('click', () => show(box));
  }
}

// ---- 📊 overview ------------------------------------------------------------------

function bars(rows) {
  const max = Math.max(1, ...rows.map(r => r.visitors));
  return `<div class="adm-chart">${rows.map(r => `<div class="adm-day">
      <span class="adm-date">${esc(dayLabel(r.day))}</span>
      <span class="adm-bar"><i style="width:${Math.max(r.visitors ? 3 : 0, Math.round((r.visitors / max) * 100))}%"></i></span>
      <span class="adm-nums"><b>${bn(r.visitors)}</b> visitor · ${bn(r.students)} নাম · ${bn(r.tests)} test · ${bn(r.daily)} daily${r.signups ? ` · <em>+${bn(r.signups)} নতুন</em>` : ''}</span>
    </div>`).join('')}</div>`;
}

async function overview(view) {
  const d = await api({ days });
  const s = d.summary;
  const card = (value, label, tone = '') => `<div class="adm-stat ${tone}"><b>${value}</b><small>${label}</small></div>`;
  view.innerHTML = `<div class="seg adm-range" role="group" aria-label="সময়">${[1, 7, 30].map(n => `<button type="button" data-days="${n}" aria-selected="${n === d.days}">${n === 1 ? 'আজ' : `${bn(n)} দিন`}</button>`).join('')}</div>
    <div class="adm-stats">
      ${card(`🟢 ${bn(s.online)}`, 'এখন অনলাইনে', 'live')}
      ${card(bn(s.visitors_today), 'আজ ভিজিট (browser)')}
      ${card(bn(s.students_today), 'আজ নাম দিয়ে ব্যবহার')}
      ${card(bn(s.signups_today), 'আজ নতুন নিবন্ধন')}
      ${card(bn(s.tests_today), 'আজ test')}
      ${card(bn(s.daily_today), 'আজ Daily Quiz')}
      ${card(mins(s.minutes_today), 'আজ মোট ব্যবহার')}
      ${card(bn(s.students_total), 'মোট শিক্ষার্থী')}
      ${card(bn(s.tests_total), 'মোট test')}
      ${card(bn(s.push_subs), '🔔 Notification চালু')}
      ${card(bn(s.threads_total), 'কমিউনিটি প্রশ্ন')}
    </div>
    <h2 class="h3">📈 দিন অনুযায়ী</h2>
    ${bars(d.daily)}
    <h2 class="h3">👩‍🎓 সবচেয়ে বেশি ব্যবহার (${d.days === 1 ? 'আজ' : `শেষ ${bn(d.days)} দিন`})</h2>
    ${d.students.length ? `<div class="table-wrap"><table class="dir admin-table">
      <thead><tr><th>নাম · Roll</th><th>কলেজ</th><th>আজ</th><th>মোট সময়</th><th>দিন / বার</th><th>Test</th><th>শেষ দেখা</th></tr></thead>
      <tbody>${d.students.map(r => `<tr><td>${who(r)}</td><td>${esc(r.college || '—')}</td><td>${r.minutes_today ? mins(r.minutes_today) : '—'}</td><td><b>${mins(r.minutes)}</b></td><td>${bn(r.active_days)} দিন · ${bn(r.sessions)} বার</td><td>${bn(r.tests)}</td><td>${when(r.last_at)}</td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="empty">এই সময়ে নাম দিয়ে কেউ ব্যবহার করেনি।</p>'}
    <details class="adm-more"><summary>🕒 আজকের প্রতিটি visit (কে কয়টা থেকে কয়টা) · ${bn(d.sessions.length)}টি</summary>
      ${d.sessions.length ? `<div class="table-wrap"><table class="dir admin-table">
        <thead><tr><th>নাম</th><th>কখন থেকে</th><th>কখন পর্যন্ত</th><th>সময়</th></tr></thead>
        <tbody>${d.sessions.map(r => `<tr><td>${who(r)}</td><td>${time(r.from)}</td><td>${time(r.to)}</td><td>${mins(r.minutes)}</td></tr>`).join('')}</tbody>
      </table></div>` : '<p class="empty">আজ এখনো কেউ ব্যবহার করেনি।</p>'}
    </details>
    <p class="muted small">সময় গোনা হয় site খোলা ও স্ক্রিনে থাকা অবস্থায় (প্রতি মিনিটে একবার)। ৫ মিনিটের বেশি বিরতি হলে নতুন visit। নাম ছাড়া visitor-দের নাম জানা যায় না। ব্যবহারের তথ্য ৬০ দিন রাখা হয়।</p>`;
  view.querySelectorAll('[data-days]').forEach(b => b.addEventListener('click', () => { days = Number(b.dataset.days); overview(view).catch(e => toast(e.message)); }));
}

// ---- 🟢 usage: online now, who used how long on a day, one student's days ----------

const rollBtn = r => (r.name ? `<button type="button" class="link-btn adm-who" data-roll="${roll(r.roll)}">${esc(r.name)} <small class="muted">.${roll(r.roll)}</small></button>` : '<span class="muted">নাম ছাড়া visitor</span>');

function onlineList(list) {
  if (!list.length) return '<p class="empty">এই মুহূর্তে কেউ অনলাইনে নেই।</p>';
  const named = list.filter(o => o.name).length;
  return `<p class="muted small">${bn(list.length)} জন · ${bn(named)} জন নাম দিয়ে · ${bn(list.length - named)} জন নাম ছাড়া</p>
    <ul class="adm-live">${list.map(o => `<li>
      <span class="adm-dot" aria-hidden="true"></span>
      <span class="adm-live-who">${rollBtn(o)}${o.college ? `<small>🏫 ${esc(o.college)}</small>` : ''}</span>
      <span class="adm-live-time"><b>${mins(o.minutes)}</b><small>${o.from ? `${time(o.from)} থেকে` : ''}${o.minutes_today > o.minutes ? ` · আজ মোট ${mins(o.minutes_today)}` : ''}</small></span>
    </li>`).join('')}</ul>`;
}

function studentBox(st) {
  if (st === undefined) return '';
  if (!st) return `<div class="card adm-student"><p class="empty">Roll ${esc(usageRoll)}-এর কাউকে পাওয়া যায়নি।</p></div>`;
  const max = Math.max(1, ...st.days.map(x => x.minutes));
  return `<div class="card adm-student" id="adm-student">
    <div class="adm-student-head"><div><b>${esc(st.name)}</b> <span class="adm-roll">.${roll(st.roll)}</span><small class="muted">🏫 ${esc(st.college || 'কলেজ দেয়নি')} · যোগ ${when(st.created_at)}</small></div>
      <button type="button" class="btn small ghost" data-close-student>✕</button></div>
    <p>মোট ব্যবহার (৬০ দিনে): <b>${mins(st.minutes)}</b> · ${bn(st.days.length)} দিন · ${bn(st.visits.length)} বার</p>
    <h3 class="h3">📅 দিন অনুযায়ী</h3>
    ${st.days.length ? `<div class="adm-chart">${st.days.map(x => `<div class="adm-day">
      <span class="adm-date">${esc(dayLabel(x.day))}</span>
      <span class="adm-bar"><i style="width:${Math.max(3, Math.round((x.minutes / max) * 100))}%"></i></span>
      <span class="adm-nums"><b>${mins(x.minutes)}</b> · ${bn(x.sessions)} বার</span></div>`).join('')}</div>` : '<p class="empty">কোনো ব্যবহার নেই।</p>'}
    <details class="adm-more"><summary>🕒 প্রতিটি visit (কখন থেকে কখন) · ${bn(st.visits.length)}টি</summary>
      <div class="table-wrap"><table class="dir admin-table"><thead><tr><th>দিন</th><th>থেকে</th><th>পর্যন্ত</th><th>সময়</th></tr></thead>
      <tbody>${st.visits.map(v => `<tr><td>${esc(dayLabel(new Date(v.from).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })))}</td><td>${time(v.from)}</td><td>${time(v.to)}</td><td>${mins(v.minutes)}</td></tr>`).join('')}</tbody></table></div>
    </details>
  </div>`;
}

async function usage(view) {
  const d = await api({ action: 'usage', day: usageDay, roll: usageRoll });
  const total = d.people.reduce((n, r) => n + r.minutes, 0) + d.anon.minutes;
  const today = d.days[0]?.day;
  view.innerHTML = `${studentBox(usageRoll ? d.student : undefined)}
    <section class="card adm-online">
      <div class="adm-online-head"><h2 class="h3">🟢 এখন অনলাইনে</h2><small class="muted" data-live-note>প্রতি ৩০ সেকেন্ডে নিজে থেকে আপডেট হয়</small></div>
      <div id="adm-online">${onlineList(d.online)}</div>
    </section>
    <h2 class="h3">⏱️ কে কতক্ষণ ব্যবহার করেছে</h2>
    <div class="field"><label class="label" for="adm-uday">দিন</label>
      <select id="adm-uday">${(d.days.some(x => x.day === d.day) ? d.days : [{ day: d.day, students: 0, visitors: 0, minutes: 0 }, ...d.days]).map(x => `<option value="${x.day}" ${x.day === d.day ? 'selected' : ''}>${x.day === today ? 'আজ · ' : ''}${esc(dayLabel(x.day))} · ${bn(x.visitors)} visitor · ${mins(x.minutes)}</option>`).join('')}</select></div>
    <div class="adm-stats">
      <div class="adm-stat"><b>${bn(d.people.length)}</b><small>নাম দিয়ে ব্যবহার</small></div>
      <div class="adm-stat"><b>${bn(d.anon.visitors)}</b><small>নাম ছাড়া visitor</small></div>
      <div class="adm-stat"><b>${mins(total)}</b><small>সবার মোট সময়</small></div>
    </div>
    ${d.people.length ? `<div class="table-wrap"><table class="dir admin-table">
      <thead><tr><th>#</th><th>নাম · Roll</th><th>সময়</th><th>বার</th><th>প্রথম–শেষ</th><th>কলেজ</th></tr></thead>
      <tbody>${d.people.map((r, i) => `<tr><td>${bn(i + 1)}</td><td>${rollBtn(r)}</td><td><b>${mins(r.minutes)}</b></td><td>${bn(r.sessions)}</td><td>${time(r.first_at)} – ${time(r.last_at)}</td><td>${esc(r.college || '—')}</td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="empty">এই দিনে নাম দিয়ে কেউ ব্যবহার করেনি।</p>'}
    <p class="muted small">নামে চাপ দিলে ওই শিক্ষার্থী কোন দিন কতক্ষণ ব্যবহার করেছে আর প্রতিটি visit দেখাবে। সময় গোনা হয় site খোলা ও স্ক্রিনে থাকা অবস্থায় (প্রতি মিনিটে একবার); “অনলাইনে” মানে শেষ আড়াই মিনিটের মধ্যে সাড়া পাওয়া গেছে।</p>`;
  const open = r => { usageRoll = r; usage(view).then(() => $('#adm-student', view)?.scrollIntoView({ behavior: 'smooth', block: 'start' })).catch(e => toast(e.message)); };
  view.onclick = e => {
    const b = e.target.closest('[data-roll]');
    if (b) open(b.dataset.roll);
    if (e.target.closest('[data-close-student]')) { usageRoll = ''; $('#adm-student', view)?.remove(); }
  };
  $('#adm-uday', view).addEventListener('change', e => { usageDay = e.target.value; usage(view).catch(err => toast(err.message)); });
  // Keep "online now" fresh while this tab is open.
  clearInterval(liveTimer);
  liveTimer = setInterval(async () => {
    const box = $('#adm-online');
    if (!box || tab !== 'usage') return clearInterval(liveTimer);
    try { box.innerHTML = onlineList((await api({ action: 'usage', day: usageDay })).online); } catch { /* next try in 30 s */ }
  }, 30000);
}

// ---- 👩‍🎓 students -----------------------------------------------------------------

async function students(view) {
  view.innerHTML = `<form class="adm-search" id="adm-search">
      <input type="search" name="q" value="${esc(search)}" placeholder="নাম, roll (যেমন 007) বা কলেজ লিখে খোঁজো" aria-label="শিক্ষার্থী খোঁজো">
      <button class="btn small" type="submit">খোঁজো</button>
    </form>
    <div id="adm-students"><div class="skeleton"></div></div>`;
  const list = $('#adm-students', view);
  const run = async () => {
    list.innerHTML = '<div class="skeleton"></div>';
    const d = await api({ action: 'students', q: search });
    list.innerHTML = d.students.length
      ? `<p class="muted small">${search ? `“${esc(search)}”—` : 'সাম্প্রতিক '}${bn(d.students.length)} জন${d.students.length === 100 ? ' (প্রথম ১০০)' : ''}</p>
        <div class="adm-cards">${d.students.map(r => `<article class="adm-card">
          <header><b>${esc(r.name)}</b><span class="adm-roll">.${roll(r.roll)}</span></header>
          <p class="muted small">🏫 ${esc(r.college || 'কলেজ দেয়নি')}</p>
          <dl>
            <div><dt>Points</dt><dd>${bn(r.points)}</dd></div>
            <div><dt>Test</dt><dd>${bn(r.tests)}</dd></div>
            <div><dt>সঠিক</dt><dd>${bn(pct(r.correct, r.answered))}%</dd></div>
            <div><dt>Daily</dt><dd>${bn(r.daily_days)} দিন</dd></div>
            <div><dt>ব্যবহার</dt><dd>${mins(r.minutes)}</dd></div>
          </dl>
          <p class="muted small">যোগ দিয়েছে ${when(r.created_at)} · শেষ দেখা ${when(r.last_seen_at)}</p>
          <button type="button" class="btn small ghost" data-roll="${roll(r.roll)}">⏱️ কোন দিন কতক্ষণ</button>
        </article>`).join('')}</div>`
      : '<p class="empty">কাউকে পাওয়া যায়নি।</p>';
  };
  view.onclick = e => {
    const b = e.target.closest('[data-roll]');
    if (!b) return;
    usageRoll = b.dataset.roll;
    tab = 'usage';
    const box = view.closest('#admin-box');
    box.querySelectorAll('[data-adm-tab]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.admTab === 'usage')));
    show(box);
  };
  $('#adm-search', view).addEventListener('submit', e => {
    e.preventDefault();
    search = new FormData(e.target).get('q').trim();
    run().catch(err => { list.innerHTML = `<p class="notice">${esc(err.message)}</p>`; });
  });
  await run();
}

// ---- 📅 Daily Quiz ----------------------------------------------------------------

async function daily(view) {
  const d = await api({ action: 'daily', day: dailyDay });
  const avg = d.rows.length ? d.rows.reduce((n, r) => n + r.marks, 0) / d.rows.length : 0;
  view.innerHTML = `<div class="field"><label class="label" for="adm-day">দিন</label>
      <select id="adm-day">${d.days.map(x => `<option value="${x.day}" ${x.day === d.day ? 'selected' : ''}>${esc(dayLabel(x.day))} · ${bn(x.participants)} জন</option>`).join('')}</select></div>
    <div class="adm-stats">
      <div class="adm-stat"><b>${bn(d.rows.length)}</b><small>অংশ নিয়েছে</small></div>
      <div class="adm-stat"><b>${bn(Math.round(avg * 100) / 100)}</b><small>গড় নম্বর (২০-এ)</small></div>
      <div class="adm-stat"><b>${d.rows[0] ? bn(d.rows[0].marks) : '—'}</b><small>সর্বোচ্চ নম্বর</small></div>
    </div>
    <h2 class="h3">🏆 ফলাফল (পুরো নামসহ)</h2>
    ${d.rows.length ? `<div class="table-wrap"><table class="dir admin-table">
      <thead><tr><th>#</th><th>নাম · Roll</th><th>কলেজ</th><th>নম্বর</th><th>✅ / ❌</th><th>সময়</th><th>কখন</th></tr></thead>
      <tbody>${d.rows.map(r => `<tr><td>${bn(r.rank)}</td><td>${who(r)}</td><td>${esc(r.college || '—')}</td><td><b>${bn(r.marks)}</b>/${bn(r.total)}</td><td>${bn(r.correct)} / ${bn(r.wrong)}</td><td>${bn(Math.floor(r.time_sec / 60))}:${String(r.time_sec % 60).padStart(2, '0')}</td><td>${time(r.at)}</td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="empty">এই দিনে এখনো কেউ দেয়নি।</p>'}
    <details class="adm-more"><summary>📝 এই দিনের ${bn(d.questions.length)}টি প্রশ্ন ও উত্তর</summary>
      <ol class="adm-qs">${d.questions.map(q => `<li><span lang="en">${esc(q.q)}</span><small>✅ <b lang="en">${esc(q.answer)}</b> · 📌 ${esc(q.ref)} · ${esc(q.topic)}</small></li>`).join('')}</ol>
    </details>`;
  $('#adm-day', view).addEventListener('change', e => { dailyDay = e.target.value; daily(view).catch(err => toast(err.message)); });
}

// ---- 📢 Notice, reminder text and "send now" ---------------------------------------

async function notice(view) {
  const s = await api({ action: 'settings' });
  view.innerHTML = `<form class="card adm-form" id="adm-notice">
      <h2 class="h3">📢 Site notice</h2>
      <p class="muted small">চালু থাকলে প্রতিটি পাতার উপরে একটা হলুদ লাইন দেখাবে (যেমন পরীক্ষার খবর, নতুন topic)। কেউ ✕ চাপলে সে আর ওই notice দেখবে না; লেখা বদলালে আবার দেখবে।</p>
      <label class="adm-switch"><input type="checkbox" name="on" ${s.notice.on ? 'checked' : ''}> চালু</label>
      <label class="label" for="n-text">লেখা (২০০ অক্ষর পর্যন্ত)</label>
      <textarea id="n-text" name="text" maxlength="200" rows="2" placeholder="যেমন: কাল সকাল ১০টায় চবি A unit-এর ভর্তি পরীক্ষা—শুভকামনা!">${esc(s.notice.text)}</textarea>
      <label class="label" for="n-url">Link (না দিলেও চলবে)</label>
      <input id="n-url" name="url" value="${esc(s.notice.url)}" placeholder="#daily বা https://cu.ac.bd/…">
      <button class="btn" type="submit">Save করো</button>
    </form>
    <form class="card adm-form" id="adm-morning">
      <h2 class="h3">🌅 সকালের Daily Quiz reminder</h2>
      <p class="muted small">প্রতিদিন সকাল ৭–৮টার মধ্যে notification চালু থাকা সবাই পায়। নিচের লেখার শেষে গতকাল কতজন অংশ নিয়েছিল সেটা নিজে থেকেই যোগ হয়।</p>
      <label class="label" for="m-title">শিরোনাম</label>
      <input id="m-title" name="title" maxlength="80" value="${esc(s.morning.title)}">
      <label class="label" for="m-body">লেখা</label>
      <textarea id="m-body" name="body" maxlength="200" rows="2">${esc(s.morning.body)}</textarea>
      <button class="btn" type="submit">Save করো</button>
    </form>
    <form class="card adm-form" id="adm-push">
      <h2 class="h3">📨 এখনই notification পাঠাও</h2>
      <p class="muted small">Notification চালু থাকা সবার phone-এ এখনই যাবে। ঘণ্টায় সর্বোচ্চ ৫টি—বেশি পাঠালে অনেকে notification বন্ধ করে দেয়।</p>
      <label class="label" for="p-title">শিরোনাম</label>
      <input id="p-title" name="title" maxlength="80" required placeholder="যেমন: 🆕 নতুন Model Test যোগ হয়েছে">
      <label class="label" for="p-body">লেখা</label>
      <textarea id="p-body" name="body" maxlength="200" rows="2" required></textarea>
      <label class="label" for="p-url">খুললে কোন পাতা</label>
      <input id="p-url" name="url" value="#daily" placeholder="#daily, #start/exam বা https://…">
      <button class="btn" type="submit">পাঠাও</button>
    </form>`;
  const form = id => Object.fromEntries(new FormData($(id, view)));
  const busy = async (el, fn) => { const b = el.querySelector('[type=submit]'); b.disabled = true; try { await fn(); } catch (e) { toast(`⚠️ ${e.message}`); } finally { b.disabled = false; } };
  $('#adm-notice', view).addEventListener('submit', e => { e.preventDefault(); busy(e.target, async () => {
    const f = form('#adm-notice');
    await api({ action: 'save-settings', notice: { on: f.on === 'on', text: f.text, url: f.url } });
    toast(f.on === 'on' ? '✅ Notice চালু—এক মিনিটের মধ্যে সবার পাতায় দেখাবে।' : '✅ Notice বন্ধ করা হলো।');
  }); });
  $('#adm-morning', view).addEventListener('submit', e => { e.preventDefault(); busy(e.target, async () => {
    await api({ action: 'save-settings', morning: form('#adm-morning') });
    toast('✅ কাল সকাল থেকে এই লেখা যাবে।');
  }); });
  $('#adm-push', view).addEventListener('submit', e => { e.preventDefault(); busy(e.target, async () => {
    const f = form('#adm-push');
    if (!(await ask(`সবার phone-এ এখনই পাঠাবে?\n\n${f.title}\n${f.body}`, { yes: 'পাঠাও', no: 'না' }))) return;
    const r = await api({ action: 'push', ...f });
    toast(`📨 পাঠানো হয়েছে: ${bn(r.result.sent)} জন${r.result.gone ? ` · ${bn(r.result.gone)}টি পুরোনো subscription মুছে গেছে` : ''}`);
    e.target.reset();
  }); });
}

// ---- 💾 Data -----------------------------------------------------------------------

async function data(view) {
  const d = await api({ stats: true }, '/api/backup');
  const mb = d.size / 1024 / 1024;
  const names = { students: 'শিক্ষার্থী', score_attempts: 'Test (Fun/Model)', daily_attempts: 'Daily Quiz', daily_sets: 'Daily Quiz-এর দিন', progress: 'অগ্রগতির backup', threads: 'কমিউনিটি প্রশ্ন', replies: 'কমিউনিটি উত্তর', push_subs: 'Notification চালু', settings: 'Settings', hits: 'Rate-limit লগ' };
  view.innerHTML = `<div class="card">
      <h2 class="h3">💽 Database (Neon free: 1 GB)</h2>
      <div class="adm-meter"><i style="width:${Math.min(100, (mb / 1024) * 100).toFixed(1)}%"></i></div>
      <p><b>${bn(Math.round(mb * 10) / 10)} MB</b> ব্যবহার হয়েছে (${bn(((mb / 1024) * 100).toFixed(1))}%)</p>
      <div class="table-wrap"><table class="dir admin-table"><tbody>${Object.entries(d.rows).map(([k, n]) => `<tr><td>${esc(names[k] || k)}</td><td><b>${bn(n)}</b></td></tr>`).join('')}</tbody></table></div>
    </div>
    <div class="card">
      <h2 class="h3">⬇️ পুরো backup</h2>
      <p class="muted small">সব শিক্ষার্থী, roll, score, Daily Quiz, অগ্রগতি আর কমিউনিটির লেখা একটা file-এ। নিরাপদ জায়গায় রাখো—এতে সবার পুরো নাম আছে।</p>
      <a class="btn" href="#backup">Backup পাতায় যাও →</a>
    </div>`;
}
