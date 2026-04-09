# MOAR

## What This Is

A mobile-first web app for tracking weightlifting workouts that makes progress feel obvious and motivating. Log exercises, sets, reps, and weight with minimal friction, get instant micro-feedback on every set, and see volume trends over time. Built for personal use — one lifter who wants logging to be faster than Notes and progress to be as compelling as Minecraft.

## Core Value

Every set logged gives immediate feedback, and every workout shows visible progress — the app makes "just a little more" feel achievable and rewarding.

## Requirements

### Validated

- ✓ Mobile-first responsive design (works on iPhone Safari) — Phase 1
- ✓ Local storage with IndexedDB (works offline) — Phase 1
- ✓ Fast workout logging (weight + reps per set, jump between exercises freely) — Phase 2
- ✓ Card-based active workout screen for non-linear exercise flow — Phase 2
- ✓ Silent timestamping of every set for future rest/order analysis — Phase 2

### Active

- [ ] Fast workout logging (weight + reps per set, jump between exercises freely)
- [ ] Named workout templates that auto-populate from last session's numbers
- [ ] "Repeat last workout" as the primary starting flow
- [ ] Freeform exercise entry with autocomplete from history
- [ ] Card-based active workout screen for non-linear exercise flow
- [ ] Per-set micro-feedback badges (PR, +1, matched, volume up, comeback)
- [ ] Silent timestamping of every set for future rest/order analysis
- [ ] Post-workout summary (volume comparison, win count, highlights)
- [ ] Per-exercise history and volume-over-time chart
- [ ] Total workout volume-over-time chart
- [ ] Workout history list (date, name, total volume)
- [ ] Progressive overload nudges (suggest +1 rep or +5 lbs based on last session)
- [ ] Living templates that update as workouts are modified
- [ ] Local storage (IndexedDB) — works offline, no auth needed

### Out of Scope

- Cloud sync / backend — adds auth, API, hosting complexity for personal MVP
- LLM insights / natural language Q&A — V2 feature, needs cloud first
- Rest timer UI — passive timestamps capture this data without user effort
- Exercise library / database — freeform entry is sufficient for personal use
- Accounts / authentication — single user, local storage
- Social features / sharing — personal tool
- Rigid workout programming / plans — living templates over locked plans

## Context

- User lifts 3x/week, full body, 8-12 exercises per session
- User does informal supersets (e.g., deadlift + abs during rest) — must jump between exercises freely
- Workout count/complexity varies by available time and energy
- App will be tested at the gym within hours of initial build — must work on mobile Safari/Chrome
- "Minecraft compulsion loop" is the UX north star: see goal → take action → see result → see next goal
- ChatGPT analysis identified the sweet spot: "frictionless logging + visible progress + gentle intelligence"
- The hard part is making logging feel so smooth that using the app is easier than Notes or a spreadsheet

## Constraints

- **Platform**: Mobile-first web app (PWA-capable), must work on iPhone Safari
- **Storage**: Local only (IndexedDB/localStorage) — no backend for V1
- **Build speed**: MVP needed today for real gym testing
- **Single user**: No multi-user, no auth, no server
- **UX**: Data entry must be faster than typing into Notes app

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local storage over cloud sync | Eliminates auth/API/hosting complexity; works offline at gym; can migrate later | — Pending |
| Mobile web app over native | Fast to build and test; no App Store submission; can wrap with Capacitor later | — Pending |
| Freeform exercise entry over library | Faster for personal use; autocomplete from history covers repeat exercises | — Pending |
| Card-based workout UI over linear list | Supports jumping between exercises (informal supersets) | — Pending |
| Passive timestamps over rest timer | Captures rest data without adding friction; can derive insights later | — Pending |
| Living templates over rigid plans | Matches variable workout behavior (8-12 exercises depending on time/energy) | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after Phase 2 completion*
