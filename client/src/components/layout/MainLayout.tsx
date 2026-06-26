import { Outlet } from 'react-router-dom';
import { BottomNav, SideNav } from './index';

export function MainLayout() {
  return (
    <div className="min-h-dvh bg-app-bg flex">
      {/* Desktop sidebar */}
      <SideNav />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-56">
        {/* Mobile: bottom padding for nav. Desktop: no extra padding needed */}
        <div className="flex-1 pb-16 lg:pb-0">
          <div className="max-w-3xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
