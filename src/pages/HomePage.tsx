import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { workoutService } from '../services/workoutService';
import RecentWorkouts from '../components/home/RecentWorkouts';

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
      <h1 className="text-3xl font-bold text-text-primary">MOAR</h1>
      <p className="text-text-secondary mt-1 mb-8">Track your gains</p>

      {activeWorkout && (
        <button
          onClick={handleResumeWorkout}
          className="w-full bg-bg-card rounded-xl p-4 mb-4 flex items-center justify-between min-h-[44px] active:opacity-80 transition-opacity"
        >
          <div className="text-left">
            <div className="text-text-primary font-semibold">{activeWorkout.name}</div>
            <div className="text-accent text-sm">In progress</div>
          </div>
          <span className="text-accent font-semibold">Resume</span>
        </button>
      )}

      <button
        onClick={handleStartWorkout}
        className={
          activeWorkout
            ? 'w-full bg-bg-card border border-border text-text-primary font-bold py-4 rounded-xl text-lg min-h-[44px] active:opacity-80 transition-colors'
            : 'w-full bg-accent text-white font-bold py-4 rounded-xl text-lg min-h-[44px] active:bg-accent-hover transition-colors'
        }
      >
        {activeWorkout ? 'Start New Workout' : 'Start Workout'}
      </button>

      <RecentWorkouts />
    </div>
  );
}
