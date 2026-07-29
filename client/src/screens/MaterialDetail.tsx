import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { FILE_ICONS, FILE_COLORS } from '../types';
import api from '../api/client';
import type { Material } from '../types';

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function MaterialDetail() {
  const { id: spaceId, mid } = useParams<{ id: string; mid: string }>();
  const navigate = useNavigate();
  const { memberRole } = useSpaceStore();
  const { materials, deleteMaterial, updateMaterial } = useContentStore();
  const [material, setMaterial] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const isRep = memberRole === 'rep';

  useEffect(() => {
    const mat = materials.find(m => m.id === Number(mid));
    if (mat) {
      setMaterial(mat);
    } else {
      api.get(`/materials/shared/${mid}`).then(({ data }) => {
        setMaterial(data);
      }).catch(() => {});
    }
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
    } catch {}
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
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-app-text-dim hover:text-app-text text-xl transition-colors">←</button>
          <h1 className="text-app-text font-jakarta font-semibold text-base truncate">Material Details</h1>
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="bg-app-surface rounded-2xl border border-app-border p-6 mb-4">
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 ${colorClass}`}
              style={{ background: 'var(--app-surface-2)' }}>
              {icon}
            </div>
            <h2 className="text-app-text font-jakarta font-bold text-lg leading-snug">{material.name}</h2>
            {material.course_name && (
              <p className="text-app-text-dim text-sm font-inter mt-1">{material.course_code} — {material.course_name}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
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
    <div className="flex items-center gap-3 py-2">
      <span className="text-base w-6 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-app-text-dim text-[11px] font-jakarta font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-app-text text-sm font-inter mt-0.5">{value}</p>
      </div>
    </div>
  );
}
