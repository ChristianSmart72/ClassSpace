import { FastifyInstance } from 'fastify';
import { getDb, isSpaceMember } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const ALLOWED_REACTIONS = ['upvote', 'downvote'];

export function reactionRoutes(app: FastifyInstance) {
  app.post('/api/announcements/:id/react', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { emoji } = request.body as { emoji: string };
    const userId = request.user!.userId;

    if (!ALLOWED_REACTIONS.includes(emoji)) {
      return reply.status(400).send({ error: 'Invalid reaction' });
    }

    const db = getDb();
    const annId = Number(id);

    const ann = await db.prepare<{ id: number; space_id: string }>('SELECT id, space_id FROM announcements WHERE id = ?').get(annId);
    if (!ann) return reply.status(404).send({ error: 'Announcement not found' });
    if (!await isSpaceMember(ann.space_id, userId)) {
      return reply.status(403).send({ error: 'Not a member of this space' });
    }

    const existing = await db.prepare(
      'SELECT id FROM reactions WHERE announcement_id = ? AND user_id = ? AND emoji = ?'
    ).get(annId, userId, emoji);

    let userReacted: boolean;
    if (existing) {
      await db.prepare('DELETE FROM reactions WHERE announcement_id = ? AND user_id = ? AND emoji = ?')
        .run(annId, userId, emoji);
      userReacted = false;
    } else {
      const opposite = emoji === 'upvote' ? 'downvote' : 'upvote';
      await db.batch([
        {
          sql: 'DELETE FROM reactions WHERE announcement_id = ? AND user_id = ? AND emoji = ?',
          args: [annId, userId, opposite],
        },
        {
          sql: 'INSERT INTO reactions (announcement_id, user_id, emoji) VALUES (?, ?, ?)',
          args: [annId, userId, emoji],
        },
      ]);
      userReacted = true;
    }

    const counts = await db.prepare(
      'SELECT emoji, COUNT(*) as count FROM reactions WHERE announcement_id = ? GROUP BY emoji'
    ).all(annId) as { emoji: string; count: number }[];

    const reactions: Record<string, number> = {};
    for (const row of counts) reactions[row.emoji] = row.count;

    return { reactions, userReacted, emoji };
  });
}
