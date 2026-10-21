# ক্যাম্পাস পথে — handoff for a new chat

Paste this whole file (or its GitHub link) into a new Claude / coding-agent chat
so it can continue without the old conversation. Keep it updated after each change.

**Starting a new chat — say:** “Read HANDOFF.md in
github.com/tuhin5060/University-model-test-sbs-updated (branch main) and continue
from section 4. Push finished work to main.” In a Claude Code cloud session, the
repo must be attached with push access first (add_repo tuhin5060 /
University-model-test-sbs-updated).

## 1. What this is
Bangla-first university-admission practice site: English MCQ **Fun Quiz** and
timed **Model Test** (Grammar + Memorising), Tips & Tricks, university pages,
Score/leaderboard with roll numbers, vocabulary list. Plain HTML/CSS/ES modules,
no build step. API in `server/` backed by **Neon Postgres**, deployed on both
**Vercel** and **Cloudflare Pages** from the same repo.

- GitHub (source of truth): https://github.com/tuhin5060/University-model-test-sbs-updated — branch **`main`**
- Vercel: project `university-model-test-sbs-updated` (id `prj_HR80vU3NX3HvQlcjlVlykB45azj7`,
  team “tuhin5060's projects”, `team_8dwiThmNlmMYmrLA0wli5BWp`)
  → https://sbs-university-admission-model-test.vercel.app (the old
  university-model-test-sbs-updated.vercel.app redirects here)
- Cloudflare Pages: project `sbs-university-admission-model-test`, connected to the same repo
  (URL is normally https://sbs-university-admission-model-test.pages.dev).
- Neon: added through the Vercel Marketplace (free plan). Vercel env vars
  `DATABASE_URL` / `POSTGRES_URL` etc. come from it.
- Unused: Cloudflare D1 `campus-admission-companion` (id `dfbfe817-73f6-4c5c-9023-38203fae39a6`, empty).
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
   “Cloudflare Pages” check. Both must be green. (Without a GitHub token:
   `curl https://api.github.com/repos/tuhin5060/University-model-test-sbs-updated/commits/<sha>/check-runs`.)
9. Never decrypt or print secret values; never commit them.

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
- Builds: Vercel ✅ and Cloudflare Pages ✅ on the latest main (Cloudflare failed
  before because of an npm import — see rule 7).
- Old MongoDB data (only test scores) was not migrated.

**Waiting on the owner (dashboard clicks, no code):**
1. Cloudflare → Workers & Pages → `sbs-university-admission-model-test` → Settings →
   Variables and Secrets → add `DATABASE_URL` (Secret, Production + Preview, same
   value as Vercel’s Neon `DATABASE_URL`) → redeploy. Until then the Cloudflare site
   works but hides leaderboard/rolls/visitor count (API answers 503).
2. Vercel → Settings → Environment Variables → delete `MONGODB_URI`, `MONGODB_DB`;
   Vercel → Integrations → MongoDB Atlas → Uninstall.

**Known gaps / not verified:**
- Live writes (POST profile/scores) against the real Neon were not exercised from the
  agent sandbox; reads work live, and tests run the same SQL with text parameters
  as Neon does. First real sign-up on the site is the final check — look at Vercel
  runtime logs if a save fails.
- DU / CoU photos load from Wikimedia Commons and could not be opened from the
  sandbox; a photo that fails to load hides itself. CoU motto left out (unverified).
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
- Wants short, organised Bangla summaries of what changed after each round, and
  every message considered (not only the latest).
