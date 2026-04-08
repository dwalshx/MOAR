# Research Summary: MOAR

**Synthesized:** 2026-04-08

## Key Findings

### Stack
React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + Dexie.js (IndexedDB) + Recharts + React Router 7. Total runtime ~90KB gzipped. PWA via vite-plugin-pwa. No backend needed.

### Table Stakes
Fast set logging (weight + reps in minimal taps), workout history, exercise history, repeat last workout, named templates, offline support, mobile-optimized tap targets.

### Differentiators (MOAR's Unique Value)
Per-set micro-feedback badges (PR/+1/matched/volume up/comeback), progressive overload nudges, volume-over-time charts, post-workout summary with win count, non-linear workout flow (card-based, supports jumping between exercises), passive timestamp collection.

### Watch Out For
1. **Data entry friction** — logging a set must be 1-3 taps. Pre-fill from last session, use +/- steppers not keyboard.
2. **Active workout state loss** — persist every set to IndexedDB immediately, not on workout finish. Recover incomplete workouts on app reload.
3. **Exercise name inconsistency** — normalize names, strong autocomplete from history.
4. **Volume comparison context** — compare per-exercise (apples-to-apples), not just total workout volume.
5. **iOS Safari storage eviction** — prompt Add to Home Screen, request persistent storage.

## Architecture Highlights

- 4 pages: Home, Active Workout, Exercise Detail, Workout History
- Data model: Workout → WorkoutExercise → WorkoutSet (flat, queryable)
- Services: WorkoutService, ComparisonEngine, TemplateService
- State: useReducer for active workout, Dexie for persistence
- Every set persisted immediately (not buffered)

## Build Order Recommendation

1. Project scaffold + data layer (Dexie schema, models)
2. Core logging UI (active workout, set entry, exercise cards)
3. Home screen + templates (repeat last, named workouts)
4. Navigation + workout history
5. Comparison engine + micro-feedback
6. Nudges + post-workout summary
7. Charts (per-exercise + total volume)
8. PWA configuration + polish

## Anti-Features (Don't Build)

- Social/leaderboards, AI workout programming, body measurements, nutrition tracking, complex periodization, exercise videos, rest timer with alarm, mandatory exercise library, workout sharing, achievement badges

## Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Logging too slow | Critical | Pre-fill + steppers + minimal taps |
| Data loss mid-workout | High | Persist every set immediately |
| Exercise name fragmentation | Medium | Normalize + autocomplete |
| Misleading volume comparisons | Medium | Per-exercise over total |
| iOS storage eviction | Low | PWA + persist API |
