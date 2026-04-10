---
phase: 05-history-charts
plan: 03
subsystem: exercise-detail
tags: [exercise-history, volume-chart, recharts, navigation, expandable-rows]
dependency_graph:
  requires: [05-01]
  provides: [exercise-detail-page, exercise-volume-chart, tappable-exercise-links]
  affects: [ExerciseDetailPage, ExerciseCard]
tech_stack:
  added: []
  patterns: [recharts-line-chart, expandable-session-row, accordion-by-db-id, url-encoding]
key_files:
  created:
    - src/components/exercise/ExerciseVolumeChart.tsx
    - src/components/exercise/SessionRow.tsx
  modified:
    - src/pages/ExerciseDetailPage.tsx
    - src/components/workout/ExerciseCard.tsx
decisions:
  - "ExerciseVolumeChart nearly identical to WorkoutVolumeChart -- same Recharts config, dark theme"
  - "SessionRow tracks expansion by workoutId (not array index) following ExerciseCard accordion pattern"
  - "Only expanded exercise name is tappable link -- collapsed card is already a toggle target"
metrics:
  duration: 4min
  completed: "2026-04-10T02:55:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 05 Plan 03: Exercise Detail Page Summary

Per-exercise history page with Recharts volume chart, expandable session rows, and tappable exercise name navigation from active workout.

## What Was Built

### ExerciseVolumeChart (src/components/exercise/ExerciseVolumeChart.tsx)
- Recharts LineChart with dark theme: orange #f97316 line, #a3a3a3 axis text, #333333 grid, #242424 tooltip
- Click-triggered tooltips showing full date via labelFormatter
- Minimum 2 data points required; shows "Complete more sessions to see your trend" otherwise
- Wrapped in h-[200px] container for ResponsiveContainer sizing

### SessionRow (src/components/exercise/SessionRow.tsx)
- Expandable row showing session date (formatRelativeDate), set count, total volume (formatVolume)
- Chevron rotates on expand with CSS transition
- Expanded state shows sets table: Set#, Weight (lbs), Reps
- 44px minimum height for tap-friendly targets
- Follows bg-bg-card rounded-xl styling pattern

### ExerciseDetailPage (src/pages/ExerciseDetailPage.tsx)
- Full replacement of placeholder page
- Gets exercise name from URL params with decodeURIComponent
- useLiveQuery with workoutService.getExerciseHistory for reactive data
- Chart data transformed and reversed for chronological display (oldest-first)
- Back button with navigate(-1)
- Session list with accordion expansion tracked by workoutId
- Empty state: "No history for this exercise yet."

### ExerciseCard Tappable Links (src/components/workout/ExerciseCard.tsx)
- Expanded exercise name styled as text-accent with cursor-pointer
- onClick navigates to /exercise/:name with encodeURIComponent
- stopPropagation prevents parent div onToggle from firing
- Collapsed view unchanged (entire card is already a toggle target)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 60c50a2 | ExerciseVolumeChart and SessionRow components |
| 2 | 3b3fc6b | ExerciseDetailPage and tappable exercise name links |

## Verification

- TypeScript: compiles clean (npx tsc --noEmit)
- Tests: 97 passed, 0 failed (npx vitest run)
- No regressions

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all components are fully wired to live data via workoutService.getExerciseHistory.

## Self-Check: PASSED

- [x] ExerciseVolumeChart.tsx exists
- [x] SessionRow.tsx exists
- [x] ExerciseDetailPage.tsx exists
- [x] Commit 60c50a2 verified
- [x] Commit 3b3fc6b verified
