# Asset manifest

| File | What | Source / licence |
|---|---|---|
| `assets/img/cu-gate-{480,768,1113}.webp` | Main gate of the University of Chittagong — header (hero) photo on the home and CU pages. Original 109 KB WebP re-encoded at three widths (27 / 47 / 72 KB); browsers download only the size they need. A 24 px blurred preview is inlined in `data/site.js` for an instant first paint. | Supplied by the site owner (credited as "ছবি: সংগৃহীত"). Confirm you have permission to use it, and add the photographer's name to `CU_HERO.credit` in `data/site.js` if known. |
| `assets/img/cu-cover.webp` | Aerial view of the hilly CU campus (480×270) | Extracted from the previous version of this site, where it was embedded as base64 and labelled "reference থেকে পুনর্নির্মিত" (re-created from a reference). Used as the always-available fallback. |
| `assets/img/cu-buildings.webp` | Campus buildings among hills (480×270) | Same as above; shown as "Illustrative image". |
| `assets/img/favicon.svg` | App icon | Original project asset. |

## Remote photos (Wikimedia Commons)

Listed in `data/site.js → CU_PHOTOS`. Loaded at runtime from
`commons.wikimedia.org/wiki/Special:FilePath/…`; each has a credit link to its
Commons file page, where author and licence (commonly CC BY-SA 4.0) are listed.
If a file cannot load, the gallery hides it (remote-only) or keeps the local
image (when a local fallback exists), so the page never shows a broken image.

* `Campus, University of Chittagong 1.jpg` (hero; already used as the og:image before)
* `Central Shaheed Minar, University of Chittagong (08).jpg` — Moheen Reeyad
* `Chittagong University Library (04).jpg` — Moheen Reeyad
* `Chittagong University Road (01).jpg` — Moheen Reeyad
* `Chittagong University Museum (02).jpg` — Moheen Reeyad

Before going live, open each Commons page once to confirm the file exists and
the licence/credit; for full reliability, download the photos you like into
`assets/img/` (resize to ~1280 px WebP) and set them as `src`.
