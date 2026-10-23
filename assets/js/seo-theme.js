// Search pages (mcq/, tips/, universities/): the same light/dark theme the app uses.
try {
  var t = localStorage.getItem('campus-theme') || 'auto';
  document.documentElement.dataset.theme = t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
} catch (e) {}
