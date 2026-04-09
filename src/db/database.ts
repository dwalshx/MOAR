import Dexie, { type Table } from 'dexie';
import type { Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate } from './models';

export class MoarDatabase extends Dexie {
  workouts!: Table<Workout, number>;
  workoutExercises!: Table<WorkoutExercise, number>;
  workoutSets!: Table<WorkoutSet, number>;
  workoutTemplates!: Table<WorkoutTemplate, number>;

  constructor() {
    super('moar');
    this.version(1).stores({
      workouts: '++id, name, startedAt, templateId, completedAt',
      workoutExercises: '++id, workoutId, exerciseName, [workoutId+order]',
      workoutSets: '++id, workoutExerciseId, timestamp',
      workoutTemplates: '++id, name, lastUsed'
    });
  }
}

export const db = new MoarDatabase();
