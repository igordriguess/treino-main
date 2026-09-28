import React from 'react';
import { Dumbbell, Plus, Users, LogOut, ShieldCheck, User, FolderPlus } from 'lucide-react';
import { AuthUser } from '../types/workout';

interface NavbarProps {
  activeTab: 'treinos' | 'exercicios' | 'alunos';
  setActiveTab: (tab: 'treinos' | 'exercicios' | 'alunos') => void;
  currentUser: AuthUser;
  onNewRoutine: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onNewRoutine,
  onLogout,
}) => {
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-neutral-100 block leading-tight">
              IronTrack
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">
              {isAdmin ? 'Painel do Treinador (Admin)' : 'Área do Aluno'}
            </span>
          </div>
        </div>

        {/* Central tabs */}
        <nav className="flex items-center gap-6 sm:gap-8 text-sm font-medium">
          <button
            onClick={() => setActiveTab('treinos')}
            className={`transition-colors hover:text-neutral-100 ${
              activeTab === 'treinos'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400 py-5 -mb-[1px]'
                : 'text-neutral-400'
            }`}
          >
            {isAdmin ? 'Treinos' : 'Meus Treinos'}
          </button>

          {/* Admin only menus */}
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('exercicios')}
                className={`transition-colors hover:text-neutral-100 ${
                  activeTab === 'exercicios'
                    ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400 py-5 -mb-[1px]'
                    : 'text-neutral-400'
                }`}
              >
                Exercícios
              </button>
              <button
                onClick={() => setActiveTab('alunos')}
                className={`transition-colors hover:text-neutral-100 ${
                  activeTab === 'alunos'
                    ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400 py-5 -mb-[1px]'
                    : 'text-neutral-400'
                }`}
              >
                Alunos
              </button>
            </>
          )}
        </nav>

        {/* Actions & Profile */}
        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={onNewRoutine}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Treino</span>
              <span className="sm:hidden">Treino</span>
            </button>
          )}

          {/* User badge */}
          <div className="hidden md:flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300">
            {isAdmin ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <User className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span className="font-semibold text-neutral-200">{currentUser.name}</span>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-rose-400 hover:bg-neutral-850 hover:border-neutral-700 transition-colors"
            title="Sair da conta"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
