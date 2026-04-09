# Phase 5: History & Charts - Research

**Researched:** 2026-04-08
**Domain:** Workout history browsing, data visualization with Recharts, Dexie queries
**Confidence:** HIGH

## Summary

Phase 5 replaces two placeholder pages (HistoryPage, ExerciseDetailPage) with fully functional history browsing and adds volume-over-time charts using Recharts. The codebase has strong existing patterns: useLiveQuery for reactive data, workoutService for all DB access, Tailwind dark theme tokens, and React Router push navigation. The main new additions are (1) installing Recharts (not yet in package.json despite stack doc claiming it), (2) new workoutService methods for workout detail and exercise history queries, (3) a new /history/:id route, and (4) chart components.

The Recharts API is straightforward for line charts -- ResponsiveContainer + LineChart + Line + XAxis + YAxis + Tooltip covers everything needed. The key risk is mobile chart performance with too many data points (decision D-22 already caps at 20 sessions). Recharts is now at v3.8.1 (not 2.x as the stack doc says), but the API for LineChart/Line/XAxis/YAxis/Tooltip is unchanged from 2.x.

**Primary recommendation:** Install recharts@^3.8.1, add 3-4 new workoutService methods, build components bottom-up (service layer -> chart component -> pages), keep charts simple with the orange accent line on dark background.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Replace HistoryPage placeholder with scrollable list of all completed workouts, most recent first
- D-02: Each row shows: workout name, relative date, total volume (lbs)
- D-03: Reuse visual style from RecentWorkoutCard but without Repeat button -- read-only history
- D-04: Tap a workout row to navigate to workout detail view
- D-05: Show all workouts, not just last 10 (unlike Home which shows recent 10)
- D-06: Paginate or infinite scroll if list gets long (lazy load batches of 20)
- D-07: New route: /history/:id -- push navigation from history list
- D-08: Shows workout name, date (absolute: "Apr 9, 2026"), computed duration (last set timestamp - first set timestamp)
- D-09: Exercise-by-exercise breakdown: exercise name, sets table (set#, weight, reps), per-exercise volume
- D-10: Total workout volume at bottom
- D-11: Read-only -- no editing from history view
- D-12: Each exercise name is tappable -- navigates to ExerciseDetailPage for that exercise
- D-13: Replace ExerciseDetailPage placeholder with per-exercise history
- D-14: Session table: each row shows date, set count, total volume for that exercise in that session
- D-15: Volume-over-time line chart above the table (FBK-04)
- D-16: Tap a session row to expand and show individual sets (set#, weight, reps)
- D-17: Exercise name as the page title
- D-18: Accessible from: workout detail (tap exercise name) OR active workout (tap exercise name in card header)
- D-19: Use Recharts -- ResponsiveContainer + LineChart + Line + XAxis + YAxis + Tooltip
- D-20: Simple line with dots for each session, no area fill
- D-21: X-axis: dates (abbreviated: "Apr 9"), Y-axis: volume in lbs
- D-22: Last 20 sessions by default -- don't render entire history to keep performance
- D-23: Touch-friendly: tap a dot to see tooltip with exact date + volume
- D-24: One chart per view -- no stacked or multiple charts on same screen
- D-25: Chart colors: accent orange (#f97316) for the line/dots on dark background
- D-26: Total workout volume chart: on HistoryPage above the list (FBK-05)
- D-27: Per-exercise volume chart: on ExerciseDetailPage above the session table (FBK-04)
- D-28: Add /history/:id route to App.tsx for workout detail
- D-29: Exercise names in workout detail and active workout cards should be tappable links to /exercise/:name

### Claude's Discretion
- Exact chart sizing and responsive behavior
- Tooltip styling
- Session table expand/collapse animation
- How to handle exercises with very few data points (1-2 sessions) on charts
- Empty states for history when no workouts exist yet
- Duration formatting (e.g., "45 min" vs "0h 45m")

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HST-01 | View list of past workouts (date, name, total volume) | HistoryPage with lazy-loaded workout list, existing getRecentWorkouts pattern extended to support offset/limit pagination |
| HST-02 | View exercise history across all workouts | ExerciseDetailPage with new getExerciseHistory service method querying workoutExercises by exerciseName |
| HST-03 | View workout detail (exercises, sets, volume) | New WorkoutDetailPage at /history/:id with new getWorkoutDetail service method |
| FBK-04 | Per-exercise volume-over-time line chart | Recharts LineChart on ExerciseDetailPage, data from getExerciseHistory (last 20 sessions) |
| FBK-05 | Total workout volume-over-time line chart | Recharts LineChart on HistoryPage, data from getRecentWorkouts (last 20 workouts) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | Line charts for volume visualization | React-native components, responsive, touch-friendly, ~45KB gzipped |

### Supporting
All other dependencies already installed:
| Library | Version | Purpose |
|---------|---------|---------|
| react | 19.x | UI framework (installed) |
| react-router | 7.x | Routing -- useNavigate, useParams (installed) |
| dexie | 4.x | IndexedDB queries (installed) |
| dexie-react-hooks | 4.x | useLiveQuery reactivity (installed) |
| tailwindcss | 4.x | Styling (installed) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js + react-chartjs-2 | Not React-native, requires canvas wrapper, less idiomatic |
| Recharts | uPlot | Much lighter but poor React integration, manual DOM management |

**Installation:**
```bash
npm install recharts
```

**CRITICAL NOTE:** Recharts is NOT currently in package.json despite the stack doc and CONTEXT.md saying "already installed." The first task MUST install it.

**Version verification:** `npm view recharts version` returns 3.8.1 (verified 2026-04-08). The stack doc says "2.x" but Recharts is now at 3.x. The LineChart/Line/XAxis/YAxis/Tooltip/ResponsiveContainer API is unchanged. Key 3.x change: `accessibilityLayer` defaults to `true` (good for us -- keyboard navigation for free).

## Architecture Patterns

### New Files to Create
```
src/
  pages/
    HistoryPage.tsx          # Replace placeholder (HST-01, FBK-05)
    ExerciseDetailPage.tsx   # Replace placeholder (HST-02, FBK-04)
    WorkoutDetailPage.tsx    # New page (HST-03)
  components/
    history/
      HistoryWorkoutCard.tsx # Read-only card (reuses RecentWorkoutCard style, no Repeat)
      WorkoutVolumeChart.tsx # LineChart for total volume over time (FBK-05)
    exercise/
      ExerciseVolumeChart.tsx # LineChart for per-exercise volume (FBK-04)
      SessionRow.tsx          # Expandable row with sets detail
  services/
    workoutService.ts        # Add new methods (no new file)
  utils/
    formatters.ts            # Add new formatters (no new file)
```

### Pattern 1: Service Layer for All New Queries
**What:** All new data access goes through workoutService -- no direct Dexie calls in components.
**When to use:** Every new query needed for history/detail views.
**New methods needed:**

```typescript
// 1. Get ALL completed workouts with pagination (HST-01)
async getCompletedWorkouts(offset: number, limit: number): Promise<RecentWorkout[]>

// 2. Get workout detail with exercises and sets (HST-03)
async getWorkoutDetail(workoutId: number): Promise<WorkoutDetail>

// 3. Get exercise history across sessions (HST-02, FBK-04)
async getExerciseHistory(exerciseName: string, limit?: number): Promise<ExerciseSession[]>

// 4. Get workout volume chart data (FBK-05)
async getWorkoutVolumeChartData(limit?: number): Promise<VolumeDataPoint[]>
```

### Pattern 2: useLiveQuery for Reactive Data
**What:** All component reads use useLiveQuery from dexie-react-hooks for automatic re-rendering when data changes.
**When to use:** Every page/component that reads from the DB.
**Example:**
```typescript
// Established project pattern -- follow exactly
const workouts = useLiveQuery(
  () => workoutService.getCompletedWorkouts(0, 20),
  [] // deps
);
if (workouts === undefined) return null; // loading
if (workouts.length === 0) return <EmptyState />; // empty
```

### Pattern 3: Recharts Line Chart Component
**What:** Reusable chart wrapper with project's dark theme colors.
**Example:**
```typescript
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface VolumeChartProps {
  data: { date: string; volume: number }[];
}

export default function VolumeChart({ data }: VolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          tick={{ fill: '#a3a3a3', fontSize: 12 }}
          axisLine={{ stroke: '#333333' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#a3a3a3', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip
          trigger="click"
          contentStyle={{
            backgroundColor: '#242424',
            border: '1px solid #333333',
            borderRadius: '8px',
            color: '#f5f5f5',
          }}
        />
        <Line
          type="monotone"
          dataKey="volume"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ fill: '#f97316', r: 4 }}
          activeDot={{ r: 6, fill: '#f97316' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 4: Infinite Scroll / Lazy Loading (D-06)
**What:** Load workouts in batches of 20, append on scroll.
**Approach:** Use useState for offset, IntersectionObserver on a sentinel element at the bottom of the list. When sentinel enters viewport, increment offset and fetch next batch.
```typescript
const [workouts, setWorkouts] = useState<RecentWorkout[]>([]);
const [offset, setOffset] = useState(0);
const [hasMore, setHasMore] = useState(true);
const sentinelRef = useRef<HTMLDivElement>(null);

// Note: Can't use useLiveQuery directly with pagination append pattern.
// Use useEffect + manual fetch, or useLiveQuery with increasing limit.
// Simpler approach: useLiveQuery with limit = offset + BATCH_SIZE,
// re-fetches full list each time but Dexie is fast for local data.
```

### Pattern 5: Expandable Session Row (D-16)
**What:** Tap a row to expand and show individual sets.
**Approach:** Track expandedSessionId in state (same pattern as ExerciseCard's accordion -- track by DB ID, not array index).

### Anti-Patterns to Avoid
- **Direct DB queries in components:** Always go through workoutService. Established pattern, no exceptions.
- **useEffect for data fetching over useLiveQuery:** useLiveQuery is the project standard for reactive reads. Only use useEffect when you need non-reactive one-time fetches or side effects.
- **Complex state management for history data:** No need for Context or reducers. Each page manages its own state via useLiveQuery. Pattern established by RecentWorkouts component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive charts | Custom SVG/canvas | Recharts ResponsiveContainer | Handles resize, touch, accessibility |
| Date formatting on axis | Manual date math | toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) | Locale-aware, consistent with existing formatters |
| Volume formatting | Custom number formatting | Existing formatVolume from formatters.ts | Already handles k abbreviation |
| Relative dates | Custom logic | Existing formatRelativeDate from formatters.ts | Already handles Today/Yesterday/weekday/date |
| Touch-friendly tooltips | Custom touch handlers | Recharts Tooltip trigger="click" | Built-in tap-to-show on mobile |

**Key insight:** The existing formatters.ts and workoutService.ts cover most data transformation needs. The new work is mainly (1) new queries and (2) chart rendering.

## Common Pitfalls

### Pitfall 1: Recharts Not Installed
**What goes wrong:** Build fails because recharts is imported but not in dependencies.
**Why it happens:** Stack doc says "already installed" but package.json does not include it.
**How to avoid:** First task must run `npm install recharts` before any chart code.
**Warning signs:** Module not found error on import.

### Pitfall 2: ResponsiveContainer Needs a Parent with Defined Height
**What goes wrong:** Chart renders with 0 height or doesn't render at all.
**Why it happens:** ResponsiveContainer reads parent dimensions. If parent has no explicit height, chart collapses.
**How to avoid:** Always wrap ResponsiveContainer in a div with explicit height (e.g., `h-[200px]` or fixed height).
**Warning signs:** Chart appears as thin line or invisible.

### Pitfall 3: Dexie Null Index Pitfall with completedAt
**What goes wrong:** Querying workouts by completedAt using .where() returns nothing for null values.
**Why it happens:** Dexie cannot index null/undefined values. completedAt is undefined for active workouts.
**How to avoid:** Use .filter() not .where() for completedAt checks. This is already the established pattern (see getRecentWorkouts).
**Warning signs:** Active workouts appearing in history, or completed workouts missing.

### Pitfall 4: Chart Performance with Large Datasets
**What goes wrong:** Slow rendering, janky scroll on mobile Safari.
**Why it happens:** Recharts renders SVG -- too many data points = too many DOM nodes.
**How to avoid:** D-22 already mandates max 20 sessions. Enforce this limit in the service layer queries.
**Warning signs:** Scroll lag when chart is visible.

### Pitfall 5: Pagination State vs useLiveQuery Reactivity
**What goes wrong:** New workout completes but history list doesn't update, or pagination state resets.
**Why it happens:** useLiveQuery re-runs on any table change. With manual pagination state, this can cause unexpected re-renders.
**How to avoid:** Simplest approach: use useLiveQuery with a single limit that increases as user scrolls. Dexie queries are fast enough for local data that re-fetching a growing list is fine for the expected data sizes (lifter doing 3x/week = ~150 workouts/year).
**Warning signs:** List flickering or resetting scroll position.

### Pitfall 6: Duration Calculation Edge Cases
**What goes wrong:** Duration shows as 0 or negative for workouts with only one set, or NaN for workouts with no sets.
**Why it happens:** D-08 defines duration as "last set timestamp - first set timestamp." One set = 0 duration. No sets = no timestamps.
**How to avoid:** Guard for edge cases: 0 sets -> "N/A", 1 set -> "< 1 min" or show nothing, normal case -> compute difference.
**Warning signs:** "NaN min" or "0 min" displayed for valid workouts.

### Pitfall 7: Exercise Name URL Encoding
**What goes wrong:** Exercise names with spaces break routing (e.g., "Bench Press" in URL).
**Why it happens:** React Router path params don't auto-encode spaces.
**How to avoid:** Use encodeURIComponent when building links, decodeURIComponent when reading params. ExerciseDetailPage already uses decodeURIComponent(name || '').
**Warning signs:** 404 on exercise detail pages, or exercise name showing as "Bench%20Press".

## Code Examples

### New Service Methods

```typescript
// Types needed
export interface WorkoutDetail {
  id: number;
  name: string;
  startedAt: Date;
  completedAt: Date;
  totalVolume: number;
  duration: number | null; // minutes
  exercises: WorkoutExerciseDetail[];
}

export interface WorkoutExerciseDetail {
  exerciseName: string;
  sets: { setNumber: number; weight: number; reps: number }[];
  volume: number;
}

export interface ExerciseSession {
  workoutId: number;
  date: Date;
  setCount: number;
  totalVolume: number;
  sets: { setNumber: number; weight: number; reps: number }[];
}

export interface VolumeDataPoint {
  date: string; // "Apr 9" format for chart axis
  volume: number;
  fullDate: string; // "Apr 9, 2026" for tooltip
}
```

### Workout Detail Query Pattern
```typescript
async getWorkoutDetail(workoutId: number): Promise<WorkoutDetail | null> {
  const workout = await db.workouts.get(workoutId);
  if (!workout || !workout.completedAt) return null;

  const exercises = await db.workoutExercises
    .where('workoutId').equals(workoutId)
    .sortBy('order');

  const exerciseDetails: WorkoutExerciseDetail[] = [];
  let totalVolume = 0;
  let firstTimestamp: Date | null = null;
  let lastTimestamp: Date | null = null;

  for (const ex of exercises) {
    const sets = await db.workoutSets
      .where('workoutExerciseId').equals(ex.id!)
      .sortBy('setNumber');

    const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    totalVolume += volume;

    // Track timestamps for duration
    for (const s of sets) {
      if (!firstTimestamp || s.timestamp < firstTimestamp) firstTimestamp = s.timestamp;
      if (!lastTimestamp || s.timestamp > lastTimestamp) lastTimestamp = s.timestamp;
    }

    exerciseDetails.push({
      exerciseName: ex.exerciseName,
      sets: sets.map(s => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps })),
      volume,
    });
  }

  const duration = firstTimestamp && lastTimestamp
    ? Math.round((lastTimestamp.getTime() - firstTimestamp.getTime()) / 60000)
    : null;

  return {
    id: workout.id!,
    name: workout.name,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
    totalVolume,
    duration,
    exercises: exerciseDetails,
  };
}
```

### Exercise History Query Pattern
```typescript
async getExerciseHistory(exerciseName: string, limit: number = 20): Promise<ExerciseSession[]> {
  // Find all workoutExercise entries for this exercise name
  const entries = await db.workoutExercises
    .where('exerciseName').equals(exerciseName).toArray();

  const sessions: ExerciseSession[] = [];

  for (const entry of entries) {
    // Only include completed workouts
    const workout = await db.workouts.get(entry.workoutId);
    if (!workout || !workout.completedAt) continue;

    const sets = await db.workoutSets
      .where('workoutExerciseId').equals(entry.id!)
      .sortBy('setNumber');

    if (sets.length === 0) continue;

    sessions.push({
      workoutId: workout.id!,
      date: workout.completedAt,
      setCount: sets.length,
      totalVolume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
      sets: sets.map(s => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps })),
    });
  }

  // Sort by date descending (most recent first), take limit
  return sessions
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}
```

### New Formatters Needed
```typescript
// Absolute date for workout detail (D-08)
export function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Short date for chart axis (D-21)
export function formatChartDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Duration (D-08) -- Claude's discretion on format
export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '--';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
```

### Chart with Dark Theme (D-19 through D-25)
```typescript
// Recharts dark theme constants aligned with project tokens
const CHART_THEME = {
  line: '#f97316',       // --color-accent
  text: '#a3a3a3',       // --color-text-secondary
  grid: '#333333',       // --color-border
  tooltipBg: '#242424',  // --color-bg-card
  tooltipBorder: '#333333',
  tooltipText: '#f5f5f5', // --color-text-primary
};
```

### Tappable Exercise Name Link (D-12, D-18, D-29)
```typescript
import { useNavigate } from 'react-router';

