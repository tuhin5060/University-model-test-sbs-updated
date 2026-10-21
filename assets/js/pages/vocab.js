// Vocabulary word list: search by English or Bangla, filter by first letter.
// Data: data/vocabulary.js (same words as the Memorising quiz topics).

import VOCAB from '../../../data/vocabulary.js';
import { esc, bn, $, $$ } from '../lib/dom.js';
import { pageHead, empty } from '../components.js';

const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const POS = { noun: 'noun', verb: 'verb', adj: 'adj', adv: 'adv', phrase: 'phrase' };
let query = '';
let letter = '';

const norm = s => String(s || '').toLowerCase().normalize('NFC');

function matches(v) {
  if (letter && !v.w.toUpperCase().startsWith(letter)) return false;
  if (!query) return true;
  const q = norm(query);
  return norm(v.w).includes(q) || norm(v.bn).includes(q) || v.syn.some(s => norm(s).includes(q)) || v.ant.some(s => norm(s).includes(q));
}

function item(v) {
  return `<article class="vocab-item">
    <h3><span lang="en">${esc(v.w)}</span>${POS[v.pos] ? ` <small>${POS[v.pos]}</small>` : ''}</h3>
    <p class="vocab-bn">${esc(v.bn)}</p>
    ${v.syn.length || v.ant.length ? `<p class="vocab-rel" lang="en">${v.syn.length ? `<span><b>Syn:</b> ${esc(v.syn.join(', '))}</span>` : ''}${v.ant.length ? `<span><b>Ant:</b> ${esc(v.ant.join(', '))}</span>` : ''}</p>` : ''}
  </article>`;
}

function listHtml() {
  const shown = VOCAB.filter(matches);
  return `<p class="muted small" id="vocab-count">${bn(shown.length)}টি শব্দ</p>
    ${shown.length ? `<div class="vocab-list">${shown.map(item).join('')}</div>` : empty('এই নামে কোনো শব্দ পাওয়া যায়নি।')}`;
}

export function render([q]) {
  if (q) { query = q; letter = ''; } // already decoded by the router
  return `<div class="container">
    ${pageHead('📖 শব্দতালিকা', 'ভর্তি ও চাকরির পরীক্ষায় বারবার আসা শব্দ—বাংলা অর্থ, Synonym ও Antonym। মুখস্থ হলে Memorising quiz দিয়ে যাচাই করো।', '', [[null, 'শব্দতালিকা']])}
    <div class="vocab-tools">
      <input id="vocab-q" type="search" placeholder="শব্দ বা বাংলা অর্থ লেখো…" value="${esc(query)}" autocomplete="off" aria-label="শব্দ খুঁজুন">
      <div class="chips letters" role="group" aria-label="প্রথম অক্ষর">
        <button class="chip ${letter ? '' : 'active'}" data-action="letter" data-letter="">সব</button>
        ${LETTERS.map(l => `<button class="chip ${letter === l ? 'active' : ''}" data-action="letter" data-letter="${l}">${l}</button>`).join('')}
      </div>
      <a class="text-link" href="#start/fun/memorising">এই শব্দগুলো দিয়ে Fun Quiz →</a>
    </div>
    <div id="vocab-results">${listHtml()}</div>
  </div>`;
}

function refresh() {
  const box = $('#vocab-results');
  if (box) box.innerHTML = listHtml();
}

export function mount() {
  let t;
  $('#vocab-q')?.addEventListener('input', e => {
    clearTimeout(t);
    t = setTimeout(() => { query = e.target.value.trim(); refresh(); }, 120);
  });
}

export function onAction(action, el) {
  if (action !== 'letter') return;
  letter = el.dataset.letter;
  $$('[data-action=letter]').forEach(b => b.classList.toggle('active', b === el));
  refresh();
}
