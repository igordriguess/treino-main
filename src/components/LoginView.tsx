import React, { useState } from 'react';
import { Dumbbell, KeyRound, User, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { AuthUser, StudentAccount } from '../types/workout';
import { ADMIN_DEFAULT_CREDENTIALS } from '../data/defaultData';

interface LoginViewProps {
  students: StudentAccount[];
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ students, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check if admin login
    if (cleanUser === ADMIN_DEFAULT_CREDENTIALS.username && cleanPass === ADMIN_DEFAULT_CREDENTIALS.password) {
      onLoginSuccess({
        id: 'admin-master',
        name: ADMIN_DEFAULT_CREDENTIALS.name,
        username: ADMIN_DEFAULT_CREDENTIALS.username,
        role: 'admin',
      });
      return;
    }

    // Check if student login
    const student = students.find(
      (s) => s.username.toLowerCase() === cleanUser && s.password === cleanPass
    );

    if (student) {
      onLoginSuccess({
        id: student.id,
        name: student.name,
        username: student.username,
        role: 'student',
      });
      return;
    }

    setErrorMsg('Usuário ou senha incorretos. Verifique suas credenciais.');
  };

  const handleQuickAdminFill = () => {
    setUsername('admin');
    setPassword('1234');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 text-neutral-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <Dumbbell className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-100">
          IronTrack
        </h1>
        <p className="mt-1 text-xs text-neutral-400">
          Plataforma de Gestão & Acompanhamento de Treinos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Quick info credentials badge */}
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Acesso do Administrador
              </span>
              <button
                type="button"
                onClick={handleQuickAdminFill}
                className="text-[11px] underline font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Preencher 1234
              </button>
            </div>
            <p className="text-[11px] text-neutral-300 font-mono">
              Usuário: <span className="text-white font-bold">admin</span> · Senha provisória: <span className="text-white font-bold">1234</span>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Usuário / Login
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin ou usuário do aluno"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 pl-9 pr-3.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 pl-9 pr-3.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 px-4 text-sm font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <span>Entrar na Plataforma</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick list of registered students if any */}
          {students.length > 0 && (
            <div className="mt-6 border-t border-neutral-800 pt-4">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-neutral-500" />
                Alunos Cadastrados ({students.length})
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {students.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setUsername(st.username);
                      setPassword(st.password);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-850 text-left text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-neutral-200">{st.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">login: {st.username}</div>
                    </div>
                    <span className="text-[10px] text-emerald-400/90 font-mono">Usar login</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
