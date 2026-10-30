# ক্যাম্পাসের পথে — handoff for a coding agent

> **মালিকের জন্য:** নতুন কোনো coding agent (Claude, Codex, Cursor, অন্য যেকোনো) দিয়ে কাজ করাতে
> এই পুরো file-টা (বা GitHub link) তাকে দাও আর বলো "Read HANDOFF.md first and follow it."
> Admin password বা database URL কখনো কোনো chat-এ বা file-এ দেবে না—ওগুলো শুধু Vercel-এ থাকে।

Last updated: 2026-10-31 · version **2.22.0** (SEO + guides).
Keep §4 up to date after each change.

## 1. What this is
Bangla-first university-admission practice site for Bangladeshi students: English MCQ
**Fun Quiz**, timed **Model Test** and the **Daily Quiz** (same 20 past-year questions for
everyone each day), Tips & Tricks, university pages, Score/leaderboard,
vocabulary list, community Q&A, push reminders and an admin usage dashboard.
Plain HTML/CSS/ES modules (no framework, no bundler). API in `server/`, backed by **Neon Postgres**.

| | |
|---|---|
| Source of truth | https://github.com/tuhin5060/University-model-test-sbs-updated — branch **`main`** (public repo) |
| Live site | https://sbs-university-admission-model-test.vercel.app |
| Vercel | project `university-model-test-sbs-updated`, id `prj_HR80vU3NX3HvQlcjlVlykB45azj7`, team `team_8dwiThmNlmMYmrLA0wli5BWp` (Hobby plan). The old `university-model-test-sbs-updated.vercel.app` domain 301-redirects to the live site. |
| Cloudflare Pages | project `sbs-university-admission-model-test` (second copy from the same repo; not re-verified recently) |
| Database | Neon Postgres via the Vercel Marketplace integration (free plan) |
| Not part of the site | Vercel project `campus-pothe-homepage-v2-preview` — the owner's private design mock-up. **Do not touch, deploy, merge or delete it.** |

**Deploy = push to `main`.** Vercel builds production automatically (~1 min). No PRs or side
branches unless the owner asks.

## 2. Hard rules
1. Start from the latest `main`; push back to `main`. Never upload an old ZIP over newer work.
2. **Secrets live only in Vercel → Settings → Environment Variables** (all marked Sensitive).
   Never put them in the repo, tests, comments, commit messages or browser code. The repo is public.
   Never decrypt or print env values. Tests use dummy values (e.g. `TestPass99`).
3. Before every push: `npm ci && npm run sync && npm run check` — all must pass (currently 67 tests).
   `sync` regenerates SEO pages, sitemap, `data/questions/meta.js`, the service-worker precache
   list and `modulepreload` tags. Commit what it changes.
4. **No npm packages in `server/`, `api/`, `functions/`** (Cloudflare does not run `npm install`).
   Neon is reached with plain `fetch` (`server/neon-http.js`).
5. `api/*.js` (Vercel) and `functions/api/*.js` (Cloudflare) are thin entry points; logic goes in `server/`.
6. Questions: exactly 4 options, one correct, Bangla explanation (`explainBn`) that also says why
   the others are wrong. Put each question in the right topic file.
7. **Never invent data.** The 📌 exam reference (`source`) is shown only when the source data names
   a real exam/university + year. No reference in the data → leave it empty. No names, phone
   numbers or brand lines from source PDFs.
8. Inline `<script>` in `index.html` is allowed only with its SHA-256 hash in the CSP
   (`vercel.json` and `_headers`); `scripts/seo.mjs --check` verifies this. No inline `onclick`.
9. After pushing, confirm the Vercel production deployment is READY and spot-check the live page.
10. Don't add model names/IDs to commits or files.

## 2a. GitHub
- Repo: `tuhin5060/University-model-test-sbs-updated` — **public**, so anything committed is visible to everyone.
- **`main` is the only branch that matters.** Vercel deploys production from `main`; any other branch
  only gets a Vercel preview URL (not the live site).
