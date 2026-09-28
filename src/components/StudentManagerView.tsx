import React, { useState } from 'react';
import { UserPlus, Users, Trash2, Check } from 'lucide-react';
import { StudentAccount, WorkoutRoutine } from '../types/workout';
import { useDialog } from './DialogProvider';

interface StudentManagerViewProps {
  students: StudentAccount[];
  routines: WorkoutRoutine[];
  onSaveStudent: (student: StudentAccount) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentManagerView: React.FC<StudentManagerViewProps> = ({
  students,
  routines,
  onSaveStudent,
  onDeleteStudent,
}) => {
  const { confirm } = useDialog();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('1234');
  const [goal, setGoal] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Informe o nome do aluno.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) {
      setErrorMsg('Informe um nome de usuário para login.');
      return;
    }

    // Check if username already exists
    if (students.some((s) => s.username.toLowerCase() === cleanUsername) || cleanUsername === 'admin') {
      setErrorMsg('Este nome de usuário já está em uso.');
      return;
    }

    const newStudent: StudentAccount = {
      id: `student-${Date.now()}`,
      name: name.trim(),
      username: cleanUsername,
      password: password.trim() || '1234',
      createdAt: new Date().toISOString(),
      goal: goal.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSaveStudent(newStudent);
    setName('');
    setUsername('');
    setPassword('1234');
    setGoal('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="relative w-full rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-100 tracking-tight">
              Gerenciar Acessos dos Alunos
            </h2>
            <p className="text-xs text-neutral-400">
              Crie os logins e senhas para que cada aluno acesse e visualize apenas os seus treinos.
            </p>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Top action: Add new student */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Cadastrar Novo Aluno</span>
          </button>
        ) : (
          <form onSubmit={handleCreateStudent} className="rounded-xl border border-emerald-500/30 bg-neutral-950/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="h-4 w-4" />
                Novo Aluno
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cancelar
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Login / Usuário *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: carlossilva"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none lowercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Senha de Acesso *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="1234"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Objetivo Principal
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ex: Hipertrofia, Força, Emagrecimento"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Observações / Restrições (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Evitar impacto no joelho direito, iniciante..."
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Cadastrar Aluno</span>
              </button>
            </div>
          </form>
        )}

        {/* Students list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Alunos Cadastrados ({students.length})
          </h3>

          {students.length > 0 ? (
            <div className="space-y-2.5">
              {students.map((st) => {
                const studentRoutinesCount = routines.filter((r) => r.studentIds.includes(st.id)).length;

                return (
                  <div
                    key={st.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-300 font-bold shrink-0">
                        {st.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-neutral-100">
                            {st.name}
                          </h4>
                          {st.goal && (
                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {st.goal}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono">
                          <span>
                            Login: <strong className="text-neutral-200">{st.username}</strong>
                          </span>
                          <span aria-hidden="true" className="text-neutral-700">·</span>
                          <span>
                            Senha: <strong className="text-neutral-200">{st.password}</strong>
                          </span>
                          <span aria-hidden="true" className="text-neutral-700">·</span>
                          <span className="text-emerald-400">
                            {studentRoutinesCount} {studentRoutinesCount === 1 ? 'treino vinculado' : 'treinos vinculados'}
                          </span>
                        </div>

                        {st.notes && (
                          <p className="mt-1 text-xs text-neutral-500 italic">
                            "{st.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Excluir aluno?',
                            message: `${st.name} perderá o acesso à plataforma e será desvinculado dos treinos.`,
                            confirmLabel: 'Excluir',
                            tone: 'danger',
                          });
                          if (ok) onDeleteStudent(st.id);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Excluir aluno"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-800 p-8 text-center">
              <Users className="h-8 w-8 mx-auto text-neutral-600 mb-2" />
              <p className="text-xs text-neutral-400 font-medium">Nenhum aluno cadastrado ainda.</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Clique no botão acima para cadastrar o primeiro aluno.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
