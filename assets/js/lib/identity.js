// Who is playing: one block used by the Fun Quiz / Model Test form, the community
// forms and the Score page's sign-in. Once filled in, the ID is kept in this
// browser, so the block then only shows "✅ তুমি: Rahim Uddin.007 · অন্য নাম/roll".
//
// Name + "Roll (থাকলে)":
//   roll empty  → a new student; the server gives the lowest free roll and an ID card is shown.
//   roll filled → sign in to that ID (pasting "Rahim Uddin.007" fills both). If nobody has
//                 that roll yet (e.g. a roll the admin handed out), ask, then register with it.
//                 A roll that belongs to someone else is never taken.

import { esc, toast } from './dom.js';
import { state, save } from './store.js';
import { saveProfile } from './api.js';
import { playerFrom, syncCloud } from './cloud.js';
import { showIdCard } from '../components.js';
import { collegeField, wireCollege, readCollege } from './college.js';

export const rollText = n => String(n).padStart(3, '0');
const cleanRoll = v => String(v || '').replace(/\D/g, '').slice(0, 5);
const cleanName = v => String(v || '').replace(/\s+/g, ' ').trim();

/** The identity block's HTML. mode: 'auto' (signed-in summary or the form) | 'login' (sign-in only, roll required). */
export function identityFields({ mode = 'auto' } = {}) {
  const p = state.player;
  const signedIn = mode === 'auto' && p?.playerId && p.roll;
  const loginOnly = mode === 'login';
  // The college is asked once: on registration, or from a signed-in student who has none yet.
  const needsCollege = signedIn && !p.college;
  return `<div class="identity" data-identity data-state="${signedIn ? 'current' : 'form'}" ${loginOnly ? 'data-login-only' : ''} ${needsCollege ? 'data-needs-college' : ''}>
    <div class="id-current">
      <span>✅ তুমি: <b>${esc(p?.tag || '')}</b></span>
      <button type="button" class="link-btn" data-id-switch>অন্য নাম/roll</button>
    </div>
    <div class="id-choose">
      <label class="label">পুরো নাম</label>
      <input name="name" maxlength="60" autocomplete="name" placeholder="যেমন: Rahim Uddin" value="${esc(signedIn ? '' : p?.name || '')}" aria-label="পুরো নাম">
      <label class="label">${loginOnly ? 'তোমার Roll' : 'Roll <small class="muted">(থাকলে)</small>'}</label>
      <input name="roll" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="যেমন: 007" aria-label="Roll">
      <p class="hint">${loginOnly
        ? 'ID <b>Rahim Uddin.007</b> হলে নাম “Rahim Uddin”, roll “007”। পুরো ID নামের ঘরে paste করলেও চলবে।'
        : 'আগে খেলে থাকলে আগের roll দাও—সব score ফিরে আসবে। নতুন হলে: তোমাকে কোনো roll দেওয়া থাকলে সেটা লেখো, না থাকলে খালি রাখো—নিজে থেকে একটা পাবে।'}</p>
    </div>
    ${loginOnly ? '' : collegeField({ value: signedIn ? '' : p?.college || '', label: needsCollege ? 'তোমার কলেজ যোগ করো <small class="muted">(একবারই)</small>' : 'তোমার কলেজ' })}
    <p class="field-error" data-id-error hidden></p>
  </div>`;
}

/** Switching between the states, and splitting a pasted "Name.007". */
export function wireIdentity(root) {
  const box = root.querySelector('[data-identity]');
  if (!box) return;
  const nameInput = box.querySelector('input[name=name]');
  const rollInput = box.querySelector('input[name=roll]');
  box.querySelector('[data-id-switch]')?.addEventListener('click', () => {
    box.dataset.state = 'form';
    nameInput.focus();
  });
  nameInput.addEventListener('input', () => {
    const m = nameInput.value.match(/^\s*(.+?)\s*\.\s*(\d{1,5})\s*$/);
    if (m) {
      nameInput.value = m[1];
      rollInput.value = rollText(m[2]);
    }
    hideError(box);
  });
  rollInput.addEventListener('input', () => hideError(box));
  wireCollege(box);
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
  const college = readCollege(box);
  if (box.dataset.state === 'current') {
    const newCollege = college && college !== p.college;
    if ((avatar && avatar !== p.avatar) || newCollege) {
      return send({ playerId: p.playerId, name: p.name, roll: rollText(p.roll), avatar: avatar || p.avatar, college: college || undefined }, box);
    }
    return p;
  }
  const name = cleanName(box.querySelector('input[name=name]').value);
  if (name.length < 2) return showError(box, 'তোমার পুরো নাম লেখো (কমপক্ষে ২ অক্ষর)।', 'name'), false;
  const roll = cleanRoll(box.querySelector('input[name=roll]').value);
  const loginOnly = box.hasAttribute('data-login-only');
  if (roll) {
    const found = await send({ name, roll, login: true, college: college || undefined }, box, { quietNotFound: !loginOnly });
    if (found !== NOT_FOUND) return found;
    // Nobody has this roll yet: a roll the student was given. Register with it, after a check.
    if (!college) return showError(box, `Roll ${rollText(roll)} এখনো কারও নেই। এই roll দিয়ে নতুন নাম খুলতে তোমার কলেজের নামও দাও।`, 'college'), false;
    if (!confirm(`Roll ${rollText(roll)} এখনো কারও নেই।\n\n“${name}” নামে এই roll দিয়ে নতুন ID খুলবে?\n\n(আগে খেলে থাকলে Cancel চেপে নিজের আগের roll ঠিক করে লেখো।)`)) return false;
    return send({ name, roll, avatar: avatar || '🚂', college }, box);
  }
  if (loginOnly) return showError(box, 'তোমার roll লেখো (যেমন 007)।', 'roll'), false;
  if (!college) return showError(box, 'তোমার কলেজের নাম দাও—নামের একটা শব্দ লিখলেই তালিকা আসবে।', 'college'), false;
  // A new student: never send this device's old id, so a different person gets their own roll.
  return send({ playerId: p?.name && cleanName(p.name).toLowerCase() === name.toLowerCase() ? p.playerId : undefined, name, avatar: avatar || '🚂', college }, box);
}

const NOT_FOUND = Symbol('roll not found');

async function send(body, box, { quietNotFound = false } = {}) {
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
    if (quietNotFound && err.body?.code === 'roll_not_found') return NOT_FOUND;
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
