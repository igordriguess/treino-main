/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dumbbell, Plus, Search, Users, ShieldCheck, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

import { WorkoutRoutine, WorkoutSessionLog, Exercise, StudentAccount, AuthUser } from './types/workout';
import { AppData, CollectionName, loadAppData, saveCollection, loadCurrentUser, saveCurrentUser } from './utils/storage';
import { getCurrentDayOfWeek } from './utils/calculations';

import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { WorkoutCard } from './components/WorkoutCard';
import { RoutineEditorModal } from './components/RoutineEditorModal';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { StudentManagerView } from './components/StudentManagerView';
import { ExerciseManagerView } from './components/ExerciseManagerView';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { useDialog } from './components/DialogProvider';

export default function App() {
  const { notify } = useDialog();

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => loadCurrentUser());

  // Data state
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [sessions, setSessions] = useState<WorkoutSessionLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');

  // Navigation tab: 'treinos' | 'exercicios' | 'alunos'
  const [activeTab, setActiveTab] = useState<'treinos' | 'exercicios' | 'alunos'>('treinos');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('todos');

  // Modals
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutRoutine | null>(null);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);

  // Load everything from the server (JSON files in ./data)
  // Last JSON sent/received per collection, so unchanged data is never re-written
  const lastSaved = useRef<Partial<Record<CollectionName, string>>>({});

  const fetchData = useCallback(() => {
    setLoadState('loading');
    loadAppData()
      .then((data: AppData) => {
        (Object.keys(data) as CollectionName[]).forEach((name) => {
          lastSaved.current[name] = JSON.stringify(data[name]);
        });
        setStudents(data.students);
        setRoutines(data.routines);
        setSessions(data.sessions);
        setExercises(data.exercises);
        setLoadState('ready');
      })
      .catch((err) => {
        console.error('Failed to load data', err);
        // Network failures come as TypeError; server-side problems carry their own message
        setLoadError(err instanceof TypeError ? '' : err?.message || '');
        setLoadState('error');
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Persist each collection whenever it changes
  const persist = useCallback(
    <K extends CollectionName>(name: K, items: AppData[K]) => {
      if (loadState !== 'ready') return;
      const json = JSON.stringify(items);
      if (lastSaved.current[name] === json) return;
      lastSaved.current[name] = json;
      saveCollection(name, items).catch((err) => {
        console.error(`Failed to save ${name}`, err);
        delete lastSaved.current[name]; // retry on the next change
        notify('Não foi possível salvar as alterações. Verifique se o servidor está rodando.', 'error');
      });
    },
    [loadState, notify]
  );

  useEffect(() => persist('students', students), [students, persist]);
  useEffect(() => persist('routines', routines), [routines, persist]);
  useEffect(() => persist('sessions', sessions), [sessions, persist]);
  useEffect(() => persist('exercises', exercises), [exercises, persist]);

  // Auth actions
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    saveCurrentUser(user);
    setActiveTab('treinos');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveCurrentUser(null);
    setActiveTab('treinos');
  };

  if (loadState !== 'ready') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-neutral-950 px-6 text-center text-neutral-300">
        {loadState === 'loading' ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            <p className="text-sm">Carregando...</p>
          </>
        ) : (
          <>
            <AlertCircle className="h-7 w-7 text-rose-400" />
            <p className="text-sm font-semibold text-neutral-100">Não foi possível conectar ao servidor.</p>
            <p className="max-w-sm text-xs text-neutral-500">
              {loadError || 'Verifique se a plataforma está rodando e tente novamente.'}
            </p>
            <button
              onClick={fetchData}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-neutral-950 hover:bg-emerald-400"
            >
              <RotateCcw className="h-4 w-4" />
              Tentar novamente
            </button>
          </>
        )}
      </div>
    );
  }

  // If not logged in, render Login view
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.role === 'admin';
  const currentDayKey = getCurrentDayOfWeek();

  // If student is logged in, ensure activeTab stays on 'treinos'
  const currentTab = !isAdmin ? 'treinos' : activeTab;

  // Student management handlers
  const handleSaveStudent = (newStudent: StudentAccount) => {
    setStudents([...students, newStudent]);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(students.filter((s) => s.id !== studentId));
    // Clean up routine associations
    setRoutines(routines.map((r) => ({ ...r, studentIds: r.studentIds.filter((id) => id !== studentId) })));
  };

  // Exercise management handlers
  const handleSaveExercise = (exercise: Exercise) => {
    if (exercises.some((e) => e.id === exercise.id)) {
      setExercises(exercises.map((e) => (e.id === exercise.id ? exercise : e)));
      // Keep identity fields of routines that use this library exercise in sync;
      // sets/reps/rest stay as prescribed in each routine.
      setRoutines((prev) =>
        prev.map((r) => ({
          ...r,
          exercises: r.exercises.map((e) =>
            e.libraryExerciseId === exercise.id
              ? { ...e, name: exercise.name, muscleGroup: exercise.muscleGroup, imageUrl: exercise.imageUrl }
              : e
          ),
        }))
      );
    } else {
      setExercises([...exercises, exercise]);
    }
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter((e) => e.id !== exerciseId));
  };

  // Routine handlers
  const handleSaveRoutine = (updatedRoutine: WorkoutRoutine) => {
    if (routines.some((r) => r.id === updatedRoutine.id)) {
      setRoutines(routines.map((r) => (r.id === updatedRoutine.id ? updatedRoutine : r)));
    } else {
      setRoutines([...routines, updatedRoutine]);
    }
    setEditingRoutine(null);
    setIsCreatingRoutine(false);
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutines(routines.filter((r) => r.id !== routineId));
  };

  const handleDuplicateRoutine = (routine: WorkoutRoutine) => {
    const duplicated: WorkoutRoutine = {
      ...routine,
      id: `routine-${Date.now()}`,
      name: `${routine.name} (Cópia)`,
      exercises: routine.exercises.map((e) => ({
        ...e,
        id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };
    setRoutines([...routines, duplicated]);
  };

  const handleFinishLiveWorkout = (newSession: WorkoutSessionLog) => {
    setSessions([newSession, ...sessions]);
    setActiveWorkout(null);
    notify('Treino concluído! Bom trabalho.');
  };

  // Filter routines strictly:
  // - Students ONLY see routines assigned directly to them!
  // - Admin can see all or filter by student
  const visibleRoutines = routines.filter((r) => {
    if (!isAdmin) {
      // Student strictly sees ONLY workouts assigned to their account
      return r.studentIds.includes(currentUser.id);
    }

    // Admin filter
    if (selectedStudentFilter !== 'todos') {
      if (selectedStudentFilter === 'sem-aluno' && r.studentIds.length > 0) return false;
      if (selectedStudentFilter !== 'sem-aluno' && !r.studentIds.includes(selectedStudentFilter)) return false;
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchEx = r.exercises.some((e) => e.name.toLowerCase().includes(q));
      if (!matchName && !matchEx) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={currentTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onNewRoutine={() => setIsCreatingRoutine(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className={`flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 ${isAdmin ? 'pb-24 md:pb-8' : ''}`}>
        {/* TAB 1: TREINOS */}
        {currentTab === 'treinos' && (
          <div className="space-y-6">
            {/* Header Banner */}
            {isAdmin ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      Painel do Treinador (Admin)
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 mt-1">
                    Gestão Geral de Treinos
                  </h1>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Crie, edite e prescreva treinos individuais para cada aluno.
                  </p>
                </div>

                <div className="hidden md:flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setActiveTab('exercicios')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors"
                  >
                    <Dumbbell className="h-4 w-4 text-emerald-400" />
                    <span>Gerenciar Exercícios ({exercises.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('alunos')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors"
                  >
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span>Alunos ({students.length})</span>
                  </button>
                  <button
                    onClick={() => setIsCreatingRoutine(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Treino</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Olá, {currentUser.name}!
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 mt-0.5">
                  Seus Treinos Prescritos
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Toque em um treino para ver cada exercício, como executar e marcar como concluído.
                </p>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2 text-sm text-neutral-300 font-semibold">
                <Dumbbell className="h-4 w-4 text-emerald-400" />
                <span>
                  {isAdmin ? 'Treinos dos Alunos' : 'Seus Treinos'} ({visibleRoutines.length})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Admin filter by student */}
                {isAdmin && students.length > 0 && (
                  <select
                    value={selectedStudentFilter}
                    onChange={(e) => setSelectedStudentFilter(e.target.value)}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="todos">Todos os Alunos</option>
                    <option value="sem-aluno">Sem aluno vinculado</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        Aluno: {st.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Search */}
                <div className="relative sm:w-56">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar treino..."
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Workouts Grid */}
            {visibleRoutines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {visibleRoutines.map((routine) => (
                  <WorkoutCard
                    key={routine.id}
                    routine={routine}
                    isToday={routine.scheduledDay === currentDayKey}
                    isAdmin={isAdmin}
                    students={students}
                    onStart={(r) => setActiveWorkout(r)}
                    onEdit={(r) => setEditingRoutine(r)}
                    onDelete={handleDeleteRoutine}
                    onDuplicate={handleDuplicateRoutine}
                    onSelectExercise={(ex) => setSelectedExerciseDetail(ex)}
                  />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-500 border border-neutral-800 mb-4">
                  <Dumbbell className="h-7 w-7 text-neutral-600" />
                </div>
                {isAdmin ? (
                  <>
                    <h3 className="text-lg font-bold text-neutral-200">
                      Nenhum treino criado ainda
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1 leading-relaxed">
                      Monte os treinos dos seus alunos vinculando exercícios e metas de séries.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setIsCreatingRoutine(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Criar Primeiro Treino</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('exercicios')}
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        <Dumbbell className="h-4 w-4 text-emerald-400" />
                        <span>Cadastrar Exercícios</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-neutral-200">
                      Nenhum treino prescrito para você ainda
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1 leading-relaxed">
                      Seu treinador ainda não vinculou treinos ao seu usuário. Assim que ele cadastrar, eles aparecerão aqui automaticamente.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXERCÍCIOS (ADMIN ONLY) */}
        {isAdmin && currentTab === 'exercicios' && (
          <ExerciseManagerView
            exercises={exercises}
            onSaveExercise={handleSaveExercise}
            onDeleteExercise={handleDeleteExercise}
            onSelectExerciseToView={(ex) => setSelectedExerciseDetail(ex)}
          />
        )}

        {/* TAB 3: ALUNOS (ADMIN ONLY) */}
        {isAdmin && currentTab === 'alunos' && (
          <div className="max-w-3xl mx-auto">
            <StudentManagerView
              students={students}
              routines={routines}
              onSaveStudent={handleSaveStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* Routine Editor */}
      {(editingRoutine || isCreatingRoutine) && (
        <RoutineEditorModal
          routine={editingRoutine}
          students={students}
          availableExercises={exercises}
          initialStudentId={selectedStudentFilter !== 'todos' && selectedStudentFilter !== 'sem-aluno' ? selectedStudentFilter : undefined}
          onSave={handleSaveRoutine}
          onClose={() => {
            setEditingRoutine(null);
            setIsCreatingRoutine(false);
          }}
          onGoToExercises={() => {
            setEditingRoutine(null);
            setIsCreatingRoutine(false);
            setActiveTab('exercicios');
          }}
        />
      )}

      {/* Active Workout Companion */}
      {activeWorkout && (
        <ActiveWorkoutModal
          routine={activeWorkout}
          studentId={currentUser.id}
          onFinishWorkout={handleFinishLiveWorkout}
          onClose={() => setActiveWorkout(null)}
        />
      )}

      {/* Exercise Detail (GIF & Technique Modal) */}
      {selectedExerciseDetail && (
        <ExerciseDetailModal
          exercise={selectedExerciseDetail}
          onClose={() => setSelectedExerciseDetail(null)}
        />
      )}
    </div>
  );
}
