import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShareData } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import type { ShareData, SharedSpace, SharedAnnouncement, SharedMaterial, SharedCourse } from '../types';

export function JoinPreview() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { joinSpace, setSpace } = useSpaceStore();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.name || '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (type && id) {
      getShareData(type, id)
        .then(setData)
        .catch(() => setError('Failed to load preview'))
        .finally(() => setLoading(false));
    }
  }, [type, id]);

  const handleJoin = async () => {
    if (!data) return;
    setJoining(true);
    setError('');

    if (data.type === 'space') {
      try {
        const space = await joinSpace(data.invite_code);
        if (!user) {
          const fakeUser = { id: 0, name, email: 'guest@classspace.app', role: 'member' as const, avatar: null };
          (useAuthStore.getState() as any).setUser?.(fakeUser);
        }
        navigate(`/space/${space.id}`);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to join');
      }
    } else {
      setSpace(
        { id: data.space.id, name: data.space.name } as any,
        []
      );
      navigate(`/join/space/${data.space.id}`);
    }
    setJoining(false);
  };

  const handleGuest = () => {
    handleJoin();
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6">
        <span className="text-4xl mb-4">🔗</span>
        <h2 className="text-app-text font-syne font-bold text-lg mb-2">Invalid Link</h2>
        <p className="text-app-text-dim text-sm font-dm mb-4">{error || 'This link does not exist'}</p>
        <button onClick={() => navigate('/')} className="text-app-accent font-syne font-semibold text-sm">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-app-text-dim hover:text-app-text text-lg mb-4 self-start">← Back</button>

      {data.type === 'space' && <SpacePreview data={data} name={name} setName={setName} onJoin={handleJoin} onGuest={handleGuest} joining={joining} />}
      {data.type === 'announcement' && <AnnouncementPreview data={data} onJoin={handleJoin} />}
      {data.type === 'material' && <MaterialPreview data={data} onJoin={handleJoin} />}
      {data.type === 'course' && <CoursePreview data={data} onJoin={handleJoin} />}
    </div>
  );
}

function SpacePreview({ data, name, setName, onJoin, onGuest, joining }: {
  data: SharedSpace; name: string; setName: (n: string) => void;
  onJoin: () => void; onGuest: () => void; joining: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-app-accent2/20 flex items-center justify-center text-3xl mb-4">📋</div>
        <h2 className="text-app-text font-syne font-bold text-lg">{data.name}</h2>
        <p className="text-app-text-dim text-sm font-dm">{data.uni}</p>
        <p className="text-app-text-dim text-xs font-dm mt-1">Rep: {data.rep}</p>

        {data.announcementTeaser && (
          <div className="w-full mt-6 bg-app-surface rounded-2xl p-4 border border-app-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-app-surface/80" />
            <p className="text-app-text-dim text-xs font-dm mb-1">Latest announcement</p>
            <p className="text-app-text font-dm text-sm">{data.announcementTeaser}</p>
          </div>
        )}

        <div className="w-full mt-6">
          <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block text-left">
            Your Name
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors"
            placeholder="Enter your name" />
        </div>

        <button onClick={onJoin} disabled={!name || joining}
          className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-3.5 mt-4 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
          {joining ? 'Joining...' : 'Join this Space'}
        </button>
        <button onClick={onGuest}
          className="w-full bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-xl py-3.5 mt-2 active:scale-[0.98] transition-all duration-200">
          Browse as Guest
        </button>
      </div>
    </div>
  );
}

function AnnouncementPreview({ data, onJoin }: { data: SharedAnnouncement; onJoin: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-app-surface rounded-2xl p-4 border border-app-border mb-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`text-[10px] font-syne font-semibold px-2 py-0.5 rounded-full border ${
            data.urgent ? 'bg-app-red/15 text-app-red border-app-red/30' : 'bg-app-surface-2 text-app-text-dim border-app-border'
          }`}>{data.type_label}</span>
          {data.course && <span className="text-[10px] bg-app-accent2/10 text-app-accent2 font-syne font-semibold px-1.5 py-0.5 rounded">{data.course.code}</span>}
        </div>
        <h3 className="text-app-text font-syne font-bold text-lg mb-2">{data.title}</h3>
        <p className="text-app-text-dim text-sm font-dm leading-relaxed">{data.body}</p>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-6 h-6 rounded-full bg-app-accent2/20 flex items-center justify-center text-xs text-app-accent2 font-syne font-bold">{data.author?.charAt(0)}</div>
          <p className="text-app-text-dim text-xs font-dm">{data.author} · {data.time?.split('T')[0]}</p>
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-app-text-dim text-xs font-dm text-center mb-3">From {data.space?.name}</p>
        <button onClick={onJoin} className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
          View in Space
        </button>
      </div>
    </div>
  );
}

function MaterialPreview({ data, onJoin }: { data: SharedMaterial; onJoin: () => void }) {
  const iconMap: Record<string, string> = { pdf: '📄', doc: '📝', ppt: '📊', img: '🖼️', video: '🎬' };
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center text-center">
        <span className="text-5xl mb-4">{iconMap[data.file_type] || '📁'}</span>
        <h2 className="text-app-text font-syne font-bold text-lg">{data.name}</h2>
        <p className="text-app-text-dim text-sm font-dm">{data.course.code} · {data.category}</p>
        <p className="text-app-text-dim text-xs font-dm mt-1">{(data.file_size / 1024 / 1024).toFixed(1)} MB</p>
        <p className="text-app-text-faint text-xs font-dm mt-4">Uploaded by {data.uploader}</p>
        <p className="text-app-text-faint text-xs font-dm">From {data.space.name}</p>
      </div>
      <button onClick={onJoin} className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
        View in Space
      </button>
    </div>
  );
}

function CoursePreview({ data, onJoin }: { data: SharedCourse; onJoin: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{data.icon}</span>
          <div>
            <h2 className="text-app-text font-syne font-bold text-lg">{data.name}</h2>
            <p className="text-app-text-dim text-sm font-dm">{data.code} · {data.totalFiles} file{data.totalFiles !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {data.files.map((f) => (
            <div key={f.id} className="bg-app-surface rounded-xl p-3 border border-app-border flex items-center gap-3">
              <span className="text-lg">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-app-text font-dm text-sm truncate">{f.name}</p>
                <p className="text-app-text-faint text-[10px] font-dm">{f.category}</p>
              </div>
            </div>
          ))}
        </div>
        {data.totalFiles > data.files.length && (
          <p className="text-app-text-dim text-xs font-dm text-center mt-3">+{data.totalFiles - data.files.length} more</p>
        )}
        <p className="text-app-text-faint text-xs font-dm text-center mt-4">From {data.space.name}</p>
      </div>
      <button onClick={onJoin} className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
        View in Space
      </button>
    </div>
  );
}
