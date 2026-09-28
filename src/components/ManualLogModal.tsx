import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Dumbbell, Calendar, Clock, Smile } from 'lucide-react';
import { WorkoutRoutine, WorkoutSessionLog, ExerciseLog, WorkoutSetRecord } from '../types/workout';
import { calculate1RM, calculateSetsVolume } from '../utils/calculations';

interface ManualLogModalProps {
  routines: WorkoutRoutine[];
  existingSession?: WorkoutSessionLog | null;
  onSaveSession: (session: WorkoutSessionLog) => void;
  onClose: () => void;
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({
  routines,
  existingSession,
  onSaveSession,
  onClose,
}) => {
  const isEditing = !!existingSession;

  const [selectedRoutineId, setSelectedRoutineId] = useState(
    existingSession?.routineId || routines[0]?.id || ''
  );

  const [date, setDate] = useState(
    existingSession?.date || new Date().toISOString().slice(0, 10)
  );

  const [durationMinutes, setDurationMinutes] = useState(
    existingSession?.totalDurationMinutes || 60
  );

  const [feeling, setFeeling] = useState<any>(existingSession?.feeling || 'bom');
  const [sessionNotes, setSessionNotes] = useState(existingSession?.sessionNotes || '');

  // Initialize exercise logs
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() => {
    if (existingSession) {
      return JSON.parse(JSON.stringify(existingSession.exerciseLogs));
    }
    const targetRoutine = routines.find((r) => r.id === selectedRoutineId) || routines[0];
    if (!targetRoutine) return [];

    return targetRoutine.exercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: Array.from({ length: ex.targetSets || 3 }).map((_, i) => ({
        id: `set-${Date.now()}-${i}`,
        setNumber: i + 1,
        type: i === 0 ? 'warmup' : 'normal',
        weightKg: ex.defaultWeightKg || 0,
        reps: parseInt(ex.targetReps) || 10,
        completed: true,
      })),
    }));
  });

  const handleRoutineChange = (routineId: string) => {
    setSelectedRoutineId(routineId);
    const targetRoutine = routines.find((r) => r.id === routineId);
    if (!targetRoutine) return;

    setExerciseLogs(
      targetRoutine.exercises.map((ex) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: Array.from({ length: ex.targetSets || 3 }).map((_, i) => ({
          id: `set-${Date.now()}-${i}`,
          setNumber: i + 1,
          type: i === 0 ? 'warmup' : 'normal',
          weightKg: ex.defaultWeightKg || 0,
          reps: parseInt(ex.targetReps) || 10,
          completed: true,
        })),
      }))
    );
  };

  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof WorkoutSetRecord,
    val: any
  ) => {
    const updated = [...exerciseLogs];
    updated[exIdx].sets[setIdx] = {
      ...updated[exIdx].sets[setIdx],
      [field]: val,
    };
    setExerciseLogs(updated);
  };

  const handleAddSet = (exIdx: number) => {
    const updated = [...exerciseLogs];
    const sets = updated[exIdx].sets;
    const last = sets[sets.length - 1];
    sets.push({
      id: `set-${Date.now()}-${sets.length}`,
      setNumber: sets.length + 1,
      type: 'normal',
      weightKg: last ? last.weightKg : 0,
      reps: last ? last.reps : 10,
      completed: true,
    });
    setExerciseLogs(updated);
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...exerciseLogs];
    updated[exIdx].sets.splice(setIdx, 1);
    updated[exIdx].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    setExerciseLogs(updated);
  };

  const handleAddCustomExerciseToLog = () => {
    const name = prompt('Nome do exercício a adicionar:');
    if (!name || !name.trim()) return;

    setExerciseLogs([
      ...exerciseLogs,
      {
        exerciseId: `custom-${Date.now()}`,
        exerciseName: name.trim(),
        muscleGroup: 'peito',
        sets: [
          {
            id: `s-${Date.now()}-1`,
            setNumber: 1,
            type: 'normal',
            weightKg: 20,
            reps: 10,
            completed: true,
          },
        ],
      },
    ]);
  };

  const totalVolume = exerciseLogs.reduce((acc, ex) => {
    return acc + calculateSetsVolume(ex.sets);
  }, 0);

  const completedSetsCount = exerciseLogs.reduce((acc, ex) => {
    return acc + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const handleSave = () => {
    const targetRoutine = routines.find((r) => r.id === selectedRoutineId);
    const routineName = targetRoutine?.name || 'Treino Manual';

    const session: WorkoutSessionLog = {
      id: existingSession?.id || `sess-manual-${Date.now()}`,
      routineId: selectedRoutineId,
      routineName,
      date,
      startTime: existingSession?.startTime || '18:30',
      endTime: existingSession?.endTime || '19:30',
      totalDurationMinutes: Number(durationMinutes) || 60,
      totalVolumeKg: Math.round(totalVolume),
      totalSets: completedSetsCount,
      exerciseLogs,
      feeling,
      sessionNotes: sessionNotes.trim() || undefined,
    };

    onSaveSession(session);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/70">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 tracking-tight">
              {isEditing ? 'Editar Registro de Treino' : 'Preenchimento Manual de Treino & Séries'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Insira ou ajuste séries, repetições e cargas para alimentar seus gráficos de evolução.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Top metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Treino Base
              </label>
              <select
                value={selectedRoutineId}
                disabled={isEditing}
                onChange={(e) => handleRoutineChange(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
              >
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Data Realizada
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Duração (minutos)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Exercise Sets Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Séries e Cargas por Exercício
              </h3>
              <button
                type="button"
                onClick={handleAddCustomExerciseToLog}
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Outro Exercício
              </button>
            </div>

            {exerciseLogs.map((exLog, exIdx) => (
              <div
                key={exLog.exerciseId || exIdx}
                className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm text-neutral-200">
                    {exLog.exerciseName}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddSet(exIdx)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    <Plus className="h-3 w-3" />
                    Série
                  </button>
                </div>

                <div className="space-y-2">
                  {exLog.sets.map((set, setIdx) => {
                    const est1RM = calculate1RM(set.weightKg, set.reps);

                    return (
                      <div
                        key={set.id || setIdx}
                        className="flex items-center gap-3 text-xs bg-neutral-900/60 p-2 rounded-lg border border-neutral-850"
                      >
                        <span className="font-mono text-neutral-500 font-bold w-12">
                          #{set.setNumber}
                        </span>

                        <div className="flex items-center gap-1.5 flex-1">
                          <label className="text-[11px] text-neutral-400">Carga:</label>
                          <input
                            type="number"
                            step="0.5"
                            value={set.weightKg}
                            onChange={(e) => handleUpdateSet(exIdx, setIdx, 'weightKg', parseFloat(e.target.value) || 0)}
                            className="w-16 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-center font-mono text-neutral-100"
                          />
                          <span className="text-neutral-500 font-mono text-[11px]">kg</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-1">
                          <label className="text-[11px] text-neutral-400">Reps:</label>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => handleUpdateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                            className="w-14 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-center font-mono text-neutral-100"
                          />
                        </div>

                        <div className="hidden sm:block text-neutral-400 font-mono text-[11px]">
                          1RM: <span className="text-emerald-400 font-semibold">{est1RM}kg</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exIdx, setIdx)}
                          className="text-neutral-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Feedback & Notes */}
          <div className="border-t border-neutral-800 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Anotações
              </label>
              <textarea
                rows={2}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Observações da sessão..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 bg-neutral-950/70 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-neutral-400 font-mono tabular-nums">
            Volume calculado: <span className="text-emerald-400 font-bold">{totalVolume.toLocaleString('pt-BR')} kg</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              <Check className="h-4 w-4" />
              <span>Salvar Registro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
