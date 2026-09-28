import React, { useState, useEffect } from 'react';
import { X, Check, Play, Pause, RotateCcw, Clock, Dumbbell, Plus, Trash2, Award, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { WorkoutRoutine, WorkoutSessionLog, ExerciseLog, WorkoutSetRecord, Exercise } from '../types/workout';
import { calculate1RM, calculateSetsVolume, MUSCLE_GROUP_LABELS } from '../utils/calculations';
import { sounds } from '../utils/sound';

interface ActiveWorkoutModalProps {
  routine: WorkoutRoutine;
  pastSessions: WorkoutSessionLog[];
  onFinishWorkout: (session: WorkoutSessionLog) => void;
  onClose: () => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  routine,
  pastSessions,
  onFinishWorkout,
  onClose,
}) => {
  // Session start time
  const [startTime] = useState<string>(() => {
    const d = new Date();
    return d.toTimeString().slice(0, 5);
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [restTimerMax, setRestTimerMax] = useState(60);
  const [restTimerActive, setRestTimerActive] = useState(false);

  // Notes & Feeling
  const [feeling, setFeeling] = useState<'otimo' | 'bom' | 'normal' | 'pesado' | 'cansado'>('bom');
  const [sessionNotes, setSessionNotes] = useState('');

  // Find previous session for this routine to prepopulate target weights/reps
  const previousSession = pastSessions
    .filter((s) => s.routineId === routine.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  // Initialize exercise logs
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() => {
    return routine.exercises.map((ex) => {
      // Look up previous exercise log in previous session
      const prevEx = previousSession?.exerciseLogs.find((p) => p.exerciseId === ex.id);

      const targetSetsCount = ex.targetSets || 3;
      const sets: WorkoutSetRecord[] = [];

      for (let i = 1; i <= targetSetsCount; i++) {
        const prevSet = prevEx?.sets?.[i - 1];
        const defaultWeight = prevSet?.weightKg || ex.defaultWeightKg || 0;
        const defaultReps = prevSet?.reps || parseInt(ex.targetReps) || 10;

        sets.push({
          id: `set-${ex.id}-${i}-${Date.now()}`,
          setNumber: i,
          type: i === 1 ? 'warmup' : 'normal',
          weightKg: defaultWeight,
          reps: defaultReps,
          completed: false,
        });
      }

      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets,
      };
    });
  });

  // Track workout duration
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rest timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (restTimerActive && restTimerSeconds > 0) {
      timer = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            sounds.playTimerBeep();
            setRestTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [restTimerActive, restTimerSeconds]);

  const startRestTimer = (seconds: number) => {
    setRestTimerMax(seconds);
    setRestTimerSeconds(seconds);
    setRestTimerActive(true);
  };

  const handleToggleSetComplete = (exIndex: number, setIndex: number, restSeconds: number) => {
    const updated = [...exerciseLogs];
    const currentSet = updated[exIndex].sets[setIndex];
    const nextState = !currentSet.completed;
    currentSet.completed = nextState;

    if (nextState) {
      sounds.playSetComplete();
      // Start rest timer if it wasn't the last set
      if (restSeconds > 0) {
        startRestTimer(restSeconds);
      }
    }

    setExerciseLogs(updated);
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof WorkoutSetRecord,
    val: any
  ) => {
    const updated = [...exerciseLogs];
    updated[exIndex].sets[setIndex] = {
      ...updated[exIndex].sets[setIndex],
      [field]: val,
    };
    setExerciseLogs(updated);
  };

  const handleAddSet = (exIndex: number) => {
    const updated = [...exerciseLogs];
    const ex = updated[exIndex];
    const lastSet = ex.sets[ex.sets.length - 1];
    const newSetNumber = ex.sets.length + 1;

    ex.sets.push({
      id: `set-${ex.exerciseId}-${newSetNumber}-${Date.now()}`,
      setNumber: newSetNumber,
      type: 'normal',
      weightKg: lastSet ? lastSet.weightKg : 0,
      reps: lastSet ? lastSet.reps : 10,
      completed: false,
    });

    setExerciseLogs(updated);
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const updated = [...exerciseLogs];
    updated[exIndex].sets.splice(setIndex, 1);
    // Re-index set numbers
    updated[exIndex].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    setExerciseLogs(updated);
  };

  // Calculate live volume
  const totalVolume = exerciseLogs.reduce((acc, ex) => {
    return acc + calculateSetsVolume(ex.sets);
  }, 0);

  const completedSetsCount = exerciseLogs.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const totalSetsCount = exerciseLogs.reduce((acc, ex) => acc + ex.sets.length, 0);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCompleteSession = () => {
    const now = new Date();
    const endTime = now.toTimeString().slice(0, 5);
    const dateStr = now.toISOString().slice(0, 10);

    const sessionLog: WorkoutSessionLog = {
      id: `sess-${Date.now()}`,
      routineId: routine.id,
      routineName: routine.name,
      studentId: routine.studentId,
      date: dateStr,
      startTime,
      endTime,
      totalDurationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      totalVolumeKg: Math.round(totalVolume),
      totalSets: completedSetsCount,
      exerciseLogs,
      feeling,
      sessionNotes: sessionNotes.trim() || undefined,
    };

    onFinishWorkout(sessionLog);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-4xl h-[95vh] rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 tracking-tight flex items-center gap-2">
                <span>{routine.name}</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  EM ANDAMENTO
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
                <span className="flex items-center gap-1 text-neutral-300">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  {formatElapsed(elapsedSeconds)}
                </span>
                <span aria-hidden="true" className="text-neutral-700">·</span>
                <span>{completedSetsCount}/{totalSetsCount} séries</span>
                <span aria-hidden="true" className="text-neutral-700">·</span>
                <span className="text-emerald-400 font-semibold">{totalVolume.toLocaleString('pt-BR')} kg levantados</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Deseja cancelar a sessão atual? Os dados não salvos serão descartados.')) {
                  onClose();
                }
              }}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
              title="Cancelar treino"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Rest Timer Floating Bar (if active or paused) */}
        {restTimerSeconds > 0 && (
          <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-300 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Descanso entre séries:
              </span>
              <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                {Math.floor(restTimerSeconds / 60)}:{(restTimerSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRestTimerSeconds((s) => s + 30)}
                className="px-2 py-1 rounded bg-neutral-900 border border-emerald-500/40 text-[11px] font-mono hover:bg-neutral-800 text-emerald-300"
              >
                +30s
              </button>
              <button
                onClick={() => setRestTimerActive(!restTimerActive)}
                className="p-1 rounded bg-neutral-900 border border-emerald-500/40 hover:bg-neutral-800 text-emerald-300"
                title={restTimerActive ? 'Pausar' : 'Continuar'}
              >
                {restTimerActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => {
                  setRestTimerSeconds(0);
                  setRestTimerActive(false);
                }}
                className="px-2 py-1 rounded bg-neutral-900 text-neutral-400 hover:text-neutral-100 text-[11px]"
              >
                Pular
              </button>
            </div>
          </div>
        )}

        {/* Exercises Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {exerciseLogs.map((exLog, exIndex) => {
            const routineEx = routine.exercises.find((e) => e.id === exLog.exerciseId) || routine.exercises[exIndex];
            const prevExLog = previousSession?.exerciseLogs.find((p) => p.exerciseId === exLog.exerciseId);

            return (
              <div
                key={exLog.exerciseId || exIndex}
                className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 sm:p-5"
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    {routineEx?.imageUrl ? (
                      <img
                        src={routineEx.imageUrl}
                        alt={exLog.exerciseName}
                        className="h-12 w-12 rounded-lg object-cover border border-neutral-700 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-neutral-100 tracking-tight">
                        {exLog.exerciseName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums mt-0.5">
                        <span className="text-emerald-400 font-medium">
                          {routineEx ? MUSCLE_GROUP_LABELS[routineEx.muscleGroup] : 'Geral'}
                        </span>
                        <span aria-hidden="true" className="text-neutral-700">·</span>
                        <span>Alvo: {routineEx?.targetSets || 3} séries × {routineEx?.targetReps || '10'}</span>
                        <span aria-hidden="true" className="text-neutral-700">·</span>
                        <span>Descanso: {routineEx?.restSeconds || 60}s</span>
                      </div>
                      {routineEx?.notes && (
                        <p className="mt-1 text-xs text-neutral-400 italic">
                          "{routineEx.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rest trigger button */}
                  <button
                    onClick={() => startRestTimer(routineEx?.restSeconds || 60)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors shrink-0"
                    title="Iniciar cronômetro de descanso"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{routineEx?.restSeconds || 60}s</span>
                  </button>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-500 uppercase tracking-wider font-mono text-[10px]">
                        <th className="pb-2 text-left w-12">Série</th>
                        <th className="pb-2 text-left hidden sm:table-cell">Histórico</th>
                        <th className="pb-2 text-center w-28">Carga (kg)</th>
                        <th className="pb-2 text-center w-24">Reps</th>
                        <th className="pb-2 text-center hidden md:table-cell">1RM Est.</th>
                        <th className="pb-2 text-center w-14">Feito</th>
                        <th className="pb-2 text-right w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850/60 font-mono">
                      {exLog.sets.map((set, setIndex) => {
                        const prevSet = prevExLog?.sets?.[setIndex];
                        const est1RM = calculate1RM(set.weightKg, set.reps);

                        return (
                          <tr
                            key={set.id || setIndex}
                            className={`transition-colors ${
                              set.completed ? 'bg-emerald-950/20 text-neutral-200' : 'hover:bg-neutral-900/50'
                            }`}
                          >
                            {/* Set Number */}
                            <td className="py-2.5 text-neutral-400 font-semibold tabular-nums">
                              {set.type === 'warmup' ? 'Aquec.' : `${set.setNumber}ª`}
                            </td>

                            {/* Previous historical weight */}
                            <td className="py-2.5 text-neutral-500 text-[11px] tabular-nums hidden sm:table-cell">
                              {prevSet ? `${prevSet.weightKg}kg × ${prevSet.reps}` : '—'}
                            </td>

                            {/* Weight input with quick adjusters */}
                            <td className="py-2.5 text-center">
                              <div className="inline-flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSet(exIndex, setIndex, 'weightKg', Math.max(0, (Number(set.weightKg) || 0) - 2.5))}
                                  className="h-6 w-6 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center text-xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={set.weightKg || ''}
                                  onChange={(e) => handleUpdateSet(exIndex, setIndex, 'weightKg', parseFloat(e.target.value) || 0)}
                                  className="w-14 rounded border border-neutral-700 bg-neutral-900 py-1 text-center font-mono text-xs font-semibold text-neutral-100 focus:border-emerald-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSet(exIndex, setIndex, 'weightKg', (Number(set.weightKg) || 0) + 2.5)}
                                  className="h-6 w-6 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Reps input */}
                            <td className="py-2.5 text-center">
                              <div className="inline-flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSet(exIndex, setIndex, 'reps', Math.max(1, (Number(set.reps) || 0) - 1))}
                                  className="h-6 w-6 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center text-xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={set.reps || ''}
                                  onChange={(e) => handleUpdateSet(exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                  className="w-12 rounded border border-neutral-700 bg-neutral-900 py-1 text-center font-mono text-xs font-semibold text-neutral-100 focus:border-emerald-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSet(exIndex, setIndex, 'reps', (Number(set.reps) || 0) + 1)}
                                  className="h-6 w-6 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* 1RM Est. */}
                            <td className="py-2.5 text-center text-neutral-400 tabular-nums hidden md:table-cell text-[11px]">
                              {est1RM > 0 ? `${est1RM}kg` : '—'}
                            </td>

                            {/* Completed Checkbox */}
                            <td className="py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSetComplete(exIndex, setIndex, routineEx?.restSeconds || 60)}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                                  set.completed
                                    ? 'bg-emerald-500 border-emerald-400 text-neutral-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                    : 'border-neutral-700 bg-neutral-900 text-neutral-500 hover:border-emerald-500/50'
                                }`}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </td>

                            {/* Delete set */}
                            <td className="py-2.5 text-right">
                              {exLog.sets.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(exIndex, setIndex)}
                                  className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                                  title="Remover série"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add set button */}
                <div className="mt-3 flex justify-start">
                  <button
                    type="button"
                    onClick={() => handleAddSet(exIndex)}
                    className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-emerald-400 font-medium transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Série</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Session Summary & Feeling selection */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-5 space-y-4">
            <h4 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">
              Feedback do Treino
            </h4>

            <div>
              <label className="block text-xs text-neutral-400 mb-2">
                Como você se sentiu hoje?
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'otimo', label: '🔥 Ótimo / Forte' },
                  { key: 'bom', label: '⚡ Bom / Consistente' },
                  { key: 'normal', label: '👍 Normal' },
                  { key: 'pesado', label: '🏋️ Pesado / No limite' },
                  { key: 'cansado', label: '😴 Cansado' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFeeling(item.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      feeling === item.key
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">
                Anotações gerais do treino (ex: dores, ajuste de pegada, PRs)
              </label>
              <textarea
                rows={2}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Ex: Treino muito produtivo, supino subiu com sobra..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-neutral-800 bg-neutral-950/80 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400 font-mono tabular-nums">
            Volume total: <span className="text-emerald-400 font-bold">{totalVolume.toLocaleString('pt-BR')} kg</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm('Deseja sair sem salvar a sessão?')) {
                  onClose();
                }
              }}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCompleteSession}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10"
            >
              <Check className="h-4 w-4" />
              <span>Finalizar & Salvar Treino</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
