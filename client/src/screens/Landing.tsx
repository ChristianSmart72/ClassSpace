import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const FEATURES = [
  { icon: '📢', label: 'Announcements', desc: 'Assignments, tests, and urgent notices' },
  { icon: '📁', label: 'Course Files', desc: 'Notes, slides and past questions' },
  { icon: '🏆', label: 'Opportunities', desc: 'Scholarships, internships, seminars' },
  { icon: '📅', label: 'Timetable', desc: 'Your full weekly class schedule' },
];

const FEED_ITEMS = [
  {
    type: 'urgent',
    icon: '🧪',
    title: 'Thermodynamics II CA Test — Tomorrow 9am',
    course: 'PRE 321',
    badge: 'Test',
    badgeColor: '#ff5252',
    time: '2m ago',
  },
  {
    type: 'assignment',
    icon: '📝',
    title: 'Lab Report — Fluid Flow Analysis Due Friday 5pm',
    course: 'PRE 311',
    badge: 'Assignment',
    badgeColor: '#ffb347',
    time: '1h ago',
  },
  {
    type: 'opportunity',
    icon: '🏆',
    title: 'Shell Scholarship 2025 — Applications Open',
    course: null,
    badge: 'Scholarship',
    badgeColor: '#e8ff47',
    time: '3h ago',
  },
  {
    type: 'update',
    icon: '📡',
    title: 'No Lectures Wednesday — Department Decision',
    course: null,
    badge: 'Update',
    badgeColor: '#5b6af0',
    time: '5h ago',
  },
  {
    type: 'file',
    icon: '📄',
    title: 'Manufacturing Notes — Week 8 uploaded',
    course: 'PRE 331',
    badge: 'File',
    badgeColor: '#52ffa0',
    time: 'Yesterday',
  },
];

