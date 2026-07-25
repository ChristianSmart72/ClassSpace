import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSpaceStore } from '../../store/spaceStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

const NAV_TABS = (currentSpacePath: string) => [
  { path: '/home', icon: '🏠', label: 'Home', matchPrefix: '/home' },
  { path: currentSpacePath, icon: '📋', label: 'Space', matchPrefix: '/space' },
  { path: '/profile', icon: '👤', label: 'Profile', matchPrefix: '/profile' },
];

function useNavTabs() {
  const { currentSpace } = useSpaceStore();
  return NAV_TABS(currentSpace ? `/space/${currentSpace.id}` : '/setup');
}

function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      style={{
        background: theme === 'dark' ? 'rgba(232,255,71,0.08)' : 'rgba(0,0,0,0.06)',
        border: theme === 'dark' ? '1px solid rgba(232,255,71,0.15)' : '1px solid rgba(0,0,0,0.12)',
      }}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e8ff47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-text-dim">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function NavItem({ tab }: { tab: ReturnType<typeof useNavTabs>[0] }) {
  const location = useLocation();
  const active = tab.matchPrefix
    ? location.pathname.startsWith(tab.matchPrefix)
    : location.pathname === tab.path;

  return (
    <NavLink
      to={tab.path}
      className="flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-200"
    >
      <span className={`text-xl transition-all duration-200 ${active ? 'scale-110' : 'opacity-40'}`}>
        {tab.icon}
      </span>
      <span className={`text-[10px] font-jakarta font-semibold transition-all duration-200 ${
        active ? 'text-app-accent' : 'text-app-text-faint'
      }`}>
        {tab.label}
      </span>
    </NavLink>
  );
}

export function BottomNav() {
  const tabs = useNavTabs();

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-app-bg border-t border-app-border z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-stretch justify-around h-16 max-w-[430px] mx-auto">
        {tabs.map((tab) => (
          <NavItem key={tab.label} tab={tab} />
        ))}
      </div>
    </nav>
  );
}

export function SideNav() {
  const tabs = useNavTabs();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-app-bg border-r border-app-border z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-app-border">
        <div className="font-jakarta font-extrabold text-[10px] tracking-[0.24em] uppercase text-app-accent flex items-center gap-2">
          <span className="text-xl">📚</span>
          ClassSpace
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {tabs.map((tab) => {
          const active = tab.matchPrefix
            ? location.pathname.startsWith(tab.matchPrefix)
            : location.pathname === tab.path;

          return (
            <NavLink
              key={tab.label}
              to={tab.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-app-accent/10 text-app-accent'
                  : 'text-app-text-dim hover:text-app-text hover:bg-app-surface'
              }`}
            >
              <span className={`text-lg transition-all duration-200 ${active ? '' : 'opacity-60'}`}>
                {tab.icon}
              </span>
              <span className={`font-jakarta font-semibold text-sm ${active ? 'text-app-accent' : ''}`}>
                {tab.label}
              </span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-app-accent" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-app-border flex flex-col gap-3">
        {/* Theme toggle */}
        <div className="flex items-center justify-between">
          <span className="text-app-text-faint text-[11px] font-inter">Theme</span>
          <ThemeToggle />
        </div>

        {/* User / Logout */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-app-accent/15 border border-app-accent/20 flex items-center justify-center text-xs text-app-accent font-jakarta font-bold flex-shrink-0">
              {user.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-app-text text-xs font-jakarta font-semibold truncate">{user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-app-text-faint hover:text-app-red transition-colors text-xs font-jakarta font-semibold"
              title="Sign out"
            >
              ↩
            </button>
          </div>
        )}

        <p className="text-app-text-faint text-[9px] font-inter opacity-50">ClassSpace · Nigerian students 🇳🇬</p>
      </div>
    </aside>
  );
}

export function TopBar({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  return (
    <div className="sticky top-0 bg-app-bg/95 backdrop-blur-lg z-30 border-b border-app-border">
      <div className="flex items-center gap-3 px-4 h-14">
        {onBack && (
          <button onClick={onBack} className="text-app-text-dim hover:text-app-text text-xl transition-colors">
            ←
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-app-text font-jakarta font-semibold text-base truncate">{title}</h1>
          {subtitle && <p className="text-app-text-dim text-xs font-inter truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function Fab({ onClick, icon = '+' }: { onClick: () => void; icon?: string }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-8 z-30 w-14 h-14 rounded-full bg-app-accent text-app-bg flex items-center justify-center text-2xl shadow-lg shadow-app-accent/20 hover:shadow-app-accent/30 active:scale-90 transition-all duration-200"
    >
      {icon}
    </button>
  );
}

export function FilterBar({
  filters, active, onChange,
}: {
  filters: { value: string; label: string }[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-3">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-jakarta font-semibold transition-all duration-200 border ${
            active === f.value
              ? 'bg-app-accent text-app-bg border-app-accent'
              : 'bg-app-surface text-app-text-dim border-app-border hover:text-app-text'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
