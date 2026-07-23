import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { ShareSheet } from '../components/sheets/ShareSheet';
import { motion } from 'framer-motion';

export function Profile() {
  const { user, logout } = useAuthStore();
  const { currentSpace, courses: rawCourses, leaveSpace } = useSpaceStore();
  const courses = rawCourses ?? [];
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = () => {
    setSigningOut(true);
    logout();
    leaveSpace();
    // Hard redirect clears all React state — no router race conditions
    window.location.href = '/';
  };

  const copyInviteCode = () => {
    if (!currentSpace) return;
    navigator.clipboard.writeText(currentSpace.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avatarLetter = user.name?.charAt(0)?.toUpperCase() || '?';
  const isRep = user.role === 'rep';

  return (
    <div className="pb-8">
      {/* Page header */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8 border-b border-app-border mb-5">
        <h1 className="text-app-text font-jakarta font-bold text-xl lg:text-2xl">Profile</h1>
        <p className="text-app-text-dim text-sm font-inter mt-0.5">Manage your account and space settings</p>
      </div>

      <div className="px-4 lg:px-8">
        <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:items-start">

          {/* Left — identity */}
          <div>
            {/* Avatar + info card */}
            <motion.div
              className="bg-app-surface border border-app-border rounded-2xl p-5 mb-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-jakarta font-bold flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(91,106,240,0.25) 0%, rgba(232,255,71,0.08) 100%)',
                    color: '#5b6af0',
                    border: '1.5px solid rgba(91,106,240,0.25)',
                  }}
                >
                  {avatarLetter}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-app-text font-jakarta font-bold text-base leading-tight truncate">{user.name}</h2>
                  <p className="text-app-text-dim text-xs font-inter mt-0.5 truncate">{user.email}</p>
                  <span className={`mt-2 inline-flex items-center gap-1 text-[11px] font-jakarta font-bold px-2.5 py-1 rounded-lg ${
                    isRep
                      ? 'bg-app-accent/15 text-app-accent border border-app-accent/25'
                      : 'bg-app-surface-2 text-app-text-dim border border-app-border'
                  }`}>
                    {isRep ? '⭐ Class Rep' : '🎓 Member'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Space info */}
            {currentSpace && (
              <motion.div
                className="bg-app-surface border border-app-border rounded-2xl overflow-hidden mb-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06 }}
              >
                <div className="px-4 py-3 border-b border-app-border flex items-center gap-2">
                  <span>🏛️</span>
                  <p className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider">Your Space</p>
                </div>
                <div className="p-4">
                  <p className="text-app-text font-jakarta font-bold text-sm leading-tight">{currentSpace.name}</p>
                  <p className="text-app-text-dim text-xs font-inter mt-0.5">{currentSpace.uni}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[11px] bg-app-accent/10 text-app-accent font-jakarta font-semibold px-2.5 py-1 rounded-full border border-app-accent/15">
                      {currentSpace.level}
                    </span>
                    <span className="text-[11px] bg-app-surface-2 text-app-text-dim font-jakarta font-semibold px-2.5 py-1 rounded-full border border-app-border">
                      {courses.length} courses
                    </span>
                  </div>

                  {/* Invite code */}
                  <div className="mt-4 bg-app-bg rounded-xl p-3 border border-app-border">
                    <p className="text-app-text-dim text-[10px] font-jakarta font-bold uppercase tracking-widest mb-1">Invite Code</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-app-accent font-jakarta font-extrabold text-xl tracking-[0.2em]">{currentSpace.invite_code}</p>
                      <button
                        onClick={copyInviteCode}
                        className={`text-xs font-jakarta font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 flex-shrink-0 ${
                          copied
                            ? 'bg-app-green/15 text-app-green border border-app-green/25'
                            : 'bg-app-surface border border-app-border text-app-text-dim hover:text-app-text hover:border-app-border/80'
                        }`}
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              className="flex flex-col gap-2.5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              {currentSpace && (
                <button
                  onClick={() => setShowShare(true)}
                  className="w-full bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 hover:border-app-border/70"
                >
                  🔗 Share Space Link
                </button>
              )}
              <button
                onClick={handleLogout}
                disabled={signingOut}
                className="w-full bg-app-red/10 border border-app-red/25 text-app-red font-jakarta font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
              >
                {signingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </motion.div>
          </div>

          {/* Right — settings */}
          <div className="mt-5 lg:mt-0">
            <motion.div
              className="bg-app-surface border border-app-border rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="px-4 py-3.5 border-b border-app-border flex items-center gap-2">
                <span>🔔</span>
                <p className="text-app-text font-jakarta font-semibold text-sm">Notifications</p>
              </div>
              <div className="divide-y divide-app-border">
                <ToggleRow label="All announcements" desc="New posts from your class rep" defaultOn />
                <ToggleRow label="Urgent alerts only" desc="Only high-priority notifications" />
                <ToggleRow label="New materials" desc="When files are uploaded" defaultOn />
                <ToggleRow label="Test & assignment reminders" desc="Deadline alerts" defaultOn />
              </div>
            </motion.div>

            <p className="text-app-text-dim text-xs font-inter text-center mt-6 lg:text-left opacity-50">
              ClassSpace · Made for Nigerian students 🇳🇬
            </p>
          </div>
        </div>
      </div>

      {showShare && currentSpace && (
        <ShareSheet type="space" id={currentSpace.id} spaceId={currentSpace.id} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-app-text font-inter text-sm block">{label}</span>
        <span className="text-app-text-dim text-xs font-inter block mt-0.5 opacity-70">{desc}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
        <div className="w-9 h-5 bg-app-border rounded-full peer peer-checked:bg-app-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
      </label>
    </div>
  );
}
