import React from 'react';
import { Calendar, Clock, Dumbbell, Trash2, Edit3, ChevronRight, Award, Plus } from 'lucide-react';
import { WorkoutSessionLog } from '../types/workout';
import { formatBrDate } from '../utils/calculations';

interface WorkoutHistoryViewProps {
  sessions: WorkoutSessionLog[];
  onEditSession: (session: WorkoutSessionLog) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewManualLog: () => void;
}

export const WorkoutHistoryView: React.FC<WorkoutHistoryViewProps> = ({
  sessions,
  onEditSession,
  onDeleteSession,
  onNewManualLog,
}) => {
  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-100">
            Histórico de Treinos & Séries Concluídas
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Acompanhe cada série, repetição e carga executada ao longo do tempo. Você pode editar qualquer registro.
          </p>
        </div>

        <button
          onClick={onNewManualLog}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Treino Manual</span>
        </button>
      </div>

      {/* Sessions List */}
      {sortedSessions.length > 0 ? (
        <div className="space-y-4">
          {sortedSessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 transition-all hover:border-neutral-700"
            >
              {/* Session Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-850">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-100 tracking-tight">
                      {session.routineName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums mt-0.5">
                      <span className="flex items-center gap-1 text-neutral-300">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {formatBrDate(session.date)}
                      </span>
                      <span aria-hidden="true" className="text-neutral-700">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-neutral-500" />
                        {session.startTime}{session.endTime ? ` - ${session.endTime}` : ''}
                      </span>
                      <span aria-hidden="true" className="text-neutral-700">·</span>
                      <span>{session.totalDurationMinutes} min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-xs text-neutral-400">Volume Total</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {session.totalVolumeKg?.toLocaleString('pt-BR')} kg
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditSession(session)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                      title="Editar sessão"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Deseja excluir esta sessão do histórico?')) {
                          onDeleteSession(session.id);
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Excluir sessão"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Exercises in Session */}
              <div className="mt-4 space-y-3">
                {session.exerciseLogs?.map((exLog, exIdx) => (
                  <div
                    key={exLog.exerciseId || exIdx}
                    className="rounded-lg bg-neutral-950/60 p-3 border border-neutral-850"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-neutral-200">
                        {exLog.exerciseName}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                        {exLog.sets?.filter((s) => s.completed).length} séries completadas
                      </span>
                    </div>

                    {/* Sets chips/pills representation without clutter */}
                    <div className="flex flex-wrap items-center gap-2">
                      {exLog.sets?.map((set, sIdx) => (
                        <div
                          key={set.id || sIdx}
                          className={`rounded px-2.5 py-1 text-xs font-mono tabular-nums border ${
                            set.completed
                              ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
                              : 'bg-neutral-950 border-neutral-850 text-neutral-500 line-through'
                          }`}
                        >
                          <span className="text-neutral-500 mr-1.5">#{set.setNumber}</span>
                          <strong className="text-emerald-400">{set.weightKg}kg</strong> × {set.reps}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes / Feeling if any */}
              {session.sessionNotes && (
                <div className="mt-3 text-xs text-neutral-400 bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-850 italic">
                  "{session.sessionNotes}"
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center">
          <Dumbbell className="h-10 w-10 mx-auto text-neutral-600 mb-3" />
          <h3 className="text-base font-semibold text-neutral-300">Nenhum treino no histórico</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Inicie um treino do dia ou clique em "Registrar Treino Manual" para cadastrar seu primeiro registro.
          </p>
          <button
            onClick={onNewManualLog}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Treino Manual</span>
          </button>
        </div>
      )}
    </div>
  );
};
