import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAnnouncement, getMaterials } from '../api/content';
import type { Announcement, Material } from '../types';
import { Skeleton } from '../components/ui/Shared';
import { ShareSheet } from '../components/sheets/ShareSheet';

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function isDueSoon(iso: string): boolean {
  return new Date(iso).getTime() - Date.now() < 72 * 60 * 60 * 1000;
}

function fileIcon(fileType: string, category: string): string {
  if (category === 'slides' || fileType.includes('presentation') || fileType.includes('powerpoint')) return '📊';
  if (category === 'notes' || fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  return '📁';
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadFile(material: Material) {
  if (!material.file_data) return;
  const byteStr = atob(material.file_data.split(',')[1] ?? material.file_data);
  const arr = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
  const blob = new Blob([arr], { type: material.file_type || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = material.name; a.click();
  URL.revokeObjectURL(url);
}

// Demo attachments shown when course has no real uploads yet (pitch mode)
function demoAttachments(ann: Announcement): Material[] {
  const base: Material[] = [
    {
      id: -1, space_id: ann.space_id, course_id: ann.course_id ?? 0,
      name: `${ann.course_code || 'Course'} Lecture Slides — Week 6`,
      file_data: undefined, file_size: 2.4 * 1024 * 1024,
      file_type: 'application/vnd.ms-powerpoint',
      category: 'slides', uploader_id: ann.author_id,
      uploader_name: ann.author_name,
      created_at: ann.created_at,
    },
  ];
  if (ann.type === 'assignment') {
    base.push({
      id: -2, space_id: ann.space_id, course_id: ann.course_id ?? 0,
      name: 'Lab Report Template',
      file_data: undefined, file_size: 145 * 1024,
      file_type: 'application/msword',
      category: 'notes', uploader_id: ann.author_id,
      uploader_name: ann.author_name,
      created_at: ann.created_at,
    });
  }
  return base;
}

// ─── Type badge colours ────────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  assignment: { label: 'Assignment', color: '#ffffff', bg: '#4f46e5' },
  test:       { label: 'Test',       color: '#ffffff', bg: '#dc2626' },
  meeting:    { label: 'Meeting',    color: '#ffffff', bg: '#7c3aed' },
  update:     { label: 'Update',     color: '#0f0f11', bg: '#e8ff47' },
  announcement:{ label: 'Announcement', color: '#0f0f11', bg: '#e8ff47' },
};

// ─── Attachment card ────────────────────────────────────────────────────────
function AttachmentCard({ mat, isDemo }: { mat: Material; isDemo: boolean }) {
  const icon = fileIcon(mat.file_type, mat.category);
  const size = fileSize(mat.file_size);
  const catLabel = mat.category.charAt(0).toUpperCase() + mat.category.slice(1);

  return (
    <div className="bg-app-surface-2 rounded-2xl border border-app-border flex items-center gap-3 px-4 py-3">
      <div className="w-11 h-11 rounded-xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-app-text font-jakarta font-semibold text-sm leading-snug truncate">{mat.name}</p>
        <p className="text-app-text-faint text-xs font-inter mt-0.5">{catLabel} · {size}</p>
      </div>
      {isDemo ? (
        <div className="w-9 h-9 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text-faint flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
      ) : (
        <button
          onClick={() => downloadFile(mat)}
          className="w-9 h-9 rounded-xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-app-accent flex-shrink-0 hover:bg-app-accent/20 transition-colors active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Key detail row ────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, valueColor }: {
  icon: string; label: string; value: string; valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-app-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-app-surface-2 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-app-text-faint text-[10px] font-jakarta font-bold uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-app-text font-inter text-sm font-medium" style={valueColor ? { color: valueColor } : {}}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────
export function AnnouncementDetail() {
  const { id: spaceId, annId } = useParams<{ id: string; annId: string }>();
  const navigate = useNavigate();
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareSheet, setShowShareSheet] = useState(false);

  useEffect(() => {
    if (!annId) return;
    setLoading(true);
    getAnnouncement(Number(annId))
      .then(async (data) => {
        setAnn(data);
        if (data.course_id) {
          try {
            const mats = await getMaterials(data.course_id);
            setMaterials(mats);
          } catch { /* ignore */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [annId]);

  const handleShare = () => {
    setShowShareSheet(true);
  };

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full mb-4" />
        <Skeleton className="h-8 w-4/5 mb-2" />
        <Skeleton className="h-8 w-3/5 mb-5" />
        <Skeleton className="h-36 rounded-2xl mb-4" />
        <Skeleton className="h-4 w-28 mb-3" />
        <Skeleton className="h-20 rounded-2xl mb-2" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  if (!ann) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <span className="text-5xl mb-4">📭</span>
        <h2 className="text-app-text font-jakarta font-bold text-lg mb-2">Announcement not found</h2>
        <button onClick={() => navigate(-1)} className="bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl px-6 py-3 mt-4" style={{ color: 'var(--app-on-accent)' }}>
          Go back
        </button>
      </div>
    );
  }

  const meta = TYPE_META[ann.type] ?? TYPE_META.announcement;
  const hasKeyDetails = !!(ann.deadline || ann.submission_method || ann.format || ann.venue);
  const showMaterials = ann.course_id != null;
  const displayMaterials = materials.length > 0 ? materials : (showMaterials ? demoAttachments(ann) : []);
  const usingDemoMats = materials.length === 0 && showMaterials;

  return (
    <div className="pb-24">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 bg-app-bg/95 backdrop-blur-md border-b border-app-border">
        <div className="flex items-center gap-3 px-4 h-14 max-w-[430px] lg:max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text-dim hover:text-app-text transition-colors flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-app-text font-jakarta font-semibold text-base">Announcement</h1>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-app-accent font-jakarta font-semibold text-sm transition-opacity hover:opacity-80"
          >
            <><span>Share</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg></>
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-[430px] lg:max-w-3xl mx-auto">
        {/* ── Urgent banner ── */}
        {ann.urgent && (
          <div className="bg-app-red/10 border border-app-red/30 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-app-red animate-pulse flex-shrink-0" />
            <span className="text-app-red text-xs font-jakarta font-bold uppercase tracking-wider">Urgent Alert</span>
          </div>
        )}

        {/* ── Type badge ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-jakarta font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-xl mb-3"
            style={{ background: meta.bg, color: meta.color }}
          >
            {ann.type === 'assignment' && '📝'}
            {ann.type === 'test' && '🧪'}
            {ann.type === 'meeting' && '🤝'}
            {ann.type === 'update' && '📡'}
            {ann.type === 'announcement' && '📢'}
            {' '}{meta.label}
          </span>
        </motion.div>

        {/* ── Title ── */}
        <motion.h2
          className="text-app-text font-jakarta font-extrabold text-[26px] leading-[1.15] mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04 }}
        >
          {ann.title}
        </motion.h2>

        {/* ── Tags row ── */}
        <motion.div
          className="flex flex-wrap gap-2 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.08 }}
        >
          {ann.course_code && (
            <span className="text-[11px] bg-app-accent2/15 text-app-accent2 font-jakarta font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
              {ann.course_code}{ann.course_name ? ` — ${ann.course_name}` : ''}
            </span>
          )}
          {ann.pinned && (
            <span className="text-[11px] bg-app-accent/15 text-app-accent font-jakarta font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              📌 Pinned
            </span>
          )}
        </motion.div>

        {/* ── Timestamp ── */}
        <p className="text-app-text-faint text-xs font-inter mb-5">{relativeTime(ann.created_at)}</p>

        {/* ── Key Details ── */}
        {hasKeyDetails && (
          <motion.div
            className="bg-app-surface rounded-2xl border border-app-border overflow-hidden mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="px-4 pt-3 pb-1">
              <p className="text-app-text-faint text-[10px] font-jakarta font-bold uppercase tracking-widest">Key Details</p>
            </div>
            <div className="px-4 pb-2">
              {ann.deadline && (
                <DetailRow
                  icon="⏰"
                  label="Deadline"
                  value={formatDeadline(ann.deadline)}
                  valueColor="var(--app-red)"
                />
              )}
              {ann.submission_method && (
                <DetailRow icon="📦" label="Submission" value={ann.submission_method} />
              )}
              {ann.format && (
                <DetailRow icon="📄" label="Format" value={ann.format} />
              )}
              {ann.venue && (
                <DetailRow icon="📍" label="Venue" value={ann.venue} />
              )}
            </div>
          </motion.div>
        )}

        {/* ── Instructions / body ── */}
        {ann.body && (
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.14 }}
          >
            <p className="text-app-text-faint text-[10px] font-jakarta font-bold uppercase tracking-widest mb-3">Instructions</p>
            <div className="bg-app-surface rounded-2xl border border-app-border px-4 py-4">
              <p className="text-app-text-dim font-inter text-sm leading-relaxed whitespace-pre-wrap">{ann.body}</p>
              {ann.instructions && ann.instructions !== ann.body && (
                <p className="text-app-text-dim font-inter text-sm leading-relaxed whitespace-pre-wrap mt-3 pt-3 border-t border-app-border">{ann.instructions}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Attachments ── */}
        {showMaterials && displayMaterials.length > 0 && (
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-app-text-faint text-[10px] font-jakarta font-bold uppercase tracking-widest">Attachments</p>
              {usingDemoMats && (
                <span className="text-[10px] text-app-text-faint font-inter bg-app-surface-2 px-2 py-0.5 rounded-full border border-app-border">Sample</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {displayMaterials.map((mat) => (
                <AttachmentCard key={mat.id} mat={mat} isDemo={mat.id < 0} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Author footer ── */}
        <motion.div
          className="bg-app-surface rounded-2xl border border-app-border px-4 py-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.22 }}
        >
          <div className="w-11 h-11 rounded-full bg-app-accent2/20 border border-app-accent2/30 flex items-center justify-center text-base text-app-accent2 font-jakarta font-bold flex-shrink-0">
            {ann.author_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-app-text font-jakarta font-semibold text-sm">{ann.author_name}</p>
            <p className="text-app-text-faint text-xs font-inter">Posted {relativeTime(ann.created_at)}</p>
          </div>
          {ann.deadline && isDueSoon(ann.deadline) && (
            <span className="text-xs font-jakarta font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: '#d97706', color: '#fff' }}>
              Due Soon
            </span>
          )}
        </motion.div>
      </div>
      {showShareSheet && annId && spaceId && (
        <ShareSheet
          type="ann"
          id={annId}
          spaceId={spaceId}
          onClose={() => setShowShareSheet(false)}
        />
      )}
    </div>
  );
}