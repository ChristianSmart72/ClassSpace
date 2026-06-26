import { NavLink, useLocation } from 'react-router-dom';
import { useSpaceStore } from '../../store/spaceStore';

const NAV_TABS = (currentSpacePath: string) => [
  { path: '/home', icon: '🏠', label: 'Home', matchPrefix: '/home' },
  { path: currentSpacePath, icon: '📋', label: 'Space', matchPrefix: '/space' },
  { path: '/timetable', icon: '📅', label: 'Timetable', matchPrefix: '/timetable' },
  { path: '/profile', icon: '👤', label: 'Profile', matchPrefix: '/profile' },
];

function useNavTabs() {
  const { currentSpace } = useSpaceStore();
  return NAV_TABS(currentSpace ? `/space/${currentSpace.id}` : '/setup');
}

function useIsActive(tab: ReturnType<typeof useNavTabs>[0]) {
  const location = useLocation();
  if (tab.matchPrefix) return location.pathname.startsWith(tab.matchPrefix);
  return location.pathname === tab.path;
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
      <span className={`text-[10px] font-syne font-semibold transition-all duration-200 ${
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
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-app-bg/95 backdrop-blur-lg border-t border-app-border z-40 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-[430px] mx-auto">
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

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-app-bg border-r border-app-border z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-app-border">
        <div className="font-syne font-extrabold text-[10px] tracking-[0.24em] uppercase text-app-accent flex items-center gap-2">
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
              <span className={`font-syne font-semibold text-sm ${active ? 'text-app-accent' : ''}`}>
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
      <div className="px-5 py-4 border-t border-app-border">
        <p className="text-app-text-faint text-[10px] font-dm">ClassSpace v5</p>
        <p className="text-app-text-faint text-[10px] font-dm opacity-60">Made for Nigerian students 🇳🇬</p>
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
          <h1 className="text-app-text font-syne font-semibold text-base truncate">{title}</h1>
          {subtitle && <p className="text-app-text-dim text-xs font-dm truncate">{subtitle}</p>}
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
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-syne font-semibold transition-all duration-200 border ${
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
