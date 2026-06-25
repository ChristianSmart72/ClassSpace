import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/home', icon: '🏠', label: 'Home' },
  { path: '/space', icon: '📋', label: 'Space' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/space') return location.pathname.startsWith('/space');
    if (path === '/home') return location.pathname === '/home';
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-app-bg/95 backdrop-blur-lg border-t border-app-border z-40 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-all duration-200 ${
                active ? 'scale-100' : 'scale-100'
              }`}
            >
              <span className={`text-xl transition-all duration-200 ${active ? 'scale-110' : 'opacity-50'}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-syne font-semibold transition-all duration-200 ${
                active ? 'text-app-accent' : 'text-app-text-faint'
              }`}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
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
      className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-app-accent text-app-bg flex items-center justify-center text-2xl shadow-lg shadow-app-accent/20 hover:shadow-app-accent/30 active:scale-90 transition-all duration-200"
    >
      {icon}
    </button>
  );
}

export function FilterBar({
  filters,
  active,
  onChange,
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
