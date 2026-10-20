// The play screen for Fun Quiz, Model Test and Practice.

import { esc, bn, clock, $, $$, toast } from '../lib/dom.js';
import { state } from '../lib/store.js';
import { beep, celebrate, shake, soundOn, setSound } from '../lib/fx.js';
import { multiplier } from '../shared/scoring.js';
import { MODE_INFO, topicById, empty } from '../components.js';
import * as quiz from '../quiz.js';

const L = 'ABCD';
let timer = null;

function explainBlock(q) {
  const topic = topicById(q.topicId);
  const bnText = q.bn || (/[ঀ-৿]/.test(q.e) ? '' : topic?.tipBn);
  return `<div class="explain"><p lang="${/[ঀ-৿]/.test(q.e) ? 'bn' : 'en'}">${esc(q.e)}</p>${bnText ? `<p class="bn-note"><b>সহজ বাংলায়:</b> ${esc(bnText)}</p>` : ''}</div>`;
}

function optionButtons(s, q) {
  const chosen = s.answers[q.id];
  const reveal = s.mode !== 'exam' && quiz.isDone(s, q.id);
  const hidden = s.mode === 'fun' ? s.fun.hidden[q.id] || [] : [];
  return q.o
    .map((text, j) => {
      const gone = hidden.includes(j) && !reveal;
      const cls = [
        'opt',
        chosen === j ? 'chosen' : '',
        reveal && j === q.a ? 'right' : '',
        reveal && chosen === j && j !== q.a ? 'wrong' : '',
        gone ? 'gone' : '',
      ].join(' ');
      const mark = reveal && j === q.a ? '<i aria-label="সঠিক">✓</i>' : reveal && chosen === j ? '<i aria-label="ভুল">✕</i>' : '';
      return `<button class="${cls}" data-action="answer" data-choice="${j}" ${reveal || gone ? 'disabled' : ''} aria-pressed="${chosen === j}"><span class="key">${L[j]}</span><span class="txt" lang="en">${esc(text)}</span>${mark}</button>`;
    })
    .join('');
}

function feedback(s, q) {
  if (s.mode === 'exam' || !quiz.isDone(s, q.id)) return '';
  const chosen = s.answers[q.id];
  const timedOut = !quiz.isAnswered(s, q.id);
  const right = chosen === q.a;
  let head;
  if (timedOut) head = '⏰ সময় শেষ! সঠিক উত্তর: ' + L[q.a];
  else if (right && s.mode === 'fun') {
    const st = s.fun.streak;
    head = `${st >= 5 ? '🔥 অন ফায়ার!' : st >= 3 ? '⚡ দারুণ streak!' : '🎯 সঠিক!'} +${bn(s.fun.points[q.id] || 0)} points`;
  } else head = right ? '🎯 একদম ঠিক!' : `😌 ভুল হয়েছে—সঠিক উত্তর ${L[q.a]}`;
  return `<div class="feedback ${right ? 'good' : 'bad'}" role="status"><b>${head}</b>${explainBlock(q)}</div>`;
}

function palette(s, qs) {
  const answered = Object.keys(s.answers).length;
  const flagged = Object.values(s.flags).filter(v => v === true).length;
  return `<aside class="palette" id="palette" aria-label="প্রশ্ন তালিকা">
    <div class="palette-head"><b>প্রশ্ন তালিকা</b><button class="icon-btn only-mobile" data-action="palette" aria-label="বন্ধ করো">✕</button></div>
    <div class="palette-stats"><span><i class="dot ans"></i>উত্তর ${bn(answered)}</span><span><i class="dot flag"></i>Flag ${bn(flagged)}</span><span><i class="dot"></i>বাকি ${bn(qs.length - answered)}</span></div>
    <div class="palette-grid">${qs
      .map((q, i) => `<button data-action="goto" data-index="${i}" class="${quiz.isAnswered(s, q.id) ? 'ans' : ''} ${s.flags[q.id] ? 'flag' : ''} ${i === s.index ? 'here' : ''}" aria-label="প্রশ্ন ${i + 1}${quiz.isAnswered(s, q.id) ? ', উত্তর দেওয়া' : ''}${s.flags[q.id] ? ', flagged' : ''}">${bn(i + 1)}</button>`)
      .join('')}</div>
    <button class="btn block" data-action="submit">✅ Submit করো</button>
    <p class="muted small">Negative marking: ${s.settings.negative ? `প্রতি ভুলে −${bn(s.settings.negative)}` : 'নেই'}</p>
  </aside>`;
}

