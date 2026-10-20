# Changelog

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
