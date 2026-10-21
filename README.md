# ক্যাম্পাস পথে — University Admission Practice

A Bangla-first university admission companion, built around the University of
Chittagong: English MCQ practice that feels like a game **and** like the real
exam, a Tips & Tricks blog, and official links for 18 universities.

## What students get

| | |
|---|---|
| 🎮 **Fun Quiz** | 30 s countdown per question, points, streak bonus (x1.5 / x2), 50:50 and Freeze lifelines, sounds + confetti, instant explanation, leaderboard. |
| ⏱️ **Model Test** | One timer for the whole test (36 s per question), question palette, 🚩 flag for review, −0.25 for every wrong answer, auto-submit on time-up, topic-wise report and full answer sheet. |
| 🔁 **My mistakes** | Wrong answers are collected automatically; two correct answers later remove them. |
| 📅 **Daily challenge** | The same 5 questions for everyone each day, with a 🔥 day streak. |
| 💡 **Tips & Tricks** | 13 posts (CU English roadmap, MCQ strategy, Article & Tense cheat-sheets, routines, exam-day checklist …) with "practice this topic" buttons inside posts. |
| 🏛️ **Universities** | CU spotlight with photo gallery, detailed profiles (CU, DU, RU, JU, CUET, BUET, KUET, RUET), 10 more universities, an official link directory, admission resources and a personal checklist. |
| 🏆 **Score** | Your best Fun Quiz points and Model Test marks, recent results, the leaderboard and a WhatsApp feedback button. |
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
  questions/*.js            One file per topic (624 questions, 13 topics)
  posts.js                  Tips & Tricks posts
  universities.js           Universities, official links, resources
  site.js                   Site name, credits, CU photos
api/                         Legacy local/Vercel handlers used by tests and local server
  profile.js                Student name/avatar (cookie-based identity)
  scores.js                 Leaderboard: validates answer sheet, recomputes score
  visitors.js               Live visitor count (heartbeats, no estimates)
lib/
  mongodb.js                MongoDB connection (Vercel pooled)
  http.js                   Cookie / JSON helpers
  memory-db.js              In-memory DB for local dev + tests
functions/
  api/profile.js             Cloudflare Pages API: student profile (D1)
  api/scores.js              Cloudflare Pages API: validated leaderboard (D1)
  api/visitors.js            Cloudflare Pages API: live visitors (D1)
  api/progress.js            Cloudflare Pages API: progress backup/sync (D1)
  _lib/shared.js             Shared Cloudflare cookie/JSON helpers
wrangler.toml                Pages output + D1 binding
schema.sql                   D1 schema
scripts/serve.mjs            Local dev server (static + legacy API)
tests/                      Content checker, unit/API tests, browser e2e
tense-express/              Old URL → redirects to Fun Quiz (Tense); classic.html keeps the old game
```

No build step and no framework: plain HTML, CSS and ES modules. Cloudflare Pages is connected to the GitHub `main` branch, so pushes to GitHub trigger a new deployment automatically.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000 — works offline with an in-memory DB
npm run check        # content checker + unit/API tests
npm run test:e2e     # optional browser test (needs: npm i -D playwright && npx playwright install chromium)
```

Without `MONGODB_URI` the legacy local server uses an in-memory database, so that local leaderboard resets on restart. The deployed Cloudflare Pages Functions use the Cloudflare D1 binding named `DB` and do not need a MongoDB connection string.

## Deploy on Cloudflare Pages

This repository is connected to the Cloudflare Pages project `university-model-test-sbs-updated`.

* Production branch: `main`
* Build command: *(empty — no build step)*
* Output directory: `.`
* Functions: `functions/api/*.js` (Cloudflare Pages Functions)
* Storage: Cloudflare D1 database `campus-admission-companion`, bound as `DB` in production and preview deployments.
* The schema is documented in `schema.sql`; the database tables are already initialized in the connected Cloudflare account.
* Push or merge commits to `main` to trigger a new production deployment. Other branches receive preview deployments.
* No MongoDB environment variable is required by the deployed Cloudflare Functions.

The Cloudflare deployment stores student profiles, leaderboard attempts, live visitor heartbeats, and progress snapshots in D1. The browser also keeps a local cache for offline use; when online, progress changes are debounced and synced to D1.

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
* Live visitors: each open, visible tab sends a heartbeat to `/api/visitors`
  every 30 s with a random browser id (no name, no IP stored). The badge shows
  how many different browsers sent one in the last 75 s; closing the tab removes
  it at once. Rows expire after 10 minutes (TTL index on `presence.at`). If the
  database is not configured the badge is simply hidden — no made-up numbers.
* Only topic-based Fun Quiz and Model Test results are ranked; mistakes practice,
  retries and the daily challenge are personal.
* Practice history, mistakes, topic stats, daily progress, saved universities, checklist, preferences and resumable session are stored in localStorage for quick/offline access and synced as a progress snapshot to D1. A browser-specific HttpOnly cookie identifies the snapshot until a student profile is created; the profile cookie is then used. This is not a password-based account system, so it does not securely merge progress across unrelated devices/browsers.

See `CHANGELOG.md` for everything that changed in v2 and `CONTENT_GUIDE.md` for
adding content.
