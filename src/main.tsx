import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureDatabase } from './db/database'

// Open Dexie (recovering from incompatible old schemas if needed) before
// rendering anything that might touch the DB.
ensureDatabase()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[db] failed to open:', err);
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  });

// Request persistent storage to prevent iOS Safari eviction (per D-14, D-15).
// Fire and forget — do not await, do not block startup.
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {
    // Silently ignore — persistent storage is best-effort.
  });
}
