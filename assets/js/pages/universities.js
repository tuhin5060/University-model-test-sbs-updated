// University list (#universities) and profile (#university/<id>).

import { UNIVERSITIES, ADMISSION_UPDATES, CHECKLIST, CONTENT_UPDATED } from '../../../data/universities.js';
import { CU_PHOTOS, CU_HERO } from '../../../data/site.js';
import { esc, bn, bnDate, ext, safeURL, toast } from '../lib/dom.js';
import { state, save, toggleSaved } from '../lib/store.js';
import { pageHead, uniCard, photo, credit, heroMedia, hydratePhotos, empty } from '../components.js';

let typeFilter = 'all';

function directory() {
  return `<div class="table-wrap"><table class="dir">
    <thead><tr><th>বিশ্ববিদ্যালয়</th><th>Official website</th><th>Admission portal</th></tr></thead>
    <tbody>${UNIVERSITIES.map(u => `<tr>
      <td><a href="#university/${esc(u.id)}"><b>${esc(u.short)}</b> <span class="muted">${esc(u.name)}</span></a></td>
      <td>${u.site ? ext(u.site, new URL(u.site).hostname.replace(/^www\./, '')) : '—'}</td>
      <td>${u.admission ? ext(u.admission, new URL(u.admission).hostname.replace(/^www\./, '')) : '<span class="muted small">website-এর notice দেখো</span>'}</td>
    </tr>`).join('')}</tbody></table></div>`;
}

function list() {
  const types = ['all', ...new Set(UNIVERSITIES.map(u => u.type))];
  const shown = UNIVERSITIES.filter(u => typeFilter === 'all' || u.type === typeFilter);
  return `<div class="container">
    ${pageHead('বিশ্ববিদ্যালয় ও Official links', 'প্রতিটি বিশ্ববিদ্যালয়ের official website ও admission portal এক জায়গায়। তারিখ, যোগ্যতা ও fee সবসময় official circular থেকে যাচাই করো।', 'FIND YOUR CAMPUS')}
    <div class="chips scroll" role="group" aria-label="ধরন">${types
      .map(t => `<button class="chip ${typeFilter === t ? 'active' : ''}" data-action="type" data-type="${esc(t)}">${t === 'all' ? 'সব' : esc(t)}</button>`)
      .join('')}</div>
    <div class="uni-grid">${shown.map(uniCard).join('')}</div>
    <section class="section"><div class="section-head"><div><h2>🔗 Official link directory</h2><p>Link যাচাই: ${bnDate(CONTENT_UPDATED)}। Portal প্রতি session-এ বদলাতে পারে।</p></div></div>${directory()}</section>
    <section class="section"><div class="section-head"><h2>📢 Admission resources</h2></div>
      <div class="update-grid">${ADMISSION_UPDATES.map(u => `<article class="card"><span class="tag">${esc(u.kind)} · ${esc(u.university)}</span><h3>${esc(u.title)}</h3><p>${esc(u.body)}</p><small class="muted">${esc(u.session)}</small>${ext(u.url, 'Official portal খোলো')}</article>`).join('')}</div>
    </section>
    <section class="section"><div class="section-head"><h2>✅ আবেদনের checklist</h2><p>নিজের অগ্রগতি টিক দিয়ে রাখো (এই browser-এ save থাকে)।</p></div>
      <ul class="checklist">${CHECKLIST.map((c, i) => `<li><label><input type="checkbox" data-check="${i}" ${state.checks.includes(i) ? 'checked' : ''}><span>${esc(c)}</span></label></li>`).join('')}</ul>
    </section>
    <p class="notice">এটি একটি স্বতন্ত্র শিক্ষার্থী-সহায়ক উদ্যোগ; কোনো বিশ্ববিদ্যালয়ের official website নয়।</p>
  </div>`;
}

function saveBtn(u) {
  const on = state.saved.includes('u:' + u.id);
  return `<button class="btn ghost" data-action="save-uni" data-id="${esc(u.id)}" aria-pressed="${on}">${on ? '★ তালিকায় আছে' : '☆ পছন্দের তালিকায় রাখো'}</button>`;
}

