import { useState } from 'react';

export function ShareSheet({ type, id, spaceId, onClose }: {
  type: string; id: string | number; spaceId: string; onClose: () => void;
}) {
  const link = `classspace.app/s/${spaceId}/${type === 'space' ? '' : type + '/' + id}`.replace(/\/+$/, '');
  const [copied, setCopied] = useState(false);

  const labels: Record<string, string> = {
    space: 'Share Space',
    ann: 'Share Announcement',
    mat: 'Share Material',
    course: 'Share Course Folder',
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWA = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-[430px] mx-auto bg-app-bg rounded-t-3xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-app-text font-syne font-bold text-base">{labels[type] || 'Share'}</h2>
          <button onClick={onClose} className="text-app-text-dim text-lg">&times;</button>
        </div>

        <div className="p-6">
          <div className="bg-app-surface rounded-xl p-3 border border-app-border flex items-center gap-3 mb-4">
            <span className="text-app-text-dim text-sm font-dm flex-1 truncate">{link}</span>
            <button onClick={copy} className="text-app-accent font-syne font-semibold text-sm whitespace-nowrap">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={shareWA}
              className="flex items-center gap-3 bg-app-surface rounded-xl px-4 py-3 border border-app-border active:scale-[0.98] transition-all">
              <span className="text-xl">💬</span>
              <span className="text-app-text font-dm text-sm">Share on WhatsApp</span>
            </button>
            <button onClick={copy}
              className="flex items-center gap-3 bg-app-surface rounded-xl px-4 py-3 border border-app-border active:scale-[0.98] transition-all">
              <span className="text-xl">🔗</span>
              <span className="text-app-text font-dm text-sm">Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
