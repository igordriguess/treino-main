import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit3, Upload, X, Check, Dumbbell, Eye, Loader2 } from 'lucide-react';
import { CardioTarget, Exercise, MuscleGroup } from '../types/workout';
import { CARDIO_FIELDS, MUSCLE_GROUP_LABELS, cleanCardio, formatPrescription, isCardio } from '../utils/calculations';
import { useDialog } from './DialogProvider';
import { NumberInput } from './NumberInput';
import { MAX_IMAGE_BYTES, uploadImage } from '../utils/storage';

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
  const { confirm, notify } = useDialog();
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
  const [restSeconds, setRestSeconds] = useState(30);
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [defaultWeightKg, setDefaultWeightKg] = useState<number | undefined>(undefined);
  const [cardio, setCardio] = useState<CardioTarget>({});
  const [uploading, setUploading] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingExercise(null);
    setName('');
    setMuscleGroup('peito');
    setTargetSets(3);
    setTargetReps('10 - 12');
    setRestSeconds(30);
    setImageUrl('');
    setNotes('');
    setDefaultWeightKg(undefined);
    setCardio({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ex: Exercise) => {
    setEditingExercise(ex);
    setName(ex.name);
    setMuscleGroup(ex.muscleGroup);
    setTargetSets(ex.targetSets || 3);
    setTargetReps(ex.targetReps || '10 - 12');
    setRestSeconds(ex.restSeconds || 30);
    setImageUrl(ex.imageUrl || '');
    setNotes(ex.notes || '');
    setDefaultWeightKg(ex.defaultWeightKg);
    setCardio(ex.cardio || {});
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      notify('Arquivo muito grande. O limite é de 4MB para imagem ou GIF.', 'error');
      return;
    }

    setUploading(true);
    try {
      setImageUrl(await uploadImage(file));
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Não foi possível enviar a imagem.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify('Informe o nome do exercício.', 'error');
      return;
    }

    const saved: Exercise = {
      id: editingExercise ? editingExercise.id : `ex-${Date.now()}`,
      name: name.trim(),
      muscleGroup,
      targetSets: Number(targetSets) || 3,
      targetReps: targetReps.trim() || '10 - 12',
      restSeconds: Number(restSeconds) || 30,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      defaultWeightKg: muscleGroup !== 'cardio' && defaultWeightKg ? Number(defaultWeightKg) : undefined,
      cardio: muscleGroup === 'cardio' ? cleanCardio(cardio) : undefined,
    };

    onSaveExercise(saved);
    setIsModalOpen(false);
  };

  // Filter exercises
  const filtered = exercises.filter((ex) => {
    const matchQuery = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMuscle = filterMuscle === 'todos' || ex.muscleGroup === filterMuscle;
    return matchQuery && matchMuscle;
  });

  // With "Todos os Grupos Musculares" the list is shown in alphabetical order
  if (filterMuscle === 'todos') {
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  }

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
                      {isCardio(ex) ? (
                        <span>{formatPrescription(ex)}</span>
                      ) : (
                        <>
                          <span>{ex.targetSets} séries</span>
                          <span aria-hidden="true" className="text-neutral-700">·</span>
                          <span>{ex.targetReps} reps</span>
                          <span aria-hidden="true" className="text-neutral-700">·</span>
                          <span>{ex.restSeconds}s</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {ex.notes && (
                  <p className="mt-2.5 text-xs text-neutral-400 line-clamp-2 italic bg-neutral-950/40 p-2 rounded border border-neutral-800">
                    "{ex.notes}"
                  </p>
                )}
              </div>

              {/* Action buttons footer */}
              <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center justify-between">
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
                    className="p-2.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                    title="Editar exercício"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Excluir exercício?',
                        message: `"${ex.name}" será removido da biblioteca. Treinos que já usam este exercício não serão alterados.`,
                        confirmLabel: 'Excluir',
                        tone: 'danger',
                      });
                      if (ok) onDeleteExercise(ex.id);
                    }}
                    className="p-2.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Excluir exercício"
                  >
                    <Trash2 className="h-4 w-4" />
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
          </div>
        </div>
      )}

      {/* Create / Edit Exercise Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-6 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full sm:max-w-lg h-dvh sm:h-auto sm:max-h-[92vh] sm:rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950/80">
              <h2 className="text-base font-bold text-neutral-100 tracking-tight">
                {editingExercise ? 'Editar Exercício' : 'Novo Exercício'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar"
                className="rounded-lg p-2 -mr-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Nome do Exercício *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Supino Reto com Barra"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Grupo Muscular
                </label>
                <select
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                >
                  {Object.entries(MUSCLE_GROUP_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {muscleGroup === 'cardio' ? (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-3.5 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-neutral-200">Metas de Cardio</p>
                    <p className="text-[11px] text-neutral-500">Campos em branco aparecem para o aluno como "Livre".</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {CARDIO_FIELDS.map((f) => (
                      <div key={f.key}>
                        <span className="block text-xs font-semibold text-neutral-300 mb-1.5">
                          {f.label} <span className="font-normal text-neutral-500">({f.unit})</span>
                        </span>
                        <NumberInput
                          value={cardio[f.key]}
                          onChange={(v) => setCardio({ ...cardio, [f.key]: v })}
                          min={0}
                          step={Number(f.step)}
                          allowEmpty
                          placeholder="Livre"
                          surface="sunken"
                          aria-label={f.label}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs font-semibold text-neutral-300 mb-1.5">Séries Alvo</span>
                    <NumberInput
                      value={targetSets}
                      onChange={(v) => setTargetSets(v ?? 1)}
                      min={1}
                      max={20}
                      surface="sunken"
                      aria-label="Séries alvo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Repetições
                    </label>
                    <input
                      type="text"
                      value={targetReps}
                      onChange={(e) => setTargetReps(e.target.value)}
                      placeholder="8 - 12"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 sm:py-2 text-center text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Carga <span className="font-normal text-neutral-500">(kg)</span>
                    </span>
                    <NumberInput
                      value={defaultWeightKg}
                      onChange={setDefaultWeightKg}
                      min={0}
                      step={0.5}
                      allowEmpty
                      placeholder="Livre"
                      surface="sunken"
                      aria-label="Carga em kg"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Descanso <span className="font-normal text-neutral-500">(s)</span>
                    </span>
                    <NumberInput
                      value={restSeconds}
                      onChange={(v) => setRestSeconds(v ?? 0)}
                      min={0}
                      max={600}
                      step={5}
                      surface="sunken"
                      aria-label="Descanso em segundos"
                    />
                  </div>
                </div>
              )}

              {/* Media URL & Upload */}
              <div className="space-y-2 border-t border-neutral-800 pt-3">
                <label className="block text-xs font-semibold text-neutral-300">
                  Imagem ou GIF Demonstrativo
                </label>
                <div className="flex gap-2">
                  {imageUrl.startsWith('data:') || imageUrl.startsWith('/api/uploads/') ? (
                    <div className="flex-1 flex items-center rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-400">
                      Arquivo enviado do dispositivo
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Link do GIF ou foto (https://...)"
                      className="flex-1 min-w-0 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                    />
                  )}
                  <label className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-3.5 py-2.5 text-sm font-semibold text-neutral-200">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>{uploading ? 'Enviando...' : 'Enviar'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                      className="hidden"
                      disabled={uploading}
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
                      className="absolute top-2 right-2 p-2 rounded-md bg-black/80 text-neutral-300 hover:text-rose-400"
                      title="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Como executar <span className="font-normal text-neutral-500">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Escápulas travadas, cotovelos alinhados a 45°, pausa embaixo..."
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              </div>

              {/* Submit footer, pinned to the bottom of the modal */}
              <div className="shrink-0 flex gap-2 border-t border-neutral-800 bg-neutral-950/80 px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 sm:py-2 text-sm sm:text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-3 sm:py-2 text-sm sm:text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
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
