import type { Workout } from '../../db/models';

interface WorkoutHeaderProps {
  workout: Workout;
  onFinish: () => void;
}

export default function WorkoutHeader({ workout, onFinish }: WorkoutHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <h1 className="text-xl font-bold text-text-primary truncate mr-4">
        {workout.name}
      </h1>
      <button
        type="button"
        className="bg-success text-white px-4 py-2 rounded-lg font-semibold
                   min-h-[44px] whitespace-nowrap active:opacity-80 transition-opacity"
        onClick={onFinish}
      >
        Finish
      </button>
    </div>
  );
}
