---
phase: 05-history-charts
plan: 02
subsystem: ui
tags: [react, recharts, history, charts, infinite-scroll, react-router]

requires:
  - phase: 05-history-charts/01
    provides: workoutService methods (getCompletedWorkouts, getWorkoutDetail, getWorkoutVolumeChartData), formatters (formatAbsoluteDate, formatDuration)
provides:
  - HistoryPage with infinite scroll workout list and volume-over-time chart
  - WorkoutDetailPage with full exercise/set breakdown
  - HistoryWorkoutCard reusable component
  - WorkoutVolumeChart reusable Recharts component
  - /history/:id route
affects: [05-history-charts]

tech-stack:
  added: []
  patterns: [IntersectionObserver infinite scroll, Recharts dark theme chart, read-only detail page]

key-files:
  created:
    - src/components/history/HistoryWorkoutCard.tsx
    - src/components/history/WorkoutVolumeChart.tsx
    - src/pages/WorkoutDetailPage.tsx
  modified:
    - src/pages/HistoryPage.tsx
    - src/App.tsx

key-decisions:
  - "useLiveQuery with growing limit for infinite scroll (simplest reactive approach per RESEARCH.md)"
  - "IntersectionObserver sentinel div for scroll detection (no external dependencies)"
  - "Chart minimum 2 data points before rendering line (shows message for < 2)"

patterns-established:
  - "IntersectionObserver infinite scroll: sentinel div at list bottom, increase limit state on intersect"
  - "Recharts dark theme: #f97316 line, #a3a3a3 axis text, #242424 tooltip bg, trigger=click for touch"
  - "Read-only detail page: back button, exercise names as tappable accent-colored links"

requirements-completed: [HST-01, HST-03, FBK-05]

duration: 3min
completed: 2026-04-10
---

# Phase 05 Plan 02: History Pages & Volume Chart Summary

**HistoryPage with infinite-scroll workout list and Recharts volume chart, WorkoutDetailPage with exercise breakdown and tappable exercise links**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-10T02:51:07Z
- **Completed:** 2026-04-10T02:54:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- HistoryPage shows scrollable list of all completed workouts with volume-over-time chart above
- Infinite scroll via IntersectionObserver loads workouts in batches of 20
- WorkoutDetailPage shows full workout breakdown with exercises, sets table, volume, and duration
- Exercise names in detail page are tappable links to ExerciseDetailPage
- /history/:id route wired in App.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: HistoryWorkoutCard + WorkoutVolumeChart components** - `c7ae386` (feat)
2. **Task 2: HistoryPage, WorkoutDetailPage, and route wiring** - `20e307d` (feat)

## Files Created/Modified
- `src/components/history/HistoryWorkoutCard.tsx` - Read-only workout card (RecentWorkoutCard style, no Repeat button)
- `src/components/history/WorkoutVolumeChart.tsx` - Recharts LineChart with dark theme and touch-friendly tooltip
- `src/pages/HistoryPage.tsx` - Full history page replacing placeholder, with chart and infinite scroll
- `src/pages/WorkoutDetailPage.tsx` - Workout detail with exercise/set breakdown, duration, volume
- `src/App.tsx` - Added /history/:id route and WorkoutDetailPage import

## Decisions Made
- Used useLiveQuery with growing limit (not manual pagination state) for infinite scroll -- simplest reactive approach, Dexie fast enough for expected data sizes
- IntersectionObserver on sentinel div for scroll detection -- no external library needed
- Chart shows "Complete more workouts to see your trend" when < 2 data points
- Back button uses navigate(-1) for natural browser-like behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failure in `workoutService.test.ts` (`getWorkoutVolumeChartData` test expects volume order that doesn't match service output). Not caused by this plan's changes -- logged as out-of-scope.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all components are fully wired to service layer data.

## Next Phase Readiness
- History browsing experience complete (HST-01, HST-03, FBK-05)
- Plan 03 (ExerciseDetailPage) can now link back from exercise names in WorkoutDetailPage
- WorkoutVolumeChart component pattern can be reused for per-exercise charts

## Self-Check: PASSED

- All 5 source files: FOUND
- Commit c7ae386 (Task 1): FOUND
- Commit 20e307d (Task 2): FOUND

---
*Phase: 05-history-charts*
*Completed: 2026-04-10*
