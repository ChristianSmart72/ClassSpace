import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { Fab } from '../components/layout';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { UploadMaterialSheet } from '../components/sheets/UploadMaterial';
import { ShareSheet } from '../components/sheets/ShareSheet';
import { FILE_ICONS } from '../types';
import type { Material } from '../types';
import api from '../api/client';

const FILTER_CATEGORIES = [
  'All', 'Slides', 'Assignments', 'Past Questions',
  'Lab Resources', 'Books', 'Templates',
] as const;

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'downloads', label: 'Most Downloaded' },
  { key: 'alpha', label: 'A-Z' },
] as const;

const FILE_EXT_LABELS: Record<string, string> = {
  pdf: 'PDF', doc: 'DOCX', ppt: 'PPT', xls: 'XLSX',
  img: 'IMG', video: 'MP4', other: 'FILE',
};

const CARD_FILE_COLORS: Record<string, string> = {
  pdf: 'text-app-red', doc: 'text-app-accent2', ppt: 'text-app-orange',
  xls: 'text-app-green', img: 'text-app-accent2', video: 'text-app-red', other: 'text-app-text-dim',
};

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr);
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function CourseFiles() {
  const { id: spaceId, cid } = useParams<{ id: string; cid: string }>();
  const navigate = useNavigate();
  const { courses, memberRole } = useSpaceStore();
  const { materials, matLoading, fetchMaterials, deleteMaterial, updateMaterial } = useContentStore();
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [shareTarget, setShareTarget] = useState<{ type: string; id: string | number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<{ count: number; contributors: number; total_downloads: number } | null>(null);

  const course = courses.find((c) => c.id === Number(cid));
  const isRep = memberRole === 'rep';

  useEffect(() => {
    if (cid) fetchMaterials(Number(cid));
  }, [cid]);

  useEffect(() => {
    if (cid && spaceId) {
      api.get(`/spaces/${spaceId}/materials/summary`).then(({ data }) => {
        const c = data.courses.find((c: any) => c.course_id === Number(cid));
        if (c) setSummary({ count: c.count, contributors: c.contributors, total_downloads: c.total_downloads });
      }).catch(() => {});
    }
  }, [cid, spaceId]);

  const filtered = useMemo(() => {
    let result = [...materials];

    if (categoryFilter !== 'All') {
      result = result.filter(m => m.category === categoryFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.file_type.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }

    const pinned = result.filter(m => m.pinned);
    const unpinned = result.filter(m => !m.pinned);

    const sortFn = (a: Material, b: Material) => {
      switch (sort) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'downloads': return (b.downloads || 0) - (a.downloads || 0);
        case 'alpha': return a.name.localeCompare(b.name);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    };

    pinned.sort(sortFn);
    unpinned.sort(sortFn);

    return { pinned, unpinned };
  }, [materials, categoryFilter, sort, search]);

  const handleDelete = async (matId: number) => {
    if (!confirm('Delete this resource?')) return;
    setDeletingId(matId);
    try { await deleteMaterial(matId); } finally { setDeletingId(null); }
  };

  const handlePin = async (mat: Material) => {
    try { await updateMaterial(mat.id, { pinned: !mat.pinned }); } catch {}
  };

  if (!course) {
    return (
      <div className="px-4 pt-8">
        <p className="text-app-text-dim text-sm font-inter">Course not found</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* ─── Header ─── */}
      <div className="sticky top-0 bg-app-bg/95 backdrop-blur-lg z-30 border-b border-app-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(`/space/${spaceId}?tab=files`)} className="text-app-text-dim hover:text-app-text text-xl transition-colors">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-app-text font-jakarta font-semibold text-base truncate">{course.name}</h1>
            <p className="text-app-text-dim text-xs font-inter truncate">{course.code}</p>
          </div>
          <button
            onClick={() => setShareTarget({ type: 'course', id: course.id })}
            className="flex items-center gap-1.5 text-app-text-dim hover:text-app-accent transition-colors text-xs font-jakarta font-semibold px-2.5 py-1.5 rounded-lg border border-app-border hover:border-app-accent/40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>

        {/* ─── Course Summary Row ─── */}
        {summary && summary.count > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-3 text-app-text-faint text-[11px] font-inter">
              <span>📄 {summary.count} {summary.count === 1 ? 'Resource' : 'Resources'}</span>
              <span>👤 {summary.contributors} {summary.contributors === 1 ? 'Contributor' : 'Contributors'}</span>
              <span>⬇️ {summary.total_downloads.toLocaleString()} Downloads</span>
            </div>
          </div>
        )}

        <div className="px-4 pb-3">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-text-faint text-xs leading-none pointer-events-none">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search resources..."
              className="w-full bg-app-surface border border-app-border rounded-lg pl-7 pr-3 py-2 text-app-text text-xs font-inter placeholder:text-app-text-faint focus:outline-none focus:border-app-accent transition-colors" />
          </div>
        </div>
      </div>

      {/* ─── Sort + Category Filter ─── */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {FILTER_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-jakarta font-semibold rounded-full transition-all duration-200 border ${
                  categoryFilter === cat
                    ? 'bg-app-accent text-app-bg border-app-accent'
                    : 'bg-app-surface text-app-text-dim border-app-border hover:border-app-accent/40 hover:text-app-text'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="relative flex-shrink-0 ml-2">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="appearance-none bg-app-surface border border-app-border rounded-lg px-2.5 py-1.5 text-xs font-jakarta font-semibold text-app-text-dim pr-6 cursor-pointer hover:border-app-accent/40 transition-colors">
              {SORT_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-app-text-faint text-[10px] pointer-events-none">▾</span>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="px-4 mt-1">
        {matLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="pt-8">
            <EmptyState icon="📁" title="No resources yet" subtitle={isRep ? 'Tap + to upload the first file' : 'No files uploaded yet'} />
          </div>
        ) : (
          <>
            {filtered.pinned.length > 0 && (
              <div className="mb-5">
                <h3 className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-2.5">Essentials</h3>
                <div className="flex flex-col gap-2">
                  {filtered.pinned.map(mat => (
                    <ResourceCard key={mat.id}
                      material={mat}
                      canDelete={isRep}
                      deleting={deletingId === mat.id}
                      onDelete={() => handleDelete(mat.id)}
                      onPin={() => handlePin(mat)}
                      onShare={() => setShareTarget({ type: 'mat', id: mat.id })}
                      onClick={() => navigate(`/space/${spaceId}/material/${mat.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filtered.unpinned.length > 0 && (
              <div className="mb-5">
                <h3 className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-2.5">
                  {filtered.pinned.length > 0 ? 'Recent Uploads' : 'All Resources'}
                </h3>
                <div className="flex flex-col gap-2">
                  {filtered.unpinned.map(mat => (
                    <ResourceCard key={mat.id}
                      material={mat}
                      canDelete={isRep}
                      deleting={deletingId === mat.id}
                      onDelete={() => handleDelete(mat.id)}
                      onPin={() => handlePin(mat)}
                      onShare={() => setShareTarget({ type: 'mat', id: mat.id })}
                      onClick={() => navigate(`/space/${spaceId}/material/${mat.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filtered.pinned.length === 0 && filtered.unpinned.length === 0 && (
              <div className="pt-8">
                <EmptyState icon={search ? '🔍' : '📁'}
                  title={search ? 'No results' : 'No resources'}
                  subtitle={search ? `Nothing matched "${search}"` : 'Try a different filter'} />
              </div>
            )}
          </>
        )}
      </div>

      {isRep && <Fab onClick={() => setShowUpload(true)} icon="+" />}

      {showUpload && <UploadMaterialSheet courseId={Number(cid)} onClose={() => setShowUpload(false)} />}
      {shareTarget && spaceId && (
        <ShareSheet type={shareTarget.type} id={shareTarget.id} spaceId={spaceId} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}

function ResourceCard({ material: m, canDelete, deleting, onDelete, onPin, onShare, onClick }: {
  material: Material;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  onPin: () => void;
  onShare: () => void;
  onClick: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const icon = FILE_ICONS[m.file_type] || '📁';
  const colorClass = CARD_FILE_COLORS[m.file_type] || 'text-app-text-dim';
  const extLabel = FILE_EXT_LABELS[m.file_type] || m.file_type.toUpperCase();

  return (
    <div className="bg-app-surface rounded-xl border border-app-border overflow-hidden relative card-hover">
      <div onClick={onClick} className="flex items-start gap-3 active:scale-[0.99] transition-all duration-200 cursor-pointer py-3 pl-3.5 pr-10">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 mt-0.5" style={{ background: 'var(--app-surface-2)' }}>
          <span className={colorClass}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-app-text font-jakarta text-sm font-semibold truncate">{m.name}</p>
          <div className="flex items-center gap-1.5 text-app-text-faint text-[11px] font-inter mt-0.5">
            <span className="font-medium uppercase">{extLabel}</span>
            {m.file_size > 0 && (
              <>
                <span>·</span>
                <span>{formatSize(m.file_size)}</span>
              </>
            )}
            <span>·</span>
            <span>{formatRelativeTime(m.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-app-text-faint text-[10px] font-inter mt-1">
            {m.uploader_name && (
              <span className="truncate">Uploaded by <span className="text-app-text-dim font-medium">{m.uploader_name}</span></span>
            )}
            <span>·</span>
            <span>⬇ {(m.downloads || 0).toLocaleString()} downloads</span>
          </div>
        </div>
      </div>

      <div className="absolute right-2 top-3 z-10" onClick={e => e.stopPropagation()}>
        <button onClick={() => setMenuOpen(o => !o)}
          className="p-1.5 text-app-text-faint hover:text-app-text transition-colors rounded-lg hover:bg-app-surface-2 text-sm leading-none tracking-wider font-bold">
          ···
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 bg-app-bg border border-app-border rounded-xl shadow-xl py-1 min-w-[160px] animate-fadeIn">
              <button onClick={() => { window.open(`/api/materials/${m.id}/download`, '_blank'); setMenuOpen(false); }}
                className="w-full text-left px-3.5 py-2.5 text-xs font-jakarta font-medium text-app-text hover:bg-app-surface transition-colors flex items-center gap-2">
                <span className="text-sm">⬇</span> Download
              </button>
              <button onClick={() => { onShare(); setMenuOpen(false); }}
                className="w-full text-left px-3.5 py-2.5 text-xs font-jakarta font-medium text-app-text hover:bg-app-surface transition-colors flex items-center gap-2">
                <span className="text-sm">🔗</span> Share
              </button>
              {canDelete && (
                <>
                  <div className="h-px bg-app-border mx-3" />
                  <button onClick={() => { onPin(); setMenuOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-jakarta font-medium text-app-text hover:bg-app-surface transition-colors flex items-center gap-2">
                    <span className="text-sm">{m.pinned ? '📍' : '📌'}</span> {m.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button onClick={() => { onDelete(); setMenuOpen(false); }} disabled={deleting}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-jakarta font-medium text-app-red hover:bg-app-surface transition-colors flex items-center gap-2 disabled:opacity-40">
                    <span className="text-sm">🗑</span> Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
