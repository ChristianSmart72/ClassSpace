import { Outlet } from 'react-router-dom';
import { BottomNav, SideNav } from './index';
import { OfflineBanner } from '../ui/OfflineBanner';

export function MainLayout() {
  return (
    <div className="min-h-dvh bg-app-bg flex">
      {/* Desktop sidebar */}
      <SideNav />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-56 min-h-0">
        {/* Scrollable content — pb-20 makes room for the fixed bottom nav on mobile */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="max-w-3xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
        {/* Mobile bottom nav — fixed, doesn't affect document flow */}
        <BottomNav />
        <OfflineBanner />
      </div>
    </div>
  );
}
