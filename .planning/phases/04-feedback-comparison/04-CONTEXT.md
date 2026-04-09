# Phase 4: Feedback & Comparison - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the comparison engine, per-set feedback badges, progressive overload nudges, and post-workout summary screen. This is the "Minecraft dopamine layer" — every set logged gives instant micro-feedback, and finishing a workout shows a motivating summary.

</domain>

<decisions>
## Implementation Decisions

### Comparison Engine
- **D-01:** ComparisonEngine is a pure service (no React) that classifies sets and exercises
- **D-02:** Badge types with priority order (highest wins): PR > +1 > Matched > Volume Up > Comeback
- **D-03:** PR = this exact weight×reps combination has never been done before for this exercise
- **D-04:** +1 = beat last session's same set number (e.g., set 2 today vs set 2 last time) — more reps at same weight OR same reps at higher weight
- **D-05:** Matched = same weight and reps as last session's same set number
- **D-06:** Volume Up = exercise total volume (sum weight×reps across all sets) is higher than last session — only checked/shown after completing sets, not per-set
- **D-07:** Comeback = this exercise wasn't in last session but was done in a prior session
- **D-08:** Only show the single highest-priority badge per set (no stacking)
- **D-09:** Comparison always against the most recent completed workout with the same exercise name

### Badge Visual Design
- **D-10:** Small colored pill/tag displayed next to the set row in ExerciseCard
- **D-11:** Color mapping: PR = gold (#fbbf24), +1 = green (#22c55e), Matched = blue (#3b82f6), Volume Up = purple (#a855f7), Comeback = orange (#f97316)
- **D-12:** Badge text is the type name: "PR", "+1", "Matched", "Vol ↑", "Back"
- **D-13:** Badges appear immediately after logging a set — no animation delay, instant feedback
- **D-14:** Subtle presence — small font, pill shape, doesn't shift layout

### Progressive Overload Nudges
- **D-15:** Nudge appears as subtle text below the set entry form in the expanded ExerciseCard
- **D-16:** Shows before first set: "Last time: [weight]×[reps]. Try [weight]×[reps+1] or [weight+5]×[reps]"
- **D-17:** Updates after each set based on remaining opportunity for improvement
- **D-18:** If no history for this exercise, no nudge shown
- **D-19:** Nudge text color: muted (text-secondary), not attention-grabbing — it's a whisper, not a shout

### Post-Workout Summary
- **D-20:** Full-screen summary displayed after tapping "Finish Workout" (replaces navigation to Home)
- **D-21:** Summary shows: total volume with % change from last same-name workout
- **D-22:** Exercise-by-exercise comparison: arrow up (green), arrow down (red), dash (same)
- **D-23:** Win count: "X of Y exercises improved"
- **D-24:** Highlight: best single achievement (biggest PR, most improved exercise, etc.)
- **D-25:** "Done" button at bottom navigates to Home
- **D-26:** If no previous workout to compare (first time), show congratulatory message with absolute numbers

### Claude's Discretion
- Exact comparison algorithm implementation details
- How to handle partial workouts (fewer sets than last time) in comparison
- Summary screen layout and spacing
- Whether to animate the summary reveal or show it static
- Edge cases: what if user logs 0 weight or 0 reps

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Core value: every set gives immediate feedback
- `.planning/REQUIREMENTS.md` — FBK-01 (per-set badges), FBK-02 (post-workout summary), FBK-03 (nudges)
- `.planning/research/FEATURES.md` — Differentiators section on micro-feedback and nudges
- `.planning/phases/02-core-logging/02-CONTEXT.md` — Set entry form, ExerciseCard, SetRow decisions
- `src/services/workoutService.ts` — getLastSetValues, getWorkoutVolume, finishWorkout
- `src/components/workout/SetRow.tsx` — Where badges will appear
- `src/components/workout/SetEntryForm.tsx` — Where nudges will appear
- `src/components/workout/ExerciseCard.tsx` — Container for both
- `src/components/workout/ActiveWorkout.tsx` — Orchestrates finish flow
- `src/db/models.ts` — WorkoutSet interface (weight, reps, timestamp)
- `src/utils/formatters.ts` — formatVolume utility

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workoutService.getLastSetValues(exerciseName)` — returns last session's weight/reps per exercise
- `workoutService.getWorkoutVolume(workoutId)` — total volume for a workout
- `workoutService.finishWorkout(workoutId)` — finish flow to intercept for summary
- `SetRow.tsx` — logged set display, will need badge prop
- `SetEntryForm.tsx` — set entry with steppers, will need nudge text
- `formatVolume()` — already formats volume numbers

### Established Patterns
- useLiveQuery for reactive Dexie data
- workoutService for all DB queries
- Tailwind utility classes with theme tokens
- Inline component composition (no modals)

### Integration Points
- SetRow → add badge prop and render colored pill
- SetEntryForm → add nudge text below steppers
- ActiveWorkout/WorkoutPage → intercept finish to show summary before navigating home
- workoutService → add comparison methods (compareSet, compareExercise, compareWorkout, suggestTarget)

</code_context>

<specifics>
## Specific Ideas

- "Like Minecraft XP orbs, not popup notifications" — badges should feel like a natural part of the set row
- The nudge is a whisper: "Last time: 135×8. Try 135×9" — not "YOU SHOULD DO MORE!"
- Post-workout summary is the reward screen — make progress feel obvious
- Win count ("3 of 5 exercises improved") is the key motivational metric

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-feedback-comparison*
*Context gathered: 2026-04-09*
