import { create } from 'zustand';

interface UpdateState {
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  setUpdateAvailable: (available: boolean, registration?: ServiceWorkerRegistration | null) => void;
  updateSW: () => void;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  updateAvailable: false,
  registration: null,
  setUpdateAvailable: (available, registration = null) =>
    set({ updateAvailable: available, registration }),
  updateSW: () => {
    const { registration } = get();
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  },
}));
