import { FastifyInstance } from 'fastify';
import { getDb, isSpaceMember } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { isNonEmptyString, isValidUrl, fail } from '../lib/validate.js';
import { OpportunityRow, MembershipRow } from '../db/rows.js';

const ALLOWED_CATEGORIES = ['seminar', 'scholarship', 'internship', 'job', 'event', 'competition', 'other'];

export function opportunityRoutes(app: FastifyInstance) {
  app.get('/api/spaces/:id/opportunities', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    if (!await isSpaceMember(id, userId)) {
      return reply.status(403).send({ error: 'Not a member of this space' });
    }

    const db = getDb();

    const items = await db.prepare<OpportunityRow>(`
      SELECT o.*, u.name as author_name
      FROM opportunities o
      JOIN users u ON o.author_id = u.id
      WHERE o.space_id = ?
      ORDER BY o.pinned DESC, o.created_at DESC
    `).all(id);

    return { opportunities: items.map(o => ({ ...o, pinned: Boolean(o.pinned) })) };
  });

  app.patch('/api/opportunities/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const body = request.body as { pinned?: boolean };
    const db = getDb();

    const opp = await db.prepare<OpportunityRow>('SELECT * FROM opportunities WHERE id = ?').get(Number(id));
    if (!opp) return reply.status(404).send({ error: 'Not found' });

    const isMember = await db.prepare<MembershipRow>(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(opp.space_id, userId);

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can update opportunities' });
    }

    if (body.pinned !== undefined) {
      await db.prepare('UPDATE opportunities SET pinned = ? WHERE id = ?').run(body.pinned ? 1 : 0, Number(id));
    }

    return { success: true };
  });

  app.post('/api/spaces/:id/opportunities', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      title: string;
      description: string;
      category: string;
      link?: string;
      deadline?: string;
      eligibility?: string;
    };
    const userId = request.user!.userId;
    const db = getDb();

    const isMember = await db.prepare<MembershipRow>(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(id, userId);

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can post opportunities' });
    }

    if (!isNonEmptyString(body.title, 200) || !isNonEmptyString(body.description, 5000)) {
      return fail(reply, 'Title (max 200 chars) and description (max 5,000 chars) are required');
    }
    if (body.link && !isValidUrl(body.link)) {
      return fail(reply, 'Link must be a valid http(s) URL');
    }

    const category = ALLOWED_CATEGORIES.includes(body.category) ? body.category : 'other';

    const result = await db.prepare(
      'INSERT INTO opportunities (space_id, author_id, title, description, category, link, deadline, eligibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, body.title.trim(), body.description.trim(), category, body.link || null, body.deadline || null, body.eligibility?.trim() || null);

    const opportunity = await db.prepare(`
      SELECT o.*, u.name as author_name
      FROM opportunities o
      JOIN users u ON o.author_id = u.id
      WHERE o.id = ?
    `).get(result.lastInsertRowid) as OpportunityRow | null;

    return { opportunity };
  });

  app.delete('/api/opportunities/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const opp = await db.prepare<OpportunityRow>('SELECT * FROM opportunities WHERE id = ?').get(Number(id));
    if (!opp) return reply.status(404).send({ error: 'Not found' });

    const isMember = await db.prepare<MembershipRow>(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(opp.space_id, userId);

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can delete opportunities' });
    }

    await db.prepare('DELETE FROM opportunities WHERE id = ?').run(Number(id));
    return { success: true };
  });
}
