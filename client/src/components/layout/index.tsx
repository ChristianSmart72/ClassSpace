import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSpaceStore } from '../../store/spaceStore';
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


function NavItem({ tab }: { tab: ReturnType<typeof useNavTabs>[0] }) {
  const location = useLocation();
  const active = tab.matchPrefix
    ? location.pathname.startsWith(tab.matchPrefix)
    : location.pathname === tab.path;

  return (
    <NavLink
      to={tab.path}
      className="flex flex-col items-center gap-0.5 px-3 py-0.5 transition-all duration-200"
    >
      <span className={`text-lg transition-all duration-200 ${active ? '' : 'opacity-35'}`}>
        {tab.icon}
      </span>
      <span className={`text-[9px] font-jakarta font-semibold transition-all duration-200 ${
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
      <div className="flex items-stretch justify-around h-14 max-w-[430px] mx-auto">
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
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-52 bg-app-bg border-r border-app-border z-40">
      <div className="px-4 py-5 border-b border-app-border">
        <div className="font-jakarta font-extrabold text-[9px] tracking-[0.24em] uppercase text-app-accent flex items-center gap-2">
          <span className="text-lg">📚</span>
          ClassSpace
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {tabs.map((tab) => {
          const active = tab.matchPrefix
            ? location.pathname.startsWith(tab.matchPrefix)
            : location.pathname === tab.path;

          return (
            <NavLink
              key={tab.label}
              to={tab.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-app-accent/10 text-app-accent'
                  : 'text-app-text-dim hover:text-app-text hover:bg-app-surface'
              }`}
            >
              <span className={`text-base transition-all duration-200 ${active ? '' : 'opacity-60'}`}>
                {tab.icon}
              </span>
              <span className={`font-jakarta font-semibold text-[13px] ${active ? 'text-app-accent' : ''}`}>
                {tab.label}
              </span>
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-app-accent" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-app-border flex flex-col gap-2.5">
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-app-accent/15 flex items-center justify-center text-[10px] text-app-accent font-jakarta font-bold flex-shrink-0">
              {user.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-app-text text-[11px] font-jakarta font-semibold truncate">{user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-app-text-faint hover:text-app-red transition-colors text-[11px] font-jakarta font-semibold"
              title="Sign out"
            >
              ↩
            </button>
          </div>
        )}
        <p className="text-app-text-faint text-[8px] font-inter opacity-40">ClassSpace · Nigerian students</p>
      </div>
    </aside>
  );
}

export function TopBar({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  return (
    <div className="sticky top-0 bg-app-bg/95 backdrop-blur-lg z-30 border-b border-app-border">
      <div className="flex items-center gap-3 px-4 h-12">
        {onBack && (
          <button onClick={onBack} className="text-app-text-dim hover:text-app-text text-lg transition-colors">
            ←
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-app-text font-jakarta font-semibold text-sm truncate">{title}</h1>
          {subtitle && <p className="text-app-text-dim text-[11px] font-inter truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function Fab({ onClick, icon = '+' }: { onClick: () => void; icon?: string }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-8 z-30 w-11 h-11 rounded-full bg-app-accent text-white flex items-center justify-center text-xl shadow-lg shadow-app-accent/25 hover:shadow-app-accent/35 active:scale-90 transition-all duration-200"
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
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 py-2.5">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-jakarta font-semibold transition-all duration-200 border ${
            active === f.value
              ? 'bg-app-accent text-white border-app-accent'
              : 'bg-app-surface text-app-text-dim border-app-border hover:text-app-text'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
