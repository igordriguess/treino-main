import React, { useEffect, useState } from 'react';
import { X, Check, Clock, Dumbbell, ChevronLeft, ChevronRight, Maximize2, Repeat, Timer, Weight, Info, Trophy, Route, Gauge, Zap } from 'lucide-react';
import { WorkoutRoutine, WorkoutSessionLog, ExerciseLog, WorkoutSetRecord, Exercise } from '../types/workout';
import { calculateSetsVolume, formatCardioValue, isCardio, MUSCLE_GROUP_LABELS } from '../utils/calculations';
import { sounds } from '../utils/sound';
import { useDialog } from './DialogProvider';
import { ImageLightbox } from './ImageLightbox';

interface ActiveWorkoutModalProps {
  routine: WorkoutRoutine;
  studentId?: string;
  onFinishWorkout: (session: WorkoutSessionLog) => void;
  onClose: () => void;
}

// Builds the log of an exercise straight from what the trainer prescribed.
const buildExerciseLog = (ex: Exercise, completed: boolean): ExerciseLog => {
  const reps = parseInt(ex.targetReps) || 0;
  const sets: WorkoutSetRecord[] = Array.from({ length: ex.targetSets || 1 }, (_, i) => ({
    id: `set-${ex.id}-${i + 1}`,
    setNumber: i + 1,
    type: 'normal',
    weightKg: ex.defaultWeightKg || 0,
    reps,
    completed,
  }));
  return { exerciseId: ex.id, exerciseName: ex.name, muscleGroup: ex.muscleGroup, sets };
};

