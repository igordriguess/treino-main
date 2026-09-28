import React, { useState } from 'react';
import { Dumbbell, KeyRound, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { AuthUser } from '../types/workout';
import { login } from '../utils/storage';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const user = await login(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setErrorMsg('Usuário ou senha incorretos. Verifique suas credenciais.');
      }
    } catch {
      setErrorMsg('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 text-neutral-100">
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
                  autoComplete="username"
                  autoCapitalize="none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 pl-9 pr-3.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 px-4 text-sm font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{submitting ? 'Entrando...' : 'Entrar na Plataforma'}</span>
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
