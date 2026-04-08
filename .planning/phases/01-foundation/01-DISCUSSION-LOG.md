# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 1-Foundation
**Areas discussed:** Visual Style, Navigation Pattern, Data Units, Number Entry UX
**Mode:** Auto (--auto flag, all recommended defaults selected)

---

## Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Dark theme with bold accent | Reduces eye strain at gym, high contrast | ✓ |
| Light theme | Standard, but glare in gyms | |
| System preference toggle | Adapts to OS setting | |

**User's choice:** [auto] Dark theme with bold accent color (recommended default)
**Notes:** Gym environment favors dark theme — less screen glare, better contrast with sweaty fingers

---

## Navigation Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom tab bar | Standard mobile, thumb-reachable | ✓ |
| Hamburger menu | Saves space, hides nav | |
| Top tabs | Android pattern, less iOS-native | |

**User's choice:** [auto] Bottom tab bar (recommended default)
**Notes:** Most natural for a 3-4 destination mobile app on iPhone

---

## Data Units

| Option | Description | Selected |
|--------|-------------|----------|
| Pounds only | Simplest, US user | ✓ |
| Kilograms only | Metric standard | |
| Both with toggle | More flexible, more complexity | |

**User's choice:** [auto] Pounds only for V1 (recommended default)
**Notes:** Personal app for US-based user. Kg support deferred.

---

## Number Entry UX

| Option | Description | Selected |
|--------|-------------|----------|
| +/- 5lb weight, +/- 1 rep | Covers 90% of adjustments | ✓ |
| +/- 10lb weight, +/- 1 rep | Faster for big changes, less precise | |
| Free-form keyboard only | Maximum flexibility, more taps | |

**User's choice:** [auto] Weight +/- 5lb (long-press for 1lb), Reps +/- 1 (recommended default)
**Notes:** Long-press for fine-tuning covers edge cases without cluttering the UI

---

## Claude's Discretion

- Color palette hex values
- Font choice (system fonts vs web fonts)
- Animation/transition approach
- Folder structure and component organization
- Tailwind configuration specifics

## Deferred Ideas

None
