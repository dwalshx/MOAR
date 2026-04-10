import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Request persistent storage to prevent iOS Safari eviction (per D-14, D-15).
// Fire and forget — do not await, do not block startup.
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {
    // Silently ignore — persistent storage is best-effort.
  });
}
