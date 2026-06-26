import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

interface CreateAnnBody {
  course_id: number | null;
  title: string;
  body: string;
  type: string;
  urgent: boolean;
  pinned: boolean;
  deadline?: string;
  venue?: string;
  instructions?: string;
  submission_method?: string;
  format?: string;
}

export function announcementRoutes(app: FastifyInstance) {
  app.get('/api/spaces/:id/announcements', async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as { filter?: string };
    const db = getDb();

    let sql = `
      SELECT a.*,
        u.name as author_name,
        c.name as course_name, c.code as course_code, c.icon as course_icon,
        COALESCE((SELECT COUNT(*) FROM reactions WHERE announcement_id = a.id AND emoji = '👍'), 0) as react_like,
        COALESCE((SELECT COUNT(*) FROM reactions WHERE announcement_id = a.id AND emoji = '❤️'), 0) as react_heart,
        COALESCE((SELECT COUNT(*) FROM reactions WHERE announcement_id = a.id AND emoji = '👀'), 0) as react_eyes,
        COALESCE((SELECT COUNT(*) FROM reactions WHERE announcement_id = a.id AND emoji = '🔥'), 0) as react_fire
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.space_id = ?
    `;
    const params: any[] = [id];

    if (query.filter === 'urgent') {
      sql += ' AND a.urgent = 1';
    } else if (query.filter === 'pinned') {
      sql += ' AND a.pinned = 1';
    } else if (query.filter && query.filter !== 'all') {
      sql += ' AND c.code = ?';
      params.push(query.filter);
    }

    sql += ' ORDER BY a.pinned DESC, a.urgent DESC, a.created_at DESC';

    const rows = db.prepare(sql).all(...params) as any[];
    const announcements = rows.map((r) => ({
      ...r,
      urgent: Boolean(r.urgent),
      pinned: Boolean(r.pinned),
      reactions: {
        '👍': r.react_like,
        '❤️': r.react_heart,
        '👀': r.react_eyes,
        '🔥': r.react_fire,
      },
    }));
    return { announcements };
  });

  app.post('/api/spaces/:id/announcements', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as CreateAnnBody;
    const userId = request.user!.userId;

    if (!body.title || !body.body) {
      return reply.status(400).send({ error: 'Title and body are required' });
    }

    const db = getDb();
    const result = db.prepare(
      `INSERT INTO announcements (space_id, course_id, title, body, type, author_id, urgent, pinned, deadline, venue, instructions, submission_method, format)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, body.course_id || null, body.title, body.body, body.type || 'announcement',
      userId, body.urgent ? 1 : 0, body.pinned ? 1 : 0,
      body.deadline || null, body.venue || null, body.instructions || null,
      body.submission_method || null, body.format || null
    );

    const ann = db.prepare(`
      SELECT a.*, u.name as author_name
      FROM announcements a JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid) as any;

    return { announcement: { ...ann, urgent: Boolean(ann.urgent), pinned: Boolean(ann.pinned), reactions: { '👍': 0, '❤️': 0, '👀': 0, '🔥': 0 } } };
  });

  app.get('/api/announcements/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const ann = db.prepare(`
      SELECT a.*, u.name as author_name, c.name as course_name, c.code as course_code, c.icon as course_icon,
        s.name as space_name, s.id as space_id
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      JOIN spaces s ON a.space_id = s.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!ann) return reply.status(404).send({ error: 'Announcement not found' });
    return ann;
  });

  app.delete('/api/announcements/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const ann = db.prepare('SELECT * FROM announcements WHERE id = ?').get(Number(id)) as any;
    if (!ann) return reply.status(404).send({ error: 'Not found' });

    const isRep = db.prepare(
      'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ? AND role = ?'
    ).get(ann.space_id, userId, 'rep');

    if (ann.author_id !== userId && !isRep) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    db.prepare('DELETE FROM announcements WHERE id = ?').run(Number(id));
    return { success: true };
  });

  app.get('/api/announcements/shared/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const announcement = db.prepare(`
      SELECT a.*, u.name as author_name, c.name as course_name, c.code as course_code, c.icon as course_icon,
             s.name as space_name, s.dept, s.level, s.uni, s.id as space_id
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      JOIN spaces s ON a.space_id = s.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!announcement) return reply.status(404).send({ error: 'Announcement not found' });
    return announcement;
  });
}
