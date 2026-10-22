// Browser notifications: daily 8 PM reminder and new-topic news (server: server/routes/push.js).
// The on/off control (<div data-push>) appears on the home page; after a test a
// small card offers it once a week until the student answers.

import { state, save } from './store.js';
import { toast } from './dom.js';

let config = null;
const getConfig = () => (config ||= fetch('/api/push', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ enabled: false })));
const post = body => fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) })
  .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok || !j.ok) throw new Error(j.error || 'Notification service unavailable'); return j; });

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const keyBytes = b64 => Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function subscription() {
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg ? reg.pushManager.getSubscription() : null;
}

/** 'on' | 'off' | 'denied' | 'ios-install' (iPhone: add to Home Screen first) | 'unsupported' */
export async function pushState() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isIOS() && !standalone() ? 'ios-install' : 'unsupported';
  }
  if (!(await getConfig()).enabled) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.permission === 'granted' && (await subscription()) ? 'on' : 'off';
}

async function enable() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes((await getConfig()).publicKey) }));
  await post({ action: 'subscribe', subscription: { endpoint: sub.endpoint }, playerId: state.player?.playerId });
  state.prefs = { ...state.prefs, pushSync: new Date().toDateString() };
  save();
  return true;
}

async function disable() {
  const sub = await subscription();
  if (sub) {
    await post({ action: 'unsubscribe', endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  }
}

/** Once a day, re-send the subscription so the server knows the current student. */
export async function refreshPush() {
  try {
    if (state.prefs?.pushSync === new Date().toDateString() || (await pushState()) !== 'on') return;
    await post({ action: 'subscribe', subscription: { endpoint: (await subscription()).endpoint }, playerId: state.player?.playerId });
    state.prefs = { ...state.prefs, pushSync: new Date().toDateString() };
    save();
  } catch { /* try again tomorrow */ }
}

const LINES = {
  off: '🔔 <button class="link-btn" data-action="push-on">রাত ৮টার reminder চালু করো</button>',
  on: '🔔 রাত ৮টার reminder চালু আছে · <button class="link-btn" data-action="push-test">পরীক্ষা করো</button> · <button class="link-btn" data-action="push-off">বন্ধ করো</button>',
  denied: '🔕 এই browser-এ notification বন্ধ করা আছে। চালু করতে: address bar-এর 🔒 → Notifications → Allow।',
  'ios-install': '📱 iPhone-এ reminder পেতে: Share বাটন → “Add to Home Screen”, তারপর সেখান থেকে site খুলে চালু করো।',
};

/** Fills every <div data-push> on the page with the right control. */
export async function hydratePush(root = document) {
  const boxes = root.querySelectorAll('[data-push]');
  if (!boxes.length) return;
  const s = await pushState();
  for (const box of boxes) {
    box.innerHTML = LINES[s] || '';
    box.hidden = !LINES[s];
  }
}

/** After a test: a small card, at most once a week, while the student has not decided. */
export async function maybeAskPush() {
  const asked = Number(state.prefs?.pushAsked || 0);
  if (Date.now() - asked < 7 * 86400_000 || document.querySelector('.push-ask')) return;
  if ((await pushState()) !== 'off' || Notification.permission !== 'default') return;
  document.body.insertAdjacentHTML('beforeend', `<div class="push-ask" role="dialog" aria-label="Notification">
    <span class="push-ask-icon" aria-hidden="true">🔔</span>
    <div><b>প্রতিদিন রাত ৮টায় মনে করিয়ে দেব?</b><small>Practice-এর reminder আর নতুন topic এলে খবর পাবে।</small></div>
    <div class="push-ask-actions"><button class="btn small" data-action="push-on">চালু করো</button><button class="link-btn" data-action="push-later">এখন না</button></div>
  </div>`);
}

const closeAsk = () => document.querySelector('.push-ask')?.remove();

export async function onPushAction(action, el) {
  el.disabled = true;
  try {
    if (action === 'push-later') {
      state.prefs = { ...state.prefs, pushAsked: Date.now() };
      save();
      return closeAsk();
    }
    if (action === 'push-on') {
      state.prefs = { ...state.prefs, pushAsked: Date.now() };
      save();
      closeAsk();
      toast((await enable()) ? '✅ চালু হয়েছে—প্রতিদিন রাত ৮টায় মনে করিয়ে দেব।' : '🔕 অনুমতি দেওয়া হয়নি। পরে হোম পেজ থেকে চালু করতে পারবে।');
    } else if (action === 'push-off') {
      await disable();
      toast('🔕 Reminder বন্ধ করা হলো।');
    } else if (action === 'push-test') {
      const sub = await subscription();
      await post({ action: 'test', endpoint: sub?.endpoint });
      toast('📨 পাঠানো হয়েছে—কয়েক সেকেন্ডের মধ্যে notification আসবে।');
    }
  } catch (err) {
    toast(`⚠️ ${err.message}`);
  } finally {
    el.disabled = false;
    hydratePush();
  }
}
