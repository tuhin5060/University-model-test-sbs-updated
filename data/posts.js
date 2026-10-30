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
    slug: 'cu-du-admission-english-important-topics',
    title: 'চবি ও ঢাবি ভর্তি পরীক্ষার English: আগের প্রশ্নে কোন topic বেশি এসেছে',
    category: 'CU English',
    emoji: '📊',
    featured: true,
    date: '2026-10-31',
    minutes: 5,
    summary: 'আমাদের question bank-এ চবি ও ঢাবির ১৭০টির বেশি আগের প্রশ্ন আছে। কোন grammar topic থেকে কতগুলো এসেছে, আর সেই হিসাবে প্রস্তুতি কোথা থেকে শুরু করবে।',
    body: `
চবি (চট্টগ্রাম বিশ্ববিদ্যালয়) আর ঢাবি (ঢাকা বিশ্ববিদ্যালয়) ভর্তি পরীক্ষার English অংশে কোন topic বেশি আসে—এটা জানলে প্রস্তুতির সময় অনেক বাঁচে। ক্যাম্পাসের পথে-র question bank-এ যেসব প্রশ্নের সঙ্গে চবি বা ঢাবির নাম ও বছর লেখা আছে, সেগুলো topic ধরে গুনে নিচের হিসাবটা বানানো।

> এটা শুধু আমাদের bank-এ থাকা প্রশ্নের হিসাব, পুরো পরীক্ষার সরকারি পরিসংখ্যান নয়। তবু কোন অংশে জোর দেবে, তার ভালো ইঙ্গিত দেয়।

## চবি (CU): যেসব topic থেকে বেশি প্রশ্ন
1. **Conditional Sentences** — ১৬টি
2. **Article** — ১৫টি
3. **Subjunctive** — ১১টি
4. **Comparison (Degree)** ও **Causative Verb** — ৭টি করে
5. **Adverb** ও **Tense** — ৬টি করে

[[quiz:conditional-sentences]]

## ঢাবি (DU): যেসব topic থেকে বেশি প্রশ্ন
1. **Conditional Sentences**, **Article** ও **Modal Verb** — ১৬টি করে
2. **Adverb** — ১৫টি
3. **Comparison (Degree)** ও **Noun** — ৬টি করে

[[quiz:article]]

## এই হিসাব থেকে কী শিখবে?
- **Conditional আর Article** দুই বিশ্ববিদ্যালয়েই সবার উপরে। এ দুটো আগে শেষ করো।
- চবিতে **Subjunctive আর Causative** (suggest that he go, had him do, got it done) বেশি দেখা যায়।
- ঢাবিতে **Modal Verb আর Adverb** (need not, had better, used to; hardly, enough) বেশি।
- **Comparison (Degree)** দুই জায়গাতেই নিয়মিত আসে—than, the more…the more, as…as মনে রাখো।

## প্রতিদিনের সহজ পরিকল্পনা
1. প্রথম সপ্তাহে Conditional, Article আর Comparison-এর নিয়ম পড়ো, প্রতিদিন একটি topic-এ Fun Quiz খেলো।
2. দ্বিতীয় সপ্তাহে Modal, Causative আর Subjunctive।
3. প্রতিদিন **Daily Quiz** দাও—সেখানে প্রতিদিন চবি-ঢাবির ১০টি আর অন্য বিশ্ববিদ্যালয়ের ১০টি আগের প্রশ্ন থাকে।
4. সপ্তাহে একদিন পুরো **Model Test** দাও (প্রতি প্রশ্নে ৩৬ সেকেন্ড, ভুলে −০.২৫)।

[[exam]]

> প্রতিটি প্রশ্নের পাশে 📌 চিহ্নে বিশ্ববিদ্যালয় ও বছর দেখা যায়। ভুল হওয়া প্রশ্ন “আমার ভুলগুলো”-তে জমা থাকে—পরীক্ষার আগে ওগুলোই আবার দেখো।
`,
  },
  {
    slug: 'degree-of-comparison-rules',
    title: 'Degree of Comparison-এর নিয়ম: ভর্তি পরীক্ষার ১০টি জরুরি rule (উদাহরণসহ)',
    category: 'English',
    emoji: '⚖️',
    featured: false,
    date: '2026-10-31',
    minutes: 6,
    summary: 'Positive, Comparative, Superlative, the more…the more, as…as, twice as many, that of/those of—ভর্তি পরীক্ষায় যেসব comparison-এর প্রশ্ন বারবার আসে, সহজ বাংলায় নিয়ম আর উদাহরণ।',
    body: `
Comparison বা Degree of Comparison ভর্তি পরীক্ষার English-এ প্রায় প্রতি বছর আসে। নিচের ১০টি নিয়ম জানলে বেশিরভাগ প্রশ্ন কয়েক সেকেন্ডে করা যায়।

## ১. than থাকলে comparative
**This river is wider than it was.** than-এর আগে সবসময় comparative (wider, better, more useful)।

## ২. more আর -er একসাথে নয়
more simpler, more worse, most narrowest—সব ভুল। simpler, worse, narrowest লেখো।

## ৩. দুজনের মধ্যে comparative, তিন বা বেশির মধ্যে superlative
- Of the two sisters, Sara is **the taller**.
- Of the three proposals, the third is **the most practical**.

## ৪. Irregular রূপগুলো মুখস্থ
- good/well → better → best
- bad → worse → worst (worser বলে কিছু নেই)
- little → less → least
- far → farther/further → farthest/furthest

## ৫. The more…, the more…
দুটি ঘটনা একসাথে বাড়ে-কমে বোঝাতে দুই অংশেই **the + comparative**:
**The more you read, the more you learn.** / **The sooner we leave, the earlier we arrive.**

## ৬. as…as আর not so…as
- সমান বোঝাতে: **as tall as**
- কম বোঝাতে: **not so beautiful as** (বা not as…as)
- verb-এর পরে adverb: He speaks **as fluently as** his sister.

## ৭. twice / three times / half + as many / as much
- countable (desks, employees): **twice as many** desks as…
- uncountable (water, money): **three times as much** water as…

## ৮. একই জিনিসের সাথে তুলনা: that of / those of
- The price of this laptop is lower than **that of** the desktop. (price-এর বদলে that)
- The designs of the new uniforms are simpler than **those of** the old ones. (plural)
- His car runs faster than **Mary’s** (= Mary’s car)।

## ৯. one of the + superlative + plural noun
**Dhaka is one of the busiest cities in Asia.** city নয়, cities।

## ১০. যাদের তুলনা হয় না
perfect, unique, complete, round—এদের আগে more/most বসে না। “a most perfect judge” নয়, **a perfect judge**।

> মনে রাখার কৌশল: প্রশ্নে than দেখলেই comparative, “of all / among / in the class” দেখলেই superlative, আর দুটো “the” দেখলে the more…the more।

[[quiz:comparison]]
`,
  },
  {
    slug: 'modal-verb-rules',
    title: 'Modal Verb-এর ব্যবহার: can, must, need, had better, used to—সহজ নিয়ম',
    category: 'English',
    emoji: '🎯',
    featured: false,
    date: '2026-10-31',
    minutes: 6,
    summary: 'must not আর need not-এর পার্থক্য, must have + V3, had better, would rather, be used to + verb-ing—ভর্তি পরীক্ষার Modal Verb প্রশ্নের নিয়ম আর ফাঁদ।',
    body: `
Modal verb-এর প্রশ্নে সবচেয়ে বড় নিয়ম একটাই: **modal-এর পরে সবসময় verb-এর base form** (to ছাড়া)। can go, must study, should see—can to go বা must studied ভুল।

## ১. must not বনাম need not
- **must not** = নিষেধ। You **must not** smoke in the hospital.
- **need not** = দরকার নেই। You **need not** hurry; we have plenty of time.
- need not-এর পরে s বা to বসে না: She **need not** wash (needs not / need not to ভুল)।

## ২. অতীত সম্পর্কে অনুমান: modal + have + V3
- দৃঢ় অনুমান: She **must have left** early.
- সম্ভাবনা: She **might have forgotten**.
- উচিত ছিল কিন্তু করোনি: You **should have told** me.
- দরকার ছিল না কিন্তু করেছ: You **needn’t have bought** tickets.

## ৩. had better (পরামর্শ বা সতর্কতা)
had better + base verb: You **had better see** a doctor. (had better to see / seen ভুল)

## ৪. would rather (পছন্দ)
- I **would rather** go by bus.
- I would rather starve **than beg**. (than-এর পরেও base verb)

## ৫. used to বনাম be used to
- **used to + base verb** = অতীতের অভ্যাস: My father **used to live** in Gazipur.
- **be used to + verb-ing** = অভ্যস্ত: She **is used to getting** up late.

## ৬. had to = অতীতের বাধ্যবাধকতা
The car broke down and we **had to** get a taxi.

## ৭. need আর dare: দুই রূপেই চলে
need ও dare কখনো modal (How **dare** he do that!), কখনো main verb (I need help)। তাই এদের semi-modal বলে।

## ৮. modal + passive
modal + be + V3: These differences **must be removed**.

> ফাঁদ চেনার কৌশল: option-এ “to” বা verb-এর -ed/-s রূপ modal-এর ঠিক পরে থাকলে সেটা প্রায় নিশ্চিতভাবে ভুল।

[[quiz:modal-verb]]
`,
  },
  {
    slug: 'causative-verb-rules',
    title: 'Causative Verb: have, get, make, let, help—এক পাতায় নিয়ম',
    category: 'English',
    emoji: '🔧',
    featured: false,
    date: '2026-10-31',
    minutes: 4,
    summary: 'কাউকে দিয়ে কাজ করানো বোঝাতে make/let/have + person + V1, get + person + to-verb, have/get + জিনিস + V3—ভর্তি পরীক্ষার Causative Verb প্রশ্নের সহজ ছক।',
    body: `
Causative verb দিয়ে বোঝানো হয় কাজটা নিজে না করে **অন্যকে দিয়ে করানো**। ভর্তি পরীক্ষায় এর প্রশ্ন প্রায় সবসময় এই চারটি ছকের একটি।

## ছক ১: make / let / have + ব্যক্তি + base verb
- They **made him repeat** the speech.
- Her father didn’t **let her go**.
- The manager **had the assistant prepare** the minutes.
এখানে verb-এর আগে **to বসে না**।

## ছক ২: get + ব্যক্তি + to + verb
- She **got the technician to fix** the printer.
- I will **get an electrician to mend** the heating.

## ছক ৩: have / get + জিনিস + V3 (কাজটা কেউ করে দিয়েছে)
- I **had my bicycle repaired**.
- It costs Tk 500 to **have a tooth filled**.
- He **got his leg broken** in an accident.

## ছক ৪: make-এর passive-এ to ফিরে আসে
- Active: They made us **run**.
- Passive: We were made **to run**.

## help: দুই রূপই ঠিক
help + object + base verb বা to-verb—দুটোই চলে: She helped me **carry / to carry** the bag। পরীক্ষায় যেটা option-এ আছে সেটাই নাও।

> মনে রাখো: পরের শব্দটা মানুষ হলে V1 (get হলে to + V1), জিনিস হলে V3।

[[quiz:causative-verb]]
`,
  },
  {
    slug: 'subjunctive-mood-rules',
    title: 'Subjunctive: suggest/insist that + base verb, wish, as if, It is time—সহজ নিয়ম',
    category: 'English',
    emoji: '📜',
    featured: false,
    date: '2026-10-31',
    minutes: 5,
    summary: 'The doctor suggested that he take rest—takes কেন নয়? suggest, recommend, insist, important that-এর পরে base verb, আর wish, as if, would rather, It is time-এর পরে past form।',
    body: `
Subjunctive-এর প্রশ্ন দেখতে কঠিন লাগে, কিন্তু নিয়ম মাত্র দুটি ভাগে।

## ভাগ ১: “that”-এর পরে base verb (mandative subjunctive)
এই শব্দগুলোর পরে that এলে subject যা-ই হোক, verb-এর **base form** বসে—s, -ed, will কিছুই না:

- verb: **suggest, recommend, insist, demand, request, order, urge, propose, require, advise**
- adjective: **important, necessary, essential, advisable, vital**

উদাহরণ:
- The doctor suggested that he **take** a rest. (takes / took নয়)
- It is necessary that she **find** the books.
- We urge that the boy **leave** now.
- Passive হলে **be + V3**: They requested that the meeting **be postponed**.
- Negative হলে **not + base verb**: The doctor suggested that she **not smoke**.

> British English-এ “should take”-ও চলে, তবে পরীক্ষায় সাধারণত শুধু base verb-টাই সঠিক উত্তর।

## ভাগ ২: অবাস্তব কল্পনায় past form
- **wish**: I wish I **knew** the answer. / I wish she **were** here.
- **If only**: If only I **had** more time!
- **as if / as though**: He talks as if he **were** the owner.
- **would rather + অন্য subject**: I would rather you **kept** it secret.
- **It is time**: It is time we **went** home.
- **If I were you**: সব subject-এর সাথে were।

## দ্রুত চেনার কৌশল
1. প্রশ্নে suggest/insist/important that দেখলে → base verb খোঁজো।
2. wish/as if/it is time দেখলে → past form বা were খোঁজো।

[[quiz:subjunctive-verb]]
`,
  },
  {
    slug: 'conditional-sentence-rules',
    title: 'Conditional Sentence-এর নিয়ম: If-এর ৪ ধরন, Were I, Had I, Should you',
    category: 'English',
    emoji: '🔀',
    featured: false,
    date: '2026-10-31',
    minutes: 5,
    summary: 'চবি ও ঢাবির আগের প্রশ্নে সবচেয়ে বেশি আসা topic Conditional। If-clause আর result clause-এর tense মিলানোর ৪টি ছক, inversion আর unless—সহজ বাংলায়।',
    body: `
আমাদের question bank-এ চবি ও ঢাবি দুই জায়গাতেই আগের প্রশ্নের সবচেয়ে বড় অংশ এসেছে Conditional থেকে। নিচের ছকগুলো মুখস্থ থাকলে বেশিরভাগ প্রশ্ন সহজ।

## ১. Zero conditional (চিরসত্য)
If + present, present: If you heat ice, it **melts**.

## ২. First conditional (সম্ভাব্য ভবিষ্যৎ)
If + present, **will** + V1: If it rains, we **will stay** home.

## ৩. Second conditional (বর্তমানের অবাস্তব কল্পনা)
If + past, **would** + V1: If I **were** rich, I **would buy** a car.
সব subject-এর সাথে **were**: If I were you…

## ৪. Third conditional (অতীতের অবাস্তব)
If + had + V3, **would have** + V3: If he **had worked** hard, he **would have passed**.

## If বাদ দিয়ে inversion
- Were I rich… = If I were rich…
- Had he worked hard… = If he had worked hard…
- Should you need help… = If you should need help…

## Unless = If…not
Unless you work hard, you will fail. (Unless-এর সাথে আবার not বসে না)

## ফাঁদ
- If-clause-এ সাধারণত will বসে না: If it **will rain** ভুল।
- result-এ would have থাকলে if-এ অবশ্যই had + V3।

> কৌশল: আগে result clause-এর verb দেখো—will, would, না would have? তা দেখেই if-clause-এর tense ঠিক করো।

[[quiz:conditional-sentences]]
`,
  },
  {
    slug: 'adjective-adverb-linking-verb',
    title: 'Adjective না Adverb? Linking verb (look, seem, taste) চেনার সহজ কৌশল',
    category: 'English',
    emoji: '🧭',
    featured: false,
    date: '2026-10-31',
    minutes: 4,
    summary: 'The soup tastes sweet, কিন্তু The chef tasted it carefully—কেন? hard/hardly, late/lately, fast, enough, so/such—ভর্তি পরীক্ষার Adjective-Adverb প্রশ্নের নিয়ম।',
    body: `
Adjective noun-কে বর্ণনা করে, adverb verb/adjective-কে। পরীক্ষার প্রশ্নে আসল পরীক্ষা হলো **verb-টা action না অবস্থা**।

## ১. Linking verb-এর পরে adjective
be, seem, appear, become, remain, look, sound, smell, taste, feel—এগুলো যখন অবস্থা বোঝায়, পরে **adjective**:
- The milk smells **sour**.
- The audience remained **silent**.
- He looked **exhausted**.

## ২. একই verb action হলে adverb
- The chef tasted the soup **carefully**. (chef চেখে দেখছে—action)
- The painter looked **thoughtfully** at the portrait. (তাকানো—action)

## ৩. যেসব শব্দে ফাঁদ বেশি
- **hard** = কঠোর পরিশ্রমে, **hardly** = প্রায় না।
- **late** = দেরিতে, **lately** = সম্প্রতি।
- **fast** নিজেই adverb—fastly বলে কিছু নেই।
- friendly, lovely, motherly -ly দিয়ে শেষ হলেও **adjective**।

## ৪. enough-এর জায়গা
- adjective/adverb-এর **পরে**: old **enough**, carefully **enough**
- noun-এর **আগে**: **enough** chairs

## ৫. so আর such
- so + adjective: The roads were **so icy** that…
- such + (a/an) + adjective + noun: It was **such an interesting** lecture that…
- uncountable noun: **such useful advice**

## ৬. Compound adjective-এ singular
a **three-hour** journey, a **five-star** hotel, an **eight-century-old** temple—hour/star/century singular, সাথে hyphen।

[[quiz:adverb]]

[[quiz:adjective]]
`,
  },
  {
    slug: 'because-of-no-sooner-hardly-rules',
    title: 'because না because of? No sooner…than, Hardly…when—সঠিক জোড়া',
    category: 'English',
    emoji: '🔗',
    featured: false,
    date: '2026-10-31',
    minutes: 3,
    summary: 'because-এর পরে পুরো clause, because of / due to-এর পরে noun। No sooner-এর সাথে than, Hardly ও Scarcely-এর সাথে when—উদাহরণসহ ছোট নিয়ম।',
    body: `
এই দুটো নিয়ম ছোট, কিন্তু ভর্তি পরীক্ষায় প্রায়ই ভুল হয়।

## because বনাম because of / due to
- **because + subject + verb**: The match was postponed **because it was raining**.
- **because of / due to + noun**: The concert was postponed **because of the heavy rain**. / The train was late **due to a signal failure**.
- despite of বলে কিছু নেই—**despite** বা **in spite of**।

## No sooner…than
- No sooner শুরুতে থাকলে **inversion**: No sooner **had** she sat down **than** the lights went out.
- than-এর জায়গায় when বা that ভুল।

## Hardly / Scarcely…when
- **Hardly had** we reached home **when** the storm began.
- **Scarcely had** the meeting started **when** the alarm sounded.
- এখানে than ভুল।

> মনে রাখার কৌশল: “No sooner” তুলনার মতো শোনায়, তাই than; “Hardly/Scarcely” সময় বোঝায়, তাই when।

[[quiz:conjunction]]
`,
  },
  {
    slug: 'online-admission-model-test',
    title: 'অনলাইনে ফ্রি বিশ্ববিদ্যালয় ভর্তি Model Test: কোথায়, কীভাবে দেবে (২০২৬)',
    category: 'শুরুর কথা',
    emoji: '⏱️',
    featured: false,
    date: '2026-10-23',
    minutes: 5,
    summary: 'চবি, ঢাবি, জাবি, রাবি-সহ বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English অংশের অনলাইন Model Test বিনামূল্যে—আসল পরীক্ষার মতো সময় আর −০.২৫ negative marking-সহ। ধাপে ধাপে নিয়ম।',
    body: `
ভর্তি পরীক্ষার আগে সবচেয়ে বড় প্রশ্ন: **“অনলাইনে ফ্রি Model Test কোথায় দেবো?”** ক্যাম্পাসের পথে-তে কোনো টাকা, app বা login password ছাড়াই phone থেকে বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English Model Test দেওয়া যায়।

## Model Test কেন আসল পরীক্ষার মতো?
- প্রতি প্রশ্নে **৩৬ সেকেন্ড**—ভর্তি পরীক্ষার গড় সময়ের মতো।
- প্রতি ভুলে **−০.২৫ নম্বর** (negative marking), উত্তর না দিলে কাটা যায় না।
- শেষে প্রতিটি প্রশ্নের সঠিক উত্তর আর **বাংলা ব্যাখ্যা**।
- চবি, ঢাবি, জাবি, রাবি, জবি, কুবিসহ বিভিন্ন বিশ্ববিদ্যালয়ের আগের প্রশ্ন থেকে বানানো ২০০০+ MCQ।

## ধাপে ধাপে Model Test দেওয়ার নিয়ম
1. Home page-এ **“⏱️ Model Test দাও”** চাপো।
2. Topic বেছে নাও—একটা topic (যেমন Tense), পুরো Grammar, পুরো Memorising, অথবা সব topic মিলিয়ে।
3. কয়টা প্রশ্ন দেবে বেছে নাও।
4. প্রথমবার নাম (আর চাইলে কলেজ) লেখো—তুমি একটা **roll** পাবে। নাম + roll লিখে রাখো; অন্য phone-এ এই দুটো দিলেই সব score ফিরে আসে।
5. Test শেষে score, ভুলগুলো আর ব্যাখ্যা দেখো। **Score tab**-এ দেখবে সবার মধ্যে তুমি কততম, আজকের Top Scorer কে।

[[exam]]

## Fun Quiz আর Model Test-এর পার্থক্য
- **Fun Quiz:** প্রতি প্রশ্নে ৩০ সেকেন্ড, দ্রুত সঠিক উত্তরে বেশি points—খেলার মতো অনুশীলন।
- **Model Test:** আসল পরীক্ষার নিয়ম—সময়, negative marking আর শতকরা নম্বর।

প্রতিদিন একটা Fun Quiz দিয়ে শুরু করো, সপ্তাহে ২–৩টা পূর্ণ Model Test দাও।

[[fun]]

## কোন topic থেকে শুরু করবো?
Topic অনুযায়ী সব প্রশ্ন, উত্তর আর ব্যাখ্যা একসাথে দেখতে চাইলে [সব MCQ topic](https://sbs-university-admission-model-test.vercel.app/mcq/) পাতা খোলো। নতুন হলে আগে [Tense MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/tense/) আর [Article MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/article/) দিয়ে শুরু করো।

> টিপ: Model Test-এ নিশ্চিত না হলে আন্দাজে উত্তর দিও না—৪টা ভুলে ১টা সঠিক উত্তরের নম্বর চলে যায়।
`,
  },
  {
    slug: 'admission-english-topic-wise-preparation',
    title: 'ভর্তি পরীক্ষার English প্রস্তুতি: Topic ধরে অনলাইনে MCQ practice (Grammar)',
    category: 'English',
    emoji: '📘',
    featured: false,
    date: '2026-10-23',
    minutes: 6,
    summary: 'Tense, Article, Noun, Conditional, Modal, Causative, Subjunctive, Adverb—বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English grammar কোন topic কীভাবে পড়বে আর কোথায় অনলাইনে test দেবে।',
    body: `
বিশ্ববিদ্যালয় ভর্তি পরীক্ষার English অংশে নম্বর আসে কয়েকটা নির্দিষ্ট grammar topic থেকে। একসাথে সব না পড়ে **topic ধরে** পড়লে আর প্রতিটা topic-এর পর ছোট একটা test দিলে মনে থাকে অনেক বেশি।

## প্রতিটা topic পড়ার ৩ ধাপ
1. Rule পড়ো (৫–১০ মিনিট)।
2. ওই topic-এর আগের ভর্তি পরীক্ষার প্রশ্ন উত্তর ও ব্যাখ্যাসহ দেখো।
3. ১০–২০টি প্রশ্নের Fun Quiz বা Model Test দাও, ভুলগুলো আবার পড়ো।

## Grammar topic অনুযায়ী অনলাইন test
- **Tense ও Sequence of Tense:** সবচেয়ে বেশি আসে। [Tense MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/tense/) · [Sequence of Tense MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/sequence-of-tense/)
- **Article:** a/an/the—sound দেখে, বানান নয়। [Article MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/article/)
- **Noun, Number, Gender:** countable/uncountable, plural ও gender। [Noun](https://sbs-university-admission-model-test.vercel.app/mcq/noun/) · [Number](https://sbs-university-admission-model-test.vercel.app/mcq/number/) · [Gender](https://sbs-university-admission-model-test.vercel.app/mcq/gender/)
- **Conditional Sentences ও Hope/Wish:** if-এর ৩ type আর wish-এর past form। [Conditional MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/conditional-sentences/) · [Hope & Wish MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/hope-wish/)
- **Modal, Causative ও Subjunctive Verb:** had better, would rather, make/let/have/get, suggest that + base verb। [Modal](https://sbs-university-admission-model-test.vercel.app/mcq/modal-verb/) · [Causative](https://sbs-university-admission-model-test.vercel.app/mcq/causative-verb/) · [Subjunctive](https://sbs-university-admission-model-test.vercel.app/mcq/subjunctive-verb/)
- **Adverb ও Inversion:** Only after, Never before, Little-এর পরে inversion। [Adverb MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/adverb/)
- **Mixed English:** সব topic মিলিয়ে আগের প্রশ্ন। [Mixed English MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/mixed-english/)

[[quiz:tense]]

## কত দিনে শেষ করবো?
প্রতিদিন ১–২টা topic ধরলে ২ সপ্তাহে পুরো grammar একবার শেষ হয়। তারপর “সব Grammar” বেছে Model Test দাও—কোন topic-এ দুর্বল, তা Score আর অগ্রগতি পাতায় দেখা যাবে।

[[exam]]

> টিপ: প্রতিটা প্রশ্নের নিচের বাংলা ব্যাখ্যা পড়ো—শুধু উত্তর মুখস্থ করলে প্রশ্ন একটু ঘুরিয়ে দিলেই ভুল হয়।
`,
  },
  {
    slug: 'vocabulary-synonym-antonym-preposition-preparation',
    title: 'ভর্তি পরীক্ষার Vocabulary: Synonym, Antonym, Idioms ও Preposition MCQ প্রস্তুতি',
    category: 'English',
    emoji: '🧠',
    featured: false,
    date: '2026-10-23',
    minutes: 5,
    summary: 'ভর্তি পরীক্ষার English-এর মুখস্থ অংশ—Synonym, Antonym, Word Meaning, BCS Vocabulary, Phrase & Idioms ও Appropriate Preposition—সহজে মনে রাখার কৌশল আর অনলাইন MCQ test।',
    body: `
Grammar বুঝে পড়তে হয়, কিন্তু Vocabulary আর Preposition হলো **মুখস্থের অংশ**। এখানে নম্বর তোলার উপায় একটাই: অল্প অল্প করে, প্রতিদিন, বারবার।

## প্রতিদিনের ২০ মিনিটের নিয়ম
1. প্রতিদিন ২০–৩০টি নতুন শব্দ।
2. প্রতিটি শব্দের সঙ্গে একটা বাংলা অর্থ আর একটা ছোট বাক্য।
3. পরের দিন আগের শব্দ দিয়ে ১০ প্রশ্নের Fun Quiz—ভুলগুলো আবার লিখে রাখো।

## Topic অনুযায়ী অনলাইন MCQ
- **Synonym (সমার্থক শব্দ):** ৫০০+ প্রশ্ন। [Synonym MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/vocab-synonym/)
- **Antonym (বিপরীত শব্দ):** [Antonym MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/vocab-antonym/)
- **Word Meaning:** [Word Meaning MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/vocab-meaning/)
- **BCS Synonym ও Antonym:** বারবার আসা কঠিন শব্দ। [BCS Vocabulary MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/vocab-bcs/)
- **Phrase & Idioms:** [Phrase & Idioms MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/phrase-idioms/)
- **Appropriate Preposition:** good at, afraid of, according to… [Preposition MCQ](https://sbs-university-admission-model-test.vercel.app/mcq/appropriate-preposition/)

[[quiz:vocab-synonym]]

## মনে রাখার ৩টি কৌশল
- **জোড়ায় পড়ো:** একটা শব্দের synonym আর antonym একসাথে (abundant = plentiful ≠ scarce)।
- **Preposition phrase হিসেবে:** শুধু “of” নয়, পুরো “afraid of” মুখস্থ করো।
- **শব্দতালিকা ব্যবহার করো:** site-এর 📖 শব্দতালিকা থেকে topic ধরে শব্দ দেখে নাও।

[[quiz:appropriate-preposition]]

> টিপ: Model Test-এ “সব Memorising” বেছে নাও—Synonym, Antonym, Idioms আর Preposition মিলিয়ে আসল পরীক্ষার মতো প্রশ্ন আসবে।
`,
  },
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
    category: 'শুরুর কথা',
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

## 📅 Daily Quiz
প্রতিদিন সবার জন্য একই ২০টি প্রশ্ন—চবি, ঢাবিসহ বিগত বছরের ভর্তি পরীক্ষা থেকে। ১২ মিনিট, প্রতি ভুলে −০.২৫, দিনে একবারই গণনা হয়। **Daily Quiz** পাতায় তারিখে চাপ দিলে সেদিনের প্রশ্ন, উত্তর আর সবার অবস্থান দেখবে। প্রতিদিন দিলে তোমার 🔥 streak বাড়বে; notification চালু করলে সকালে খবর পাবে।

> তোমার অগ্রগতি এই browser-এ save থাকে। অন্য device-এ নিতে **অগ্রগতি → Backup** ব্যবহার করো।
`,
  },
  {
    slug: "where-to-start",
    title: "ভর্তি প্রস্তুতি শুরু করবে কোথা থেকে?",
    category: "শুরুর কথা",
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
