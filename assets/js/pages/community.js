// Community: students ask questions by topic and answer each other.
//   #community                      → thread list (filters: status, topic, tag, search)
//   #community/new[/<topic>[/<qid>]] → ask form (from a question in the answer sheet, it is pre-filled)
//   #community/t/<id>               → one thread with replies

import { TOPICS, GROUPS } from '../../../data/questions/meta.js';
import { getBank } from '../lib/bank.js';
const QUESTION_MAP = { get: id => getBank()?.QUESTION_MAP.get(id) }; // loaded before this page (main.js)
import { esc, bn, bnDate, $, toast } from '../lib/dom.js';
import { state } from '../lib/store.js';
import { fetchThreads, fetchThread, communityAction } from '../lib/api.js';
import { flush } from '../lib/outbox.js';
import { pageHead, topicById, empty } from '../components.js';
import { identityFields, wireIdentity, signIn } from '../lib/identity.js';
import { explainBlock } from './play.js';

const L = 'ABCD';
const EXTRA_TOPICS = { general: '💬 সাধারণ প্রশ্ন', admission: '🎓 ভর্তি তথ্য', study: '📚 পড়ার কৌশল' };
const filters = { status: '', topic: '', tag: '', q: '', page: 0 };
let threads = [];
let current = null; // the open thread

export const topicName = id => EXTRA_TOPICS[id] || (topicById(id) ? `${topicById(id).icon} ${topicById(id).title}` : id);

function ago(s) {
  const sec = (Date.now() - Date.parse(s)) / 1000;
  if (sec < 60) return 'এইমাত্র';
  if (sec < 3600) return `${bn(Math.floor(sec / 60))} মিনিট আগে`;
  if (sec < 86400) return `${bn(Math.floor(sec / 3600))} ঘণ্টা আগে`;
  if (sec < 86400 * 7) return `${bn(Math.floor(sec / 86400))} দিন আগে`;
  return bnDate(s);
}

const statusBadge = t => (t.resolved ? '<span class="cm-status ok">✅ সমাধান হয়েছে</span>' : '<span class="cm-status open">❓ উত্তর খুঁজছে</span>');
const tagList = tags => tags.map(tag => `<span class="cm-tag">#${esc(tag)}</span>`).join('');

export function threadCard(t) {
  return `<a class="cm-card ${t.resolved ? 'resolved' : ''}" href="#community/t/${t.id}">
    <span class="cm-card-top">${statusBadge(t)}<span class="cm-topic">${esc(topicName(t.topic))}</span></span>
    <b class="cm-title">${esc(t.title)}</b>
    ${t.body ? `<span class="cm-excerpt">${esc(t.body)}</span>` : ''}
    <span class="cm-meta">${tagList(t.tags)}<span>${esc(t.author.avatar)} ${esc(t.author.tag)}</span><span>${ago(t.activeAt)}</span><span>💬 ${bn(t.replies)}</span></span>
  </a>`;
}

function topicOptions(selected, { any = false } = {}) {
  const opt = (id, label) => `<option value="${esc(id)}" ${id === selected ? 'selected' : ''}>${esc(label)}</option>`;
  return [
    any ? opt('', 'সব topic') : opt('', '— topic বেছে নাও —'),
    `<optgroup label="সাধারণ">${Object.entries(EXTRA_TOPICS).map(([id, label]) => opt(id, label)).join('')}</optgroup>`,
    ...Object.values(GROUPS).map(g => `<optgroup label="${esc(g.short)}">${TOPICS.filter(t => t.group === g.id).map(t => opt(t.id, `${t.icon} ${t.title}`)).join('')}</optgroup>`),
  ].join('');
}

function questionBox(q, { answer = false } = {}) {
  return `<div class="cm-question">
    <small>${esc(q.topic)} · ${esc(q.source)}</small>
    <b lang="en">${esc(q.q)}</b>
    <ol class="cm-opts">${q.o.map((o, j) => `<li><span class="key">${L[j]}</span><span lang="en">${esc(o)}</span></li>`).join('')}</ol>
    ${answer ? `<details><summary>সঠিক উত্তর ও ব্যাখ্যা দেখো</summary><p class="answer-line">সঠিক উত্তর: <span lang="en">${L[q.a]}. ${esc(q.o[q.a])}</span></p>${explainBlock(q)}</details>` : ''}
  </div>`;
}

