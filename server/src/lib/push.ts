import webpush from 'web-push';
import { getDb } from '../db/connection.js';

if (!process.env.VAPID_SUBJECT || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  throw new Error(
    'VAPID_SUBJECT, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY environment variables are required for push notifications. ' +
    'Generate keys with: npx web-push generate-vapid-keys --json'
  );
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

async function sendToEndpoint(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  const subscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  return webpush.sendNotification(subscription, JSON.stringify(payload)).catch(async (err: Error & { statusCode?: number }) => {
    if (err.statusCode === 410 || err.statusCode === 404) {
      const db = getDb();
      await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
    }
  });
}

export async function sendPushToSpaceMembers(spaceId: string, payload: PushPayload) {
  const db = getDb();
  const subs = await db.prepare(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE space_id = ?'
  ).all(spaceId) as { endpoint: string; p256dh: string; auth: string }[];

  return Promise.allSettled(
    subs.map((sub) => sendToEndpoint(sub, payload))
  );
}

export async function sendPushToUser(userId: number, spaceId: string, payload: PushPayload) {
  const db = getDb();
  const subs = await db.prepare(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ? AND space_id = ?'
  ).all(userId, spaceId) as { endpoint: string; p256dh: string; auth: string }[];

  return Promise.allSettled(
    subs.map((sub) => sendToEndpoint(sub, payload))
  );
}
