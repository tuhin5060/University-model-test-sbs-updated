// Offline copy of the site, so a weak connection never leaves the page loading.
// Every file of one version (index.html, styles, all modules) is stored together
// and served from the phone; a new deploy changes VERSION, the new set is
// downloaded in the background and the page offers a reload. /api is never cached.
// The block between the markers is written by `node scripts/preload.mjs`.

// precache:start
const VERSION = 'a4954d602936';
const PRECACHE = [
  './',
  'assets/css/styles.css?v=2.5.3',
  'assets/js/main.js?v=2.5.3',
  'assets/js/components.js',
  'assets/js/lib/api.js',
  'assets/js/lib/cloud.js',
  'assets/js/lib/dom.js',
  'assets/js/lib/fx.js',
  'assets/js/lib/live.js',
  'assets/js/lib/store.js',
  'assets/js/pages/community.js',
  'assets/js/pages/home.js',
  'assets/js/pages/misc.js',
  'assets/js/pages/play.js',
  'assets/js/pages/progress.js',
  'assets/js/pages/result.js',
  'assets/js/pages/start.js',
  'assets/js/pages/tips.js',
  'assets/js/pages/universities.js',
  'assets/js/pages/vocab.js',
  'assets/js/quiz.js',
  'assets/js/shared/scoring.js',
  'data/posts.js',
  'data/questions/adverb.js',
  'data/questions/appropriate-preposition.js',
  'data/questions/article.js',
  'data/questions/causative-verb.js',
  'data/questions/conditional-sentences.js',
  'data/questions/gender.js',
  'data/questions/hope-wish.js',
  'data/questions/index.js',
  'data/questions/mixed-english.js',
  'data/questions/modal-verb.js',
  'data/questions/noun.js',
  'data/questions/number.js',
  'data/questions/phrase-idioms.js',
  'data/questions/sequence-of-tense.js',
  'data/questions/subjunctive-verb.js',
  'data/questions/tense.js',
  'data/questions/vocab-antonym.js',
  'data/questions/vocab-bcs.js',
  'data/questions/vocab-meaning.js',
  'data/questions/vocab-synonym.js',
  'data/site.js',
  'data/universities.js',
  'data/university-profiles.js',
  'data/vocabulary.js',
  'manifest.webmanifest',
  'assets/img/logo.svg',
  'assets/img/favicon.svg',
  'assets/img/icon-192.png',
  'assets/img/cu-gate-480.webp',
  'assets/img/cu-gate-768.webp'
];
// precache:end

const CACHE = `campus-${VERSION}`;
const RUNTIME = 'campus-runtime';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'no-cache' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Cached copy at once; a fresh copy is stored for next time. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(request);
  const fresh = fetch(request).then(res => {
    if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
    return res;
  });
  if (hit) {
    fresh.catch(() => {});
    return hit;
  }
  return fresh;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/')) return;
    if (request.mode === 'navigate') {
      if (url.pathname !== '/' && url.pathname !== '/index.html') return;
      event.respondWith(caches.open(CACHE).then(c => c.match('./')).then(hit => hit || fetch(request)));
      return;
    }
    event.respondWith(caches.open(CACHE).then(c => c.match(request)).then(hit => hit || fetch(request)));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
