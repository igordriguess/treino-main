import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Check, 
  Dumbbell, 
  Sparkles,
  Eye,
  Filter
} from 'lucide-react';
import { Exercise, MuscleGroup } from '../types/workout';
import { MUSCLE_GROUP_LABELS } from '../utils/calculations';
import { EXERCISE_SUGGESTIONS } from '../data/defaultData';

interface ExerciseManagerViewProps {
  exercises: Exercise[];
  onSaveExercise: (exercise: Exercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onSelectExerciseToView: (exercise: Exercise) => void;
}

export const ExerciseManagerView: React.FC<ExerciseManagerViewProps> = ({
  exercises,
  onSaveExercise,
  onDeleteExercise,
  onSelectExerciseToView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<string>('todos');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('peito');
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState('10 - 12');
  const [restSeconds, setRestSeconds] = useState(60);
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [defaultWeightKg, setDefaultWeightKg] = useState<number | undefined>(undefined);

  const handleOpenCreateModal = () => {
    setEditingExercise(null);
    setName('');
    setMuscleGroup('peito');
    setTargetSets(3);
    setTargetReps('10 - 12');
    setRestSeconds(60);
    setImageUrl('');
    setNotes('');
    setDefaultWeightKg(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ex: Exercise) => {
    setEditingExercise(ex);
    setName(ex.name);
    setMuscleGroup(ex.muscleGroup);
    setTargetSets(ex.targetSets || 3);
    setTargetReps(ex.targetReps || '10 - 12');
    setRestSeconds(ex.restSeconds || 60);
    setImageUrl(ex.imageUrl || '');
    setNotes(ex.notes || '');
    setDefaultWeightKg(ex.defaultWeightKg);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. O limite máximo é de 5MB para imagem ou GIF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome do exercício.');
      return;
    }

    const saved: Exercise = {
      id: editingExercise ? editingExercise.id : `ex-${Date.now()}`,
      name: name.trim(),
      muscleGroup,
      targetSets: Number(targetSets) || 3,
      targetReps: targetReps.trim() || '10 - 12',
      restSeconds: Number(restSeconds) || 60,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      defaultWeightKg: defaultWeightKg ? Number(defaultWeightKg) : undefined,
    };

    onSaveExercise(saved);
    setIsModalOpen(false);
  };

  const handleAddDefaultTemplates = () => {
    if (confirm('Deseja carregar sugestões padrão de exercícios para começar?')) {
      EXERCISE_SUGGESTIONS.forEach((sug, idx) => {
        const item: Exercise = {
          id: `ex-std-${Date.now()}-${idx}`,
          name: sug.name || 'Exercício',
          muscleGroup: sug.muscleGroup || 'peito',
          targetSets: sug.targetSets || 3,
          targetReps: sug.targetReps || '10-12',
          restSeconds: sug.restSeconds || 60,
          notes: sug.notes,
        };
        onSaveExercise(item);
      });
    }
  };

  // Filter exercises
  const filtered = exercises.filter((ex) => {
    const matchQuery = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMuscle = filterMuscle === 'todos' || ex.muscleGroup === filterMuscle;
    return matchQuery && matchMuscle;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
            Biblioteca do Treinador
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 mt-0.5">
            Gerenciamento de Exercícios
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Crie e edite exercícios com imagens, GIFs demonstrativos, descanso e orientações técnicas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {exercises.length === 0 && (
            <button
              onClick={handleAddDefaultTemplates}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Carregar Sugestões</span>
            </button>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Exercício</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div className="text-xs font-medium text-neutral-400 font-mono">
          Total de exercícios cadastrados: <strong className="text-neutral-200">{filtered.length}</strong>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Muscle filter */}
          <select
            value={filterMuscle}
            onChange={(e) => setFilterMuscle(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="todos">Todos os Grupos Musculares</option>
            {Object.entries(MUSCLE_GROUP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative sm:w-56">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar exercício..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Exercises Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="group rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 transition-all hover:border-neutral-700 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3">
                  {/* Thumbnail / GIF preview */}
                  <div
                    onClick={() => onSelectExerciseToView(ex)}
                    className="relative h-14 w-14 rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer group-hover:border-emerald-500/40 transition-colors"
                    title="Clique para ver GIF / Foto ampliada"
                  >
                    {ex.imageUrl ? (
                      <img
                        src={ex.imageUrl}
                        alt={ex.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Dumbbell className="h-5 w-5 text-neutral-600" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-mono">
                        {MUSCLE_GROUP_LABELS[ex.muscleGroup] || ex.muscleGroup}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-neutral-100 mt-1 truncate">
                      {ex.name}
                    </h3>

                    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
                      <span>{ex.targetSets} séries</span>
                      <span aria-hidden="true" className="text-neutral-700">·</span>
                      <span>{ex.targetReps} reps</span>
                      <span aria-hidden="true" className="text-neutral-700">·</span>
                      <span>{ex.restSeconds}s</span>
                    </div>
                  </div>
                </div>

                {ex.notes && (
                  <p className="mt-2.5 text-xs text-neutral-400 line-clamp-2 italic bg-neutral-950/40 p-2 rounded border border-neutral-850">
                    "{ex.notes}"
                  </p>
                )}
              </div>

              {/* Action buttons footer */}
              <div className="mt-3 pt-2.5 border-t border-neutral-850 flex items-center justify-between">
                <button
                  onClick={() => onSelectExerciseToView(ex)}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 font-medium transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  <span>Ver Demonstração</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(ex)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                    title="Editar exercício"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir o exercício "${ex.name}"?`)) {
                        onDeleteExercise(ex.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Excluir exercício"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-12 text-center">
          <Dumbbell className="h-10 w-10 mx-auto text-neutral-600 mb-3" />
          <h3 className="text-base font-bold text-neutral-200">
            Nenhum exercício encontrado
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 leading-relaxed">
            Cadastre os exercícios que você costuma prescrever aos alunos, com GIFs e parâmetros padrão.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Exercício</span>
            </button>
            <button
              onClick={handleAddDefaultTemplates}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Carregar Sugestões</span>
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Exercise Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/80">
              <h2 className="text-base font-bold text-neutral-100 tracking-tight">
                {editingExercise ? 'Editar Exercício' : 'Novo Exercício'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nome do Exercício *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Supino Reto com Barra"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Grupo Muscular
                  </label>
                  <select
                    value={muscleGroup}
                    onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  >
                    {Object.entries(MUSCLE_GROUP_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Séries Alvo
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={targetSets}
                    onChange={(e) => setTargetSets(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Repetições Padrão
                  </label>
                  <input
                    type="text"
                    value={targetReps}
                    onChange={(e) => setTargetReps(e.target.value)}
                    placeholder="8 - 12"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Descanso (segundos)
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={restSeconds}
                    onChange={(e) => setRestSeconds(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono"
                  />
                </div>
              </div>

              {/* Media URL & Upload */}
              <div className="space-y-2 border-t border-neutral-850 pt-3">
                <label className="block text-xs font-semibold text-neutral-300">
                  Imagem ou GIF Demonstrativo
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="URL do GIF ou foto (ex: https://...)"
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-750 px-3 py-1.5 text-xs font-semibold text-neutral-200">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {imageUrl && (
                  <div className="mt-2 relative h-36 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-full w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 text-neutral-300 hover:text-rose-400"
                      title="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Dicas de Postura & Execução Técnica (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Escápulas travadas, cotovelos alinhados a 45°, pausa embaixo..."
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Submit footer inside modal */}
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingExercise ? 'Salvar Alterações' : 'Cadastrar Exercício'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
