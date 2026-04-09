# Phase 2: Core Logging - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the active workout screen where users log sets. This is the most critical UX — every set must be loggable in 1-3 taps. Users can start a workout, add exercises, log weight+reps with stepper buttons, jump between exercises freely via cards, edit/delete sets, and everything persists immediately to IndexedDB. Active workouts survive app reload.

</domain>

<decisions>
## Implementation Decisions

### Exercise Card Layout
- **D-01:** Compact exercise cards in a vertically scrollable list on the active workout screen
- **D-02:** Tap a card to expand it — expanded view shows logged sets + set entry form
- **D-03:** Only one card expanded at a time (accordion) — tapping another collapses the current one
- **D-04:** Collapsed card shows: exercise name, set count, last set weight x reps
- **D-05:** Cards should feel like a dashboard — user can see all exercises at a glance and jump to any

### Set Entry Interaction
- **D-06:** Set entry form is inline within the expanded exercise card (no modal, no separate screen)
- **D-07:** Weight and reps pre-filled from last logged set (or last session's values if first set)
- **D-08:** Weight stepper: +/- 5 lb per tap, long-press for +/- 1 lb (from Phase 1 D-08)
- **D-09:** Rep stepper: +/- 1 per tap (from Phase 1 D-09)
- **D-10:** "Log Set" button prominently placed — one tap to record
- **D-11:** Card stays expanded after logging — user can immediately log next set
- **D-12:** Logged sets appear as a compact list within the card (set #, weight, reps)

### Workout Start Flow
- **D-13:** Home screen shows "Start Workout" button
- **D-14:** Tapping "Start Workout" creates an empty workout with auto-generated name (e.g., "Workout - Apr 9")
- **D-15:** User arrives at empty active workout screen with exercise input at top
- **D-16:** Templates and "Repeat Last" deferred to Phase 3

### Exercise Entry
- **D-17:** Text input at top of active workout screen for adding exercises
- **D-18:** Autocomplete dropdown shows matching exercises from history on keystroke
- **D-19:** Tap autocomplete suggestion or press Enter to add exercise as new card
- **D-20:** Exercise names normalized on save (trimmed, title-cased)

### Edit/Delete Sets
- **D-21:** Tap a logged set row to make it editable (weight/reps become steppers)
- **D-22:** Swipe left on a set row to reveal delete button
- **D-23:** Delete requires one confirmation tap (not a modal — inline "Undo" or "Confirm")

### Persistence & Recovery
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Core value: every set gives immediate feedback
- `.planning/REQUIREMENTS.md` — LOG-01 through LOG-06
- `.planning/research/ARCHITECTURE.md` — Data model, WorkoutService, component architecture
- `.planning/research/PITFALLS.md` — #1 Data entry friction, #3 Active workout state loss, #4 Exercise name inconsistency
- `.planning/phases/01-foundation/01-CONTEXT.md` — Visual style, navigation, stepper decisions
- `src/db/models.ts` — TypeScript interfaces for all entities
- `src/db/database.ts` — Dexie database class with tables and indexes
- `src/components/layout/AppLayout.tsx` — Layout wrapper with dark theme
- `src/components/layout/BottomNav.tsx` — Bottom tab bar (needs "Workout" tab addition)
- `src/pages/WorkoutPage.tsx` — Placeholder to be replaced with active workout screen
- `src/pages/HomePage.tsx` — Placeholder to be replaced with start workout button

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MoarDatabase` (src/db/database.ts): Dexie class with workouts, workoutExercises, workoutSets, workoutTemplates tables
- `AppLayout` (src/components/layout/AppLayout.tsx): Dark theme wrapper with safe area insets
- `BottomNav` (src/components/layout/BottomNav.tsx): Bottom tab bar — needs conditional "Workout" tab
- Tailwind CSS 4 theme tokens: --color-accent (#f97316), --color-bg-primary (#0f0f0f), etc.

### Established Patterns
- React Router with BrowserRouter and nested routes under AppLayout
- Dexie typed tables with auto-increment IDs
- Tailwind utility classes with dark theme tokens
- h-dvh viewport height for iOS Safari

### Integration Points
- WorkoutPage.tsx (/workout/:id) — replace placeholder with active workout screen
- HomePage.tsx (/) — replace placeholder with "Start Workout" button
- BottomNav.tsx — add conditional "Workout" tab when workout is active
- database.ts — use existing CRUD operations for logging sets

</code_context>

<specifics>
## Specific Ideas

- "Minecraft compulsion loop" — logging a set should feel instant and satisfying, like placing a block
- The expanded exercise card IS the set entry form — no navigation away from the workout view
- Pre-filled values are the "target to beat" — the user just needs to adjust and tap Log
- Accordion pattern (one card expanded at a time) keeps the screen focused while allowing quick jumps

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-logging*
*Context gathered: 2026-04-09*
