import React from 'react';
import { Play, Edit2, Clock, Calendar, Dumbbell, MoreVertical, Trash2, Copy, Eye, UserCheck } from 'lucide-react';
import { WorkoutRoutine, Exercise, StudentAccount } from '../types/workout';
import { DAYS_CONFIG, MUSCLE_GROUP_LABELS } from '../utils/calculations';

interface WorkoutCardProps {
  routine: WorkoutRoutine;
  isToday: boolean;
  isAdmin: boolean;
  students: StudentAccount[];
  onStart: (routine: WorkoutRoutine) => void;
  onEdit: (routine: WorkoutRoutine) => void;
  onDelete: (routineId: string) => void;
  onDuplicate: (routine: WorkoutRoutine) => void;
  onSelectExercise: (exercise: Exercise) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  routine,
  isToday,
  isAdmin,
  students,
  onStart,
  onEdit,
  onDelete,
  onDuplicate,
  onSelectExercise,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const dayInfo = DAYS_CONFIG.find((d) => d.key === routine.scheduledDay);
  const totalSets = routine.exercises.reduce((acc, curr) => acc + (curr.targetSets || 0), 0);

  const assignedStudent = students.find((s) => s.id === routine.studentId);

  return (
    <div className={`relative flex flex-col justify-between rounded-xl border bg-neutral-900/90 transition-all duration-200 hover:border-neutral-700 ${
      isToday ? 'border-emerald-500/50 shadow-[0_0_24px_rgba(16,185,129,0.08)]' : 'border-neutral-800'
    }`}>
      {/* Header Section */}
      <div className="p-5 pb-4">
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2 mb-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1 font-medium ${isToday ? 'text-emerald-400 font-semibold' : 'text-neutral-300'}`}>
              <Calendar className="h-3.5 w-3.5" />
              {dayInfo?.label || 'Flexível'}
              {isToday && <span className="text-emerald-400 ml-1 font-semibold">(Hoje)</span>}
            </span>

            {/* Student badge */}
            {isAdmin && (
              <>
                <span aria-hidden="true" className="text-neutral-700">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-[11px] text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <UserCheck className="h-3 w-3" />
                  {assignedStudent ? assignedStudent.name : 'Geral (Todos)'}
                </span>
              </>
            )}
          </div>

          {/* Context menu for Admin */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-neutral-400 hover:text-neutral-100 rounded-md hover:bg-neutral-800 transition-colors"
                title="Opções do treino"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-7 z-30 w-40 rounded-lg border border-neutral-700 bg-neutral-900 p-1 shadow-xl">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(routine);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Editar Treino
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDuplicate(routine);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicar
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (confirm(`Deseja excluir "${routine.name}"?`)) {
                          onDelete(routine.id);
                        }
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-neutral-100 tracking-tight">
          {routine.name}
        </h3>
        {routine.description && (
          <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {routine.description}
          </p>
        )}

        {/* Summary row */}
        <div className="mt-2.5 flex items-center gap-3 text-xs text-neutral-400 font-mono tabular-nums">
          <span>{routine.exercises.length} exercícios</span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span>{totalSets} séries totais</span>
        </div>
      </div>

      {/* Exercises List preview */}
      <div className="border-t border-neutral-800/80 px-5 py-3">
        <p className="text-[10px] font-semibold text-neutral-400 tracking-wider mb-2 uppercase">
          EXERCÍCIOS
        </p>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {routine.exercises.map((ex, index) => (
            <div
              key={ex.id || index}
              onClick={() => onSelectExercise(ex)}
              className="group flex items-center justify-between rounded-md p-1.5 text-xs text-neutral-300 hover:bg-neutral-800/60 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-[11px] text-neutral-500 tabular-nums shrink-0">
                  {(index + 1).toString().padStart(2, '0')}.
                </span>
                {ex.imageUrl ? (
                  <img
                    src={ex.imageUrl}
                    alt={ex.name}
                    className="h-6 w-6 rounded object-cover border border-neutral-700 shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-6 w-6 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500 shrink-0">
                    <Dumbbell className="h-3 w-3" />
                  </div>
                )}
                <span className="font-medium text-neutral-200 truncate group-hover:text-emerald-400 transition-colors">
                  {ex.name}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono tabular-nums text-neutral-400 shrink-0 text-[11px]">
                <span>{ex.targetSets} × {ex.targetReps}</span>
                <Eye className="h-3.5 w-3.5 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}

          {routine.exercises.length === 0 && (
            <div className="py-3 text-center text-xs text-neutral-500">
              Nenhum exercício adicionado ainda.
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center gap-2 border-t border-neutral-800 p-4 bg-neutral-950/40 rounded-b-xl">
        {isAdmin && (
          <button
            onClick={() => onEdit(routine)}
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/80 py-2 px-3 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            Editar Treino
          </button>
        )}
        <button
          onClick={() => onStart(routine)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 px-3 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Iniciar Treino</span>
        </button>
      </div>
    </div>
  );
};
