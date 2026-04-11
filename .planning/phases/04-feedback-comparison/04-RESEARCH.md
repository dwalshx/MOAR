# Phase 4: Feedback & Comparison - Research

**Researched:** 2026-04-08
**Domain:** Comparison engine, per-set feedback badges, progressive overload nudges, post-workout summary
**Confidence:** HIGH

## Summary

This phase adds the "Minecraft dopamine layer" -- the core value proposition of MOAR. It requires a pure comparison engine service, visual badge rendering in existing SetRow components, nudge text in SetEntryForm, and a post-workout summary screen that intercepts the finish flow. All data needed for comparisons already exists in IndexedDB via the current schema (Workout > WorkoutExercise > WorkoutSet); no schema changes are required.

The primary challenge is querying historical data efficiently. The comparison engine needs to find the most recent completed workout containing each exercise, then compare set-by-set and exercise-level volume. Dexie's existing indexes on `exerciseName` and `workoutExerciseId` support these queries. The engine should be a pure TypeScript service (no React dependencies) so it can be unit tested with fake-indexeddb just like the existing workoutService tests.

**Primary recommendation:** Build a `comparisonService.ts` as a pure service with methods for set classification, exercise comparison, and workout summary generation. Wire badges and nudges into existing components via new props. Intercept the finish flow in ActiveWorkout to show a summary screen before navigating home.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: ComparisonEngine is a pure service (no React) that classifies sets and exercises
- D-02: Badge types with priority order (highest wins): PR > +1 > Matched > Volume Up > Comeback
- D-03: PR = this exact weight x reps combination has never been done before for this exercise
- D-04: +1 = beat last session's same set number (e.g., set 2 today vs set 2 last time) -- more reps at same weight OR same reps at higher weight
- D-05: Matched = same weight and reps as last session's same set number
- D-06: Volume Up = exercise total volume higher than last session -- only checked/shown after completing sets, not per-set
- D-07: Comeback = exercise wasn't in last session but was done in a prior session
- D-08: Only show the single highest-priority badge per set (no stacking)
- D-09: Comparison always against the most recent completed workout with the same exercise name
- D-10: Small colored pill/tag displayed next to the set row in ExerciseCard
- D-11: Color mapping: PR = gold (#fbbf24), +1 = green (#22c55e), Matched = blue (#3b82f6), Volume Up = purple (#a855f7), Comeback = orange (#f97316)
- D-12: Badge text: "PR", "+1", "Matched", "Vol Up", "Back"
- D-13: Badges appear immediately after logging a set -- no animation delay, instant feedback
- D-14: Subtle presence -- small font, pill shape, doesn't shift layout
- D-15: Nudge appears as subtle text below the set entry form in the expanded ExerciseCard
- D-16: Shows before first set: "Last time: [weight] x [reps]. Try [weight] x [reps+1] or [weight+5] x [reps]"
- D-17: Updates after each set based on remaining opportunity for improvement
- D-18: If no history for this exercise, no nudge shown
- D-19: Nudge text color: muted (text-secondary), not attention-grabbing
- D-20: Full-screen summary displayed after tapping "Finish Workout" (replaces navigation to Home)
- D-21: Summary shows: total volume with % change from last same-name workout
- D-22: Exercise-by-exercise comparison: arrow up (green), arrow down (red), dash (same)
- D-23: Win count: "X of Y exercises improved"
- D-24: Highlight: best single achievement (biggest PR, most improved exercise, etc.)
- D-25: "Done" button at bottom navigates to Home
- D-26: If no previous workout to compare (first time), show congratulatory message with absolute numbers

### Claude's Discretion
- Exact comparison algorithm implementation details
- How to handle partial workouts (fewer sets than last time) in comparison
- Summary screen layout and spacing
- Whether to animate the summary reveal or show it static
- Edge cases: what if user logs 0 weight or 0 reps

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FBK-01 | Per-set micro-feedback badges (PR, +1, matched, volume up, comeback) | Comparison engine classifies each set; SetRow renders badge pill; D-02 through D-14 define exact behavior |
| FBK-02 | Post-workout summary with volume comparison, win count, highlights | Summary screen component; comparisonService.generateWorkoutSummary(); D-20 through D-26 define layout |
| FBK-03 | Progressive overload nudges ("try +1 rep" or "+5 lbs") | comparisonService.suggestTarget(); rendered below SetEntryForm; D-15 through D-19 define behavior |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Dexie.js | 4.x | Query historical sets for comparison | Already in project; indexed queries on exerciseName and workoutExerciseId |
| React | 19.x | Component rendering for badges, nudges, summary | Already in project |
| Tailwind CSS | 4.x | Badge pill styling, summary layout | Already in project |
| React Router | 7.x | Summary screen navigation intercept | Already in project |

### Supporting
No new libraries needed. This phase is pure application logic + UI components using the existing stack.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure service | React context/hook for comparison state | Service is testable with fake-indexeddb; hooks require React test setup |
| Inline summary screen | React Router nested route for summary | Inline state is simpler -- summary is transient, not a bookmarkable URL |

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
src/
  services/
    comparisonService.ts       # Pure comparison engine (NEW)
    comparisonService.test.ts  # Unit tests (NEW)
    workoutService.ts          # Existing -- add helper queries
  components/
    workout/
      SetRow.tsx               # MODIFY -- add badge prop
      SetEntryForm.tsx         # MODIFY -- add nudge text
      ExerciseCard.tsx         # MODIFY -- wire badge + nudge
      ActiveWorkout.tsx        # MODIFY -- intercept finish flow
      WorkoutSummary.tsx       # NEW -- post-workout summary screen
      Badge.tsx                # NEW -- reusable badge pill component
```

### Pattern 1: Pure Comparison Service
**What:** A stateless service module that takes data in, returns classification out. All Dexie queries happen inside the service, but the classification logic is pure functions.
**When to use:** For all comparison operations.
**Example:**
```typescript
// src/services/comparisonService.ts

export type BadgeType = 'PR' | '+1' | 'Matched' | 'Volume Up' | 'Comeback';

export interface SetBadge {
  type: BadgeType;
}

export interface ExerciseComparison {
  exerciseName: string;
  currentVolume: number;
  previousVolume: number | null;
  direction: 'up' | 'down' | 'same' | 'new';
  setBadges: Map<number, SetBadge>; // setId -> badge
}

export interface WorkoutSummary {
  totalVolume: number;
  previousTotalVolume: number | null;
  volumeChangePercent: number | null;
  exercises: ExerciseComparison[];
  winCount: number;
  totalExercises: number;
  bestAchievement: string | null;
}

// Pure classification function -- no DB calls
export function classifySet(
  weight: number,
  reps: number,
  setNumber: number,
  lastSessionSets: { setNumber: number; weight: number; reps: number }[],
  allHistoricalSets: { weight: number; reps: number }[],
): BadgeType | null {
  // Check PR first (highest priority)
  const isNewCombo = !allHistoricalSets.some(
    s => s.weight === weight && s.reps === reps
  );
  if (isNewCombo && weight > 0 && reps > 0) return 'PR';

  // Check +1 against same set number from last session
  const lastSameSet = lastSessionSets.find(s => s.setNumber === setNumber);
  if (lastSameSet) {
    const beatReps = weight === lastSameSet.weight && reps > lastSameSet.reps;
    const beatWeight = reps === lastSameSet.reps && weight > lastSameSet.weight;
    if (beatReps || beatWeight) return '+1';

    // Check Matched
    if (weight === lastSameSet.weight && reps === lastSameSet.reps) return 'Matched';
  }

  return null; // Volume Up and Comeback are exercise-level, not per-set
}
```

### Pattern 2: Badge as Prop, Not State
**What:** Badges are computed and passed as props to SetRow, not stored in component state or DB.
**When to use:** Always -- badges are derived data, not persisted data.
**Example:**
```typescript
// In ExerciseCard.tsx
<SetRow
  key={s.id}
  set={s}
  badge={badges.get(s.id!) || null}  // computed by comparison service
  onUpdate={handleUpdateSet}
  onDelete={handleDeleteSet}
/>
```

### Pattern 3: Summary as Transient State
**What:** After finishing a workout, ActiveWorkout shows a summary overlay/screen instead of navigating away. Summary data is computed once and held in useState.
**When to use:** For the post-workout flow.
**Example:**
```typescript
// In ActiveWorkout.tsx
const [summary, setSummary] = useState<WorkoutSummary | null>(null);

const handleFinish = async () => {
  const summaryData = await comparisonService.generateWorkoutSummary(workoutId);
  await workoutService.finishWorkout(workoutId);
  setSummary(summaryData);
};

if (summary) {
  return <WorkoutSummary summary={summary} onDone={() => navigate('/')} />;
}
```

### Pattern 4: Query Strategy for "Last Session with Same Exercise"
**What:** Finding the most recent completed workout that contains a given exercise name.
**When to use:** For all comparison lookups.
**Example:**
```typescript
// In comparisonService.ts -- query helper
async function getLastSessionSets(
  exerciseName: string,
  excludeWorkoutId: number
): Promise<{ setNumber: number; weight: number; reps: number }[]> {
  // 1. Find all workoutExercise records for this exercise name
  const exercises = await db.workoutExercises
    .where('exerciseName').equals(exerciseName).toArray();

  // 2. Get their parent workouts, filter to completed, exclude current
  const workoutIds = [...new Set(exercises.map(e => e.workoutId))];
  const workouts = await db.workouts.bulkGet(workoutIds);
  const completed = workouts
    .filter((w): w is Workout => !!w && !!w.completedAt && w.id !== excludeWorkoutId)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

  if (completed.length === 0) return [];

  // 3. Get sets from the most recent completed workout's exercise
  const lastWorkout = completed[0];
  const lastExercise = exercises.find(e => e.workoutId === lastWorkout.id!);
  if (!lastExercise) return [];

  const sets = await db.workoutSets
    .where('workoutExerciseId').equals(lastExercise.id!)
    .sortBy('setNumber');

  return sets.map(s => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps }));
}
```

### Anti-Patterns to Avoid
- **Storing badges in the database:** Badges are derived data. Persisting them creates sync issues when sets are edited or deleted.
- **Computing badges in SetRow:** SetRow should receive a badge prop. Computing inside SetRow would require each row to make async DB calls.
- **Using a global state store for comparison data:** Keep comparison data local to ExerciseCard (for badges/nudges) and ActiveWorkout (for summary). No Redux/Zustand needed.
- **Navigating to a new route for summary:** The summary is transient. Using a route means the user could bookmark/refresh it, but the data would be gone. Use component state instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Volume formatting | Custom number formatter | Existing `formatVolume()` in `src/utils/formatters.ts` | Already handles k-abbreviation |
| Exercise name normalization | Inline `.toLowerCase()` comparisons | Existing `normalizeExerciseName()` in workoutService | Already handles title-casing and whitespace |
| Reactive DB queries | Manual cache/refresh | `useLiveQuery` from dexie-react-hooks | Already the established pattern; badges auto-update when sets change |

**Key insight:** The comparison engine is pure logic over existing data. No new infrastructure is needed -- just service functions and component props.

## Common Pitfalls

### Pitfall 1: PR Detection Over-Counting
**What goes wrong:** Treating every first-ever set as a PR (which it technically is if that exact weight x reps has never been done).
**Why it happens:** On a user's first workout, every single set would show "PR" because no history exists yet.
**How to avoid:** PR should require at least one prior completed workout with that exercise. If no history exists, no PR badge. The Comeback badge handles the "returning to an exercise" case.
**Warning signs:** All sets showing PR badges on early workouts.

### Pitfall 2: Comparing Against the Current (Active) Workout
**What goes wrong:** If the query for "last session" doesn't exclude the current active workout, sets could compare against themselves.
**Why it happens:** The current workout has no `completedAt` yet, but exercises/sets are already in the DB.
**How to avoid:** Always filter to `completedAt !== undefined` AND exclude the current workoutId. The current workout is active (no completedAt), so filtering on completedAt should suffice, but explicitly excluding by ID is safer.
**Warning signs:** Badges showing "Matched" for the set you just logged.

### Pitfall 3: Dexie Null Index Pitfall (Again)
**What goes wrong:** Using `.where('completedAt').above(0)` to find completed workouts fails because Dexie doesn't index null/undefined values.
**Why it happens:** Known Dexie behavior -- already encountered in Phase 3 (getRecentWorkouts uses `.filter()` not `.where()`).
**How to avoid:** Use `.filter(w => !!w.completedAt)` or `.toArray()` then filter in JS. The existing pattern in workoutService already does this correctly.
**Warning signs:** Empty results from completed workout queries.

### Pitfall 4: Badge Computation Triggering Too Many Re-Renders
**What goes wrong:** If badges are computed inside a useLiveQuery callback that watches all sets, every set logged could recompute badges for ALL exercises.
**Why it happens:** Broad useLiveQuery subscriptions.
**How to avoid:** Scope badge computation per-exercise inside ExerciseCard. Each ExerciseCard only watches its own sets (already the pattern via `db.workoutSets.where('workoutExerciseId').equals(exercise.id!)`). Compute badges when sets change for that specific exercise.
**Warning signs:** Visible lag when logging sets.

### Pitfall 5: Volume Up Shown Per-Set Instead of Per-Exercise
**What goes wrong:** Showing "Vol Up" badge on individual sets when it should only appear at exercise level after all sets are done.
**Why it happens:** Misreading D-06 which says "only checked/shown after completing sets, not per-set."
**How to avoid:** Volume Up is an exercise-level badge. Show it as a label on the ExerciseCard header or collapsed state, not on individual SetRow instances. Or show it on the last set as a summary indicator.
**Warning signs:** "Vol Up" appearing on set 1 of 4.

### Pitfall 6: Summary Generated After finishWorkout Marks Workout Complete
**What goes wrong:** If `finishWorkout()` is called before generating the summary, the comparison queries that exclude completed workouts might now exclude the workout being summarized.
**Why it happens:** Order of operations matters -- once completedAt is set, the workout is "completed."
**How to avoid:** Generate the summary BEFORE calling `finishWorkout()`. The summary compares the current (still active) workout against previous completed ones. Then finish the workout. Then display the summary.
**Warning signs:** Summary showing wrong comparisons or missing data.

## Code Examples

### Badge Pill Component
```typescript
// src/components/workout/Badge.tsx
import type { BadgeType } from '../../services/comparisonService';

