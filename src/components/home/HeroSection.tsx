import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { useEffect, useState } from 'react';

const TAGLINES = [
  'One more rep.',
  'Beat yesterday.',
  'Just a little more.',
  'Every set counts.',
  'Stack the gains.',
  'Progress is progress.',
  'You showed up.',
];

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

  let streak = 0;
  if (workouts.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workoutDays = new Set<number>();
    for (const w of workouts) {
      const d = new Date(w.completedAt!);
      d.setHours(0, 0, 0, 0);
      workoutDays.add(d.getTime());
    }
    const checkDay = new Date(today);
    if (!workoutDays.has(checkDay.getTime())) {
      checkDay.setDate(checkDay.getDate() - 1);
    }
    while (workoutDays.has(checkDay.getTime())) {
      streak++;
      checkDay.setDate(checkDay.getDate() - 1);
    }
  }

  return { totalWorkouts: workouts.length, totalSets: sets, totalVolume, currentStreak: streak };
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

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const isNewUser = !stats || stats.totalWorkouts === 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black border border-border/50 mb-6">
      {/* Fire hero image banner */}
      <div className="relative">
        <picture>
          <source srcSet="/moar-hero.webp" type="image/webp" />
          <img
            src="/moar-hero.png"
            alt="MOAR"
            className="w-full h-auto block"
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.8s ease-out',
            }}
          />
        </picture>

        {/* Bottom fade into content area */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: 'linear-gradient(to bottom, transparent, black)',
          }}
        />
      </div>

      {/* Content below the image */}
      <div
        className="relative z-10 px-5 pb-5 -mt-2"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s',
        }}
      >
        {isNewUser ? (
          /* --- NEW USER --- */
          <div>
            <p className="text-text-secondary text-sm italic mb-1">
              {tagline}
            </p>
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
          /* --- RETURNING USER --- */
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-sm">
                {greeting}
              </p>
              <p className="text-accent text-sm font-medium italic">
                {tagline}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                value={stats.totalWorkouts.toString()}
                label="Workouts"
                mounted={mounted}
                delay={400}
              />
              <StatCard
                value={formatBigNumber(stats.totalVolume)}
                label="lbs moved"
                accent
                mounted={mounted}
                delay={550}
              />
              <StatCard
                value={
                  stats.currentStreak > 0
                    ? `${stats.currentStreak}d`
                    : stats.totalSets.toString()
                }
                label={stats.currentStreak > 0 ? 'Streak' : 'Total sets'}
                mounted={mounted}
                delay={700}
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
      className="bg-bg-card/80 backdrop-blur-sm rounded-xl p-3 text-center transition-all duration-500 ease-out border border-border/30"
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
