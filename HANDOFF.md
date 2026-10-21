# ক্যাম্পাস পথে — handoff for a new chat

Paste this whole file (or its GitHub link) into a new Claude / coding-agent chat
so it can continue without the old conversation. Keep it updated after each change.

## 1. What this is
Bangla-first university-admission practice site: English MCQ **Fun Quiz** and
timed **Model Test** (Grammar + Memorising), Tips & Tricks, university pages,
Score/leaderboard with roll numbers, vocabulary list. Plain HTML/CSS/ES modules,
no build step. API in `server/` backed by **Neon Postgres**, deployed on both
**Vercel** and **Cloudflare Pages** from the same repo.

- GitHub (source of truth): https://github.com/tuhin5060/University-model-test-sbs-updated — branch **`main`**
- Vercel: project `university-model-test-sbs-updated` (team “tuhin5060's projects”)
  → https://sbs-university-admission-model-test.vercel.app
- Cloudflare Pages: project `university-model-test-sbs-updated`, connected to the same repo.
- **Every push to `main` deploys both sites.** Other branches get preview URLs.

## 2. Hard rules
1. Work from the latest `main`. **Never** push an old ZIP
   (e.g. `campus-pothe-website-source.zip`, v2.2.x) — it would wipe newer work.
2. Secrets only in host settings, never in the repo or browser code:
   - Vercel → Settings → Environment Variables: `DATABASE_URL` (from the Neon integration).
   - Cloudflare → Workers & Pages → project → Settings → Variables and Secrets: `DATABASE_URL` (Secret, same value).
3. Before every push: `npm ci && npm run check` (content checker + API tests on
   in-memory Postgres). Browser test: `npm run test:e2e` (needs Playwright).
4. Every question: exactly 4 options, one correct, Bangla explanation
   (`explainBn`) that also says why the other options are wrong.
5. No names, phone numbers, websites or brand lines from source PDFs in questions.
6. Keep `api/*.js` and `functions/api/*.js` as thin entry points; put logic in `server/`.
7. **No npm packages in `server/`, `api/` or `functions/`.** Cloudflare Pages does not run
   `npm install` (empty build command), so any import from `node_modules` breaks the
   Cloudflare build. Neon is reached with plain `fetch` (`server/neon-http.js`).
8. After a push, check both builds: the GitHub commit shows a “Vercel” status and a
   “Cloudflare Pages” check. Both must be green.

## 3. Where things are
| What | File |
|---|---|
| Question topics (one file each) | `data/questions/*.js`, registered in `data/questions/index.js` |
| Topic groups | `group: 'memorising'` in a topic file → Memorising; otherwise Grammar |
| Vocabulary word list page (`#vocab`) | `data/vocabulary.js` → `assets/js/pages/vocab.js` |
| DU / CoU facts, rankings, photos | `data/university-profiles.js` (add more ids the same way) |
| Universities list & admission details | `data/universities.js` |
| Tips posts | `data/posts.js` |
| Site name, credits, WhatsApp link, CU photos | `data/site.js` |
| Scoring (Fun 30 s/q; Model Test 36 s/q, −0.25 per wrong) | `assets/js/shared/scoring.js` (browser + server) |
| API logic | `server/routes/{profile,scores,visitors,progress}.js` |
| Database tables | `server/db.js` (`SCHEMA`, created automatically) |
| Neon HTTPS client | `server/neon-http.js` |
| Vercel / Cloudflare entry points | `api/*.js` / `functions/api/*.js` |
| Roll field, start screen | `assets/js/pages/start.js` |
| Score page (rank cards) | `assets/js/pages/misc.js` |
| Top-score popup + live visitors | `assets/js/lib/live.js` |
| Cloud sync of progress | `assets/js/lib/cloud.js` |
| Styles | `assets/css/styles.css` |
| How to add questions | `CONTENT_GUIDE.md` |
| Version history | `CHANGELOG.md` |

## 4. Current state (update this section)
- `main` = **v2.4.0**: 2079 questions in 19 topics (Grammar 624 in 13 topics;
  Memorising 1455 in 6 topics), 1049-word list, roll numbers, Score page with
  rank, top-score popup, Neon database, DU & CoU pages, phone hero gradient.
- Old MongoDB data (only test scores) was not migrated. MongoDB env vars on
  Vercel are unused and can be deleted.
- Cloudflare needs `DATABASE_URL` added once (see rule 2) for the leaderboard there.
- Decision (owner): stay on **Neon** for now (~100 visits/day fits the free plan:
  1 GB storage, 100 CU-hours/month). MongoDB is retired: its URI value on Vercel
  was blanked; the owner deletes `MONGODB_URI`/`MONGODB_DB` and uninstalls the
  MongoDB Atlas integration in the Vercel dashboard.
- If traffic grows (~500–1000+ visits/day) Neon free compute may run out. Plan:
  move to Cloudflare D1 as the single database (5 GB, 5M reads/100k writes per
  day, no compute-hour limit) — port `server/` SQL to SQLite (keep tables and
  columns the same; add a best-score summary table so leaderboard reads stay
  small), export Neon tables (students, score_attempts, progress) to CSV/SQL,
  import with the D1 tools, make Cloudflare the main site and redirect the
  Vercel URL there. Rolls and scores carry over unchanged.
- Ideas not done yet: the owner mentioned an "advanced" feature to describe later.

## 5. Owner preferences
- Mobile first; simple, minimal UI; no duplicate buttons or filler text.
- Bangla explanations for every answer, including why other options are wrong.
- Only two modes for students: Fun Quiz and Model Test.
- Name is required; roll is shown as `Name.001` and must stay unique.
- Phone header: edge-to-edge photo with green gradient. Desktop: framed photo.
- Feedback goes to WhatsApp (link in `data/site.js`).
- Long-term free hosting: Cloudflare Pages (commercial use allowed, generous
  free limits) + Neon free tier; Vercel Hobby kept as a second deployment.
