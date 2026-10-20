// TEMPLATE FOR A NEW TOPIC — copy this file, rename it (e.g. `preposition.js`),
// then register it in `index.js`. Files starting with "_" are never loaded.
export default {
  id: 'preposition',               // lowercase, no spaces; used in links (#start/exam/preposition)
  title: 'Preposition',            // shown on the site
  bn: 'সঠিক preposition বাছাই',     // short Bangla description
  icon: '📍',                      // any emoji
  color: '#3a6ea5',                // card accent colour
  subject: 'English',              // groups topics on the home page: English, বাংলা, সাধারণ জ্ঞান…
  tipBn: 'Verb বা adjective-এর সঙ্গে কোন preposition বসে তা phrase হিসেবে মুখস্থ করো।',
  questions: [
    {
      q: 'He is good ____ mathematics.',
      options: ['in', 'at', 'on', 'with'],
      answer: 'B',                 // 'A' | 'B' | 'C' | 'D'
      explain: '“Good at” is the fixed expression for skill.',
      explainBn: 'দক্ষতা বোঝাতে good at ব্যবহার হয়।', // optional
      source: 'Practice bank',     // e.g. 'CU A Unit 2019–20'
      units: ['A', 'B'],           // optional; omit for all units
    },
  ],
};
