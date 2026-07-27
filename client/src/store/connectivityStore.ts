import { create } from 'zustand';

interface ConnectivityState {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: (() => { try { return navigator.onLine } catch { return true } })(),
  setOnline: (online) => set({ isOnline: online }),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useConnectivityStore.getState().setOnline(true));
  window.addEventListener('offline', () => useConnectivityStore.getState().setOnline(false));
}
