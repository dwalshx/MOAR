import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

const DISMISS_KEY = 'moar-install-dismissed';

// Minimal shape of the beforeinstallprompt event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mqStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  // iOS Safari exposes navigator.standalone
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return mqStandalone || iosStandalone;
}

function detectPlatform(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

/**
 * Install prompt banner (per D-17, D-18, D-19, D-20).
 *
 * Visibility rules — banner renders only when ALL are true:
 *  - Not previously dismissed (localStorage flag)
 *  - Not already running in standalone / home-screen mode
 *  - User has at least one completed workout
 *
 * Platform behavior:
 *  - iOS: manual Share -> Add to Home Screen instructions (Safari has no beforeinstallprompt)
 *  - Android/Chromium: uses stored beforeinstallprompt event to trigger native prompt
 *  - Other desktop: falls back to generic browser-menu hint
 */
export default function InstallPromptBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(DISMISS_KEY) === 'true';
  });
  const [standalone] = useState<boolean>(() => isStandalone());
  const [platform] = useState<'ios' | 'android' | 'other'>(() => detectPlatform());
  const installEventRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);

  // Capture the Chromium beforeinstallprompt event so we can trigger it later.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      e.preventDefault();
      installEventRef.current = e as BeforeInstallPromptEvent;
      setHasNativePrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Count completed workouts via live query so the banner appears immediately
  // after finishing the first one (per D-17).
  const completedCount = useLiveQuery(
    async () => {
      const all = await db.workouts.toArray();
      return all.filter((w) => w.completedAt && !w.deleted).length;
    },
    [],
    0,
  );

  // Early exits — render nothing while loading or when banner shouldn't show.
  if (dismissed) return null;
  if (standalone) return null;
  if (completedCount === undefined) return null;
  if (completedCount === 0) return null;

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // Ignore storage failures — worst case the banner reappears next load.
    }
    setDismissed(true);
  };

  const handleNativeInstall = async () => {
    const evt = installEventRef.current;
    if (!evt) return;
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      // Regardless of outcome, hide the banner for this session.
      if (choice.outcome === 'accepted') {
        handleDismiss();
      }
    } catch {
      // Silently ignore prompt failures
    }
  };

  return (
    <div
      role="region"
      aria-label="Install MOAR"
      className="relative mt-6 bg-bg-card border border-border rounded-xl p-4 pr-10 text-sm text-text-secondary"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary active:opacity-60 min-h-[32px]"
      >
        <span aria-hidden="true" className="text-lg leading-none">×</span>
      </button>

      {platform === 'ios' && (
        <>
          <div className="text-text-primary font-semibold mb-1">Add MOAR to your home screen</div>
          <p>
            Tap the <span className="text-text-primary font-medium">Share</span> button, then{' '}
            <span className="text-text-primary font-medium">Add to Home Screen</span> for the best experience.
          </p>
        </>
      )}

      {platform !== 'ios' && hasNativePrompt && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-text-primary font-semibold mb-1">Install MOAR</div>
            <p>Add MOAR to your home screen for the best experience.</p>
          </div>
          <button
            type="button"
            onClick={handleNativeInstall}
            className="bg-accent text-white font-semibold px-4 py-2 rounded-lg min-h-[44px] active:bg-accent-hover transition-colors whitespace-nowrap"
          >
            Install
          </button>
        </div>
      )}

      {platform !== 'ios' && !hasNativePrompt && (
        <>
          <div className="text-text-primary font-semibold mb-1">Add MOAR to your home screen</div>
          <p>Open your browser menu and choose "Add to Home Screen" or "Install app".</p>
        </>
      )}
    </div>
  );
}
