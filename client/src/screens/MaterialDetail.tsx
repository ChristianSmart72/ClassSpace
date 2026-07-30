import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { FILE_ICONS, FILE_COLORS } from '../types';
import api from '../api/client';
import { formatSize, formatDate, canGoBack } from '../lib/time';
import type { Material } from '../types';

function getMaterialBookmarks(): number[] {
  try { return JSON.parse(localStorage.getItem('matBookmarks') || '[]'); } catch { return []; }
}
function toggleMaterialBookmark(id: number): boolean {
  const bms = getMaterialBookmarks();
  const idx = bms.indexOf(id);
  if (idx >= 0) { bms.splice(idx, 1); localStorage.setItem('matBookmarks', JSON.stringify(bms)); return false; }
  bms.push(id); localStorage.setItem('matBookmarks', JSON.stringify(bms)); return true;
}

export function MaterialDetail() {
  const { id: spaceId, mid } = useParams<{ id: string; mid: string }>();
  const navigate = useNavigate();
  const memberRole = useSpaceStore(s => s.memberRole);
  const materials = useContentStore(s => s.materials);
  const deleteMaterial = useContentStore(s => s.deleteMaterial);
  const updateMaterial = useContentStore(s => s.updateMaterial);
  const [material, setMaterial] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(() => getMaterialBookmarks().includes(Number(mid)));

  const isRep = memberRole === 'rep';

  useEffect(() => {
    const cancelled = { current: false };
    const mat = materials.find(m => m.id === Number(mid));
    if (mat) {
      setMaterial(mat);
    } else {
      api.get(`/materials/shared/${mid}`).then(({ data }) => {
        if (!cancelled.current) setMaterial(data);
      }).catch(() => {});
    }
    return () => { cancelled.current = true; };
  }, [mid, materials]);

  const handleDownload = async () => {
    if (!material) return;
    setDownloading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 30, 90));
    }, 200);
    try {
      const mat = material;
      if (mat.file_data) {
        const link = document.createElement('a');
        link.href = `data:application/octet-stream;base64,${mat.file_data}`;
        link.download = `${mat.name}.${mat.file_type}`;
        link.click();
      } else {
        window.open(`/api/materials/${mat.id}/download`, '_blank');
      }
      setProgress(100);
      setTimeout(() => setDownloading(false), 500);
    } catch {
      setDownloading(false);
    } finally {
      clearInterval(interval);
      setTimeout(() => setDownloading(false), 500);
    }
  };

  const handleDelete = async () => {
    if (!material || !confirm('Delete this resource?')) return;
    setDeleting(true);
    try {
      await deleteMaterial(material.id);
      navigate(`/space/${spaceId}/course/${material.course_id}`);
    } finally {
      setDeleting(false);
    }
  };

  const handlePin = async () => {
    if (!material) return;
    try {
      await updateMaterial(material.id, { pinned: !material.pinned });
      setMaterial({ ...material, pinned: !material.pinned });
    } catch (err) { console.warn('Pin failed:', err); }
  };

  const handleShare = () => {
    if (!material) return;
    const url = `${window.location.origin}/join/mat/${material.id}`;
    if (navigator.share) navigator.share({ url, title: material.name });
    else navigator.clipboard.writeText(url);
  };

  if (!material) {
    return (
      <div className="px-4 pt-8">
        <p className="text-app-text-dim text-sm font-inter">Loading...</p>
      </div>
    );
  }

  const icon = FILE_ICONS[material.file_type] || '📁';
  const colorClass = FILE_COLORS[material.file_type] || 'text-app-text-dim';

  return (
    <div className="animate-slideInRight min-h-dvh bg-app-bg">
      <div className="sticky top-0 bg-app-bg/95 backdrop-blur-lg z-30 border-b border-app-border">
        <div className="flex items-center gap-3 px-4 h-12">
          <button onClick={() => canGoBack() ? navigate(-1) : navigate(`/space/${spaceId}`)} className="text-app-text-dim hover:text-app-text text-xl transition-colors">←</button>
          <h1 className="text-app-text font-jakarta font-semibold text-sm truncate flex-1">Material Details</h1>
          <button
            onClick={() => { const next = toggleMaterialBookmark(material.id); setBookmarked(next); }}
            className={`p-2 rounded-xl transition-colors ${bookmarked ? 'text-app-accent bg-app-accent/10' : 'text-app-text-faint hover:text-app-text hover:bg-app-surface'}`}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {bookmarked ? '🔖' : '🔖'}
            <span className="sr-only">{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-app-surface rounded-xl border border-app-border p-4 mb-3">
          <div className="flex flex-col items-center text-center mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 ${colorClass}`}
              style={{ background: 'var(--app-surface-2)' }}>
              {icon}
            </div>
            <h2 className="text-app-text font-jakarta font-bold text-base leading-snug">{material.name}</h2>
            {material.course_name && (
              <p className="text-app-text-dim text-xs font-inter mt-0.5">{material.course_code} — {material.course_name}</p>
            )}
            {bookmarked && (
              <span className="mt-2 text-[10px] font-jakarta font-semibold text-app-accent bg-app-accent/10 px-2 py-0.5 rounded-full">🔖 Bookmarked</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <DetailRow icon="👤" label="Uploaded by" value={material.uploader_name || 'Unknown'} />
            <DetailRow icon="📅" label="Upload date" value={formatDate(material.created_at)} />
            <DetailRow icon="📦" label="File size" value={formatSize(material.file_size)} />
            <DetailRow icon="📂" label="Category" value={material.category} />
            <DetailRow icon="📄" label="File type" value={material.file_type.toUpperCase()} />
            <DetailRow icon="⬇️" label="Downloads" value={String(material.downloads || 0)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={handleDownload} disabled={downloading}
            className="w-full bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50">
            {downloading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-app-bg border-t-transparent rounded-full animate-spin" />
                Downloading {Math.round(progress)}%
              </span>
            ) : (
              <><span>⬇</span> Download</>
            )}
          </button>

          <button onClick={handleShare}
            className="w-full bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
            <span>🔗</span> Share
          </button>

          {isRep && (
            <>
              <div className="h-px bg-app-border my-1" />
              <button onClick={handlePin}
                className="w-full bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                <span>{material.pinned ? '📍' : '📌'}</span> {material.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="w-full bg-app-red/10 border border-app-red/25 text-app-red font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
                {deleting ? 'Deleting...' : '🗑 Delete'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-sm w-5 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-app-text-dim text-[10px] font-jakarta font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-app-text text-xs font-inter mt-0.5">{value}</p>
      </div>
    </div>
  );
}
