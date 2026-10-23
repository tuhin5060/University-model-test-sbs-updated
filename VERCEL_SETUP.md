# Vercel-এ site চালু করার পুরো গাইড (ক্যাম্পাসের পথে)

এই zip/repo দিয়ে নতুন Vercel account-এ বা নতুন project-এ site চালাতে যা যা লাগে।
কোড বদলাতে হবে না — নিচের ধাপগুলো করলেই হবে।

## ১. Project তৈরি
1. কোডটা নিজের GitHub repo-তে push করো (zip খুলে `git init` → push, অথবা full-project zip-এ git history আগে থেকেই আছে)।
2. Vercel → **Add New → Project** → repo বেছে নাও।
3. Settings যেমন আছে রাখো — সব `vercel.json`-এ লেখা আছে:
   - Framework Preset: **Other**
   - Build Command: `npm run sync && npm run check` (vercel.json থেকে নিজে নেয়)
   - Output Directory: খালি রাখো (repo-র root-ই site)
   - Install Command: default (`npm install`)
   - Node.js Version: **24.x** (package.json-এর `engines`)

## ২. Database (Neon Postgres) — অবশ্যই লাগবে
1. Project → **Storage** → **Create Database** → **Neon** (Postgres) → project-এ connect করো।
2. এতে `DATABASE_URL` (আর `POSTGRES_URL` ইত্যাদি) নিজে থেকে যোগ হয়।
3. Table বানাতে কিছু করতে হবে না — প্রথম request-এই site নিজে table বানিয়ে নেয়।
4. পুরনো database-এর data নতুনটায় আনতে: পুরনো site-এর Admin backup (`/api/backup`) ব্যবহার করো, অথবা Neon-এ database “branch/restore” করো।

## ৩. Environment Variables (Settings → Environment Variables)
Production আর Preview দুটোতেই দাও, type **Sensitive**।

| নাম | কী দিতে হবে | না দিলে কী হবে |
|---|---|---|
| `DATABASE_URL` | Neon integration নিজে দেয় | নাম, score, leaderboard, কমিউনিটি, অনলাইন সংখ্যা চলবে না (quiz চলবে, score শুধু phone-এ থাকবে) |
| `ADMIN_PASSWORD` | নিজের বানানো লম্বা password | কমিউনিটিতে Admin delete কাজ করবে না |
| `CRON_SECRET` | যেকোনো লম্বা random লেখা | প্রতিদিনের reminder notification যাবে না |
| `VAPID_PRIVATE_JWK` | নিচের command-এর output | Browser notification চালু করা যাবে না |

`CRON_SECRET` বানাতে:
```bash
node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"
```

`VAPID_PRIVATE_JWK` বানাতে (এক লাইনের JSON আসবে, পুরোটা কপি করো):
```bash
node -e "crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign']).then(k=>crypto.subtle.exportKey('jwk',k.privateKey)).then(j=>console.log(JSON.stringify(j)))"
```
⚠️ এই key বদলালে আগে যারা notification চালু করেছিল তাদের আবার চালু করতে হবে — চলতি site-এর key বদলিও না।

`MONGODB_URI` / `MONGODB_DB` আর লাগে না (site এখন Neon-এ) — থাকলে মুছে দিতে পারো।

Variable যোগ/বদলের পর **Deployments → Redeploy** করো।

## ৪. যা নিজে থেকে চালু হয় (vercel.json-এ লেখা)
- **Cron**: প্রতিদিন 14:00 UTC (বাংলাদেশ সময় রাত ৮টা) `/api/push-cron` — দিনের reminder notification।
- **Security headers** ও **Content-Security-Policy** (`npm run sync` নিজে update করে)।
- **Redirect**: `university-model-test-sbs-updated.vercel.app` → মূল ঠিকানা (Google যেন একটাই site দেখে)।
  নতুন project-এ নাম/ঠিকানা আলাদা হলে `vercel.json`-এর `redirects` অংশে host বদলাও বা মুছে দাও।

## ৫. ঠিকানা (Domain) আর Google
- মূল ঠিকানা: Settings → **Domains**-এ `sbs-university-admission-model-test.vercel.app` (বা নিজের domain) যোগ করো।
- ঠিকানা বদলালে `data/site.js`-এর `SITE.url` বদলাও — canonical link, sitemap আর search page সব এখান থেকে তৈরি হয়। তারপর `npm run sync`।
- Google Search Console verification দুটো জিনিস দিয়ে করা: `google79aa884cbe996390.html` ফাইল আর `index.html`-এর `google-site-verification` meta tag — **মুছবে না**।
- Search Console → Sitemaps → `sitemap.xml` submit করো।

## ৬. চালু হয়েছে কিনা দেখা
- Site খুলে নাম দিয়ে একটা test দাও → Score tab-এ leaderboard-এ নাম আসে কিনা দেখো।
- Home page-এ “N জন এখন অনলাইনে” / “আজ ভিজিট করেছেন N জন” দেখা গেলে database ঠিক আছে।
- `https://<ঠিকানা>/mcq/` খুললে search page দেখাবে।

## ৭. নিজের computer-এ চালানো
```bash
npm install
npm run dev      # http://localhost:3000 (DATABASE_URL না দিলে memory database)
npm run check    # content + সব test
```
নতুন প্রশ্ন/টপিক যোগের নিয়ম: `CONTENT_GUIDE.md`।
