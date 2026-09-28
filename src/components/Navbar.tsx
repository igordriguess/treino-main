import React from 'react';
import { Dumbbell, Plus, Users, LogOut, ShieldCheck, User, ClipboardList } from 'lucide-react';
import { AuthUser } from '../types/workout';

type Tab = 'treinos' | 'exercicios' | 'alunos';

interface NavbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'treinos', label: isAdmin ? 'Treinos' : 'Meus Treinos', icon: <ClipboardList className="h-5 w-5" /> },
    ...(isAdmin
      ? [
          { key: 'exercicios' as Tab, label: 'Exercícios', icon: <Dumbbell className="h-5 w-5" /> },
          { key: 'alunos' as Tab, label: 'Alunos', icon: <Users className="h-5 w-5" /> },
        ]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-stretch justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* A full navigation to "/" reloads the data and resets to the home tab */}
            <a
              href="/"
              title="Voltar ao início"
              aria-label="Voltar ao início"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 transition-colors hover:bg-emerald-500/20 hover:border-emerald-500/40 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            >
              <Dumbbell className="h-5 w-5" />
            </a>
            <div className="min-w-0">
              <span className="text-base font-bold tracking-tight text-neutral-100 block leading-tight">
                IronTrack
              </span>
              <span className="block truncate text-[10px] text-neutral-400 font-medium">
                {isAdmin ? 'Painel do Treinador' : `Olá, ${currentUser.name}`}
              </span>
            </div>
          </div>

          {/* Desktop tabs: each tab fills the header height so the whole area is clickable */}
          {tabs.length > 1 && (
            <nav className="hidden md:flex items-stretch gap-1 text-sm font-medium">
              {tabs.map((t) => {
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center gap-2 px-4 transition-colors ${
                      active ? 'text-emerald-400 font-semibold' : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/60'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                    {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Actions & Profile */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onNewRoutine}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Treino</span>
                <span className="sm:hidden">Treino</span>
              </button>
            )}

            {/* User badge */}
            <div className="hidden lg:flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300">
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
              className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      {tabs.length > 1 && (
        <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                    active ? 'text-emerald-400' : 'text-neutral-500 active:text-neutral-200'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};
