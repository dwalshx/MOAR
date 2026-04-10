import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { workoutService } from '../services/workoutService';
import HistoryWorkoutCard from '../components/history/HistoryWorkoutCard';
import WorkoutVolumeChart from '../components/history/WorkoutVolumeChart';

const BATCH_SIZE = 20;

export default function HistoryPage() {
  const navigate = useNavigate();
  const [limit, setLimit] = useState(BATCH_SIZE);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const workouts = useLiveQuery(
    () => workoutService.getCompletedWorkouts(0, limit),
    [limit]
  );

  const chartData = useLiveQuery(
    () => workoutService.getWorkoutVolumeChartData(20),
    []
  );

  useEffect(() => {
    if (workouts !== undefined && workouts.length < limit) {
      setHasMore(false);
    }
  }, [workouts, limit]);

  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      setLimit(prev => prev + BATCH_SIZE);
    }
  }, [hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  const handleTap = (id: number) => {
    navigate(`/history/${id}`);
  };

  if (workouts === undefined || chartData === undefined) return null;

  return (
    <div className="pt-6 pb-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-text-primary">History</h1>

      <WorkoutVolumeChart data={chartData} />

      {workouts.length === 0 ? (
        <p className="text-text-secondary text-sm">
          No workouts yet. Complete a workout to see it here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {workouts.map(workout => (
            <HistoryWorkoutCard
              key={workout.id}
              workout={workout}
              onTap={handleTap}
            />
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="h-4" />
          )}
        </div>
      )}
    </div>
  );
}
