import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendPushToUser } from '../lib/push.js';

export function pushRoutes(app: FastifyInstance) {
  app.post('/api/push/subscribe', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const body = request.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      spaceId: string;
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth || !body.spaceId) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    const db = getDb();
    const existing = db.prepare(
      'SELECT id FROM push_subscriptions WHERE endpoint = ?'
    ).get(body.endpoint) as any;

    if (existing) {
      db.prepare(
        'UPDATE push_subscriptions SET user_id = ?, space_id = ?, p256dh = ?, auth = ? WHERE id = ?'
      ).run(userId, body.spaceId, body.keys.p256dh, body.keys.auth, existing.id);
    } else {
      db.prepare(
        'INSERT INTO push_subscriptions (user_id, space_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)'
      ).run(userId, body.spaceId, body.endpoint, body.keys.p256dh, body.keys.auth);
    }

    return { success: true };
  });

  app.delete('/api/push/unsubscribe', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const body = request.body as { endpoint?: string };

    const db = getDb();
    if (body.endpoint) {
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?')
        .run(body.endpoint, userId);
    } else {
      db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
    }

    return { success: true };
  });

  app.post('/api/push/test', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const db = getDb();
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;

    try {
      await sendPushToUser(userId, '', {
        title: '🔔 Test notification',
        body: `Hi ${user?.name || 'there'}! Push notifications are working.`,
        tag: 'test',
        data: { url: '/' },
      });
      return { success: true };
    } catch (err: any) {
      return reply.status(500).send({ error: 'Push send failed: ' + err.message });
    }
  });
}
