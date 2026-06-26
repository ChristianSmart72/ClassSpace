import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { useAuthStore } from '../store/authStore';
import { FilterBar, Fab } from '../components/layout';
import { Badge, EmptyState, Skeleton } from '../components/ui/Shared';
import { PostAnnouncementSheet } from '../components/sheets/PostAnnouncement';
import { UploadMaterialSheet } from '../components/sheets/UploadMaterial';
import type { Announcement } from '../types';

export function Space() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSpace, courses, fetchSpace, memberRole, loading: spaceLoading, error: spaceError } = useSpaceStore();
  const { announcements, loading: annLoading, fetchAnnouncements, deleteAnnouncement } = useContentStore();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'ann' | 'mat'>('ann');
  const [filter, setFilter] = useState('all');
  const [showPost, setShowPost] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isRep = memberRole === 'rep';

  useEffect(() => {
    if (id) fetchSpace(id);
  }, [id]);

  useEffect(() => {
    if (id) fetchAnnouncements(id, filter);
  }, [id, filter]);

  const courseList = courses ?? [];
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'urgent', label: '🔴 Urgent' },
    { value: 'pinned', label: '📌 Pinned' },
    ...courseList.map((c) => ({ value: c.code, label: c.code })),
  ];

  const handleDelete = async (annId: number) => {
    if (!confirm('Delete this announcement?')) return;
    setDeletingId(annId);
    try {
      await deleteAnnouncement(annId);
    } finally {
      setDeletingId(null);
    }
  };

  if (spaceLoading) {
    return (
      <div className="px-4 pt-4">
        <Skeleton className="h-24 w-full rounded-2xl mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full mb-3 rounded-2xl" />)}
      </div>
    );
  }

  if (spaceError || !currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <span className="text-5xl mb-4">📭</span>
        <h2 className="text-app-text font-syne font-bold text-lg mb-2">Space not found</h2>
        <p className="text-app-text-dim text-sm font-dm mb-6">
          This space may no longer exist, or you may need to join it first.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/home')}
            className="bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl px-6 py-3"
          >
            Go Home
          </button>
          <button
            onClick={() => navigate('/join')}
            className="bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-xl px-6 py-3"
          >
            Join a Space
          </button>
        </div>
      </div>
    );
  }

  const urgentCount = announcements.filter(a => a.urgent).length;
  const pinnedCount = announcements.filter(a => a.pinned).length;

  return (
    <div className="pb-4">
      {/* Space Hero */}
      <div className="px-4 pt-5 pb-4 bg-app-surface mb-4 relative overflow-hidden border-b border-app-border">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-app-accent" />
        <div className="pl-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-app-text font-syne font-bold text-lg leading-tight">{currentSpace.name}</h1>
              <p className="text-app-text-dim text-sm font-dm mt-0.5">{currentSpace.uni}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-app-accent/10 flex items-center justify-center text-xl flex-shrink-0">
              🏛️
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] bg-app-accent/10 text-app-accent font-syne font-semibold px-2.5 py-1 rounded-full">{currentSpace.level}</span>
            <span className="text-[10px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2.5 py-1 rounded-full">{courseList.length} courses</span>
            {urgentCount > 0 && (
              <span className="text-[10px] bg-app-red/10 text-app-red font-syne font-semibold px-2.5 py-1 rounded-full">{urgentCount} urgent</span>
            )}
            <span className="text-[10px] bg-app-surface-2 text-app-text-faint font-syne px-2.5 py-1 rounded-full">Code: {currentSpace.invite_code}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mb-3 bg-app-surface rounded-xl p-1 border border-app-border">
        <button
          onClick={() => setTab('ann')}
          className={`flex-1 py-2 text-sm font-syne font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
            tab === 'ann' ? 'bg-app-accent text-app-bg' : 'text-app-text-dim'
          }`}
        >
          <span>📢</span> Announcements
          {announcements.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'ann' ? 'bg-app-bg/20 text-app-bg' : 'bg-app-surface-2 text-app-text-faint'}`}>
              {announcements.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('mat')}
          className={`flex-1 py-2 text-sm font-syne font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
            tab === 'mat' ? 'bg-app-accent text-app-bg' : 'text-app-text-dim'
          }`}
        >
          <span>📁</span> Materials
          {courseList.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'mat' ? 'bg-app-bg/20 text-app-bg' : 'bg-app-surface-2 text-app-text-faint'}`}>
              {courseList.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Announcements Tab */}
        {tab === 'ann' && (
          <motion.div
            key="ann"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <FilterBar filters={filterOptions} active={filter} onChange={setFilter} />
            <div className="px-4 flex flex-col gap-3">
              {annLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-app-surface rounded-2xl p-4 border border-app-border">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))
              ) : announcements.length === 0 ? (
                <EmptyState
                  icon="📢"
                  title="No announcements"
                  subtitle={filter !== 'all' ? 'Try a different filter' : isRep ? 'Tap + to post the first announcement' : 'Nothing posted yet'}
                />
              ) : (
                announcements.map((ann) => (
                  <AnnouncementCard
                    key={ann.id}
                    ann={ann}
                    expanded={expandedId === ann.id}
                    onToggle={() => setExpandedId(expandedId === ann.id ? null : ann.id)}
                    canDelete={isRep || ann.author_id === user?.id}
                    deleting={deletingId === ann.id}
                    onDelete={() => handleDelete(ann.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Materials Tab */}
        {tab === 'mat' && (
          <motion.div
            key="mat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="px-4"
          >
            {courseList.length === 0 ? (
              <EmptyState icon="📁" title="No courses yet" />
            ) : (
              <div className="flex flex-col gap-2">
                {courseList.map((course, i) => {
                  const COLORS = ['#e8ff47', '#5b6af0', '#52ffa0', '#ffb347', '#ff5252'];
                  const BG_COLORS = ['rgba(232,255,71,0.09)', 'rgba(91,106,240,0.09)', 'rgba(82,255,160,0.09)', 'rgba(255,179,71,0.09)', 'rgba(255,82,82,0.09)'];
                  const ci = (course.color_index ?? i) % 5;
                  return (
                    <button
                      key={course.id}
                      onClick={() => navigate(`/space/${currentSpace.id}/course/${course.id}`)}
                      className="bg-app-surface rounded-2xl border border-app-border text-left active:scale-[0.99] transition-all duration-200 flex items-center gap-4 relative overflow-hidden"
                      style={{ padding: '14px 16px' }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: COLORS[ci] }} />
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ml-2"
                        style={{ background: BG_COLORS[ci] }}
                      >
                        {course.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-app-text font-syne font-bold text-sm leading-snug">{course.name}</p>
                        <p className="text-app-text-dim text-xs font-dm mt-0.5">{course.code}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-app-text-dim text-xs font-dm bg-app-surface-2 px-2 py-0.5 rounded-lg">Files →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isRep && tab === 'ann' && (
        <Fab onClick={() => setShowPost(true)} icon="+" />
      )}
      {isRep && tab === 'mat' && (
        <Fab onClick={() => setShowUpload(true)} icon="+" />
      )}

      {showPost && id && (
        <PostAnnouncementSheet spaceId={id} onClose={() => setShowPost(false)} />
      )}
      {showUpload && (
        <UploadMaterialSheet onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}

function AnnouncementCard({
  ann, expanded, onToggle, canDelete, deleting, onDelete,
}: {
  ann: Announcement;
  expanded: boolean;
  onToggle: () => void;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const isLong = ann.body.length > 120;
  const TYPE_ICONS: Record<string, string> = {
    assignment: '📝',
    test: '🧪',
    meeting: '🤝',
    update: '📡',
    announcement: '📢',
  };

  return (
    <div className={`bg-app-surface rounded-2xl border ${ann.urgent ? 'border-app-red/30' : ann.pinned ? 'border-app-accent/30' : 'border-app-border'} overflow-hidden`}>
      {ann.urgent && (
        <div className="bg-app-red/10 border-b border-app-red/20 px-4 py-1.5 flex items-center gap-1.5">
          <span className="text-xs">🔴</span>
          <span className="text-app-red text-[11px] font-syne font-bold uppercase tracking-wider">Urgent</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="text-sm">{TYPE_ICONS[ann.type] || '📢'}</span>
          {ann.type === 'assignment' && <Badge variant="assign">Assignment</Badge>}
          {ann.type === 'test' && <Badge variant="test">Test</Badge>}
          {ann.type === 'meeting' && <Badge variant="meet">Meeting</Badge>}
          {ann.type === 'update' && <Badge variant="update">Update</Badge>}
          {ann.type === 'announcement' && <Badge>Announcement</Badge>}
          {ann.pinned && <Badge variant="pin">📌 Pinned</Badge>}
          {ann.course_code && (
            <span className="text-[10px] bg-app-accent2/10 text-app-accent2 font-syne font-semibold px-1.5 py-0.5 rounded">{ann.course_code}</span>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="ml-auto text-app-text-faint hover:text-app-red transition-colors text-sm px-1 disabled:opacity-40"
            >
              🗑
            </button>
          )}
        </div>

        <h3 className="text-app-text font-syne font-bold text-base leading-tight mb-1">{ann.title}</h3>
        <p className={`text-app-text-dim text-sm font-dm leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
          {ann.body}
        </p>
        {isLong && (
          <button onClick={onToggle} className="text-app-accent text-xs font-syne font-semibold mt-1">
            {expanded ? 'Show less ↑' : 'Read more ↓'}
          </button>
        )}

        {(ann.deadline || ann.venue) && (
          <div className="mt-3 bg-app-surface-2 rounded-xl p-3 border border-app-border flex flex-col gap-1.5">
            {ann.deadline && (
              <div className="flex items-center gap-2 text-xs font-dm">
                <span>⏰</span>
                <span className="text-app-text font-semibold">Deadline:</span>
                <span className="text-app-orange">{ann.deadline}</span>
              </div>
            )}
            {ann.venue && (
              <div className="flex items-center gap-2 text-xs font-dm">
                <span>📍</span>
                <span className="text-app-text font-semibold">Venue:</span>
                <span className="text-app-text-dim">{ann.venue}</span>
              </div>
            )}
          </div>
        )}

        {expanded && ann.instructions && (
          <div className="mt-3 pt-3 border-t border-app-border">
            <p className="text-app-text-dim text-[10px] font-syne font-semibold uppercase tracking-wider mb-1.5">Instructions</p>
            <p className="text-app-text text-xs font-dm leading-relaxed">{ann.instructions}</p>
          </div>
        )}

        {expanded && ann.submission_method && (
          <div className="mt-2 pt-2 border-t border-app-border">
            <p className="text-app-text-dim text-[10px] font-syne font-semibold uppercase tracking-wider mb-1">Submission</p>
            <p className="text-app-text text-xs font-dm">{ann.submission_method}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-app-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-app-accent2/20 flex items-center justify-center text-xs text-app-accent2 font-syne font-bold">
              {ann.author_name?.charAt(0)}
            </div>
            <div>
              <p className="text-app-text-dim text-xs font-dm">{ann.author_name}</p>
              <p className="text-app-text-faint text-[10px] font-dm">{ann.created_at?.split('T')[0]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
