import { useToastStore, type ToastType } from '../../store/toastStore';

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '⚠️',
  info: 'ℹ️',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-app-surface-2 border border-app-border shadow-lg text-left animate-slideUp"
        >
          <span className="text-base shrink-0">{ICONS[t.type]}</span>
          <span className="text-app-text font-jakarta font-medium text-sm leading-snug">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