/** Who is posting: shown only to students not signed in on this device. */
const profileFields = () => (state.player?.playerId ? '' : `<fieldset class="cm-profile"><legend>তোমার নাম লিখো</legend>${identityFields()}</fieldset>`);

/** Signs the student in from the identity block if needed. → true when posting can go ahead. */
async function readyToPost(form) {
  if (state.player?.pending) await flush(); // a name saved offline goes to the server first
  if (state.player?.pending) {
    toast('📴 তোমার নাম এখনো server-এ যায়নি (নেট নেই)—নেট এলে আবার পোস্ট করো।');
    return false;
  }
  if (state.player?.playerId) return true;
  const player = await signIn(form);
  if (player === null) {
    const box = form.querySelector('[data-id-error]');
    box.textContent = 'Server-এ পৌঁছানো গেল না—একটু পরে আবার চেষ্টা করো।';
    box.hidden = false;
  }
  return !!player?.playerId;
}

const adminMenu = (kind, id) => `<details class="cm-menu"><summary aria-label="আরও অপশন">⋯</summary>
  <button type="button" data-action="cm-admin" data-kind="${kind}" data-id="${id}">🗑️ Admin হিসেবে delete</button></details>`;

const adminDialog = () => `<dialog id="cm-admin-dialog" class="cm-dialog" aria-labelledby="cm-admin-title">
  <form id="cm-admin-form">
    <h3 id="cm-admin-title">🔒 Admin delete</h3>
    <p class="muted" id="cm-admin-what"></p>
    <input type="password" name="password" autocomplete="current-password" placeholder="Admin password" required>
    <p class="field-error" id="cm-admin-error" hidden></p>
    <div class="actions"><button class="btn danger" type="submit">Delete করো</button><button class="btn ghost" type="button" data-action="cm-admin-close">বাতিল</button></div>
  </form>
</dialog>`;

// ---- list ----------------------------------------------------------------------

function listPage() {
  const chip = (value, label) => `<button class="chip ${filters.status === value ? 'active' : ''}" data-action="cm-status" data-status="${value}">${label}</button>`;
  return `<div class="container narrow">
    ${pageHead('💬 কমিউনিটি', 'আটকে গেলে প্রশ্ন করো, জানা থাকলে উত্তর দাও।')}
    <div class="cm-toolbar">
      <a class="btn" href="#community/new${filters.topic ? `/${esc(filters.topic)}` : ''}">✍️ প্রশ্ন করো</a>
      <input type="search" id="cm-search" placeholder="আলোচনা খুঁজুন…" value="${esc(filters.q)}" aria-label="আলোচনা খুঁজুন">
    </div>
    <div class="cm-filters">
      <div class="chips scroll" role="group" aria-label="অবস্থা">${chip('', 'সব')}${chip('open', '❓ উত্তর খুঁজছে')}${chip('resolved', '✅ সমাধান হয়েছে')}</div>
      <select id="cm-topic" aria-label="Topic">${topicOptions(filters.topic, { any: true })}</select>
    </div>
    <div class="chips scroll" id="cm-tags" aria-label="জনপ্রিয় tag"></div>
    <div class="cm-list" id="cm-list"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>
  </div>`;
}

async function loadList({ append = false } = {}) {
  const box = $('#cm-list');
  if (!box) return;
  try {
    const res = await fetchThreads(filters);
    threads = append ? [...threads, ...res.threads] : res.threads;
    const tags = $('#cm-tags');
    if (tags) {
      const list = filters.tag && !res.tags.some(t => t.tag === filters.tag) ? [{ tag: filters.tag }, ...res.tags] : res.tags;
      tags.innerHTML = list.map(t => `<button class="chip ${t.tag === filters.tag ? 'active' : ''}" data-action="cm-tag" data-tag="${esc(t.tag)}">#${esc(t.tag)}${t.tag === filters.tag ? ' ✕' : ''}</button>`).join('');
    }
    const filtered = filters.status || filters.topic || filters.tag || filters.q;
    box.innerHTML = threads.length
      ? threads.map(threadCard).join('') + (res.more ? '<button class="btn ghost block" data-action="cm-more">আরও দেখো</button>' : '')
      : empty(filtered ? 'এই filter-এ কোনো আলোচনা নেই।' : 'এখনো কেউ প্রশ্ন করেনি—প্রথম প্রশ্নটা তুমিই করো!', '<a class="btn" href="#community/new">✍️ প্রশ্ন করো</a>');
  } catch (err) {
    box.innerHTML = `<p class="empty">${err.status === 503 ? 'কমিউনিটি এই site-এ এখনো চালু হয়নি।' : 'আলোচনাগুলো লোড হচ্ছে না।'} <button class="link-btn" data-action="cm-reload">আবার চেষ্টা করো</button></p>`;
  }
}

