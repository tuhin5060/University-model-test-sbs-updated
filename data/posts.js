// TIPS & TRICKS POSTS (the blog)
// ---------------------------------------------------------------------------
// Add a new post by copying one { … } block. Newest `date` shows first.
// `body` uses a tiny Markdown subset:
//   ## Heading            ### Small heading
//   - bullet              1. numbered item
//   > Tip / callout       **bold**   `code`   [link text](https://…)
//   [[quiz:article]]      → a "practice this topic" button (use a topic id)
//   [[exam]] / [[fun]]    → buttons that open the Exam / Fun setup
// Leave a blank line between paragraphs. `featured: true` pins a post on the home page.

export const POSTS = [
  {
    slug: 'cu-english-roadmap',
    title: 'চবি English প্রস্তুতি: টপিক ধরে পুরো roadmap',
    category: 'CU English',
    emoji: '🗺️',
    featured: true,
    date: '2026-10-20',
    minutes: 6,
    summary: 'কোন grammar topic আগে, কোন vocabulary অংশ মুখস্থ, আর Cliffs TOEFL কোন পৃষ্ঠা থেকে কীভাবে পড়বে—সব এক জায়গায়।',
    body: `
শুরুর দিকে প্রস্তুতি অগোছালো লাগতেই পারে। ভয় নয়—টপিক ধরে এগোও। প্রতিদিন একটু পড়া, ভুলগুলোর revision আর বিগত বছরের প্রশ্ন solve করলে আত্মবিশ্বাস ধীরে ধীরে বাড়বে।

## ১. Grammar topics (বুঝে পড়ার অংশ)
প্রতিটি topic-এ আগে rule, তারপর দুটি উদাহরণ, তারপর exercise।

1. Identification of Parts of Speech
2. Countable & Uncountable Noun; Determiners
3. Subject–Verb Agreement
4. Causative Verb & Subjunctive Verb
5. Adverb & Inversion
6. Phrase, Clause & Reduced Clause
7. Dangling Modifier
8. Conditional Sentences
9. Embedded Questions & Tag Questions
10. Pinpoint Error & Correction
11. Parallelism
12. Affirmative & Negative Agreement
13. Redundancy
14. Miscellaneous

[[quiz:conditional-sentences]]

## ২. Memorizing parts (মুখস্থের অংশ)
এগুলো প্রতিদিন অল্প অল্প করে revision করতে হয়—একদিনে শেষ করার জিনিস নয়।

- Synonyms & Antonyms
- Appropriate Prepositions
- Group Verbs
- Idioms & Phrases
- Translation & Proverbs
- One-word Substitution

> প্রতিদিন ১০টি নতুন শব্দ + আগের দিনের ১০টি revision। সপ্তাহ শেষে নিজেই নিজের quiz নাও।

## ৩. Cliffs TOEFL কীভাবে পড়বে
### ধাপ ১ — Grammar Review (পৃষ্ঠা 39–228)
Rules ও examples পড়ো, প্রতিটি exercise নিজে solve করো। উত্তর মিলাও পৃষ্ঠা 238–258-এ। এর মধ্যেই Mini Tests 1–4 practice করো।

### ধাপ ২ — Passages (পৃষ্ঠা 361 থেকে)
Passage অর্থসহ বুঝে পড়ো, প্রশ্নগুলো নিজে করার চেষ্টা করো। ভুল হলে আবার passage-এ ফিরে যাও।

### ধাপ ৩ — Vocabulary & Preposition (পৃষ্ঠা 263–290)
Problem on Vocabulary and Preposition অংশ শেষ করো, তারপর পৃষ্ঠা 291–293-এর Mini Test 4 ও 5।

### ধাপ ৪ — Practice Tests
সময় ঠিক করে test দাও, তারপর answer key দিয়ে ভুল বিশ্লেষণ করো।

- Test 1: পৃষ্ঠা 315 · Answer: 498
- Test 2: পৃষ্ঠা 343 · Answer: 519
- Test 3: পৃষ্ঠা 374 · Answer: 541
- Test 4: পৃষ্ঠা 404 · Answer: 563
- Test 5: পৃষ্ঠা 434 · Answer: 585
- Test 6: পৃষ্ঠা 463 · Answer: 607

> পৃষ্ঠা নম্বর edition অনুযায়ী আলাদা হতে পারে—নিজের বইয়ের সূচিপত্রের সঙ্গে মিলিয়ে নিও।

## ৪. Previous questions ও revision
বিগত বছরের প্রশ্ন বারবার solve করো। ভুল হওয়া প্রশ্নগুলো আলাদা করে লিখে আবার practice করো—এই site-এর **“আমার ভুলগুলো”** অংশ ঠিক এই কাজটাই স্বয়ংক্রিয়ভাবে করে।

চাইলে BCS, Primary বা অন্যান্য চাকরির পরীক্ষার English প্রশ্নও practice করতে পারো—pattern বুঝতে কাজে দেয়।

[[exam]]
`,
  },
  {
    slug: 'mcq-exam-strategy',
    title: 'MCQ পরীক্ষায় সময় বাঁচানোর ৭টি কৌশল',
    category: 'পরীক্ষার কৌশল',
    emoji: '⏱️',
    featured: true,
    date: '2026-10-19',
    minutes: 5,
    summary: 'জানা প্রশ্ন আগে, কঠিন প্রশ্ন পরে; negative marking থাকলে আন্দাজে কখন উত্তর দেবে আর কখন দেবে না।',
    body: `
ভর্তি পরীক্ষায় অনেকেই প্রশ্ন জানে, কিন্তু সময়ের চাপে ভুল করে। নিচের অভ্যাসগুলো **Model Test** mode-এ বারবার practice করো—পরীক্ষার হলে তখন স্বাভাবিক লাগবে।

## ১. প্রথম চক্করে শুধু “নিশ্চিত” প্রশ্ন
প্রথমবার পুরো প্রশ্নপত্র দেখে যেগুলো নিশ্চিত জানো সেগুলো করে ফেলো। আটকে গেলে **flag** দিয়ে পরের প্রশ্নে যাও। Model Test-এ 🚩 বাটন ঠিক এই কাজের জন্য।

## ২. প্রতি প্রশ্নে সময়ের একটা সীমা রাখো
গড়ে একটি MCQ-তে কত সেকেন্ড পাবে তা আগে হিসাব করো। কোনো প্রশ্নে সীমার দ্বিগুণ সময় চলে গেলে ছেড়ে দাও, পরে ফিরে এসো।

## ৩. Blank-এর চারপাশের শব্দ পড়ো
Tense-এর প্রশ্নে **by the time, since, yesterday, already**—এ রকম সময়ের সংকেতই উত্তর বলে দেয়। Article-এ শব্দের প্রথম **sound** দেখো, বানান নয়।

[[quiz:tense]]

## ৪. Option বাদ দেওয়ার কৌশল
চারটির মধ্যে দুটি option প্রায়ই grammar অনুযায়ী অসম্ভব (যেমন *did not took*)। সেগুলো কেটে দিলে বাকি দুটির মধ্যে বাছাই অনেক সহজ।

## ৫. Negative marking থাকলে হিসাব করে ঝুঁকি নাও
যদি প্রতিটি ভুলে নম্বর কাটে, তাহলে পুরো আন্দাজে উত্তর না দেওয়াই ভালো। কিন্তু দুটি option বাদ দিতে পারলে সম্ভাবনা ৫০%—তখন উত্তর দেওয়া সাধারণত লাভজনক। তোমার ইউনিটে negative marking আছে কি না **official circular** থেকে দেখো।

> Model Test-এ “Negative marking (−0.25)” চালু করে practice করো—কতগুলো আন্দাজ তোমার score কমাচ্ছে নিজেই দেখতে পাবে।

## ৬. OMR-এ শেষে একসঙ্গে নয়
সব উত্তর শেষে একসঙ্গে bubble করলে সময় শেষ হয়ে যেতে পারে। কয়েকটি প্রশ্ন পরপর ভরাট করে ফেলো।

## ৭. পরীক্ষার পরে review-ই আসল পড়া
Result পাতায় **Wrong** filter দিয়ে শুধু ভুলগুলো দেখো, ব্যাখ্যা পড়ো, তারপর “ভুলগুলো আবার practice” চাপো।

[[exam]]
`,
  },
  {
    slug: 'article-cheatsheet',
    title: 'Article cheat-sheet: a, an, the—এক পাতায়',
    category: 'English',
    emoji: '🅰️',
    date: '2026-10-18',
    minutes: 5,
    summary: 'Question bank-এর সবচেয়ে বড় topic Article। ১০টি নিয়মেই বেশিরভাগ প্রশ্নের উত্তর মেলে।',
    body: `
এই site-এর question bank-এ Article-এর প্রশ্নই সবচেয়ে বেশি। নিয়মগুলো ছোট, কিন্তু প্রশ্নকর্তারা ফাঁদ পাতেন উচ্চারণ আর idiom দিয়ে।

## A না An? — বানান নয়, প্রথম sound
- **an** hour, **an** honest man, **an** M.A., **an** S.S.C. candidate (vowel sound)
- **a** university, **a** European, **a** one-taka note, **a** unique chance (consonant sound /j/, /w/)
- **a** PhD holder (/p/ sound)

## The বসে যখন noun নির্দিষ্ট
- আগে বলা হয়েছে বা clause দিয়ে নির্দিষ্ট: *the book you bought yesterday*
- Superlative: *the most beautiful*, *the longest river*
- একমাত্র: *the sun, the sky*, *the only day*
- নদী, সাগর, পর্বতমালা, গ্রন্থ: *the Nile, the Bay of Bengal, the Himalayas, the Mahabharata*
- বাদ্যযন্ত্র বাজানো: *play the flute*
- **the + adjective** = শ্রেণি: *the poor, the elderly*

## Article লাগে না
- খেলা: *play chess, hockey*
- ভাষা: *speak English*
- সাধারণ অর্থে abstract/uncountable noun: *Love is…*, *sugar*
- বেশিরভাগ দেশ, মহাদেশ: *Canada, South America* (কিন্তু *the USA, the UK*)
- appoint/elect-এর পরের পদ: *He was appointed head of the department*

## Idiom মুখস্থ রাখো
- in **a** nutshell · in **a** fix · in **the** long run · on **the** wane · take **the** bull by **the** horns
- **a** few / **a** little (কিছু আছে) বনাম few / little (প্রায় নেই)

> সন্দেহ হলে নিজেকে তিনটি প্রশ্ন করো: noun-টি নির্দিষ্ট? countable singular? প্রথম sound vowel?

[[quiz:article]]
`,
  },
  {
    slug: 'tense-signal-words',
    title: 'Tense চেনার signal words: এক নজরে',
    category: 'English',
    emoji: '⏳',
    date: '2026-10-17',
    minutes: 4,
    summary: 'Yesterday, since, by the time, had better—বাক্যের এই শব্দগুলোই সঠিক tense দেখিয়ে দেয়।',
    body: `
Tense-এর বেশিরভাগ প্রশ্নে বাক্যের ভেতরেই একটি “signal word” থাকে। সেটা খুঁজে পেলে অর্ধেক কাজ শেষ।

## Present
- **Universal truth / অভ্যাস** → present simple: *The sun rises in the east.*
- **Listen! Look! now, at the moment** → present continuous
- **since / for + এখন পর্যন্ত, already, just, yet** → present perfect: *She has lived here since 2020.*

## Past
- **yesterday, ago, last year, in 2010** → past simple (present perfect নয়)
- **at 8 pm last night, while** → past continuous
- দুটি অতীত ঘটনার **আগেরটি** → past perfect: *He had left before I arrived.*

## Future
- **By + ভবিষ্যৎ সময় / by the time + present** → future perfect: *By the time they arrive, I will have cleaned the room.*
- **before / after / when / until**-এর পরে future অর্থেও **present simple**: *before she is thirty*

## ফাঁদগুলো
- *It is high time / It is time* → past simple: *It is high time we left.*
- *had better / would rather* → base verb: *You had better go.*
- *as if / as though* → past (unreal): *He talks as if he knew everything.*
- Reporting verb past হলে সাধারণত backshift: *She said she would come.* (universal truth হলে বদলায় না)

[[quiz:tense]]
[[quiz:sequence-of-tense]]
`,
  },
  {
    slug: 'how-to-use-this-site',
    title: 'Fun Quiz নাকি Model Test? কখন কোনটা দেবে',
    category: 'শুরু করো',
    emoji: '🎯',
    date: '2026-10-20',
    minutes: 3,
    summary: 'তিনভাবে practice করা যায়—খেলার মতো Fun Quiz, আসল পরীক্ষার মতো Model Test, আর ধীরে বুঝে Practice।',
    body: `
## 🎮 Fun Quiz — শেখার নেশা ধরাতে
প্রতি প্রশ্নে countdown timer, ঠিক উত্তরে points, পরপর ঠিক হলে **streak bonus (x1.5, x2)**, আর দুটি lifeline: **50:50** ও **Freeze timer**। উত্তর দেওয়ার সঙ্গে সঙ্গে ব্যাখ্যা দেখায়। মন ক্লান্ত থাকলে বা নতুন topic শুরু করার সময় সেরা।

[[fun]]

## ⏱️ Model Test — আসল পরীক্ষার অনুশীলন
পুরো test-এর জন্য একটি timer, প্রশ্ন বাদ দিয়ে পরে ফেরা, 🚩 flag, question palette এবং চাইলে **negative marking**। Submit করার আগে কোনো উত্তর দেখায় না—ঠিক পরীক্ষার হলের মতো। শেষে topic-ভিত্তিক বিশ্লেষণ আর পূর্ণ answer key।

[[exam]]

## 📖 Practice — ধীরে, বুঝে
Timer নেই। প্রতিটি উত্তরের পরেই ইংরেজি ও সহজ বাংলা ব্যাখ্যা। নতুন rule শেখার সময় এটি ব্যবহার করো।

## 🔁 আমার ভুলগুলো
যে প্রশ্নে ভুল করো সেটি স্বয়ংক্রিয়ভাবে তোমার **ভুলের তালিকায়** জমা হয়। পরে দুবার ঠিক উত্তর দিলে তালিকা থেকে সরে যায়। সপ্তাহে অন্তত দুবার এই তালিকা practice করো।

## 📅 আজকের চ্যালেঞ্জ
প্রতিদিন সবার জন্য একই ৫টি প্রশ্ন। প্রতিদিন শেষ করলে তোমার 🔥 streak বাড়বে।

> তোমার অগ্রগতি এই browser-এ save থাকে। অন্য device-এ নিতে **অগ্রগতি → Backup** ব্যবহার করো।
`,
  },
  {
    slug: "where-to-start",
    title: "ভর্তি প্রস্তুতি শুরু করবে কোথা থেকে?",
    category: "শুরু করো",
    emoji: "🧭",
    date: '2026-10-16',
    minutes: 4,
    summary: "সবাই কী পড়ছে, সেটা দিয়ে নয়। তুমি কোথায় যেতে চাও আর এখন কোথায় আছ, সেটা দিয়েই শুরু।",
    body: `
## প্রথমে লক্ষ্য ছোট করো
পছন্দের তিনটি বিশ্ববিদ্যালয় লেখো। প্রতিটির official admission circular থেকে ইউনিট, যোগ্যতা ও পরীক্ষার বিষয় নোট করো। একেকটির নিয়ম একেক রকম হতে পারে।

## একটি ছোট diagnostic practice দাও
English-এর ১০টি প্রশ্ন দিয়ে শুরু করো। শুধু score দেখো না; কোন নিয়ম বুঝতে পারোনি সেটিও লিখে রাখো। সেটাই হবে তোমার প্রথম পড়ার তালিকা।

## বাস্তবসম্মত সময় ভাগ করো
প্রতিদিন নতুন concept, practice এবং আগের ভুল দেখার জন্য তিনটি ছোট session রাখো। ব্যস্ত দিনে ২০ মিনিট হলেও ধারাবাহিকতা বজায় রাখো।
`,
  },
  {
    slug: "previous",
    title: "আগের প্রশ্ন থেকে সত্যিই কী শেখা যায়?",
    category: "Previous Questions",
    emoji: "🗂️",
    date: '2026-10-16',
    minutes: 3,
    summary: "একই প্রশ্ন আবার আসবে—এমন নিশ্চয়তা নেই। কিন্তু প্রশ্নের ধরন চিনে নেওয়া প্রস্তুতিকে সহজ করে।",
    body: `
## আগে নিজে চেষ্টা করো
উত্তর না দেখে প্রশ্ন সমাধান করো। সময় কত লাগল আর কোথায় আটকে গেলে তা লিখে রাখো।

[[exam]]

## Source label বুঝে পড়ো
এখানে মূল uploaded bank-এর university ও session label রাখা হয়েছে। কিছু প্রশ্ন adapted, কিছু সাধারণ practice। এগুলো সম্পূর্ণ official question paper নয়।

## ভুল থেকে নিয়ম খুঁজে নাও
একটি ভুলের পাশে শুধু সঠিক উত্তর নয়, নিয়মের একটি ছোট উদাহরণ লেখো। দুই দিন পর আবার সেটি করো।
`,
  },
  {
    slug: "english",
    title: "English grammar: মুখস্থের সঙ্গে বোঝাপড়া",
    category: "English",
    emoji: "✍️",
    date: '2026-10-16',
    minutes: 4,
    summary: "একবারে সব rule নয়। একটি rule, দুটি উদাহরণ, তারপর ছোট practice।",
    body: `
## Tense: সময়ের সম্পর্ক ধরো
“By the time” দেখলে দুই ঘটনার মধ্যে কোনটি আগে শেষ হচ্ছে তা ভাবো। Yesterday-এর মতো finished time থাকলে simple past-এর ব্যবহার দেখো।

## Article: বানান নয়, sound
An honest man, কিন্তু a university। শব্দের প্রথম উচ্চারণ শুনে a অথবা an বেছে নাও।

## Noun ও number: নিজের error list বানাও
Advice সাধারণত uncountable; criterion-এর plural criteria। যে শব্দগুলোতে ভুল হয়, সেগুলো ছোট তালিকায় রাখো।

[[quiz:article]]
[[quiz:noun]]
`,
  },
  {
    slug: "routine",
    title: "৭ দিনের একটি সহজ revision plan",
    category: "পড়ার পরিকল্পনা",
    emoji: "📅",
    date: '2026-10-16',
    minutes: 3,
    summary: "এটি একটি নমুনা routine। তোমার syllabus, সময় ও দুর্বল জায়গা অনুযায়ী বদলে নাও।",
    body: `
## দিন ১–২: বুঝে পড়া
প্রথম দিন Tense, দ্বিতীয় দিন Article ও Noun। প্রতিদিন একটি ছোট practice set করো এবং ভুলগুলো লিখে রাখো।

## দিন ৩–৫: ভুল কমানো
Number, Gender ও Mixed English ভাগ করে পড়ো। আগের দিনগুলোর ভুল আবার solve করো।

## দিন ৬–৭: সময় মেপে পরীক্ষা
একটি English model practice দাও। পরদিন review করো—কোন প্রশ্নে সময় বেশি লেগেছে আর কোন concept আবার পড়া দরকার।

[[exam]]
`,
  },
  {
    slug: "examday",
    title: "পরীক্ষার আগের রাত ও সকালের checklist",
    category: "পরীক্ষার দিন",
    emoji: "🎒",
    date: '2026-10-16',
    minutes: 3,
    summary: "পরীক্ষার সকালে ছোট ছোট ঝামেলা যেন মনোযোগ কেড়ে না নেয়।",
    body: `
## নির্দেশনা দেখে ব্যাগ গুছাও
Admit card, প্রযোজ্য পরিচয়পত্র ও অনুমোদিত stationery রাখো। কোন জিনিস নেওয়া নিষেধ তা admit card ও official নির্দেশনা থেকে দেখো।

## যাতায়াত আগে ঠিক করো
কেন্দ্রের ঠিকানা, যাওয়ার পথ এবং প্রয়োজনীয় সময় লিখে রাখো। দূরের কেন্দ্র হলে থাকার ব্যবস্থাও আগেই ভাবো।

## শেষ রাতে নতুন অধ্যায় নয়
নিজের সংক্ষিপ্ত notes দেখো। যথেষ্ট বিশ্রাম নাও। হলে পৌঁছে প্রশ্ন ও marking instructions আগে পড়ো।
`,
  },
  {
    slug: "subject",
    title: "বিষয় নির্বাচন: নামের বাইরে কী দেখবে?",
    category: "বিশ্ববিদ্যালয় জীবন",
    emoji: "🎓",
    date: '2026-10-16',
    minutes: 4,
    summary: "পছন্দের subject মানে শুধু পরিচিত একটি নাম নয়—আগামী কয়েক বছর কী শিখবে, সেটাও জানা।",
    body: `
## Course outline দেখে নাও
Department website-এ curriculum থাকলে পড়ো। তোমার আগ্রহের সঙ্গে বিষয়গুলো মেলে কি না দেখো।

## খরচ ও পরিবেশ হিসাব করো
আবাসন, যাতায়াত এবং দৈনন্দিন খরচ নিয়ে পরিবারের সঙ্গে কথা বলো। শুধু বিশ্ববিদ্যালয়ের নাম দেখে সিদ্ধান্ত নিও না।

## শিক্ষার্থীদের অভিজ্ঞতা শুনো
বর্তমান বা সাবেক শিক্ষার্থীর সঙ্গে কথা বললে আগে context জেনে নাও। একজনের অভিজ্ঞতা সবার জন্য একই হবে না।
`,
  },
  {
    slug: "lastyear",
    title: "গত বছরের তথ্য কীভাবে কাজে লাগাবে?",
    category: "তথ্য যাচাই",
    emoji: "🔎",
    date: '2026-10-16',
    minutes: 3,
    summary: "পুরোনো circular একটি reference। বর্তমান বছরের eligibility বা deadline হিসেবে সেটি ব্যবহার করা যাবে না।",
    body: `
## Session লেখা আছে কি না দেখো
Circular বা result notice কোন academic session-এর, সেটি আগে যাচাই করো। বছর ও session এক জিনিস নয়।

## যে বিষয়গুলো তুলনা করতে পারো
প্রশ্নের গঠন, বিষয়ভিত্তিক প্রস্তুতি এবং আবেদন প্রক্রিয়া বোঝার জন্য পুরোনো notice কাজে লাগতে পারে। নতুন circular-এ পরিবর্তন আছে কি না দেখো।

## Cutoff ও student story যাচাই করো
Verified notice ছাড়া cutoff, chance score বা সফল শিক্ষার্থীর তথ্য এখানে প্রকাশ করা হয়নি। শিক্ষার্থীর গল্প যোগ করতে তার সম্মতি ও তথ্য যাচাই প্রয়োজন।
`,
  },
  {
    slug: "mindset",
    title: "একদিন খারাপ score হলে কী করবে?",
    category: "মনোবল",
    emoji: "💪",
    date: '2026-10-16',
    minutes: 2,
    summary: "একটি practice score তোমার পুরো প্রস্তুতির পরিচয় নয়। সেটি পরের কাজ বেছে নেওয়ার একটি সংকেত।",
    body: `
## ভুলের ধরন আলাদা করো
Concept না বোঝা, প্রশ্ন ভুল পড়া এবং সময় কম পাওয়া—এই তিন ধরনের ভুল আলাদা করে লেখো।

## পরের কাজ ছোট রাখো
আজ একটি দুর্বল topic পড়ো, তারপর পাঁচটি প্রশ্ন করো। সব একদিনে বদলানোর চেষ্টা করার দরকার নেই।

## নিজের অগ্রগতি দেখো
অন্যের score-এর বদলে নিজের আগের ভুল কতটা কমছে তা দেখো। পড়ার ফাঁকে বিশ্রামও routine-এর অংশ রাখো।
`,
  },
];

