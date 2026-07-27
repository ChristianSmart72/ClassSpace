import api from '../api/client';
import { useNotificationStore } from '../store/notificationStore';

const VAPID_PUBLIC_KEY = 'BK-fNRDB2k-Vkap_EPjRkJ_r4QT4cPfYZFCh_rjGs_hrmWYrCde-uK9H-2ZAdtU9Xlils6wA2pfbP_1ZXwWCqCU';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export async function registerPushSubscription(spaceId: string) {
  const store = useNotificationStore.getState();
  if (store.permission === 'unsupported' || store.permission === 'denied') return;

  if (store.permission === 'default') {
    const result = await Notification.requestPermission();
    store.setPermission(result);
    if (result !== 'granted') return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    const subJSON = sub.toJSON();
    if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) return;

    await api.post('/push/subscribe', {
      endpoint: subJSON.endpoint,
      keys: { p256dh: subJSON.keys.p256dh, auth: subJSON.keys.auth },
      spaceId,
    });

    store.setSubscription(subJSON);
  } catch (err) {
    console.warn('Push subscription failed:', err);
  }
}

export async function unregisterPushSubscription() {
  const store = useNotificationStore.getState();
  const sub = store.subscription;
  if (!sub?.endpoint) return;

  try {
    await api.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
  } catch {}

  store.setSubscription(null);
}
