import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './index';

export function MainLayout() {
  const location = useLocation();
  const showNav = !location.pathname.startsWith('/join') && !location.pathname.startsWith('/setup');

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex-1 pb-16">
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
