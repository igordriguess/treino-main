import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type Tone = 'default' | 'danger';
type ToastKind = 'success' | 'error' | 'info';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
}

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (message: string, kind?: ToastKind) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const useDialog = (): DialogContextValue => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
  return ctx;
};

const TOAST_STYLES: Record<ToastKind, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />,
    className: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100',
  },
  error: {
    icon: <XCircle className="h-4 w-4 shrink-0 text-rose-400" />,
    className: 'border-rose-500/30 bg-rose-950/90 text-rose-100',
  },
  info: {
    icon: <Info className="h-4 w-4 shrink-0 text-sky-400" />,
    className: 'border-neutral-700 bg-neutral-900/95 text-neutral-100',
  },
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    []
  );

  const notify = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  useEffect(() => {
    if (!pending) return;
    confirmButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const isDanger = pending?.tone === 'danger';

  return (
    <DialogContext.Provider value={{ confirm, notify }}>
      {children}

      {/* Confirm dialog */}
      {pending && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  isDanger
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="dialog-title" className="text-sm font-bold text-neutral-100">
                  {pending.title}
                </h2>
                {pending.message && (
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">{pending.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
              >
                {pending.cancelLabel || 'Cancelar'}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={() => close(true)}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                  isDanger
                    ? 'bg-rose-500 text-white hover:bg-rose-400'
                    : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                }`}
              >
                {pending.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 md:bottom-4 z-110 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur ${TOAST_STYLES[t.kind].className}`}
          >
            {TOAST_STYLES[t.kind].icon}
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-current opacity-60 hover:opacity-100"
              aria-label="Fechar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  );
};
