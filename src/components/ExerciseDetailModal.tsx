import React, { useState } from 'react';
import { X, Dumbbell, ExternalLink, Image as ImageIcon, Sparkles, TrendingUp, Calendar, Edit2, Check } from 'lucide-react';
import { Exercise, WorkoutSessionLog } from '../types/workout';
import { MUSCLE_GROUP_LABELS, getExerciseProgression, formatBrDate } from '../utils/calculations';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  sessions: WorkoutSessionLog[];
  onUpdateExerciseMedia?: (exerciseId: string, newImageUrl: string) => void;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  sessions,
  onUpdateExerciseMedia,
  onClose,
}) => {
  const [editingImage, setEditingImage] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState(exercise.imageUrl || '');

  const progression = getExerciseProgression(sessions, exercise.name);

  const handleSaveImage = () => {
    if (onUpdateExerciseMedia) {
      onUpdateExerciseMedia(exercise.id, imageUrlInput.trim());
    }
    setEditingImage(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                {MUSCLE_GROUP_LABELS[exercise.muscleGroup] || 'Musculação'}
              </span>
              <span aria-hidden="true" className="text-neutral-700">·</span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">
                {exercise.targetSets} séries × {exercise.targetReps} reps
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-100 tracking-tight mt-0.5">
              {exercise.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Visual Showcase (GIF or Image) */}
          <div className="relative rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden min-h-[220px] flex items-center justify-center">
            {exercise.imageUrl ? (
              <img
                src={exercise.imageUrl}
                alt={exercise.name}
                className="w-full max-h-[360px] object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500">
                <Dumbbell className="h-10 w-10 text-neutral-600 mb-2" />
                <p className="text-sm font-medium text-neutral-300">Nenhum GIF ou imagem anexada</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Você pode adicionar o link de um GIF demonstrativo ou foto técnica para consultar antes de executar.
                </p>
              </div>
            )}

            {/* Media control button overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => setEditingImage(!editingImage)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900/90 border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition-colors backdrop-blur-md"
              >
                <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span>{exercise.imageUrl ? 'Alterar GIF/Foto' : 'Adicionar GIF'}</span>
              </button>
            </div>
          </div>

          {/* Inline Edit Image Box */}
          {editingImage && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
              <label className="block text-xs font-semibold text-emerald-300">
                URL da imagem ou GIF animado:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/exercicio-execucao.gif"
                  className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveImage}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* Instructions and execution cues */}
          {exercise.notes && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Dicas de Execução & Postura
              </h4>
              <p className="text-sm text-neutral-200 leading-relaxed">
                {exercise.notes}
              </p>
            </div>
          )}

          {/* Progression History */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Histórico de Cargas Anteriores</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </h4>

            {progression.length > 0 ? (
              <div className="divide-y divide-neutral-850 text-xs font-mono">
                {progression.map((p, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between tabular-nums">
                    <span className="text-neutral-400">{formatBrDate(p.date)}</span>
                    <span className="font-semibold text-neutral-200">{p.bestSet}</span>
                    <span className="text-emerald-400">1RM est: {p.estimated1RM} kg</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                Nenhum histórico registrado para este exercício ainda. Complete um treino para acompanhar a carga.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