- Other branches on GitHub (all old; their work is already in `main` or abandoned — safe to delete, never merge without checking):
  `preview/audit-2026-10-27` (same as commit `7584633`, already in `main`),
  `backup/pre-stability-fixes-2026-10-25`, `fix/stability-and-reference-audit-2026-10-25`,
  `claude/memorising-section`, `export-source-zip` (not checked against `main`).
- Some agent environments can push to `main` but are **not allowed to delete branches** or call
  GitHub write APIs; the owner deletes branches at https://github.com/tuhin5060/University-model-test-sbs-updated/branches.
- The repo was renamed/moved once; `git push` may print "This repository moved" — harmless, push still works.
- Commit style: short imperative subject (`2.16.1: …` for releases), bump the version in `package.json`,
  `package-lock.json` and the `?v=` in `index.html`, add a `CHANGELOG.md` entry.

### Quick start for a new agent
```bash
git clone https://github.com/tuhin5060/University-model-test-sbs-updated && cd University-model-test-sbs-updated
npm ci
npm run dev          # local server (no database: saving/leaderboard are skipped)
# …make changes…
npm run sync && npm run check   # must pass
git add -A && git commit -m "…" && git push origin main
```
Then confirm the Vercel production deployment for that commit is READY and open the live page.

## 3. Map of the code
| What | Where |
|---|---|
| App shell, routes (`#home`, `#start/exam/<topic>`, `#leaderboard`, `#admin` …) | `index.html`, `assets/js/main.js` |
| Pages | `assets/js/pages/*.js` (`admin.js` is lazy-loaded) |
| Question topics (one file each) | `data/questions/*.js`, registered in `data/questions/index.js`; `meta.js` is generated |
| Lazy loading of the 1.3 MB bank + vocabulary | `assets/js/lib/bank.js` |
| Exam-reference tag logic | `assets/js/shared/source.js` (+ `tests/source-reference.test.mjs`) |
| Public name tag (last word of name + roll, e.g. `Ali.003`) | `assets/js/shared/names.js` |
| Scoring (Fun 30 s/q; Model Test 36 s/q, −0.25 per wrong) | `assets/js/shared/scoring.js` (browser + server) |
| Live online count / today's visitors / top-score popups | `assets/js/lib/live.js` → `server/routes/visitors.js` |
| Offline queue for scores & sign-ups | `assets/js/lib/outbox.js` |
| Service worker (versioned precache) | `sw.js` (block between markers written by `scripts/preload.mjs`) |
| API routes | `server/routes/{profile,scores,daily,visitors,progress,community,push,admin,backup}.js` |
| Daily Quiz: question picker (shared) / page / server | `assets/js/shared/daily.js` / `assets/js/pages/daily.js` (`#daily`) / `server/routes/daily.js` (tables `daily_sets`, `daily_attempts`) |
| Tables (created automatically, idempotent) | `server/db.js` (`SCHEMA`) |
| Rate limits | `server/ratelimit.js` (`hits` table) |
| Admin password check | `server/admin.js` (`ADMIN_PASSWORD`, whitespace ignored) |
| SEO generator (topic pages `/mcq/<topic>/`, `/tips/`, `/universities/`, sitemap, footer links) | `scripts/seo.mjs` |
| Headers, CSP, redirects, cron | `vercel.json` (Vercel), `_headers` (Cloudflare) |
| Site name, credits, WhatsApp, CU photos | `data/site.js` |
| How to add questions | `CONTENT_GUIDE.md` · history: `CHANGELOG.md` |

