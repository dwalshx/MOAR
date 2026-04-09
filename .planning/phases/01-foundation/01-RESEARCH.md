# Phase 1: Foundation - Research

**Researched:** 2026-04-08
**Domain:** Vite + React + TypeScript scaffolding, Dexie.js schema, Tailwind CSS 4, React Router 7, mobile-first layout
**Confidence:** HIGH

## Summary

This phase scaffolds a greenfield Vite + React + TypeScript project with Tailwind CSS 4 for styling, Dexie.js 4 for IndexedDB persistence, and React Router 7 for navigation. The result is a working app skeleton with a dark-themed mobile-first layout, bottom tab navigation, and a fully defined data layer ready for Phase 2 (Core Logging).

All stack choices are locked decisions from prior research. Tailwind CSS 4 has a significantly simplified setup compared to v3 (no PostCSS, no tailwind.config.js -- just a Vite plugin and one CSS import). React Router 7 in declarative mode provides simple JSX-based routing without framework overhead. Dexie.js 4 with dexie-react-hooks provides reactive queries via `useLiveQuery`.

**Primary recommendation:** Scaffold with `npm create vite@latest -- --template react-ts`, add Tailwind via `@tailwindcss/vite` plugin, set up Dexie database class with full schema from ARCHITECTURE.md, and build a layout shell with bottom tab bar and safe area insets.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dark theme as default -- reduces eye strain at the gym, high contrast for sweaty-screen readability
- **D-02:** Bold accent color (orange or green) for action buttons and feedback badges -- needs to pop on dark background
- **D-03:** Clean, minimal aesthetic -- no decorative elements, every pixel serves a function
- **D-04:** Bottom tab bar for primary navigation -- standard mobile pattern, thumb-reachable
- **D-05:** Tabs: Home, Active Workout (if in progress), History
- **D-06:** Exercise Detail accessed by tapping into an exercise (push navigation, not a tab)
- **D-07:** Pounds (lbs) only for V1 -- personal app, US-based user. Kg toggle deferred.
- **D-08:** Weight steppers: +/- 5 lb increments per tap, long-press for +/- 1 lb fine-tuning
- **D-09:** Rep steppers: +/- 1 increment per tap
- **D-10:** Pre-filled values from last session shown as the starting point (implemented in Phase 2, but data model must support this)

### Claude's Discretion
- Specific color palette values (hex codes) -- choose something that looks good on dark backgrounds
- Font choice -- system fonts or a clean sans-serif
- Animation/transition approach -- keep it minimal and performant
- Folder structure and component organization
- Tailwind configuration details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLT-01 | Mobile-first responsive design (works on iPhone Safari) | Tailwind CSS 4 responsive utilities, safe area insets via `env()`, viewport meta tag with `viewport-fit=cover`, 44px minimum touch targets |
| PLT-02 | Local storage with IndexedDB (works offline) | Dexie.js 4 with typed schema, `useLiveQuery` for reactive reads, immediate per-set persistence pattern from ARCHITECTURE.md |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.5 | UI framework | Locked decision, component model maps to card-based workout UI |
| React DOM | 19.2.5 | React renderer | Required by React |
| Vite | 8.0.7 | Build tool / dev server | Locked decision, sub-second HMR, PWA plugin ecosystem |
| TypeScript | 6.0.2 | Type safety | Locked decision, prevents data model bugs |
| Tailwind CSS | 4.2.2 | Utility-first styling | Locked decision, dark mode built-in, responsive primitives |
| @tailwindcss/vite | 4.2.2 | Tailwind Vite integration | Official Vite plugin, replaces PostCSS setup from v3 |
| Dexie.js | 4.4.2 | IndexedDB wrapper | Locked decision, schema versioning, reactive queries |
| dexie-react-hooks | 4.4.0 | React bindings for Dexie | Provides `useLiveQuery` for reactive data in components |
| React Router | 7.14.0 | Client-side routing | Locked decision, declarative mode for simple SPA routing |

### Supporting (not needed this phase but noted for awareness)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Recharts | 2.x | Volume charts | Phase 5 (History & Charts) |
| vite-plugin-pwa | 0.21.x | PWA service worker | Phase 6 (PWA Polish) |

**Installation:**
```bash
npm create vite@latest moar -- --template react-ts
cd moar
npm install
npm install dexie dexie-react-hooks react-router
npm install -D tailwindcss @tailwindcss/vite
```

