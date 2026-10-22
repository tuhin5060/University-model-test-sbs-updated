// College picker: type one word ("city", "cadet", "mohsin", "চট্টগ্রাম") and every
// matching college is listed; tap one to fill in the full name. A college that is
// not listed can be kept as typed.

import { esc } from './dom.js';
import { searchColleges, COLLEGES } from '../../../data/colleges.js';

export function collegeField({ value = '', label = 'তোমার কলেজ' } = {}) {
  return `<div class="college-field" data-college>
    <label class="label">${label}</label>
    <input name="college" maxlength="100" autocomplete="off" value="${esc(value)}" placeholder="একটা শব্দ লেখো, যেমন: City বা Cadet"
      role="combobox" aria-autocomplete="list" aria-expanded="false" aria-label="${esc(label.replace(/<[^>]+>/g, '').trim())}">
    <ul class="college-list" role="listbox" hidden></ul>
  </div>`;
}

export function wireCollege(root) {
  const box = root.querySelector('[data-college]');
  if (!box) return;
  const input = box.querySelector('input');
  const list = box.querySelector('ul');
  let items = [];
  let active = -1;

  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
  const choose = i => {
    const item = items[i];
    if (!item) return;
    input.value = item.n;
    close();
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const paint = () => {
    list.querySelectorAll('li').forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    list.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' });
  };
  const open = () => {
    const text = input.value.trim();
    const hits = searchColleges(text);
    const exact = COLLEGES.some(c => c.n.toLowerCase() === text.toLowerCase());
    items = hits.map(c => ({ n: c.n, sub: `${c.s} · ${c.p}` }));
    // A typed name is offered as-is when nothing matches, or once it looks like a full name (two words or more).
    if (text.length >= 3 && !exact && (!hits.length || /\s/.test(text))) items.push({ n: text, sub: 'তালিকায় নেই—এই নামেই রাখো', custom: true });
    if (!items.length) return close();
    list.innerHTML = items.map((c, i) => `<li role="option" data-i="${i}" class="${c.custom ? 'custom' : ''}">${c.custom ? '➕ ' : ''}<b>${esc(c.n)}</b><small>${esc(c.sub)}</small></li>`).join('');
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    active = -1;
  };

  input.addEventListener('input', open);
  input.addEventListener('focus', () => { if (input.value.trim()) open(); });
  input.addEventListener('blur', () => setTimeout(close, 150));
  input.addEventListener('keydown', e => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(items.length - 1, active + 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active < 0 ? 0 : active); }
    else if (e.key === 'Escape') close();
  });
  // pointerdown (not click) so the choice lands before the input loses focus.
  list.addEventListener('pointerdown', e => {
    const li = e.target.closest('li');
    if (!li) return;
    e.preventDefault();
    choose(Number(li.dataset.i));
  });
}

/** The typed or chosen college, tidied ('' when empty). */
export const readCollege = root => String(root.querySelector('[data-college] input')?.value || '').replace(/\s+/g, ' ').trim().slice(0, 100);