function FeedPreview() {
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(v => v < FEED_ITEMS.length ? v + 1 : 3);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-app-border"
      style={{ background: 'var(--color-app-surface)', boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,255,71,0.05)' }}
    >
      {/* App chrome bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-app-border">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,82,82,0.6)' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,179,71,0.6)' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(82,255,160,0.4)' }} />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-app-surface-2 rounded-lg px-3 py-1 flex items-center gap-2">
            <span className="text-xs">📚</span>
            <span className="text-app-text-faint text-[11px] font-inter">PRE220 — 300L Production Eng.</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-green-400 font-jakarta font-bold">LIVE</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-app-border px-4">
        {['Updates', 'Files', 'Opportunities', 'Schedule'].map((t, i) => (
          <div
            key={t}
            className={`py-2.5 px-3 text-[11px] font-jakarta font-semibold relative ${i === 0 ? 'text-app-accent' : 'text-app-text-faint'}`}
          >
            {t}
            {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-app-accent" />}
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="divide-y divide-app-border" style={{ minHeight: '220px' }}>
        {FEED_ITEMS.slice(0, visible).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i < 3 ? i * 0.08 : 0 }}
            className="px-4 py-3 flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: `${item.badgeColor}14` }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-app-text text-[12px] font-inter font-medium leading-snug line-clamp-1">{item.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[9px] font-jakarta font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${item.badgeColor}18`, color: item.badgeColor }}
                >
                  {item.badge}
                </span>
                {item.course && (
                  <span className="text-app-text-faint text-[9px] font-inter">{item.course}</span>
                )}
              </div>
            </div>
            <span className="text-app-text-faint text-[9px] font-inter flex-shrink-0">{item.time}</span>
          </motion.div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-2.5 border-t border-app-border flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
          <span className="text-[10px] text-app-text-faint font-inter">42 members · 5 courses</span>
        </div>
        <span className="text-[10px] text-app-accent font-jakarta font-semibold">Live preview ↗</span>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div
      className="min-h-dvh flex flex-col overflow-x-hidden"
      style={{ background: 'var(--landing-bg, radial-gradient(ellipse at 65% -10%, #1a1a24 0%, #0f0f11 60%))' }}
    >
      {/* Subtle top glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(232,255,71,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ── MOBILE layout ── */}
      <div className="flex lg:hidden flex-col min-h-dvh">
        {/* Mobile nav */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="font-jakarta font-extrabold text-[10px] tracking-[0.26em] uppercase text-app-accent flex items-center gap-1.5">
            <span className="text-base">📚</span> ClassSpace
          </div>
          <Link to="/login" className="text-app-text-dim font-jakarta font-semibold text-xs hover:text-app-text transition-colors">
            Sign in
          </Link>
        </div>

        {/* Hero content */}
        <div className="flex-1 flex flex-col px-5 pt-2 pb-20">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 self-start bg-app-accent/10 border border-app-accent/20 rounded-full px-3 py-1.5 mb-4"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
            <span className="text-app-accent font-jakarta font-semibold text-[10px] tracking-wider uppercase">
              Built for Nigerian Students 🇳🇬
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="mb-3"
          >
            <h1 className="font-jakarta font-extrabold leading-[1.0] text-[38px] text-app-text">
              Your class.
            </h1>
            <h1 className="font-jakarta font-extrabold leading-[1.0] text-[38px] text-app-accent">
              Organised.
            </h1>
          </motion.div>

          <motion.p
            className="text-app-text-dim font-inter text-sm leading-relaxed mb-5 max-w-[300px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            One hub for your entire class — announcements, files, timetable, and opportunities. No noise.
          </motion.p>

          {/* Preview card */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.14 }}
          >
            <FeedPreview />
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="flex flex-col gap-2.5 mb-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link
              to="/register"
              className="w-full text-center font-jakarta font-bold text-sm rounded-2xl py-4 transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'var(--app-accent)', color: 'var(--app-on-accent)', boxShadow: '0 4px 28px color-mix(in srgb, var(--app-accent) 30%, transparent)' }}
            >
              Create a Space — Free →
            </Link>
            <Link
              to="/join"
              className="w-full text-center bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-2xl py-4 active:scale-[0.98] transition-all duration-200"
            >
              Join with Invite Code
            </Link>
          </motion.div>

          {/* Features grid */}
          <motion.div
            className="grid grid-cols-2 gap-2 mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {FEATURES.map(f => (
              <div key={f.label} className="bg-app-surface border border-app-border rounded-xl p-3 flex items-start gap-2.5">
                <span className="text-lg mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-app-text font-jakarta font-semibold text-xs">{f.label}</p>
                  <p className="text-app-text-faint text-[10px] font-inter leading-snug mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <p className="text-app-text-faint text-xs font-inter text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-app-accent font-jakarta font-semibold">Sign in</Link>
          </p>
        </div>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden lg:flex flex-col min-h-dvh">
        {/* Desktop nav */}
        <nav className="flex items-center justify-between px-10 xl:px-20 py-5 border-b border-app-border/30">
          <div className="font-jakarta font-extrabold text-[11px] tracking-[0.28em] uppercase text-app-accent flex items-center gap-2">
            <span className="text-xl">📚</span> ClassSpace
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-app-text-faint text-sm font-jakarta font-semibold">
              <span className="hover:text-app-text transition-colors cursor-pointer">Features</span>
              <span className="hover:text-app-text transition-colors cursor-pointer">How it works</span>
              <span className="hover:text-app-text transition-colors cursor-pointer">About</span>
            </div>
            <div className="w-px h-4 bg-app-border" />
            <Link to="/login" className="text-app-text-dim font-jakarta font-semibold text-sm hover:text-app-text transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="font-jakarta font-bold text-sm rounded-xl px-5 py-2.5 hover:opacity-90 transition-all duration-200 hover:scale-[1.02]"
              style={{ background: 'var(--app-accent)', color: 'var(--app-on-accent)', boxShadow: '0 4px 20px color-mix(in srgb, var(--app-accent) 25%, transparent)' }}
            >
              Get Started →
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex items-center px-10 xl:px-20 py-12">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-[1fr_1.1fr] gap-16 items-center">
            {/* Left col */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 bg-app-accent/10 border border-app-accent/20 rounded-full px-4 py-1.5 mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
                <span className="text-app-accent font-jakarta font-semibold text-xs tracking-wider uppercase">
                  Built for Nigerian university students 🇳🇬
                </span>
              </motion.div>

              <h1 className="font-jakarta font-extrabold leading-[1.0] text-[56px] xl:text-[68px] text-app-text mb-2">
                Your class.
              </h1>
              <h1 className="font-jakarta font-extrabold leading-[1.0] text-[56px] xl:text-[68px] text-app-accent mb-8">
                Organised.
              </h1>

              <p className="text-app-text-dim font-inter text-lg leading-relaxed mb-10 max-w-[420px]">
                One clean hub that cuts through the noise. Announcements, files, timetables, and opportunities — all where your class can find them.
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3 mb-10">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={f.label}
                    className="flex items-center gap-3 bg-app-surface border border-app-border rounded-xl px-4 py-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.14 + i * 0.06 }}
                  >
                    <span className="text-xl flex-shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-app-text font-jakarta font-semibold text-sm">{f.label}</p>
                      <p className="text-app-text-faint font-inter text-xs mt-0.5 leading-snug">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTAs */}
              <motion.div
                className="flex items-center gap-3 flex-wrap"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.42 }}
              >
                <Link
                  to="/register"
                  className="font-jakarta font-bold text-sm rounded-2xl px-8 py-4 hover:opacity-90 transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: 'var(--app-accent)', color: 'var(--app-on-accent)', boxShadow: '0 4px 32px color-mix(in srgb, var(--app-accent) 30%, transparent)' }}
                >
                  Create a Space — Free →
                </Link>
                <Link
                  to="/join"
                  className="bg-app-surface border border-app-border text-app-text font-jakarta font-semibold text-sm rounded-2xl px-8 py-4 hover:border-app-accent/40 transition-colors"
                >
                  Join with Code
                </Link>
              </motion.div>
            </motion.div>

            {/* Right col — app preview */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="relative"
            >
              {/* Glow behind card */}
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(232,255,71,0.08) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  transform: 'scale(1.3)',
                }}
              />

              <FeedPreview />

              {/* Floating annotation pills */}
              <motion.div
                className="absolute -left-14 top-16 bg-app-surface border border-app-border rounded-xl px-3 py-2 shadow-xl"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <p className="text-[10px] font-jakarta font-bold text-app-accent">📢 Live Updates</p>
                <p className="text-[9px] text-app-text-faint font-inter">Real-time class feed</p>
              </motion.div>

              <motion.div
                className="absolute -right-12 bottom-20 bg-app-surface border border-app-border rounded-xl px-3 py-2 shadow-xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1.0 }}
              >
                <p className="text-[10px] font-jakarta font-bold text-app-green">🏆 Opportunities</p>
                <p className="text-[9px] text-app-text-faint font-inter">Scholarships & more</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-10 xl:px-20 py-4 border-t border-app-border/30">
          <p className="text-app-text-faint text-[11px] font-inter">Made for Nigerian university students 🇳🇬</p>
          <p className="text-app-text-faint text-[10px] font-inter opacity-40">ClassSpace · Built for real academic life</p>
        </div>
      </div>
    </div>
  );
}
