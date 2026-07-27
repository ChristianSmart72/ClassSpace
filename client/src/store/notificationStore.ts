import { create } from 'zustand';

interface NotificationPreferences {
  allAnnouncements: boolean;
  urgentOnly: boolean;
  newMaterials: boolean;
  testReminders: boolean;
}

interface NotificationState {
  permission: NotificationPermission | 'unsupported';
  subscription: PushSubscriptionJSON | null;
  preferences: NotificationPreferences;
  setPermission: (p: NotificationPermission | 'unsupported') => void;
  setSubscription: (sub: PushSubscriptionJSON | null) => void;
  setPreference: (key: keyof NotificationPreferences, value: boolean) => void;
}

function loadPrefs(): NotificationPreferences {
  try {
    const saved = localStorage.getItem('notification_prefs');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { allAnnouncements: true, urgentOnly: false, newMaterials: true, testReminders: true };
}

function savePrefs(prefs: NotificationPreferences) {
  try { localStorage.setItem('notification_prefs', JSON.stringify(prefs)) } catch {}
}

export const useNotificationStore = create<NotificationState>((set) => ({
  permission: (() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  })(),
  subscription: null,
  preferences: loadPrefs(),
  setPermission: (permission) => set({ permission }),
  setSubscription: (subscription) => set({ subscription }),
  setPreference: (key, value) =>
    set((state) => {
      const prefs = { ...state.preferences, [key]: value };
      savePrefs(prefs);
      return { preferences: prefs };
    }),
}));
