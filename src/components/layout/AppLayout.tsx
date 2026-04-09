import { Outlet } from 'react-router';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="dark flex flex-col h-dvh bg-bg-primary text-text-primary">
      <div className="pt-[env(safe-area-inset-top)]" />
      <main className="flex-1 overflow-y-auto px-4 pb-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
