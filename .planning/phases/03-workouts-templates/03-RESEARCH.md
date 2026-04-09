# Phase 3: Workouts & Templates - Research

**Researched:** 2026-04-08
**Domain:** Workout naming, repeat-last flow, living templates (Dexie.js + React)
**Confidence:** HIGH

## Summary

Phase 3 extends the existing workout service and home page with three capabilities: (1) editable workout names on the header, (2) a "Recent Workouts" list on the home screen with one-tap "Repeat" buttons, and (3) implicit living templates that auto-update when workouts finish. The data layer already has the `WorkoutTemplate` model and Dexie table defined from Phase 1 -- this phase wires them up with service methods and UI.

The core technical work is straightforward: add ~5 new service methods to `workoutService.ts`, make `WorkoutHeader` editable, build a `RecentWorkouts` component for the home page, and hook template creation/update into the `finishWorkout` flow. The main risk is getting the "Repeat" flow right -- it must create a new workout, pre-load exercises from the template, AND pre-fill last session's weight/reps for each exercise using the existing `getLastSetValues` method.

**Primary recommendation:** Keep templates as a thin bookkeeping layer derived from workout names. All new logic goes through `workoutService` -- no new services needed. The `finishWorkout` method gets a template upsert side-effect. The "Repeat" flow is a new `startWorkoutFromTemplate` method that chains existing `startWorkout` + `addExercise` calls.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** WorkoutHeader (existing component) gets an editable name field -- tap the name to edit inline
- **D-02:** Auto-generated default name: "Workout - Mon D" format (e.g., "Workout - Apr 9")
- **D-03:** Name is saved to the workout record whenever it changes (debounced)
- **D-04:** User can also set a custom name like "Full Body" or "Push Day" -- this becomes the template name
- **D-05:** Home screen shows recent workouts as a list (name, date, total volume)
- **D-06:** Each recent workout has a "Repeat" button
- **D-07:** Tapping "Repeat" creates a new workout with the same name, loads all exercises from that workout
- **D-08:** Pre-loads last session's weight/reps for each exercise as starting values (uses existing pre-fill logic from Phase 2)
- **D-09:** After repeating, user lands on active workout screen with all exercises as cards, ready to log
- **D-10:** Templates are implicit -- derived from the workout name, not a separate entity
- **D-11:** When a workout finishes, update the WorkoutTemplate record for that name with the final exercise list
- **D-12:** If no template exists for the name, create one on finish
- **D-13:** Template stores exercise names in order -- used by "Repeat" to know which exercises to load
- **D-14:** Modifying a workout (adding/removing/reordering exercises) is reflected in the template on finish -- living template
- **D-15:** "Start New Workout" button remains prominent at top
- **D-16:** Below the button: "Recent Workouts" list showing last 10 workouts
- **D-17:** Each recent workout card shows: name, date (relative: "Today", "Yesterday", "Mon"), total volume (lbs)
- **D-18:** Each card has a "Repeat" action button on the right side
- **D-19:** If an active workout exists, show "Resume Workout" card at top (already from Phase 2, keep it)
- **D-20:** Active workout recovery (from Phase 2) should now also restore the workout name
- **D-21:** WRK-06 is covered if the existing Phase 2 recovery works with named workouts -- verify, don't rebuild

### Claude's Discretion
- How to compute total volume for display (sum of weight * reps for all sets)
- Relative date formatting approach
- Recent workout card visual styling
- Whether to group repeated workouts by name or show all chronologically
- Exercise reorder UI within a workout (drag? or just add-order based?)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WRK-01 | User can create named workouts ("Full Body", "Push Day") | Editable WorkoutHeader with debounced name save + `updateWorkoutName` service method |
| WRK-02 | User can repeat last workout with one tap (loads previous exercises + numbers) | `startWorkoutFromTemplate` service method + RecentWorkouts component with Repeat button |
| WRK-03 | Templates auto-update when workout is modified (living templates) | Template upsert in `finishWorkout` flow using workout name as key |
| WRK-04 | User can add exercises mid-workout with freeform entry and autocomplete | Already implemented in Phase 2 (ExerciseInput component) -- verify it works with template-started workouts |
| WRK-05 | User can start a new empty workout and name it | Existing "Start Workout" button + new editable name field in header |
| WRK-06 | Active workout recovers on app reload (no data loss mid-workout) | Already implemented in Phase 2 -- verify name field persists on recovery |

