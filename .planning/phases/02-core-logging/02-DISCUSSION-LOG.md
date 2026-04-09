# Phase 2: Core Logging - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 2-Core Logging
**Areas discussed:** Exercise Card Layout, Set Entry Interaction, Workout Start Flow, Edit/Delete UX
**Mode:** Auto (--auto flag, all recommended defaults selected)

---

## Exercise Card Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Compact cards, tap to expand | Dashboard feel, accordion pattern | ✓ |
| Full-size cards with inline entry | All exercises visible but long scroll | |
| Tabbed exercise view | One exercise at a time, swipe between | |

**User's choice:** [auto] Compact cards with tap-to-expand accordion (recommended default)
**Notes:** Supports jumping between exercises freely while keeping screen focused

---

## Set Entry Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in expanded card | Weight/reps steppers + Log Set button, stays expanded | ✓ |
| Modal overlay | Pops up over card | |
| Bottom sheet | Slides up from bottom | |

**User's choice:** [auto] Inline within expanded card (recommended default)
**Notes:** No navigation away from workout view. Card stays expanded for rapid multi-set logging.

---

## Workout Start Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Start empty, add exercises | Simple button, auto-name, add as you go | ✓ |
| Pick from exercise list first | Select exercises then start | |
| Start from template | Repeat last or named (Phase 3 feature) | |

**User's choice:** [auto] Start empty workout, add exercises as you go (recommended default)
**Notes:** Templates deferred to Phase 3. Simplest path for Phase 2.

---

## Edit/Delete UX

| Option | Description | Selected |
|--------|-------------|----------|
| Tap to edit, swipe to delete | Standard mobile patterns | ✓ |
| Long-press context menu | Hidden affordance | |
| Edit button per set row | More visible but cluttered | |

**User's choice:** [auto] Tap to edit inline, swipe left to delete (recommended default)
**Notes:** Inline confirmation for delete (not modal)

---

## Claude's Discretion

- Card expand/collapse animation details
- Exercise input styling
- Autocomplete dropdown positioning
- Set row layout within cards
- Long exercise name handling

## Deferred Ideas

None
