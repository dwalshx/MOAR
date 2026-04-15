import { Outlet } from 'react-router';
import BottomNav from './BottomNav';
import AccountMenu from '../auth/AccountMenu';
import { useAutoSync } from '../../hooks/useAutoSync';
import { useAuth } from '../../lib/auth';

export default function AppLayout() {
  const { user } = useAuth();
  // Activate auto-sync side effects when user is signed in
  useAutoSync();

  return (
    <div className="dark flex flex-col h-dvh bg-bg-primary text-text-primary">
      <div className="pt-[env(safe-area-inset-top)]" />
      {user && (
        <div className="absolute top-2 right-3 z-20" style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
          <AccountMenu />
        </div>
      )}
      <main className="flex-1 overflow-y-auto px-4 pb-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
