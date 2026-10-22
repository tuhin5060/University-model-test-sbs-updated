# Neon (Vercel) থেকে Cloudflare D1-এ যাওয়া

সংক্ষেপে: **হ্যাঁ, সব data যাবে।** শিক্ষার্থীর নাম, roll, প্রতিটি score, অগ্রগতির backup,
কমিউনিটির প্রশ্ন-উত্তর, notification subscription আর settings—সব একই id আর roll নিয়ে
D1-এ চলে যায়, তাই leaderboard, rank আর "নিজের roll দিয়ে ফেরত আসা" আগের মতোই চলবে।
শুধু অস্থায়ী তালিকা (কে এখন online, popup event) নেওয়া হয় না—এগুলো এমনিতেই কয়েক মিনিটে মুছে যায়।

`tests/backup.test.mjs` প্রতিবার `npm run check`-এ এটা যাচাই করে: data ভরে backup নেয়,
D1-এর SQL বানায়, SQLite-এ (D1 যা চালায়) load করে আর মিলিয়ে দেখে সব row, roll, বাংলা নাম,
উত্তর আর progress ঠিক আছে কি না।

## ধাপ ১ — Backup নাও (যেকোনো সময়, বারবার নেওয়া যায়)

1. Site খোলো → `https://sbs-university-admission-model-test.vercel.app/#backup`
   (About পাতার নিচেও link আছে)।
2. Admin password দাও → **Backup download করো**। `campus-backup-YYYY-MM-DD.json` নামে file নামবে।
3. File-টা নিরাপদে রাখো—এতে সবার নাম ও roll আছে। Public জায়গায় (GitHub) রাখবে না।

## ধাপ ২ — D1-এ data তোলো

কম্পিউটারে (Node.js লাগবে), repo folder-এ:

```bash
npm ci
node scripts/backup-to-d1.mjs campus-backup-YYYY-MM-DD.json > d1-import.sql
npx wrangler login
npx wrangler d1 execute campus-admission-companion --remote --file=d1-import.sql
```

* `campus-admission-companion` হলো আগে বানানো (খালি) D1 database
  (id `dfbfe817-73f6-4c5c-9023-38203fae39a6`)। নতুন বানাতে চাইলে:
  `npx wrangler d1 create campus-pothe`।
* Script নিজেই table বানায় (`CREATE TABLE IF NOT EXISTS`), তারপর সব row ঢোকায়।
  শেষে কোন table-এ কয়টা row গেল তা লিখে দেয়।
* D1-এ এক statement-এ ১০০ KB-র বেশি যায় না; কোনো row এর চেয়ে বড় হলে script সতর্ক করে।

## ধাপ ৩ — Code-কে D1-এ চালানো (একবারের কাজ)

এখনকার API Neon (Postgres)-এর জন্য লেখা। D1 SQLite, তাই `server/` অংশ বদলাতে হবে।
Table আর column একই থাকবে, শুধু SQL-এর কিছু লেখা আলাদা:

| এখন (Postgres) | D1 (SQLite) |
|---|---|
| `now()`, `now() - interval '10 minutes'` | `strftime('%Y-%m-%dT%H:%M:%fZ','now')`, `datetime('now','-10 minutes')` |
| `DISTINCT ON (...)` | `row_number() OVER (PARTITION BY ...)` = 1 |
| `jsonb`, `@>`, `jsonb_array_elements_text` | `TEXT` JSON, `json_each` |
| `ILIKE` | `LIKE` (ইংরেজিতে case ছাড়াই মেলে) |
| `generate_series` | recursive `WITH` |
| `AT TIME ZONE 'Asia/Dhaka'` | `datetime(at, '+6 hours')` |
| `RETURNING`, `ON CONFLICT` | একই (SQLite সমর্থন করে) |

* `server/db.js`: Neon-এর বদলে D1 binding (`env.DB.prepare(sql).bind(...).all()`,
  একসাথে কয়েকটার জন্য `env.DB.batch`)। Route-গুলো `db.query/db.batch` ব্যবহার করে, তাই
  বাকি code প্রায় একই থাকে।
* D1 শুধু Cloudflare থেকে সরাসরি ব্যবহার করা যায়। তাই তখন **Cloudflare Pages হবে মূল site**,
  আর Vercel-এর ঠিকানা Cloudflare-এ redirect হবে।
* রাত ৮টার notification: Cloudflare Pages-এ cron নেই। একটা ছোট Worker-এ Cron Trigger
  (`0 14 * * *`, বিনামূল্যে) রেখে সেটা `runDaily` চালাবে। `VAPID_PRIVATE_JWK` একই রাখতে হবে—তাহলে
  পুরোনো subscription-গুলোও কাজ করবে।
* Cloudflare-এ Secrets: `ADMIN_PASSWORD`, `VAPID_PRIVATE_JWK` (Vercel-এর মতোই), আর
  `wrangler.toml`-এ D1 binding: `[[d1_databases]] binding = "DB" ...`।

## Switch করার দিন যা মনে রাখবে

1. আগে নতুন code Cloudflare-এ চালু করো (D1 খালি থাকলেও চলে), পরীক্ষা করো।
2. তারপর **নতুন backup** নাও (ধাপ ১), সাথে সাথে D1-এ তোলো (ধাপ ২)—মাঝের কয়েক মিনিটের
   নতুন score যেন হারিয়ে না যায়।
3. Vercel-এর ঠিকানা Cloudflare-এ redirect করো।
4. শিক্ষার্থীর browser-এর login cookie নতুন ঠিকানায় থাকে না—তারা একবার **একই নাম + roll**
   দিলেই সব score আর অগ্রগতি ফিরে পাবে (এটাই site-এর নিয়ম)। Browser-এ রাখা local অগ্রগতিও
   ঠিকানা বদলালে নতুন করে শুরু হয়, তবে server backup থেকে ফেরত আসে।
5. Notification: যারা পুরোনো ঠিকানায় চালু করেছিল, তারা নতুন ঠিকানায় একবার আবার চালু করলে ভালো।

> ভবিষ্যতে ঠিকানা বদলের ঝামেলা এড়াতে নিজের domain (যেমন `campuspothe.com`) নেওয়া ভালো—
> তখন host বদলালেও ঠিকানা, cookie আর notification একই থাকে।

## খরচ

D1 free plan: ৫ GB, দিনে ৫০ লাখ read ও ১ লাখ write। এই site-এর জন্য অনেক বেশি।
