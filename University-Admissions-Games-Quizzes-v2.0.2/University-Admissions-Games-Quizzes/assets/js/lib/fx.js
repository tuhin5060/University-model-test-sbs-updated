// Sound effects and celebrations for the Fun Quiz. Both respect user settings:
// sound can be muted, animations are skipped for prefers-reduced-motion.

import { state, save } from './store.js';

let ctx = null;
export const soundOn = () => state.prefs?.sound !== false;
export function setSound(on) {
  state.prefs = { ...(state.prefs || {}), sound: !!on };
  save();
}

const TUNES = { good: [660, 880], combo: [660, 880, 1175], bad: [320, 220], tick: [990], win: [523, 659, 784, 1047] };

export function beep(kind = 'good') {
  if (!soundOn()) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    let at = ctx.currentTime;
    for (const hz of TUNES[kind] || TUNES.good) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = hz;
      g.gain.setValueAtTime(kind === 'tick' ? 0.04 : 0.09, at);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.14);
      o.connect(g).connect(ctx.destination);
      o.start(at);
      o.stop(at + 0.15);
      at += 0.1;
    }
  } catch { /* audio unavailable */ }
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function celebrate(emojis = ['⭐'], count = 14) {
  if (reduced()) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'confetti';
    el.textContent = emojis[i % emojis.length];
    el.style.left = `${Math.random() * 96}vw`;
    el.style.animationDelay = `${Math.random() * 0.4}s`;
    el.style.fontSize = `${18 + Math.random() * 16}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }
}

export function shake(el) {
  if (!el || reduced()) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}