// One short tip is shown on the home page each day (rotates automatically).
export const QUICK_TIPS = [
  'An hour, a university: article বাছো প্রথম sound শুনে, বানান দেখে নয়।',
  'Yesterday, ago, last year থাকলে present perfect নয়—past simple।',
  'By the time + present simple → main clause-এ future perfect।',
  'It is high time-এর পরে verb-এর past form বসে: It is high time we started.',
  'Information, advice, furniture uncountable—এদের plural হয় না।',
  'Criterion → criteria, phenomenon → phenomena, datum → data।',
  'If I were you…—unreal present-এ সব subject-এর সঙ্গে were।',
  'Negative marking থাকলে পুরো আন্দাজ নয়; দুটি option বাদ দিতে পারলে তবেই ঝুঁকি নাও।',
  'প্রতিদিন ২০ মিনিট practice, সপ্তাহে একদিন পূর্ণ Model Test।',
  'ভুলগুলো ফেলে দিও না—“আমার ভুলগুলো” practice করলেই সবচেয়ে দ্রুত score বাড়ে।',
  'Play-এর পরে খেলার নাম হলে article লাগে না, বাদ্যযন্ত্র হলে the লাগে।',
  'Reporting verb past হলে will → would, can → could; universal truth বদলায় না।',
];