Environment variables (names only): `DATABASE_URL` / `POSTGRES_URL` (Neon), `ADMIN_PASSWORD`,
`CRON_SECRET` (push crons: `/api/push-morning` 01:00 UTC ≈ 7 AM BD "today's Daily Quiz is ready";
`/api/push-cron` 14:00 UTC = 8 PM BD, only to those who have not taken today's quiz), `VAPID_PRIVATE_JWK` (web push).
New API routes must also be added to `ROUTES` in `scripts/serve.mjs` (local dev server).
Vercel Hobby allows only about 12 functions per deployment; `api/` now has 11 files — before adding
another endpoint, add an action to an existing route instead.

## 4. Current state (2026-10-31, v2.22.0)
- 2,487 questions in 22 topics (Grammar + Memorising), 1,049-word vocabulary list.
  v2.20 added 231 grammar questions (Comparison, Adjective, Adverb, Modal, Subjunctive,
  Causative, Hope & Wish, Conditional) and the new **Conjunction** topic.
- Layout (v2.21): desktop top menu is text-only and never wraps; on phones topic cards
  are compact one-line rows. Rules are in the "2.21: calmer layout" block at the end of
  `assets/css/styles.css`.
- **Daily Quiz** (since 2026-10-29): 20 questions a day = 10 CU/DU + 10 other universities, all
  with a real 📌 reference (569 such questions: 178 CU/DU, 391 others). Each half rotates with no
  repeats until used up (≈18 and ≈39 days), then a new round. A day's set is locked in
  `daily_sets` when first opened (GET `/api/daily` or the morning cron). One ranked try per
  student per day (`daily_attempts`, PK day+player). Rules: Model Test (36 s/q, −0.25).
  More CU/DU past-year questions in the topic files make the rotation longer automatically.
- 569 questions show a 📌 reference; 1,918 have none in the data and are intentionally empty
  (mostly Synonym, Antonym, Meaning, Idioms, Preposition, Tense).
- Login = full name + roll (no password). Leaderboard shows only `LastName.roll` + college.
- Admin dashboard (`#admin`, link at the bottom of every page; v2.18–2.19), six tabs, all via
  POST `/api/admin` `{password, action}` (every action checks the password first):
  - 📊 সারাংশ: today / 7 / 30 days — online, visitors, signed-in users, minutes, sign-ups,
    tests, Daily Quiz takers, push subscribers; a bar per day; top students; today's sessions.
  - 🟢 ব্যবহার (`usage` {day?, roll?}; v2.19): online now (presence ⨝ latest usage session ⨝
    students) auto-refreshing every 30 s; per-student minutes for any of the last 30 days; with
    `roll`, that student's minutes per day and every visit.
  - 👩‍🎓 শিক্ষার্থী (`students`): search by name, roll or college → full name, tests, points,
    accuracy, Daily days, minutes, joined / last seen.
  - 📅 Daily Quiz (`daily`): any day's 20 questions with answers + every participant (full names).
  - 📢 Notice (`settings`, `save-settings`, `push`): a site notice bar on every page (on/off,
    text, link; students can close it), the morning reminder title/text (yesterday's count is
    added automatically), and "send a notification now" (max 5 per hour).
  - 💾 Data: database size meter and row counts (`/api/backup` stats) + link to `#backup`.
  Settings live in the `settings` table, keys `notice` and `morning` (also `push_message`,
  `known_topics`, `schema`). Usage data in `usage_sessions` (one heartbeat ≈ 1 min,
  gap > 5 min = new session, kept 60 days). Started 2026-10-27.
- Score page (v2.18): my card (total points, position, Fun / Model Test, Daily streak, today)
  → today's top → tabs Leaderboard / আমার topic / আমার test. Same API data as before.
- Verified live on 2026-10-27 in a real browser: home boots in < 1 s, online count and
  today's visitors show, leaderboard, all pages, admin login/logout and wrong-password message work.
- Traffic (Vercel Web Analytics, 21–27 Oct): 230 visitors, 873 page views; ~90% direct,
  ~8% Facebook, Google ≈ 1 (not indexed yet).

### Security in place
- No secrets in the repository: `tests/security.test.mjs` fails on any committed password,
  database URL, private key, `.env` or ZIP. Admin password only in the host env settings. `/.env` → 404.
- Internal files (`/server/*`, `/tests/*`, `/scripts/*`, `/docs/*`, `/functions/*`, `*.md`,
  `package.json`, `wrangler.toml` …) redirect to `/` (rule in `vercel.json`); `/api/*`, `/data/*` still served.
- Strict headers: CSP with script hashes, HSTS preload, `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, COOP.
- Admin API: 10 wrong passwords / 15 min per IP → blocked. Password kept only in sessionStorage
  of that tab. Backup endpoint needs the admin password.
- Sign-in: 8 wrong names for one roll per hour → that roll is locked for an hour (any network).
- Rate limits on score posts, sign-ups, community threads/replies; all SQL is parameterised;
  all user text is HTML-escaped on render.

### SEO in place
- Google Search Console verified (meta tag + `google79aa884cbe996390.html`).
- Home `index.html` has a static intro + links to every topic page and the latest posts
  inside `#main` (between `seo-home` markers, written by `scripts/seo.mjs`); the app replaces it.
- Sitemap `lastmod` comes from `data/seo-dates.json` (content fingerprint per page, date moves
  only on a real content change). Commit it with the other `npm run sync` output.
- 24 Tips & Tricks posts (8 grammar/CU-DU guides added 2026-10-31); topic pages link to the
  guides that contain `[[quiz:<topic>]]`.
- 22 static topic pages `/mcq/<topic>/` with questions, answers and Bangla explanations,
  `/tips/<slug>/` articles, `/universities/`; 50-URL `sitemap.xml`; `robots.txt` blocks only internal paths.
- Canonical URLs, Open Graph/Twitter cards, one `WebSite`+`Organization` JSON-LD on home,
  `BreadcrumbList` + `Quiz` JSON-LD on topic pages; old domain 301 → main domain.

### Open items
1. **Owner:** change `ADMIN_PASSWORD` in Vercel (and Cloudflare, if set there) to a long,
   unguessable one (16+ characters, not a name or handle), then redeploy. Never write any hint
   about it in this repository—`tests/security.test.mjs` fails if a password, database URL or
   private key is committed.
2. **Owner:** Search Console → submit `sitemap.xml`, request indexing for home + a few `/mcq/` pages.
3. **Owner (optional):** delete the old GitHub branches listed in §2a (agents can't delete branches).
4. Known, accepted: answers ship to the browser, so a determined user can fake a score
   (server rate limits only). Fix would need server-side question serving.
5. CU gallery photo "Campus, University of Chittagong 1.jpg": Wikimedia now serves it from
   `thumb.wikimedia.org`, which the CSP blocks, so the local 480 px fallback stays. Owner chose
   not to change it yet (performance). To enable: add `https://thumb.wikimedia.org` to `img-src`
   in `vercel.json` and `_headers`.
6. `tests/e2e/run.mjs` is outdated (fails on old code too); unit/API tests are the real gate.
7. Optional speed: lazy-load `data/posts.js` and `data/universities.js` (~20 KB gz) from the home page.

### Marketing (outside the repo)
- An announcement video is planned: final Bangla voice-over script + instructions for Claude to build a
  4:5 / 1:1 motion-graphics video from mobile screenshots exist as `SCRIPT.md` and
  `VIDEO_INSTRUCTIONS.md` (kept by the owner, not in this repo). Rule for any video/screenshot work:
  never show `#admin`, never create a fake student on the live site.

## 5. Owner preferences
- Owner writes Bangla/Banglish; reply with short, organised Bangla summaries.
- Mobile first, simple UI, no duplicate buttons or filler text; don't slow the home page.
- Every answer has a Bangla explanation; three quiz types: Fun Quiz, Model Test and Daily Quiz
  (owner asked for the Daily Quiz on 2026-10-29; CU and DU past-year questions are the focus).
- Data must be real (counts, references, visitors) — never estimated or made up.
- Feedback goes to WhatsApp (link in `data/site.js`).
