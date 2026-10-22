// Who is playing: one block used by the Fun Quiz / Model Test form, the community
// forms and the Score page's sign-in.
//
// Signed in on this device → "✅ তুমি: Rahim Uddin.007 · অন্য ID".
// Otherwise two clear choices:
//   🆕 প্রথমবার   → only a name; the server gives the next free roll and an ID card is shown.
//   🔑 আগে খেলেছি → name + roll of an existing ID (pasting "Rahim Uddin.007" fills both);
//                    never creates a new student, and says exactly what does not match.

import { esc, toast } from './dom.js';
import { state, save } from './store.js';
import { saveProfile } from './api.js';
import { playerFrom, syncCloud } from './cloud.js';
import { showIdCard } from '../components.js';

export const rollText = n => String(n).padStart(3, '0');
const cleanRoll = v => String(v || '').replace(/\D/g, '').slice(0, 5);
const cleanName = v => String(v || '').replace(/\s+/g, ' ').trim();

/** The identity block's HTML. mode: 'auto' (signed-in summary or the two choices) | 'login' (sign-in only). */
export function identityFields({ mode = 'auto' } = {}) {
  const p = state.player;
  const signedIn = mode === 'auto' && p?.playerId && p.roll;
  const loginOnly = mode === 'login';
  return `<div class="identity" data-identity data-state="${signedIn ? 'current' : loginOnly ? 'login' : 'new'}" ${loginOnly ? 'data-login-only' : ''}>
    <div class="id-current">
      <span>✅ তুমি: <b>${esc(p?.tag || '')}</b></span>
      <button type="button" class="link-btn" data-id-switch>অন্য ID</button>
    </div>
    <div class="id-choose">
      ${loginOnly ? '' : `<div class="seg id-modes" role="radiogroup" aria-label="তুমি কি আগে খেলেছ?">
        <label><input type="radio" name="idmode" value="new" checked><span>🆕 প্রথমবার</span></label>
        <label><input type="radio" name="idmode" value="login"><span>🔑 আগে খেলেছি</span></label>
      </div>`}
      <label class="label" data-id-name-label>পুরো নাম</label>
      <input name="name" maxlength="60" autocomplete="name" placeholder="যেমন: Rahim Uddin" value="${esc(signedIn ? '' : p?.name || '')}" aria-label="পুরো নাম">
      <div class="id-roll">
        <label class="label">তোমার Roll</label>
        <input name="roll" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="যেমন: 007" aria-label="Roll">
        <p class="hint">ID কার্ডে যা ছিল: <b>Rahim Uddin.007</b> হলে নাম “Rahim Uddin”, roll “007”। পুরো ID নামের ঘরে paste করলেও চলবে।</p>
      </div>
      <p class="hint id-new-hint">শুধু নাম দাও—একটা নতুন roll পাবে। পরে অন্য phone-এ ঢুকতে নাম + roll লাগবে।</p>
    </div>
    <p class="field-error" data-id-error hidden></p>
  </div>`;
}

/** Switching between the states, and splitting a pasted "Name.007". */
export function wireIdentity(root) {
  const box = root.querySelector('[data-identity]');
  if (!box) return;
  const nameInput = box.querySelector('input[name=name]');
  const rollInput = box.querySelector('input[name=roll]');
  const setState = s => {
    box.dataset.state = s;
    box.querySelector(`input[name=idmode][value=${s}]`)?.click();
    hideError(box);
  };
  box.querySelector('[data-id-switch]')?.addEventListener('click', () => {
    setState('login');
    nameInput.focus();
  });
  box.addEventListener('change', e => {
    if (e.target.name === 'idmode') { box.dataset.state = e.target.value; hideError(box); }
  });
  nameInput.addEventListener('input', () => {
    const m = nameInput.value.match(/^\s*(.+?)\s*\.\s*(\d{1,5})\s*$/);
    if (m) {
      nameInput.value = m[1];
      rollInput.value = rollText(m[2]);
      if (box.dataset.state !== 'login') setState('login');
    }
    hideError(box);
  });
  rollInput.addEventListener('input', () => hideError(box));
}

function hideError(box) {
  const el = box.querySelector('[data-id-error]');
  if (el) el.hidden = true;
}

function showError(box, message, field) {
  const el = box.querySelector('[data-id-error]');
  el.textContent = message;
  el.hidden = false;
  const input = field && box.querySelector(`input[name=${field}]`);
  input?.focus({ preventScroll: true });
  (input || el).scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Makes sure the student is known to the server, from the block in `root`.
 * → the player, null (offline: carry on without the leaderboard) or false (an error is shown).
 */
export async function signIn(root, { avatar } = {}) {
  const box = root.querySelector('[data-identity]');
  const p = state.player;
  const mode = box.dataset.state;
  if (mode === 'current') {
    if (avatar && avatar !== p.avatar) return send({ playerId: p.playerId, name: p.name, roll: rollText(p.roll), avatar }, box);
    return p;
  }
  const name = cleanName(box.querySelector('input[name=name]').value);
  if (name.length < 2) return showError(box, 'তোমার পুরো নাম লেখো (কমপক্ষে ২ অক্ষর)।', 'name'), false;
  if (mode === 'login') {
    const roll = cleanRoll(box.querySelector('input[name=roll]').value);
    if (!roll) return showError(box, 'তোমার roll লেখো (যেমন 007)।', 'roll'), false;
    return send({ name, roll, login: true }, box);
  }
  // A new student: never send this device's old id, so a different person gets their own roll.
  return send({ playerId: p?.name && cleanName(p.name).toLowerCase() === name.toLowerCase() ? p.playerId : undefined, name, avatar: avatar || '🚂' }, box);
}

async function send(body, box) {
  try {
    const res = await Promise.race([
      saveProfile(body),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
    ]);
    state.player = playerFrom(res.player);
    save();
    if (res.created) await showIdCard(res.player);
    if (res.restored) {
      toast(`✅ আবার স্বাগতম, ${res.player.tag}! আগের score ও অগ্রগতি আনা হলো।`);
      syncCloud({ profile: false });
    }
    return state.player;
  } catch (err) {
    if (err.status === 404 || err.status === 409 || err.status === 400) {
      showError(box, err.body?.error || err.message, err.body?.code === 'name_mismatch' ? 'name' : 'roll');
      return false;
    }
    toast('⚠️ Server-এ পৌঁছানো গেল না—এবারের score শুধু এই device-এ থাকবে।');
    if (state.player?.playerId) return state.player;
    if (body.name && !body.login) {
      state.player = { name: body.name, avatar: body.avatar };
      save();
    }
    return null;
  }
}