</phase_requirements>

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Dexie.js | 4.x | IndexedDB CRUD, template table, queries | Already in use; `workoutTemplates` table exists |
| dexie-react-hooks | 4.x | `useLiveQuery` for reactive recent workouts list | Already in use; established pattern |
| React | 19.x | Component UI | Already in use |
| React Router | 7.x | Navigation after repeat | Already in use |
| Tailwind CSS | 4.x | Styling recent workout cards, editable header | Already in use |

### Supporting (no new dependencies needed)

No new packages required. All Phase 3 functionality builds on the existing stack.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline editable name (contentEditable/input) | Modal dialog for name | Modal adds friction -- inline is faster per D-01 |
| Template as implicit (name-derived) | Explicit template management UI | Adds complexity user doesn't need -- D-10 locks this |
| Chronological recent list | Grouped by template name | Chronological is simpler, shows actual workout history |

## Architecture Patterns

### New Service Methods

The following methods extend `workoutService` in `src/services/workoutService.ts`:

```typescript
// Update workout name (D-03)
async updateWorkoutName(workoutId: number, name: string): Promise<void>

// Get recent completed workouts with volume (D-05, D-16)
async getRecentWorkouts(limit?: number): Promise<RecentWorkout[]>

// Compute total volume for a workout (Claude's discretion)
async getWorkoutVolume(workoutId: number): Promise<number>

// Create workout from template -- the "Repeat" flow (D-07, D-08, D-09)
async startWorkoutFromTemplate(templateName: string): Promise<number>

// Upsert template on workout finish (D-11, D-12, D-14)
async upsertTemplate(workoutId: number): Promise<void>
```

### Component Structure

```
src/
  components/
    workout/
      WorkoutHeader.tsx      # MODIFY: add editable name field
    home/
      RecentWorkouts.tsx     # NEW: recent workout list with Repeat buttons
      RecentWorkoutCard.tsx  # NEW: individual card (name, date, volume, Repeat)
  pages/
    HomePage.tsx             # MODIFY: add RecentWorkouts below start button
  services/
    workoutService.ts        # MODIFY: add template + recent workout methods
  utils/
    formatters.ts            # NEW (optional): relative date, volume formatting
```

### Pattern 1: Editable Header with Debounced Save

**What:** WorkoutHeader shows workout name as an input field. On change, debounce 500ms then call `workoutService.updateWorkoutName()`.
**When to use:** D-01, D-03, D-04.

```typescript
// WorkoutHeader.tsx - editable name pattern
import { useState, useCallback, useRef, useEffect } from 'react';

interface WorkoutHeaderProps {
  workout: Workout;
  onFinish: () => void;
}

export default function WorkoutHeader({ workout, onFinish }: WorkoutHeaderProps) {
  const [name, setName] = useState(workout.name);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if workout.name changes externally (e.g., recovery)
  useEffect(() => { setName(workout.name); }, [workout.name]);

  const handleNameChange = useCallback((newName: string) => {
    setName(newName);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      workoutService.updateWorkoutName(workout.id!, newName);
    }, 500);
  }, [workout.id]);

  return (
    <div className="flex items-center justify-between py-2">
      <input
        type="text"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        className="text-xl font-bold text-text-primary bg-transparent
                   border-b border-transparent focus:border-accent
                   outline-none truncate mr-4 min-w-0 flex-1"
      />
      <button type="button" className="..." onClick={onFinish}>
        Finish
      </button>
    </div>
  );
}
```

### Pattern 2: Template Upsert on Finish

**What:** When `finishWorkout` is called, extract exercise names in order from the workout, then upsert a `WorkoutTemplate` record keyed by workout name.
**When to use:** D-11, D-12, D-14.

