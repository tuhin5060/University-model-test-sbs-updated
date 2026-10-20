// Content checker — run after adding questions, topics, posts or universities:
//   npm run check
// Prints every problem with the file + question number so it is easy to fix.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOPICS_RAW, TOPICS, QUESTIONS } from '../data/questions/index.js';
import { POSTS, QUICK_TIPS } from '../data/posts.js';
import { UNIVERSITIES, ADMISSION_UPDATES } from '../data/universities.js';
import { CU_PHOTOS } from '../data/site.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const errors = [];
const warnings = [];
const err = m => errors.push(m);
const warn = m => warnings.push(m);

// Every topic file in data/questions must be registered in index.js.
const indexSrc = fs.readFileSync(path.join(root, 'data/questions/index.js'), 'utf8');
for (const f of fs.readdirSync(path.join(root, 'data/questions'))) {
  if (f === 'index.js' || f.startsWith('_') || !f.endsWith('.js')) continue;
  if (!indexSrc.includes(`'./${f}'`)) err(`data/questions/${f} is not imported in data/questions/index.js`);
}

const topicIds = new Set();
const seenText = new Map();
for (const t of TOPICS_RAW) {
  const where = `topic "${t.id}"`;
  if (!/^[a-z0-9-]+$/.test(t.id || '')) err(`${where}: id must be lowercase letters, numbers and dashes`);
  if (topicIds.has(t.id)) err(`${where}: duplicate topic id`);
  topicIds.add(t.id);
  if (!t.title) err(`${where}: missing title`);
  if (!Array.isArray(t.questions) || !t.questions.length) err(`${where}: has no questions`);
  (t.questions || []).forEach((q, i) => {
    const at = `${where} question #${i + 1}${q?.q ? ` ("${String(q.q).slice(0, 40)}…")` : ''}`;
    if (!q || typeof q.q !== 'string' || !q.q.trim()) return err(`${at}: missing question text "q"`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) return err(`${at}: needs 2–4 options`);
    if (q.options.some(o => typeof o !== 'string' || !o.trim())) err(`${at}: an option is empty`);
    if (new Set(q.options.map(o => o.trim().toLowerCase())).size !== q.options.length) err(`${at}: two options are identical`);
    const idx = Number.isInteger(q.answer) ? q.answer : 'ABCD'.indexOf(String(q.answer).toUpperCase());
    if (idx < 0 || idx >= q.options.length) err(`${at}: answer "${q.answer}" is not one of A–${'ABCD'[q.options.length - 1]}`);
    if (!q.explain) warn(`${at}: no explanation`);
    const key = `${q.q.trim().toLowerCase()}|${q.options.join('|').toLowerCase()}`;
    if (seenText.has(key)) warn(`${at}: same question and options as ${seenText.get(key)}`);
    else seenText.set(key, at);
  });
}
if (new Set(QUESTIONS.map(q => q.id)).size !== QUESTIONS.length) err('question ids are not unique');

const posts = new Set();
for (const p of POSTS) {
  const at = `post "${p.slug}"`;
  if (!/^[a-z0-9-]+$/.test(p.slug || '')) err(`${at}: slug must be lowercase letters, numbers and dashes`);
  if (posts.has(p.slug)) err(`${at}: duplicate slug`);
  posts.add(p.slug);
  for (const f of ['title', 'category', 'summary', 'body', 'date']) if (!p[f]) err(`${at}: missing ${f}`);
  if (Number.isNaN(Date.parse(p.date))) err(`${at}: date must look like 2026-10-20`);
  for (const m of String(p.body).matchAll(/\[\[quiz:([\w-]+)\]\]/g)) if (!topicIds.has(m[1])) err(`${at}: [[quiz:${m[1]}]] — no such topic`);
  for (const m of String(p.body).matchAll(/\]\((.*?)\)/g)) if (!m[1].startsWith('https://')) err(`${at}: link ${m[1]} must start with https://`);
}
if (!QUICK_TIPS.length) warn('QUICK_TIPS is empty');

const uniIds = new Set();
for (const u of UNIVERSITIES) {
  const at = `university "${u.id}"`;
  if (uniIds.has(u.id)) err(`${at}: duplicate id`);
  uniIds.add(u.id);
  for (const f of ['short', 'name', 'english', 'place', 'type', 'site', 'text']) if (!u[f]) err(`${at}: missing ${f}`);
  for (const f of ['site', 'admission']) if (u[f] && !/^https:\/\//.test(u[f])) err(`${at}: ${f} must be an https:// link`);
  for (const s of u.details?.sources || []) if (!/^https:\/\//.test(s.url)) err(`${at}: source ${s.url} must be https://`);
}
for (const u of ADMISSION_UPDATES) if (!/^https:\/\//.test(u.url)) err(`update "${u.id}": url must be https://`);
for (const p of CU_PHOTOS) {
  if (p.src && !fs.existsSync(path.join(root, p.src))) err(`photo ${p.src} does not exist`);
  if (!p.alt) err(`photo "${p.caption}": missing alt text`);
}

for (const w of warnings) console.warn('⚠️ ', w);
if (errors.length) {
  for (const e of errors) console.error('❌', e);
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`✅ Content OK: ${QUESTIONS.length} questions in ${TOPICS.length} topics, ${POSTS.length} posts, ${UNIVERSITIES.length} universities${warnings.length ? ` (${warnings.length} warnings)` : ''}.`);
