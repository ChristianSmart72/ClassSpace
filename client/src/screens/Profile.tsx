import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { useNavigate } from 'react-router-dom';
import { ShareSheet } from '../components/sheets/ShareSheet';
import { motion } from 'framer-motion';

export function Profile() {
  const { user, logout } = useAuthStore();
  const { currentSpace, courses, leaveSpace } = useSpaceStore();
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    logout();
    leaveSpace();
    navigate('/');
  };

  const copyInviteCode = () => {
    if (!currentSpace) return;
    navigator.clipboard.writeText(currentSpace.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="px-4 pt-6 pb-6">
      {/* Profile Header */}
      <motion.div
        className="flex flex-col items-center mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-syne font-bold mb-3"
          style={{ background: 'linear-gradient(135deg, rgba(91,106,240,0.3) 0%, rgba(91,106,240,0.1) 100%)', color: '#5b6af0' }}
        >
          {avatarLetter}
        </div>
        <h2 className="text-app-text font-syne font-bold text-lg">{user?.name}</h2>
        <p className="text-app-text-dim text-sm font-dm">{user?.email}</p>
        <span className={`mt-2 text-[10px] font-syne font-semibold px-3 py-1 rounded-full ${
          user?.role === 'rep' ? 'bg-app-accent/15 text-app-accent border border-app-accent/30' : 'bg-app-surface-2 text-app-text-dim border border-app-border'
        }`}>
          {user?.role === 'rep' ? '⭐ Class Rep' : '🎓 Member'}
        </span>
      </motion.div>

      {/* Space Info */}
      {currentSpace && (
        <motion.div
          className="bg-app-surface rounded-2xl border border-app-border overflow-hidden mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="px-4 py-3 border-b border-app-border flex items-center gap-2">
            <span className="text-base">🏛️</span>
            <p className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider">Your Space</p>
          </div>
          <div className="p-4">
            <p className="text-app-text font-syne font-bold text-sm">{currentSpace.name}</p>
            <p className="text-app-text-dim text-xs font-dm mt-0.5">{currentSpace.uni}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-[10px] bg-app-accent/10 text-app-accent font-syne font-semibold px-2 py-0.5 rounded-full">{currentSpace.level}</span>
              <span className="text-[10px] bg-app-surface-2 text-app-text-dim font-syne font-semibold px-2 py-0.5 rounded-full">{courses.length} courses</span>
            </div>
            <div className="mt-3 bg-app-surface-2 rounded-xl p-3 border border-app-border flex items-center justify-between">
              <div>
                <p className="text-app-text-faint text-[10px] font-syne uppercase tracking-wider">Invite Code</p>
                <p className="text-app-accent font-syne font-bold text-lg tracking-widest">{currentSpace.invite_code}</p>
              </div>
              <button
                onClick={copyInviteCode}
                className={`text-xs font-syne font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  copied ? 'bg-app-green/20 text-app-green' : 'bg-app-surface border border-app-border text-app-text-dim hover:text-app-text'
                }`}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notification Settings */}
      <motion.div
        className="bg-app-surface rounded-2xl border border-app-border overflow-hidden mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="px-4 py-3 border-b border-app-border flex items-center gap-2">
          <span className="text-base">🔔</span>
          <p className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider">Notifications</p>
        </div>
        <div className="divide-y divide-app-border">
          <ToggleRow label="All announcements" desc="New posts from your class rep" defaultOn />
          <ToggleRow label="Urgent alerts only" desc="Only high-priority notifications" />
          <ToggleRow label="New materials" desc="When files are uploaded" defaultOn />
          <ToggleRow label="Test & assignment reminders" desc="Deadline alerts" defaultOn />
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {currentSpace && (
          <button
            onClick={() => setShowShare(true)}
            className="w-full bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>🔗</span> Share Space Link
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full bg-app-red/10 border border-app-red/30 text-app-red font-syne font-semibold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200"
        >
          Sign Out
        </button>
      </motion.div>

      <p className="text-app-text-faint text-xs font-dm text-center mt-8">
        ClassSpace v5 · Made for Nigerian students 🇳🇬
      </p>

      {showShare && currentSpace && (
        <ShareSheet type="space" id={currentSpace.id} spaceId={currentSpace.id} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-app-text font-dm text-sm block">{label}</span>
        <span className="text-app-text-faint text-[10px] font-dm block mt-0.5">{desc}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
        <div className="w-9 h-5 bg-app-border rounded-full peer peer-checked:bg-app-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
      </label>
    </div>
  );
}
