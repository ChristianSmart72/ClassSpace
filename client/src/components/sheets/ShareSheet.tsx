import { useState } from 'react';

const TYPE_LABELS: Record<string, { title: string; sub: string }> = {
  space:  { title: 'Share Space',          sub: 'Anyone with this link can join the space' },
  ann:    { title: 'Share Announcement',   sub: 'Opens this announcement for others to read' },
  mat:    { title: 'Share File',           sub: 'Opens this file — others can download after joining' },
  course: { title: 'Share Course Folder',  sub: 'Opens this course folder for others to browse' },
};

export function ShareSheet({ type, id, spaceId, onClose }: {
  type: string; id: string | number; spaceId: string; onClose: () => void;
}) {
  const base = window.location.origin;
  const link = type === 'space'
    ? `${base}/join/space/${spaceId}`
    : `${base}/join/${type}/${id}`;

  const [copied, setCopied] = useState(false);
  const meta = TYPE_LABELS[type] || { title: 'Share', sub: 'Share this link' };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement('textarea');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWA = () => {
    const msg = encodeURIComponent(`Join our ClassSpace: ${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-[430px] bg-app-bg rounded-t-3xl border-t border-app-border animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-app-border" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-app-border flex items-start justify-between gap-3">
          <div>
            <h2 className="text-app-text font-jakarta font-bold text-base">{meta.title}</h2>
            <p className="text-app-text-dim text-xs font-inter mt-0.5">{meta.sub}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-app-surface border border-app-border text-app-text-dim hover:text-app-text transition-colors flex-shrink-0 mt-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          {/* Link box */}
          <div className="bg-app-surface rounded-2xl border border-app-border p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-app-accent/10 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <span className="text-app-text-dim text-xs font-inter flex-1 truncate">{link}</span>
            <button
              onClick={copy}
              className={`text-xs font-jakarta font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                copied
                  ? 'bg-app-green/15 text-app-green'
                  : 'bg-app-accent text-app-bg hover:opacity-90'
              }`}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* WhatsApp */}
          <button
            onClick={shareWA}
            className="flex items-center gap-3 bg-app-surface rounded-2xl px-4 py-3.5 border border-app-border active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#25D36615' }}>
              💬
            </div>
            <div className="flex-1 text-left">
              <p className="text-app-text font-jakarta text-sm font-semibold">Share via WhatsApp</p>
              <p className="text-app-text-dim text-xs font-inter mt-0.5">Send to your class group</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-app-text-faint">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Copy link row */}
          <button
            onClick={copy}
            className="flex items-center gap-3 bg-app-surface rounded-2xl px-4 py-3.5 border border-app-border active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-app-surface-2 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-text-dim">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-app-text font-jakarta text-sm font-semibold">Copy link</p>
              <p className="text-app-text-dim text-xs font-inter mt-0.5">Paste anywhere</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-app-text-faint">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Safe area spacer */}
        <div className="pb-safe" />
      </div>
    </div>
  );
}
