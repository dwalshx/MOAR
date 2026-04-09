---
phase: 02-core-logging
plan: 03
subsystem: pages-navigation
tags: [react, react-router, dexie, useLiveQuery, navigation, bottom-nav]

requires:
  - phase: 02-core-logging/01
    provides: "workoutService CRUD operations"
  - phase: 02-core-logging/02
    provides: "ActiveWorkout component and all workout UI components"
provides:
  - "HomePage: Start Workout button + active workout resume card"
  - "WorkoutPage: route-integrated ActiveWorkout with auto-navigate on finish"
  - "BottomNav: conditional Workout tab with orange accent when active"
affects: [03-feedback]

tech-stack:
  added: []
  patterns: ["useLiveQuery for active workout detection across pages and nav", "useEffect + useLiveQuery for reactive navigation on workout state changes"]

key-files:
  created: []
  modified:
    - src/pages/HomePage.tsx
    - src/pages/WorkoutPage.tsx
    - src/components/layout/BottomNav.tsx

key-decisions:
  - "No forced auto-redirect on reload — show Resume Workout card instead (friendlier UX)"
  - "WorkoutPage detects completedAt via useLiveQuery to auto-navigate home after finish"
  - "BottomNav Workout tab inserted between Home and History for natural tab order"

patterns-established:
  - "Active workout detection via db.workouts.filter(w => !w.completedAt).first()"
  - "Reactive navigation: useLiveQuery + useEffect for state-driven route changes"

requirements-completed: [LOG-01, LOG-04, LOG-06]

duration: 2min
completed: 2026-04-09
---

# Phase 02 Plan 03: Page Routes and Navigation Integration Summary

**Wired workout UI into page routes and navigation: HomePage with start/resume, WorkoutPage with ActiveWorkout rendering and finish-to-home flow, BottomNav with conditional Workout tab**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T05:54:46Z
- **Completed:** 2026-04-09T05:57:18Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 3

## Accomplishments
- Replaced HomePage placeholder with functional Start Workout button that creates workout via workoutService and navigates to /workout/:id
- Added active workout detection with useLiveQuery showing Resume Workout card when an incomplete workout exists
- Conditional button styling: primary accent when no active workout, secondary card-style when one exists
- Replaced WorkoutPage placeholder with route-integrated ActiveWorkout component using useParams for workout ID
- WorkoutPage auto-navigates home when workout's completedAt is set (finish flow via useLiveQuery + useEffect)
- Invalid workout ID redirects to home with replace
- Added conditional Workout tab to BottomNav between Home and History using useLiveQuery active workout detection
- Workout tab gets orange accent automatically via existing NavLink isActive styling

## Task Commits

Each task was committed atomically:

1. **Task 1: HomePage with Start Workout + active workout redirect** - `4e27f25` (feat)
2. **Task 2: WorkoutPage integration + BottomNav conditional Workout tab** - `f6d95b1` (feat)
3. **Task 3: Full workout flow verification** - auto-approved checkpoint (TypeScript clean, 27/27 tests pass)

## Files Modified
- `src/pages/HomePage.tsx` - Start Workout button, Resume Workout card, active workout detection
- `src/pages/WorkoutPage.tsx` - ActiveWorkout rendering with route params, finish-to-home navigation
- `src/components/layout/BottomNav.tsx` - Conditional Workout tab with useLiveQuery

## Decisions Made
- No forced auto-redirect on reload — Resume Workout card is friendlier than hijacking navigation
- WorkoutPage detects completedAt via useLiveQuery to auto-navigate home after finish (D-26)
- BottomNav Workout tab inserted between Home and History for natural tab ordering

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all pages are fully wired to workoutService, ActiveWorkout component, and Dexie live queries.

## Next Phase Readiness
- Full workout flow is now functional end-to-end: start -> add exercises -> log sets -> finish -> home
- Active workout survives page reload (useLiveQuery re-reads from IndexedDB)
- Ready for Phase 03 (feedback/badges) to layer on top of the logging flow

## Self-Check: PASSED

All 3 modified files verified on disk. Both task commits (4e27f25, f6d95b1) verified in git log.