export function render() {
  const s = state.session;
  if (!s) {
    return `<div class="container narrow section">${empty('এই মুহূর্তে কোনো চলমান test নেই।', '<a class="btn" href="#start/fun">🎮 Fun Quiz</a> <a class="btn ghost" href="#start/exam">⏱️ Model Test</a>')}</div>`;
  }
  const qs = quiz.sessionQuestions(s);
  const i = s.index || 0;
  const q = qs[i];
  const info = MODE_INFO[s.mode];
  const done = quiz.isDone(s, q.id);
  const progress = s.mode === 'exam' ? Object.keys(s.answers).length / qs.length : (i + (done ? 1 : 0)) / qs.length;
  const last = i === qs.length - 1;
  const f = s.fun;

  const hud = s.mode === 'fun'
    ? `<div class="hud">
        <div><small>Score</small><b id="hud-score">${bn(f.score)}</b></div>
        <div><small>Streak</small><b>${bn(f.streak)}${f.streak ? ' 🔥' : ''}</b></div>
        <div><small>Bonus</small><b class="${f.streak >= 3 ? 'hot' : ''}">x${multiplier(f.streak + 1)}</b></div>
      </div>
      <div class="lifelines">
        <button class="chip" data-action="life" data-kind="fifty" ${!f.fifty || done ? 'disabled' : ''}>✂️ 50:50</button>
        <button class="chip" data-action="life" data-kind="freeze" ${!f.freeze || done ? 'disabled' : ''}>🧊 Freeze</button>
        <button class="chip" data-action="sound" aria-pressed="${soundOn()}">${soundOn() ? '🔊' : '🔇'}</button>
      </div>`
    : '';

  const timerChip = s.mode === 'exam'
    ? `<span class="timer-chip" id="timer" aria-live="off">⏱️ <b>--:--</b></span>`
    : s.mode === 'fun'
      ? `<span class="timer-chip" id="timer">${f.frozen ? '🧊 Frozen' : done ? '—' : `⏳ <b>${bn(s.settings.perQuestion)}</b>`}</span>`
      : '';

  let nav;
  if (s.mode === 'exam') {
    nav = `<button class="btn ghost" data-action="prev" ${i === 0 ? 'disabled' : ''}>← আগের</button>
      <button class="btn ghost ${s.flags[q.id] ? 'on' : ''}" data-action="flag" aria-pressed="${!!s.flags[q.id]}">🚩 ${s.flags[q.id] ? 'Flagged' : 'Flag'}</button>
      ${last ? '<button class="btn" data-action="submit">✅ Submit</button>' : '<button class="btn" data-action="next">পরের →</button>'}`;
  } else {
    nav = done
      ? `<button class="btn big" data-action="next" id="next-btn">${last ? '🏁 ফলাফল দেখো' : 'পরের প্রশ্ন →'}</button>`
      : `<span class="muted small hint">${s.mode === 'fun' ? 'কিবোর্ডে A–D বা ১–৪ চাপতে পারো' : 'উত্তর বাছলেই ব্যাখ্যা দেখাবে'}</span>${s.mode === 'practice' ? `<button class="btn ghost" data-action="skip">${last ? 'শেষ করো' : 'এড়িয়ে যাও →'}</button>` : ''}`;
  }

  return `<div class="play play-${s.mode}">
    <div class="play-top">
      <div class="container play-top-inner">
        <button class="icon-btn" data-action="exit" aria-label="Test থেকে বের হও">✕</button>
        <div class="play-title"><b>${info.icon} ${esc(info.label)}</b><small>${esc(s.title)} · ${bn(i + 1)}/${bn(qs.length)}</small></div>
        ${timerChip}
        ${s.mode === 'exam' ? '<button class="icon-btn only-mobile" data-action="palette" aria-label="প্রশ্ন তালিকা">▦</button>' : ''}
      </div>
      <div class="bar"><span style="width:${Math.round(progress * 100)}%"></span></div>
      ${s.mode === 'fun' ? `<div class="bar q-timer ${f.frozen ? 'frozen' : ''}"><span id="q-timer-bar"></span></div>` : ''}
    </div>
    <div class="container play-grid ${s.mode === 'exam' ? 'with-palette' : ''}">
      <section class="play-main">
        ${hud}
        <article class="qcard" id="qcard">
          <div class="q-meta"><span>প্রশ্ন ${bn(i + 1)}</span><span lang="en">${esc(q.topic)}</span><span class="src">${esc(q.source)}</span></div>
          <h2 class="q-text" lang="en">${esc(q.q)}</h2>
          <div class="opts" role="group" aria-label="উত্তর বাছাই করো">${optionButtons(s, q)}</div>
          ${feedback(s, q)}
          ${s.mode === 'exam' && quiz.isAnswered(s, q.id) ? '<button class="link-btn clear-btn" data-action="clear">উত্তর মুছে ফেলো</button>' : ''}
        </article>
        <div class="play-nav">${nav}</div>
        ${s.mode !== 'exam' ? `<button class="link-btn end-btn" data-action="end">এখনই শেষ করে ফলাফল দেখো</button>` : ''}
      </section>
      ${s.mode === 'exam' ? palette(s, qs) : ''}
    </div>
  </div>`;
}

