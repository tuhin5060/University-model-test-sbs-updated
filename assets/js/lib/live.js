// Live visitor count + "new highest score" popups: one heartbeat a minute
// while the tab is visible. The number shown is only what the server counted;
// if the API is not reachable (no database, offline) the badge stays hidden.

import { MODE_INFO, topicTitle } from '../components.js';
import { esc, bn } from './dom.js';
import { peekProblems, clearProblems } from './api.js';

const KEY = 'campus-pothe.visitor';
const BEAT_MS = 60 * 1000;
let online = null;
let lastEvent = null; // newest event id seen; null until the first heartbeat
let timer = null;

function visitorId() {
  const make = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
  try {
    let id = localStorage.getItem(KEY);
    if (!/^[a-z0-9]{16,40}$/i.test(id || '')) localStorage.setItem(KEY, (id = make()));
    return id;
  } catch {
    return (visitorId.memo ||= make());
  }
}

/** Show the last known count in every [data-live] element (called after each page render). */
export function paintLive() {
  document.querySelectorAll('[data-live]').forEach(el => {
    el.hidden = online === null;
    const b = el.querySelector('b');
    if (b && online !== null) b.textContent = bn(online);
  });
}

/** Small banner at the top of the screen, e.g. "🏆 Arman.007 … সর্বোচ্চ". */
function popup(html) {
  let el = document.getElementById('top-pop');
  if (!el) {
    el = Object.assign(document.createElement('div'), { id: 'top-pop', role: 'status' });
    el.setAttribute('aria-live', 'polite');
    el.addEventListener('click', () => el.classList.remove('show'));
    document.body.append(el);
  }
  el.innerHTML = html;
  el.classList.add('show');
  clearTimeout(popup.timer);
  popup.timer = setTimeout(() => el.classList.remove('show'), 6000);
}

function announce(events) {
  const e = events.filter(x => x.kind === 'top' && !x.mine).pop();
  if (!e) return;
  const m = MODE_INFO[e.mode] || MODE_INFO.fun;
  const score = e.mode === 'exam' ? `${bn(e.score)}%` : `${bn(e.score)} points`;
  popup(`<span aria-hidden="true">🏆</span><span><b>${esc(e.tag)}</b> ${esc(m.label)}-এ <i>${esc(topicTitle(e.topic))}</i> topic-এ সর্বোচ্চ ${score} পেয়েছে!</span>`);
}

async function beat() {
  const problems = peekProblems();
  try {
    const res = await fetch('/api/visitors', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: visitorId(), since: lastEvent, problems: problems.length ? problems : undefined }),
    });
    const body = await res.json();
    online = res.ok && body?.ok && Number.isInteger(body.online) ? Math.max(1, body.online) : null;
    if (res.ok && body?.ok) {
      if (problems.length) clearProblems();
      if (lastEvent !== null && body.events?.length) announce(body.events);
      lastEvent = Math.max(lastEvent || 0, body.lastEvent || 0);
    }
  } catch {
    online = null;
  }
  paintLive();
}

function schedule() {
  clearInterval(timer);
  timer = null;
  if (document.visibilityState !== 'visible') return;
  beat();
  timer = setInterval(beat, BEAT_MS);
}

export function startLive() {
  schedule();
  document.addEventListener('visibilitychange', schedule);
  // Leaving the site removes this browser from the count right away.
  window.addEventListener('pagehide', () => {
    navigator.sendBeacon?.('/api/visitors', new Blob([JSON.stringify({ sid: visitorId(), leave: true })], { type: 'application/json' }));
  });
}
