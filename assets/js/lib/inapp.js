// Links opened from Messenger, Facebook or Instagram load in that app's own small
// browser: its storage is separate from Chrome (the student's ID and progress may
// not stay), and notifications do not work there. On Android we switch to Chrome
// once per visit (an intent:// link, which these apps hand over to Chrome); a bar
// with an "open in Chrome / Safari" button stays as a fallback. iPhone apps do not
// allow switching by themselves, so the bar explains the menu option instead.

const UA = navigator.userAgent;
export const inApp = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Orca-Android|Messenger|Instagram/i.test(UA);
const android = /Android/i.test(UA);
const ios = /iPhone|iPad|iPod/i.test(UA);

function chromeUrl() {
  const u = new URL(location.href);
  return `intent://${u.host}${u.pathname}${u.search}${u.hash}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(u.href)};end`;
}

const session = {
  get: k => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: k => { try { sessionStorage.setItem(k, '1'); } catch { /* private mode */ } },
};

export function handleInApp() {
  if (!inApp) return;
  if (android && !session.get('inapp-tried')) {
    // After the page has loaded, so it stays usable here if the app does not hand over.
    session.set('inapp-tried');
    const go = () => setTimeout(() => { location.href = chromeUrl(); }, 400);
    if (document.readyState === 'complete') go();
    else addEventListener('load', go, { once: true });
  }
  if (session.get('inapp-hide')) return;
  const button = android
    ? `<a class="btn small" href="${chromeUrl()}">Chrome-এ খোলো</a>`
    : ios ? `<a class="btn small" href="x-safari-${location.href}">Safari-তে খোলো</a>` : '';
  const how = ios ? 'না খুললে: ⋯ চাপো → “Open in Safari” (বা browser-এ খোলো)।' : 'না খুললে: উপরের ⋮ চাপো → “Open in Chrome” (বা browser-এ খোলো)।';
  document.querySelector('.site-header')?.insertAdjacentHTML('afterend', `<div class="inapp-bar" role="note">
    <div><b>Chrome-এ খুললে ভালো চলে</b><small>এখানে (Messenger-এর ভেতরে) তোমার ID ও score ঠিকমতো জমা থাকে না, reminder-ও আসে না। ${how}</small></div>
    ${button}
    <button class="icon-btn" type="button" aria-label="বন্ধ করো" data-inapp-close>✕</button>
  </div>`);
  document.querySelector('[data-inapp-close]')?.addEventListener('click', e => {
    session.set('inapp-hide');
    e.target.closest('.inapp-bar').remove();
  });
}