// In workout detail or exercise card header
<span
  onClick={() => navigate(`/exercise/${encodeURIComponent(exerciseName)}`)}
  className="font-semibold text-accent cursor-pointer active:opacity-80"
>
  {exerciseName}
</span>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x | Recharts 3.x | 2024 | accessibilityLayer defaults true, better perf, same API surface |
| react-router-dom | react-router (v7) | 2024 | Import from 'react-router' not 'react-router-dom' -- project already does this |

**Deprecated/outdated:**
- Recharts `alwaysShow` prop on Reference elements (removed in 3.x) -- not relevant to our use case
- Recharts 2.x `activeIndex` prop (removed in 3.x) -- not relevant to our use case

## Open Questions

1. **Pagination approach: useLiveQuery with growing limit vs manual fetch + append**
   - What we know: useLiveQuery re-runs on table changes, which is good for reactivity but may re-fetch growing lists
   - What's unclear: At what data size does re-fetching become noticeable on mobile Safari
   - Recommendation: Start with useLiveQuery + growing limit (simplest). A 3x/week lifter accumulates ~150 workouts/year -- trivial for Dexie. Optimize only if profiling shows issues.

2. **Chart rendering for 1-2 data points**
   - What we know: A line chart with 1 point is just a dot, 2 points is a single line segment
   - What's unclear: Whether this looks odd or confusing to users
   - Recommendation: Show the chart for 2+ sessions. For 1 session, show a message like "Complete more workouts to see your trend" with the single data point visible.

