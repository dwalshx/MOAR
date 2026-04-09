---
phase: 03-workouts-templates
plan: 01
subsystem: services
tags: [dexie, indexeddb, workout-service, formatters, templates, tdd]

# Dependency graph
requires:
  - phase: 02-core-logging
    provides: workoutService with startWorkout, addExercise, logSet, finishWorkout
provides:
  - updateWorkoutName, getWorkoutVolume, getRecentWorkouts service methods
  - startWorkoutFromTemplate for repeat-last-workout flow
  - upsertTemplate (living templates via finishWorkout)
  - formatRelativeDate and formatVolume display utilities
  - RecentWorkout type export
affects: [03-workouts-templates plans 02 and 03, workout history UI, template selection UI]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD red-green for service and utility functions, template upsert on workout finish]

key-files:
  created:
    - src/utils/formatters.ts
    - src/utils/formatters.test.ts
  modified:
    - src/services/workoutService.ts
    - src/services/workoutService.test.ts

key-decisions:
  - "Template upsert integrated into finishWorkout for automatic living templates"
  - "getRecentWorkouts uses .filter() not .where() for completedAt (Dexie null index pitfall)"
  - "startWorkoutFromTemplate creates empty workout if template not found (graceful fallback)"

patterns-established:
  - "Living templates: finishWorkout auto-upserts template with current exercise list"
  - "Formatter utilities in src/utils/ separate from service layer"

requirements-completed: [WRK-01, WRK-02, WRK-03, WRK-05, WRK-06]

# Metrics
duration: 3min
completed: 2026-04-09
---

# Phase 03 Plan 01: Service Methods and Formatters Summary

**TDD-built workout service methods (naming, volume, history, templates) and display formatters for Phase 3 UI**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-09T15:29:43Z
- **Completed:** 2026-04-09T15:32:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added 5 new service methods (updateWorkoutName, getWorkoutVolume, getRecentWorkouts, startWorkoutFromTemplate, upsertTemplate) with full TDD
- finishWorkout now auto-creates/updates living templates from workout exercise list
- Created formatRelativeDate and formatVolume display utilities with 12 test cases
- Full test suite: 50 tests passing across 4 files with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Formatter utilities with tests** - `fcdc322` (feat)
2. **Task 2: Service methods with tests** - `679b53d` (feat)

_Both tasks followed TDD: RED (failing tests) then GREEN (implementation)._

## Files Created/Modified
- `src/utils/formatters.ts` - formatRelativeDate and formatVolume display utilities
- `src/utils/formatters.test.ts` - 12 test cases for formatter functions
- `src/services/workoutService.ts` - 5 new methods + RecentWorkout type + modified finishWorkout
- `src/services/workoutService.test.ts` - 11 new tests (28 total), workoutTemplates.clear() in beforeEach

## Decisions Made
- Template upsert integrated into finishWorkout for automatic living templates (no separate call needed)
- getRecentWorkouts uses .filter() not .where() for completedAt to avoid Dexie null index pitfall
- startWorkoutFromTemplate creates empty workout if template not found (graceful fallback, not an error)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all methods fully implemented and wired.

## Next Phase Readiness
- All service methods ready for Phase 3 Plans 02 (workout history UI) and 03 (template selection UI)
- RecentWorkout type exported for UI consumption
- Formatters ready for display layer usage

---
*Phase: 03-workouts-templates*
*Completed: 2026-04-09*
