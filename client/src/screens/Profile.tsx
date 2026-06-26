import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { useNavigate } from 'react-router-dom';
import { ShareSheet } from '../components/sheets/ShareSheet';

export function Profile() {
  const { user, logout } = useAuthStore();
  const { currentSpace, leaveSpace } = useSpaceStore();
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);

  const handleLogout = () => {
    logout();
    leaveSpace();
    navigate('/');
  };

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-app-accent2/20 flex items-center justify-center text-3xl text-app-accent2 font-syne font-bold mb-3">
          {user?.name?.charAt(0)}
        </div>
        <h2 className="text-app-text font-syne font-bold text-lg">{user?.name}</h2>
        <p className="text-app-text-dim text-sm font-dm">{user?.email}</p>
        <span className={`mt-2 text-[10px] font-syne font-semibold px-2.5 py-1 rounded-full ${
          user?.role === 'rep' ? 'bg-app-accent/10 text-app-accent' : 'bg-app-surface-2 text-app-text-dim'
        }`}>
          {user?.role === 'rep' ? 'Class Rep' : 'Member'}
        </span>
      </div>

      {/* Settings */}
      <div className="bg-app-surface rounded-2xl border border-app-border overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-app-border">
          <p className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider">Notifications</p>
        </div>
        <div className="divide-y divide-app-border">
          <ToggleRow label="Announcements" defaultOn />
          <ToggleRow label="Urgent only" />
          <ToggleRow label="New materials" defaultOn />
        </div>
      </div>

      {/* Space Info */}
      {currentSpace && (
        <div className="bg-app-surface rounded-2xl border border-app-border overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-app-border">
            <p className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider">Your Space</p>
          </div>
          <div className="p-4">
            <p className="text-app-text font-dm text-sm">{currentSpace.name}</p>
            <p className="text-app-text-dim text-xs font-dm mt-0.5">{currentSpace.uni}</p>
            <p className="text-app-text-faint text-xs font-dm mt-1">Invite code: <span className="text-app-accent font-semibold">{currentSpace.invite_code}</span></p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {currentSpace && (
          <button onClick={() => setShowShare(true)} className="w-full bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
            Share Space Link
          </button>
        )}
        <button onClick={handleLogout} className="w-full bg-app-red/10 border border-app-red/30 text-app-red font-syne font-semibold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
          Sign Out
        </button>
      </div>

      <p className="text-app-text-faint text-xs font-dm text-center mt-8">ClassSpace v5 · Made for Nigerian students</p>

      {showShare && currentSpace && (
        <ShareSheet type="space" id={currentSpace.id} spaceId={currentSpace.id} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

function ToggleRow({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-app-text font-dm text-sm">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
        <div className="w-9 h-5 bg-app-border rounded-full peer peer-checked:bg-app-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-app-text after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
      </label>
    </div>
  );
}