// ---- new thread ----------------------------------------------------------------

function newPage(topic = '', qid = '') {
  const q = qid ? QUESTION_MAP.get(qid) : null;
  if (q) topic = q.topicId;
  if (topic && !EXTRA_TOPICS[topic] && !topicById(topic)) topic = '';
  return `<div class="container narrow">
    ${pageHead('✍️ নতুন প্রশ্ন', 'পরিষ্কার করে লেখো কোথায় আটকে গেছ—তাহলে দ্রুত ভালো উত্তর পাবে।', '', [['#community', 'কমিউনিটি'], [null, 'নতুন প্রশ্ন']])}
    <form class="card cm-form" id="cm-new" novalidate>
      ${profileFields()}
      <label class="label" for="cm-topic-new">Topic</label>
      <select id="cm-topic-new" name="topic" required>${topicOptions(topic)}</select>
      ${q ? `<input type="hidden" name="questionId" value="${esc(q.id)}"><p class="label">যে প্রশ্ন নিয়ে জানতে চাও</p>${questionBox(q)}` : ''}
      <label class="label" for="cm-title">তোমার প্রশ্ন</label>
      <input id="cm-title" name="title" maxlength="140" placeholder="যেমন: Since আর for-এর পার্থক্য কী?" value="${q ? esc('এই প্রশ্নের সঠিক উত্তর কেন এটা?') : ''}" required>
      <label class="label" for="cm-body">বিস্তারিত <small class="muted">(ঐচ্ছিক)</small></label>
      <textarea id="cm-body" name="body" rows="5" maxlength="2000" placeholder="কী বুঝেছ, কোথায় খটকা লাগছে—লিখে দাও।"></textarea>
      <label class="label" for="cm-tags-input">Tag <small class="muted">(comma দিয়ে, সর্বোচ্চ ৫টি)</small></label>
      <input id="cm-tags-input" name="tags" maxlength="140" placeholder="যেমন: since, present perfect">
      <p class="field-error" id="cm-error" hidden></p>
      <button class="btn big block" type="submit">প্রকাশ করো</button>
    </form>
  </div>`;
}

function mountNew() {
  const form = $('#cm-new');
  if (form) wireIdentity(form);
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const error = $('#cm-error');
    error.hidden = true;
    const f = form.elements;
    if (!f.topic.value) { error.textContent = 'একটি topic বেছে নাও।'; error.hidden = false; return f.topic.focus(); }
    if (f.title.value.trim().length < 8) { error.textContent = 'প্রশ্নটা একটু বিস্তারিত লেখো (কমপক্ষে ৮ অক্ষর)।'; error.hidden = false; return f.title.focus(); }
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      if (!(await readyToPost(form))) return;
      const res = await communityAction({
        action: 'thread', playerId: state.player?.playerId, topic: f.topic.value, title: f.title.value, body: f.body.value,
        tags: f.tags.value, questionId: f.questionId?.value,
      });
      current = res.thread;
      toast('✅ প্রশ্ন প্রকাশ হয়েছে');
      location.hash = `#community/t/${res.thread.id}`;
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
}

// ---- one thread ----------------------------------------------------------------

function threadPage(id) {
  return `<div class="container narrow" id="cm-thread" data-id="${esc(id)}">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">হোম</a> / <a href="#community">কমিউনিটি</a></nav>
    ${current?.id === Number(id) ? threadBody(current) : '<div class="skeleton tall"></div><div class="skeleton"></div>'}
  </div>${adminDialog()}`;
}

