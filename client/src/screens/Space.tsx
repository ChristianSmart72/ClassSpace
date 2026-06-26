import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { currentSpace, courses, fetchSpace, memberRole, loading: spaceLoading } = useSpaceStore();
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

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'pinned', label: 'Pinned' },
    ...courses.map((c) => ({ value: c.code, label: c.code })),
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

  if (spaceLoading || !currentSpace) {
    return (
      <div className="px-4 pt-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full mb-3" />)}
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Space Hero */}
      <div className="px-4 pt-4 pb-3 bg-app-surface mb-4 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-app-accent" />
        <div className="pl-4">
          <h1 className="text-app-text font-syne font-bold text-lg">{currentSpace.name}</h1>
          <p className="text-app-text-dim text-sm font-dm">{currentSpace.uni}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] bg-app-accent/10 text-app-accent font-syne font-semibold px-2 py-0.5 rounded-md">{currentSpace.level}</span>
            <span className="text-[10px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2 py-0.5 rounded-md">{courses.length} courses</span>
            <span className="text-[10px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2 py-0.5 rounded-md">Code: {currentSpace.invite_code}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mb-3 bg-app-surface rounded-xl p-1 border border-app-border">
        <button
          onClick={() => setTab('ann')}
          className={`flex-1 py-2 text-sm font-syne font-semibold rounded-lg transition-all duration-200 ${
            tab === 'ann' ? 'bg-app-accent text-app-bg' : 'text-app-text-dim'
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setTab('mat')}
          className={`flex-1 py-2 text-sm font-syne font-semibold rounded-lg transition-all duration-200 ${
            tab === 'mat' ? 'bg-app-accent text-app-bg' : 'text-app-text-dim'
          }`}
        >
          Materials
        </button>
      </div>

      {/* Announcements Tab */}
      {tab === 'ann' && (
        <div>
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
              <EmptyState icon="📢" title="No announcements" subtitle={filter !== 'all' ? 'Try a different filter' : isRep ? 'Tap + to post the first announcement' : 'Nothing posted yet'} />
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
        </div>
      )}

      {/* Materials Tab — vertical list with color-coded left borders */}
      {tab === 'mat' && (
        <div className="px-4">
          {courses.length === 0 ? (
            <EmptyState icon="📁" title="No courses yet" />
          ) : (
            <div className="flex flex-col gap-2">
              {courses.map((course, i) => {
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
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ml-2" style={{ background: BG_COLORS[ci] }}>
                      {course.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-app-text font-syne font-bold text-sm leading-snug">{course.name}</p>
                      <p className="text-app-text-dim text-xs font-dm mt-0.5">{course.code}</p>
                    </div>
                    <span className="text-app-text-dim text-xs font-dm bg-app-surface-2 px-2 py-0.5 rounded-lg flex-shrink-0">Files →</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rep FAB */}
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

  return (
    <div className={`bg-app-surface rounded-2xl border ${ann.pinned ? 'border-app-accent/30' : 'border-app-border'} overflow-hidden`}>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {ann.type === 'assignment' && <Badge variant="assign">Assignment</Badge>}
          {ann.type === 'test' && <Badge variant="test">Test</Badge>}
          {ann.type === 'meeting' && <Badge variant="meet">Meeting</Badge>}
          {ann.type === 'update' && <Badge variant="update">Update</Badge>}
          {ann.type === 'announcement' && <Badge>Announcement</Badge>}
          {ann.urgent && <Badge variant="urgent">Urgent</Badge>}
          {ann.pinned && <Badge variant="pin">Pinned</Badge>}
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
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Key Details */}
        {(ann.deadline || ann.venue) && (
          <div className="mt-3 bg-app-surface-2 rounded-xl p-3 border border-app-border">
            {ann.deadline && (
              <div className="flex items-center gap-2 text-xs font-dm mb-1.5">
                <span className="text-app-orange">⏰</span>
                <span className="text-app-text">Deadline:</span>
                <span className="text-app-text-dim">{ann.deadline}</span>
              </div>
            )}
            {ann.venue && (
              <div className="flex items-center gap-2 text-xs font-dm">
                <span className="text-app-accent2">📍</span>
                <span className="text-app-text">Venue:</span>
                <span className="text-app-text-dim">{ann.venue}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
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

        {expanded && ann.instructions && (
          <div className="mt-3 pt-3 border-t border-app-border">
            <p className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1">Instructions</p>
            <p className="text-app-text text-xs font-dm leading-relaxed">{ann.instructions}</p>
          </div>
        )}
        {!expanded && ann.instructions && (
          <div className="mt-3 pt-3 border-t border-app-border">
            <p className="text-app-text text-xs font-dm leading-relaxed">{ann.instructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
