# Phase 5: History & Charts - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build workout history browsing, workout detail view, per-exercise history with volume chart, and total workout volume chart. Users can see their progress over time through clean line charts and browse past workout details.

</domain>

<decisions>
## Implementation Decisions

### History List (HistoryPage)
- **D-01:** Replace HistoryPage placeholder with scrollable list of all completed workouts, most recent first
- **D-02:** Each row shows: workout name, relative date, total volume (lbs)
- **D-03:** Reuse visual style from RecentWorkoutCard but without Repeat button — read-only history
- **D-04:** Tap a workout row to navigate to workout detail view
- **D-05:** Show all workouts, not just last 10 (unlike Home which shows recent 10)
- **D-06:** Paginate or infinite scroll if list gets long (lazy load batches of 20)

### Workout Detail View
- **D-07:** New route: /history/:id — push navigation from history list
- **D-08:** Shows workout name, date (absolute: "Apr 9, 2026"), computed duration (last set timestamp - first set timestamp)
- **D-09:** Exercise-by-exercise breakdown: exercise name, sets table (set#, weight, reps), per-exercise volume
- **D-10:** Total workout volume at bottom
- **D-11:** Read-only — no editing from history view
- **D-12:** Each exercise name is tappable → navigates to ExerciseDetailPage for that exercise

### Exercise Detail View (ExerciseDetailPage)
- **D-13:** Replace ExerciseDetailPage placeholder with per-exercise history
- **D-14:** Session table: each row shows date, set count, total volume for that exercise in that session
- **D-15:** Volume-over-time line chart above the table (FBK-04)
- **D-16:** Tap a session row to expand and show individual sets (set#, weight, reps)
- **D-17:** Exercise name as the page title
- **D-18:** Accessible from: workout detail (tap exercise name) OR active workout (tap exercise name in card header)

### Chart Design
- **D-19:** Use Recharts (already installed) — ResponsiveContainer + LineChart + Line + XAxis + YAxis + Tooltip
- **D-20:** Simple line with dots for each session, no area fill
- **D-21:** X-axis: dates (abbreviated: "Apr 9"), Y-axis: volume in lbs
- **D-22:** Last 20 sessions by default — don't render entire history to keep performance
- **D-23:** Touch-friendly: tap a dot to see tooltip with exact date + volume
- **D-24:** One chart per view — no stacked or multiple charts on same screen
- **D-25:** Chart colors: accent orange (#f97316) for the line/dots on dark background
- **D-26:** Total workout volume chart: on HistoryPage above the list (FBK-05)
- **D-27:** Per-exercise volume chart: on ExerciseDetailPage above the session table (FBK-04)

### Navigation Updates
- **D-28:** Add /history/:id route to App.tsx for workout detail
- **D-29:** Exercise names in workout detail and active workout cards should be tappable links to /exercise/:name

### Claude's Discretion
- Exact chart sizing and responsive behavior
- Tooltip styling
- Session table expand/collapse animation
- How to handle exercises with very few data points (1-2 sessions) on charts
- Empty states for history when no workouts exist yet
- Duration formatting (e.g., "45 min" vs "0h 45m")

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/REQUIREMENTS.md` — HST-01, HST-02, HST-03, FBK-04, FBK-05
- `.planning/research/STACK.md` — Recharts recommendation
- `.planning/research/PITFALLS.md` — #6 Chart overload on mobile
- `src/services/workoutService.ts` — getRecentWorkouts, getWorkoutVolume
- `src/utils/formatters.ts` — formatRelativeDate, formatVolume
- `src/pages/HistoryPage.tsx` — Placeholder to replace
- `src/pages/ExerciseDetailPage.tsx` — Placeholder to replace
- `src/components/home/RecentWorkoutCard.tsx` — Visual style reference for history cards
- `src/db/models.ts` — All entity interfaces
- `src/db/database.ts` — Dexie tables and indexes
- `src/App.tsx` — Route definitions to extend

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workoutService.getRecentWorkouts(limit)` — returns completed workouts with volume
- `workoutService.getWorkoutVolume(workoutId)` — total volume for a workout
- `formatRelativeDate(date)` / `formatVolume(volume)` — formatting utilities
- `RecentWorkoutCard` — visual style reference (name, date, volume layout)
- Recharts already installed in package.json

### Established Patterns
- useLiveQuery for reactive Dexie queries
- React Router push navigation with useNavigate/useParams
- Tailwind dark theme with accent tokens
- workoutService for all DB operations

### Integration Points
- HistoryPage.tsx — replace placeholder
- ExerciseDetailPage.tsx — replace placeholder
- App.tsx — add /history/:id route
- workoutService.ts — may need getExerciseHistory, getWorkoutDetail methods

</code_context>

<specifics>
## Specific Ideas

- Charts are the "look at what you built" moment — the visual payoff for all that logging
- Keep charts simple: one line, dots, trend visible. Don't overcomplicate.
- Volume-over-time going up-and-to-the-right IS the reward

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-history-charts*
*Context gathered: 2026-04-09*
