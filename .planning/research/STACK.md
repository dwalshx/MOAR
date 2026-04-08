# Stack Research: Mobile-First Weightlifting Tracker PWA

**Researched:** 2026-04-08
**Domain:** Mobile-first workout tracking, local-first PWA

## Recommended Stack

### Framework: React + Vite

**Choice:** React 19 with Vite 6
**Confidence:** High

**Why React:**
- Massive ecosystem for mobile-first patterns
- Component model maps perfectly to card-based workout UI
- Fast re-renders for real-time set feedback
- PWA support is mature

**Why Vite:**
- Sub-second HMR for rapid development
- Out-of-box PWA plugin (vite-plugin-pwa)
- Simple config, fast builds
- TypeScript support built-in

**What NOT to use:**
- Next.js — SSR/SSG adds complexity for a local-first app with no backend
- Create React App — deprecated, slow
- Angular — overkill for a personal tool
- Svelte — good choice too, but React has more mobile UI component options

### Language: TypeScript

**Confidence:** High

Strong typing for the data model (workouts, exercises, sets) prevents bugs when computing volume, PRs, comparisons. Worth it even for a personal project.

### Styling: Tailwind CSS 4

**Confidence:** High

**Why:**
- Utility-first is fast for mobile layouts
- No context-switching between files
- Excellent responsive design primitives
- Dark mode support built-in

**What NOT to use:**
- CSS Modules — slower iteration for rapid prototyping
- Styled Components — runtime overhead on mobile
- Material UI / Chakra — too opinionated, heavy bundle for a simple app

### Local Storage: Dexie.js (IndexedDB wrapper)

**Confidence:** High

**Why Dexie:**
- Promise-based API over raw IndexedDB
- Schema versioning and migrations built-in
- Excellent query performance for workout history
- ~15KB gzipped
- Future sync capability (Dexie Cloud) if cloud sync is added later

**What NOT to use:**
- Raw IndexedDB — painful API, error-prone
- localStorage — 5MB limit, no structured queries, blocking API
- SQLite (wa-sqlite) — overkill, WASM overhead

### Charting: Recharts

**Confidence:** Medium-High

**Why Recharts:**
- Built for React (uses React components)
- Responsive/mobile-friendly
- Simple API for line charts (volume over time)
- Good touch interaction support
- ~45KB gzipped

**Alternatives considered:**
- Chart.js — not React-native, requires wrapper
- Victory — heavier bundle
- Lightweight options (uPlot) — less React integration
- D3 — too low-level for simple line charts

### PWA: vite-plugin-pwa

**Confidence:** High

**Why:**
- Auto-generates service worker and manifest
- Workbox integration for caching strategies
- Offline support out of the box
- Add-to-homescreen support

### State Management: React useState/useReducer + Context

**Confidence:** High

**Why:**
- Active workout state is localized (one screen)
- No global state complexity needed
- useReducer perfect for workout actions (add set, update reps, etc.)
- Dexie handles persistence — React handles UI state

**What NOT to use:**
- Redux — massive overkill
- Zustand — nice but unnecessary for this scope
- Jotai/Recoil — atomic state not needed here

### Routing: React Router 7

**Confidence:** High

Simple client-side routing for: home, active workout, exercise detail, history.

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

**Total runtime bundle estimate:** ~90KB gzipped (excellent for mobile)

## Build Order Implications

1. Vite + React + TypeScript scaffold first
2. Tailwind CSS for styling
3. Dexie.js data layer (models, CRUD)
4. React Router for navigation
5. Core UI components (workout cards, set entry)
6. Recharts for visualization (can come later)
7. PWA config last (service worker, manifest)
