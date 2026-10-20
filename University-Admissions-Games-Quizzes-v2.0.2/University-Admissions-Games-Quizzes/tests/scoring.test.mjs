import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreAttempt, funPoints, multiplier, maxFunScore } from '../assets/js/shared/scoring.js';
import { buildBank, QUESTIONS, QUESTION_MAP, hashText } from '../data/questions/index.js';
import { markdown } from '../assets/js/lib/dom.js';

const qs = QUESTIONS.slice(0, 6);
const right = q => q.a;
const wrong = q => (q.a + 1) % q.o.length;

test('streak multiplier and fun points', () => {
  assert.equal(multiplier(1), 1);
  assert.equal(multiplier(3), 1.5);
  assert.equal(multiplier(5), 2);
  assert.equal(funPoints(1, 30, 30), 20);
  assert.equal(funPoints(1, 0, 30), 10);
  assert.equal(funPoints(5, 30, 30), 40);
  assert.equal(funPoints(1, 999, 30), 20, 'seconds left are clamped to the limit');
  assert.ok(maxFunScore(10) > 0);
});

test('fun score: streak resets on wrong and skipped answers', () => {
  const answers = [
    { id: qs[0].id, choice: right(qs[0]), sec: 0 },
    { id: qs[1].id, choice: right(qs[1]), sec: 0 },
    { id: qs[2].id, choice: right(qs[2]), sec: 0 }, // streak 3 → x1.5
    { id: qs[3].id, choice: wrong(qs[3]), sec: 5 },
    { id: qs[4].id, choice: -1, sec: 30 },
    { id: qs[5].id, choice: right(qs[5]), sec: 30 }, // streak 1, no time left
  ];
  const r = scoreAttempt({ mode: 'fun', settings: { perQuestion: 30 }, answers }, QUESTION_MAP);
  assert.deepEqual([r.correct, r.wrong, r.skipped, r.total, r.bestStreak], [4, 1, 1, 6, 3]);
  assert.equal(r.score, 20 + 20 + 30 + 10);
});

test('frozen answers get full time bonus', () => {
  const r = scoreAttempt({ mode: 'fun', settings: { perQuestion: 20 }, answers: [{ id: qs[0].id, choice: right(qs[0]), sec: 19, frozen: true }] }, QUESTION_MAP);
  assert.equal(r.score, funPoints(1, 20, 20));
});

test('exam score with and without negative marking', () => {
  const answers = [
    { id: qs[0].id, choice: right(qs[0]) },
    { id: qs[1].id, choice: right(qs[1]) },
    { id: qs[2].id, choice: wrong(qs[2]) },
    { id: qs[3].id, choice: -1 },
  ];
  const plain = scoreAttempt({ mode: 'exam', settings: { negative: 0 }, answers }, QUESTION_MAP);
  assert.equal(plain.score, 50);
  const neg = scoreAttempt({ mode: 'exam', settings: { negative: 0.25 }, answers }, QUESTION_MAP);
  assert.equal(neg.marks, 1.75);
  assert.equal(neg.score, 43.8);
  const bogus = scoreAttempt({ mode: 'exam', settings: { negative: 5 }, answers }, QUESTION_MAP);
  assert.equal(bogus.score, 50, 'unknown negative values fall back to 0');
});

test('question ids are stable when questions are added or reordered', () => {
  const raw = [{ id: 'demo', title: 'Demo', questions: [
    { q: 'One?', options: ['a', 'b'], answer: 'A' },
    { q: 'Two?', options: ['a', 'b'], answer: 'B' },
  ] }];
  const before = buildBank(raw).questions.map(q => q.id);
  raw[0].questions.unshift({ q: 'New first?', options: ['x', 'y'], answer: 1 });
  const after = buildBank(raw).questions;
  assert.deepEqual(after.slice(1).map(q => q.id), before);
  assert.equal(after[0].a, 1, 'numeric answers still work');
  assert.equal(hashText('abc'), hashText('abc'));
});

test('markdown renderer escapes HTML and only allows https links', () => {
  const html = markdown('Hello <script>alert(1)</script>\n[ok](https://cu.ac.bd)\n[bad](javascript:alert(1))\n- **bold**\n> tip');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('href="https://cu.ac.bd"'));
  assert.ok(!html.includes('href="javascript'));
  assert.ok(html.includes('<strong>bold</strong>'));
  assert.ok(html.includes('class="callout"'));
});
