// Live visitor count: a heartbeat every 30 s while the tab is visible.
// The number shown is only what the server counted; if the API is not
// reachable (no database, offline) the badge stays hidden.

const KEY = 'campus-pothe.visitor';
const BEAT_MS = 30 * 1000;
let online = null;
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

const bnNum = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

/** Show the last known count in every [data-live] element (called after each page render). */
export function paintLive() {
  document.querySelectorAll('[data-live]').forEach(el => {
    el.hidden = online === null;
    const b = el.querySelector('b');
    if (b && online !== null) b.textContent = bnNum(online);
  });
}

async function beat() {
  try {
    const res = await fetch('/api/visitors', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: visitorId() }),
    });
    const body = await res.json();
    online = res.ok && body?.ok && Number.isInteger(body.online) ? Math.max(1, body.online) : null;
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
