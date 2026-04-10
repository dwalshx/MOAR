---
phase: 06-pwa-polish
plan: 01
subsystem: infra
tags: [pwa, vite-plugin-pwa, workbox, service-worker, manifest, ios, install-prompt]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Vite + React + Tailwind scaffold and index.html/main.tsx entry points
  - phase: 02-core-logging
    provides: Dexie workouts table with completedAt used to gate install prompt
provides:
  - VitePWA configuration generating service worker and web manifest
  - Placeholder PWA icons (192/512/180) and icon generator script
  - iOS apple-mobile-web-app meta tags and apple-touch-icon
  - Persistent storage request on startup (navigator.storage.persist)
  - Conditional InstallPromptBanner with iOS/Android/fallback UX and permanent dismiss
affects: [future phases touching app shell, offline behavior, or install UX]

# Tech tracking
tech-stack:
  added:
    - vite-plugin-pwa@1.2.0 (Workbox-backed PWA generation)
    - sharp (dev-only, one-off icon rasterization)
    - react-is (recharts peer — pre-existing latent dep, installed as build unblock)
  patterns:
    - Service worker precache-all via globPatterns (no runtimeCaching — fully local app)
    - Three-gate banner visibility (dismissed flag + standalone check + completedCount > 0)
    - Fire-and-forget persistent storage request (non-blocking)
    - beforeinstallprompt event captured in useRef for deferred native install trigger

key-files:
  created:
    - src/components/pwa/InstallPromptBanner.tsx
    - public/pwa-192.png
    - public/pwa-512.png
    - public/apple-touch-icon.png
    - public/pwa-icon.svg
    - scripts/generate-pwa-icons.mjs
  modified:
    - vite.config.ts
    - index.html
    - src/main.tsx
    - src/pages/HomePage.tsx
    - src/services/comparisonService.ts (unblock pre-existing unused-import build error)
    - src/services/comparisonService.test.ts (unblock pre-existing unused-import build error)
    - package.json / package-lock.json

key-decisions:
  - "registerType: 'prompt' so users consent to updates rather than silent reload"
  - "Cache-first precache-only strategy — no runtimeCaching since there is no backend"
  - "Placeholder icons generated locally via sharp from inline SVG (upgrade path preserved)"
  - "Install banner rendered below RecentWorkouts so it never pushes the primary CTA down"
  - "Install banner uses live completed-workout count so it appears instantly after first finish"
  - "Permanent dismissal via localStorage flag (no per-session re-prompting)"

patterns-established:
  - "PWA config: VitePWA with globPatterns precache and empty runtimeCaching for local-first apps"
  - "Install prompt: defer UI until user has experienced the app at least once (first completion)"
  - "iOS/Android platform split via userAgent for install instructions, beforeinstallprompt only on supporting browsers"

requirements-completed: [PLT-03]

# Metrics
duration: 5min
completed: 2026-04-10
---

# Phase 6 Plan 01: PWA Polish Summary

**MOAR is now a Workbox-backed installable PWA with offline precaching, iOS meta tags, persistent storage, and a conditional install banner that only appears after the first completed workout.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-10T04:12:25Z
- **Completed:** 2026-04-10T04:17:38Z
- **Tasks:** 3 (2 auto + 1 auto-approved human-verify checkpoint)
- **Files modified:** 12 (6 created, 6 modified)

## Accomplishments