function threadBody(t) {
  const q = t.questionId ? QUESTION_MAP.get(t.questionId) : null;
  const replies = t.replyList || [];
  return `<article class="card cm-post">
      <div class="cm-card-top">${statusBadge(t)}<a class="cm-topic" href="#community" data-action="cm-filter-topic" data-topic="${esc(t.topic)}">${esc(topicName(t.topic))}</a>${adminMenu('thread', t.id)}</div>
      <h1 class="cm-post-title">${esc(t.title)}</h1>
      <p class="cm-byline">${esc(t.author.avatar)} <b>${esc(t.author.tag)}</b> · ${ago(t.createdAt)}</p>
      ${t.body ? `<p class="cm-text">${esc(t.body)}</p>` : ''}
      ${q ? questionBox(q, { answer: true }) : ''}
      ${t.tags.length ? `<p class="cm-meta">${t.tags.map(tag => `<button class="cm-tag" data-action="cm-tag-open" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join('')}</p>` : ''}
      ${t.mine ? `<div class="actions">${t.resolved
        ? '<button class="btn ghost small" data-action="cm-resolve" data-value="0">↩️ আবার খোলা করো</button>'
        : '<button class="btn small" data-action="cm-resolve" data-value="1">✅ সমাধান হয়েছে</button>'}</div>` : ''}
    </article>
    <h2 class="cm-replies-head">💬 উত্তর ${bn(replies.length)}টি</h2>
    <div class="cm-replies">${replies.length
      ? replies.map(r => `<article class="cm-reply ${t.solutionId === r.id ? 'solution' : ''}" id="reply-${r.id}">
          <div class="cm-card-top"><span class="cm-byline">${esc(r.author.avatar)} <b>${esc(r.author.tag)}</b> · ${ago(r.createdAt)}</span>${t.solutionId === r.id ? '<span class="cm-status ok">✅ সমাধান</span>' : ''}${adminMenu('reply', r.id)}</div>
          <p class="cm-text">${esc(r.body)}</p>
          ${t.mine && t.solutionId !== r.id ? `<button class="link-btn" data-action="cm-resolve" data-value="1" data-reply="${r.id}">✅ এই উত্তরটাই সমাধান</button>` : ''}
        </article>`).join('')
      : '<p class="empty">এখনো কেউ উত্তর দেয়নি। জানা থাকলে তুমিই প্রথম উত্তর দাও!</p>'}</div>
    <form class="card cm-form" id="cm-reply" novalidate>
      <h3>তোমার উত্তর</h3>
      ${profileFields()}
      <textarea name="body" rows="4" maxlength="1500" placeholder="ব্যাখ্যাসহ উত্তর লেখো—কেন এটা ঠিক, অন্যগুলো কেন ভুল।" aria-label="তোমার উত্তর" required></textarea>
      <p class="field-error" id="cm-reply-error" hidden></p>
      <button class="btn" type="submit">উত্তর দাও</button>
    </form>`;
}

function paintThread() {
  const box = $('#cm-thread');
  if (!box || !current) return;
  box.innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><a href="#home">হোম</a> / <a href="#community">কমিউনিটি</a></nav>${threadBody(current)}`;
  document.title = `${current.title} · কমিউনিটি`;
  mountReply();
}

async function loadThread(id) {
  try {
    current = await fetchThread(id);
    paintThread();
  } catch (err) {
    const box = $('#cm-thread');
    if (box) box.innerHTML = empty(err.status === 404 ? err.message : 'আলোচনাটি লোড হচ্ছে না।', '<a class="btn" href="#community">সব আলোচনা</a>');
  }
}

function mountReply() {
  const form = $('#cm-reply');
  if (form) wireIdentity(form);
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const error = $('#cm-reply-error');
    error.hidden = true;
    if (form.elements.body.value.trim().length < 2) { error.textContent = 'উত্তরটা লেখো।'; error.hidden = false; return; }
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      if (!(await readyToPost(form))) return;
      const res = await communityAction({ action: 'reply', playerId: state.player?.playerId, threadId: current.id, body: form.elements.body.value });
      current = res.thread;
      paintThread();
      toast('✅ উত্তর দেওয়া হয়েছে');
      $(`#reply-${current.replyList[current.replyList.length - 1]?.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
}

function mountAdmin() {
  const dialog = $('#cm-admin-dialog');
  const form = $('#cm-admin-form');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const error = $('#cm-admin-error');
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    error.hidden = true;
    const { kind, id } = dialog.dataset;
    try {
      await communityAction({ action: 'delete', kind, id: Number(id), password: form.elements.password.value });
      dialog.close();
      toast('🗑️ মুছে ফেলা হয়েছে');
      if (kind === 'thread') {
        current = null;
        location.hash = '#community';
      } else loadThread(current.id);
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    } finally {
      btn.disabled = false;
      form.elements.password.value = '';
    }
  });
}

// ---- page API ------------------------------------------------------------------

export function render([view, a, b] = []) {
  if (view === 'new') return newPage(a, b && decodeURIComponent(b));
  if (view === 't' && /^\d+$/.test(a || '')) return threadPage(a);
  return listPage();
}

export function mount([view, a] = []) {
  if (view === 'new') return mountNew();
  if (view === 't' && /^\d+$/.test(a || '')) {
    mountAdmin();
    if (current?.id === Number(a)) mountReply();
    return loadThread(a);
  }
  let typing;
  $('#cm-search')?.addEventListener('input', e => {
    clearTimeout(typing);
    typing = setTimeout(() => { filters.q = e.target.value.trim(); filters.page = 0; loadList(); }, 350);
  });
  loadList();
}

export function onChange(el) {
  if (el.id === 'cm-topic') {
    filters.topic = el.value;
    filters.page = 0;
    loadList();
  }
}

export function onAction(action, el) {
  switch (action) {
    case 'cm-status':
      filters.status = el.dataset.status;
      filters.page = 0;
      document.querySelectorAll('[data-action="cm-status"]').forEach(c => c.classList.toggle('active', c === el));
      return loadList();
    case 'cm-tag':
      filters.tag = filters.tag === el.dataset.tag ? '' : el.dataset.tag;
      filters.page = 0;
      return loadList();
    case 'cm-tag-open':
      Object.assign(filters, { tag: el.dataset.tag, topic: '', status: '', q: '', page: 0 });
      location.hash = '#community';
      return;
    case 'cm-filter-topic':
      Object.assign(filters, { topic: el.dataset.topic, tag: '', status: '', q: '', page: 0 });
      return;
    case 'cm-more':
      filters.page++;
      el.disabled = true;
      return loadList({ append: true });
    case 'cm-reload': return loadList();
    case 'cm-resolve':
      return communityAction({ action: 'resolve', playerId: state.player?.playerId, threadId: current.id, resolved: el.dataset.value === '1', replyId: el.dataset.reply ? Number(el.dataset.reply) : undefined })
        .then(res => { current = res.thread; paintThread(); toast(current.resolved ? '✅ সমাধান হয়েছে চিহ্ন দেওয়া হলো' : '↩️ আবার খোলা হলো'); })
        .catch(err => toast(`⚠️ ${err.message}`));
    case 'cm-admin': {
      const dialog = $('#cm-admin-dialog');
      el.closest('details')?.removeAttribute('open');
      dialog.dataset.kind = el.dataset.kind;
      dialog.dataset.id = el.dataset.id;
      $('#cm-admin-what').textContent = el.dataset.kind === 'thread' ? 'পুরো প্রশ্ন ও এর সব উত্তর মুছে যাবে।' : 'এই উত্তরটি মুছে যাবে।';
      $('#cm-admin-error').hidden = true;
      dialog.showModal();
      dialog.querySelector('input').focus();
      return;
    }
    case 'cm-admin-close': return $('#cm-admin-dialog')?.close();
  }
}

/** Home page: the newest few threads. */
export async function loadLatest(box, limit = 3) {
  if (!box) return;
  try {
    const res = await fetchThreads();
    box.innerHTML = res.threads.length
      ? res.threads.slice(0, limit).map(threadCard).join('')
      : '<p class="empty">এখনো কেউ প্রশ্ন করেনি—প্রথম প্রশ্নটা তুমিই করো!</p>';
  } catch {
    box.closest('section')?.remove(); // community not available on this deployment
  }
}
