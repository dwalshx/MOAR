# Roadmap: MOAR

## Overview

MOAR goes from zero to gym-ready weightlifting tracker in 6 phases. We start with the data layer and scaffold, build the core set-logging flow, add workout templates and repeat-last, layer on micro-feedback and comparison, expose history and charts, then wrap it as a PWA for home screen use. Every phase delivers something testable on a phone.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Project scaffold, data layer, and mobile-first shell
- [ ] **Phase 2: Core Logging** - Active workout screen with fast set entry
- [ ] **Phase 3: Workouts & Templates** - Named workouts, repeat-last, living templates
- [ ] **Phase 4: Feedback & Comparison** - Per-set badges, post-workout summary, overload nudges
- [ ] **Phase 5: History & Charts** - Workout history, exercise history, volume-over-time charts
- [ ] **Phase 6: PWA Polish** - Add-to-home-screen, offline reliability, final mobile tuning

## Phase Details

### Phase 1: Foundation
**Goal**: The app runs on a phone with a working data layer and navigation shell
**Depends on**: Nothing (first phase)
**Requirements**: PLT-01, PLT-02
**Success Criteria** (what must be TRUE):
  1. App loads in mobile Safari and Chrome with no console errors
  2. IndexedDB database is created with workout, exercise, and set tables on first load
  3. Navigation shell renders with route structure (home, active workout, history)
  4. Layout is mobile-first with tap-friendly sizing (44px+ touch targets)
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Vite project, install deps, Tailwind CSS 4 dark theme, Dexie data layer with tests
- [x] 01-02-PLAN.md — Navigation shell with React Router, bottom tab bar, mobile-first layout, page placeholders

**UI hint**: yes

### Phase 2: Core Logging
**Goal**: User can open a workout, add exercises, and log sets with minimal taps
**Depends on**: Phase 1
**Requirements**: LOG-01, LOG-02, LOG-03, LOG-04, LOG-05, LOG-06
**Success Criteria** (what must be TRUE):
  1. User can log a set (weight + reps) in 1-3 taps using pre-filled values and stepper buttons
  2. User can jump between exercise cards freely during an active workout
  3. User can edit or delete any logged set
  4. Every logged set is silently timestamped and persisted to IndexedDB immediately
  5. Active workout survives app reload without data loss
**Plans**: TBD
**UI hint**: yes

### Phase 3: Workouts & Templates
**Goal**: User can name workouts, repeat last session with one tap, and have templates that stay current
**Depends on**: Phase 2
**Requirements**: WRK-01, WRK-02, WRK-03, WRK-04, WRK-05, WRK-06
**Success Criteria** (what must be TRUE):
  1. User can create a named workout and start an empty workout from the home screen
  2. User can tap "Repeat Last" and get the previous workout's exercises pre-loaded with last session's numbers
  3. User can add exercises mid-workout with freeform text entry and autocomplete from history
  4. Templates auto-update when the user modifies a workout (adds/removes exercises, changes order)
  5. Active workout state recovers fully on app reload (no data loss mid-workout)
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Service layer: new workoutService methods (template CRUD, recent workouts, volume) + formatter utilities with TDD
- [x] 03-02-PLAN.md — Editable WorkoutHeader with debounced name save, verify template upsert on finish
- [x] 03-03-PLAN.md — RecentWorkouts list on HomePage with one-tap Repeat flow and visual verification

**UI hint**: yes

### Phase 4: Feedback & Comparison
**Goal**: Every set gives instant micro-feedback, and finishing a workout shows a motivating summary
**Depends on**: Phase 3
**Requirements**: FBK-01, FBK-02, FBK-03
**Success Criteria** (what must be TRUE):
  1. Logging a set shows a badge when it is a PR, +1 rep, matched previous, volume up, or comeback
  2. Finishing a workout displays a summary with total volume comparison, win count, and highlights
  3. During a workout, user sees progressive overload nudges suggesting +1 rep or +5 lbs based on last session
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Comparison engine service with TDD: classifySet, suggestTarget, getSetBadgesForExercise, generateWorkoutSummary
- [ ] 04-02-PLAN.md — Badge pill component, SetRow badge prop, SetEntryForm nudge text, ExerciseCard wiring
- [x] 04-03-PLAN.md — Post-workout summary screen, finish flow intercept, WorkoutPage redirect guard

**UI hint**: yes

### Phase 5: History & Charts
**Goal**: User can browse past workouts, view exercise history, and see volume trends over time
**Depends on**: Phase 4
**Requirements**: HST-01, HST-02, HST-03, FBK-04, FBK-05
**Success Criteria** (what must be TRUE):
  1. User can view a list of past workouts showing date, name, and total volume
  2. User can tap a workout to see its full detail (exercises, sets, volume)
  3. User can view per-exercise history across all workouts
  4. User can see a volume-over-time line chart for any individual exercise
  5. User can see a total workout volume-over-time line chart
**Plans**: TBD
**UI hint**: yes

### Phase 6: PWA Polish
**Goal**: App works as a home-screen PWA with reliable offline support and polished mobile UX
**Depends on**: Phase 5
**Requirements**: PLT-03
**Success Criteria** (what must be TRUE):
  1. User can add the app to their home screen and launch it as a standalone app (no browser chrome)
  2. App works fully offline after first load (service worker caches all assets)
  3. App prompts for persistent storage to prevent iOS Safari eviction
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4 > 5 > 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Planning complete | - |
| 2. Core Logging | 0/TBD | Not started | - |
| 3. Workouts & Templates | 0/3 | Planning complete | - |
| 4. Feedback & Comparison | 0/3 | Planning complete | - |
| 5. History & Charts | 0/TBD | Not started | - |
| 6. PWA Polish | 0/TBD | Not started | - |
