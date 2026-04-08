# Features Research: Weightlifting Tracker Apps

**Researched:** 2026-04-08
**Domain:** Workout tracking, progressive overload, fitness logging

## Table Stakes (Must Have)

These features are expected by anyone using a workout tracker. Without them, users go back to Notes.

### Workout Logging
- **Log sets with weight + reps** — the absolute core action (Complexity: Low)
- **Edit/delete sets** — fix mistakes without friction (Complexity: Low)
- **Date-stamped workouts** — automatic, not manual date entry (Complexity: Low)
- **Exercise names** — freeform or from library (Complexity: Low)

### Workout History
- **View past workouts** — list by date (Complexity: Low)
- **View exercise history** — all sessions for a given exercise (Complexity: Low)
- **See last session's numbers** — "what did I do last time?" (Complexity: Low)

### Templates/Routines
- **Repeat last workout** — fastest path to logging (Complexity: Medium)
- **Named workouts** — "Full Body A", "Push Day" (Complexity: Low)
- **Pre-populated sets from last session** — show what to beat (Complexity: Medium)

### Mobile UX
- **Large tap targets** — usable with sweaty hands at gym (Complexity: Low)
- **Fast number entry** — weight and reps in minimal taps (Complexity: Medium)
- **Works offline** — gyms have bad wifi (Complexity: Medium)

## Differentiators (MOAR's Unique Value)

These are what make MOAR different from a spreadsheet or basic logger.

### Per-Set Micro-Feedback
- **Instant badges on every set** — PR, +1, matched, volume up, comeback (Complexity: Medium)
- **"Beat your last" target display** — show what to aim for before logging (Complexity: Medium)
- **Micro-celebrations** — subtle visual cues, not annoying popups (Complexity: Low)

Dependencies: Requires exercise history comparison engine

### Progressive Overload Nudges
- **Suggest +1 rep or +5 lbs** — concrete, achievable next target (Complexity: Medium)
- **Volume PR proximity** — "you're within 2 reps of a volume PR" (Complexity: Medium)
- **Adaptive nudge tone** — "push for more" vs "matching is a win today" (Complexity: High — V2)

Dependencies: Requires volume calculation engine and history

### Volume Visualization
- **Per-exercise volume chart** — line chart over time (Complexity: Medium)
- **Total workout volume chart** — aggregate trend (Complexity: Medium)
- **Session comparison** — this workout vs last (Complexity: Low)

Dependencies: Requires charting library and sufficient history data

### Post-Workout Summary
- **Volume comparison to last session** — percentage up/down (Complexity: Low)
- **Win count** — how many exercises improved (Complexity: Low)
- **Highlights** — best sets, PRs hit (Complexity: Medium)

Dependencies: Requires comparison engine

### Non-Linear Workout Flow
- **Card-based exercise view** — jump between exercises freely (Complexity: Medium)
- **No forced order** — supports informal supersets (Complexity: Low — it's about NOT enforcing order)

### Passive Data Collection
- **Silent timestamps on every set** — rest time derivation (Complexity: Low)
- **Exercise order tracking** — for future pattern analysis (Complexity: Low)

## Anti-Features (Deliberately NOT Building)

| Anti-Feature | Why Not |
|---|---|
| Social/leaderboards | Adds comparison anxiety; personal tool |
| AI workout programming | "Do just a little more" is the only program needed for V1 |
| Body measurements/photos | Different domain; adds clutter |
| Calorie/nutrition tracking | Completely different product |
| Complex periodization | Over-engineering for a 3x/week lifter |
| Exercise video tutorials | Content maintenance burden; user knows their exercises |
| Rest timer with alarm | Passive timestamps capture this data without friction |
| Mandatory exercise library | Freeform entry is faster for personal use |
| Workout sharing/export | No audience for V1 |
| Achievement badges/gamification | Can feel patronizing; the volume chart IS the gamification |

## Feature Dependencies

```
Workout Logging (core)
  → Exercise History
    → Comparison Engine
      → Micro-Feedback Badges
      → Progressive Overload Nudges
      → Post-Workout Summary
    → Volume Charts
  → Templates/Repeat Last
```

## Complexity Assessment

| Feature Group | Complexity | Phase Suggestion |
|---|---|---|
| Data model + storage | Medium | Phase 1 |
| Basic logging UI | Medium | Phase 1 |
| Templates/repeat last | Medium | Phase 2 |
| Comparison engine | Medium | Phase 3 |
| Micro-feedback | Medium | Phase 3 |
| Nudges | Medium | Phase 3-4 |
| Charts | Medium | Phase 4 |
| Post-workout summary | Low-Medium | Phase 4 |
| PWA/offline | Low | Phase 5 |