**Version verification (confirmed 2026-04-08):**
- react: 19.2.5, react-dom: 19.2.5
- vite: 8.0.7
- typescript: 6.0.2
- tailwindcss: 4.2.2, @tailwindcss/vite: 4.2.2
- dexie: 4.4.2, dexie-react-hooks: 4.4.0
- react-router: 7.14.0

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    layout/
      AppLayout.tsx        # Main layout with bottom tab bar + Outlet
      BottomNav.tsx         # Tab bar component (Home, Workout, History)
    ui/                     # Reusable UI primitives (Button, Card, etc.)
  pages/
    HomePage.tsx            # Landing page - recent workouts, start workout
    WorkoutPage.tsx         # Active workout (placeholder for Phase 2)
    HistoryPage.tsx         # Workout history (placeholder for Phase 5)
    ExerciseDetailPage.tsx  # Exercise drill-down (placeholder for Phase 5)
  db/
    database.ts             # Dexie database class + schema definition
    models.ts               # TypeScript interfaces for all entities
  App.tsx                   # Router setup + AppLayout
  main.tsx                  # Entry point
  index.css                 # Tailwind import + dark theme + safe area styles
```

### Pattern 1: Dexie Database Class with TypeScript
**What:** Single database module exporting typed Dexie instance
**When to use:** Always -- this is the data layer foundation

```typescript
// Source: https://dexie.org/docs/Typescript
import Dexie, { type Table } from 'dexie';

export interface Workout {
  id?: string;
  name: string;
  templateId?: string;
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface WorkoutExercise {
  id?: string;
  workoutId: string;
  exerciseName: string;
  order: number;
}

export interface WorkoutSet {
  id?: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;      // lbs only (D-07)
  reps: number;
  timestamp: Date;
}

export interface WorkoutTemplate {
  id?: string;
  name: string;
  lastUsed: Date;
  exercises: string[];
}

export class MoarDatabase extends Dexie {
  workouts!: Table<Workout>;
  workoutExercises!: Table<WorkoutExercise>;
  workoutSets!: Table<WorkoutSet>;
  workoutTemplates!: Table<WorkoutTemplate>;

  constructor() {
    super('moar');
    this.version(1).stores({
      workouts: '++id, name, startedAt, templateId, completedAt',
      workoutExercises: '++id, workoutId, exerciseName, [workoutId+order]',
      workoutSets: '++id, workoutExerciseId, timestamp',
      workoutTemplates: '++id, name, lastUsed'
    });
  }
}

export const db = new MoarDatabase();
```

### Pattern 2: Tailwind CSS 4 Setup (No Config File)
**What:** Vite plugin + single CSS import -- no tailwind.config.js needed
**When to use:** Always for Tailwind v4

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});
```

```css
/* src/index.css */
@import "tailwindcss";

/* Dark mode by default using class strategy */
@custom-variant dark (&:where(.dark, .dark *));

/* Custom theme tokens */
@theme {
  --color-bg-primary: #0f0f0f;
  --color-bg-secondary: #1a1a1a;
  --color-bg-card: #242424;
  --color-accent: #f97316;        /* orange-500 -- gym energy */
  --color-accent-hover: #ea580c;  /* orange-600 */
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a3a3a3;
  --color-success: #22c55e;       /* green-500 for positive feedback */
  --color-border: #333333;
}
```

### Pattern 3: React Router 7 Declarative Mode with Layout
**What:** BrowserRouter with nested layout route for bottom tab bar
**When to use:** This app -- simple SPA, no data loaders needed

```typescript
// Source: https://reactrouter.com/start/declarative/routing
import { BrowserRouter, Routes, Route } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import WorkoutPage from './pages/WorkoutPage';
import HistoryPage from './pages/HistoryPage';
import ExerciseDetailPage from './pages/ExerciseDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="workout/:id" element={<WorkoutPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="exercise/:name" element={<ExerciseDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### Pattern 4: Mobile-First Layout with Safe Area Insets
**What:** Full-height layout with safe area padding for iPhone notch/home bar
**When to use:** Required for PLT-01 (iPhone Safari support)

```html
<!-- index.html: viewport meta must include viewport-fit=cover -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

```typescript
// AppLayout.tsx
import { Outlet } from 'react-router';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="dark flex flex-col h-dvh bg-bg-primary text-text-primary">
      {/* Safe area for top notch */}
      <div className="pt-[env(safe-area-inset-top)]" />

      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto px-4">
        <Outlet />
      </main>

      {/* Bottom nav with safe area for home indicator */}
      <BottomNav />
    </div>
  );
}
```

```typescript
// BottomNav.tsx
import { NavLink } from 'react-router';

export default function BottomNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-xs ${
      isActive ? 'text-accent' : 'text-text-secondary'
    }`;

