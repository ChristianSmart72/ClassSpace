import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const ALLOWED_CATEGORIES = ['seminar', 'scholarship', 'internship', 'job', 'event', 'competition', 'other'];

export function opportunityRoutes(app: FastifyInstance) {
  app.get('/api/spaces/:id/opportunities', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const items = db.prepare(`
      SELECT o.*, u.name as author_name
      FROM opportunities o
      JOIN users u ON o.author_id = u.id
      WHERE o.space_id = ?
      ORDER BY o.created_at DESC
    `).all(id) as any[];

    return { opportunities: items };
  });

  app.post('/api/spaces/:id/opportunities', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      title: string;
      description: string;
      category: string;
      link?: string;
      deadline?: string;
    };
    const userId = request.user!.userId;
    const db = getDb();

    const isMember = db.prepare(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can post opportunities' });
    }

    if (!body.title?.trim() || !body.description?.trim()) {
      return reply.status(400).send({ error: 'Title and description are required' });
    }

    const category = ALLOWED_CATEGORIES.includes(body.category) ? body.category : 'other';

    const result = db.prepare(
      'INSERT INTO opportunities (space_id, author_id, title, description, category, link, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, body.title.trim(), body.description.trim(), category, body.link || null, body.deadline || null);

    const opportunity = db.prepare(`
      SELECT o.*, u.name as author_name
      FROM opportunities o
      JOIN users u ON o.author_id = u.id
      WHERE o.id = ?
    `).get(result.lastInsertRowid) as any;

    return { opportunity };
  });

  app.delete('/api/opportunities/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(Number(id)) as any;
    if (!opp) return reply.status(404).send({ error: 'Not found' });

    const isMember = db.prepare(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(opp.space_id, userId) as any;

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can delete opportunities' });
    }

    db.prepare('DELETE FROM opportunities WHERE id = ?').run(Number(id));
    return { success: true };
  });
}
