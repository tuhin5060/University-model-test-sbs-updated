// Reusable HTML snippets. Pages compose these; keep markup consistent here.

import { esc, bn, safeURL, bnDate, $$ } from './lib/dom.js';
import { TOPICS } from '../../data/questions/index.js';
import { state } from './lib/store.js';
import { fetchLeaderboard } from './lib/api.js';

export const topicById = id => TOPICS.find(t => t.id === id);
export const topicTitle = id =>
  id === 'all' ? 'সব topic (মিশ্র)' : id === 'mistakes' ? 'আমার ভুলগুলো' : id === 'daily' ? 'আজকের চ্যালেঞ্জ' : topicById(id)?.title || id;

export const MODE_INFO = {
  fun: { icon: '🎮', label: 'Fun Quiz', bn: 'খেলতে খেলতে শেখা', color: 'fun' },
  exam: { icon: '⏱️', label: 'Model Test', bn: 'আসল পরীক্ষার মতো', color: 'exam' },
  practice: { icon: '📖', label: 'Practice', bn: 'ধীরে, বুঝে শেখা', color: 'practice' },
};

export function pageHead(title, desc = '', eyebrow = '', crumbs = []) {
  const trail = crumbs.length
    ? `<nav class="crumbs" aria-label="Breadcrumb"><a href="#home">হোম</a>${crumbs
        .map(([href, label]) => (href ? ` / <a href="${href}">${esc(label)}</a>` : ` / <span>${esc(label)}</span>`))
        .join('')}</nav>`
    : '';
  return `<header class="page-head">${trail}${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h1>${esc(title)}</h1>${desc ? `<p>${esc(desc)}</p>` : ''}</header>`;
}

export function topicAccuracy(id) {
  const s = state.stats[id];
  return s && s.seen ? Math.round((s.correct / s.seen) * 100) : null;
}

export function topicCard(t, href = `#start/fun/${t.id}`) {
  const acc = topicAccuracy(t.id);
  return `<a class="topic-card" href="${href}" style="--tone:${esc(t.color)}">
    <span class="topic-icon" aria-hidden="true">${esc(t.icon)}</span>
    <span class="topic-text"><b lang="en">${esc(t.title)}</b><small>${esc(t.bn)}</small></span>
    <span class="topic-meta"><span>${bn(t.count)} প্রশ্ন</span>${acc === null ? '' : `<span class="meter" aria-label="তোমার accuracy ${acc}%"><i style="width:${acc}%"></i></span>`}</span>
  </a>`;
}

/** <img> that shows a local image instantly and upgrades to a larger remote one if it loads. */
export function photo(p, { cls = '', eager = false, sizes = '100vw' } = {}) {
  const local = p.src ? esc(p.src) : '';
  const remote = p.remote ? safeURL(p.remote) : '';
  const attrs = `alt="${esc(p.alt)}" ${eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async" sizes="${sizes}"`;
  if (local && p.srcset) return `<img class="${cls}" src="${local}" srcset="${esc(p.srcset)}" width="${p.width}" height="${p.height}" ${attrs}>`;
  if (local) return `<img class="${cls}" src="${local}" ${remote ? `data-upgrade="${remote}"` : ''} width="480" height="270" ${attrs}>`;
  return `<img class="${cls}" src="${remote}" data-remote-only width="1280" height="720" ${attrs}>`;
}

/** Called after each render: swap in high-res photos, hide remote-only ones that fail. */
export function hydratePhotos(root = document) {
  for (const img of $$('img[data-upgrade]', root)) {
    const url = img.dataset.upgrade;
    img.removeAttribute('data-upgrade');
    const probe = new Image();
    probe.onload = () => { img.src = url; img.classList.add('hi-res'); };
    probe.src = url;
  }
  for (const img of $$('img[data-remote-only]', root)) {
    const hide = () => img.closest('figure')?.classList.add('hidden');
    if (img.complete && img.naturalWidth === 0) hide();
    img.addEventListener('error', hide, { once: true });
  }
}

/** Full-bleed header image with an instant blurred placeholder behind it. */
export function heroMedia(p) {
  return `<div class="hero-media" style="background-image:url('${p.placeholder}')">${photo(p, { cls: 'hero-img', eager: true, sizes: '100vw' })}</div>`;
}

