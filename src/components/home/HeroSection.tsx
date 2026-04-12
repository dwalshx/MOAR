import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { useEffect, useState } from 'react';

// Motivational taglines that rotate
const TAGLINES = [
  'One more rep.',
  'Beat yesterday.',
  'Just a little more.',
  'Every set counts.',
  'Stack the gains.',
  'Progress is progress.',
  'You showed up.',
];

// Pick a consistent tagline per day so it doesn't change on re-renders
function getDailyTagline(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TAGLINES[dayOfYear % TAGLINES.length];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface Stats {
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  currentStreak: number;
}

async function computeStats(): Promise<Stats> {
  const workouts = await db.workouts.filter(w => !!w.completedAt).toArray();
  const sets = await db.workoutSets.count();
  let totalVolume = 0;
  const allSets = await db.workoutSets.toArray();
  for (const s of allSets) {
    totalVolume += s.weight * s.reps;
  }

  // Compute streak: consecutive days with a workout (looking backwards from today)
  let streak = 0;
  if (workouts.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unique workout dates (normalized to day)
    const workoutDays = new Set<number>();
    for (const w of workouts) {
      const d = new Date(w.completedAt!);
      d.setHours(0, 0, 0, 0);
      workoutDays.add(d.getTime());
    }

    // Check today and walk backwards
    const checkDay = new Date(today);
    // If no workout today, start from yesterday
    if (!workoutDays.has(checkDay.getTime())) {
      checkDay.setDate(checkDay.getDate() - 1);
    }

    while (workoutDays.has(checkDay.getTime())) {
      streak++;
      checkDay.setDate(checkDay.getDate() - 1);
    }
  }

  return {
    totalWorkouts: workouts.length,
    totalSets: sets,
    totalVolume,
    currentStreak: streak,
  };
}

function formatBigNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function HeroSection() {
  const [tagline] = useState(getDailyTagline);
  const [greeting] = useState(getGreeting);
  const [mounted, setMounted] = useState(false);

  const workoutCount = useLiveQuery(
    () => db.workouts.filter(w => !!w.completedAt).count()
  );

  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    computeStats().then(setStats);
  }, [workoutCount]);

  // Trigger mount animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const isNewUser = !stats || stats.totalWorkouts === 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-card via-bg-secondary to-bg-card border border-border mb-6">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large faded M watermark */}
        <div
          className="absolute -right-8 -top-6 text-[180px] font-black select-none pointer-events-none leading-none"
          style={{
            color: 'rgba(249, 115, 22, 0.06)',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          M
        </div>
        {/* Accent glow */}
        <div
          className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-5">
        {isNewUser ? (
          /* --- NEW USER: Welcome screen --- */
          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#fff',
                }}
              >
                M
              </div>
              <div>
                <h1 className="text-2xl font-black text-text-primary tracking-tight">
                  MOAR
                </h1>
                <p className="text-text-secondary text-sm -mt-0.5">
                  {tagline}
                </p>
              </div>
            </div>

            <p className="text-text-secondary text-sm leading-relaxed mb-3">
              Log your lifts faster than Notes. See exactly what to beat.
              Get a little stronger every time.
            </p>

            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                Instant feedback
              </span>
              <span className="text-border">|</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success inline-block" />
                Visible progress
              </span>
              <span className="text-border">|</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Works offline
              </span>
            </div>
          </div>
        ) : (
          /* --- RETURNING USER: Stats dashboard --- */
          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm">{greeting}</p>
                <h1 className="text-2xl font-black text-text-primary tracking-tight">
                  MOAR
                </h1>
              </div>
              <div className="text-right">
                <p className="text-accent text-sm font-medium italic">
                  "{tagline}"
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                value={stats.totalWorkouts.toString()}
                label="Workouts"
                mounted={mounted}
                delay={100}
              />
              <StatCard
                value={formatBigNumber(stats.totalVolume)}
                label="lbs moved"
                accent
                mounted={mounted}
                delay={200}
              />
              <StatCard
                value={
                  stats.currentStreak > 0
                    ? `${stats.currentStreak}d`
                    : stats.totalSets.toString()
                }
                label={stats.currentStreak > 0 ? 'Streak' : 'Total sets'}
                mounted={mounted}
                delay={300}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  accent,
  mounted,
  delay,
}: {
  value: string;
  label: string;
  accent?: boolean;
  mounted: boolean;
  delay: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [mounted, delay]);

  return (
    <div
      className="bg-bg-primary/50 rounded-xl p-3 text-center transition-all duration-500 ease-out"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.95)',
      }}
    >
      <div
        className={`text-xl font-black ${accent ? 'text-accent' : 'text-text-primary'}`}
      >
        {value}
      </div>
      <div className="text-text-secondary text-xs mt-0.5">{label}</div>
    </div>
  );
}
