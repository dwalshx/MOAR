export interface Workout {
  id?: number;
  name: string;
  templateId?: number;
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface WorkoutExercise {
  id?: number;
  workoutId: number;
  exerciseName: string;
  order: number;
}

export interface WorkoutSet {
  id?: number;
  workoutExerciseId: number;
  setNumber: number;
  weight: number;      // lbs only per D-07
  reps: number;
  timestamp: Date;
}

export interface WorkoutTemplate {
  id?: number;
  name: string;
  lastUsed: Date;
  exercises: string[];  // exercise names in order
}
