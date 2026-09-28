import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Search, Check, Dumbbell, UserCheck, Library } from 'lucide-react';
import { useDialog } from './DialogProvider';
import { NumberInput } from './NumberInput';
import { WorkoutRoutine, Exercise, DayOfWeek, StudentAccount } from '../types/workout';
import { CARDIO_FIELDS, DAYS_CONFIG, MUSCLE_GROUP_LABELS, cleanCardio, formatPrescription, isCardio } from '../utils/calculations';

interface RoutineEditorModalProps {
  routine: WorkoutRoutine | null;
  students: StudentAccount[];
  availableExercises?: Exercise[];
  initialStudentId?: string;
  onSave: (routine: WorkoutRoutine) => void;
  onClose: () => void;
  onGoToExercises?: () => void;
}

export const RoutineEditorModal: React.FC<RoutineEditorModalProps> = ({
  routine,
  students,
  availableExercises = [],
  initialStudentId,
  onSave,
  onClose,
  onGoToExercises,
}) => {
  const isEditing = !!routine;
  const { notify } = useDialog();

  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [studentIds, setStudentIds] = useState<string[]>(
    routine?.studentIds ?? (initialStudentId ? [initialStudentId] : [])
  );
  const [scheduledDay, setScheduledDay] = useState<DayOfWeek>(routine?.scheduledDay || 'segunda');
  const [durationMinutes] = useState(routine?.durationMinutes || 60);
  const [exercises, setExercises] = useState<Exercise[]>(
    routine?.exercises ? JSON.parse(JSON.stringify(routine.exercises)) : []
  );

  // Library picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerMuscle, setPickerMuscle] = useState<string>('todos');
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);

  const assignedLibraryIds = useMemo(
    () => new Set(exercises.map((e) => e.libraryExerciseId).filter(Boolean) as string[]),
    [exercises]
  );

  const filteredLibrary = availableExercises.filter((libEx) => {
    const matchQuery = libEx.name.toLowerCase().includes(pickerQuery.trim().toLowerCase());
    const matchMuscle = pickerMuscle === 'todos' || libEx.muscleGroup === pickerMuscle;
    return matchQuery && matchMuscle;
  });

  const handleOpenPicker = () => {
    setPickerQuery('');
    setPickerMuscle('todos');
    setPickerSelected([]);
    setShowPicker(true);
  };

  const handleTogglePick = (libId: string) => {
    setPickerSelected((prev) =>
      prev.includes(libId) ? prev.filter((id) => id !== libId) : [...prev, libId]
    );
  };

  const handleAssignSelected = () => {
    // Keep the order in which the exercises appear in the library
    const toAdd = availableExercises
      .filter((libEx) => pickerSelected.includes(libEx.id) && !assignedLibraryIds.has(libEx.id))
      .map<Exercise>((libEx) => ({
        ...libEx,
        id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        libraryExerciseId: libEx.id,
      }));
    setExercises([...exercises, ...toAdd]);
    setShowPicker(false);
  };

  const handleToggleStudent = (id: string) => {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify('Informe o nome do treino.', 'error');
      return;
    }

    const updatedRoutine: WorkoutRoutine = {
      id: routine?.id || `routine-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      studentIds,
      scheduledDay,
      durationMinutes: Number(durationMinutes) || 60,
      exercises: exercises.map((ex) => (isCardio(ex) ? { ...ex, cardio: cleanCardio(ex.cardio) } : ex)),
    };

    onSave(updatedRoutine);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-6 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-3xl h-dvh sm:h-auto sm:max-h-[92vh] sm:rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950/70">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 tracking-tight">
              {isEditing ? 'Editar Treino' : 'Criar Novo Treino'}
            </h2>
            <p className="hidden sm:block text-xs text-neutral-400 mt-0.5">
              Monte o treino, atribua exercícios cadastrados na biblioteca e vincule ao aluno.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-2 -mr-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
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

            {/* Day of Week */}
            <div className="sm:col-span-2">
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

            {/* Student assignment (zero or more) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Alunos Vinculados
                  <span className="font-normal text-neutral-500">
                    ({studentIds.length === 0 ? 'nenhum' : studentIds.length})
                  </span>
                </label>
                {students.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setStudentIds(studentIds.length === students.length ? [] : students.map((st) => st.id))
                    }
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    {studentIds.length === students.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                )}
              </div>
              {students.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {students.map((st) => {
                    const checked = studentIds.includes(st.id);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleToggleStudent(st.id)}
                        aria-pressed={checked}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 sm:py-1 text-sm sm:text-xs font-medium transition-colors ${
                          checked
                            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                            : 'border-neutral-700 bg-neutral-950 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                        {st.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  Nenhum aluno cadastrado. O treino será salvo sem aluno vinculado.
                </p>
              )}
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
                  Atribua exercícios da biblioteca e ajuste séries, repetições e descanso para este treino.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenPicker}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Atribuir Exercícios</span>
              </button>
            </div>


            {/* Exercise items list */}
            <div className="space-y-3">
              {exercises.map((ex, index) => (
                <div
                  key={ex.id || index}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3 sm:p-4 transition-all hover:border-neutral-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Media preview (managed in the exercise library) */}
                      {ex.imageUrl ? (
                        <img
                          src={ex.imageUrl}
                          alt={ex.name}
                          className="h-14 w-14 shrink-0 rounded-lg object-cover border border-neutral-700 bg-neutral-800"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.visibility = 'hidden';
                          }}
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-600">
                          <Dumbbell className="h-5 w-5" />
                        </div>
                      )}

                      {/* Name & inputs */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-neutral-500 font-semibold tabular-nums">
                            {(index + 1).toString().padStart(2, '0')}.
                          </span>
                          <span className="flex-1 truncate font-semibold text-sm text-neutral-100">
                            {ex.name}
                          </span>
                          <span className="shrink-0 text-[11px] rounded bg-neutral-900 border border-neutral-700 px-2 py-0.5 text-emerald-400">
                            {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                          </span>
                        </div>

                        {/* Prescription */}
                        {isCardio(ex) ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {CARDIO_FIELDS.map((f) => (
                              <div key={f.key}>
                                <span className="block text-[11px] font-medium text-neutral-400 mb-1">
                                  {f.label} <span className="text-neutral-600">({f.unit})</span>
                                </span>
                                <NumberInput
                                  value={ex.cardio?.[f.key]}
                                  onChange={(v) => handleUpdateExerciseField(index, 'cardio', { ...ex.cardio, [f.key]: v })}
                                  min={0}
                                  step={Number(f.step)}
                                  allowEmpty
                                  placeholder="Livre"
                                  aria-label={f.label}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <span className="block text-[11px] font-medium text-neutral-400 mb-1">Séries</span>
                              <NumberInput
                                value={ex.targetSets}
                                onChange={(v) => handleUpdateExerciseField(index, 'targetSets', v ?? 1)}
                                min={1}
                                max={20}
                                aria-label="Séries"
                              />
                            </div>
                            <div>
                              <label htmlFor={`reps-${ex.id}`} className="block text-[11px] font-medium text-neutral-400 mb-1">Repetições</label>
                              <input
                                id={`reps-${ex.id}`}
                                type="text"
                                value={ex.targetReps}
                                onChange={(e) => handleUpdateExerciseField(index, 'targetReps', e.target.value)}
                                placeholder="8-12"
                                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-2.5 sm:py-2 text-center font-mono tabular-nums text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <span className="block text-[11px] font-medium text-neutral-400 mb-1">
                                Carga <span className="text-neutral-600">(kg)</span>
                              </span>
                              <NumberInput
                                value={ex.defaultWeightKg}
                                onChange={(v) => handleUpdateExerciseField(index, 'defaultWeightKg', v)}
                                min={0}
                                step={0.5}
                                allowEmpty
                                placeholder="Livre"
                                aria-label="Carga em kg"
                              />
                            </div>
                            <div>
                              <span className="block text-[11px] font-medium text-neutral-400 mb-1">
                                Descanso <span className="text-neutral-600">(s)</span>
                              </span>
                              <NumberInput
                                value={ex.restSeconds}
                                onChange={(v) => handleUpdateExerciseField(index, 'restSeconds', v ?? 0)}
                                min={0}
                                max={600}
                                step={5}
                                aria-label="Descanso em segundos"
                              />
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <label htmlFor={`notes-${ex.id}`} className="block text-[11px] font-medium text-neutral-400 mb-1">
                            Observações da execução <span className="text-neutral-600">(opcional)</span>
                          </label>
                          <textarea
                            id={`notes-${ex.id}`}
                            rows={2}
                            value={ex.notes || ''}
                            onChange={(e) => handleUpdateExerciseField(index, 'notes', e.target.value)}
                            placeholder="Ex: cadência controlada, pausa de 1s embaixo, amplitude completa..."
                            className="block w-full resize-y rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm sm:text-xs leading-relaxed text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Up / Down / Remove */}
                    <div className="flex items-center gap-1 self-end sm:self-start shrink-0 border-t border-neutral-800 sm:border-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveExercise(index, 'up')}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-30"
                        title="Mover para cima"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === exercises.length - 1}
                        onClick={() => handleMoveExercise(index, 'down')}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(index)}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors ml-1"
                        title="Remover do treino"
                      >
                        <Trash2 className="h-4 w-4" />
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
                    Atribua exercícios já cadastrados na biblioteca e defina as metas de séries e repetições.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenPicker}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Atribuir Exercícios
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-950/70 px-4 sm:px-6 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="hidden sm:block text-xs text-neutral-500 font-mono tabular-nums">
            {exercises.length} exercícios
          </div>

          <div className="flex flex-1 sm:flex-none items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 sm:py-2 text-sm sm:text-xs font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-3 sm:py-2 text-sm sm:text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              <Check className="h-4 w-4" />
              <span>{isEditing ? 'Salvar Alterações' : 'Salvar Treino'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Library Picker */}
      {showPicker && (
        <div className="fixed inset-0 z-60 flex items-stretch sm:items-center justify-center sm:p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg h-dvh sm:h-auto sm:max-h-[80vh] sm:rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5 bg-neutral-950">
              <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                <Library className="h-4 w-4 text-emerald-400" />
                Biblioteca de Exercícios
              </h3>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                aria-label="Fechar"
                className="rounded-lg p-2 -mr-2 text-neutral-400 hover:text-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {availableExercises.length > 0 ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2 border-b border-neutral-800 px-4 py-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
                    <input
                      type="text"
                      autoFocus
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                      placeholder="Buscar exercício..."
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <select
                    value={pickerMuscle}
                    onChange={(e) => setPickerMuscle(e.target.value)}
                    className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="todos">Todos os grupos</option>
                    {Object.entries(MUSCLE_GROUP_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-y-auto p-4 space-y-2 flex-1">
                  {filteredLibrary.map((libEx) => {
                    const alreadyAssigned = assignedLibraryIds.has(libEx.id);
                    const isSelected = pickerSelected.includes(libEx.id);
                    return (
                      <button
                        key={libEx.id}
                        type="button"
                        disabled={alreadyAssigned}
                        onClick={() => handleTogglePick(libEx.id)}
                        className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-950/20'
                            : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                        }`}
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
                            <div className="h-10 w-10 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
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
                              <span>{formatPrescription(libEx)}</span>
                            </div>
                          </div>
                        </div>

                        {alreadyAssigned ? (
                          <span className="ml-3 shrink-0 text-[11px] font-semibold text-neutral-500">No treino</span>
                        ) : (
                          <span
                            className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              isSelected ? 'border-emerald-500 bg-emerald-500 text-neutral-950' : 'border-neutral-600'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {filteredLibrary.length === 0 && (
                    <p className="py-6 text-center text-xs text-neutral-500">
                      Nenhum exercício encontrado com esses filtros.
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center justify-between border-t border-neutral-800 bg-neutral-950/70 px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <span className="text-xs text-neutral-500 font-mono tabular-nums">
                    {pickerSelected.length} selecionado(s)
                  </span>
                  <button
                    type="button"
                    disabled={pickerSelected.length === 0}
                    onClick={handleAssignSelected}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Atribuir ao Treino</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <Dumbbell className="h-8 w-8 mx-auto text-neutral-600 mb-2" />
                <p className="text-sm font-medium text-neutral-300">Nenhum exercício cadastrado</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Cadastre os exercícios na biblioteca para poder atribuí-los aos treinos.
                </p>
                {onGoToExercises && (
                  <button
                    type="button"
                    onClick={onGoToExercises}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Cadastrar Exercícios
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
