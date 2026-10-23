// Public tags never show the full name (full name + roll signs a student in).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicName, publicTag } from '../assets/js/shared/names.js';

test('only the last word of the name is public; one-word names show just the first letter', () => {
  assert.equal(publicTag('Rahim Uddin', 7), 'Uddin.007');
  assert.equal(publicTag('  Md.  Abdur   Rahim ', 1234), 'Rahim.1234');
  assert.equal(publicTag('মোঃ রহিম উদ্দিন', 12), 'উদ্দিন.012');
  assert.equal(publicName('Arman'), 'A•••', 'a one-word name is the whole sign-in name');
  assert.equal(publicName('আরমান'), 'আ•••');
});
