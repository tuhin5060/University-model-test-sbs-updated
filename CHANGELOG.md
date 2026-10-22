# Changelog

## 2.5.3 — opens even on a weak connection
* Offline copy (`sw.js`): after the first visit, the page, styles, all
  modules and the hero photo are kept on the phone and served from there, so
  one stuck download on a weak mobile connection no longer leaves the page
  loading. The whole set of one version is stored together; a deploy changes
  `VERSION` (a hash of the files, written by `npm run sync`), the new set
  downloads in the background and a “নতুন আপডেট এসেছে · রিফ্রেশ করো” bar
  appears. `/api` is never cached. Google Fonts are kept on the phone too.
* If the app has not started after 12 s, the page says the connection is slow
  and offers a retry button instead of loading forever.
* `npm run check` fails if `sw.js` or the preload list is out of date.

## 2.5.2 — rank per topic on the Score page
* Score page: new **📚 Topic অনুযায়ী অবস্থান** list — for every topic (and
  mode) the student has played: the topic name, position among everyone on
  that topic (🥇 / 🥈 / 🥉 / #n, “৩ জনের মধ্যে ২য়”), best score and number of
  tests. A tap opens that topic's leaderboard. The two big cards now say they
  are the overall position (“সব topic মিলিয়ে”).
* `/api/scores?me=1` returns `topics` (mode, topic, tests, best, avg, rank, players).

## 2.5.1 — fixes after 2.5.0
* Code, styles and data are no longer served from a stale browser cache
  (only images are cached); `styles.css` / `main.js` carry `?v=` so a deploy
  reaches every phone at once. A stale style file had pushed the 6th bottom
  menu item onto a second row and hidden the community page.
* Bottom menu fits any number of items in one row.
* Home: Fun Quiz / Model Test buttons are smaller and side by side on phones.
* New roll: a card shows the student's ID (`Name.007`) with a copy button
  and a reminder to keep it; shorter roll instructions on the forms.
* Link preview: baseline JPEG `og-image.jpg` (90 KB), `og:image:secure_url`,
  shorter description — WhatsApp shows it reliably.
* Community page: shorter intro, status chips in one scrollable row.

## 2.5.0 — community, skip in Model Test, faster first load
* **Community** (`#community`, in the top and bottom menus and on the home
  page): ask a question under a topic with tags (or from any question in the
  answer sheet), reply, filter by ✅ solved / ❓ open, topic, tag or search.
  The asker marks the thread or one reply as the solution. Admin delete asks
  for the admin password (`ADMIN_PASSWORD`, set only in the host settings).
* Model Test: **এড়িয়ে যাও ⏭** on an unanswered question goes to the next
  unanswered one; at the end it offers to submit.
* Site name is now **ক্যাম্পাসের পথে** everywhere (page, link preview, logos).
* New link-preview image (CU gate + logo) and professional preview text.
* Faster, more reliable loading: Google Fonts no longer block the page, all
  modules are preloaded, code/data are reused from the browser cache.
* SEO: title, description, canonical URL, structured data, robots.txt, sitemap.
* Home headline: “স্বপ্নটা সেরা ক্যাম্পাসের, প্রস্তুতিও হোক সেরা।”
* Node.js 24.

## 2.4.0 — Memorising, roll numbers, Neon, Cloudflare + Vercel
* New **Memorising** section next to Grammar (pick a single topic or "সব
  Memorising"): Vocabulary Synonym (538), Antonym (330) and Word Meaning (122)
  from the ~1000-word list, BCS 10th–40th Synonym & Antonym (67), Appropriate
  Prepositions (200) and Phrase & Idioms (198). Every question has four options
  and a Bangla explanation of the answer and of each wrong option. Wrong Bangla
  meanings in the source lists were corrected; duplicates were removed.
* New শব্দতালিকা page (`#vocab`): 1049 words with Bangla meaning, synonyms and
  antonyms, search in English or Bangla, A–Z filter.
* Roll numbers: every student gets a unique roll (001, 002 …) shown as
  `Name.007`. The same name + roll on another phone restores scores and
  progress. A taken roll is refused with a free roll suggested.
* Score page: tests taken, best and average marks, correct/wrong totals and
  leaderboard position (#rank of N) for Fun Quiz and Model Test. The result
  page shows your position on that topic.
* A popup at the top tells everyone online when someone sets a new highest
  score ("🏆 Arman.007 Fun Quiz-এ Tense topic-এ সর্বোচ্চ …").
* Database moved from MongoDB to **Neon Postgres** (faster, one shared
  database). The same API code (`server/`) runs on Vercel (`api/`) and
  Cloudflare Pages (`functions/`). The API has no npm dependencies (Neon is
  reached with plain `fetch`), so the Cloudflare build works without
  `npm install`; Node.js 22 is pinned for both hosts.
* Dhaka University and Comilla University pages: key facts, latest QS / THE
  rankings with sources, and Wikimedia Commons photos with credits.
* Phones get the edge-to-edge header photo with the green fade again; desktop
  keeps the framed picture.

## 2.3.1 — logo
* New ক্যাম্পাস পথে logo: the CU main gate with a road leading through it
  toward a rising sun. Used in the header, as the favicon and as the phone
  home-screen icon (`assets/img/logo.svg`, `icon-192.png`, `icon-512.png`,
  `apple-touch-icon.png`). Full logo images for social media:
  `assets/img/campus-pothe-logo-light.png` / `-dark.png`.

## 2.3.0 — simpler start, fixed rules, Score tab
* Only two modes on the start screen: Fun Quiz and Model Test (Practice is
  gone; "retry my mistakes" still works from a result).
* Start screen order: 1 full name (required, remembered next time) → 2 topic →
  3 number of questions, then one start bar that shows what you picked.
  Starting without a name shows an error next to the name box.
* Fixed rules, no options: Fun Quiz 30 s per question; Model Test 36 s per
  question and −0.25 for every wrong answer. The server applies the same
  rules, so leaderboard scores compare fairly.
* New Score tab (bottom bar and header): your best scores and recent results,
  the leaderboard with a retry button, and a WhatsApp feedback button.
  Campus moved to a header icon on phones.
* Universities page: short filter labels that fit on a phone, one link per
  card (the card title) instead of a separate "বিস্তারিত" button.

## 2.2.1 — sharper header, cleaner footer
* Header: the CU gate photo is shown as a framed picture next to the headline
  on desktop (at its real resolution, so no more blurry stretched background);
  phones show it above the text. Same on the CU page.
* Footer: readable tagline, developer card (photo, name, initiative), green
  WhatsApp feedback button and the live visitor count side by side.

## 2.2.0 — at least 40 questions per topic, live visitors, feedback
* 146 new TOEFL-style practice questions, each with an English and a Bangla
  explanation: Hope & Wish 3 → 43, Conditional 15 → 42, Gender 20 → 42,
  Modal / Causative / Subjunctive 30 → 42, Number 31 → 42, Noun 32 → 42.
  Bank: 624 questions in 13 topics; every topic has at least 42.
* Removed a "plural of criterion" question that appeared in both Number and
  Mixed English; `npm run check` now flags duplicates across topics too.
* Live visitor count on the home page and footer — only real heartbeats from
  open tabs (`/api/visitors`, MongoDB). Hidden when the database is not set up.
* Developer photo and a WhatsApp feedback link in the footer and About page.

## 2.1.0 — 150 new questions, full answer review, cleaner buttons
### Questions
* 4 new topics: Adverb (60), Modal Verb (30), Causative Verb (30),
  Subjunctive (30), each with answer and explanation. The bank now has 479
  questions in 13 topics.
* Every question has its own explanation; new Bangla explanations for Tense,
  Sequence of Tense, Noun, Number, Gender, Mixed English and Article.
  `npm run check` now fails if a question has no explanation.
* Whole bank re-read: 25 duplicate Article questions merged (sources kept),
  ambiguous items rewritten (Article, Sequence of Tense, Number, Gender, Mixed,
  Noun), answer-key notes and repeated "Choose from:" lists removed.
### Answers are always visible
* Result page: the answer sheet comes right after the score; every wrong or
  skipped question shows "সঠিক উত্তর: X. option" plus the explanation (no
  more hidden/collapsed explanations). The topic leaderboard moved below it.
* Fun Quiz / Practice feedback names the correct option, not only its letter.
### Fewer, clearer buttons
* One start button per screen (in-card on desktop, floating on phones), one
  Submit in Model Test, no fake buttons on home mode cards, plain labels
  instead of filler text.
* Leaderboard errors explain themselves ("Network unavailable", "Leaderboard
  service is not configured yet").

## 2.0.3 — easier database setup
* The API finds the MongoDB connection string whether it is named
  `MONGODB_URI`, `MONGODB_URL`, `STORAGE_URL` or `<PREFIX>_URL` (Vercel's
  MongoDB Atlas integration), so no manual renaming is needed.

## 2.0.2 — new header photo
* The CU main gate photo is the header on the home and CU pages: responsive
  480/768/1113 px WebP (27–72 KB instead of 109 KB), preloaded, with an
  inline blurred placeholder. On phones the whole photo is shown above the
  headline instead of being cropped.

## 2.0.1 — review fixes
* In-page links (university section tabs, "skip to content") no longer open a
  "page not found" screen; sections land below the sticky header.
* Model Test: tapping your chosen answer again no longer erases it; use the
  "উত্তর মুছে ফেলো" link to clear an answer.
* Quitting a Fun Quiz / Practice before answering anything no longer saves an
  empty result.
* Older phone browsers (no `color-mix()` / `:has()`): solid header and tab bar,
  selected topic still highlighted.
* Leaderboard topic filter also includes v1 scores saved under topic titles.

## 2.0.0 — full redesign and restructure

### New experience
* New home page: full-width University of Chittagong hero, two clear modes
  (Fun Quiz / Model Test), daily challenge with streak, tip of the day, topic
  grid with your accuracy, CU photo gallery + facts + official links, featured
  tips, leaderboard tabs and an official-links strip.
* **Fun Quiz** is now reachable from the UI (before, the code existed but no
  button started it). 10/15/20 questions, 20 s or 30 s per question.
* **Model Test** rebuilt like a real exam: one question at a time, palette,
  flag, negative marking option, admission/relaxed pace, auto-submit, topic
  report, filterable answer sheet (wrong / skipped / correct / flagged).
* **Practice** mode, **My mistakes** bank and **retry wrong answers**.
* **Tips & Tricks** blog: the 8 old guides (which were hidden) are back as posts,
  plus 5 new posts. The CU English page became the "CU English roadmap" post.
* **Universities**: 10 more universities (JnU, KU, SUST, BUP, CoU, JKKNIU, IU,
  HSTU, JUST, CVASU) with official websites, an official link directory table,
  GST admission portal, interactive checklist, CU page with photo gallery.
* Progress page, backup/import, search (press `/`), light/dark/auto theme,
  share results, keyboard shortcuts, sound toggle, reduced-motion support.
* Mobile: bottom tab bar, sticky start button, bottom-sheet palette, no
  horizontal scrolling at 390 px. Desktop: top nav, sidebar palette, grids.

### Code structure
* `assets/app.js` (one 150 KB file with base64 images inside) split into ES
  modules: router, quiz engine, components, pages, libs.
* Images extracted from JS into `assets/img/*.webp`.
* Questions moved from one `Q(…)` file into **one readable file per topic**
  (`data/questions/*.js`) with a registry. Answers are letters (`"C"`).
  Bangla explanations that were hard-coded in app.js moved into the data.
* Stable question ids (hash of the text) — adding questions no longer shifts ids.
* Content checker (`npm run check`) for questions, posts, links and photos.

### Backend fixes
* Leaderboard `$group` used `'$ROOT'` instead of `'$$ROOT'` → fixed.
* Scores are recomputed on the server from the answer sheet (shared `scoring.js`);
  questions are validated against the bank and topic.
* Cookie ownership enforced for score submissions and profile updates.
* Player ids no longer exposed in leaderboard responses (`me` flag instead).
* Rate limiting (20 submissions / 10 min / student), duplicate-key safe inserts.
* Renaming yourself updates your leaderboard rows.
* Unused `@vercel/blob` dependency removed.

### Content fixes
* Article question "My elder brother is ___ M.A." listed option "a" twice;
  the 4th option is now "the" (answer B "an" unchanged).

### Migration notes
* Browser data from v1 (`campus-companion.v1`) is migrated automatically:
  name/student id, saved universities, checklist and result summaries. Old
  results don't have per-question answer sheets.
* Old routes (`#practice`, `#session`, `#saved`, `#updates`, `#more`) redirect.
* Database: no migration needed. Old `mode: "test"` rows count as Model Test.
