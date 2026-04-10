# Phase 6: PWA Polish - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure the app as a Progressive Web App: web manifest for add-to-home-screen, service worker for offline caching, persistent storage API to prevent iOS Safari data eviction. Final mobile polish.

</domain>

<decisions>
## Implementation Decisions

### App Identity
- **D-01:** App name: "MOAR"
- **D-02:** Short name: "MOAR"
- **D-03:** Theme color: #f97316 (orange accent)
- **D-04:** Background color: #0f0f0f (dark bg)
- **D-05:** Display mode: standalone (no browser chrome)
- **D-06:** Orientation: portrait
- **D-07:** App icon: generate a simple placeholder icon (orange "M" on dark background) — can upgrade later
- **D-08:** Status bar: dark theme (black-translucent on iOS)

### Offline Strategy
- **D-09:** Use vite-plugin-pwa with Workbox for service worker generation
- **D-10:** Cache strategy: cache-first for all app assets (HTML, JS, CSS, images)
- **D-11:** No network-first needed — there is no backend API, all data is local IndexedDB
- **D-12:** Precache all built assets on first load
- **D-13:** Service worker updates: prompt user to reload when new version available

### Storage Persistence
- **D-14:** Call navigator.storage.persist() on app startup
- **D-15:** Don't block on the result — just request it silently
- **D-16:** iOS Safari grants persistence more readily for home-screen PWAs

### Install Prompt
- **D-17:** Don't show install prompt on first visit — let user experience the app first
- **D-18:** After first completed workout, show a subtle banner: "Add MOAR to your home screen for the best experience"
- **D-19:** Dismissible — once dismissed, don't show again (store flag in localStorage)
- **D-20:** On iOS: provide manual instructions ("Tap Share → Add to Home Screen") since iOS doesn't support beforeinstallprompt

### Claude's Discretion
- Exact Workbox configuration details
- Icon generation approach (SVG inline, canvas, or static PNG)
- Service worker registration timing
- PWA manifest start_url value

</decisions>

<canonical_refs>
## Canonical References

- `.planning/REQUIREMENTS.md` — PLT-03 (PWA-capable)
- `.planning/research/STACK.md` — vite-plugin-pwa recommendation
- `.planning/research/PITFALLS.md` — #2 iOS Safari storage eviction, #7 PWA install prompt timing
- `vite.config.ts` — Vite config to add PWA plugin
- `index.html` — Meta tags for PWA (already has viewport-fit=cover)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vite.config.ts` — already configured with React + Tailwind plugins, add PWA plugin here
- `index.html` — already has viewport-fit=cover meta tag, needs apple-mobile-web-app tags
- Dark theme tokens in `src/index.css` — theme-color should match

### Integration Points
- vite.config.ts — add VitePWA plugin configuration
- index.html — add apple-mobile-web-app meta tags
- src/main.tsx or src/App.tsx — register service worker, request persistent storage
- New: install prompt component (shown conditionally after first workout)

</code_context>

<specifics>
## Specific Ideas

- Keep it simple — PWA config is boilerplate, not a feature
- The install prompt should feel helpful, not nagging
- iOS-specific instructions are important since that's the target device

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 06-pwa-polish*
*Context gathered: 2026-04-10*
