# Changelog

## 2.11.0 — how many visited today
* Under “N জন এখন অনলাইনে” (home page and footer) a small line now shows
  “আজ ভিজিট করেছেন N জন”: the number of different browsers that opened the site
  since midnight Bangladesh time. It is counted by the server from the same
  once-a-minute heartbeat (new `daily_visits` table, one row per browser per day,
  rows older than yesterday removed), not estimated; leaving the site does not lower
  it. Like the online count it stays hidden when the server cannot be reached.

## 2.10.0 — points add up; Model Test skip and submit; tidier setup
* Leaderboard: every test’s points are added to the student’s total (more tests, more
  points), one main board “🏅 সব test” with Fun / Model Test filters and the topic
  filter. Rows show total points, number of tests and accuracy. Fun Quiz keeps its
  points; Model Test gives +20 per correct and −5 per wrong (the −0.25 rule ×20),
  never below 0 (`attemptPoints` in shared/scoring.js and the same rule in SQL).
  Nothing in the database changed: totals are computed from the stored tests, so all
  earlier tests count under the same rule. Score page: total points and position,
  then Fun / Model Test, then position per topic. A result shows “+N points”, the
  new total and the position.
* Model Test: “এড়িয়ে যাও” moves forward only; at the end of the paper it offers to
  submit (after 10 skips in a 10-question test) instead of cycling back to the start.
  A “✅ এখনই Submit করো” button is always under the question.
* Setup: 1 name → 2 number of questions → 3 topic, with a search box over the topics.
* A phone whose student the database does not know (e.g. signed up before the move to
  Neon) signs up again with the same id, name and roll, then sends its scores; a score
  refused because the browser’s cookie belongs to another student signs in again with
  name + roll and is resent.

## 2.9.3 — every name and score reaches the database (review fixes)
* Merging the server’s progress copy sorted by a number read as a date (no effect), so a
  result finished offline could land past the 15 kept answer sheets and lose its answers —
  never sent. Fixed the sort; a result not yet sent always keeps its answers and is never
  trimmed (`trimHistory`).
* A test finished offline no longer comes back as “unfinished” from the older server copy.
* Another name on a browser whose previous student still has a sign-up or scores waiting:
  those go first; while that is impossible (offline) the switch is refused with the reason.
  A failed sign-in with a roll never continues as the previous student.
* Sign-up with `newId` is also idempotent when the browser holds another student’s cookie
  (shared phones); a pending sign-up keeps a handed-out roll; a test running while it
  completes is credited to the right id; a 403 for a student not signed in now is retried
  later instead of given up.
* Community posts wait for a pending sign-up. API calls give up after 20 s; the outbox
  starts at once and sends only from the tab in front.
* sw.js: only the leaderboard is kept for offline (community answers carry a per-viewer
  flag); images are cache-first. Community filters work on older iPhones (no `qs.size`).

## 2.9.2 — updates reach desktop tabs too
* A tab left open (typical on desktop) now looks for a new version when it is shown
  again and every 30 minutes, not only when the page is opened.
* When the new version has downloaded, the page switches to it by itself; only during
  a test or while something is being typed does it show “রিফ্রেশ করো” instead.

## 2.9.1 — production checks, questions-only pushes
* Phones: scrolling the college list with a finger no longer picks the college under
  the finger (touch chooses on a real tap; the mouse still on press).
* Generated files can no longer be forgotten: Vercel’s build runs
  `npm run sync && npm run check` (vercel.json), and on every push to `main` the
  GitHub check workflow runs `npm run sync` and commits the result for Cloudflare
  Pages, so a push that only adds MCQs (even from the GitHub website) reaches phones.
* Checked: all pages on PC, iPhone and Android sizes without errors or sideways
  scrolling; sign-up → Model Test → leaderboard on each; Neon and the functions
  both in iad1; Neon free quota not exceeded.

## 2.9.0 — works offline and through database trouble
* Offline outbox (`assets/js/lib/outbox.js`): with no network or a failing server, a
  new student still starts (the sign-up waits on the phone with its `newId`) and every
  Fun Quiz / Model Test score is kept; both go out by themselves at start, when the
  phone is back online, when the tab is shown again and every minute while waiting.
  The server ignores repeats, so nothing is counted twice.
