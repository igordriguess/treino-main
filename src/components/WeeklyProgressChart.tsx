import React, { useState } from 'react';
import { TrendingUp, Award, Calendar, BarChart3, Dumbbell, Zap, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { WorkoutSessionLog } from '../types/workout';
import { getWeeklyVolumeProgression, getExerciseProgression, formatBrDate, MUSCLE_GROUP_LABELS } from '../utils/calculations';

interface WeeklyProgressChartProps {
  sessions: WorkoutSessionLog[];
  onSelectExerciseToView?: (exerciseName: string) => void;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  sessions,
  onSelectExerciseToView,
}) => {
  const weeklyData = getWeeklyVolumeProgression(sessions);

  // Extract all unique exercise names from sessions
  const exerciseNamesSet = new Set<string>();
  sessions.forEach((s) => {
    s.exerciseLogs?.forEach((e) => {
      if (e.exerciseName) exerciseNamesSet.add(e.exerciseName);
    });
  });
  const allExerciseNames = Array.from(exerciseNamesSet);

  const [selectedExercise, setSelectedExercise] = useState<string>(
    allExerciseNames[0] || 'Supino Reto com Barra'
  );

  const exerciseProgression = getExerciseProgression(sessions, selectedExercise);

  // Quick stats
  const totalVolumeAllTime = sessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0);
  const totalSessionsCount = sessions.length;
  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.totalDurationMinutes || 0), 0) / sessions.length)
    : 0;

  // Calculate volume difference vs previous week
  const lastWeek = weeklyData[weeklyData.length - 1];
  const prevWeek = weeklyData[weeklyData.length - 2];
  let weeklyDeltaPercent = 0;
  if (lastWeek && prevWeek && prevWeek.volumeKg > 0) {
    weeklyDeltaPercent = Math.round(((lastWeek.volumeKg - prevWeek.volumeKg) / prevWeek.volumeKg) * 100);
  }

  // Calculate sets per muscle group across last 7 days
  const muscleSetsMap: Record<string, number> = {};
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  sessions.forEach((s) => {
    const sDate = new Date(s.date + 'T00:00:00');
    if (sDate >= sevenDaysAgo) {
      s.exerciseLogs?.forEach((ex) => {
        const mg = ex.muscleGroup || 'geral';
        const completedSets = ex.sets?.filter((st) => st.completed).length || 0;
        muscleSetsMap[mg] = (muscleSetsMap[mg] || 0) + completedSets;
      });
    }
  });

  // SVG Chart Dimensions for Weekly Volume
  const chartHeight = 160;
  const maxVolume = Math.max(...weeklyData.map((d) => d.volumeKg), 5000);

  // SVG Chart for Exercise Progression
  const exMaxWeight = Math.max(...exerciseProgression.map((p) => p.maxWeightKg), 50);
  const exMinWeight = Math.max(0, Math.min(...exerciseProgression.map((p) => p.maxWeightKg), 30) - 10);

  return (
    <div className="space-y-6">
      {/* Top Stat Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Volume Total Acumulado</span>
            <Dumbbell className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {(totalVolumeAllTime / 1000).toFixed(1)} <span className="text-sm font-sans font-normal text-neutral-400">toneladas</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            {totalSessionsCount} sessões completadas
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Carga Semanal Atual</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {lastWeek ? lastWeek.volumeKg.toLocaleString('pt-BR') : 0} <span className="text-sm font-sans font-normal text-neutral-400">kg</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-mono tabular-nums">
            {weeklyDeltaPercent >= 0 ? (
              <span className="text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" /> +{weeklyDeltaPercent}%
              </span>
            ) : (
              <span className="text-rose-400 flex items-center">
                <ArrowDownRight className="h-3 w-3" /> {weeklyDeltaPercent}%
              </span>
            )}
            <span className="text-neutral-500">vs semana anterior</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Tempo Médio por Treino</span>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {avgDuration} <span className="text-sm font-sans font-normal text-neutral-400">minutos</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500 font-mono tabular-nums">
            {lastWeek ? lastWeek.sessionsCount : 0} treinos esta semana
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Recordes Pessoais (PR)</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {exerciseProgression.length > 0 ? `${exerciseProgression[exerciseProgression.length - 1]?.maxWeightKg || 0} kg` : '—'}
          </div>
          <p className="mt-1 text-[11px] text-neutral-400 truncate">
            {selectedExercise}
          </p>
        </div>
      </div>

      {/* Main Chart: Weekly Volume Progression (Kg) */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-neutral-100 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <span>Volume Semanal Total (Carga × Reps × Séries)</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Acompanhamento da sobrecarga progressiva (Progressive Overload) semana a semana.
            </p>
          </div>
          <div className="text-xs font-mono text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            Média: {weeklyData.length > 0 ? Math.round(weeklyData.reduce((a, b) => a + b.volumeKg, 0) / weeklyData.length).toLocaleString('pt-BR') : 0} kg / semana
          </div>
        </div>

        {/* SVG Bar & Area Chart */}
        {weeklyData.length > 0 ? (
          <div className="space-y-4">
            <div className="h-48 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-neutral-800">
              {weeklyData.map((w, idx) => {
                const heightPercent = Math.max(12, Math.round((w.volumeKg / maxVolume) * 100));
                const isCurrent = idx === weeklyData.length - 1;

                return (
                  <div key={w.startDate || idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 text-[10px] font-mono text-neutral-300 bg-neutral-950 px-2 py-1 rounded border border-neutral-700 pointer-events-none whitespace-nowrap shadow-lg">
                      {w.volumeKg.toLocaleString('pt-BR')} kg ({w.sessionsCount} treinos)
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[54px] rounded-t-lg transition-all duration-300 ${
                        isCurrent
                          ? 'bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                          : 'bg-neutral-800 hover:bg-neutral-700'
                      }`}
                    />

                    {/* Label below */}
                    <div className="mt-2 text-center">
                      <p className={`text-[11px] font-mono font-medium truncate ${isCurrent ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}`}>
                        {w.weekLabel}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono tabular-nums">
                        {(w.volumeKg / 1000).toFixed(1)}k kg
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-neutral-500">
            Nenhum dado semanal registrado ainda. Complete uma sessão para visualizar o gráfico.
          </div>
        )}
      </div>

      {/* Second Section: Exercise Specific Load & 1RM Progression Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-neutral-100 tracking-tight flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>Curva de Progressão por Exercício</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Evolução de carga máxima (kg) e 1RM estimado em cada sessão.
                </p>
              </div>

              {/* Exercise Selector */}
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 font-medium focus:border-emerald-500 focus:outline-none"
              >
                {allExerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Line / Path Progression visualization */}
            {exerciseProgression.length > 0 ? (
              <div className="space-y-4">
                <div className="relative h-44 w-full border-b border-l border-neutral-800 pt-4 pr-4">
                  {/* SVG line */}
                  <svg className="w-full h-full overflow-visible">
                    {/* Horizontal grid guide */}
                    <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#262626" strokeDasharray="3 3" />
                    <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#262626" strokeDasharray="3 3" />

                    {/* Points & Line */}
                    {exerciseProgression.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        points={exerciseProgression
                          .map((p, idx) => {
                            const x = (idx / (exerciseProgression.length - 1)) * 100;
                            const y = 100 - ((p.maxWeightKg - exMinWeight) / Math.max(1, exMaxWeight - exMinWeight)) * 80 - 10;
                            return `${x}%,${y}%`;
                          })
                          .join(' ')}
                      />
                    )}

                    {/* Dots for each point */}
                    {exerciseProgression.map((p, idx) => {
                      const xPercent = exerciseProgression.length === 1 ? 50 : (idx / (exerciseProgression.length - 1)) * 100;
                      const yPercent = 100 - ((p.maxWeightKg - exMinWeight) / Math.max(1, exMaxWeight - exMinWeight)) * 80 - 10;

                      return (
                        <g key={idx} className="group cursor-pointer">
                          <circle
                            cx={`${xPercent}%`}
                            cy={`${yPercent}%`}
                            r="5"
                            className="fill-emerald-500 stroke-neutral-950 stroke-2 hover:r-7 transition-all"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Data points row below chart */}
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono tabular-nums overflow-x-auto pt-2">
                  {exerciseProgression.map((p, idx) => (
                    <div key={idx} className="text-center shrink-0 px-2">
                      <div className="text-neutral-200 font-bold">{p.maxWeightKg} kg</div>
                      <div className="text-[10px] text-neutral-500">{formatBrDate(p.date)}</div>
                      <div className="text-[9px] text-emerald-400/80">1RM: {p.estimated1RM}kg</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500">
                Nenhum registro para {selectedExercise}. Realize um treino com este exercício para começar o histórico.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Sets by Muscle Group */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 sm:p-6">
          <h3 className="text-base font-bold text-neutral-100 tracking-tight flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>Volume Muscular (7 Dias)</span>
          </h3>
          <p className="text-xs text-neutral-400 mb-4">
            Séries completadas por grupo muscular nos últimos 7 dias.
          </p>

          <div className="space-y-3">
            {Object.keys(muscleSetsMap).length > 0 ? (
              Object.entries(muscleSetsMap).map(([group, count]) => {
                const label = MUSCLE_GROUP_LABELS[group] || group;
                // Target recommended range is 10 - 20 sets/week
                const percentage = Math.min(100, Math.round((count / 20) * 100));

                return (
                  <div key={group} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-300">{label}</span>
                      <span className="font-mono text-neutral-400 tabular-nums">
                        <strong className="text-emerald-400">{count}</strong> / 16 séries
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500">
                Nenhuma série registrada nos últimos 7 dias.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
