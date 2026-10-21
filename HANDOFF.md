# ক্যাম্পাস পথে — handoff for a new chat

Paste this whole file (or its link) into a new Claude / coding-agent chat so it
can continue without the old conversation. Keep it updated after each change.

## 1. What this is
Bangla-first university-admission practice site: English MCQ **Fun Quiz** and
timed **Model Test**, Tips & Tricks, university links, Score/leaderboard,
vocabulary list. Plain HTML/CSS/ES modules, no build step; Vercel serverless
API + MongoDB.

- Live site: https://university-model-test-sbs-updated.vercel.app
- GitHub (source of truth): https://github.com/tuhin5060/University-model-test-sbs-updated — branch **`main`**
- Vercel project: `university-model-test-sbs-updated` (team “tuhin5060's projects”).
  **Every push to `main` deploys to production automatically.** Other branches get a preview URL only.

## 2. Hard rules
1. Work from the latest `main` of the GitHub repo. **Never** push an old ZIP
   (e.g. `campus-pothe-website-source.zip`, v2.2.x) — it would wipe newer work.
2. Secrets live only in Vercel → Settings → Environment Variables
   (`MONGODB_URI` sensitive, `MONGODB_DB=admission_companion`). Never commit them.
3. Run `npm ci && npm run check` before every push (content checker + API tests).
   Optional browser test: `npm run test:e2e` (needs Playwright).
4. Every question needs exactly one correct option and an explanation
   (`explain` or `explainBn`). Bangla explanations preferred.
5. No names, phone numbers, websites or brand lines from source PDFs in questions.

## 3. Where things are
| What | File |
|---|---|
| Question topics (one file each) | `data/questions/*.js`, registered in `data/questions/index.js` |
| Topic groups | `group: 'memorising'` in a topic file → Memorising section; otherwise Grammar |
| Vocabulary word list page (`#vocab`) | `data/vocabulary.js` → `assets/js/pages/vocab.js` |
| Tips posts | `data/posts.js` |
| Universities | `data/universities.js` |
| Site name, credits, WhatsApp link, photos | `data/site.js` |
| Scoring rules (Fun 30 s/q; Model Test 36 s/q, −0.25 per wrong) | `assets/js/shared/scoring.js` (used by browser and server) |
| API (Vercel functions) | `api/profile.js`, `api/scores.js`, `api/visitors.js` |
| Styles | `assets/css/styles.css` |
| How to add questions | `CONTENT_GUIDE.md` |
| Version history | `CHANGELOG.md` |

## 4. Current state (update this section)
- `main` = v2.3.1: 624 grammar questions in 13 topics, logo, Score tab,
  name-required start screen, fixed −0.25 marking, live visitor count.
- In progress on branch `claude/memorising-section`: new **Memorising** section —
  Vocabulary (Synonym / Antonym / Word Meaning, ~1000 words), BCS 10th–40th
  Synonym & Antonym, 200 Appropriate Prepositions, 200 Phrase & Idioms, and a
  searchable word list page. Merge into `main` once `npm run check` passes.

## 5. Owner preferences
- Mobile first; simple, minimal UI; no duplicate buttons or filler text.
- Bangla explanations for every answer, including why other options are wrong.
- Only two modes for students: Fun Quiz and Model Test.
- Feedback goes to WhatsApp (link in `data/site.js`).
