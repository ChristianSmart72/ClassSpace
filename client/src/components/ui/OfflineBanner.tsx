import { useConnectivityStore } from '../../store/connectivityStore';

export function OfflineBanner() {
  const isOnline = useConnectivityStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 lg:bottom-0 lg:pb-3">
      <div className="bg-app-orange/90 backdrop-blur-md text-white rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg mx-auto max-w-xl">
        <span className="text-base">📡</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-jakarta font-semibold">You're offline</p>
          <p className="text-[11px] font-inter opacity-80">Viewing cached content — connect to post or upload</p>
        </div>
      </div>
    </div>
  );
}
