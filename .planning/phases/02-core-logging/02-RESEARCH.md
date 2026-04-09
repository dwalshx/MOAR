# Phase 2: Core Logging - Research

**Researched:** 2026-04-08
**Domain:** Active workout logging UI, IndexedDB persistence, mobile touch interactions
**Confidence:** HIGH

## Summary

Phase 2 builds the most critical screen in MOAR: the active workout view where users log sets. The core challenge is making set logging feel instant (1-3 taps) while persisting every action to IndexedDB immediately. The existing Dexie.js data layer, models, and dark-themed layout from Phase 1 provide a solid foundation.

The key technical areas are: (1) a useReducer-based workout state machine that syncs with Dexie on every action, (2) an accordion card layout for exercises, (3) stepper buttons with long-press support for weight/reps, (4) exercise autocomplete from history, and (5) workout recovery on reload. All of these use standard React patterns and the already-installed `dexie-react-hooks` package.

**Primary recommendation:** Build a WorkoutService layer that wraps all Dexie operations, use `useLiveQuery` for reactive data binding, and keep the useReducer as a UI-optimistic layer that dispatches DB writes as side effects. This gives instant UI updates with guaranteed persistence.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Compact exercise cards in a vertically scrollable list on the active workout screen
- **D-02:** Tap a card to expand it -- expanded view shows logged sets + set entry form
- **D-03:** Only one card expanded at a time (accordion) -- tapping another collapses the current one
- **D-04:** Collapsed card shows: exercise name, set count, last set weight x reps
- **D-05:** Cards should feel like a dashboard -- user can see all exercises at a glance and jump to any
- **D-06:** Set entry form is inline within the expanded exercise card (no modal, no separate screen)
- **D-07:** Weight and reps pre-filled from last logged set (or last session's values if first set)
- **D-08:** Weight stepper: +/- 5 lb per tap, long-press for +/- 1 lb (from Phase 1 D-08)
- **D-09:** Rep stepper: +/- 1 per tap (from Phase 1 D-09)
- **D-10:** "Log Set" button prominently placed -- one tap to record
- **D-11:** Card stays expanded after logging -- user can immediately log next set
- **D-12:** Logged sets appear as a compact list within the card (set #, weight, reps)
- **D-13:** Home screen shows "Start Workout" button
- **D-14:** Tapping "Start Workout" creates an empty workout with auto-generated name (e.g., "Workout - Apr 9")
- **D-15:** User arrives at empty active workout screen with exercise input at top
- **D-16:** Templates and "Repeat Last" deferred to Phase 3
- **D-17:** Text input at top of active workout screen for adding exercises
- **D-18:** Autocomplete dropdown shows matching exercises from history on keystroke
- **D-19:** Tap autocomplete suggestion or press Enter to add exercise as new card
- **D-20:** Exercise names normalized on save (trimmed, title-cased)
- **D-21:** Tap a logged set row to make it editable (weight/reps become steppers)
- **D-22:** Swipe left on a set row to reveal delete button
- **D-23:** Delete requires one confirmation tap (not a modal -- inline "Undo" or "Confirm")
- **D-24:** Every set persisted to IndexedDB immediately on "Log Set" tap (not buffered)
- **D-25:** On app reload, check for incomplete workout (completedAt is null) and auto-resume
- **D-26:** "Finish Workout" button sets completedAt timestamp and returns to Home
- **D-27:** Bottom nav shows "Workout" tab (with orange accent) when a workout is active

### Claude's Discretion
- Exact card expand/collapse animation approach (keep it fast, <200ms)
- Exercise input component styling details
- Autocomplete dropdown positioning and styling
- Set row layout within expanded card
- How to handle very long exercise names (truncate vs wrap)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOG-01 | User can log a set with weight and reps in 1-3 taps | Stepper buttons (D-08/D-09) + pre-filled values (D-07) + Log Set button (D-10) = 1 tap to log if defaults are correct, 2-3 taps with adjustments |
| LOG-02 | Weight and reps pre-filled from last session's values as default | Query last session's sets for the same exerciseName via Dexie, fall back to last logged set in current workout |
| LOG-03 | Stepper buttons (+/-) for adjusting weight and reps without keyboard | Custom Stepper component with touch handlers; weight +/-5 per tap, long-press +/-1; reps +/-1 per tap |
| LOG-04 | Every set silently timestamped for future rest/order analysis | WorkoutSet model already has `timestamp: Date` field; set `new Date()` on logSet() |
| LOG-05 | User can edit or delete a logged set | Tap-to-edit (D-21) makes set row editable; swipe-left-to-delete (D-22) with inline confirm (D-23) |
| LOG-06 | Card-based active workout screen for jumping between exercises freely | Accordion card layout (D-01 through D-05) with vertically scrollable list |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- GSD workflow enforcement: Do not make direct repo edits outside a GSD workflow unless user explicitly asks to bypass it
- Import from `react-router` (not `react-router-dom`) per React Router 7 conventions
- Use `h-dvh` instead of `h-screen` to avoid iOS Safari 100vh bug
- Dark theme with CSS @theme tokens (not JS config) -- tokens defined in `src/index.css`
- Auto-increment numeric IDs (not UUIDs) for V1 simplicity
- Tailwind CSS 4 via `@tailwindcss/vite` plugin

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI components | Already in project |
| Dexie.js | 4.4.2 | IndexedDB persistence | Already in project, promise-based API |
| dexie-react-hooks | 4.4.0 | useLiveQuery reactive binding | Already in project, auto-observes DB changes |
| React Router | 7.14.0 | Navigation (useNavigate, useParams) | Already in project |
| Tailwind CSS | 4.2.2 | Styling | Already in project |

### Supporting (No New Dependencies Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React useReducer | built-in | Active workout state machine | Complex state transitions (add set, edit set, expand card) |
| React useRef/useCallback | built-in | Touch event handlers, timers | Long-press detection, swipe gesture tracking |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom long-press | use-long-press npm | Adds dependency for something achievable in ~20 lines |
| Custom swipe-to-delete | react-swipeable | Adds dependency; custom touch tracking is straightforward for single-axis swipe |
| useLiveQuery | manual Dexie queries in useEffect | useLiveQuery auto-observes changes, less boilerplate |

**Installation:** No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  services/
    workoutService.ts       # All Dexie CRUD operations for workout logging
  hooks/
    useActiveWorkout.ts     # useReducer + useLiveQuery composition hook
    useLongPress.ts         # Reusable long-press detection hook
    useSwipeToDelete.ts     # Swipe gesture detection hook
  components/
    workout/
      ActiveWorkout.tsx     # Main workout screen container
      ExerciseCard.tsx      # Accordion card (collapsed + expanded states)
      SetEntryForm.tsx      # Weight/reps steppers + Log Set button
      SetRow.tsx            # Logged set display (tap-to-edit, swipe-to-delete)
      Stepper.tsx           # Reusable +/- stepper with long-press
      ExerciseInput.tsx     # Text input with autocomplete dropdown
      WorkoutHeader.tsx     # Workout name + Finish button
  pages/
    HomePage.tsx            # Start Workout button (replace placeholder)
    WorkoutPage.tsx         # Active workout screen (replace placeholder)
```

### Pattern 1: Service Layer for Dexie Operations
**What:** All IndexedDB reads/writes go through a `workoutService` object, never called directly from components.
**When to use:** Every database interaction in this phase.
**Example:**
```typescript
// src/services/workoutService.ts
import { db } from '../db/database';
import type { Workout, WorkoutExercise, WorkoutSet } from '../db/models';

export const workoutService = {
  async startWorkout(): Promise<number> {
    const name = `Workout - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    return db.workouts.add({ name, startedAt: new Date() });
  },

  async addExercise(workoutId: number, exerciseName: string): Promise<number> {
    const normalized = exerciseName.trim().split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const count = await db.workoutExercises.where('workoutId').equals(workoutId).count();
    return db.workoutExercises.add({
      workoutId,
      exerciseName: normalized,
      order: count + 1
    });
  },

  async logSet(workoutExerciseId: number, weight: number, reps: number): Promise<number> {
    const count = await db.workoutSets.where('workoutExerciseId').equals(workoutExerciseId).count();
    return db.workoutSets.add({
      workoutExerciseId,
      setNumber: count + 1,
      weight,
      reps,
      timestamp: new Date()  // LOG-04: silent timestamping
    });
  },

  async getActiveWorkout(): Promise<Workout | undefined> {
    // D-25: Find incomplete workout for recovery
    return db.workouts.where('completedAt').equals(undefined as any)
      .or('completedAt').equals(null as any).first();
    // Note: Dexie handles undefined/null querying via compound approach below
  },

  async finishWorkout(workoutId: number): Promise<void> {
    await db.workouts.update(workoutId, { completedAt: new Date() });
  },

  async getLastSetValues(exerciseName: string): Promise<{ weight: number; reps: number } | null> {
    // LOG-02: Find most recent set for this exercise across all workouts
    const exercises = await db.workoutExercises
      .where('exerciseName').equals(exerciseName).toArray();
    if (exercises.length === 0) return null;
    const exerciseIds = exercises.map(e => e.id!);
    const lastSet = await db.workoutSets
      .where('workoutExerciseId').anyOf(exerciseIds)
      .reverse().sortBy('timestamp');
    return lastSet.length > 0 ? { weight: lastSet[0].weight, reps: lastSet[0].reps } : null;
  },

  async getExerciseNames(): Promise<string[]> {
    // D-18: Autocomplete from history
    const exercises = await db.workoutExercises.orderBy('exerciseName').uniqueKeys();
    return exercises as string[];
  }
};
```

### Pattern 2: useLiveQuery for Reactive Data
**What:** Use `useLiveQuery` from dexie-react-hooks to observe DB changes reactively.
**When to use:** Anywhere the UI needs to reflect current DB state (sets list, exercise list, active workout detection).
**Example:**
```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

// In ActiveWorkout component:
const exercises = useLiveQuery(
  () => db.workoutExercises.where('workoutId').equals(workoutId).sortBy('order'),
  [workoutId]
);

// In ExerciseCard component:
const sets = useLiveQuery(
  () => db.workoutSets.where('workoutExerciseId').equals(exerciseId).sortBy('setNumber'),
  [exerciseId]
);

// On HomePage -- detect active workout:
const activeWorkout = useLiveQuery(
  () => db.workouts.filter(w => !w.completedAt).first()
);
```

### Pattern 3: Accordion State with Single Expanded Card
**What:** Track `expandedExerciseId` in component state. Only one card open at a time.
**When to use:** ExerciseCard list rendering.
**Example:**
```typescript
const [expandedId, setExpandedId] = useState<number | null>(null);

const handleToggle = (exerciseId: number) => {
  setExpandedId(prev => prev === exerciseId ? null : exerciseId);
};

// Render:
{exercises?.map(ex => (
  <ExerciseCard
    key={ex.id}
    exercise={ex}
    isExpanded={expandedId === ex.id}
    onToggle={() => handleToggle(ex.id!)}
  />
))}
```

### Pattern 4: Long-Press Stepper Hook
**What:** Custom hook for detecting tap vs long-press on stepper buttons.
**When to use:** Weight stepper (+/-5 per tap, +/-1 on long-press), per D-08.
**Example:**
```typescript
// src/hooks/useLongPress.ts
import { useRef, useCallback } from 'react';

export function useLongPress(
  onTap: () => void,
  onLongPress: () => void,
  threshold = 400
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
      // Auto-repeat on long hold
      intervalRef.current = setInterval(onLongPress, 150);
    }, threshold);
  }, [onLongPress, threshold]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isLongPress.current) onTap();
  }, [onTap]);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onMouseDown: start,
    onMouseUp: stop,
  };
}
```

### Pattern 5: Swipe-to-Delete with Touch Events
**What:** Track touchstart/touchmove X coordinates to detect left swipe, revealing delete button.
**When to use:** Set row delete gesture per D-22.
**Example:**
```typescript
// src/hooks/useSwipeToDelete.ts
import { useRef, useState, useCallback } from 'react';

export function useSwipeToDelete(threshold = 80) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [showDelete, setShowDelete] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = startX.current - e.touches[0].clientX;
    if (diff > 0) setOffset(Math.min(diff, threshold));
  }, [threshold]);

  const onTouchEnd = useCallback(() => {
    if (offset >= threshold * 0.6) {
      setShowDelete(true);
      setOffset(threshold);
    } else {
      setShowDelete(false);
      setOffset(0);
    }
  }, [offset, threshold]);

  const reset = useCallback(() => {
    setOffset(0);
    setShowDelete(false);
  }, []);

  return { offset, showDelete, onTouchStart, onTouchMove, onTouchEnd, reset };
}
```

### Anti-Patterns to Avoid
- **Storing workout state only in useReducer:** Every set MUST be persisted to IndexedDB immediately (D-24). Use useLiveQuery as the source of truth, not reducer state.
- **Keyboard input for weight/reps:** Steppers only (D-08/D-09). On-screen keyboards on mobile are slow and block half the screen.
- **Modal dialogs for set entry:** Set entry is inline in the expanded card (D-06). Never navigate away from the workout view.
- **Buffering writes:** Do not batch DB writes. Each "Log Set" tap triggers an immediate `db.workoutSets.add()`.
- **Using `h-screen` instead of `h-dvh`:** iOS Safari 100vh bug. Always use `h-dvh`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reactive DB queries | Manual useEffect + state for DB reads | `useLiveQuery` from dexie-react-hooks | Auto-observes changes, handles loading state, no stale data |
| Exercise name normalization | Complex NLP matching | Simple trim + title-case | Single user, autocomplete handles 90% of consistency (Pitfall #4) |
| Complex state management | Redux/Zustand store | React useReducer or just useState + useLiveQuery | Workout state is screen-local, Dexie IS the state store |
| Workout recovery | Custom localStorage checkpointing | Dexie query for `completedAt === undefined` | Data is already in IndexedDB from immediate persistence |

**Key insight:** Because every set is persisted immediately (D-24), the IndexedDB IS the state manager. `useLiveQuery` makes components reactive to DB changes without manual refresh. This eliminates the need for a separate state management layer.

## Common Pitfalls

### Pitfall 1: Querying for null/undefined in Dexie
**What goes wrong:** Dexie cannot index `undefined` or `null` values. Querying `where('completedAt').equals(undefined)` will not find records where `completedAt` was never set.
**Why it happens:** IndexedDB does not index missing/undefined keys. Dexie follows this behavior.
**How to avoid:** Use `.filter()` instead of `.where()` for null/undefined checks:
```typescript
// WRONG: db.workouts.where('completedAt').equals(undefined)
// RIGHT:
db.workouts.filter(w => !w.completedAt).first()
```
**Warning signs:** Active workout recovery (D-25) silently fails to find the incomplete workout.

### Pitfall 2: useLiveQuery Returns Undefined During Loading
**What goes wrong:** Component renders with `undefined` data before the query resolves, causing crashes if not handled.
**Why it happens:** useLiveQuery is async; first render always has undefined result.
**How to avoid:** Always check for undefined and show loading state:
```typescript
const sets = useLiveQuery(() => db.workoutSets.where(...).toArray(), [dep]);
if (sets === undefined) return <LoadingSkeleton />;
```
**Warning signs:** "Cannot read properties of undefined" errors on component mount.

### Pitfall 3: Scroll Position Jumps on Accordion Toggle
**What goes wrong:** When expanding a card that is partially below the fold, the page jumps or the card content is hidden below the viewport.
**Why it happens:** The DOM height changes when a card expands, but the scroll position does not adjust.
**How to avoid:** After expanding a card, use `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on the expanded card. Keep expansion animation fast (<200ms) per Claude's discretion.
**Warning signs:** User has to manually scroll after tapping a card to see the set entry form.

### Pitfall 4: Touch Event Conflicts on Mobile
**What goes wrong:** Long-press on stepper triggers the browser's context menu or text selection. Swipe-to-delete conflicts with page scrolling.
**Why it happens:** Default browser touch behaviors interfere with custom gesture handling.
**How to avoid:** Call `e.preventDefault()` in touch handlers where needed. Use `touch-action: manipulation` CSS to disable double-tap zoom. For swipe, only activate when horizontal movement exceeds vertical.
**Warning signs:** Context menu appears when long-pressing stepper buttons; page scrolls when trying to swipe a set row.

### Pitfall 5: Exercise Name Autocomplete Flicker
**What goes wrong:** Dropdown opens/closes rapidly as user types, creating visual noise.
**Why it happens:** Each keystroke triggers a new DB query and re-render.
**How to avoid:** Debounce the search query by 150-200ms. Use `useLiveQuery` with a debounced search term. Keep the dropdown open while input is focused.
**Warning signs:** Dropdown flashes on each keystroke, especially noticeable on slower devices.

### Pitfall 6: Losing Expanded Card State on DB Write
**What goes wrong:** When `useLiveQuery` re-fires after a set is logged, the exercise list re-renders and the expanded card collapses.
**Why it happens:** If `expandedId` is stored relative to array index instead of exercise ID, a re-render resets it.
**How to avoid:** Track `expandedId` by exercise database ID (number), not array index. Since useLiveQuery returns the same objects for unchanged rows, keying by ID is stable.
**Warning signs:** Card collapses every time user logs a set.

## Code Examples

### Active Workout Recovery on Load (D-25)
```typescript
// In WorkoutPage.tsx or a parent component
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router';
import { db } from '../db/database';

function useActiveWorkoutRedirect() {
  const navigate = useNavigate();
  const activeWorkout = useLiveQuery(
    () => db.workouts.filter(w => !w.completedAt).first()
  );

  useEffect(() => {
    if (activeWorkout?.id) {
      navigate(`/workout/${activeWorkout.id}`, { replace: true });
    }
  }, [activeWorkout, navigate]);

  return activeWorkout;
}
```

### Pre-filling Weight/Reps from Last Session (LOG-02, D-07)
```typescript
async function getDefaultValues(
  exerciseName: string,
  currentWorkoutExerciseId: number
): Promise<{ weight: number; reps: number }> {
  // First: check last set in current workout for this exercise
  const currentSets = await db.workoutSets
    .where('workoutExerciseId').equals(currentWorkoutExerciseId)
    .reverse().sortBy('setNumber');

  if (currentSets.length > 0) {
    return { weight: currentSets[0].weight, reps: currentSets[0].reps };
  }

  // Fallback: last session's values for this exercise name
  const pastExercises = await db.workoutExercises
    .where('exerciseName').equals(exerciseName)
    .toArray();

  // Exclude current workout's exercise
  const pastIds = pastExercises
    .filter(e => e.id !== currentWorkoutExerciseId)
    .map(e => e.id!);

  if (pastIds.length === 0) return { weight: 45, reps: 10 }; // sensible defaults

  const lastSet = await db.workoutSets
    .where('workoutExerciseId').anyOf(pastIds)
    .reverse().sortBy('timestamp');

  return lastSet.length > 0
    ? { weight: lastSet[0].weight, reps: lastSet[0].reps }
    : { weight: 45, reps: 10 };
}
```

### Title-Case Normalization (D-20)
```typescript
function normalizeExerciseName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
```

### Conditional Workout Tab in BottomNav (D-27)
```typescript
// In BottomNav.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

export default function BottomNav() {
  const activeWorkout = useLiveQuery(
    () => db.workouts.filter(w => !w.completedAt).first()
  );

  return (
    <nav className="flex justify-around items-center border-t border-border bg-bg-secondary pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/" end className={linkClass}>
        {/* Home icon */}
        Home
      </NavLink>
      {activeWorkout && (
        <NavLink to={`/workout/${activeWorkout.id}`} className={linkClass}>
          {/* Dumbbell icon with orange accent */}
          Workout
        </NavLink>
      )}
      <NavLink to="/history" className={linkClass}>
        {/* History icon */}
        History
      </NavLink>
    </nav>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useEffect + manual DB fetch | useLiveQuery from dexie-react-hooks | Dexie 3.1+ (2021) | Reactive, auto-observing queries; no stale data |
| react-router-dom imports | react-router imports | React Router 7 (2024) | Single package, import from 'react-router' only |
| h-screen for full height | h-dvh | Tailwind + modern browsers | Fixes iOS Safari 100vh bug |
| Tailwind JS config | CSS @theme tokens | Tailwind CSS 4 (2025) | Theme defined in index.css, no tailwind.config.js |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | None -- needs vite.config.ts test section or vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOG-01 | Log a set with weight and reps | integration | `npx vitest run src/services/workoutService.test.ts -t "logSet"` | No -- Wave 0 |
| LOG-02 | Pre-fill from last session | unit | `npx vitest run src/services/workoutService.test.ts -t "getDefaultValues"` | No -- Wave 0 |
| LOG-03 | Stepper buttons adjust values | unit | `npx vitest run src/hooks/useLongPress.test.ts` | No -- Wave 0 |
| LOG-04 | Every set timestamped | unit | `npx vitest run src/services/workoutService.test.ts -t "timestamp"` | No -- Wave 0 |
| LOG-05 | Edit or delete a logged set | integration | `npx vitest run src/services/workoutService.test.ts -t "edit\|delete"` | No -- Wave 0 |
| LOG-06 | Card-based workout screen | manual-only | Manual: visual inspection of accordion behavior | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` or add `test` section to `vite.config.ts` -- configure with fake-indexeddb
- [ ] `src/services/workoutService.test.ts` -- covers LOG-01, LOG-02, LOG-04, LOG-05
- [ ] `src/hooks/useLongPress.test.ts` -- covers LOG-03
- [ ] `src/test-setup.ts` -- import fake-indexeddb/auto for Dexie testing

**Note:** `fake-indexeddb` is already installed as a devDependency. Test setup needs:
```typescript
// src/test-setup.ts
import 'fake-indexeddb/auto';
```

## Sources

### Primary (HIGH confidence)
- Project source code: `src/db/models.ts`, `src/db/database.ts`, `src/components/layout/*`, `src/pages/*`
- `package.json` -- confirmed installed versions: dexie 4.4.2, dexie-react-hooks 4.4.0, react 19.2.4, react-router 7.14.0, vitest 4.1.3
- `.planning/research/ARCHITECTURE.md` -- data model, service layer, component architecture
- `.planning/research/PITFALLS.md` -- data entry friction, active workout state loss, exercise name inconsistency

### Secondary (MEDIUM confidence)
- [Dexie useLiveQuery documentation](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) -- reactive query patterns, dependency arrays
- [useLongPress hook patterns](https://usehooks.com/uselongpress) -- long-press detection approach
- [Dexie.js prevent extra renders discussion](https://github.com/dexie/Dexie.js/discussions/1661) -- performance considerations

### Tertiary (LOW confidence)
- [React Swipeable](https://codingcops.com/react-swipeable/) -- swipe gesture patterns (used for reference, not as dependency)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already installed and proven in Phase 1
- Architecture: HIGH -- follows established patterns from ARCHITECTURE.md research, uses existing Dexie schema
- Pitfalls: HIGH -- well-documented in PITFALLS.md research, verified against Dexie documentation
- Touch interactions: MEDIUM -- long-press and swipe patterns are standard but need testing on actual iOS Safari

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable stack, no moving targets)