function links(u) {
  return `<div class="cu-links">
    ${u.admission ? `<a class="btn" href="${safeURL(u.admission)}" target="_blank" rel="noopener noreferrer">📝 Admission portal ↗</a>` : ''}
    ${u.site ? `<a class="btn ghost" href="${safeURL(u.site)}" target="_blank" rel="noopener noreferrer">🌐 Official website ↗</a>` : ''}
    ${saveBtn(u)}
  </div>`;
}

function details(u) {
  const d = u.details;
  if (!d) return `<section class="card"><h2 class="h3">প্রস্তুতির পথ</h2><p>${esc(u.text)}</p>${u.steps ? `<ol>${u.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    <p class="notice">এই বিশ্ববিদ্যালয়ের বিস্তারিত profile শীঘ্রই যোগ হবে। আপাতত official website-এর admission notice দেখো।</p></section>`;
  const facts = [['বিভাগ', d.division], ['জেলা', d.district], ['ঠিকানা', d.address], ['পরিবেশ', d.setting]].filter(x => x[1]);
  return `<div class="profile">
    <nav class="toc" aria-label="এই পাতায়"><a href="#u-location">অবস্থান</a><a href="#u-admission">ভর্তি</a><a href="#u-docs">Documents</a><a href="#u-sources">Sources</a></nav>
    <div class="prose">
      <section id="u-location"><h2>📍 অবস্থান ও যাতায়াত</h2>
        <dl class="facts">${facts.map(([h, t]) => `<div><dt>${esc(h)}</dt><dd>${esc(t)}</dd></div>`).join('')}</dl>
        ${d.geography ? `<p>${esc(d.geography)}</p>` : ''}
        ${ext('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(u.english + ' ' + (d.address || '')), 'Google Maps-এ দেখো')}
        ${d.travel ? `<h3>যাতায়াত</h3><p>${esc(d.travel)}</p>` : ''}
        <aside class="callout"><span aria-hidden="true">💡</span><p>Campus আর তোমার exam centre এক জায়গায় নাও হতে পারে—Admit Card-এর ঠিকানা দেখে যাত্রা ঠিক করো।</p></aside>
        ${d.stay ? `<h3>থাকা ও খরচ</h3><p>${esc(d.stay)}</p>` : ''}
      </section>
      <section id="u-admission"><h2>📝 ভর্তি প্রক্রিয়া</h2>
        ${d.session ? `<span class="tag">${esc(d.session)}</span>` : ''}
        ${d.overview ? `<p>${esc(d.overview)}</p>` : ''}
        ${d.facts?.length ? `<dl class="facts">${d.facts.map(([h, t]) => `<div><dt>${esc(h)}</dt><dd>${esc(t)}</dd></div>`).join('')}</dl>` : ''}
        ${d.eligibility ? `<h3>যোগ্যতা ও পরীক্ষার ধরন</h3><p>${esc(d.eligibility)}</p>` : ''}
        ${d.process?.length ? `<h3>আবেদন থেকে ভর্তি</h3><ol>${d.process.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
      </section>
      ${d.documents?.length ? `<section id="u-docs"><h2>📄 প্রয়োজনীয় documents</h2><ul>${d.documents.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <p>Merit list-এ নাম এলেই ভর্তি শেষ নয়—subject choice, document verification, fee ও final admission-এর notice অনুসরণ করো।</p></section>` : ''}
      <section id="u-sources"><h2>🔗 Official sources</h2>
        <p class="muted small">যাচাই: ${d.reviewed ? bnDate(d.reviewed) : '—'}</p>
        <ul>${(d.sources || []).map(x => `<li>${ext(x.url, x.label)}</li>`).join('')}</ul>
        ${d.archive ? `<p class="muted">${esc(d.archive)}</p>` : ''}
      </section>
    </div>
  </div>`;
}

function cuPage(u) {
  const story = u.campusStory;
  return `<section class="hero hero-sm">
      ${heroMedia(CU_HERO)}
      <div class="container hero-inner">
        <nav class="crumbs light"><a href="#home">হোম</a> / <a href="#universities">বিশ্ববিদ্যালয়</a> / CU</nav>
        <span class="eyebrow light">তোমার পরের ঠিকানা</span>
        <h1>পাহাড়ের পাশে,<br>নতুন জীবনের শুরু।</h1>
        <p>${esc(u.name)} · <span lang="en">${esc(u.english)}</span></p>
      </div>
      <span class="hero-credit">${credit(CU_HERO)}</span>
    </section>
    <div class="container">
      <div class="cu-facts lifted">${story.facts.map(([h, t]) => `<div><small lang="en">${esc(h)}</small><b>${esc(t)}</b></div>`).join('')}</div>
      ${links(u)}
      <p class="lead">${esc(story.intro)}</p>
      <div class="gallery" tabindex="0" aria-label="চবি ছবির গ্যালারি">${CU_PHOTOS.map(p => `<figure>${photo(p, { sizes: '(min-width:900px) 30vw, 80vw' })}<figcaption>${esc(p.caption)} ${credit(p)}</figcaption></figure>`).join('')}</div>
      <div class="story">${story.sections
        .map(([label, h, t], i) => `<section class="story-block"><span class="eyebrow">${esc(label)}</span><h2>${esc(h)}</h2><p>${esc(t)}</p>${i === 2 ? `<div class="subject-grid">${story.areas.map(([n, s]) => `<article><h3 lang="en">${esc(n)}</h3><p lang="en">${esc(s)}</p></article>`).join('')}</div><p class="muted small">কয়েকটি পরিচিত বিষয়ের উদাহরণ; পূর্ণ তালিকা নয়।</p>` : ''}</section>`)
        .join('')}</div>
      <h2 class="section-title">ভর্তির বিস্তারিত</h2>
      ${details(u)}
      <div class="post-cta"><span aria-hidden="true">🗺️</span><div><b>চবি English প্রস্তুতির roadmap</b><small>Topic list, Cliffs TOEFL পড়ার guide</small></div><a class="btn small" href="#tips/cu-english-roadmap">পড়ো →</a></div>
    </div>`;
}

function single(id) {
  const u = UNIVERSITIES.find(x => x.id === id);
  if (!u) return `<div class="container narrow section">${empty('বিশ্ববিদ্যালয়টি পাওয়া যায়নি।', '<a class="btn" href="#universities">সব বিশ্ববিদ্যালয়</a>')}</div>`;
  if (u.campusStory) return cuPage(u);
  return `<div class="container">
    ${pageHead(u.name, u.english, `${u.short} · ${u.type}`, [['#universities', 'বিশ্ববিদ্যালয়'], [null, u.short]])}
    <p class="lead">${esc(u.text)}</p>
    ${links(u)}
    ${details(u)}
    <div class="post-cta"><span aria-hidden="true">⏱️</span><div><b>English প্রস্তুতি যাচাই করো</b><small>Model Test: ভর্তি পরীক্ষার মতো timer</small></div><a class="btn small" href="#start/exam">Model Test →</a></div>
  </div>`;
}

export function render([id]) {
  return id ? single(id) : list();
}

export function mount() {
  hydratePhotos();
}

export function onAction(action, el) {
  if (action === 'type') {
    typeFilter = el.dataset.type;
    document.getElementById('main').innerHTML = list();
  } else if (action === 'save-uni') {
    const on = toggleSaved('u:' + el.dataset.id);
    el.setAttribute('aria-pressed', on);
    el.textContent = on ? '★ তালিকায় আছে' : '☆ পছন্দের তালিকায় রাখো';
    toast(on ? 'পছন্দের তালিকায় রাখা হলো' : 'তালিকা থেকে সরানো হলো');
  }
}

export function onChange(el) {
  if (el.dataset.check === undefined) return;
  const n = Number(el.dataset.check);
  state.checks = el.checked ? [...new Set([...state.checks, n])] : state.checks.filter(x => x !== n);
  save();
}
