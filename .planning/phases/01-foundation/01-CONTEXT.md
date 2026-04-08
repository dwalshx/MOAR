# Phase 1: Foundation - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the MOAR app: Vite + React + TypeScript project, Dexie.js database schema, Tailwind CSS styling, React Router navigation shell, and mobile-first layout. The result is a working app skeleton that loads on a phone with the data layer ready for Phase 2 (Core Logging).

</domain>

<decisions>
## Implementation Decisions

### Visual Style
- **D-01:** Dark theme as default — reduces eye strain at the gym, high contrast for sweaty-screen readability
- **D-02:** Bold accent color (orange or green) for action buttons and feedback badges — needs to pop on dark background
- **D-03:** Clean, minimal aesthetic — no decorative elements, every pixel serves a function

### Navigation Pattern
- **D-04:** Bottom tab bar for primary navigation — standard mobile pattern, thumb-reachable
- **D-05:** Tabs: Home, Active Workout (if in progress), History
- **D-06:** Exercise Detail accessed by tapping into an exercise (push navigation, not a tab)

### Data Units
- **D-07:** Pounds (lbs) only for V1 — personal app, US-based user. Kg toggle deferred.

### Number Entry UX
- **D-08:** Weight steppers: +/- 5 lb increments per tap, long-press for +/- 1 lb fine-tuning
- **D-09:** Rep steppers: +/- 1 increment per tap
- **D-10:** Pre-filled values from last session shown as the starting point (implemented in Phase 2, but data model must support this)

### Claude's Discretion
- Specific color palette values (hex codes) — choose something that looks good on dark backgrounds
- Font choice — system fonts or a clean sans-serif
- Animation/transition approach — keep it minimal and performant
- Folder structure and component organization
- Tailwind configuration details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in:
- `.planning/PROJECT.md` — Project vision, core value, constraints
- `.planning/REQUIREMENTS.md` — PLT-01 (mobile-first), PLT-02 (IndexedDB local storage)
- `.planning/research/STACK.md` — Technology stack decisions and rationale
- `.planning/research/ARCHITECTURE.md` — Data model, component architecture, build order
- `.planning/research/PITFALLS.md` — iOS Safari IndexedDB gotchas, active workout state persistence

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — this phase ESTABLISHES the patterns other phases follow

### Integration Points
- Dexie schema must support all entities defined in ARCHITECTURE.md research
- Navigation shell must have routes for: Home (/), Active Workout (/workout/:id), Exercise Detail (/exercise/:name), History (/history)
- Layout must accommodate bottom tab bar with safe area insets for iPhone

</code_context>

<specifics>
## Specific Ideas

- "Minecraft compulsion loop" is the UX north star — the foundation should feel fast and responsive
- App must work on iPhone Safari — test with mobile viewport
- Dark theme with punchy accent colors — think "gym energy" not "corporate dashboard"
- Touch targets must be 44px+ minimum (Apple HIG standard)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-08*
