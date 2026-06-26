import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const ALLOWED_EMOJIS = ['👍', '❤️', '👀', '🔥'];

export function reactionRoutes(app: FastifyInstance) {
  app.post('/api/announcements/:id/react', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { emoji } = request.body as { emoji: string };
    const userId = request.user!.userId;

    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return reply.status(400).send({ error: 'Invalid emoji' });
    }

    const db = getDb();
    const annId = Number(id);

    const ann = db.prepare('SELECT id FROM announcements WHERE id = ?').get(annId);
    if (!ann) return reply.status(404).send({ error: 'Announcement not found' });

    const existing = db.prepare(
      'SELECT id FROM reactions WHERE announcement_id = ? AND user_id = ? AND emoji = ?'
    ).get(annId, userId, emoji);

    let userReacted: boolean;
    if (existing) {
      db.prepare('DELETE FROM reactions WHERE announcement_id = ? AND user_id = ? AND emoji = ?')
        .run(annId, userId, emoji);
      userReacted = false;
    } else {
      db.prepare('INSERT INTO reactions (announcement_id, user_id, emoji) VALUES (?, ?, ?)')
        .run(annId, userId, emoji);
      userReacted = true;
    }

    const counts = db.prepare(
      'SELECT emoji, COUNT(*) as count FROM reactions WHERE announcement_id = ? GROUP BY emoji'
    ).all(annId) as { emoji: string; count: number }[];

    const reactions: Record<string, number> = {};
    for (const row of counts) reactions[row.emoji] = row.count;

    return { reactions, userReacted, emoji };
  });
}
