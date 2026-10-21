# ক্যাম্পাস পথে — University Admission Practice

A Bangla-first university admission companion, built around the University of
Chittagong: English MCQ practice (Grammar + Memorising: vocabulary, BCS
synonym/antonym, prepositions, idioms) that feels like a game **and** like the
real exam, a Tips & Tricks blog, and official links for 18 universities.

Live: https://university-model-test-sbs-updated.vercel.app (Vercel) and the
Cloudflare Pages copy — both deploy from `main` and share one Neon database.

## What students get

| | |
|---|---|
| 🎮 **Fun Quiz** | 30 s countdown per question, points, streak bonus (x1.5 / x2), 50:50 and Freeze lifelines, sounds + confetti, instant explanation, leaderboard. |
| ⏱️ **Model Test** | One timer for the whole test (36 s per question), question palette, 🚩 flag for review, −0.25 for every wrong answer, auto-submit on time-up, topic-wise report and full answer sheet. |
| 🔁 **My mistakes** | Wrong answers are collected automatically; two correct answers later remove them. |
| 📅 **Daily challenge** | The same 5 questions for everyone each day, with a 🔥 day streak. |
| 💡 **Tips & Tricks** | 13 posts (CU English roadmap, MCQ strategy, Article & Tense cheat-sheets, routines, exam-day checklist …) with "practice this topic" buttons inside posts. |
| 🏛️ **Universities** | CU spotlight with photo gallery, detailed profiles (CU, DU, RU, JU, CUET, BUET, KUET, RUET), 10 more universities, an official link directory, admission resources and a personal checklist. |
| 🪪 **Name + roll** | Every student gets a unique roll (001, 002 …) shown as `Name.007`. The same name + roll on another phone brings back scores and progress. A taken roll is refused with a free one suggested. |
| 🏆 **Score** | Tests taken, best/average marks, correct/wrong totals and your leaderboard position (#rank of N) for Fun Quiz and Model Test, recent results, the leaderboard and a WhatsApp feedback button. A popup at the top tells everyone online when someone sets a new highest score. |
| 🧠 **Memorising** | Vocabulary Synonym / Antonym / Word Meaning (~1000 words), BCS 10th–40th Synonym & Antonym, 200 Appropriate Prepositions, 198 Phrase & Idioms, plus a searchable word list (`#vocab`). |
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
  questions/*.js            One file per topic (2079 questions, 19 topics; Grammar + Memorising)
  vocabulary.js             Word list for the শব্দতালিকা page
  posts.js                  Tips & Tricks posts
  universities.js           Universities, official links, resources
  university-profiles.js    DU & CoU facts, rankings, photos (with sources)
  site.js                   Site name, credits, CU photos
server/                     ← THE API (one copy, used by both hosts)
  routes/profile.js         Name + unique roll, login with name + roll
  routes/scores.js          Leaderboard, my stats/rank, answer-sheet check, top-score events
  routes/visitors.js        Live visitor count + "new highest score" events
  routes/progress.js        Private progress backup
  db.js                     Neon Postgres (HTTPS driver) + table definitions
  http.js, route.js         Request/response helpers, error handling
  local-db.js               In-memory Postgres (PGlite) for tests and `npm run dev`
api/*.js                    Vercel entry points (2 lines each → server/routes)
functions/api/*.js          Cloudflare Pages entry points (2 lines each → server/routes)
wrangler.toml               Cloudflare Pages settings
scripts/serve.mjs           Local dev server (static + API)
tests/                      Content checker, unit/API tests, browser e2e
tense-express/              Old URL → redirects to Fun Quiz (Tense); classic.html keeps the old game
```

No build step and no framework: plain HTML, CSS and ES modules.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000 — works offline with an in-memory Postgres
npm run check        # content checker + unit/API tests
npm run test:e2e     # optional browser test (needs: npm i -D playwright && npx playwright install chromium)
```

Set `DATABASE_URL` to use a real Neon database locally; without it the data
resets when the server stops.

## Database: Neon Postgres

Both hosts use the same Neon database, so the leaderboard, rolls and progress
are identical on the Vercel and Cloudflare sites. Tables are created
automatically on the first request (`server/db.js` → `SCHEMA`):
`students` (unique `roll`), `score_attempts`, `presence`, `progress`, `events`.

The connection string is a secret: it lives only in the host's settings, never
in the repository or the browser.

## Deploy on Vercel

* Project `university-model-test-sbs-updated`, connected to GitHub `main`
  (every push to `main` deploys to production; other branches get a preview).
* No build command. API: `api/*.js` (Node.js functions with Web `Request`/`Response`).
* Environment variable `DATABASE_URL` comes from the Vercel ↔ Neon
  integration (Storage tab). `POSTGRES_URL` also works. MongoDB variables are
  no longer used and can be deleted.

## Deploy on Cloudflare Pages

* Production branch `main`, build command empty, output directory `.`.
* API: `functions/api/*.js` (Pages Functions, `nodejs_compat`).
* **Add the secret once:** Cloudflare dashboard → Workers & Pages → this
  project → Settings → Variables and Secrets → add `DATABASE_URL` (type
  *Secret*) for Production and Preview, using the same value as on Vercel
  (Neon console → Connect, or Vercel → Storage → Neon). Then redeploy.
  Without it the site still works, but the leaderboard and visitor count are hidden.
* The old D1 database is no longer used.

## Security & data model

* Identity: name + roll. The server keeps a random UUID per student in an
  HttpOnly cookie (`campus_player`); player ids are never shown to other users.
  Typing the same name + roll on a new device logs in as that student — there
  is no password, so a roll is like a simple PIN and should not be shared.
* Rolls are unique (database `UNIQUE` constraint). New rolls continue after the
  highest one; a request for a taken roll gets `409` and the nearest free roll.
* Scores: the browser sends the **answer sheet** (question id, choice, seconds).
  The server checks every question exists and belongs to the topic, then
  recomputes the score with the same `scoring.js` the browser uses. Client-sent
  scores are ignored. Submissions are idempotent (`attemptId`) and rate-limited
  (20 per student per 10 minutes).
* New highest score: when a score beats the best on a board that someone else
  has already played, an event is stored; open tabs pick it up with their next
  heartbeat and show a small popup.
* Live visitors: each open, visible tab sends a heartbeat to `/api/visitors`
  once a minute with a random browser id (no name, no IP stored). The badge
  shows how many browsers sent one in the last 150 s; closing the tab removes it
  at once. If the database is not configured the badge is simply hidden.
* Only topic-based Fun Quiz and Model Test results are ranked; mistakes practice,
  retries and the daily challenge are personal.
* Practice history, mistakes, stats and settings live in localStorage and are
  backed up as a private snapshot (`progress` table) for the student.

See `CHANGELOG.md` for everything that changed in v2 and `CONTENT_GUIDE.md` for
adding content.
