import { useThemeStore } from '../../store/themeStore';

export function FloatingThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed lg:bottom-6 lg:right-4 bottom-16 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
      style={{
        background: theme === 'dark' ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.08)',
        border: theme === 'dark' ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(0,0,0,0.12)',
        boxShadow: theme === 'dark' ? '0 2px 12px rgba(59,130,246,0.15)' : '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      {theme === 'dark' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
