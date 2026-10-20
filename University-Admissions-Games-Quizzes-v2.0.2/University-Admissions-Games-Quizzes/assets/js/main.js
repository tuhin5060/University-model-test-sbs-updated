// App entry: hash router, global event delegation, theme, search, profile sync.

import { TOPICS } from '../../data/questions/index.js';
import { POSTS } from '../../data/posts.js';
import { UNIVERSITIES } from '../../data/universities.js';
import { SITE } from '../../data/site.js';
import { $, $$, esc } from './lib/dom.js';
import { state, save } from './lib/store.js';
import { fetchProfile } from './lib/api.js';
import * as home from './pages/home.js';
import * as start from './pages/start.js';
import * as play from './pages/play.js';
import * as result from './pages/result.js';
import * as tips from './pages/tips.js';
import * as universities from './pages/universities.js';
import * as progress from './pages/progress.js';
import { leaderboardPage, aboutPage, notFound, switchBoardMode } from './pages/misc.js';

const ROUTES = {
  home,
  start,
  play,
  result,
  tips,
  universities,
  university: universities,
  progress,
  leaderboard: leaderboardPage,
  about: aboutPage,
};

// Old links from the previous version keep working.
const LEGACY = { practice: 'start/exam', session: 'play', saved: 'progress', updates: 'universities', more: 'home', exam: 'start/exam', fun: 'start/fun' };

const NAV_GROUP = { start: 'start', play: 'start', result: 'start', university: 'universities' };

let current = null;

function parse() {
  let path = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'home';
  if (LEGACY[path]) {
    history.replaceState(null, '', '#' + LEGACY[path]);
    path = LEGACY[path];
  }
  const [name, ...params] = path.split('/');
  return { name, params };
}

function render(scroll = true) {
  const { name, params } = parse();
  const page = ROUTES[name] || notFound;
  current?.unmount?.();
  current = page;
  const main = $('#main');
  main.innerHTML = page.render(params);
  document.body.dataset.route = name;
  const h1 = main.querySelector('h1')?.textContent?.trim();
  document.title = name === 'home' || !h1 ? `${SITE.name} · Admission Practice` : `${h1} · ${SITE.name}`;
  const group = NAV_GROUP[name] || name;
  const mode = name === 'start' ? params[0] || 'fun' : null;
  $$('[data-nav]').forEach(a => {
    const key = a.dataset.nav;
    const on = key === group || (group === 'start' && mode && key === `start/${mode}`);
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (scroll) window.scrollTo({ top: 0 });
  page.mount?.(params);
}

window.addEventListener('hashchange', () => {
  render();
  $('#main').focus({ preventScroll: true });
});

document.addEventListener('click', e => {
  // In-page links (#u-location, #main…) scroll instead of being treated as routes.
  const link = e.target.closest('a[href^="#"]');
  if (link) {
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const target = id && !ROUTES[id.split('/')[0]] && !LEGACY[id] && document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (id === 'main') target.focus({ preventScroll: true });
      return;
    }
  }
  const tab = e.target.closest('[data-lb-mode]');
  if (tab) return switchBoardMode(tab);
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'theme') return cycleTheme();
  if (action === 'search') return openSearch();
  current?.onAction?.(action, el);
});

document.addEventListener('change', e => current?.onChange?.(e.target));
document.addEventListener('keydown', e => {
  if (e.key === '/' && !e.target.closest('input,textarea,select')) {
    e.preventDefault();
    return openSearch();
  }
  if (current === play) play.onKey(e);
});

// ---- Theme: auto (system) → light → dark ---------------------------------
const THEMES = ['auto', 'light', 'dark'];
function applyTheme(t) {
  const resolved = t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
  document.documentElement.dataset.theme = resolved;
  const btn = $('#theme-btn');
  if (btn) {
    btn.textContent = { auto: '🌓', light: '☀️', dark: '🌙' }[t];
    btn.setAttribute('aria-label', `Theme: ${t}`);
  }
  $('meta[name=theme-color]')?.setAttribute('content', resolved === 'dark' ? '#0f1714' : '#0f5c45');
}
function cycleTheme() {
  let t = 'auto';
  try { t = localStorage.getItem('campus-theme') || 'auto'; } catch {}
  t = THEMES[(THEMES.indexOf(t) + 1) % THEMES.length];
  try { localStorage.setItem('campus-theme', t); } catch {}
  applyTheme(t);
}
try { applyTheme(localStorage.getItem('campus-theme') || 'auto'); } catch { applyTheme('auto'); }
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  let t = 'auto';
  try { t = localStorage.getItem('campus-theme') || 'auto'; } catch {}
  if (t === 'auto') applyTheme('auto');
});

// ---- Search ----------------------------------------------------------------
const INDEX = [
  ...TOPICS.map(t => ({ title: t.title, sub: `${t.bn} · ${t.count} প্রশ্ন`, href: `#start/fun/${t.id}`, type: 'Topic', text: t.title + ' ' + t.bn })),
  ...POSTS.map(p => ({ title: p.title, sub: p.category, href: `#tips/${p.slug}`, type: 'Tips', text: `${p.title} ${p.summary} ${p.category} ${p.body}` })),
  ...UNIVERSITIES.map(u => ({ title: `${u.short} · ${u.name}`, sub: u.english, href: `#university/${u.id}`, type: 'বিশ্ববিদ্যালয়', text: `${u.name} ${u.english} ${u.short} ${u.place}` })),
  { title: 'Fun Quiz', sub: 'Timer, points, streak, lifeline', href: '#start/fun', type: 'Mode', text: 'fun quiz game খেলা' },
  { title: 'Model Test', sub: 'ভর্তি পরীক্ষার মতো timed test', href: '#start/exam', type: 'Mode', text: 'model test exam পরীক্ষা timer negative' },
  { title: 'আমার অগ্রগতি', sub: 'ফলাফল, ভুল, backup', href: '#progress', type: 'Page', text: 'progress history backup ভুল mistakes' },
];

function openSearch() {
  const dlg = $('#search-dialog');
  if (!dlg.open) dlg.showModal();
  $('#search-input').value = '';
  runSearch();
  $('#search-input').focus();
}
function runSearch() {
  const term = $('#search-input').value.trim().toLowerCase();
  const hits = term ? INDEX.filter(x => x.text.toLowerCase().includes(term)).slice(0, 12) : INDEX.slice(0, 6);
  $('#search-results').innerHTML = hits.length
    ? hits.map(x => `<a class="search-hit" href="${esc(x.href)}"><span class="tag">${esc(x.type)}</span><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></a>`).join('')
    : '<p class="empty">কিছু পাওয়া যায়নি। “Article”, “CU” বা “tense” লিখে দেখো।</p>';
}
$('#search-input')?.addEventListener('input', runSearch);
$('#search-results')?.addEventListener('click', e => { if (e.target.closest('a')) $('#search-dialog').close(); });

// ---- Profile sync (restores your leaderboard name on a new visit) -----------
async function syncProfile() {
  try {
    const p = await fetchProfile(state.player?.playerId);
    if (p?.playerId) {
      state.player = { playerId: p.playerId, name: p.name, avatar: p.avatar };
      save();
    }
  } catch { /* offline or static host: keep the local copy */ }
}

render(false);
syncProfile();
