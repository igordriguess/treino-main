import React, { useState } from 'react';
import { X, Calculator, Dumbbell, Award, HelpCircle } from 'lucide-react';
import { calculate1RM } from '../utils/calculations';

interface PlateCalculatorModalProps {
  onClose: () => void;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'anilhas' | 'oneRepMax'>('anilhas');

  // Plate Calculator State
  const [targetWeight, setTargetWeight] = useState<number>(80);
  const [barWeight, setBarWeight] = useState<number>(20);

  // 1RM Calculator State
  const [testWeight, setTestWeight] = useState<number>(85);
  const [testReps, setTestReps] = useState<number>(8);

  // Available standard Olympic plates in kg
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];

  // Plate calculation: weight per side
  const weightPerSide = Math.max(0, (targetWeight - barWeight) / 2);
  let remainder = weightPerSide;
  const platesPerSide: { weight: number; count: number }[] = [];

  availablePlates.forEach((plate) => {
    if (remainder >= plate) {
      const count = Math.floor(remainder / plate);
      platesPerSide.push({ weight: plate, count });
      remainder = Math.round((remainder - count * plate) * 100) / 100;
    }
  });

  // 1RM table calculation
  const calculated1RM = calculate1RM(testWeight, testReps);
  const repMaxPercentages = [
    { percent: 100, reps: 1 },
    { percent: 95, reps: 2 },
    { percent: 90, reps: 4 },
    { percent: 85, reps: 6 },
    { percent: 80, reps: 8 },
    { percent: 75, reps: 10 },
    { percent: 70, reps: 12 },
    { percent: 65, reps: 15 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 tracking-tight">
                Calculadora de Carga & 1RM
              </h2>
              <p className="text-xs text-neutral-400">
                Calcule anilhas para a barra e estime sua força máxima (1RM).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 p-2 gap-2">
          <button
            onClick={() => setActiveTab('anilhas')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'anilhas'
                ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Divisão de Anilhas (Barra)
          </button>
          <button
            onClick={() => setActiveTab('oneRepMax')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'oneRepMax'
                ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Estimativa de 1RM (Força Máxima)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'anilhas' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Carga Total Alvo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={barWeight}
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 font-mono text-base font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Peso da Barra
                  </label>
                  <select
                    value={barWeight}
                    onChange={(e) => setBarWeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={20}>Barra Olímpica (20 kg)</option>
                    <option value={15}>Barra Olímpica Feminina (15 kg)</option>
                    <option value={10}>Barra Média / W (10 kg)</option>
                    <option value={0}>Sem barra (Halteres / Máquina)</option>
                  </select>
                </div>
              </div>

              {/* Visual Result */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-5 text-center">
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                  Coloque de cada lado da barra:
                </p>
                <div className="mt-2 text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  {weightPerSide} <span className="text-sm font-sans text-neutral-400">kg por lado</span>
                </div>

                {/* Plates breakdown */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {platesPerSide.length > 0 ? (
                    platesPerSide.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 font-mono text-xs font-bold text-neutral-100 shadow-sm"
                      >
                        <span className="text-emerald-400">{p.count}×</span>
                        <span>{p.weight} kg</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-500">Apenas a barra vazia</span>
                  )}
                </div>

                {remainder > 0 && (
                  <p className="mt-3 text-xs text-amber-400/90 font-mono">
                    Restante não divisível com anilhas padrão: {remainder * 2} kg totais
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Carga Levantada (kg)
                  </label>
                  <input
                    type="number"
                    value={testWeight}
                    onChange={(e) => setTestWeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 font-mono text-base font-bold text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Repetições Realizadas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={testReps}
                    onChange={(e) => setTestReps(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 font-mono text-base font-bold text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 1RM Result Banner */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center">
                <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">
                  1RM Estimado (Fórmula de Epley)
                </p>
                <div className="mt-1 text-4xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  {calculated1RM} <span className="text-lg font-sans text-neutral-400 font-normal">kg</span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  Carga máxima teórica para exatamente 1 repetição limpa.
                </p>
              </div>

              {/* Percentage breakdown table */}
              <div>
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2.5">
                  Tabela de Cargas por Faixa de Repetições
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {repMaxPercentages.map((item) => {
                    const weightAtPercent = Math.round(calculated1RM * (item.percent / 100) * 2) / 2;
                    return (
                      <div
                        key={item.percent}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-center"
                      >
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {item.percent}% · ~{item.reps} reps
                        </span>
                        <div className="font-mono text-sm font-bold text-neutral-200 mt-0.5">
                          {weightAtPercent} kg
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
