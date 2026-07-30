import { FastifyInstance } from 'fastify';
import { getDb, UPLOADS_DIR } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendPushToSpaceMembers } from '../lib/push.js';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

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
  file_data?: string;
  file_name?: string;
  file_size?: number;
}

function saveFile(data: string, prefix: string): string | null {
  if (!data) return null;
  const ext = 'bin';
  const fileName = `${prefix}-${Date.now()}-${nanoid(8)}.${ext}`;
  const buf = Buffer.from(data.includes(',') ? data.split(',')[1] : data, 'base64');
  fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buf);
  return fileName;
}

function readFile(fileName: string): Buffer | null {
  const fp = path.join(UPLOADS_DIR, fileName);
  if (!fs.existsSync(fp)) return null;
  return fs.readFileSync(fp);
}

export function announcementRoutes(app: FastifyInstance) {
  app.get('/api/spaces/:id/announcements', async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as { filter?: string };
    const db = getDb();

    let userId: number | null = null;
    try {
      const auth = request.headers.authorization;
      if (auth?.startsWith('Bearer ')) {
        const { verifyToken } = await import('../lib/jwt.js');
        const payload = verifyToken(auth.substring(7));
        if (payload) userId = (payload as any).userId;
      }
    } catch { /* no auth — fine */ }

    let sql = `
      SELECT a.*,
        u.name as author_name,
        c.name as course_name, c.code as course_code, c.icon as course_icon
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

    const rows = await db.prepare(sql).all(...params) as any[];

    const ids = rows.map(r => r.id);
    if (ids.length === 0) return { announcements: [] };

    const placeholders = ids.map(() => '?').join(',');
    const reactions = await db.prepare(`
      SELECT announcement_id, emoji, COUNT(*) as count
      FROM reactions
      WHERE announcement_id IN (${placeholders})
      GROUP BY announcement_id, emoji
    `).all(...ids) as any[];

    const reactionMap = new Map<number, { upvote: number; downvote: number }>();
    for (const r of reactions) {
      if (!reactionMap.has(r.announcement_id)) {
        reactionMap.set(r.announcement_id, { upvote: 0, downvote: 0 });
      }
      const map = reactionMap.get(r.announcement_id)!;
      if (r.emoji === 'upvote') map.upvote = r.count;
      if (r.emoji === 'downvote') map.downvote = r.count;
    }

    let myReactionMap = new Map<number, string>();
    if (userId) {
      const myVotes = await db.prepare(`
        SELECT announcement_id, emoji FROM reactions
        WHERE announcement_id IN (${placeholders}) AND user_id = ?
      `).all(...ids, userId) as any[];
      for (const v of myVotes) {
        myReactionMap.set(v.announcement_id, v.emoji);
      }
    }

    const announcements = rows.map((r: any) => {
      const react = reactionMap.get(r.id) ?? { upvote: 0, downvote: 0 };
      return {
        ...r,
        urgent: Boolean(r.urgent),
        pinned: Boolean(r.pinned),
        reactions: react,
        my_reaction: myReactionMap.get(r.id) ?? null,
      };
    });
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

    const membership = await db.prepare(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(id, userId) as any;
    if (!membership || membership.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can create announcements' });
    }

    const fileName = saveFile(body.file_data || '', 'ann');

    const result = await db.prepare(
      `INSERT INTO announcements (space_id, course_id, title, body, type, author_id, urgent, pinned, deadline, venue, instructions, submission_method, format, file_data, file_name, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, body.course_id || null, body.title, body.body, body.type || 'announcement',
      userId, body.urgent ? 1 : 0, body.pinned ? 1 : 0,
      body.deadline || null, body.venue || null, body.instructions || null,
      body.submission_method || null, body.format || null,
      fileName, body.file_name || null, body.file_size || null
    );

    const ann = await db.prepare(`
      SELECT a.*, u.name as author_name, c.name as course_name, c.code as course_code
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid) as any;

    const authorName = ann.author_name || 'Someone';
    const prefix = body.urgent ? '🚨' : '📢';
    sendPushToSpaceMembers(id, {
      title: `${prefix} ${body.title}`,
      body: `${authorName} — ${ann.course_code || 'General'}`,
      tag: `announcement-${result.lastInsertRowid}`,
      data: { url: `/space/${id}/announcement/${result.lastInsertRowid}`, type: 'announcement' },
      requireInteraction: !!body.urgent,
    }).catch(() => {});

    return {
      announcement: {
        ...ann,
        urgent: Boolean(ann.urgent),
        pinned: Boolean(ann.pinned),
        reactions: { upvote: 0, downvote: 0 },
        my_reaction: null,
      }
    };
  });

  app.get('/api/announcements/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const ann = await db.prepare(`
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

    const ann = await db.prepare('SELECT id, space_id, author_id FROM announcements WHERE id = ?').get(Number(id)) as any;
    if (!ann) return reply.status(404).send({ error: 'Not found' });

    const isRep = await db.prepare(
      'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ? AND role = ?'
    ).get(ann.space_id, userId, 'rep');

    if (ann.author_id !== userId && !isRep) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    await db.prepare('DELETE FROM announcements WHERE id = ?').run(Number(id));
    return { success: true };
  });

  app.patch('/api/announcements/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const body = request.body as any;
    const db = getDb();

    const ann = await db.prepare('SELECT id, space_id FROM announcements WHERE id = ?').get(Number(id)) as any;
    if (!ann) return reply.status(404).send({ error: 'Not found' });

    const isRep = await db.prepare(
      'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ? AND role = ?'
    ).get(ann.space_id, userId, 'rep');
    if (!isRep) return reply.status(403).send({ error: 'Not authorized' });

    const fields: string[] = [];
    const vals: any[] = [];

    if (body.pinned !== undefined) { fields.push('pinned = ?'); vals.push(body.pinned ? 1 : 0); }
    if (body.urgent !== undefined) { fields.push('urgent = ?'); vals.push(body.urgent ? 1 : 0); }
    if (body.title !== undefined) { fields.push('title = ?'); vals.push(body.title); }
    if (body.body !== undefined) { fields.push('body = ?'); vals.push(body.body); }
    if (body.type !== undefined) { fields.push('type = ?'); vals.push(body.type); }
    if (body.course_id !== undefined) { fields.push('course_id = ?'); vals.push(body.course_id); }
    if (body.file_data !== undefined) {
      const fileName = saveFile(body.file_data, 'ann');
      fields.push('file_data = ?');
      vals.push(fileName);
    }
    if (body.file_name !== undefined) { fields.push('file_name = ?'); vals.push(body.file_name); }
    if (body.file_size !== undefined) { fields.push('file_size = ?'); vals.push(body.file_size); }

    if (fields.length > 0) {
      vals.push(Number(id));
      await db.prepare(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    }

    return { success: true };
  });

  app.get('/api/announcements/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const ann = await db.prepare('SELECT file_data, file_name FROM announcements WHERE id = ?').get(Number(id)) as any;
    if (!ann || !ann.file_data) return reply.status(404).send({ error: 'File not found' });

    const buf = readFile(ann.file_data as string);
    if (!buf) return reply.status(404).send({ error: 'File not found on disk' });

    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Disposition', `attachment; filename="${ann.file_name || 'download'}"`);
    reply.header('Cache-Control', 'public, max-age=86400');
    return buf;
  });

  app.get('/api/announcements/shared/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const announcement = await db.prepare(`
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
