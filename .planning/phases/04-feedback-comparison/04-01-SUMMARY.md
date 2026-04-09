---
phase: 04-feedback-comparison
plan: 01
subsystem: comparison-engine
tags: [tdd, service, comparison, badges, nudges, summary]
dependency_graph:
  requires: [workoutService, database, models]
  provides: [classifySet, suggestTarget, getSetBadgesForExercise, generateWorkoutSummary, BadgeType, SetBadge, ExerciseComparison, WorkoutSummary, NudgeResult]
  affects: [future-badge-ui, future-nudge-ui, future-summary-screen]
tech_stack:
  added: []
  patterns: [pure-function-classification, async-db-query-service, tdd-red-green]
key_files:
  created:
    - src/services/comparisonService.ts
    - src/services/comparisonService.test.ts
  modified: []
decisions:
  - classifySet is pure (no DB) with hasCompletedHistory guard to prevent false PRs on first workout
  - Comeback detection queries all completed workouts (not just those with the exercise) to find the true "last workout"
  - suggestTarget uses first set (lowest setNumber) from last session for nudge text
  - generateWorkoutSummary called before finishWorkout so current workout naturally excluded by completedAt filter
metrics:
  duration: 3min
  completed: 2026-04-09
  tasks_completed: 1
  tasks_total: 1
  test_count: 23
  test_pass: 23
---

# Phase 04 Plan 01: Comparison Service (TDD) Summary

Pure TypeScript comparison engine with classifySet (PR/+1/Matched/null priority), suggestTarget nudge generation, getSetBadgesForExercise DB integration with comeback detection, and generateWorkoutSummary volume/direction/win analysis -- 23 tests all passing.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| bacadcc | test | Add failing tests for comparison service (RED phase) |
| 788caad | feat | Implement comparison service with TDD (GREEN phase) |

## What Was Built

### classifySet (pure function)
- Input: weight, reps, setNumber, lastSessionSets, allHistoricalSets, hasCompletedHistory
- Priority order: PR > +1 > Matched > null
- PR requires hasCompletedHistory=true (prevents false PRs on first-ever workout)
- Guards against zero weight/reps returning null

### suggestTarget (pure function)
- Input: lastSessionSets array
- Output: "Last time: {w} x {r}. Try {w} x {r+1} or {w+5} x {r}" from first set
- Returns null when no history

### getSetBadgesForExercise (async, DB queries)
- Queries last completed workout with same exercise name (excluding current workout)
- Gathers all historical sets for PR detection across all completed workouts
- Returns Map<setId, BadgeType> and isComeback boolean
- Comeback: exercise not in last completed workout overall but has prior history

### generateWorkoutSummary (async, DB queries)
- Compares current workout volume to last same-name completed workout
- Per-exercise direction: up/down/same/new
- Win count = exercises with direction 'up'
- Best achievement: PR description > volume % gain > first workout congratulation
- First-time workout: previousTotalVolume=null, volumeChangePercent=null, direction='new' for all exercises

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comeback detection queried wrong workout set**
- **Found during:** Task 1 GREEN phase
- **Issue:** Comeback logic only checked workouts containing the exercise, missing the case where the last overall completed workout had different exercises
- **Fix:** Changed to query ALL completed workouts to find the true "last workout" before checking exercise membership
- **Files modified:** src/services/comparisonService.ts
- **Commit:** 788caad

## Decisions Made

1. **classifySet is pure with hasCompletedHistory guard** -- Prevents false PRs when user's first-ever workout for an exercise has no history to compare against
2. **Comeback checks all completed workouts** -- The "last workout" for comeback purposes is the most recent completed workout overall, not just those containing the same exercise
3. **suggestTarget uses first set** -- Sorted by setNumber, uses the first set from last session as the reference for nudge text
4. **generateWorkoutSummary runs pre-completion** -- Called before finishWorkout so current workout (no completedAt) is naturally excluded from comparisons

## Known Stubs

None -- all functions are fully implemented and wired to DB queries.

## Self-Check: PASSED
