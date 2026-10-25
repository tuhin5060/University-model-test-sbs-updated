# Stability and reference audit — 2026-10-25

## Backup / rollback
- Original main commit: `9daa491b028b6579f5242dc7a62aede49294eec9`.
- Immutable rollback target: this commit SHA.
- Backup branch: `backup/pre-stability-fixes-2026-10-25`.
- All proposed changes isolated in `fix/stability-and-reference-audit-2026-10-25`.
- Do not merge or deploy production before passing validation.

## Changes so far
1. `assets/js/shared/source.js`: reference detection now requires an identifiable exam/institution rather than any number. This is a display filter, **not** independent verification of exam origin.
2. `assets/css/styles.css`: long source tags may wrap on smaller screens.
3. `tests/source-reference.test.mjs`: English/Bangla references, practice labels and trimming regression tests.

## Required checks before merge
- `npm run check` and `npm test` must pass in a complete checkout.
- Compare SEO question counts/IDs and render against the source question bank.
- Test 320px and 360px screens with long multi-exam references.
- Verify fun, exam and practice mode, answer submission, results and session persistence.
- Validate cache installation, update, interrupted install, offline reopen, reconnection and reload with DevTools and physical mobile browser. The service-worker cache is suspected but its fault has **not** been reproduced; avoid speculative behavior changes.
- Diagnose online/active status and icon delay under slow network and repeated navigation.
- Review Vercel preview before promotion. Check homepage, assets, API routes and offline behavior on the exact deployment.
- Deploy production only after all checks pass; verify live website and record deployment ID, HTTP status and smoke-test results.

## Rollback
If a deployed change regresses service, redeploy the known-good commit `9daa491b028b6579f5242dc7a62aede49294eec9` through the normal deployment pipeline. For clients already running an updated service worker, validate SW recovery and reload after rollback.