  return (
    <nav className="flex justify-around items-center border-t border-border bg-bg-secondary pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/" className={linkClass}>Home</NavLink>
      <NavLink to="/history" className={linkClass}>History</NavLink>
    </nav>
  );
}
```

### Anti-Patterns to Avoid
- **Using tailwind.config.js with v4:** Tailwind 4 is CSS-first. Configuration goes in the CSS file via `@theme` and `@custom-variant`, not a JS config file.
- **Using createBrowserRouter for this project:** The declarative `<BrowserRouter>` mode is simpler and sufficient. No data loaders or actions needed.
- **Storing workout state only in React state:** Every set must persist to Dexie immediately (PITFALLS.md #3). Never buffer until "finish workout."
- **Using `100vh` for mobile height:** Use `h-dvh` (dynamic viewport height) which accounts for mobile browser chrome. `100vh` causes overflow on iOS Safari.
- **Importing from "react-router-dom":** In React Router 7, import from `"react-router"` directly. The `react-router-dom` package still works but `react-router` is the canonical import.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB CRUD | Raw IndexedDB transactions | Dexie.js | Painful async API, no schema versioning, cursor-based iteration |
| Reactive DB queries | Manual subscription/polling | `useLiveQuery` from dexie-react-hooks | Auto-rerenders on data change, cross-tab sync |
| CSS utility framework | Custom CSS classes | Tailwind CSS 4 | Responsive, dark mode, consistent spacing out of the box |
| Client routing | Hash-based or manual history | React Router 7 | Declarative routes, nested layouts, active link states |
| Safe area handling | Manual pixel offsets | `env(safe-area-inset-*)` CSS | OS-provided values, future-proof across devices |
| UUID generation | Custom random string | `crypto.randomUUID()` | Built into all modern browsers, cryptographically random |

**Key insight:** This phase is pure scaffolding. Every "build" decision should use the standard library/framework approach. Custom solutions introduce bugs that compound in later phases.

## Common Pitfalls

### Pitfall 1: Tailwind v4 Config Confusion
**What goes wrong:** Developers create a `tailwind.config.js` file like they did in v3. It does nothing in v4.
**Why it happens:** Most tutorials and training data reference Tailwind v3 patterns.
**How to avoid:** Use only `@tailwindcss/vite` plugin + `@import "tailwindcss"` in CSS. All customization via `@theme` directive in CSS.
**Warning signs:** `tailwind.config.js` or `tailwind.config.ts` files in the project root.

### Pitfall 2: iOS Safari 100vh Bug
**What goes wrong:** `height: 100vh` causes the page to extend behind the Safari address bar, making the bottom tab bar unreachable.
**Why it happens:** `100vh` in iOS Safari equals the full viewport including browser chrome, not the visible area.
**How to avoid:** Use `h-dvh` (Tailwind's `dynamic viewport height`) which maps to `height: 100dvh`. This correctly accounts for the browser chrome.
**Warning signs:** Bottom navigation hidden behind Safari's address bar on iPhone.

### Pitfall 3: Missing viewport-fit=cover
**What goes wrong:** `env(safe-area-inset-*)` values return 0 on all devices, so the bottom tab bar sits behind the iPhone home indicator.
**Why it happens:** Safe area insets only activate when `viewport-fit=cover` is set in the viewport meta tag.
**How to avoid:** Always include `viewport-fit=cover` in the viewport meta tag in `index.html`.
**Warning signs:** No padding at bottom of nav bar on devices with home indicators.

### Pitfall 4: Dexie Auto-Increment with String IDs
**What goes wrong:** Using `++id` (auto-increment) when the architecture calls for string UUIDs, or vice versa.
**Why it happens:** ARCHITECTURE.md shows `id: string` but Dexie's `++id` generates numeric IDs.
**How to avoid:** Use `++id` for auto-increment numbers (simpler, recommended). If UUIDs are needed, omit `++` and generate IDs manually with `crypto.randomUUID()`. For this project, auto-increment numeric IDs are fine -- the architecture's `string` type was aspirational, not a hard requirement.
**Warning signs:** Type mismatch errors when querying by ID.

### Pitfall 5: React Router Import Path
**What goes wrong:** Importing from `react-router-dom` instead of `react-router` in v7.
**Why it happens:** Every React Router tutorial before v7 used `react-router-dom`.
**How to avoid:** Install `react-router` (not `react-router-dom`). Import everything from `"react-router"`.
**Warning signs:** `react-router-dom` in package.json, import statements referencing it.

### Pitfall 6: Dark Theme Not Applied
**What goes wrong:** The `dark:` variant classes don't apply.
**Why it happens:** Tailwind v4 uses `prefers-color-scheme` by default. To force dark theme via class, you need `@custom-variant dark (&:where(.dark, .dark *))` in your CSS, AND the `dark` class on a parent element.
**How to avoid:** Add `@custom-variant dark` to index.css, put `className="dark"` on the root layout div.
**Warning signs:** App appears in light mode despite dark: classes being used.

## Code Examples

### Scaffold Command
```bash
npm create vite@latest moar -- --template react-ts
cd moar
npm install dexie dexie-react-hooks react-router
npm install -D tailwindcss @tailwindcss/vite
```

### Using useLiveQuery for Reactive Data
```typescript
// Source: https://dexie.org/docs/dexie-react-hooks/useLiveQuery()
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