const BADGE_CONFIG: Record<BadgeType, { label: string; color: string }> = {
  'PR':        { label: 'PR',      color: 'bg-[#fbbf24] text-black' },
  '+1':        { label: '+1',      color: 'bg-[#22c55e] text-white' },
  'Matched':   { label: 'Matched', color: 'bg-[#3b82f6] text-white' },
  'Volume Up': { label: 'Vol \u2191',   color: 'bg-[#a855f7] text-white' },
  'Comeback':  { label: 'Back',    color: 'bg-[#f97316] text-white' },
};

interface BadgeProps {
  type: BadgeType;
}

export default function Badge({ type }: BadgeProps) {
  const config = BADGE_CONFIG[type];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full
                      text-[10px] font-semibold leading-none ${config.color}`}>
      {config.label}
    </span>
  );
}
```

### SetRow with Badge Prop
```typescript
// Modified SetRow -- add badge to display view
interface SetRowProps {
  set: WorkoutSet;
  badge?: BadgeType | null;
  onUpdate: (setId: number, weight: number, reps: number) => void;
  onDelete: (setId: number) => void;
}

// In the non-editing render, add badge next to the set info:
<div className="flex items-center gap-4">
  <span className="text-text-primary font-medium text-sm">
    {set.weight} lbs
  </span>
  <span className="text-text-primary font-medium text-sm">
    {set.reps} reps
  </span>
  {badge && <Badge type={badge} />}
</div>
```

### Nudge Text in SetEntryForm
```typescript
// Add below the Log Set button in SetEntryForm:
interface SetEntryFormProps {
  exerciseName: string;
  workoutExerciseId: number;
  onLogSet: (weight: number, reps: number) => void;
  nudgeText?: string | null;  // NEW prop
}

// Render:
{nudgeText && (
  <p className="text-text-secondary text-xs text-center mt-2">
    {nudgeText}
  </p>
)}
```

### Intercept Finish Flow in ActiveWorkout
```typescript
// In ActiveWorkout.tsx
const [summary, setSummary] = useState<WorkoutSummary | null>(null);

const handleFinish = async () => {
  // Generate summary BEFORE finishing (so current workout is still "active")
  const summaryData = await comparisonService.generateWorkoutSummary(workoutId);
  await workoutService.finishWorkout(workoutId);
  setSummary(summaryData);
};

// Render: if summary is set, show WorkoutSummary instead of the active workout
if (summary) {
  return <WorkoutSummary summary={summary} onDone={() => navigate('/')} />;
}
```

### WorkoutPage Guard Update
```typescript
// WorkoutPage.tsx currently redirects to / when workout.completedAt is set.
// After this phase, the summary screen is shown INSIDE ActiveWorkout
// via local state, so the redirect won't fire until "Done" is tapped.
// However, we need to ensure the redirect doesn't trigger prematurely
// since finishWorkout sets completedAt.
//
// Solution: ActiveWorkout holds summary state and prevents WorkoutPage
// from seeing the completed workout. Pass a flag or handle navigation
// from within ActiveWorkout directly.
```

## Discretionary Recommendations

### Partial Workouts (Fewer Sets Than Last Time)
**Recommendation:** Only compare sets that exist in both sessions. If today has 3 sets and last time had 5 sets, compare sets 1-3 and ignore the missing sets 4-5. Do not penalize the user for doing fewer sets. The Volume Up/Down at exercise level naturally captures this.

### Edge Case: 0 Weight or 0 Reps
**Recommendation:** Treat 0-weight sets as valid (bodyweight exercises like dips, pull-ups). Treat 0-reps as invalid -- the Log Set button should be disabled or the set should not be classified. Volume for 0-weight sets is 0, which is technically correct but unhelpful. Consider: if weight is 0, skip volume comparison for that exercise and only compare reps.

### Summary Animation
**Recommendation:** Show static. The summary appears after a natural transition point (tapping Finish). No animation needed. Instant gratification is the goal per D-13.

### Volume Up Badge Placement
**Recommendation:** Since Volume Up is exercise-level (D-06), show it in the ExerciseCard collapsed header (e.g., next to "3 sets" text) rather than on any individual set row. This keeps it visible even when the card is collapsed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useLiveQuery with broad table watches | useLiveQuery scoped to specific IDs | Dexie 4.x | Better performance, fewer re-renders |
| `.where()` on nullable fields | `.filter()` for null checks | Known Dexie pattern | Avoids silent empty results |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via vite.config.ts) |
| Config file | `vite.config.ts` (test section) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FBK-01 | classifySet returns correct badge type for PR, +1, Matched | unit | `npx vitest run src/services/comparisonService.test.ts -t "classifySet"` | Wave 0 |
| FBK-01 | Badge priority: PR wins over +1 wins over Matched | unit | `npx vitest run src/services/comparisonService.test.ts -t "priority"` | Wave 0 |
| FBK-01 | Comeback badge when exercise not in last session | unit | `npx vitest run src/services/comparisonService.test.ts -t "comeback"` | Wave 0 |
| FBK-02 | generateWorkoutSummary returns correct volume, win count, highlight | unit | `npx vitest run src/services/comparisonService.test.ts -t "summary"` | Wave 0 |
| FBK-02 | First-time workout summary shows absolute numbers (no comparison) | unit | `npx vitest run src/services/comparisonService.test.ts -t "first workout"` | Wave 0 |
| FBK-03 | suggestTarget returns correct nudge text from last session data | unit | `npx vitest run src/services/comparisonService.test.ts -t "suggestTarget"` | Wave 0 |
| FBK-03 | No nudge when no history exists | unit | `npx vitest run src/services/comparisonService.test.ts -t "no history"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/services/comparisonService.test.ts` -- covers FBK-01, FBK-02, FBK-03
- Framework and fixtures already exist (fake-indexeddb, vitest config, db clearing pattern in workoutService.test.ts)