- Production build now emits `dist/sw.js` and `dist/manifest.webmanifest` with 16 precached entries (~740 KiB)
- App meets add-to-home-screen requirements on iOS Safari and Android Chrome: manifest, icons, theme color, and apple-mobile-web-app meta tags are all wired
- Install prompt banner shows only after first completed workout, is permanently dismissible via `moar-install-dismissed` localStorage flag, and adapts copy to iOS (Share > Add to Home Screen) vs Android/Chromium (native `beforeinstallprompt` Install button) vs other (browser menu fallback)
- Persistent storage silently requested on startup to mitigate iOS Safari eviction (Pitfall #2)
- Satisfies PLT-03 (PWA-capable) — the final requirement gate for v1.0

## Task Commits

1. **Task 1: PWA infrastructure** — `9b85d90` (feat)
2. **Task 2: Install prompt banner** — `81841fb` (feat)
3. **Task 3: Human-verify checkpoint** — auto-approved in `--auto` mode

## Files Created/Modified

### Created

- `src/components/pwa/InstallPromptBanner.tsx` — Dismissible, platform-aware install banner with live completed-workout gate
- `public/pwa-192.png`, `public/pwa-512.png`, `public/apple-touch-icon.png` — Placeholder icons (orange "M" on dark rounded-rect)
- `public/pwa-icon.svg` — Source SVG for the placeholder mark (also precached)
- `scripts/generate-pwa-icons.mjs` — One-off sharp-based generator so the icons can be regenerated later

### Modified

- `vite.config.ts` — Added `VitePWA` plugin (manifest, precache globPatterns, no runtimeCaching) and vitest triple-slash reference
- `index.html` — Added theme-color, apple-mobile-web-app-capable, mobile-web-app-capable, status-bar-style, app title, and apple-touch-icon link
- `src/main.tsx` — Added non-blocking `navigator.storage.persist()` call after root render
- `src/pages/HomePage.tsx` — Imported and rendered `InstallPromptBanner` below `RecentWorkouts`
- `src/services/comparisonService.ts` — Removed unused `WorkoutSet` import (pre-existing TS6133 blocker)
- `src/services/comparisonService.test.ts` — Removed unused `BadgeType` import (pre-existing TS6133 blocker)
- `package.json` / `package-lock.json` — Added `vite-plugin-pwa`, `sharp` (dev), and `react-is`

## Decisions Made

- **registerType: 'prompt'** — per D-13, users confirm reload on new versions rather than surprise refresh
- **Placeholder icons via sharp** — cheap, deterministic, no binary assets committed to planning; script stays around so the mark can be regenerated or upgraded without re-reading the plan
- **Empty runtimeCaching** — the app has no backend API, so Workbox precache-only is sufficient (per D-11)
- **`'any maskable'` icon purpose** — single icon entries serve both use cases and keep manifest minimal for the placeholder stage
- **Banner below RecentWorkouts** — keeps "Start Workout" CTA as the top action, so the prompt feels helpful rather than nagging (per specifics)
- **Live query for completed count** — banner appears immediately after the first finish without any manual refresh
- **Permanent dismiss (not session)** — matches D-19 "don't show again" semantics

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing unused-import TS errors blocked `npm run build`**
- **Found during:** Task 1 verification (`npm run build`)
- **Issue:** `src/services/comparisonService.ts` imported `WorkoutSet` and `src/services/comparisonService.test.ts` imported `BadgeType` but neither was used. With `noUnusedLocals`/`noUnusedParameters` on, `tsc -b` failed before `vite build` could run. These errors pre-dated this plan (confirmed via `git stash` comparison against HEAD) but were a blocker for the plan's acceptance criterion "npm run build succeeds".
- **Fix:** Removed both unused imports.
- **Files modified:** `src/services/comparisonService.ts`, `src/services/comparisonService.test.ts`
- **Verification:** `tsc -b` now passes with exit 0.
- **Committed in:** `9b85d90` (Task 1 commit)

**2. [Rule 3 - Blocking] `vite-plugin-pwa` requires `--legacy-peer-deps` against Vite 8**
- **Found during:** Task 1 (installing the plugin)
- **Issue:** `vite-plugin-pwa@1.2.0` declares peer range `^3 || ^4 || ^5 || ^6 || ^7`, but this project is on Vite 8. Fresh `npm install` refused.
- **Fix:** Installed with `--legacy-peer-deps`. Plugin ran cleanly against Vite 8 in practice — the peer range simply hasn't been updated upstream yet.
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** Full `npm run build` succeeds and produces `dist/sw.js` + `dist/manifest.webmanifest` + `dist/registerSW.js`.
- **Committed in:** `9b85d90`

**3. [Rule 3 - Blocking] `test` key on vite `defineConfig` rejected by TypeScript**
- **Found during:** Task 1 build attempt
- **Issue:** Project was using vite's `defineConfig` with an inline `test` block (vitest), which TS flagged as TS2769 "Object literal may only specify known properties". The repo was already on vitest 4 so this had likely been a latent issue masked by the earlier `tsc` failures.
- **Fix:** Added `/// <reference types="vitest/config" />` at the top of `vite.config.ts` so vitest augments `UserConfigExport` with its `test` field.
- **Files modified:** `vite.config.ts`
- **Verification:** `tsc -b` passes, `vite build` succeeds.
- **Committed in:** `9b85d90`

**4. [Rule 3 - Blocking] Rolldown could not resolve `react-is` from recharts**
- **Found during:** Task 1 build attempt (after fixing #1–#3)
- **Issue:** `recharts/es6/util/ReactUtils.js` imports `react-is`, but `react-is` was not listed in `package.json`. This is a latent recharts peer issue that was hidden in Phase 05 because the build never progressed this far before TS errors tripped it.
- **Fix:** `npm install react-is --legacy-peer-deps`.
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `vite build` completes cleanly; dist assets present.
- **Committed in:** `9b85d90`

---

**Total deviations:** 4 auto-fixed (all Rule 3 — blocking)
**Impact on plan:** All four fixes were latent build blockers discovered when Phase 6 was the first plan to actually require a passing `npm run build`. None introduced scope creep; each was the minimal change to unblock the PWA build pipeline. The Phase 4/5 executors appear to have relied on `tsc --noEmit` rather than the full build, which masked these problems.

## Issues Encountered

- **Rolldown chunk size warning** — The main bundle is ~705 KiB (~213 KiB gzipped), above Rolldown's 500 KiB warning threshold. Not breaking, and beyond scope for this plan. Logged here as a candidate for a future "code-splitting" polish plan.
- **Chrome auto-install UX** — Chromium browsers will only fire `beforeinstallprompt` if PWA install criteria are met (served over HTTPS or localhost, manifest valid, SW installed). In `vite preview`, the banner will show the Install button path; in plain `vite dev`, it will fall back to the manual-instructions copy. Expected behavior.

## User Setup Required

None — no external services, credentials, or dashboards. The app is fully self-contained.

## Next Phase Readiness

- Phase 6 is the final phase in the v1.0 roadmap — PLT-03 (PWA-capable) is now satisfied and the app is ready for real-device install testing at the gym
- Placeholder icons are functional but visually basic; a future polish pass can swap in a designed icon without touching any other PWA config
- Bundle size (~705 KiB) is a candidate for a future code-splitting plan if startup performance becomes a concern

## Self-Check: PASSED

All claimed files exist on disk, all task commits resolvable in git log, and build artifacts (`dist/sw.js`, `dist/manifest.webmanifest`) present.

---

*Phase: 06-pwa-polish*
*Completed: 2026-04-10*