* A bar under the header: “📴 অফলাইন …” or “⏳ … পাঠানোর অপেক্ষায় · এখনই পাঠাও”.
  A score the server refuses for good (e.g. another student’s cookie) is not retried.
* sw.js keeps the last leaderboard and community lists (nothing personal) and shows them
  when offline or when the server fails (“📴 শেষবার লোড হওয়া তালিকা”); images are
  kept after the first view. All questions were already stored, so every practice mode,
  Fun Quiz and Model Test runs offline.
* Why saving failed on a phone is noted there and sent with the next heartbeat to the
  server log as “client save problem (iPhone/Android …)”, to find device-specific issues.
* Older iPhones: no `Array.prototype.at`, and the new-roll card falls back to an alert
  where `<dialog>` is missing (before iOS 15.4).

## 2.8.4 — names and scores reach the server on slow networks and iPhones
* Sign-up waits up to 15 s and tries once more by itself; the browser picks the new
  student’s id, so a sign-up sent twice still makes one student (`newId`).
* If the server still cannot be reached, Start asks “আবার চেষ্টা / save ছাড়াই শুরু”
  instead of silently starting a test whose score is never saved; refusals (too many
  tries, cross-site) show their real reason.
* A result saved only on the device gets a “… নামে পাঠাও” button once the name is saved.
* Per-address limits raised for mobile networks (many phones share one address):
  300 sign-ups/hour, 300 sign-ins and 600 scores per 10 min.
* Requests marked `Sec-Fetch-Site: same-origin` are always accepted (Safari privacy
  modes may send `Origin: null`).
* Cold starts: the schema statements run only when they changed (version in `settings`).
* Messenger/Facebook “open in Chrome” bar and switch: Android only.

## 2.8.3 — Model Test submit works in every browser
* Submit, “শেষ করো”, “বের হও”, starting a new test over an unfinished one, a new
  roll and the progress reset now ask on the page itself instead of the browser’s
  `confirm()` popup, which Messenger/Facebook in-app browsers can block (it then
  silently answered “no”, so Submit or Start looked dead).
* The database schema step retries once, so the first requests after a deploy no
  longer fail when two fresh instances create a new table at the same moment.
* `#backup`: “📊 Database কতটুকু ভরেছে?” shows storage used of the Neon free 1 GB
  and row counts (admin password).
* `#sbs`: the Facebook page box is gone; just the Facebook button (no `frame-src`).

## 2.8.2 — SBS Students’ Association
* New page `#sbs`: who SBS is (Chattogram University students from Bhatiary,
  Sonaichhari and Salimpur, Sitakunda), what it does (admission help and exam-day
  travel, skill sessions, social work, SSC outreach, iftar and picnics) and
  Facebook’s own page box with the latest posts of facebook.com/SBS1995.CU.
* Home page card, hero line, About page and footer link to it.
* CSP allows framing from www.facebook.com / web.facebook.com only (`frame-src`).

## 2.8.1 — a roll you were given, or an automatic one
* New students can type a roll the admin handed out (e.g. 2150): if nobody has it,
  the form asks “এই roll দিয়ে নতুন ID খুলবে?” and registers with it. An empty roll
  still gives one automatically; a roll that belongs to someone else is refused.
* Automatic rolls are now the **lowest free number** (001, 004 …) instead of
  “highest + 1”, so handed-out rolls in a higher range are never taken.

## 2.8.0 — security layers, Chattogram city colleges
* Strict Content-Security-Policy on Vercel and Cloudflare (hashes of the inline
  scripts kept current by `npm run sync`, checked by the tests), no framing,
  `Cross-Origin-Opener-Policy`; inline `onclick`/`onload` handlers removed.
* POST requests from other websites are refused (CSRF).
* Rate limits per address (`server/ratelimit.js`, table `hits`): admin password
  lock-out after 10 wrong tries in 15 min (backup + community delete), sign-ups,
  sign-ins, community posts, scores, notification sign-ups.
* The leaderboard response is the same for everyone (the browser marks its own
  row) and cached 20 s at the edge — a flood of requests no longer reaches Neon.
* `npm run dev` sends the same security headers as Vercel.
* Colleges: 12 more Chattogram city colleges with Bangla names (Bangla names are
  shown in the picker and searchable), 112 in all.

