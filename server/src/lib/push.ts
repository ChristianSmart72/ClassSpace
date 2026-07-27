import webpush from 'web-push';
import { getDb } from '../db/connection.js';

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:webdaddyempire@gmail.com';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BK-fNRDB2k-Vkap_EPjRkJ_r4QT4cPfYZFCh_rjGs_hrmWYrCde-uK9H-2ZAdtU9Xlils6wA2pfbP_1ZXwWCqCU';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'onDjUGHMOlXCsyB8_FL9gKD_Qm0xjHWCQFK9yg-Wr84';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

function sendToEndpoint(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  const subscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  return webpush.sendNotification(subscription, JSON.stringify(payload)).catch((err) => {
    if (err.statusCode === 410 || err.statusCode === 404) {
      const db = getDb();
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
    }
  });
}

export function sendPushToSpaceMembers(spaceId: string, payload: PushPayload) {
  const db = getDb();
  const subs = db.prepare(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE space_id = ?'
  ).all(spaceId) as { endpoint: string; p256dh: string; auth: string }[];

  return Promise.allSettled(
    subs.map((sub) => sendToEndpoint(sub, payload))
  );
}

export function sendPushToUser(userId: number, spaceId: string, payload: PushPayload) {
  const db = getDb();
  const subs = db.prepare(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ? AND space_id = ?'
  ).all(userId, spaceId) as { endpoint: string; p256dh: string; auth: string }[];

  return Promise.allSettled(
    subs.map((sub) => sendToEndpoint(sub, payload))
  );
}
