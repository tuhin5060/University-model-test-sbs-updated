# Content guide — adding questions, topics, tips and universities

Everything students see comes from the `data/` folder. You never need to touch
the app code to add content. After any change run:

```bash
npm run check
```

It tells you exactly which file and question number has a problem (missing
answer, duplicate options, unknown topic in a post, non-https link, …).

```
data/
├── questions/
│   ├── index.js            ← list of topics (order shown on the site)
│   ├── _template.js        ← copy this to start a new topic
│   ├── tense.js            ← one file per topic
│   ├── article.js
│   └── …
├── posts.js                ← Tips & Tricks blog posts + one-line daily tips
├── universities.js         ← university profiles, official links, admission resources
└── site.js                 ← site name, credits, CU photo gallery
```

---

## 1. Add questions to an existing topic

Open the topic file (e.g. `data/questions/tense.js`), go to the end of the
`questions: [ … ]` list and paste a new block **before** the closing `],`:

```js
    {
      q: "She ____ in Chattogram since 2020.",
      options: ["lives", "lived", "has lived", "is live"],
      answer: "C",
      explain: "Since + starting point with a state continuing to now takes present perfect.",
      explainBn: "Since দিয়ে শুরু থেকে এখন পর্যন্ত চলমান অবস্থা বোঝালে present perfect।",
      source: "CU A Unit 2019–20",
      units: ["A"],
    },
```

| field | required | notes |
|---|---|---|
| `q` | ✅ | Use `____` for the blank. |
| `options` | ✅ | 2–4 options, all different. |
| `answer` | ✅ | `"A"`, `"B"`, `"C"` or `"D"`. |
| `explain` | recommended | English (or Bangla) explanation shown after answering. |
| `explainBn` | optional | Simple Bangla note. If missing, the topic's `tipBn` is shown. |
| `source` | optional | e.g. `"CU A Unit 2016–17"`, `"DU-B: 19–20"`, `"Practice bank"`. |
| `units` | optional | e.g. `["A", "B"]`. Leave it out for all units. |

Question ids are created automatically from the question text, so adding,
deleting or reordering questions never breaks students' saved progress.
(Editing the text of a question gives it a new id — that's fine.)

## 2. Add a new topic (e.g. Preposition, Synonym, বাংলা, সাধারণ জ্ঞান)

1. Copy `data/questions/_template.js` → `data/questions/preposition.js`.
2. Fill in `id` (lowercase-with-dashes), `title`, `bn`, `icon`, `color`,
   `subject` and the questions.
3. Register it in `data/questions/index.js`:

   ```js
   import preposition from './preposition.js';
   export const TOPICS_RAW = [ tense, …, preposition ];
   ```

The new topic then appears automatically on the home page, the Fun Quiz /
Model Test / Practice setup, search, progress bars and the leaderboard filter.
The server-side score checker picks it up too.

## 3. Add a Tips & Tricks post

Open `data/posts.js` and copy a `{ … }` block inside `POSTS`:

```js
  {
    slug: 'preposition-tricks',          // used in the link: #tips/preposition-tricks
    title: 'Preposition মনে রাখার ৫টি কৌশল',
    category: 'English',                 // posts are filtered by category
    emoji: '📍',
    featured: false,                     // true = shown on the home page first
    date: '2026-11-01',                  // newest first
    minutes: 4,                          // reading time
    summary: 'এক লাইনের সারাংশ।',
    body: `
## প্রথম heading
সাধারণ paragraph। **Bold** লেখা যায়।

- bullet point
- আরেকটি

1. numbered
2. list

> টিপ বা সতর্কবার্তা (হলুদ বক্সে দেখাবে)

[[quiz:article]]
[[exam]]
`,
  },
```

Special lines inside `body`:

* `[[quiz:topic-id]]` → a card with **Fun** and **Test** buttons for that topic.
* `[[exam]]` / `[[fun]]` → a button to the Model Test / Fun Quiz setup.
* `[text](https://…)` → an external link (must be https).

Short one-line tips for the "আজকের টিপ" box are in `QUICK_TIPS` at the end of
the same file; one is shown per day.

## 4. Universities and official links

`data/universities.js` has one object per university. The minimum is:

```js
  {
    id: 'pstu', short: 'PSTU', name: 'পটুয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়',
    english: 'Patuakhali Science and Technology University', place: 'দুমকি, পটুয়াখালী',
    type: 'বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', site: 'https://www.pstu.ac.bd/',
    admission: 'https://…',   // optional: official admission portal
    text: 'এক-দুই লাইনের পরিচিতি।',
  },
```

Add a `details` object (see CU or DU) for the full profile page with location,
process, documents and sources. **Only publish dates, fees, seats or cut-offs
with an official source**, and update `CONTENT_UPDATED` at the top.

## 5. Photos

Put local images in `assets/img/` (WebP, ~1280px wide, under 200 KB) and list
them in `CU_PHOTOS` in `data/site.js` with `alt`, `caption` and `credit`. A
`remote` Wikimedia Commons URL can be added; the site shows the local image
first and swaps to the bigger photo if it loads. Always keep the credit link and
record the licence in `ASSET_MANIFEST.md`.

---

## Prompt for ChatGPT (or any AI) to write new questions

Copy this, fill in the topic and paste the source questions:

```text
Convert the following admission-test MCQs into JavaScript objects for my
question bank. Output ONLY the objects, comma-separated, in exactly this format:

    {
      q: "question text with ____ for the blank",
      options: ["option A", "option B", "option C", "option D"],
      answer: "B",
      explain: "One-sentence English explanation of the rule.",
      explainBn: "এক লাইনে সহজ বাংলা ব্যাখ্যা।",
      source: "University Unit Session, e.g. CU A Unit 2019–20 (or Practice bank)",
      units: ["A"],
    },

Rules: exactly 4 different options; answer is a letter A–D; double-check every
answer; keep the original wording of real exam questions; if unsure of the
source write "Practice bank"; omit units if it applies to all units.

Topic: <Preposition>
Questions:
<paste here>
```

Paste the result at the end of the topic file and run `npm run check`.
