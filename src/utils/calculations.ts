import { CardioTarget, Exercise, DayOfWeek } from '../types/workout';

export const DAYS_CONFIG: { key: DayOfWeek; label: string }[] = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
  { key: 'flexivel', label: 'Flexível / Livre' },
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

// --- Cardio helpers ---

export const isCardio = (ex: Pick<Exercise, 'muscleGroup'>): boolean => ex.muscleGroup === 'cardio';

export const CARDIO_FIELDS: { key: keyof CardioTarget; label: string; unit: string; step: string }[] = [
  { key: 'distanceKm', label: 'Distância', unit: 'km', step: '0.1' },
  { key: 'durationMinutes', label: 'Tempo', unit: 'min', step: '1' },
  { key: 'avgSpeedKmh', label: 'Velocidade média', unit: 'km/h', step: '0.1' },
  { key: 'maxSpeedKmh', label: 'Velocidade máxima', unit: 'km/h', step: '0.1' },
  { key: 'maxSpeedMinutes', label: 'Tempo na vel. máxima', unit: 'min', step: '1' },
];

export const formatCardioValue = (cardio: CardioTarget | undefined, key: keyof CardioTarget): string => {
  const value = cardio?.[key];
  if (value === undefined || value === null || Number.isNaN(value)) return 'Livre';
  const unit = CARDIO_FIELDS.find((f) => f.key === key)?.unit ?? '';
  return `${value.toLocaleString('pt-BR')} ${unit}`;
};

// Short one-line summary used in lists and cards, e.g. "5 km · 30 min" or "Livre".
const formatCardioSummary = (cardio: CardioTarget | undefined): string => {
  const parts = (['distanceKm', 'durationMinutes', 'avgSpeedKmh'] as const)
    .filter((k) => cardio?.[k] !== undefined)
    .map((k) => formatCardioValue(cardio, k));
  return parts.length ? parts.join(' · ') : 'Livre';
};

// Short prescription for any exercise: "3 × 10-12" or the cardio summary.
export const formatPrescription = (ex: Exercise): string =>
  isCardio(ex) ? formatCardioSummary(ex.cardio) : `${ex.targetSets} × ${ex.targetReps}`;

// Removes empty cardio fields so they are stored as undefined ("Livre").
export const cleanCardio = (cardio: CardioTarget | undefined): CardioTarget | undefined => {
  if (!cardio) return undefined;
  const cleaned: CardioTarget = {};
  CARDIO_FIELDS.forEach(({ key }) => {
    const v = cardio[key];
    if (v !== undefined && v !== null && !Number.isNaN(v)) cleaned[key] = v;
  });
  return Object.keys(cleaned).length ? cleaned : undefined;
};
