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
  const { announcements, loading: annLoading, fetchAnnouncements } = useContentStore();
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

  const totalFiles = courses.length;
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-app-surface rounded-2xl p-4 border border-app-border">
          <span className="text-2xl mb-1 block">📢</span>
          <p className="text-app-text font-syne font-bold text-lg">{announcements.length}</p>
          <p className="text-app-text-dim text-xs font-dm">Announcements</p>
        </div>
        <div className="bg-app-surface rounded-2xl p-4 border border-app-border">
          <span className="text-2xl mb-1 block">📁</span>
          <p className="text-app-text font-syne font-bold text-lg">{totalFiles}</p>
          <p className="text-app-text-dim text-xs font-dm">Files</p>
        </div>
      </div>

      {/* My Space Card */}
      <button
        onClick={() => navigate(`/space/${currentSpace.id}`)}
        className="w-full bg-app-surface rounded-2xl p-4 border border-app-border text-left mb-5 active:scale-[0.99] transition-all duration-200 relative overflow-hidden"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-app-accent" />
        <div className="pl-4">
          <p className="text-app-text font-syne font-bold text-base">{currentSpace.name}</p>
          <p className="text-app-text-dim text-xs font-dm mt-0.5">Rep: {currentSpace.rep || 'You'}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] bg-app-accent/10 text-app-accent font-syne font-semibold px-2 py-0.5 rounded-md">{courses.length} courses</span>
            <span className="text-[10px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2 py-0.5 rounded-md">{currentSpace.level}</span>
          </div>
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
