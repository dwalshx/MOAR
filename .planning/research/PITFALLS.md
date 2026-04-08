# Pitfalls Research: Mobile-First Weightlifting Tracker

**Researched:** 2026-04-08
**Domain:** Mobile PWA, workout tracking, local-first storage

## Critical Pitfalls

### 1. Data Entry Friction Kills Adoption

**The pitfall:** Making set logging require too many taps. Every extra tap between "I just finished a set" and "it's recorded" is a reason to go back to Notes.

**Warning signs:**
- Logging a set requires more than 3 taps
- User has to navigate away from current view to log
- Number input requires precise typing on small keyboard
- No defaults or smart suggestions pre-filled

**Prevention:**
- Weight and reps should be pre-filled with last session's values
- +/- stepper buttons (not keyboard) for adjustments
- "Log Set" is one tap after adjusting numbers
- Stay on the same screen after logging — don't navigate away
- Test on actual phone at gym with sweaty hands

**Phase impact:** Phase 1-2 (core logging UI)

### 2. iOS Safari IndexedDB Quotas and Eviction

**The pitfall:** iOS Safari has aggressive storage eviction policies. If the app isn't added to home screen, Safari may purge IndexedDB data after 7 days of non-use. Even as a PWA, storage limits are lower than desktop.

**Warning signs:**
- User loses workout data after not opening app for a week
- Storage silently fails on large datasets

**Prevention:**
- Prompt user to "Add to Home Screen" — PWAs get more persistent storage
- Request persistent storage via `navigator.storage.persist()`
- Keep total data size reasonable (workout data is small — this is unlikely to be an issue)
- Consider periodic JSON export as backup option (V2)

**Phase impact:** Final phase (PWA setup)

### 3. Active Workout State Loss

**The pitfall:** User is mid-workout, phone locks, browser tab gets killed, or they accidentally navigate away. All in-progress sets are lost.

**Warning signs:**
- Workout data only exists in React state
- No persistence until "Finish Workout" is tapped
- Tab reload = lost workout

**Prevention:**
- Persist every set to IndexedDB immediately on logging (not on workout finish)
- Active workout state should be recoverable from DB on app reload
- On app open, check for incomplete workouts and offer to resume
- Never rely solely on in-memory state for workout data

**Phase impact:** Phase 1 (data layer design)

### 4. Exercise Name Inconsistency

**The pitfall:** Freeform exercise names lead to "Bench Press", "bench press", "Bench", "BP", "Flat Bench" all being treated as different exercises. History and charts break.

**Warning signs:**
- Same exercise shows up multiple times in history
- Charts have fragmented data across name variants
- Autocomplete doesn't catch near-matches

**Prevention:**
- Normalize exercise names (trim, consistent casing) on save
- Strong autocomplete that shows existing exercises on first keystroke
- Maybe a "merge exercises" utility later (V2)
- For V1 with single user: autocomplete from history is sufficient

**Phase impact:** Phase 1-2 (data model + exercise entry)

### 5. Volume Comparison is Misleading Without Context

**The pitfall:** Blindly comparing "total volume this workout vs last" can be meaningless or demoralizing. If you did 10 exercises last time and 8 today (less time), volume is down but it's not a failure.

**Warning signs:**
- User feels bad about "volume down 15%" when they just did fewer exercises
- Comparison doesn't account for workout composition changes

**Prevention:**
- Compare per-exercise, not just total workout
- Show exercise-level comparisons prominently (these are always apples-to-apples)
- Total workout comparison should note "you did 2 fewer exercises today"
- Frame wins as "X of Y exercises improved" not just total volume

**Phase impact:** Phase 3-4 (comparison engine + summary)

### 6. Chart Overload on Mobile

**The pitfall:** Desktop-quality charts on a 375px screen are unreadable and slow. Too many data points, too many charts, tiny labels.

**Warning signs:**
- Chart text is unreadable
- Charts take > 500ms to render
- User has to pinch-zoom to read anything
- Scrolling past 5 charts to find useful info

**Prevention:**
- One chart per view, not multiple stacked charts
- Limit data points (last 20 sessions, not all-time by default)
- Large touch targets for chart interaction
- Simple line chart — no stacked bars, no radar charts
- Lazy-load charts (don't render until scrolled into view)

**Phase impact:** Phase 4 (charts)

### 7. PWA Install Prompt Timing

**The pitfall:** Showing "Add to Home Screen" immediately on first visit before the user sees value. They dismiss it and never see it again.

**Warning signs:**
- Install prompt shown on first load
- User dismisses and PWA install becomes buried

**Prevention:**
- Don't show install prompt until after first completed workout
- Or show it subtly on the home screen after a few sessions
- For personal use: just manually add to home screen

**Phase impact:** Final phase (PWA)

### 8. Overengineering the Nudge System

**The pitfall:** Building a complex ML-driven suggestion system when simple rules work perfectly. "Add 1 rep" or "add 5 lbs" covers 90% of useful nudges.

**Warning signs:**
- Spending days on suggestion algorithms before core logging works
- Nudges that are wrong or confusing
- Nudge logic that's hard to debug

**Prevention:**
- Start with dead-simple rules:
  - Hit all target reps? → Suggest +5 lbs next time
  - Missed reps on last set? → Suggest same weight, aim for +1 rep
  - Matched last session? → "Consistent! Try one more rep on set 1"
- Only get smarter if simple rules feel insufficient
- The nudge should be one sentence, not a paragraph

**Phase impact:** Phase 3-4 (nudges)

### 9. Forgetting the "Add Exercise to Workout" Flow

**The pitfall:** Focusing on set logging but making it hard to add a new exercise to an in-progress workout. User has to navigate away, search, add, then navigate back.

**Warning signs:**
- Adding an exercise requires 4+ taps
- User loses context of their workout to add an exercise

**Prevention:**
- "Add Exercise" should be visible on the active workout screen at all times
- Autocomplete dropdown appears inline
- One tap to confirm → new exercise card appears → ready to log sets

**Phase impact:** Phase 2 (active workout UI)

### 10. Not Testing with Real Workout Data Volume

**The pitfall:** App feels fast with 3 workouts but becomes sluggish with 6 months of data (75+ workouts, 500+ exercise entries, 2000+ sets).

**Warning signs:**
- History list takes > 200ms to render
- Exercise detail page loads slowly
- Charts stutter with many data points

**Prevention:**
- Seed test data: 100 workouts, realistic exercise counts
- Index Dexie tables on query-critical fields
- Paginate history list (show last 20, load more on scroll)
- Chart: limit to last 20 data points by default

**Phase impact:** Throughout, but test in Phase 4-5

## Summary: Top 3 to Watch

1. **Data entry speed** — if logging a set isn't 1-3 taps, the app fails
2. **Active workout persistence** — save every set immediately, not on finish
3. **Per-exercise comparison over total** — apples-to-apples wins feel better
