import { NavLink } from 'react-router';

export default function BottomNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-4 py-2 text-xs font-medium transition-colors ${
      isActive ? 'text-accent' : 'text-text-secondary'
    }`;

  return (
    <nav className="flex justify-around items-center border-t border-border bg-bg-secondary pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/" end className={linkClass}>
        <span className="text-lg mb-0.5">{'\u{1F3E0}'}</span>
        Home
      </NavLink>
      <NavLink to="/history" className={linkClass}>
        <span className="text-lg mb-0.5">{'\u{1F4CB}'}</span>
        History
      </NavLink>
    </nav>
  );
}
