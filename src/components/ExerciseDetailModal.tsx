import React, { useState } from 'react';
import { X, Dumbbell, Maximize2 } from 'lucide-react';
import { Exercise } from '../types/workout';
import { MUSCLE_GROUP_LABELS, formatPrescription } from '../utils/calculations';
import { ImageLightbox } from './ImageLightbox';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
  const [expandedImage, setExpandedImage] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-6 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-2xl h-dvh sm:h-auto sm:max-h-[90vh] sm:rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950/70">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                {MUSCLE_GROUP_LABELS[exercise.muscleGroup] || 'Musculação'}
              </span>
              <span aria-hidden="true" className="text-neutral-700">·</span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">
                {formatPrescription(exercise)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-100 tracking-tight mt-0.5">
              {exercise.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-2 -mr-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Visual Showcase (GIF or Image) */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden min-h-55 flex items-center justify-center">
            {exercise.imageUrl ? (
              <button
                type="button"
                onClick={() => setExpandedImage(true)}
                className="group relative block w-full cursor-zoom-in"
                aria-label="Expandir imagem"
              >
                <img
                  src={exercise.imageUrl}
                  alt={exercise.name}
                  className="w-full max-h-[360px] object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-200 group-hover:bg-black/90 transition-colors">
                  <Maximize2 className="h-3.5 w-3.5" />
                  Ampliar
                </span>
              </button>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Dumbbell className="h-10 w-10 text-neutral-600 mb-2" />
                <p className="text-sm font-medium text-neutral-300">Nenhum GIF ou imagem anexada</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Adicione uma imagem ou GIF editando o exercício na aba Exercícios.
                </p>
              </div>
            )}
          </div>

          {/* Instructions and execution cues */}
          {exercise.notes && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Como executar
              </h4>
              <p className="whitespace-pre-line text-sm text-neutral-200 leading-relaxed">
                {exercise.notes}
              </p>
            </div>
          )}
        </div>
      </div>
      {expandedImage && exercise.imageUrl && (
        <ImageLightbox src={exercise.imageUrl} alt={exercise.name} onClose={() => setExpandedImage(false)} />
      )}
    </div>
  );
};
