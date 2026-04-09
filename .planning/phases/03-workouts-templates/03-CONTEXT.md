# Phase 3: Workouts & Templates - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add workout naming, "Repeat Last" quick-start, and living templates. Users can name workouts, see recent workouts on the home screen with a Repeat button, and templates auto-update when workouts are modified. This phase builds on the core logging from Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Naming Flow
- **D-01:** WorkoutHeader (existing component) gets an editable name field — tap the name to edit inline
- **D-02:** Auto-generated default name: "Workout - Mon D" format (e.g., "Workout - Apr 9")
- **D-03:** Name is saved to the workout record whenever it changes (debounced)
- **D-04:** User can also set a custom name like "Full Body" or "Push Day" — this becomes the template name

### Repeat Last UX
- **D-05:** Home screen shows recent workouts as a list (name, date, total volume)
- **D-06:** Each recent workout has a "Repeat" button
- **D-07:** Tapping "Repeat" creates a new workout with the same name, loads all exercises from that workout
- **D-08:** Pre-loads last session's weight/reps for each exercise as starting values (uses existing pre-fill logic from Phase 2)
- **D-09:** After repeating, user lands on active workout screen with all exercises as cards, ready to log

### Template Auto-Update
- **D-10:** Templates are implicit — derived from the workout name, not a separate entity
- **D-11:** When a workout finishes, update the WorkoutTemplate record for that name with the final exercise list
- **D-12:** If no template exists for the name, create one on finish
- **D-13:** Template stores exercise names in order — used by "Repeat" to know which exercises to load
- **D-14:** Modifying a workout (adding/removing/reordering exercises) is reflected in the template on finish — living template

### Home Screen Layout
- **D-15:** "Start New Workout" button remains prominent at top
- **D-16:** Below the button: "Recent Workouts" list showing last 10 workouts
- **D-17:** Each recent workout card shows: name, date (relative: "Today", "Yesterday", "Mon"), total volume (lbs)
- **D-18:** Each card has a "Repeat" action button on the right side
- **D-19:** If an active workout exists, show "Resume Workout" card at top (already from Phase 2, keep it)

### Workout Recovery Enhancement
- **D-20:** Active workout recovery (from Phase 2) should now also restore the workout name
- **D-21:** WRK-06 is covered if the existing Phase 2 recovery works with named workouts — verify, don't rebuild

### Claude's Discretion
- How to compute total volume for display (sum of weight * reps for all sets)
- Relative date formatting approach
- Recent workout card visual styling
- Whether to group repeated workouts by name or show all chronologically
- Exercise reorder UI within a workout (drag? or just add-order based?)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Living templates concept, core value
- `.planning/REQUIREMENTS.md` — WRK-01 through WRK-06
- `.planning/phases/02-core-logging/02-CONTEXT.md` — Exercise entry, persistence, recovery decisions
- `src/services/workoutService.ts` — Existing CRUD operations, getLastSetValues, getExerciseNames
- `src/db/models.ts` — Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate interfaces
- `src/db/database.ts` — Dexie tables including workoutTemplates
- `src/pages/HomePage.tsx` — Current Start/Resume workout UI to extend
- `src/components/workout/WorkoutHeader.tsx` — Current header to add name editing
- `src/components/workout/ActiveWorkout.tsx` — Main workout container

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workoutService.ts`: Already has startWorkout, addExercise, finishWorkout, getLastSetValues
- `WorkoutTemplate` model: Already defined in models.ts with name, lastUsed, exercises[] fields
- `workoutTemplates` table: Already exists in Dexie schema from Phase 1
- `HomePage.tsx`: Already has Start Workout button and active workout detection
- `WorkoutHeader.tsx`: Already has workout name display and Finish button
- `ExerciseInput.tsx`: Already has autocomplete from history

### Established Patterns
- useLiveQuery for reactive data from Dexie
- workoutService for all database operations
- React Router navigation with useNavigate
- Tailwind dark theme with accent color tokens

### Integration Points
- HomePage.tsx — add recent workouts list with Repeat buttons
- WorkoutHeader.tsx — make name editable
- workoutService.ts — add template CRUD, repeat workout, get recent workouts
- finishWorkout flow — trigger template auto-update

</code_context>

<specifics>
## Specific Ideas

- "Repeat Last" is the primary fast-path — it should feel like one tap to get back to where you were
- Template = invisible bookkeeping. User never thinks about "templates" — they just name workouts and repeat them
- The WorkoutTemplate table already exists from Phase 1 data layer — just needs service methods

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-workouts-templates*
*Context gathered: 2026-04-09*
