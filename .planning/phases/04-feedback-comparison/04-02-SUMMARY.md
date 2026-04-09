---
phase: 04-feedback-comparison
plan: 02
subsystem: feedback-ui
tags: [badges, nudges, ui, comparison, dopamine]
dependency_graph:
  requires: [comparisonService, workoutService, database, models]
  provides: [Badge component, SetRow badge prop, SetEntryForm nudge prop, ExerciseCard comparison wiring]
  affects: [active-workout-experience, post-workout-summary]
tech_stack:
  added: []
  patterns: [useEffect for async comparison calls, useLiveQuery-driven re-computation]
key_files:
  created:
    - src/components/workout/Badge.tsx
  modified:
    - src/components/workout/SetRow.tsx
    - src/components/workout/SetEntryForm.tsx
    - src/components/workout/ExerciseCard.tsx
    - src/components/workout/ActiveWorkout.tsx
    - src/services/comparisonService.ts
decisions:
  - Badge renders as inline flex child (not absolute positioned) to avoid z-index complexity
  - Nudge text is static (computed once on mount from last session first set), not updated per-set
  - Volume Up badge derived client-side by comparing currentVolume vs previousVolume in ExerciseCard
  - getLastSessionSetsForExercise exported as reusable helper for nudge and volume comparison
metrics:
  duration: 3min
  completed: "2026-04-09T16:02:00Z"
---

# Phase 04 Plan 02: Feedback Badges and Nudges UI Summary

Per-set colored badge pills and progressive overload nudge text wired into the active workout UI, completing the core "Minecraft dopamine layer" for instant set feedback.

## What Was Done

### Task 1: Badge Component and SetRow Badge Prop (d9437a4)

Created `Badge.tsx` -- a reusable colored pill component that accepts a `BadgeType` and renders with the correct color scheme:
- PR: gold (#fbbf24), +1: green (#22c55e), Matched: blue (#3b82f6), Volume Up: purple (#a855f7), Comeback: orange (#f97316)
- Pill shape via `rounded-full`, tiny `text-[10px]` font, `inline-flex` for no layout shift

Modified `SetRow.tsx` to accept an optional `badge` prop and render the Badge component inline after weight/reps in the display view. Badge only appears on logged sets, not during editing.

### Task 2: Nudge Text, ExerciseCard Wiring, and Volume Up Header (8bde784)

**SetEntryForm.tsx:** Added optional `nudgeText` prop. When present, renders muted hint text (`text-text-secondary text-xs`) below the Log Set button showing last session numbers with +1/+5 suggestions.

**ExerciseCard.tsx** (orchestrator):
- Imports `getSetBadgesForExercise`, `getLastSessionSetsForExercise`, `suggestTarget` from comparisonService
- Added `workoutId` prop for comparison context
- useEffect on `sets` changes: calls `getSetBadgesForExercise` to compute per-set badges and comeback flag (instant feedback via useLiveQuery reactivity)
- useEffect on mount: calls `getLastSessionSetsForExercise` + `suggestTarget` for nudge text
- Passes `badge` prop to each SetRow, `nudgeText` prop to SetEntryForm
- Collapsed header shows Comeback and Volume Up badges next to set count

**ActiveWorkout.tsx:** Passes `workoutId` to each ExerciseCard.

**comparisonService.ts:** Added `getLastSessionSetsForExercise` helper that returns last session sets and previous volume for an exercise.

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Badge positioning**: Used inline flex child rather than absolute positioning. The existing `gap-4` flex container absorbs the badge naturally with no layout shift.
2. **Static nudge**: Nudge text computed once on mount from last session's first set, not re-computed after each logged set. Keeps it simple -- the nudge is a whisper, not a live counter.
3. **Volume Up derivation**: ExerciseCard tracks currentVolume (from sets reduce) and previousVolume (from getLastSessionSetsForExercise) to derive Volume Up badge, rather than expanding the getSetBadgesForExercise return type.

## Known Stubs

None -- all data flows are wired end-to-end through comparisonService.

## Verification

- All 73 existing tests pass (5 test files)
- All acceptance criteria grep checks pass for both tasks

## Self-Check: PASSED
