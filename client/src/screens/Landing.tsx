import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Logo } from '../components/ui/Logo';

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
    title: 'Fluid Mechanics CA Test — Tomorrow 9am',
    course: 'ENG 201',
    badge: 'Test',
    badgeColor: '#ef4444',
    time: '2m ago',
  },
  {
    type: 'assignment',
    icon: '📝',
    title: 'Lab Report — Flow Analysis Due Friday 5pm',
    course: 'CHE 205',
    badge: 'Assignment',
    badgeColor: '#f59e0b',
    time: '1h ago',
  },
  {
    type: 'opportunity',
    icon: '🏆',
    title: 'STEM Scholarship 2026 — Applications Open',
    course: null,
    badge: 'Scholarship',
    badgeColor: '#eab308',
    time: '3h ago',
  },
  {
    type: 'update',
    icon: '📡',
    title: 'No Lectures Wednesday — Department Decision',
    course: null,
    badge: 'Update',
    badgeColor: '#6366f1',
    time: '5h ago',
  },
  {
    type: 'file',
    icon: '📄',
    title: 'Manufacturing Notes — Week 8 uploaded',
    course: 'ENG 202',
    badge: 'File',
    badgeColor: '#10b981',
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

      <div className="divide-y divide-app-border" style={{ minHeight: '220px' }}>
        {FEED_ITEMS.slice(0, visible).map((item, i) => (
          <div
            key={i}
            className="px-4 py-3 flex items-center gap-3 animate-fadeIn"
            style={{ animationDelay: `${i < 3 ? i * 80 : 0}ms` }}
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
          </div>
        ))}
      </div>

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
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(232,255,71,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="flex lg:hidden flex-col min-h-dvh">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="font-jakarta font-extrabold text-[10px] tracking-[0.26em] uppercase text-app-accent flex items-center gap-1.5">
            <Logo width={18} height={18} className="text-app-accent" /> ClassSpace
          </div>
          <Link to="/login" className="text-app-text-dim font-jakarta font-semibold text-xs hover:text-app-text transition-colors">
            Sign in
          </Link>
        </div>

        <div className="flex-1 flex flex-col px-5 pt-2 pb-20">
          <div className="inline-flex items-center gap-2 self-start bg-app-accent/10 border border-app-accent/20 rounded-full px-3 py-1.5 mb-4 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
            <span className="text-app-accent font-jakarta font-semibold text-[10px] tracking-wider uppercase">
              Built for Nigerian Students 🇳🇬
            </span>
          </div>

          <div className="animate-fadeIn mb-3">
            <h1 className="font-jakarta font-extrabold leading-[1.0] text-[38px] text-app-text">
              Your class.
            </h1>
            <h1 className="font-jakarta font-extrabold leading-[1.0] text-[38px] text-app-accent">
              Organised.
            </h1>
          </div>

          <p className="text-app-text-dim font-inter text-sm leading-relaxed mb-5 max-w-[300px] animate-fadeIn">
            One hub for your entire class — announcements, files, timetable, and opportunities. No noise.
          </p>

          <div className="mb-5 animate-fadeIn">
            <FeedPreview />
          </div>

          <div className="flex flex-col gap-2.5 mb-5 animate-fadeIn">
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
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5 animate-fadeIn">
            {FEATURES.map(f => (
              <div key={f.label} className="bg-app-surface border border-app-border rounded-xl p-3 flex items-start gap-2.5">
                <span className="text-lg mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-app-text font-jakarta font-semibold text-xs">{f.label}</p>
                  <p className="text-app-text-faint text-[10px] font-inter leading-snug mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-app-text-faint text-xs font-inter text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-app-accent font-jakarta font-semibold">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-col min-h-dvh">
        <nav className="flex items-center justify-between px-10 xl:px-20 py-5 border-b border-app-border/30">
          <div className="font-jakarta font-extrabold text-[11px] tracking-[0.28em] uppercase text-app-accent flex items-center gap-2">
            <Logo width={20} height={20} className="text-app-accent" /> ClassSpace
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

        <div className="flex-1 flex items-center px-10 xl:px-20 py-12">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-[1fr_1.1fr] gap-16 items-center">
            <div className="animate-fadeIn">
              <div className="inline-flex items-center gap-2 bg-app-accent/10 border border-app-accent/20 rounded-full px-4 py-1.5 mb-8 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
                <span className="text-app-accent font-jakarta font-semibold text-xs tracking-wider uppercase">
                  Built for Nigerian university students 🇳🇬
                </span>
              </div>

              <h1 className="font-jakarta font-extrabold leading-[1.0] text-[56px] xl:text-[68px] text-app-text mb-2">
                Your class.
              </h1>
              <h1 className="font-jakarta font-extrabold leading-[1.0] text-[56px] xl:text-[68px] text-app-accent mb-8">
                Organised.
              </h1>

              <p className="text-app-text-dim font-inter text-lg leading-relaxed mb-10 max-w-[420px]">
                One clean hub that cuts through the noise. Announcements, files, timetables, and opportunities — all where your class can find them.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-10">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 bg-app-surface border border-app-border rounded-xl px-4 py-3 animate-fadeIn"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <span className="text-xl flex-shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-app-text font-jakarta font-semibold text-sm">{f.label}</p>
                      <p className="text-app-text-faint font-inter text-xs mt-0.5 leading-snug">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap animate-fadeIn">
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
              </div>
            </div>

            <div className="relative animate-fadeIn">
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(232,255,71,0.08) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  transform: 'scale(1.3)',
                }}
              />

              <FeedPreview />

              <div className="absolute -left-14 top-16 bg-app-surface border border-app-border rounded-xl px-3 py-2 shadow-xl animate-fadeIn">
                <p className="text-[10px] font-jakarta font-bold text-app-accent">📢 Live Updates</p>
                <p className="text-[9px] text-app-text-faint font-inter">Real-time class feed</p>
              </div>

              <div className="absolute -right-12 bottom-20 bg-app-surface border border-app-border rounded-xl px-3 py-2 shadow-xl animate-fadeIn">
                <p className="text-[10px] font-jakarta font-bold text-app-green">🏆 Opportunities</p>
                <p className="text-[9px] text-app-text-faint font-inter">Scholarships & more</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-10 xl:px-20 py-4 border-t border-app-border/30">
          <p className="text-app-text-faint text-[11px] font-inter">Made for Nigerian university students 🇳🇬</p>
          <p className="text-app-text-faint text-[10px] font-inter opacity-40">ClassSpace · Built for real academic life</p>
        </div>
      </div>
    </div>
  );
}
