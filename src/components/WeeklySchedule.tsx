import React from 'react';
import { Calendar, Clock, Plus, Play, CheckCircle2, ChevronRight, Edit3 } from 'lucide-react';
import { WorkoutRoutine } from '../types/workout';
import { DAYS_CONFIG, getCurrentDayOfWeek } from '../utils/calculations';

interface WeeklyScheduleProps {
  routines: WorkoutRoutine[];
  onStartRoutine: (routine: WorkoutRoutine) => void;
  onEditRoutine: (routine: WorkoutRoutine) => void;
  onNewRoutineForDay: (day: string) => void;
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  routines,
  onStartRoutine,
  onEditRoutine,
  onNewRoutineForDay,
}) => {
  const currentDay = getCurrentDayOfWeek();

  return (
    <div className="space-y-6">
      {/* Top Banner / Explainer */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-100">
              Grade Semanal de Horários & Treinos
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Defina os dias da semana e os horários programados para cada treino. O sistema destaca o treino de hoje automaticamente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-300 font-mono">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Hoje é {DAYS_CONFIG.find((d) => d.key === currentDay)?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS_CONFIG.filter((d) => d.key !== 'flexivel').map((day) => {
          const dayRoutines = routines.filter((r) => r.scheduledDay === day.key);
          const isToday = day.key === currentDay;

          return (
            <div
              key={day.key}
              className={`flex flex-col justify-between rounded-xl border p-4.5 transition-all ${
                isToday
                  ? 'border-emerald-500/60 bg-neutral-900/90 shadow-[0_0_20px_rgba(16,185,129,0.06)]'
                  : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Header of the day */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-neutral-400">
                      {day.short}
                    </span>
                    <span className="text-sm font-semibold text-neutral-200">
                      {day.label}
                    </span>
                  </div>
                  {isToday && (
                    <span className="text-[11px] font-semibold text-emerald-400 font-mono">
                      HOJE
                    </span>
                  )}
                </div>

                {/* Routines assigned to this day */}
                <div className="mt-3 space-y-2.5 min-h-[140px]">
                  {dayRoutines.length > 0 ? (
                    dayRoutines.map((routine) => (
                      <div
                        key={routine.id}
                        className="group rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm text-neutral-200 truncate group-hover:text-emerald-400 transition-colors">
                              {routine.name}
                            </h4>
                            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
                              <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                                <Clock className="h-3 w-3" />
                                {routine.scheduledTime || 'Sem hora'}
                              </span>
                              <span aria-hidden="true" className="text-neutral-700">·</span>
                              <span>{routine.exercises.length} exerc.</span>
                              <span aria-hidden="true" className="text-neutral-700">·</span>
                              <span>{routine.durationMinutes}m</span>
                            </div>
                          </div>
                          <button
                            onClick={() => onEditRoutine(routine)}
                            className="p-1 text-neutral-500 hover:text-neutral-200 rounded transition-colors"
                            title="Editar horário e exercícios"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Quick action button inside */}
                        <div className="mt-2.5 pt-2 border-t border-neutral-900 flex justify-end">
                          <button
                            onClick={() => onStartRoutine(routine)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-neutral-800 text-neutral-200 hover:bg-emerald-500 hover:text-neutral-950 transition-colors"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>Iniciar</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-28 rounded-lg border border-dashed border-neutral-850 p-3 text-center">
                      <p className="text-xs text-neutral-500">Descanso ou sem treino</p>
                      <button
                        onClick={() => onNewRoutineForDay(day.key)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Agendar treino</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Day footer button */}
              {dayRoutines.length > 0 && (
                <button
                  onClick={() => onNewRoutineForDay(day.key)}
                  className="mt-3 w-full py-1.5 text-center text-[11px] text-neutral-500 hover:text-neutral-300 border-t border-neutral-850 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Adicionar outro treino no dia</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