function RecentWorkouts() {
  const workouts = useLiveQuery(
    () => db.workouts
      .orderBy('startedAt')
      .reverse()
      .limit(10)
      .toArray()
  );

  if (!workouts) return <div>Loading...</div>;

  return (
    <ul>
      {workouts.map(w => (
        <li key={w.id}>{w.name} - {w.startedAt.toLocaleDateString()}</li>
      ))}
    </ul>
  );
}
```

### Touch Target Sizing (44px Minimum per Apple HIG)
```typescript
// All interactive elements must meet 44px minimum touch target
<button className="min-h-[44px] min-w-[44px] flex items-center justify-center
  bg-accent text-white rounded-lg font-semibold text-lg
  active:bg-accent-hover transition-colors">
  Log Set
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js + PostCSS | @tailwindcss/vite plugin + CSS @theme | Tailwind v4 (Jan 2025) | No config file, CSS-first |
| react-router-dom package | react-router package | React Router v7 (2024) | Single package, simpler imports |
| height: 100vh on mobile | height: 100dvh (h-dvh) | All modern browsers (2023+) | Fixes iOS Safari viewport bug |
| Dexie v3 Table types | Dexie v4 Table generic | Dexie v4 (2024) | Cleaner TypeScript integration |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tooling | Yes | 22.18.0 | -- |
| npm | Package management | Yes | 10.9.3 | -- |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

All external dependencies are npm packages installed into the project. No databases, Docker, or external services required.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (not yet installed -- Wave 0 gap) |
| Config file | None -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLT-01 | Mobile-first layout renders with correct viewport meta, safe area classes present | smoke (manual) | Manual: open in mobile Safari or Chrome DevTools mobile mode | N/A |
| PLT-02 | Dexie database initializes, tables exist, basic CRUD works | unit | `npx vitest run src/db/__tests__/database.test.ts -t "database"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Install vitest: `npm install -D vitest`
- [ ] `src/db/__tests__/database.test.ts` -- covers PLT-02 (Dexie schema creates correctly, basic CRUD)
- [ ] `vitest.config.ts` or vitest config in `vite.config.ts` -- framework setup

## Open Questions

1. **Dexie ID type: auto-increment number vs. UUID string**
   - What we know: ARCHITECTURE.md shows `id: string` (UUID), but Dexie's `++id` generates numbers. Both work.
   - What's unclear: Whether downstream phases (sync, export) benefit from UUIDs.
   - Recommendation: Use `++id` (auto-increment numbers) for simplicity. V1 is single-device, no sync. Migration to UUIDs later is straightforward if needed for Dexie Cloud.

2. **Active Workout tab visibility**
   - What we know: D-05 says tabs include "Active Workout (if in progress)." This implies the tab is conditionally shown.
   - What's unclear: Whether the tab should appear/disappear dynamically or always be present.
   - Recommendation: In Phase 1, show a static 2-tab bar (Home, History). Add the conditional "Workout" tab in Phase 2 when active workout state exists, since it needs `useLiveQuery` to check for in-progress workouts.

## Sources

### Primary (HIGH confidence)
- npm registry -- verified all package versions via `npm view` (2026-04-08)
- [Tailwind CSS v4 Vite installation docs](https://tailwindcss.com/docs) -- @tailwindcss/vite plugin setup
- [Tailwind CSS v4 dark mode docs](https://tailwindcss.com/docs/dark-mode) -- @custom-variant dark pattern
- [React Router 7 declarative routing docs](https://reactrouter.com/start/declarative/routing) -- BrowserRouter, Routes, nested layout
- [Dexie.js TypeScript docs](https://dexie.org/docs/Typescript) -- database class pattern
- [Dexie.js useLiveQuery docs](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) -- reactive hook usage

### Secondary (MEDIUM confidence)
- [MDN env() CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) -- safe-area-inset documentation
- [CSS-Tricks env()](https://css-tricks.com/almanac/functions/e/env/) -- safe area inset patterns

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry, all docs confirmed current
- Architecture: HIGH -- patterns taken directly from official documentation for each library
- Pitfalls: HIGH -- iOS Safari viewport issues and Tailwind v4 migration gotchas are well-documented

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable stack, 30-day validity)
