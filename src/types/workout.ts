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
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  studentId?: string; // ID of the student it belongs to, or 'all'
  scheduledDay: DayOfWeek;
  scheduledTime?: string; // e.g. "18:30"
  durationMinutes: number;
  exercises: Exercise[];
  colorTheme?: string;
  coverImage?: string;
}

export type SetType = 'warmup' | 'normal' | 'dropset' | 'failure';

export interface WorkoutSetRecord {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg: number;
  reps: number;
  completed: boolean;
  rpe?: number; // 1-10
  notes?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: MuscleGroup;
  sets: WorkoutSetRecord[];
  bestWeightKg?: number;
  estimated1RM?: number;
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
  feeling?: 'otimo' | 'bom' | 'normal' | 'pesado' | 'cansado';
  sessionNotes?: string;
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
