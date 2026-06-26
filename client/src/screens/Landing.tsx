import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: '📢', label: 'Structured announcements', desc: 'Assignments, tests, updates — all in one feed' },
  { icon: '📁', label: 'Organised course files', desc: 'Notes, slides, past questions by course' },
  { icon: '🔗', label: 'Shareable invite links', desc: 'Your whole class joins with one code' },
  { icon: '⚡', label: 'Instant alerts', desc: 'Urgent notices you actually see' },
];

const DEMO_ANNOUNCEMENTS = [
  { type: 'assignment', label: 'Assignment', color: '#ffb347', icon: '📝', title: 'Lab Report Deadline — Friday', course: 'PEG 301', urgent: true },
  { type: 'test', label: 'Test', color: '#ff5252', icon: '🧪', title: 'Thermodynamics II CA Test — Confirmed', course: 'PEG 303' },
  { type: 'update', label: 'Update', color: '#5b6af0', icon: '📡', title: 'No lectures Wednesday ⚠️', urgent: true },
];

export function Landing() {
  return (
    <div
      className="min-h-dvh flex flex-col overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #1a1a22 0%, #0f0f11 70%)' }}
    >
      {/* Top glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full pointer-events-none"
        style={{ background: '#e8ff47', opacity: 0.05, filter: 'blur(90px)' }}
      />

      <div className="flex-1 flex flex-col items-center text-center px-5 pt-16 pb-10 max-w-sm mx-auto relative w-full">

        {/* Logo */}
        <motion.div
          className="font-syne font-extrabold text-[10px] tracking-[0.28em] uppercase text-app-accent mb-10 flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-base">📚</span>
          ClassSpace
        </motion.div>

        {/* Hero */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <h1 className="font-syne font-extrabold leading-[1.05] text-[42px] text-app-text">
            Your class.
          </h1>
          <h1 className="font-syne font-extrabold leading-[1.05] text-[42px] text-app-accent">
            Organised.
          </h1>
        </motion.div>

        <motion.p
          className="text-app-text-dim font-dm text-[15px] leading-relaxed mb-8 max-w-[280px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          ClassSpace replaces the WhatsApp group chaos. One clean hub for your department's announcements and study materials.
        </motion.p>

        {/* Mini demo card */}
        <motion.div
          className="w-full bg-app-surface border border-app-border rounded-2xl overflow-hidden mb-8 text-left"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="px-4 pt-3 pb-2 border-b border-app-border flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-app-accent/10 flex items-center justify-center text-sm">🏛️</div>
            <div>
              <p className="text-app-text font-syne font-bold text-sm">300L Production Engineering</p>
              <p className="text-app-text-faint text-[10px] font-dm">University of Benin · 5 courses</p>
            </div>
          </div>
          <div className="divide-y divide-app-border">
            {DEMO_ANNOUNCEMENTS.map((ann, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-base">{ann.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-app-text text-xs font-dm font-medium truncate">{ann.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-syne font-bold rounded px-1.5 py-0.5" style={{ background: `${ann.color}18`, color: ann.color }}>{ann.label}</span>
                    {ann.course && <span className="text-app-text-faint text-[9px] font-dm">{ann.course}</span>}
                    {ann.urgent && <span className="text-[9px] bg-app-red/10 text-app-red font-syne font-bold rounded px-1.5 py-0.5">URGENT</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="grid grid-cols-2 gap-2 w-full mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="bg-app-surface border border-app-border rounded-xl p-3 text-left"
            >
              <span className="text-lg block mb-1">{f.icon}</span>
              <p className="text-app-text font-syne font-semibold text-xs mb-0.5">{f.label}</p>
              <p className="text-app-text-faint text-[10px] font-dm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Link
            to="/register"
            className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-2xl py-4 text-center active:scale-[0.98] transition-all duration-200"
            style={{ boxShadow: '0 4px 32px rgba(232,255,71,0.25)' }}
          >
            Create a Space — Free →
          </Link>
          <Link
            to="/join"
            className="w-full bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-2xl py-4 text-center active:scale-[0.98] transition-all duration-200"
          >
            Join with an Invite Code
          </Link>
        </motion.div>

        <p className="mt-6 text-app-text-faint text-xs font-dm">
          Already have an account?{' '}
          <Link to="/login" className="text-app-accent font-syne font-semibold">
            Sign in
          </Link>
        </p>
      </div>

      <div className="flex flex-col items-center pb-8 gap-1">
        <p className="text-app-text-faint text-[11px] font-dm">Made for Nigerian university students 🇳🇬</p>
        <p className="text-app-text-faint text-[10px] font-dm opacity-50">ClassSpace v5 · Built for real academic life</p>
      </div>
    </div>
  );
}
