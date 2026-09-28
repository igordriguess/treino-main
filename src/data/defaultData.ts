import { WorkoutRoutine, WorkoutSessionLog, Exercise, StudentAccount } from '../types/workout';

export const ADMIN_DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: '1234',
  name: 'Administrador',
};

// No pre-created workouts - user asked for clean structure with 0 workouts to start
export const INITIAL_ROUTINES: WorkoutRoutine[] = [];

// No pre-created sessions
export const INITIAL_SESSIONS: WorkoutSessionLog[] = [];

// Initial students (empty list ready for admin to add)
export const INITIAL_STUDENTS: StudentAccount[] = [];

// Quick exercise suggestion templates when building workouts
export const EXERCISE_SUGGESTIONS: Partial<Exercise>[] = [
  { name: 'Supino Reto com Barra', muscleGroup: 'peito', targetSets: 4, targetReps: '8-10', restSeconds: 90 },
  { name: 'Supino Inclinado com Halteres', muscleGroup: 'peito', targetSets: 3, targetReps: '10-12', restSeconds: 75 },
  { name: 'Crucifixo no Crossover', muscleGroup: 'peito', targetSets: 3, targetReps: '12-15', restSeconds: 60 },
  { name: 'Puxada Frontal na Polia', muscleGroup: 'costas', targetSets: 4, targetReps: '8-10', restSeconds: 75 },
  { name: 'Remada Curvada com Barra', muscleGroup: 'costas', targetSets: 4, targetReps: '8-10', restSeconds: 90 },
  { name: 'Remada Baixa no Triângulo', muscleGroup: 'costas', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
  { name: 'Agachamento Livre com Barra', muscleGroup: 'pernas', targetSets: 4, targetReps: '6-8', restSeconds: 120 },
  { name: 'Leg Press 45°', muscleGroup: 'quadriceps', targetSets: 4, targetReps: '10-12', restSeconds: 90 },
  { name: 'Cadeira Extensora', muscleGroup: 'quadriceps', targetSets: 3, targetReps: '12-15', restSeconds: 60 },
  { name: 'Mesa Flexora', muscleGroup: 'posteriores', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
  { name: 'Stiff com Barra ou Halteres', muscleGroup: 'posteriores', targetSets: 3, targetReps: '10-12', restSeconds: 75 },
  { name: 'Desenvolvimento com Halteres', muscleGroup: 'ombros', targetSets: 4, targetReps: '8-10', restSeconds: 90 },
  { name: 'Elevação Lateral', muscleGroup: 'ombros', targetSets: 4, targetReps: '12-15', restSeconds: 60 },
  { name: 'Rosca Direta com Barra W', muscleGroup: 'biceps', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
  { name: 'Rosca Martelo', muscleGroup: 'biceps', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
  { name: 'Tríceps Corda na Polia', muscleGroup: 'triceps', targetSets: 4, targetReps: '12-15', restSeconds: 60 },
  { name: 'Tríceps Testa', muscleGroup: 'triceps', targetSets: 3, targetReps: '10-12', restSeconds: 75 },
  { name: 'Abdominal Supra na Polia', muscleGroup: 'abdomen', targetSets: 3, targetReps: '15-20', restSeconds: 45 },
  { name: 'Elevação Pélvica', muscleGroup: 'gluteos', targetSets: 4, targetReps: '10-12', restSeconds: 75 },
  { name: 'Panturrilha Sentado', muscleGroup: 'panturrilha', targetSets: 4, targetReps: '15-20', restSeconds: 45 },
];
