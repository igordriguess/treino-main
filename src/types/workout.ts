export type DayOfWeek = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo' | 'flexivel';

export type MuscleGroup = 
  | 'peito' 
  | 'costas' 
  | 'pernas' 
  | 'quadriceps' 
  | 'posteriores' 
  | 'ombros' 
  | 'biceps' 
  | 'triceps' 
  | 'abdomen' 
  | 'gluteos' 
  | 'panturrilha' 
  | 'cardio';

// Cardio prescription; every field is optional and an empty one is shown as "Livre".
export interface CardioTarget {
  distanceKm?: number;
  durationMinutes?: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  maxSpeedMinutes?: number; // time spent at max speed
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetReps: string; // e.g. "8-12" or "10"
  restSeconds: number; // e.g. 60 or 90
  imageUrl?: string; // image or gif url / data url
  notes?: string;
  defaultWeightKg?: number;
  cardio?: CardioTarget;
  libraryExerciseId?: string; // ID of the library exercise this routine entry was assigned from
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  studentIds: string[]; // IDs of the students it is assigned to (empty = no student)
  scheduledDay: DayOfWeek;
  durationMinutes: number;
  exercises: Exercise[];
}

export type SetType = 'warmup' | 'normal' | 'dropset' | 'failure';

export interface WorkoutSetRecord {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: MuscleGroup;
  sets: WorkoutSetRecord[];
}

export interface WorkoutSessionLog {
  id: string;
  routineId: string;
  routineName: string;
  studentId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string;
  totalDurationMinutes?: number;
  totalVolumeKg: number;
  totalSets: number;
  exerciseLogs: ExerciseLog[];
}

export interface StudentAccount {
  id: string;
  name: string;
  username: string; // login identifier
  password: string; // password
  createdAt: string;
  goal?: string; // e.g. "Hipertrofia", "Definição", etc.
  notes?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'student';
}
