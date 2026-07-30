import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getShareData } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { canGoBack } from '../lib/time';
import type { ShareData, SharedSpace, SharedAnnouncement, SharedMaterial, SharedCourse } from '../types';

export function JoinPreview() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const joinSpace = useSpaceStore(s => s.joinSpace);
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
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

    // If not logged in, save invite code and redirect to register
    if (!user) {
      if (data.type === 'space') {
        localStorage.setItem('pendingInviteCode', data.invite_code);
        localStorage.setItem('pendingSpaceId', data.id);
      }
      navigate('/register');
      return;
    }

    setJoining(true);
    setError('');

    try {
      if (data.type === 'space') {
        const space = await joinSpace(data.invite_code);
        navigate(`/space/${space.id}`);
      } else {
        // For non-space previews, go to the space
        navigate(`/space/${data.space.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app-bg">
        <div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-app-bg">
        <span className="text-4xl mb-4">🔗</span>
        <h2 className="text-app-text font-jakarta font-bold text-lg mb-2">Invalid Link</h2>
        <p className="text-app-text-dim text-sm font-inter mb-4">{error || 'This link does not exist'}</p>
        <button onClick={() => navigate('/')} className="text-app-accent font-jakarta font-semibold text-sm">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 bg-app-bg">
      <button onClick={() => canGoBack() ? navigate(-1) : navigate('/')} className="text-app-text-dim hover:text-app-text text-lg mb-4 self-start">← Back</button>

      {data.type === 'space' && <SpacePreview data={data} user={user} onJoin={handleJoin} joining={joining} error={error} />}
      {data.type === 'announcement' && <AnnouncementPreview data={data} onJoin={handleJoin} user={user} />}
      {data.type === 'material' && <MaterialPreview data={data} onJoin={handleJoin} user={user} />}
      {data.type === 'course' && <CoursePreview data={data} onJoin={handleJoin} user={user} />}
    </div>
  );
}

function AuthPrompt({ inviteCode }: { inviteCode?: string }) {
  useEffect(() => {
    if (inviteCode) localStorage.setItem('pendingInviteCode', inviteCode);
  }, [inviteCode]);
  return (
    <div className="w-full mt-6 bg-app-accent/5 border border-app-accent/20 rounded-2xl p-4 text-center">
      <p className="text-app-text font-jakarta font-semibold text-sm mb-1">Sign in to join this Space</p>
      <p className="text-app-text-dim text-xs font-inter mb-4">Create a free account or sign in to join</p>
      <div className="flex gap-2">
        <Link
          to="/register"
          className="flex-1 bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3 text-center"
        >
          Create Account
        </Link>
        <Link
          to="/login"
          className="flex-1 bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-xl py-3 text-center"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

function SpacePreview({ data, user, onJoin, joining, error }: {
  data: SharedSpace;
  user: any;
  onJoin: () => void;
  joining: boolean;
  error: string;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-3xl mb-4">🏛️</div>
        <h2 className="text-app-text font-jakarta font-bold text-xl">{data.name}</h2>
        <p className="text-app-text-dim text-sm font-inter mt-1">{data.uni}</p>
        <p className="text-app-text-faint text-xs font-inter mt-0.5">{data.dept} · Rep: {data.rep}</p>

        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          <span className="text-[11px] bg-app-accent/10 text-app-accent font-jakarta font-semibold px-2.5 py-1 rounded-full">{data.level}</span>
          <span className="text-[11px] bg-app-surface border border-app-border text-app-text-dim font-jakarta font-semibold px-2.5 py-1 rounded-full">
            Code: {data.invite_code}
          </span>
        </div>

        {data.announcementTeaser && (
          <div className="w-full mt-6 bg-app-surface rounded-2xl p-4 border border-app-border relative overflow-hidden text-left">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-app-bg/50 pointer-events-none" />
            <p className="text-app-text-faint text-[10px] font-jakarta font-semibold uppercase tracking-wider mb-1.5">Latest announcement</p>
            <p className="text-app-text font-inter text-sm line-clamp-2">{data.announcementTeaser}</p>
          </div>
        )}

        {error && (
          <div className="w-full mt-4 bg-app-red/10 border border-app-red/30 rounded-xl px-4 py-3">
            <p className="text-app-red text-sm font-inter">{error}</p>
          </div>
        )}

        {user ? (
          <button
            onClick={onJoin}
            disabled={joining}
            className="w-full bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-2xl py-4 mt-6 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join this Space'}
          </button>
        ) : (
          <AuthPrompt inviteCode={data.invite_code} />
        )}
      </div>
    </div>
  );
}

function AnnouncementPreview({ data, onJoin, user }: { data: SharedAnnouncement; onJoin: () => void; user: any }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-app-surface rounded-2xl p-4 border border-app-border mb-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`text-[10px] font-jakarta font-semibold px-2 py-0.5 rounded-full border ${
            data.urgent ? 'bg-app-red/15 text-app-red border-app-red/30' : 'bg-app-surface-2 text-app-text-dim border-app-border'
          }`}>{data.type_label}</span>
          {data.course && <span className="text-[10px] bg-app-accent2/10 text-app-accent2 font-jakarta font-semibold px-1.5 py-0.5 rounded">{data.course.code}</span>}
        </div>
        <h3 className="text-app-text font-jakarta font-bold text-lg mb-2">{data.title}</h3>
        <p className="text-app-text-dim text-sm font-inter leading-relaxed">{data.body}</p>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-6 h-6 rounded-full bg-app-accent2/20 flex items-center justify-center text-xs text-app-accent2 font-jakarta font-bold">
            {data.author?.charAt(0)}
          </div>
          <p className="text-app-text-dim text-xs font-inter">{data.author} · {data.time?.split('T')[0]}</p>
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-app-text-dim text-xs font-inter text-center mb-3">From {data.space?.name}</p>
        {user ? (
          <button onClick={onJoin} className="w-full bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
            View in Space →
          </button>
        ) : (
          <AuthPrompt />
        )}
      </div>
    </div>
  );
}

function MaterialPreview({ data, onJoin, user }: { data: SharedMaterial; onJoin: () => void; user: any }) {
  const iconMap: Record<string, string> = { pdf: '📄', doc: '📝', ppt: '📊', img: '🖼️', video: '🎬' };
  const downloadUrl = `/api/materials/${data.id}/download`;

  return (
    <div className="flex-1 flex flex-col">
      {/* File preview card */}
      <div className="bg-app-surface rounded-2xl border border-app-border p-5 mb-4 flex flex-col items-center text-center">
        <span className="text-5xl mb-3">{iconMap[data.file_type] || '📁'}</span>
        <h2 className="text-app-text font-jakarta font-bold text-lg mb-1">{data.name}</h2>
        <div className="flex items-center gap-2 flex-wrap justify-center mb-3">
          <span className="text-[10px] bg-app-accent2/10 text-app-accent2 font-jakarta font-semibold px-2 py-0.5 rounded-full">{data.course.code}</span>
          <span className="text-[10px] bg-app-surface-2 text-app-text-dim font-jakarta font-semibold px-2 py-0.5 rounded-full">{data.category}</span>
          <span className="text-[10px] text-app-text-faint font-inter">{(data.file_size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
        <p className="text-app-text-faint text-xs font-inter">
          Shared by <span className="text-app-text-dim">{data.uploader}</span> · {data.space.name}
        </p>
      </div>

      {/* Direct download — no login required */}
      <a
        href={downloadUrl}
        download
        className="w-full bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 text-center active:scale-[0.98] transition-all duration-200 mb-3"
      >
        ⬇ Download File
      </a>

      {/* Soft prompt for non-logged-in users */}
      {!user && (
        <div className="bg-app-accent/5 border border-app-accent/20 rounded-2xl p-4 text-center">
          <p className="text-app-text font-jakarta font-semibold text-sm mb-1">Want to see more?</p>
          <p className="text-app-text-dim text-xs font-inter mb-3">Create an account to access all files and join this space</p>
          <div className="flex gap-2">
            <Link to="/register" className="flex-1 bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3 text-center">
              Create Account
            </Link>
            <Link to="/login" className="flex-1 bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-xl py-3 text-center">
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Logged-in users just see a join/view button */}
      {user && (
        <button onClick={onJoin} className="w-full bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
          View in Space →
        </button>
      )}
    </div>
  );
}

function CoursePreview({ data, onJoin, user }: { data: SharedCourse; onJoin: () => void; user: any }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{data.icon}</span>
          <div>
            <h2 className="text-app-text font-jakarta font-bold text-lg">{data.name}</h2>
            <p className="text-app-text-dim text-sm font-inter">{data.code} · {data.totalFiles} file{data.totalFiles !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {data.files.map((f) => (
            <div key={f.id} className="bg-app-surface rounded-xl p-3 border border-app-border flex items-center gap-3">
              <span className="text-lg">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-app-text font-inter text-sm truncate">{f.name}</p>
                <p className="text-app-text-faint text-[10px] font-inter">{f.category}</p>
              </div>
            </div>
          ))}
        </div>
        {data.totalFiles > data.files.length && (
          <p className="text-app-text-dim text-xs font-inter text-center mt-3">+{data.totalFiles - data.files.length} more</p>
        )}
        <p className="text-app-text-faint text-xs font-inter text-center mt-4">From {data.space.name}</p>
      </div>
      {user ? (
        <button onClick={onJoin} className="w-full mt-4 bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
          View in Space →
        </button>
      ) : (
        <div className="mt-4"><AuthPrompt /></div>
      )}
    </div>
  );
}
