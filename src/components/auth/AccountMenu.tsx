import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useAutoSync } from '../../hooks/useAutoSync';
import { sync as syncNow } from '../../services/syncService';

export default function AccountMenu() {
  const { user, signOut } = useAuth();
  const { status, lastSyncAt, error } = useAutoSync();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) return null;

  const initial = user.email?.charAt(0).toUpperCase() || '?';

  const statusText =
    status === 'syncing' ? 'Syncing...'
    : status === 'error' ? 'Sync error'
    : status === 'offline' ? 'Offline'
    : lastSyncAt ? `Synced ${relative(lastSyncAt)}`
    : 'Ready to sync';

  const statusColor =
    status === 'syncing' ? 'text-accent'
    : status === 'error' ? 'text-red-400'
    : status === 'offline' ? 'text-text-secondary'
    : 'text-success';

  const handleSyncNow = () => {
    if (user) syncNow(user.id);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 min-h-[36px] px-2 py-1 rounded-lg
                   active:bg-bg-card transition-colors"
        aria-label="Account menu"
      >
        <span className={`w-2 h-2 rounded-full ${
          status === 'syncing' ? 'bg-accent animate-pulse'
          : status === 'error' ? 'bg-red-400'
          : status === 'offline' ? 'bg-text-secondary'
          : 'bg-success'
        }`} />
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'var(--color-accent)' }}
        >
          {initial}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-bg-secondary border border-border
                        rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-text-primary text-sm font-semibold truncate">
              {user.email}
            </div>
            <div className={`text-xs mt-0.5 ${statusColor}`}>
              {statusText}
            </div>
            {error && (
              <div className="text-xs text-red-400 mt-1 break-words">{error}</div>
            )}
          </div>
          <button
            onClick={() => { handleSyncNow(); setOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm text-text-primary
                       active:bg-bg-card transition-colors min-h-[44px]"
          >
            Sync now
          </button>
          <button
            onClick={() => { signOut(); setOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm text-red-400
                       active:bg-bg-card transition-colors min-h-[44px] border-t border-border"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function relative(d: Date): string {
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
}
