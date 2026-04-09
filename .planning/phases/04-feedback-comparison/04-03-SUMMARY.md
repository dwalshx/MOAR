---
phase: 04-feedback-comparison
plan: 03
subsystem: workout-summary
tags: [feedback, summary, comparison, post-workout]
dependency_graph:
  requires: [04-01]
  provides: [WorkoutSummary-component, finish-flow-intercept]
  affects: [ActiveWorkout, WorkoutPage]
tech_stack:
  added: []
  patterns: [summary-before-finish, showingSummary-redirect-guard]
key_files:
  created:
    - src/components/workout/WorkoutSummary.tsx
  modified:
    - src/components/workout/ActiveWorkout.tsx
    - src/pages/WorkoutPage.tsx
decisions:
  - "Generate summary BEFORE finishWorkout to access current workout data (Pitfall 6)"
  - "showingSummary state in WorkoutPage to prevent completedAt redirect conflict"
  - "allNew check skips win count section for first-time workouts"
metrics:
  duration: 2min
  completed: 2026-04-09
---

# Phase 04 Plan 03: Post-Workout Summary Screen Summary

Full-screen post-workout summary with volume comparison, per-exercise direction arrows, win count, best achievement highlight, and Done navigation -- intercepts finish flow before redirect.

## What Was Done

### Task 1: WorkoutSummary component and finish flow intercept
- **Commit:** 1cc53c3
- Created `WorkoutSummary.tsx` with total volume display, percentage change from last same-name workout, per-exercise comparison list with direction arrows (up/down/same/new), win count, best achievement highlight, and Done button
- Modified `ActiveWorkout.tsx` to call `generateWorkoutSummary` BEFORE `finishWorkout` (Pitfall 6 -- workout must still be active for comparison queries), then render WorkoutSummary as early return
- Modified `WorkoutPage.tsx` to add `showingSummary` state and `onSummaryShow` callback, preventing the `completedAt` redirect guard from firing while summary is displayed
- First-time workouts show "Great start!" with absolute volume, no comparison percentages, and skip the win count section

### Task 2: Visual verification (auto-approved)
- Auto-approved in auto mode

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Summary before finish pattern**: `generateWorkoutSummary` called before `finishWorkout` to ensure the current workout is still active and can be compared against history. This follows Pitfall 6 from RESEARCH.md.
2. **showingSummary redirect guard**: Added `showingSummary` state to WorkoutPage and passed `onSummaryShow` callback to ActiveWorkout. When summary is displayed, the `completedAt` redirect is suppressed. This is the simplest approach that preserves the safety redirect for direct URL access to completed workouts.
3. **allNew detection for first workout**: Rather than checking `previousTotalVolume === null` for the win count section, we check if all exercises have direction `'new'` to correctly skip the "X of Y exercises improved" message.

## Known Stubs

None -- all data flows are wired to live IndexedDB queries via comparisonService.

## Self-Check: PASSED