```typescript
// In workoutService.ts
async finishWorkout(workoutId: number): Promise<void> {
  await db.workouts.update(workoutId, { completedAt: new Date() });
  // Template auto-update (D-11, D-12, D-14)
  await this.upsertTemplate(workoutId);
},

async upsertTemplate(workoutId: number): Promise<void> {
  const workout = await db.workouts.get(workoutId);
  if (!workout) return;

  const exercises = await db.workoutExercises
    .where('workoutId').equals(workoutId)
    .sortBy('order');
  const exerciseNames = exercises.map(e => e.exerciseName);

  // Upsert: find by name, update or create
  const existing = await db.workoutTemplates
    .where('name').equals(workout.name).first();

  if (existing) {
    await db.workoutTemplates.update(existing.id!, {
      exercises: exerciseNames,
      lastUsed: new Date(),
    });
  } else {
    await db.workoutTemplates.add({
      name: workout.name,
      lastUsed: new Date(),
      exercises: exerciseNames,
    });
  }
},
```

### Pattern 3: Repeat Workout Flow

**What:** Create a new workout with the template name, add all template exercises, navigate to the workout page.
**When to use:** D-07, D-08, D-09.

```typescript
// In workoutService.ts
async startWorkoutFromTemplate(templateName: string): Promise<number> {
  // Create workout with the template name
  const workoutId = await db.workouts.add({
    name: templateName,
    startedAt: new Date(),
  } as Workout);

  // Load exercise names from the template
  const template = await db.workoutTemplates
    .where('name').equals(templateName).first();

  if (template) {
    for (const exerciseName of template.exercises) {
      await this.addExercise(workoutId, exerciseName);
    }
  }

  return workoutId;
},
```

Note: Pre-filling weight/reps (D-08) is already handled by `getLastSetValues` in the ExerciseCard/SetEntry components from Phase 2. When exercises are loaded from template, the existing pre-fill logic kicks in automatically.

### Pattern 4: Recent Workouts with Volume (useLiveQuery)

**What:** Home page queries completed workouts, computes volume, displays as cards.
**When to use:** D-05, D-16, D-17.

```typescript
// RecentWorkouts.tsx
const recentWorkouts = useLiveQuery(async () => {
  const workouts = await db.workouts
    .where('completedAt')
    .above(0)  // Only completed workouts
    .reverse()
    .limit(10)
    .toArray();

  // Compute volume for each
  return Promise.all(workouts.map(async (w) => {
    const volume = await workoutService.getWorkoutVolume(w.id!);
    return { ...w, totalVolume: volume };
  }));
});
```

### Anti-Patterns to Avoid

- **Don't query volume in a loop per-render:** Compute volume once with `useLiveQuery` and cache the result in the query itself (as shown above).
- **Don't use `contentEditable` for the name field:** Use a regular `<input>` -- contentEditable has quirks with React state management and cursor positioning on mobile Safari.
- **Don't create a separate "template management" UI:** Templates are invisible bookkeeping (D-10). Users interact with workouts, not templates.
- **Don't re-implement recovery for named workouts:** Phase 2 recovery already works because the name is stored on the `Workout` record in IndexedDB. Just verify it round-trips (D-20, D-21).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounce | Custom timer logic | Simple useRef + setTimeout pattern (shown above) | No need for lodash.debounce -- the pattern is 5 lines |
| Relative dates | Complex date library | Simple formatter function (see Code Examples) | Only 3 cases needed: Today, Yesterday, weekday name |
| Volume calculation | Inline math in components | Service method `getWorkoutVolume` | Keep business logic in service layer, reusable |
| Reactive queries | Manual state refresh | `useLiveQuery` from dexie-react-hooks | Already established pattern -- Dexie handles reactivity |

**Key insight:** This phase adds no new libraries. Every capability is built by extending the existing `workoutService` and using established Dexie + React patterns.

## Common Pitfalls

