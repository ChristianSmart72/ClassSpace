import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { Badge } from '../components/ui/Shared';

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentSpace, courses, loading: spaceLoading } = useSpaceStore();
  const { announcements, fetchAnnouncements } = useContentStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    if (currentSpace) {
      fetchAnnouncements(currentSpace.id);
    }
  }, [currentSpace]);

  const courseCount = courses.length;
  const loading = (!currentSpace && localStorage.getItem('spaceId')) || spaceLoading;

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-20 rounded-2xl mb-5" />
        <Skeleton className="h-4 w-32 mb-3" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl mb-2" />)}
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6">
        <EmptyState
          icon="📚"
          title="No space yet"
          subtitle="Create or join a space to get started"
          action={
            <div className="flex gap-3">
              <button onClick={() => navigate('/setup')} className="bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl px-6 py-3">
                Create Space
              </button>
              <button onClick={() => navigate('/join')} className="bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-xl px-6 py-3">
                Join
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-6">
        <h1 className="text-app-text font-syne font-bold text-xl">{greeting}, {user?.name?.split(' ')[0]}</h1>
        <p className="text-app-text-dim text-sm font-dm">{currentSpace.uni}</p>
      </div>

      {/* Stats — first card highlighted in accent */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-4 border" style={{ background: '#e8ff47', borderColor: '#e8ff47' }}>
          <span className="text-2xl mb-1 block">📢</span>
          <p className="font-syne font-extrabold text-2xl" style={{ color: '#0f0f11' }}>{announcements.length}</p>
          <p className="text-xs font-dm" style={{ color: '#3a3a1a' }}>Announcements</p>
        </div>
        <div className="bg-app-surface rounded-2xl p-4 border border-app-border">
          <span className="text-2xl mb-1 block">📚</span>
          <p className="text-app-text font-syne font-extrabold text-2xl">{courseCount}</p>
          <p className="text-app-text-dim text-xs font-dm">Courses</p>
        </div>
      </div>

      {/* My Space Card — with icon box like the original */}
      <button
        onClick={() => navigate(`/space/${currentSpace.id}`)}
        className="w-full bg-app-surface rounded-2xl border border-app-border text-left mb-5 active:scale-[0.99] transition-all duration-200 relative overflow-hidden"
        style={{ padding: '18px' }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: '#e8ff47' }} />
        <div className="flex items-center gap-4 pl-3 mb-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(232,255,71,0.10)' }}>
            🏛️
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-app-text font-syne font-extrabold text-base leading-tight">{currentSpace.name}</p>
            <p className="text-app-text-dim text-xs font-dm mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-app-green inline-block" />
              Class Rep: {currentSpace.rep || user?.name?.split(' ')[0] || 'You'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pl-3">
          <span className="text-[11px] bg-app-accent/10 text-app-accent font-syne font-semibold px-2.5 py-1 rounded-full">{courses.length} courses</span>
          <span className="text-[11px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2.5 py-1 rounded-full">{currentSpace.level}</span>
          <span className="text-[11px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2.5 py-1 rounded-full">{currentSpace.uni.split(' ').at(-1)}</span>
        </div>
      </button>

      {/* Recent Announcements */}
      <h2 className="text-app-text font-syne font-semibold text-sm mb-3">Recent Announcements</h2>
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-app-surface rounded-2xl p-4 border border-app-border">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-app-surface rounded-2xl p-6 border border-app-border text-center">
          <p className="text-app-text-dim text-sm font-dm">No announcements yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {announcements.slice(0, 5).map((ann) => (
            <button
              key={ann.id}
              onClick={() => navigate(`/space/${currentSpace.id}`)}
              className="w-full bg-app-surface rounded-xl p-3.5 border border-app-border text-left active:scale-[0.99] transition-all duration-200"
            >
              <div className="flex items-start gap-2 mb-1">
                {ann.urgent && <Badge variant="urgent">Urgent</Badge>}
                {ann.pinned && <Badge variant="pin">Pinned</Badge>}
                {ann.course_code && (
                  <span className="text-[10px] bg-app-accent2/10 text-app-accent2 font-syne font-semibold px-1.5 py-0.5 rounded">{ann.course_code}</span>
                )}
              </div>
              <p className="text-app-text font-dm text-sm font-medium leading-snug line-clamp-1">{ann.title}</p>
              <p className="text-app-text-dim text-xs font-dm mt-0.5">{ann.author_name} · {ann.created_at?.split('T')[0]}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