const formatElapsed = (sec: number) => {
  const mins = Math.floor(sec / 60);
  const s = sec % 60;
  return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  routine,
  studentId,
  onFinishWorkout,
  onClose,
}) => {
  const { confirm } = useDialog();
  const exercises = routine.exercises;

  const [startTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [expandedImage, setExpandedImage] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const current = exercises[currentIndex];
  const isCurrentDone = !!current && doneIds.includes(current.id);
  const allDone = exercises.length > 0 && doneIds.length === exercises.length;
  const progressPct = exercises.length ? Math.round((doneIds.length / exercises.length) * 100) : 0;

  const handleToggleDone = () => {
    if (!current) return;
    if (isCurrentDone) {
      setDoneIds(doneIds.filter((id) => id !== current.id));
      return;
    }
    const nextDone = [...doneIds, current.id];
    setDoneIds(nextDone);
    sounds.playSetComplete();

    // Jump to the next pending exercise, looking forward first
    const order = [...exercises.slice(currentIndex + 1), ...exercises.slice(0, currentIndex)];
    const nextPending = order.find((ex) => !nextDone.includes(ex.id));
    if (nextPending) {
      setCurrentIndex(exercises.findIndex((ex) => ex.id === nextPending.id));
    }
  };

  const handleFinish = async () => {
    if (!allDone) {
      const pending = exercises.length - doneIds.length;
      const ok = await confirm({
        title: 'Finalizar treino?',
        message: `Ainda ${pending === 1 ? 'falta 1 exercício' : `faltam ${pending} exercícios`}. Eles serão registrados como não realizados.`,
        confirmLabel: 'Finalizar mesmo assim',
      });
      if (!ok) return;
    }

    const exerciseLogs = exercises.map((ex) => buildExerciseLog(ex, doneIds.includes(ex.id)));
    const now = new Date();

    onFinishWorkout({
      id: `sess-${Date.now()}`,
      routineId: routine.id,
      routineName: routine.name,
      studentId,
      date: now.toISOString().slice(0, 10),
      startTime,
      endTime: now.toTimeString().slice(0, 5),
      totalDurationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      totalVolumeKg: Math.round(exerciseLogs.reduce((acc, l) => acc + calculateSetsVolume(l.sets), 0)),
      totalSets: exerciseLogs.reduce((acc, l) => acc + l.sets.filter((s) => s.completed).length, 0),
      exerciseLogs,
    });
  };

  const handleClose = async () => {
    if (doneIds.length > 0) {
      const ok = await confirm({
        title: 'Sair do treino?',
        message: 'O progresso deste treino não será salvo.',
        confirmLabel: 'Sair sem salvar',
        cancelLabel: 'Continuar treinando',
        tone: 'danger',
      });
      if (!ok) return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-3xl h-dvh sm:h-[95vh] sm:rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-neutral-800 bg-neutral-950/80 px-4 sm:px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-neutral-100 tracking-tight">{routine.name}</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
                <span className="flex items-center gap-1 text-neutral-300">
                  <Clock className="h-3.5 w-3.5" />
                  {formatElapsed(elapsedSeconds)}
                </span>
                <span aria-hidden="true" className="text-neutral-700">·</span>
                <span>
                  {doneIds.length}/{exercises.length} concluídos
                </span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="shrink-0 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
              aria-label="Fechar treino"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>

          {/* Exercise stepper */}
          {exercises.length > 1 && (
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {exercises.map((ex, i) => {
                const done = doneIds.includes(ex.id);
                const active = i === currentIndex;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setCurrentIndex(i)}
                    title={ex.name}
                    className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border px-2 text-xs font-bold font-mono tabular-nums transition-colors ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : done
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Current exercise */}
        {current ? (
          <div className="flex-1 overflow-y-auto">
            {/* Media */}
            {current.imageUrl ? (
              <button
                type="button"
                onClick={() => setExpandedImage(true)}
                className="group relative block w-full bg-neutral-950 cursor-zoom-in"
                aria-label="Expandir imagem"
              >
                <img
                  src={current.imageUrl}
                  alt={current.name}
                  referrerPolicy="no-referrer"
                  className="mx-auto h-[38vh] sm:h-[42vh] w-full object-contain"
                />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-200 group-hover:bg-black/90 transition-colors">
                  <Maximize2 className="h-3.5 w-3.5" />
                  Toque para ampliar
                </span>
              </button>
            ) : (
              <div className="flex h-40 w-full flex-col items-center justify-center bg-neutral-950 text-neutral-600">
                <Dumbbell className="h-10 w-10" />
                <span className="mt-2 text-xs">Sem imagem para este exercício</span>
              </div>
            )}

            <div className="p-5 space-y-5">
              {/* Title */}
              <div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-neutral-500 tabular-nums">
                    Exercício {currentIndex + 1} de {exercises.length}
                  </span>
                  <span aria-hidden="true" className="text-neutral-700">·</span>
                  <span className="font-semibold text-emerald-400">{MUSCLE_GROUP_LABELS[current.muscleGroup]}</span>
                </div>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">{current.name}</h3>
              </div>

              {/* Prescription */}
              {isCardio(current) ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <PrescriptionTile icon={<Route className="h-4 w-4" />} label="Distância" value={formatCardioValue(current.cardio, 'distanceKm')} />
                  <PrescriptionTile icon={<Clock className="h-4 w-4" />} label="Tempo" value={formatCardioValue(current.cardio, 'durationMinutes')} />
                  <PrescriptionTile icon={<Gauge className="h-4 w-4" />} label="Vel. média" value={formatCardioValue(current.cardio, 'avgSpeedKmh')} />
                  <PrescriptionTile icon={<Zap className="h-4 w-4" />} label="Vel. máxima" value={formatCardioValue(current.cardio, 'maxSpeedKmh')} />
                  <PrescriptionTile icon={<Timer className="h-4 w-4" />} label="Tempo na vel. máx." value={formatCardioValue(current.cardio, 'maxSpeedMinutes')} />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <PrescriptionTile icon={<Repeat className="h-4 w-4" />} label="Séries" value={String(current.targetSets)} />
                  <PrescriptionTile icon={<Dumbbell className="h-4 w-4" />} label="Repetições" value={current.targetReps} />
                  <PrescriptionTile
                    icon={<Weight className="h-4 w-4" />}
                    label="Carga"
                    value={current.defaultWeightKg ? `${current.defaultWeightKg} kg` : 'Livre'}
                  />
                  <PrescriptionTile icon={<Timer className="h-4 w-4" />} label="Descanso" value={`${current.restSeconds}s`} />
                </div>
              )}

              {/* How to train */}
              {current.notes && (
                <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-400">
                    <Info className="h-3.5 w-3.5" />
                    Como executar
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-neutral-200">{current.notes}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <Dumbbell className="h-10 w-10 text-neutral-600" />
            <p className="mt-3 text-sm font-medium text-neutral-300">Este treino ainda não tem exercícios.</p>
            <p className="mt-1 text-xs text-neutral-500">Fale com seu treinador.</p>
          </div>
        )}

        {/* Footer actions */}
        {current && (
          <div className="shrink-0 border-t border-neutral-800 bg-neutral-950/80 px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="rounded-xl border border-neutral-700 bg-neutral-800 p-3 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 transition-colors"
                aria-label="Exercício anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={handleToggleDone}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors ${
                  isCurrentDone
                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/10'
                }`}
              >
                <Check className="h-5 w-5" />
                {isCurrentDone ? 'Concluído · desfazer' : 'Concluído'}
              </button>

              <button
                onClick={() => setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1))}
                disabled={currentIndex === exercises.length - 1}
                className="rounded-xl border border-neutral-700 bg-neutral-800 p-3 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 transition-colors"
                aria-label="Próximo exercício"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={handleFinish}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors ${
                allDone
                  ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                  : 'border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Trophy className="h-4 w-4" />
              Finalizar Treino
            </button>
          </div>
        )}
      </div>

      {expandedImage && current?.imageUrl && (
        <ImageLightbox src={current.imageUrl} alt={current.name} onClose={() => setExpandedImage(false)} />
      )}
    </div>
  );
};

const PrescriptionTile: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
      <span className="text-emerald-400">{icon}</span>
      {label}
    </p>
    <p className="mt-1 text-lg font-bold font-mono tabular-nums text-neutral-100">{value}</p>
  </div>
);