### Pitfall 1: Dexie completedAt Index Behavior
**What goes wrong:** Querying `db.workouts.where('completedAt').above(0)` won't work because `completedAt` stores `Date` objects and unset values are `undefined` (not indexed by Dexie).
**Why it happens:** Dexie cannot index `undefined`/`null` values -- this was already discovered in Phase 2 (comment in `getActiveWorkout`).
**How to avoid:** Use `.filter()` for the completedAt check: `db.workouts.filter(w => !!w.completedAt).reverse().sortBy('startedAt')`. Then take last 10 from the sorted result. Alternatively, use `.toArray()` on all workouts and filter in JS.
**Warning signs:** Empty recent workouts list despite having completed workouts in the database.

### Pitfall 2: Template Name Collision with Default Names
**What goes wrong:** Templates get created for auto-generated names like "Workout - Apr 9", creating useless one-off templates.
**Why it happens:** Every workout gets a default name (D-02), and every finish triggers a template upsert (D-11).
**How to avoid:** Two options: (a) Only create templates for non-default names (check if name matches the auto-generated pattern), or (b) let it happen -- templates with default names just get overwritten each time and the "Repeat" button works for any workout regardless. Option (b) is simpler and matches the user decisions (D-07 says Repeat works on any recent workout, not just named ones).
**Warning signs:** Template table growing with many "Workout - Apr 9" entries.

### Pitfall 3: Race Condition on Rapid Name Edits
**What goes wrong:** Multiple debounced saves fire out of order, storing a stale name.
**Why it happens:** If the user types fast, the 500ms debounce fires multiple times with different intermediate values.
**How to avoid:** The standard debounce-with-clear pattern handles this -- each keystroke clears the previous timer. Only the final value after 500ms of inactivity gets saved. The pattern shown above is correct.
**Warning signs:** Name reverting to an earlier value after editing.

### Pitfall 4: Template Exercises Stale After Exercise Rename
**What goes wrong:** Template stores exercise names as strings. If an exercise is logged with a slightly different name in a future workout, the template still has the old name.
**Why it happens:** `normalizeExerciseName` handles casing but not typo variants (e.g., "Bench Press" vs "Flat Bench Press").
**How to avoid:** This is acceptable for V1 -- exercise name normalization from Phase 2 handles the common case. Templates update on every finish (D-14), so they self-correct over time.

### Pitfall 5: Volume Query Performance
**What goes wrong:** Computing volume for 10 workouts on the home page causes slow initial render.
**Why it happens:** Each workout volume requires joining workoutExercises and workoutSets tables.
**How to avoid:** Use a single `useLiveQuery` that batches all volume computations. The query runs once and Dexie caches the result. For 10 workouts with ~10 exercises each, this is ~100 DB reads -- fast enough for IndexedDB.
**Warning signs:** Home page taking >500ms to render the recent workouts list.

## Code Examples

### Relative Date Formatter

```typescript
// src/utils/formatters.ts
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Apr 2"
}

export function formatVolume(totalLbs: number): string {
  if (totalLbs >= 1000) {
    return `${(totalLbs / 1000).toFixed(1)}k lbs`;
  }
  return `${totalLbs.toLocaleString()} lbs`;
}
```

### Volume Computation

```typescript
// In workoutService.ts
async getWorkoutVolume(workoutId: number): Promise<number> {
  const exercises = await db.workoutExercises
    .where('workoutId').equals(workoutId).toArray();

  if (exercises.length === 0) return 0;

  const exerciseIds = exercises.map(e => e.id!);
  const sets = await db.workoutSets
    .where('workoutExerciseId').anyOf(exerciseIds).toArray();

  return sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
}
```

### Recent Workouts Query

```typescript
// In workoutService.ts
interface RecentWorkout {
  id: number;
  name: string;
  startedAt: Date;
  completedAt: Date;
  totalVolume: number;
}

async getRecentWorkouts(limit: number = 10): Promise<RecentWorkout[]> {
  // Get completed workouts sorted by startedAt descending
  const allWorkouts = await db.workouts.toArray();
  const completed = allWorkouts
    .filter(w => !!w.completedAt)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, limit);

  return Promise.all(completed.map(async (w) => ({
    id: w.id!,
    name: w.name,
    startedAt: w.startedAt,
    completedAt: w.completedAt!,
    totalVolume: await this.getWorkoutVolume(w.id!),
  })));
}
```