## Open Questions

1. **Volume Up badge display location**
   - What we know: D-06 says "only checked/shown after completing sets, not per-set"
   - What's unclear: Where exactly to display -- on the ExerciseCard header? On the last set? As a separate line?
   - Recommendation: Show on ExerciseCard collapsed view header, next to set count. This makes it visible without cluttering individual sets.

2. **WorkoutPage redirect conflict**
   - What we know: WorkoutPage has a useEffect that redirects to `/` when `workout.completedAt` is set. But finishWorkout sets completedAt before the summary can be shown.
   - What's unclear: Exact timing -- will the useLiveQuery re-render trigger the redirect before summary renders?
   - Recommendation: Generate summary and set state before calling finishWorkout. Then either (a) remove the redirect from WorkoutPage and let ActiveWorkout handle all navigation, or (b) add a `showingSummary` state that prevents the redirect.

3. **"Best single achievement" selection (D-24)**
   - What we know: Summary should highlight the best achievement
   - What's unclear: How to rank across different badge types (is a PR on bench press "better" than volume up on squats?)
   - Recommendation: Prioritize PRs first (count them), then biggest volume % increase on a single exercise. Format as "New PR: Bench Press 185x8" or "Biggest gain: Squat volume +15%".

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/services/workoutService.ts`, `src/db/models.ts`, `src/db/database.ts` -- verified data model and query patterns
- Existing codebase: `src/components/workout/*.tsx` -- verified component structure, props, and rendering patterns
- Existing codebase: `src/services/workoutService.test.ts` -- verified test patterns and Dexie test setup
- CONTEXT.md decisions D-01 through D-26 -- locked implementation requirements

### Secondary (MEDIUM confidence)
- Dexie.js query patterns (bulkGet, where/filter, anyOf) -- verified against existing usage in workoutService

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all patterns established in prior phases
- Architecture: HIGH -- pure service + prop drilling follows existing patterns exactly
- Pitfalls: HIGH -- most pitfalls identified from direct code analysis (null index, query ordering, re-render scoping)

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- no external dependencies changing)
