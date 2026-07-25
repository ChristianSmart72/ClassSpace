import { type ReactNode, useState } from 'react';

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[400px] animate-slideDown">
      <div className="bg-app-surface border border-app-border rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
        <span className="text-app-text text-sm font-inter flex-1">{message}</span>
        <button onClick={onClose} className="text-app-text-dim hover:text-app-text text-lg leading-none">&times;</button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  const show = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return { toast, show, ToastComp: toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null };
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-app-surface-2 rounded-lg animate-pulse ${className}`} />;
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'urgent' | 'pin' | 'default' | 'assign' | 'test' | 'meet' | 'update' }) {
  const colors: Record<string, string> = {
    urgent: 'bg-app-red/15 text-app-red border-app-red/30',
    pin: 'bg-app-accent/15 text-app-accent border-app-accent/30',
    default: 'bg-app-surface-2 text-app-text-dim border-app-border',
    assign: 'bg-app-accent2/15 text-app-accent2 border-app-accent2/30',
    test: 'bg-app-orange/15 text-app-orange border-app-orange/30',
    meet: 'bg-app-green/15 text-app-green border-app-green/30',
    update: 'bg-app-accent/15 text-app-accent border-app-accent/30',
  };

  return (
    <span className={`text-[11px] font-jakarta font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${colors[variant]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, subtitle, action }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex items-center justify-center">{typeof icon === 'string' ? <span className="text-5xl">{icon}</span> : icon}</div>
      <h3 className="text-app-text font-jakarta font-semibold text-lg mb-1">{title}</h3>
      {subtitle && <p className="text-app-text-dim text-sm font-inter">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 bg-app-accent rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}
