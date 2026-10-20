// Small DOM and formatting helpers shared by every page.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
export const safeURL = url => (/^https:\/\//.test(String(url)) ? esc(url) : '#');

export const bn = n => Number(n || 0).toLocaleString('bn-BD');
export const bnDate = s =>
  new Date(s).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
export function clock(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${bn(m)}:${String(s).padStart(2, '0').replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d])}`;
}
export function duration(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? `${bn(m)} মি ${bn(s)} সে` : `${bn(s)} সেকেন্ড`;
}
export const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

export function ext(url, label, cls = 'text-link') {
  return `<a class="${cls}" href="${safeURL(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
}

export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function shuffle(list, rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministic PRNG so "today's challenge" is the same for everyone. */
export function seeded(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353), (h = (h << 13) | (h >>> 19));
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/** Tiny, safe Markdown subset for tips posts (see data/posts.js). */
export function markdown(src, { topicLink } = {}) {
  const inline = s =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*(.+?)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a class="text-link" href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
  const out = [];
  let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of String(src).trim().split('\n')) {
    const line = raw.trim();
    let m;
    if (!line) { close(); continue; }
    if ((m = line.match(/^\[\[(quiz|exam|fun)(?::([\w-]+))?\]\]$/))) {
      close();
      out.push(topicLink ? topicLink(m[1], m[2]) : '');
    } else if ((m = line.match(/^(#{2,3})\s+(.*)$/))) {
      close();
      const tag = m[1].length === 2 ? 'h2' : 'h3';
      out.push(`<${tag}>${inline(m[2])}</${tag}>`);
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      close();
      out.push(`<aside class="callout"><span aria-hidden="true">💡</span><p>${inline(m[1])}</p></aside>`);
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
      if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else {
      close();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  close();
  return out.join('\n');
}

/** Navigate to a hash route, re-rendering even if we are already on it. */
export function navigate(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}