## Project Constraints (from CLAUDE.md)

- **Stack:** React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + Dexie.js + Recharts + React Router 7
- **Dark theme:** bg-primary #0f0f0f, accent orange #f97316, success green #22c55e
- **Tailwind CSS 4:** Uses @tailwindcss/vite with CSS @theme tokens (no JS config)
- **Import convention:** `import from 'react-router'` (not react-router-dom)
- **Layout:** h-dvh instead of h-screen (iOS Safari 100vh bug)
- **Service layer:** All Dexie CRUD through workoutService, .filter() for null checks
- **Reactivity:** useLiveQuery for all component reads
- **Testing:** Vitest with node env + fake-indexeddb for services
- **GSD Workflow:** Do not make direct repo edits outside a GSD workflow unless user explicitly asks

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | vite.config.ts (test block) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HST-01 | getCompletedWorkouts returns paginated completed workouts | unit | `npx vitest run src/services/workoutService.test.ts -t "getCompletedWorkouts"` | Wave 0 |
| HST-02 | getExerciseHistory returns sessions for an exercise | unit | `npx vitest run src/services/workoutService.test.ts -t "getExerciseHistory"` | Wave 0 |
| HST-03 | getWorkoutDetail returns full workout breakdown | unit | `npx vitest run src/services/workoutService.test.ts -t "getWorkoutDetail"` | Wave 0 |
| FBK-04 | Per-exercise volume chart data correct | unit | `npx vitest run src/services/workoutService.test.ts -t "getExerciseHistory"` | Wave 0 |
| FBK-05 | Workout volume chart data correct | unit | `npx vitest run src/services/workoutService.test.ts -t "getWorkoutVolumeChartData"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] New test cases in `src/services/workoutService.test.ts` for getCompletedWorkouts, getWorkoutDetail, getExerciseHistory, getWorkoutVolumeChartData
- [ ] New test file `src/utils/formatters.test.ts` -- already exists, needs new tests for formatAbsoluteDate, formatChartDate, formatDuration

## Sources

### Primary (HIGH confidence)
- Project codebase -- workoutService.ts, models.ts, database.ts, formatters.ts, all pages and components
- package.json -- verified recharts is NOT installed (contradicts stack doc)
- npm registry -- `npm view recharts version` = 3.8.1

### Secondary (MEDIUM confidence)
- [Recharts API docs](https://recharts.github.io/en-US/api/) -- LineChart, ResponsiveContainer, Tooltip
- [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- breaking changes are minimal for our use case
- [Recharts Tooltip API](https://recharts.github.io/en-US/api/Tooltip/) -- trigger="click" for mobile touch

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - recharts is the only new dependency, verified current version
- Architecture: HIGH - extends well-established project patterns (service layer, useLiveQuery, Tailwind)
- Pitfalls: HIGH - identified from direct codebase analysis and Recharts documentation

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable domain, no fast-moving dependencies)