export function credit(p) {
  if (!p.credit) return '';
  return p.creditUrl
    ? `<a class="credit" href="${safeURL(p.creditUrl)}" target="_blank" rel="noopener noreferrer">📷 ${esc(p.credit)}</a>`
    : `<span class="credit">${esc(p.credit)}</span>`;
}

export function postCard(p, big = false) {
  return `<a class="post-card ${big ? 'big' : ''}" href="#tips/${esc(p.slug)}">
    <span class="post-emoji" aria-hidden="true">${esc(p.emoji || '📘')}</span>
    <span class="post-body"><span class="tag">${esc(p.category)}</span><b>${esc(p.title)}</b><small>${esc(p.summary)}</small>
    <span class="post-meta">${bn(p.minutes)} মিনিট পড়া · ${bnDate(p.date)}</span></span>
  </a>`;
}

export function uniCard(u) {
  return `<article class="uni-card">
    <a class="uni-top" href="#university/${esc(u.id)}"><span class="uni-badge">${esc(u.short)}</span><span><b>${esc(u.name)}</b><small lang="en">${esc(u.english)}</small></span></a>
    <p class="muted small">📍 ${esc(u.place)} · ${esc(u.type)}</p>
    <div class="uni-links">
      ${u.site ? `<a class="pill-link" href="${safeURL(u.site)}" target="_blank" rel="noopener noreferrer">🌐 Website</a>` : ''}
      ${u.admission ? `<a class="pill-link strong" href="${safeURL(u.admission)}" target="_blank" rel="noopener noreferrer">📝 Admission</a>` : ''}
      <a class="pill-link" href="#university/${esc(u.id)}">বিস্তারিত →</a>
    </div>
  </article>`;
}

export function scoreRing(percent, label, sub = '') {
  const p = Math.max(0, Math.min(100, percent));
  const tone = p >= 80 ? 'var(--good)' : p >= 50 ? 'var(--accent)' : 'var(--bad)';
  return `<div class="ring" style="--p:${p};--tone:${tone}" role="img" aria-label="${esc(label)}">
    <div><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;
}

export function leaderboard({ mode = 'fun', topic = 'all', limit = 10, tabs = false } = {}) {
  return `<div class="lb" data-mode="${esc(mode)}" data-topic="${esc(topic)}" data-limit="${limit}">
    ${tabs ? `<div class="seg" role="tablist" aria-label="Leaderboard mode">
      <button role="tab" data-lb-mode="fun" aria-selected="${mode === 'fun'}">🎮 Fun points</button>
      <button role="tab" data-lb-mode="exam" aria-selected="${mode === 'exam'}">⏱️ Model Test</button></div>` : ''}
    <div class="lb-rows"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div></div>`;
}

export async function loadLeaderboards(root = document, fresh = false) {
  for (const box of $$('.lb', root)) {
    const rowsEl = box.querySelector('.lb-rows');
    const { mode, topic } = box.dataset;
    const limit = Number(box.dataset.limit) || 10;
    try {
      const rows = (await fetchLeaderboard(mode, topic, { fresh })).slice(0, limit);
      if (box.dataset.mode !== mode) continue; // tab switched meanwhile
      rowsEl.innerHTML = rows.length
        ? `<ol class="lb-list">${rows
            .map((r, i) => `<li class="${r.me ? 'me' : ''}">
              <span class="lb-rank">${['🥇', '🥈', '🥉'][i] || bn(i + 1)}</span>
              <span class="lb-avatar" aria-hidden="true">${esc(r.avatar || '🚂')}</span>
              <span class="lb-name"><b>${esc(r.name || 'Student')}${r.me ? ' <em>(তুমি)</em>' : ''}</b><small>${bn(r.correct)}/${bn(r.total)} সঠিক · ${bn(r.attempts || 1)} বার</small></span>
              <span class="lb-score">${mode === 'fun' ? bn(r.score) : `${bn(r.score)}%`}</span></li>`)
            .join('')}</ol>`
        : `<p class="empty">এখনো কেউ score করেনি—প্রথম হওয়ার সুযোগ তোমার! 🏁</p>`;
    } catch {
      rowsEl.innerHTML = `<p class="empty">Leaderboard এখন দেখা যাচ্ছে না (offline বা server বন্ধ)। তোমার score এই device-এ save থাকছে।</p>`;
    }
  }
}

export function empty(text, cta = '') {
  return `<div class="empty-box"><p>${esc(text)}</p>${cta}</div>`;
}
