import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { TopBar, Fab } from '../components/layout';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { UploadMaterialSheet } from '../components/sheets/UploadMaterial';
import { FILE_ICONS, FILE_COLORS, MATERIAL_CATEGORIES } from '../types';
import { ShareSheet } from '../components/sheets/ShareSheet';
import type { Material } from '../types';

export function CourseFiles() {
  const { id: spaceId, cid } = useParams<{ id: string; cid: string }>();
  const navigate = useNavigate();
  const { courses, memberRole } = useSpaceStore();
  const { materials, matLoading, fetchMaterials, deleteMaterial } = useContentStore();
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [shareTarget, setShareTarget] = useState<{ type: string; id: string | number } | null>(null);

  const course = courses.find((c) => c.id === Number(cid));
  const isRep = memberRole === 'rep';

  useEffect(() => {
    if (cid) fetchMaterials(Number(cid));
  }, [cid]);

  const handleDelete = async (matId: number) => {
    if (!confirm('Delete this material?')) return;
    setDeletingId(matId);
    try {
      await deleteMaterial(matId);
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = MATERIAL_CATEGORIES.map((cat) => ({
    category: cat,
    items: materials.filter((m) => m.category === cat),
  })).filter((g) => g.items.length > 0);

  if (!course) {
    return (
      <div className="px-4 pt-4">
        <TopBar title="Course Files" onBack={() => navigate(`/space/${spaceId}?tab=mat`)} />
        <p className="text-app-text-dim text-sm font-inter mt-4">Course not found</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="sticky top-0 bg-app-bg/95 backdrop-blur-lg z-30 border-b border-app-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(`/space/${spaceId}?tab=mat`)} className="text-app-text-dim hover:text-app-text text-xl transition-colors">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-app-text font-jakarta font-semibold text-base truncate">{course.name}</h1>
            <p className="text-app-text-dim text-xs font-inter truncate">{course.code}</p>
          </div>
          <button
            onClick={() => setShareTarget({ type: 'course', id: course.id })}
            className="flex items-center gap-1.5 text-app-text-dim hover:text-app-accent transition-colors text-xs font-jakarta font-semibold px-2.5 py-1.5 rounded-lg border border-app-border hover:border-app-accent/40"
            title="Share this course folder"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>
      </div>

      <div className="px-4 mt-4">
        {matLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-16 w-full mb-2" />
              <Skeleton className="h-16 w-full mb-2" />
            </div>
          ))
        ) : materials.length === 0 ? (
          <EmptyState icon="📁" title="No materials yet" subtitle={isRep ? 'Tap + to upload the first file' : 'No files uploaded yet'} />
        ) : (
          grouped.map((group) => (
            <div key={group.category} className="mb-5">
              <h3 className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-2">{group.category}</h3>
              <div className="flex flex-col gap-2">
                {group.items.map((mat) => (
                  <MaterialCard
                    key={mat.id}
                    material={mat}
                    canDelete={isRep}
                    deleting={deletingId === mat.id}
                    onDelete={() => handleDelete(mat.id)}
                    onShare={() => setShareTarget({ type: 'mat', id: mat.id })}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {isRep && (
        <Fab onClick={() => setShowUpload(true)} icon="+" />
      )}

      {showUpload && (
        <UploadMaterialSheet courseId={Number(cid)} onClose={() => setShowUpload(false)} />
      )}

      {shareTarget && spaceId && (
        <ShareSheet
          type={shareTarget.type}
          id={shareTarget.id}
          spaceId={spaceId}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  );
}

function MaterialCard({
  material: m, canDelete, deleting, onDelete, onShare,
}: {
  material: Material;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  onShare?: () => void;
}) {
  return (
    <div className="bg-app-surface rounded-xl border border-app-border flex items-center gap-3 active:scale-[0.99] transition-all duration-200 overflow-hidden">
      <div className="w-1 self-stretch flex-shrink-0 rounded-l-xl" style={{ background: 'var(--app-accent2)', opacity: 0.45 }} />
      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl my-2.5">
        <span className={FILE_COLORS[m.file_type] || 'text-app-text-dim'}>
          {FILE_ICONS[m.file_type] || '📁'}
        </span>
      </div>
      <div className="flex-1 min-w-0 py-3">
        <p className="text-app-text font-jakarta text-sm font-semibold truncate">{m.name}</p>
        <div className="flex items-center gap-1.5 text-app-text-faint text-[10px] font-inter mt-0.5">
          {m.file_size > 0 && <span>{(m.file_size / 1024 / 1024).toFixed(1)} MB</span>}
          <span>·</span>
          <span>{m.uploader_name || 'Unknown'}</span>
          <span>·</span>
          <span>{m.created_at?.split('T')[0]}</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5 pr-2.5 flex-shrink-0">
        {onShare && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="p-2 text-app-text-faint hover:text-app-accent transition-colors rounded-lg"
            title="Share this file"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        )}
        <a
          href={`/api/materials/${m.id}/download`}
          download
          className="p-2 text-app-accent text-lg hover:scale-110 transition-transform"
          onClick={(e) => { if (!m.file_data) { e.preventDefault(); alert('Demo file — download available when uploaded'); } }}
        >
          ⬇
        </a>
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-2 text-app-text-faint hover:text-app-red transition-colors disabled:opacity-40"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
