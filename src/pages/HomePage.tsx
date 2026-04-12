import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { workoutService } from '../services/workoutService';
import HeroSection from '../components/home/HeroSection';
import RecentWorkouts from '../components/home/RecentWorkouts';
import InstallPromptBanner from '../components/pwa/InstallPromptBanner';

export default function HomePage() {
  const navigate = useNavigate();

  const activeWorkout = useLiveQuery(
    () => db.workouts.filter(w => !w.completedAt).first()
  );

  const handleStartWorkout = async () => {
    const workoutId = await workoutService.startWorkout();
    navigate(`/workout/${workoutId}`);
  };

  const handleResumeWorkout = () => {
    if (activeWorkout?.id) {
      navigate(`/workout/${activeWorkout.id}`);
    }
  };

  return (
    <div className="pt-6">
      <HeroSection />

      {activeWorkout && (
        <button
          onClick={handleResumeWorkout}
          className="w-full bg-bg-card rounded-xl p-4 mb-4 flex items-center justify-between min-h-[44px] active:opacity-80 transition-opacity border border-accent/30"
        >
          <div className="text-left">
            <div className="text-text-primary font-semibold">{activeWorkout.name}</div>
            <div className="text-accent text-sm font-medium">In progress — tap to resume</div>
          </div>
          <span className="text-accent font-bold text-lg">&rsaquo;</span>
        </button>
      )}

      <button
        onClick={handleStartWorkout}
        className={
          activeWorkout
            ? 'w-full bg-bg-card border border-border text-text-primary font-bold py-4 rounded-xl text-lg min-h-[44px] active:opacity-80 transition-colors'
            : 'w-full bg-gradient-to-r from-accent to-accent-hover text-white font-bold py-4 rounded-xl text-lg min-h-[44px] active:opacity-90 transition-all shadow-lg shadow-accent/20'
        }
      >
        {activeWorkout ? 'Start New Workout' : 'Start Workout'}
      </button>

      <RecentWorkouts />

      <InstallPromptBanner />
    </div>
  );
}