## 2.7.0 — college on the profile
* Registration asks for the college: type one word (“city”, “cadet”, “mohsin”,
  “চট্টগ্রাম”) and every matching college from `data/colleges.js` (100 colleges:
  Chattogram division in detail, the best-known in Dhaka and the other divisions,
  all cadet colleges) is listed; a college not in the list can be kept as typed.
* Students who registered earlier are asked once (“তোমার কলেজ যোগ করো”); signing
  in with a roll adds it too if missing.
* Leaderboard rows show the short form (“🏫 City College Ctg”); tapping a row
  opens the full name, tests and date. The Score page shows it under the name.
* Server: `students.college` (added automatically), returned by `/api/profile`
  and the leaderboard; included in the backup and the D1 converter.

## 2.6.4 — timer in practice
* আজকের চ্যালেঞ্জ now really is “৫টি প্রশ্ন, ২ মিনিট”: a 2:00 countdown in the
  top bar that submits automatically when it ends.
* Other practice (e.g. “ভুলগুলো আবার”) shows a running clock of the time taken;
  the result page shows the total, as before.

## 2.6.3 — simpler name + roll, open in Chrome, new footer photo
* The sign-in block is now just “তোমার নাম লিখো”: name and an optional
  **আগের Roll (থাকলে)**. Empty → a new roll and the ID card; a roll → sign in to
  that ID (never creates a new student). The ID is then kept in the browser, so the
  form only shows “✅ তুমি: Name.007 · অন্য নাম/roll”.
* Opened inside Messenger / Facebook / Instagram: on Android the site switches to
  Chrome once (after it has loaded); a bar with “Chrome-এ খোলো” (Android) or
  “Safari-তে খোলো” + menu hint (iPhone) stays as a fallback (`lib/inapp.js`).
  Those in-app browsers keep storage apart from Chrome and have no notifications.
* Footer: new developer photo — face and shoulders from the original photo,
  160×160 WebP (7 KB), 60 px circle.

## 2.6.2 — clear sign-in on another phone
* “তুমি কে?” block on the Fun Quiz / Model Test form and the community forms:
  signed in → “✅ তুমি: Name.007 · অন্য ID”; otherwise two choices —
  **🆕 প্রথমবার** (only a name; a new roll and the ID card) or **🔑 আগে খেলেছি**
  (name + roll; pasting the whole ID “Name.007” fills both).
* “আগে খেলেছি” never creates a new student. A wrong name says so with a hint
  (“K•••• H••••”), an unknown roll says the roll has no student — instead of the
  old “roll taken, take 003” that pushed people into a second profile.
* Score page: “🔑 আগে খেলেছ?” sign-in card when nobody is signed in on the device.
* Shared code: `assets/js/lib/identity.js`; server: `POST /api/profile { login: true }`.

## 2.6.1 — data backup and the way to Cloudflare D1
* Admin **data backup** (`#backup`, link at the bottom of About): with the admin
  password, every stored table (students, scores, progress, community,
  notification subscriptions, settings) downloads as one JSON file.
* `scripts/backup-to-d1.mjs` turns that file into SQL for Cloudflare D1 (same
  tables and columns, ids and rolls kept). `tests/backup.test.mjs` loads the
  result into SQLite and checks every row and link. Guide: `docs/MIGRATE_TO_D1.md`.
* Admin password check moved to `server/admin.js` (community delete + backup).

## 2.6.0 — daily reminder notifications
* 🔔 Browser notifications: every day at 8 PM (Bangladesh) a short practice
  reminder (rotating: Model Test, daily challenge, Fun Quiz, vocabulary). Students
  who already took a test that day are skipped. When a deploy adds a new topic,
  the next 8 PM message announces it to everyone instead.
* Turned on from a small card shown after a test (at most once a week until
  answered) or the line under the home page's daily challenge, which also has
  “পরীক্ষা করো” (send a test notification now) and “বন্ধ করো”. iPhone users
  are told to add the site to the Home Screen first.
* Server: `server/routes/push.js` (`/api/push`, `/api/push-cron`), tables
  `push_subs` and `settings`. Pushes carry no payload; the service worker asks
  `/api/push?message=1` what to show. Signed with VAPID using WebCrypto only.
  Only real push services (Google, Mozilla, Microsoft, Apple) are contacted.

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
