import { NavLink } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11M6 2v4M18 2v4M6 18v4M18 18v4M2 8h4v8H2zM18 8h4v8h-4zM6 10h12v4H6z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export default function BottomNav() {
  const activeWorkout = useLiveQuery(
    () => db.workouts.filter(w => !w.completedAt).first()
  );

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-4 py-2 text-xs font-medium transition-colors ${
      isActive ? 'text-accent' : 'text-text-secondary'
    }`;

  return (
    <nav className="flex justify-around items-center border-t border-border bg-bg-secondary pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/" end className={linkClass}>
        <HomeIcon className="mb-0.5" />
        Home
      </NavLink>
      {activeWorkout && (
        <NavLink to={`/workout/${activeWorkout.id}`} className={linkClass}>
          <DumbbellIcon className="mb-0.5" />
          Workout
        </NavLink>
      )}
      <NavLink to="/prs" className={linkClass}>
        <TrophyIcon className="mb-0.5" />
        PRs
      </NavLink>
      <NavLink to="/history" className={linkClass}>
        <ClockIcon className="mb-0.5" />
        History
      </NavLink>
    </nav>
  );
}
