import { useUpdateStore } from '../../store/updateStore';

export function UpdatePrompt() {
  const updateAvailable = useUpdateStore((s) => s.updateAvailable);
  const updateSW = useUpdateStore((s) => s.updateSW);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-2 lg:bottom-4">
      <div className="bg-app-surface border border-app-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl mx-auto max-w-md">
        <span className="text-lg">✨</span>
        <p className="text-app-text text-sm font-jakarta font-semibold flex-1">A new version is available</p>
        <div className="flex gap-2">
          <button
            onClick={updateSW}
            className="bg-app-accent text-app-on-accent text-xs font-jakarta font-bold px-3 py-1.5 rounded-lg"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