### Debounce Hook (reusable)

```typescript
// Simple inline debounce -- no hook library needed
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const debouncedSave = useCallback((value: string) => {
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    workoutService.updateWorkoutName(workoutId, value);
  }, 500);
}, [workoutId]);

// Cleanup on unmount
useEffect(() => {
  return () => { if (timerRef.current) clearTimeout(timerRef.current); };
}, []);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate template CRUD UI | Implicit templates from workout names | This phase design decision (D-10) | No template management screens needed |
| Store template ID on workout | Derive template from workout name | This phase design decision | Simpler data model, no foreign key management |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vite.config.ts` (inline test config) |
| Quick run command | `npx vitest run src/services/workoutService.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WRK-01 | updateWorkoutName saves name to DB | unit | `npx vitest run src/services/workoutService.test.ts -t "updateWorkoutName"` | No -- Wave 0 |
| WRK-02 | startWorkoutFromTemplate creates workout with exercises | unit | `npx vitest run src/services/workoutService.test.ts -t "startWorkoutFromTemplate"` | No -- Wave 0 |
| WRK-03 | finishWorkout upserts template with exercise list | unit | `npx vitest run src/services/workoutService.test.ts -t "upsertTemplate"` | No -- Wave 0 |
| WRK-04 | Adding exercises mid-workout works with template-started workouts | unit | `npx vitest run src/services/workoutService.test.ts -t "addExercise"` | Yes (existing) |
| WRK-05 | startWorkout creates workout with default name, name is editable | unit | `npx vitest run src/services/workoutService.test.ts -t "startWorkout"` | Yes (existing) |
| WRK-06 | Active workout with name recovers on reload | manual | Verify getActiveWorkout returns workout with name field intact | Existing test covers getActiveWorkout |

### Sampling Rate
- **Per task commit:** `npx vitest run src/services/workoutService.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] New test cases in `src/services/workoutService.test.ts` for: updateWorkoutName, getRecentWorkouts, getWorkoutVolume, startWorkoutFromTemplate, upsertTemplate (via finishWorkout)
- [ ] Template upsert integration test: start workout -> add exercises -> finish -> verify template created -> repeat -> verify exercises loaded

## Open Questions

1. **Template creation for auto-named workouts**
   - What we know: Every workout gets "Workout - Apr 9" default name. D-11 says upsert template on finish for ANY name.
   - What's unclear: Should auto-named workouts create templates? They'd get overwritten by the next "Workout - Apr 9".
   - Recommendation: Let it happen. Templates with date-based names are harmless and "Repeat" works universally. Simpler code, consistent behavior.

2. **Exercise reorder within a workout**
   - What we know: D-14 says reordering is reflected in template. Claude's discretion on reorder UI.
   - What's unclear: Whether drag-to-reorder is needed now or if add-order is sufficient.
   - Recommendation: Use add-order only for V1. Exercises appear in the order added. Drag-reorder adds touch gesture complexity (would need a library like dnd-kit). Users can control order by adding exercises in the desired sequence when repeating.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/services/workoutService.ts`, `src/db/models.ts`, `src/db/database.ts` -- direct inspection
- Phase 2 implementation: established patterns for Dexie queries, useLiveQuery, service layer
- Phase 3 CONTEXT.md: locked user decisions D-01 through D-21

### Secondary (MEDIUM confidence)
- Dexie.js indexing behavior: confirmed by Phase 2 comment in `getActiveWorkout` about `.filter()` for null/undefined fields

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything already installed and proven
- Architecture: HIGH -- extends existing patterns with well-defined service methods
- Pitfalls: HIGH -- Dexie indexing quirk already discovered in Phase 2; other pitfalls are straightforward

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- no external dependencies changing)
