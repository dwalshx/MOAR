# Architecture Research: Mobile-First Weightlifting Tracker

**Researched:** 2026-04-08
**Domain:** Local-first PWA, workout data management

## System Overview

A single-page application with local persistence. No backend, no API. All logic runs in the browser.

```
┌─────────────────────────────────────────────┐
│                   UI Layer                   │
│  ┌──────┐ ┌──────────┐ ┌────────┐ ┌──────┐ │
│  │ Home │ │ Active   │ │Exercise│ │History│ │
│  │Screen│ │ Workout  │ │ Detail │ │ List │ │
│  └──┬───┘ └────┬─────┘ └───┬────┘ └──┬───┘ │
│     └──────────┴────────────┴─────────┘     │
│                     │                        │
│              ┌──────┴──────┐                 │
│              │  App State  │                 │
│              │ (useReducer)│                 │
│              └──────┬──────┘                 │
├─────────────────────┼───────────────────────┤
│              Service Layer                   │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Workout  │ │Comparison│ │  Template   │ │
│  │ Service  │ │ Engine   │ │  Service    │ │
│  └────┬─────┘ └────┬─────┘ └──────┬──────┘ │
│       └─────────────┴──────────────┘        │
│                     │                        │
├─────────────────────┼───────────────────────┤
│              Data Layer                      │
│  ┌──────────────────┴──────────────────┐    │
│  │          Dexie.js (IndexedDB)       │    │
│  │  ┌──────────┐ ┌──────────┐         │    │
│  │  │ Workouts │ │Exercises │         │    │
│  │  │  Table   │ │  Table   │         │    │
│  │  └──────────┘ └──────────┘         │    │
│  │  ┌──────────┐ ┌──────────┐         │    │
│  │  │   Sets   │ │Templates │         │    │
│  │  │  Table   │ │  Table   │         │    │
│  │  └──────────┘ └──────────┘         │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Data Model

### Core Entities

```typescript
interface Workout {
  id: string;           // UUID
  name: string;         // "Full Body", "Push Day"
  templateId?: string;  // Links to template for "repeat last"
  startedAt: Date;      // When workout began
  completedAt?: Date;   // When finished (null = in progress)
  notes?: string;
}

interface WorkoutExercise {
  id: string;
  workoutId: string;    // FK to Workout
  exerciseName: string; // Freeform, normalized for matching
  order: number;        // Display order in workout
}

interface WorkoutSet {
  id: string;
  workoutExerciseId: string;  // FK to WorkoutExercise
  setNumber: number;
  weight: number;       // In lbs (user's preference)
  reps: number;
  timestamp: Date;      // Silent — logged automatically
  // Computed/cached:
  volume?: number;      // weight * reps
}

interface WorkoutTemplate {
  id: string;
  name: string;         // "Full Body"
  lastUsed: Date;
  exercises: string[];  // Exercise names in order
}
```

### Key Relationships

```
Template 1──* Workout 1──* WorkoutExercise 1──* WorkoutSet
```

- A template has many workouts (each session)
- A workout has many exercises
- An exercise (within a workout) has many sets
- Exercise names are freeform strings, matched case-insensitively

### Indexes for Performance

```
Workouts: [name, startedAt, templateId]
WorkoutExercises: [workoutId, exerciseName]
WorkoutSets: [workoutExerciseId, timestamp]
```

Key queries that must be fast:
- "Get all workouts named X, most recent first" (repeat last)
- "Get all sets for exercise Y across all workouts" (exercise history/charts)
- "Get last workout's exercises and sets" (pre-populate template)

## Component Architecture

### Pages (4 routes)

1. **Home** (`/`)
   - Recent workouts list
   - Template quick-start buttons
   - "Start New Workout" button

2. **Active Workout** (`/workout/:id`)
   - Exercise cards grid/list
   - Tap card → expand to log sets
   - Set entry: weight + reps + "Log Set" button
   - Per-set feedback badges
   - "Finish Workout" button

3. **Exercise Detail** (`/exercise/:name`)
   - History table (date, sets, total volume)
   - Volume-over-time chart
   - PR records

4. **Workout History** (`/history`)
   - All past workouts by date
   - Total volume per workout
   - Tap to view details

### Shared Components

- **ExerciseCard** — displays exercise name, sets logged, current volume, feedback badges
- **SetEntry** — weight/reps input with +/- buttons, "Log Set" action
- **FeedbackBadge** — PR, +1, matched, volume up, comeback
- **VolumeChart** — Recharts line chart, reusable for exercise and workout level
- **ExerciseAutocomplete** — freeform input with history suggestions

## Service Layer

### WorkoutService
- `startWorkout(name, templateId?)` — creates workout, loads template exercises
- `addExercise(workoutId, name)` — adds exercise to active workout
- `logSet(exerciseId, weight, reps)` — logs set with timestamp
- `finishWorkout(workoutId)` — marks complete, updates template
- `getWorkoutHistory()` — all workouts, most recent first
- `getLastWorkout(templateName)` — for "repeat last" flow

### ComparisonEngine
- `compareSet(currentSet, lastSessionSets)` — returns feedback type (PR/+1/matched/etc)
- `compareExercise(currentExerciseSets, lastSessionSets)` — volume comparison
- `compareWorkout(currentWorkout, lastWorkout)` — total volume, win count
- `getExercisePR(exerciseName)` — best set ever
- `suggestTarget(exerciseName)` — nudge for next set

### TemplateService
- `getTemplates()` — all named templates
- `createFromWorkout(workout)` — saves current workout as template
- `updateTemplate(templateId, workout)` — living template update

## Data Flow

### Logging a Set (Critical Path)
```
User taps "Log Set"
  → SetEntry dispatches action
  → WorkoutReducer updates UI state
  → WorkoutService.logSet() persists to Dexie
  → ComparisonEngine.compareSet() runs against last session
  → FeedbackBadge renders result

Total time target: < 100ms from tap to feedback
```

### Starting a Workout (Repeat Last)
```
User taps template on Home
  → WorkoutService.getLastWorkout(templateName)
  → Creates new Workout with same exercises
  → Loads last session's sets as "targets"
  → Navigate to Active Workout screen
  → Exercise cards show last session numbers as baseline
```

### Finishing a Workout
```
User taps "Finish Workout"
  → WorkoutService.finishWorkout()
  → ComparisonEngine.compareWorkout()
  → TemplateService.updateTemplate()
  → Navigate to Post-Workout Summary
  → Show volume comparison, wins, highlights
```

## Build Order (Dependency-Based)

1. **Data layer first** — Dexie schema, models, basic CRUD
2. **Workout logging** — core set entry, exercise management
3. **Navigation + pages** — React Router, page shells
4. **Templates** — repeat last, named workouts
5. **Comparison engine** — set/exercise/workout comparisons
6. **Feedback system** — badges, nudges, summary
7. **Charts** — volume visualization
8. **PWA** — service worker, manifest, offline

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Flat set storage (not nested in exercise) | Enables efficient queries across workouts for exercise history |
| Exercise names as freeform strings | Simplicity over structured library; autocomplete handles UX |
| Timestamps on sets, not rest periods | Derive rest from consecutive timestamps; zero friction |
| Template = snapshot of last workout | Living template pattern; no separate template editor needed |
| useReducer for active workout | Complex state transitions (add set, remove set, reorder) map well to reducer pattern |
