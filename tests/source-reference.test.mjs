import test from 'node:test';
import assert from 'node:assert/strict';
import { examRef } from '../assets/js/shared/source.js';

test('recognizes named exam sources in English and Bengali', () => {
  for (const source of ['CU-B 2022–23', 'DU-B 2021–22', 'GST-A 2024–25', '28th BCS', '৩১তম BCS', 'ঢাবি ৭ কলেজ-Business 2023–24', 'Diploma in Nursing 22-23']) {
    assert.equal(examRef(source), source);
  }
});
test('does not mislabel numbered practice exercises', () => {
  for (const source of ['Practice Set 1', 'Mock Test 2024', 'Sample Question 3', 'Exercise 10', 'Practice bank', 'বিগত বছরের Vocabulary', '', null, undefined]) {
    assert.equal(examRef(source), '');
  }
});
test('trims whitespace around references', () => {
  assert.equal(examRef('  CU-B 2022–23  '), 'CU-B 2022–23');
});
