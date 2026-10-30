// Offline copy of the site, so a weak connection never leaves the page loading.
// Every file of one version (index.html, styles, all modules) is stored together
// and served from the phone; a new deploy changes VERSION, the new set is
// downloaded in the background and the page offers a reload. Of /api only the
// leaderboard is kept (last good answer, shown when offline or when the server
// has trouble); it is the same for everyone, so nothing personal is cached.
// The block between the markers is written by `node scripts/preload.mjs`.

// precache:start
const VERSION = 'faaf0826a549';
const PRECACHE = [
  './',
  'assets/css/styles.css?v=2.19.0',
  'assets/js/main.js?v=2.19.0',
  'assets/js/components.js',
  'assets/js/lib/api.js',
  'assets/js/lib/bank.js',
  'assets/js/lib/cloud.js',
  'assets/js/lib/college.js',
  'assets/js/lib/dom.js',
  'assets/js/lib/fx.js',
  'assets/js/lib/identity.js',
  'assets/js/lib/inapp.js',
  'assets/js/lib/live.js',
  'assets/js/lib/outbox.js',
  'assets/js/lib/push.js',
  'assets/js/lib/store.js',
  'assets/js/pages/admin.js',
  'assets/js/pages/community.js',
  'assets/js/pages/daily.js',
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
  'assets/js/shared/daily.js',
  'assets/js/shared/names.js',
  'assets/js/shared/scoring.js',
  'assets/js/shared/source.js',
  'data/colleges.js',
  'data/posts.js',
  'data/questions/adjective.js',
  'data/questions/adverb.js',
  'data/questions/appropriate-preposition.js',
  'data/questions/article.js',
  'data/questions/causative-verb.js',
  'data/questions/comparison.js',
  'data/questions/conditional-sentences.js',
  'data/questions/gender.js',
  'data/questions/hope-wish.js',
  'data/questions/index.js',
  'data/questions/meta.js',
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
const API = 'campus-api';

self.addEventListener('install', event => {
  // Never activate a partially cached application. Failed installs keep the old worker.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' })));
      await self.skipWaiting();
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => ![CACHE, RUNTIME, API].includes(k)).map(k => caches.delete(k))))
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

/** Leaderboard: the server's answer when it comes in time, else the last good one. */
async function networkFirst(request) {
  const cache = await caches.open(API);
  const fromCache = async () => {
    const hit = await cache.match(request);
    if (!hit) return null;
    const headers = new Headers(hit.headers);
    headers.set('x-offline-copy', '1');
    return new Response(hit.body, { status: 200, headers });
  };
  try {
    const res = await Promise.race([fetch(request), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 8000))]);
    if (res.ok) {
      cache.put(request, res.clone());
      return res;
    }
    return (await fromCache()) || res;
  } catch (err) {
    const copy = await fromCache();
    if (copy) return copy;
    throw err;
  }
}

const shared = url => url.pathname === '/api/scores' && !url.searchParams.has('me');

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) {
      if (shared(url)) event.respondWith(networkFirst(request));
      return;
    }
    if (url.pathname.startsWith('/_vercel/')) return;
    if (request.mode === 'navigate') {
      if (url.pathname !== '/' && url.pathname !== '/index.html') return;
      event.respondWith(caches.open(CACHE).then(c => c.match('./')).then(hit => hit || fetch(request)));
      return;
    }
    // Other images (photos further down the pages) are kept after the first view.
    if (url.pathname.startsWith('/assets/img/')) {
      event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(res => {
        if (res.ok) caches.open(RUNTIME).then(c => c.put(request, res.clone()));
        return res;
      })));
      return;
    }
    event.respondWith(caches.open(CACHE).then(c => c.match(request)).then(hit => hit || fetch(request)));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// ---- Notifications (server: server/routes/push.js) -----------------------------
// A push carries no text; ask the server what to show (a test message or the day's reminder).
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let message = null;
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const res = await fetch(`/api/push?message=1${sub ? `&endpoint=${encodeURIComponent(sub.endpoint)}` : ''}`, { cache: 'no-store' });
      message = (await res.json()).message;
    } catch { /* offline: show the default text */ }
    message ||= { title: 'ক্যাম্পাসের পথে', body: 'আজকের practice বাকি আছে—কয়েক মিনিট সময় দাও!', url: '/#home' };
    await self.registration.showNotification(message.title, {
      body: message.body,
      icon: '/assets/img/icon-192.png',
      badge: '/assets/img/icon-192.png',
      tag: 'campus-daily',
      renotify: true,
      data: { url: message.url || '/#home' },
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/#home', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => new URL(c.url).origin === self.location.origin);
    if (open) return open.navigate(url).then(c => (c || open).focus()).catch(() => open.focus());
    return self.clients.openWindow(url);
  }));
});
