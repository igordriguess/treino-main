import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Upload, Clock, Calendar, Check, Dumbbell, UserCheck } from 'lucide-react';
import { WorkoutRoutine, Exercise, MuscleGroup, DayOfWeek, StudentAccount } from '../types/workout';
import { DAYS_CONFIG, MUSCLE_GROUP_LABELS } from '../utils/calculations';
import { EXERCISE_SUGGESTIONS } from '../data/defaultData';

interface RoutineEditorModalProps {
  routine: WorkoutRoutine | null;
  students: StudentAccount[];
  availableExercises?: Exercise[];
  initialStudentId?: string;
  onSave: (routine: WorkoutRoutine) => void;
  onClose: () => void;
}

export const RoutineEditorModal: React.FC<RoutineEditorModalProps> = ({
  routine,
  students,
  availableExercises = [],
  initialStudentId,
  onSave,
  onClose,
}) => {
  const isEditing = !!routine;

  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [studentId, setStudentId] = useState(routine?.studentId || initialStudentId || 'all');
  const [scheduledDay, setScheduledDay] = useState<DayOfWeek>(routine?.scheduledDay || 'segunda');
  const [durationMinutes, setDurationMinutes] = useState(routine?.durationMinutes || 60);
  const [exercises, setExercises] = useState<Exercise[]>(
    routine?.exercises ? JSON.parse(JSON.stringify(routine.exercises)) : []
  );

  // Suggestions drawer state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customExerciseFormOpen, setCustomExerciseFormOpen] = useState(false);

  // New custom exercise state
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('peito');
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState('10 - 12');
  const [newExRest, setNewExRest] = useState(60);
  const [newExImage, setNewExImage] = useState('');
  const [newExNotes, setNewExNotes] = useState('');

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;
    const updated = [...exercises];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateExerciseField = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleAddFromSuggestions = (sug: Partial<Exercise>) => {
    const newEx: Exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: sug.name || 'Exercício',
      muscleGroup: sug.muscleGroup || 'peito',
      targetSets: sug.targetSets || 3,
      targetReps: sug.targetReps || '10-12',
      restSeconds: sug.restSeconds || 60,
      imageUrl: sug.imageUrl || undefined,
      notes: sug.notes || undefined,
    };
    setExercises([...exercises, newEx]);
    setShowSuggestions(false);
  };

  const handleCreateCustomExercise = () => {
    if (!newExName.trim()) return;
    const customEx: Exercise = {
      id: `custom-ex-${Date.now()}`,
      name: newExName.trim(),
      muscleGroup: newExMuscle,
      targetSets: Number(newExSets) || 3,
      targetReps: newExReps || '10',
      restSeconds: Number(newExRest) || 60,
      imageUrl: newExImage.trim() || undefined,
      notes: newExNotes.trim() || undefined,
    };
    setExercises([...exercises, customEx]);
    setCustomExerciseFormOpen(false);
    setNewExName('');
    setNewExImage('');
    setNewExNotes('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetExerciseIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Limite de 5MB para imagens e GIFs.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        handleUpdateExerciseField(targetExerciseIndex, 'imageUrl', event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome do treino.');
      return;
    }

    const updatedRoutine: WorkoutRoutine = {
      id: routine?.id || `routine-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      studentId: studentId || 'all',
      scheduledDay,
      durationMinutes: Number(durationMinutes) || 60,
      exercises,
      coverImage: exercises.find((e) => e.imageUrl)?.imageUrl || routine?.coverImage,
    };

    onSave(updatedRoutine);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/70">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 tracking-tight">
              {isEditing ? 'Editar Treino' : 'Criar Novo Treino'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Monte o treino, adicione os exercícios, repetições, cargas e vincule ao aluno.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Routine Meta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nome do Treino *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Treino A · Peitoral & Tríceps Hipertrofia"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Student assignment */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                Vincular ao Aluno
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">Geral (Todos os Alunos)</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    Aluno: {st.name} ({st.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Dia Sugerido
              </label>
              <select
                value={scheduledDay}
                onChange={(e) => setScheduledDay(e.target.value as DayOfWeek)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
              >
                {DAYS_CONFIG.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Instruções / Foco do Treino (opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aquecer manguito 2 séries, intervalo estrito de 60s entre séries..."
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Exercises Builder */}
          <div className="border-t border-neutral-800 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Exercícios ({exercises.length})
                </h3>
                <p className="text-xs text-neutral-400">
                  Adicione os exercícios, séries e imagens ou GIFs demonstrativos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestions(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:border-neutral-600 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Sugestões</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomExerciseFormOpen(!customExerciseFormOpen)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo Exercício</span>
                </button>
              </div>
            </div>

            {/* Quick custom exercise form */}
            {customExerciseFormOpen && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Adicionar Exercício
                  </h4>
                  <button
                    type="button"
                    onClick={() => setCustomExerciseFormOpen(false)}
                    className="text-neutral-400 hover:text-neutral-200 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nome do exercício (ex: Tríceps Francês)"
                      value={newExName}
                      onChange={(e) => setNewExName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600"
                    />
                  </div>
                  <div>
                    <select
                      value={newExMuscle}
                      onChange={(e) => setNewExMuscle(e.target.value as MuscleGroup)}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100"
                    >
                      {Object.entries(MUSCLE_GROUP_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-neutral-400">Séries</label>
                    <input
                      type="number"
                      value={newExSets}
                      onChange={(e) => setNewExSets(Number(e.target.value))}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400">Repetições</label>
                    <input
                      type="text"
                      value={newExReps}
                      onChange={(e) => setNewExReps(e.target.value)}
                      placeholder="8 - 12"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400">Descanso (s)</label>
                    <input
                      type="number"
                      value={newExRest}
                      onChange={(e) => setNewExRest(Number(e.target.value))}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="url"
                    placeholder="URL de Imagem ou GIF (opcional)"
                    value={newExImage}
                    onChange={(e) => setNewExImage(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateCustomExercise}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors"
                  >
                    Adicionar ao Treino
                  </button>
                </div>
              </div>
            )}

            {/* Exercise items list */}
            <div className="space-y-3">
              {exercises.map((ex, index) => (
                <div
                  key={ex.id || index}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 transition-all hover:border-neutral-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Media preview / upload */}
                      <div className="relative group shrink-0">
                        {ex.imageUrl ? (
                          <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800">
                            <img
                              src={ex.imageUrl}
                              alt={ex.name}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateExerciseField(index, 'imageUrl', undefined)}
                              className="absolute top-0.5 right-0.5 rounded bg-black/80 p-0.5 text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity"
                              title="Remover imagem"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <label
                            className="flex h-14 w-14 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                            title="Upload de GIF ou Imagem"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="text-[9px] mt-0.5">GIF/Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, index)}
                            />
                          </label>
                        )}
                      </div>

                      {/* Name & inputs */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-neutral-500 font-semibold tabular-nums">
                            {(index + 1).toString().padStart(2, '0')}.
                          </span>
                          <input
                            type="text"
                            value={ex.name}
                            onChange={(e) => handleUpdateExerciseField(index, 'name', e.target.value)}
                            className="flex-1 font-semibold text-sm text-neutral-100 bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-emerald-500 focus:outline-none"
                            placeholder="Nome do Exercício"
                          />
                          <select
                            value={ex.muscleGroup}
                            onChange={(e) => handleUpdateExerciseField(index, 'muscleGroup', e.target.value)}
                            className="text-[11px] rounded bg-neutral-900 border border-neutral-700 px-2 py-0.5 text-neutral-300 focus:outline-none"
                          >
                            {Object.entries(MUSCLE_GROUP_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>

                        {/* Series & Reps */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-400 text-[11px]">Séries:</span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={ex.targetSets}
                              onChange={(e) => handleUpdateExerciseField(index, 'targetSets', Number(e.target.value))}
                              className="w-12 rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 font-mono tabular-nums text-center text-xs text-neutral-100"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-400 text-[11px]">Reps:</span>
                            <input
                              type="text"
                              value={ex.targetReps}
                              onChange={(e) => handleUpdateExerciseField(index, 'targetReps', e.target.value)}
                              placeholder="8-12"
                              className="w-16 rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 font-mono tabular-nums text-center text-xs text-neutral-100"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-400 text-[11px]">Descanso:</span>
                            <input
                              type="number"
                              min="10"
                              max="300"
                              step="5"
                              value={ex.restSeconds}
                              onChange={(e) => handleUpdateExerciseField(index, 'restSeconds', Number(e.target.value))}
                              className="w-14 rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 font-mono tabular-nums text-center text-xs text-neutral-100"
                            />
                            <span className="text-neutral-500 text-[11px]">s</span>
                          </div>

                          {/* GIF Link trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              const newUrl = prompt('Insira o link (URL) da imagem ou GIF do exercício:', ex.imageUrl || '');
                              if (newUrl !== null) {
                                handleUpdateExerciseField(index, 'imageUrl', newUrl.trim() || undefined);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors ml-auto"
                          >
                            <ImageIcon className="h-3 w-3" />
                            <span>{ex.imageUrl ? 'Alterar Link GIF' : '+ Link GIF'}</span>
                          </button>
                        </div>

                        {/* Notes */}
                        <input
                          type="text"
                          value={ex.notes || ''}
                          onChange={(e) => handleUpdateExerciseField(index, 'notes', e.target.value)}
                          placeholder="Observações da execução (ex: cadência controlada, pausa embaixo)..."
                          className="w-full text-xs text-neutral-400 placeholder:text-neutral-600 bg-transparent border-none p-0 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Up / Down / Remove */}
                    <div className="flex items-center gap-1 self-end sm:self-start shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveExercise(index, 'up')}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-30"
                        title="Mover para cima"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === exercises.length - 1}
                        onClick={() => handleMoveExercise(index, 'down')}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(index)}
                        className="rounded p-1 text-neutral-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors ml-1"
                        title="Remover exercício"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {exercises.length === 0 && (
                <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center">
                  <Dumbbell className="h-8 w-8 mx-auto text-neutral-600 mb-2" />
                  <p className="text-sm font-medium text-neutral-300">Nenhum exercício neste treino</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Adicione exercícios sugeridos ou crie um do zero com suas metas de séries e repetições.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(true)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Ver Sugestões
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950/70 px-6 py-4">
          <div className="text-xs text-neutral-500 font-mono tabular-nums">
            {exercises.length} exercícios
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              <Check className="h-4 w-4" />
              <span>{isEditing ? 'Salvar Alterações' : 'Salvar Treino'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions and Exercise Library Drawer */}
      {showSuggestions && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5 bg-neutral-950">
              <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                {availableExercises.length > 0 ? 'Banco de Exercícios Cadastrados' : 'Sugestões Rápidas de Exercícios'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="text-neutral-400 hover:text-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {availableExercises.length > 0 ? (
                availableExercises.map((libEx) => (
                  <div
                    key={libEx.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {libEx.imageUrl ? (
                        <img
                          src={libEx.imageUrl}
                          alt={libEx.name}
                          className="h-10 w-10 rounded-md object-cover border border-neutral-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-neutral-850 flex items-center justify-center text-neutral-500 shrink-0">
                          <Dumbbell className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-neutral-100 truncate">
                          {libEx.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
                          <span className="text-emerald-400 font-medium">
                            {MUSCLE_GROUP_LABELS[libEx.muscleGroup || 'peito']}
                          </span>
                          <span aria-hidden="true" className="text-neutral-700">·</span>
                          <span>{libEx.targetSets} séries × {libEx.targetReps}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFromSuggestions(libEx)}
                      className="ml-3 inline-flex items-center gap-1 rounded-md bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition-colors shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                ))
              ) : (
                EXERCISE_SUGGESTIONS.map((sug, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 hover:border-neutral-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-neutral-100 truncate">
                        {sug.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
                        <span className="text-emerald-400 font-medium">
                          {MUSCLE_GROUP_LABELS[sug.muscleGroup || 'peito']}
                        </span>
                        <span aria-hidden="true" className="text-neutral-700">·</span>
                        <span>{sug.targetSets} séries × {sug.targetReps}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFromSuggestions(sug)}
                      className="ml-3 inline-flex items-center gap-1 rounded-md bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition-colors shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
