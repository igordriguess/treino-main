import { WorkoutSessionLog, DayOfWeek } from '../types/workout';

export const DAYS_CONFIG: { key: DayOfWeek; label: string; short: string; order: number }[] = [
  { key: 'segunda', label: 'Segunda-feira', short: 'SEG', order: 1 },
  { key: 'terca', label: 'Terça-feira', short: 'TER', order: 2 },
  { key: 'quarta', label: 'Quarta-feira', short: 'QUA', order: 3 },
  { key: 'quinta', label: 'Quinta-feira', short: 'QUI', order: 4 },
  { key: 'sexta', label: 'Sexta-feira', short: 'SEX', order: 5 },
  { key: 'sabado', label: 'Sábado', short: 'SÁB', order: 6 },
  { key: 'domingo', label: 'Domingo', short: 'DOM', order: 7 },
  { key: 'flexivel', label: 'Flexível / Livre', short: 'FLEX', order: 8 },
];

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  peito: 'Peito',
  costas: 'Costas',
  pernas: 'Pernas',
  quadriceps: 'Quadríceps',
  posteriores: 'Posteriores',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abdomen: 'Abdômen',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  cardio: 'Cardio',
};

/**
 * Calculates Estimated 1 Repetition Maximum using Epley formula.
 */
export function calculate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  // Epley formula: w * (1 + r / 30)
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculates total volume in kg for a list of sets: sum(weight * reps) for completed sets
 */
export function calculateSetsVolume(sets: { weightKg: number; reps: number; completed: boolean }[]): number {
  return sets.reduce((acc, curr) => {
    if (curr.completed) {
      return acc + (Number(curr.weightKg) || 0) * (Number(curr.reps) || 0);
    }
    return acc;
  }, 0);
}

/**
 * Get current day of week key based on system date
 */
export function getCurrentDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday ...
  switch (dayIndex) {
    case 1: return 'segunda';
    case 2: return 'terca';
    case 3: return 'quarta';
    case 4: return 'quinta';
    case 5: return 'sexta';
    case 6: return 'sabado';
    case 0: return 'domingo';
    default: return 'flexivel';
  }
}

/**
 * Formats date into readable Brazilian format (ex: "28/09" or "28 de Setembro")
 */
export function formatBrDate(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return dateString;
  }
}

export interface WeeklyVolumePoint {
  weekLabel: string;
  volumeKg: number;
  sessionsCount: number;
  totalSets: number;
  startDate: string;
}

/**
 * Groups sessions by week (last 4 to 8 weeks) to plot weekly volume progression
 */
export function getWeeklyVolumeProgression(sessions: WorkoutSessionLog[]): WeeklyVolumePoint[] {
  if (!sessions || sessions.length === 0) return [];

  // Sort sessions ascending by date
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  
  // Group by week start (Monday)
  const map: Record<string, { volume: number; count: number; sets: number; label: string }> = {};

  sorted.forEach((session) => {
    const d = new Date(session.date + 'T00:00:00');
    // Find monday of this week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const key = monday.toISOString().slice(0, 10);
    const month = monday.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const label = `Sem ${monday.getDate()} ${month}`;

    if (!map[key]) {
      map[key] = { volume: 0, count: 0, sets: 0, label };
    }
    map[key].volume += session.totalVolumeKg || 0;
    map[key].count += 1;
    map[key].sets += session.totalSets || 0;
  });

  return Object.entries(map).map(([startDate, data]) => ({
    startDate,
    weekLabel: data.label,
    volumeKg: Math.round(data.volume),
    sessionsCount: data.count,
    totalSets: data.sets,
  }));
}

/**
 * Extracts exercise progression points (Date, Max Weight, Estimated 1RM, Volume)
 */
export interface ExerciseProgressPoint {
  date: string;
  maxWeightKg: number;
  estimated1RM: number;
  totalVolumeKg: number;
  bestSet: string;
}

export function getExerciseProgression(
  sessions: WorkoutSessionLog[],
  exerciseNameOrId: string
): ExerciseProgressPoint[] {
  if (!sessions || sessions.length === 0) return [];

  const points: ExerciseProgressPoint[] = [];
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach((s) => {
    const exLog = s.exerciseLogs.find(
      (e) => e.exerciseId === exerciseNameOrId || e.exerciseName.toLowerCase() === exerciseNameOrId.toLowerCase()
    );

    if (exLog && exLog.sets && exLog.sets.length > 0) {
      let maxWeight = 0;
      let best1RM = 0;
      let totalVolume = 0;
      let bestSetDesc = '';

      exLog.sets.forEach((set) => {
        if (set.completed && set.weightKg > 0) {
          const current1RM = calculate1RM(set.weightKg, set.reps);
          if (current1RM > best1RM) {
            best1RM = current1RM;
            bestSetDesc = `${set.weightKg}kg × ${set.reps}`;
          }
          if (set.weightKg > maxWeight) {
            maxWeight = set.weightKg;
          }
          totalVolume += set.weightKg * set.reps;
        }
      });

      if (maxWeight > 0 || best1RM > 0) {
        points.push({
          date: s.date,
          maxWeightKg: maxWeight,
          estimated1RM: best1RM,
          totalVolumeKg: totalVolume,
          bestSet: bestSetDesc || `${maxWeight}kg`,
        });
      }
    }
  });

  return points;
}
