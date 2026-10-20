# ক্যাম্পাস পথে — University Admission Practice

A Bangla-first university admission companion, built around the University of
Chittagong: English MCQ practice that feels like a game **and** like the real
exam, a Tips & Tricks blog, and official links for 18 universities.

## What students get

| | |
|---|---|
| 🎮 **Fun Quiz** | Per-question countdown (20/30 s), points, streak bonus (x1.5 / x2), 50:50 and Freeze lifelines, sounds + confetti, instant explanation, leaderboard. |
| ⏱️ **Model Test** | One timer for the whole test (admission pace 36 s/question or relaxed 60 s), question palette, 🚩 flag for review, optional −0.25 negative marking, auto-submit on time-up, topic-wise report and full answer sheet. |
| 📖 **Practice** | No timer, explanation after every answer. |
| 🔁 **My mistakes** | Wrong answers are collected automatically; two correct answers later remove them. |
| 📅 **Daily challenge** | The same 5 questions for everyone each day, with a 🔥 day streak. |
| 💡 **Tips & Tricks** | 13 posts (CU English roadmap, MCQ strategy, Article & Tense cheat-sheets, routines, exam-day checklist …) with "practice this topic" buttons inside posts. |
| 🏛️ **Universities** | CU spotlight with photo gallery, detailed profiles (CU, DU, RU, JU, CUET, BUET, KUET, RUET), 10 more universities, an official link directory, admission resources and a personal checklist. |
| 📊 **Progress** | Accuracy per topic, history, results review, backup/import. Everything is stored in the browser. |

Mobile first (bottom tab bar, big tap targets, sticky start button, bottom-sheet
question palette) and a full desktop layout (top nav, side palette, multi-column
grids). Light/dark/auto theme, keyboard shortcuts (A–D / 1–4, Enter, ←/→, F),
reduced-motion support.

## Project structure

```
index.html                  App shell (header, footer, mobile tab bar)
assets/
  css/styles.css            Design system + all styles (tokens, light/dark)
  img/                      Local images (CU photos, favicon)
  js/
    main.js                 Router (#hash routes), global events, theme, search
    quiz.js                 Quiz engine: sessions, answers, timers, finishing
    components.js           Shared HTML pieces (cards, leaderboard, photos…)
    shared/scoring.js       Scoring rules — used by browser AND server
    lib/                    dom helpers, local storage, API calls, sound/confetti
    pages/                  One file per page: home, start, play, result,
                            tips, universities, progress, misc
data/                       ← ALL CONTENT. See CONTENT_GUIDE.md
  questions/*.js            One file per topic (354 questions, 9 topics)
  posts.js                  Tips & Tricks posts
  universities.js           Universities, official links, resources
  site.js                   Site name, credits, CU photos
api/
  profile.js                Student name/avatar (cookie-based identity)
  scores.js                 Leaderboard: validates answer sheet, recomputes score
lib/
  mongodb.js                MongoDB connection (Vercel pooled)
  http.js                   Cookie / JSON helpers
  memory-db.js              In-memory DB for local dev + tests
scripts/serve.mjs           Local dev server (static + API)
tests/                      Content checker, unit/API tests, browser e2e
tense-express/              Old URL → redirects to Fun Quiz (Tense); classic.html keeps the old game
```

No build step and no framework: plain HTML, CSS and ES modules, so content can
be edited directly on GitHub and Vercel redeploys.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000 — works offline with an in-memory DB
npm run check        # content checker + unit/API tests
npm run test:e2e     # optional browser test (needs: npm i -D playwright && npx playwright install chromium)
```

Without `MONGODB_URI` the dev server uses an in-memory database, so the
leaderboard works locally (it resets on restart). Set `MONGODB_URI` in a local
`.env`-style environment to use a real database.

## Deploy on Vercel

* Framework preset: **Other**. Build command: *(empty)*. Output directory: `.`
* Environment variables:
  * `MONGODB_URI` — MongoDB Atlas connection string (**Sensitive**, server only).
  * `MONGODB_DB` — `admission_companion`.
* MongoDB Atlas → Network Access must allow Vercel.
* Enable Web Analytics in the Vercel dashboard (the script tag is already in `index.html`).
* Node.js 20 or newer.

Existing data keeps working: old `test` scores appear on the Model Test board,
old student cookies/profiles are reused, and the new indexes are created
automatically on first request.

## Security & data model

* Identity: a random UUID in an HttpOnly cookie (`campus_player`), mirrored in
  localStorage. The cookie always wins, so a browser can't act as another student.
  Player ids are never sent to other users (the leaderboard only marks your own row).
* Scores: the browser sends the **answer sheet** (question id, choice, seconds).
  The server checks every question exists and belongs to the topic, then
  recomputes the score with the same `scoring.js` the browser uses. Client-sent
  scores are ignored. Submissions are idempotent (`attemptId`) and rate-limited
  (20 per student per 10 minutes).
* Leaderboard aggregation uses `$$ROOT` (the previous `$ROOT` bug returned empty rows).
* Only topic-based Fun Quiz and Model Test results are ranked; mistakes practice,
  retries and the daily challenge are personal.
* Local progress (history, mistakes, checklist) never leaves the browser.

See `CHANGELOG.md` for everything that changed in v2 and `CONTENT_GUIDE.md` for
adding content.
