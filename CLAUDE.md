<!-- GSD:project-start source:PROJECT.md -->
## Project

**MOAR**

A mobile-first web app for tracking weightlifting workouts that makes progress feel obvious and motivating. Log exercises, sets, reps, and weight with minimal friction, get instant micro-feedback on every set, and see volume trends over time. Built for personal use — one lifter who wants logging to be faster than Notes and progress to be as compelling as Minecraft.

**Core Value:** Every set logged gives immediate feedback, and every workout shows visible progress — the app makes "just a little more" feel achievable and rewarding.

### Constraints

- **Platform**: Mobile-first web app (PWA-capable), must work on iPhone Safari
- **Storage**: Local only (IndexedDB/localStorage) — no backend for V1
- **Build speed**: MVP needed today for real gym testing
- **Single user**: No multi-user, no auth, no server
- **UX**: Data entry must be faster than typing into Notes app
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Framework: React + Vite
- Massive ecosystem for mobile-first patterns
- Component model maps perfectly to card-based workout UI
- Fast re-renders for real-time set feedback
- PWA support is mature
- Sub-second HMR for rapid development
- Out-of-box PWA plugin (vite-plugin-pwa)
- Simple config, fast builds
- TypeScript support built-in
- Next.js — SSR/SSG adds complexity for a local-first app with no backend
- Create React App — deprecated, slow
- Angular — overkill for a personal tool
- Svelte — good choice too, but React has more mobile UI component options
### Language: TypeScript
### Styling: Tailwind CSS 4
- Utility-first is fast for mobile layouts
- No context-switching between files
- Excellent responsive design primitives
- Dark mode support built-in
- CSS Modules — slower iteration for rapid prototyping
- Styled Components — runtime overhead on mobile
- Material UI / Chakra — too opinionated, heavy bundle for a simple app
### Local Storage: Dexie.js (IndexedDB wrapper)
- Promise-based API over raw IndexedDB
- Schema versioning and migrations built-in
- Excellent query performance for workout history
- ~15KB gzipped
- Future sync capability (Dexie Cloud) if cloud sync is added later
- Raw IndexedDB — painful API, error-prone
- localStorage — 5MB limit, no structured queries, blocking API
- SQLite (wa-sqlite) — overkill, WASM overhead
### Charting: Recharts
- Built for React (uses React components)
- Responsive/mobile-friendly
- Simple API for line charts (volume over time)
- Good touch interaction support
- ~45KB gzipped
- Chart.js — not React-native, requires wrapper
- Victory — heavier bundle
- Lightweight options (uPlot) — less React integration
- D3 — too low-level for simple line charts
### PWA: vite-plugin-pwa
- Auto-generates service worker and manifest
- Workbox integration for caching strategies
- Offline support out of the box
- Add-to-homescreen support
### State Management: React useState/useReducer + Context
- Active workout state is localized (one screen)
- No global state complexity needed
- useReducer perfect for workout actions (add set, update reps, etc.)
- Dexie handles persistence — React handles UI state
- Redux — massive overkill
- Zustand — nice but unnecessary for this scope
- Jotai/Recoil — atomic state not needed here
### Routing: React Router 7
### Build/Dev Tools
- **Package manager:** npm (simplest)
- **Linting:** ESLint + Prettier (standard)
- **Testing:** Vitest (if needed later)
## Version Summary
| Tool | Version | Size (gzip) |
|------|---------|-------------|
| React | 19.x | ~6KB |
| Vite | 6.x | dev tool |
| TypeScript | 5.x | dev tool |
| Tailwind CSS | 4.x | ~10KB |
| Dexie.js | 4.x | ~15KB |
| Recharts | 2.x | ~45KB |
| React Router | 7.x | ~15KB |
| vite-plugin-pwa | 0.21.x | dev tool |
## Build Order Implications
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
