// Admin dashboard (#admin): who used the site, when and for how long. Loaded only when
// opened (main.js imports it on demand), so it never slows the other pages.
// The password is checked by the server (/api/admin, ADMIN_PASSWORD) and kept only for
// this tab (sessionStorage), never in the page code.
import { esc, bn, $ } from '../lib/dom.js';
import { pageHead } from '../components.js';

const KEY = 'campus-admin';
let days = 7;

const pass = {
  get: () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } },
  set: v => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch {} },
};
const time = iso => (iso ? new Date(iso).toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit' }) : '—');
const when = iso => (iso ? new Date(iso).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
const day = ymd => new Date(`${ymd}T12:00:00+06:00`).toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'short', day: 'numeric', month: 'short' });
const mins = m => (m >= 60 ? `${bn(Math.floor(m / 60))} ঘ ${bn(m % 60)} মি` : `${bn(m)} মি`);
const who = r => (r.name ? `${esc(r.name)} <small class="muted">.${String(r.roll).padStart(3, '0')}</small>` : '<span class="muted">নাম ছাড়া visitor</span>');

export function render() {
  return `<div class="container">
    ${pageHead('🔐 Admin', 'কে কখন, কতক্ষণ site ব্যবহার করছে—শুধু admin দেখতে পারবে।', 'ADMIN')}
    <div id="admin-box">${pass.get() ? '<div class="skeleton"></div><div class="skeleton"></div>' : loginForm()}</div>
  </div>`;
}

function loginForm(error = '') {
  return `<form id="admin-login" class="card admin-login">
    <label class="label" for="admin-pass">Admin password</label>
    <input id="admin-pass" type="password" autocomplete="current-password" required>
    ${error ? `<p class="error">${esc(error)}</p>` : ''}
    <button class="btn" type="submit">ঢোকো</button>
  </form>`;
}

export function mount() {
  const box = $('#admin-box');
  if (pass.get()) return load(box);
  wireLogin(box);
}

function wireLogin(box) {
  $('#admin-login', box)?.addEventListener('submit', e => {
    e.preventDefault();
    pass.set($('#admin-pass', box).value);
    box.innerHTML = '<div class="skeleton"></div>';
    load(box);
  });
  $('#admin-pass', box)?.focus();
}

async function load(box) {
  let body;
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass.get(), days }),
    });
    body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      if (res.status === 403 || res.status === 429) pass.set('');
      box.innerHTML = loginForm(body.error || `Server error (${res.status})`);
      return wireLogin(box);
    }
  } catch {
    box.innerHTML = `<p class="notice">Server-এ পৌঁছানো গেল না—নেট দেখে <button class="btn small" type="button" data-admin-retry>আবার চেষ্টা করো</button></p>`;
    $('[data-admin-retry]', box).addEventListener('click', () => load(box));
    return;
  }
  box.innerHTML = dashboard(body);
  box.querySelectorAll('[data-days]').forEach(b => b.addEventListener('click', () => { days = Number(b.dataset.days); load(box); }));
  $('[data-admin-refresh]', box).addEventListener('click', () => load(box));
  $('[data-admin-out]', box).addEventListener('click', () => { pass.set(''); box.innerHTML = loginForm(); wireLogin(box); });
}

function dashboard(d) {
  const s = d.summary;
  return `<div class="admin-bar">
      <div class="seg" role="group" aria-label="সময়">${[1, 7, 30].map(n => `<button type="button" data-days="${n}" aria-selected="${n === d.days}">${n === 1 ? 'আজ' : `${bn(n)} দিন`}</button>`).join('')}</div>
      <button class="btn small ghost" type="button" data-admin-refresh>🔄 রিফ্রেশ</button>
      <button class="btn small ghost" type="button" data-admin-out>বের হও</button>
    </div>
    <div class="stat-grid admin-stats">
      <div class="stat"><b>🟢 ${bn(s.online)}</b><small>এখন অনলাইনে</small></div>
      <div class="stat"><b>${bn(s.visitors_today)}</b><small>আজ ভিজিট (browser)</small></div>
      <div class="stat"><b>${bn(s.students_today)}</b><small>আজ নাম দিয়ে ব্যবহার করেছে</small></div>
      <div class="stat"><b>${mins(s.minutes_today)}</b><small>আজ মোট ব্যবহার</small></div>
      <div class="stat"><b>${bn(s.students_total)}</b><small>মোট নিবন্ধিত শিক্ষার্থী</small></div>
    </div>

    <h2 class="h3">👩‍🎓 শিক্ষার্থী অনুযায়ী (${d.days === 1 ? 'আজ' : `শেষ ${bn(d.days)} দিন`})</h2>
    ${d.students.length ? `<div class="table-wrap"><table class="dir admin-table">
      <thead><tr><th>নাম · Roll</th><th>কলেজ</th><th>আজ</th><th>মোট সময়</th><th>দিন / বার</th><th>Test</th><th>আজ শুরু</th><th>শেষ দেখা</th></tr></thead>
      <tbody>${d.students.map(r => `<tr><td>${who(r)}</td><td>${esc(r.college || '—')}</td><td>${r.minutes_today ? mins(r.minutes_today) : '—'}</td><td><b>${mins(r.minutes)}</b></td><td>${bn(r.active_days)} দিন · ${bn(r.sessions)} বার</td><td>${bn(r.tests)}</td><td>${time(r.first_today)}</td><td>${when(r.last_at)}</td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="empty">এই সময়ে নাম দিয়ে কেউ ব্যবহার করেনি।</p>'}

    <h2 class="h3">🕒 আজকের ব্যবহার (কে কয়টা থেকে কয়টা)</h2>
    ${d.sessions.length ? `<div class="table-wrap"><table class="dir admin-table">
      <thead><tr><th>নাম</th><th>কখন থেকে</th><th>কখন পর্যন্ত</th><th>সময়</th></tr></thead>
      <tbody>${d.sessions.map(r => `<tr><td>${who(r)}</td><td>${time(r.from)}</td><td>${time(r.to)}</td><td>${mins(r.minutes)}</td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="empty">আজ এখনো কেউ ব্যবহার করেনি।</p>'}

    <h2 class="h3">📅 দিন অনুযায়ী</h2>
    ${d.daily.length ? `<div class="table-wrap"><table class="dir admin-table">
      <thead><tr><th>দিন</th><th>Visitor</th><th>শিক্ষার্থী</th><th>মোট সময়</th><th>Session</th></tr></thead>
      <tbody>${d.daily.map(r => `<tr><td>${day(r.day)}</td><td>${bn(r.visitors)}</td><td>${bn(r.students)}</td><td>${mins(r.minutes)}</td><td>${bn(r.sessions)}</td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="empty">এখনো কোনো তথ্য নেই।</p>'}
    <p class="muted small">সময় গোনা হয় site খোলা ও স্ক্রিনে থাকা অবস্থায় (প্রতি মিনিটে একবার)। ৫ মিনিটের বেশি বিরতি হলে নতুন session। নাম ছাড়া visitor-দের নাম জানা যায় না। তথ্য ৬০ দিন রাখা হয়। এই ফিচার চালুর আগের সময়ের তথ্য নেই।</p>`;
}