function tick() {
  const s = state.session;
  if (!s) return stop();
  if (s.mode === 'exam') {
    const left = (s.deadline - Date.now()) / 1000;
    const el = $('#timer');
    if (el) {
      el.innerHTML = `⏱️ <b>${clock(left)}</b>`;
      el.classList.toggle('urgent', left <= 60);
    }
    if (left <= 0) {
      stop();
      toast('⏰ সময় শেষ! তোমার উত্তর জমা হয়েছে।');
      quiz.finish({ auto: true });
    }
    return;
  }
  if (s.mode === 'fun') {
    const q = quiz.currentQuestion(s);
    if (!q || quiz.isDone(s, q.id) || s.fun.frozen) return;
    const total = s.settings.perQuestion;
    const left = Math.max(0, (s.fun.qDeadline - Date.now()) / 1000);
    const bar = $('#q-timer-bar');
    if (bar) bar.style.width = `${(left / total) * 100}%`;
    const el = $('#timer');
    if (el) {
      el.innerHTML = `⏳ <b>${bn(Math.ceil(left))}</b>`;
      el.classList.toggle('urgent', left <= 5);
    }
    if (left <= 0) {
      quiz.timeoutFun();
      beep('bad');
      refresh();
    }
  }
}

function stop() {
  clearInterval(timer);
  timer = null;
}

export function mount() {
  stop();
  const s = state.session;
  if (!s) return;
  if (s.mode !== 'practice') {
    tick();
    timer = setInterval(tick, 200);
  }
  $('#next-btn')?.focus({ preventScroll: true });
}

export function unmount() {
  stop();
  document.body.classList.remove('palette-open');
}

function refresh() {
  const main = document.getElementById('main');
  main.innerHTML = render();
  mount();
}

function goNext() {
  const s = state.session;
  if (!s) return;
  if (s.index >= s.ids.length - 1) {
    if (s.mode === 'exam') return submit();
    return quiz.finish();
  }
  quiz.go(s.index + 1);
  refresh();
  $('#qcard')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function submit() {
  const s = state.session;
  const left = s.ids.length - Object.keys(s.answers).length;
  const flagged = Object.values(s.flags).filter(v => v === true).length;
  const msg = left || flagged
    ? `${left ? `${left}টি প্রশ্নের উত্তর দেওয়া হয়নি। ` : ''}${flagged ? `${flagged}টি flag করা আছে। ` : ''}তবুও submit করবে?`
    : 'সব উত্তর জমা দেবে?';
  if (confirm(msg)) quiz.finish();
}

export function onAction(action, el) {
  const s = state.session;
  if (!s) return;
  switch (action) {
    case 'answer': {
      const r = quiz.answer(Number(el.dataset.choice));
      if (!r) return state.session ? refresh() : undefined;
      if (s.mode === 'fun') {
        if (r.correct) {
          beep(r.streak >= 3 ? 'combo' : 'good');
          celebrate(r.streak >= 5 ? ['🔥', '⭐'] : ['⭐', '✨', '🎉'], r.streak >= 3 ? 18 : 10);
        } else beep('bad');
      } else if (s.mode === 'practice') beep(r.correct ? 'good' : 'bad');
      refresh();
      if (s.mode !== 'exam' && r.correct === false) shake($('#qcard'));
      if (s.mode !== 'exam') $('#qcard .feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    case 'next': return goNext();
    case 'skip': return goNext();
    case 'prev': quiz.go(s.index - 1); return refresh();
    case 'goto':
      quiz.go(Number(el.dataset.index));
      document.body.classList.remove('palette-open');
      return refresh();
    case 'flag': quiz.toggleFlag(); return refresh();
    case 'clear': quiz.clearAnswer(); return refresh();
    case 'palette': document.body.classList.toggle('palette-open'); return;
    case 'submit': return submit();
    case 'life':
      if (quiz.useLifeline(el.dataset.kind)) {
        beep('combo');
        toast(el.dataset.kind === 'fifty' ? '✂️ দুটি ভুল option সরানো হলো' : '🧊 Timer থেমে গেল—ভেবে উত্তর দাও');
      }
      return refresh();
    case 'sound': setSound(!soundOn()); return refresh();
    case 'end':
      if (confirm('এখনই শেষ করবে? যতটুকু খেলেছ ততটুকুর ফলাফল দেখাবে।')) quiz.finish();
      return;
    case 'exit':
      if (confirm('Test থেকে বের হবে? পরে হোম পেজ থেকে আবার এখান থেকেই শুরু করতে পারবে।')) location.hash = '#home';
      return;
  }
}

export function onKey(e) {
  const s = state.session;
  if (!s || e.target.closest('input, textarea, select, dialog')) return;
  const k = e.key.toLowerCase();
  const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3, '১': 0, '২': 1, '৩': 2, '৪': 3 };
  if (k in map) {
    const btn = $$('.opt')[map[k]];
    if (btn && !btn.disabled) { e.preventDefault(); onAction('answer', btn); }
  } else if (k === 'enter' || k === 'arrowright') {
    const q = quiz.currentQuestion(s);
    if (s.mode === 'exam' || quiz.isDone(s, q.id)) {
      if (k === 'enter' && document.activeElement?.tagName === 'BUTTON') return;
      e.preventDefault();
      goNext();
    }
  } else if (k === 'arrowleft' && s.mode === 'exam') {
    quiz.go(s.index - 1);
    refresh();
  } else if (k === 'f' && s.mode === 'exam') {
    quiz.toggleFlag();
    refresh();
  }
}
