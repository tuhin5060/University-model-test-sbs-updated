// QUESTION BANK REGISTRY
// ---------------------------------------------------------------------------
// Every topic lives in its own file in this folder. To add a NEW topic:
//   1. Copy `_template.js` to a new file, e.g. `preposition.js`, and fill it in.
//   2. Import it below and add it to the TOPICS list (the order here is the
//      order students see on the site).
// Nothing else needs to change: the home page, exam page, fun quiz, search and
// the server-side score checker all read from this list.
// Run `npm run check` afterwards: it catches missing answers, duplicates, etc.

import tense from './tense.js';
import sequenceOfTense from './sequence-of-tense.js';
import article from './article.js';
import noun from './noun.js';
import number from './number.js';
import gender from './gender.js';
import conditionalSentences from './conditional-sentences.js';
import hopeWish from './hope-wish.js';
import mixedEnglish from './mixed-english.js';
import adverb from './adverb.js';
import modalVerb from './modal-verb.js';
import causativeVerb from './causative-verb.js';
import subjunctiveVerb from './subjunctive-verb.js';

export const TOPICS_RAW = [
  tense,
  sequenceOfTense,
  article,
  noun,
  number,
  gender,
  conditionalSentences,
  hopeWish,
  mixedEnglish,
  adverb,
  modalVerb,
  causativeVerb,
  subjunctiveVerb,
];

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Topic groups. A topic file sets `group: 'memorising'` to appear under
// "Memorising"; everything else is Grammar. Group ids can be picked like a topic.
export const GROUPS = {
  grammar: { id: 'grammar', title: 'সব Grammar', short: 'Grammar', icon: '📘', bn: 'Tense, Article, Conditional ইত্যাদি মিলিয়ে' },
  memorising: { id: 'memorising', title: 'সব Memorising', short: 'Memorising', icon: '🧠', bn: 'Vocabulary, Synonym-Antonym ও Preposition মিলিয়ে' },
};

/** Does question q belong to the picked topic ('all', a group id or a topic id)? */
export function inTopic(q, topic) {
  return topic === 'all' || q.topicId === topic || (topic in GROUPS && q.group === topic);
}

/** Small, stable string hash (FNV-1a) so a question keeps its id when others are added or reordered. */
export function hashText(text) {
  let h = 0x811c9dc5;
  for (const ch of String(text)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

function normalise(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function answerIndex(answer) {
  if (Number.isInteger(answer)) return answer;
  return LETTERS.indexOf(String(answer).trim().toUpperCase());
}

/** Turn the human-friendly topic files into the shape the app and API use. */
export function buildBank(rawTopics) {
  const ids = new Set();
  const topics = [];
  const questions = [];
  for (const t of rawTopics) {
    const topic = {
      id: t.id,
      title: t.title,
      bn: t.bn || '',
      icon: t.icon || '📘',
      color: t.color || '#2f7d5b',
      subject: t.subject || 'English',
      group: GROUPS[t.group] ? t.group : 'grammar',
      tipBn: t.tipBn || '',
      count: 0,
    };
    for (const raw of t.questions || []) {
      const base = `${t.id}-${hashText(normalise(raw.q) + '|' + (raw.options || []).map(normalise).join('|'))}`;
      let id = base;
      for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
      ids.add(id);
      questions.push({
        id,
        topic: t.title,
        topicId: t.id,
        group: topic.group,
        q: raw.q,
        o: raw.options,
        a: answerIndex(raw.answer),
        e: raw.explain || '',
        bn: raw.explainBn || '',
        source: raw.source || 'Practice bank',
        units: raw.units || ['A', 'B', 'C', 'D'],
      });
      topic.count++;
    }
    topics.push(topic);
  }
  return { topics, questions };
}

export const { topics: TOPICS, questions: QUESTIONS } = buildBank(TOPICS_RAW);
export const QUESTION_MAP = new Map(QUESTIONS.map(q => [q.id, q]));
