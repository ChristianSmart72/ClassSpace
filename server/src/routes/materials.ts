import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

export function materialRoutes(app: FastifyInstance) {
  app.get('/api/courses/:id/materials', async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as { sort?: string };
    const db = getDb();

    const sortMap: Record<string, string> = {
      newest: 'm.created_at DESC',
      oldest: 'm.created_at ASC',
      downloads: 'm.downloads DESC',
      alpha: 'm.name ASC',
    };
    const order = sortMap[query.sort || 'newest'] || 'm.created_at DESC';

    const materials = db.prepare(`
      SELECT m.id, m.name, m.file_type, m.category, m.file_size, m.created_at,
             m.pinned, m.downloads,
             u.name as uploader_name, c.name as course_name, c.code as course_code
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      JOIN courses c ON m.course_id = c.id
      WHERE m.course_id = ?
      ORDER BY m.pinned DESC, ${order}
    `).all(Number(id)) as any[];

    return {
      materials: materials.map(m => ({ ...m, pinned: Boolean(m.pinned), downloads: m.downloads || 0 })),
    };
  });

  app.post('/api/courses/:id/materials', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const course = db.prepare('SELECT space_id FROM courses WHERE id = ?').get(Number(id)) as any;
    if (!course) return reply.status(404).send({ error: 'Course not found' });

    const membership = db.prepare(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(course.space_id, userId) as any;
    if (!membership || membership.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can upload materials' });
    }

    const data = request.body as {
      name: string;
      file_data?: string;
      file_size?: number;
      file_type?: string;
      category?: string;
    };

    if (!data.name) {
      return reply.status(400).send({ error: 'Material name is required' });
    }

    const result = db.prepare(
      `INSERT INTO materials (space_id, course_id, name, file_data, file_size, file_type, category, uploader_id)
       VALUES ((SELECT space_id FROM courses WHERE id = ?), ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      Number(id), Number(id), data.name,
      data.file_data || null, data.file_size || 0,
      data.file_type || 'other', data.category || 'Other', userId
    );

    const material = db.prepare(`
      SELECT m.*, u.name as uploader_name
      FROM materials m JOIN users u ON m.uploader_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid) as any;

    return { material: { ...material, pinned: false, downloads: 0 } };
  });

  app.get('/api/materials/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const material = db.prepare(
      'SELECT name, file_data, file_type, file_size FROM materials WHERE id = ?'
    ).get(Number(id)) as any;

    if (!material || !material.file_data) {
      return reply.status(404).send({ error: 'Material not found or no file data' });
    }

    db.prepare('UPDATE materials SET downloads = downloads + 1 WHERE id = ?').run(Number(id));

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      ppt: 'application/vnd.ms-powerpoint',
      xls: 'application/vnd.ms-excel',
      img: 'image/png',
      video: 'video/mp4',
    };

    const buffer = Buffer.from(material.file_data, 'base64');
    reply.header('Content-Type', mimeTypes[material.file_type] || 'application/octet-stream');
    reply.header('Content-Disposition', `attachment; filename="${material.name}.${material.file_type}"`);
    reply.header('Content-Length', buffer.length);
    reply.header('Cache-Control', 'public, max-age=86400');
    return reply.send(buffer);
  });

  app.patch('/api/materials/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const body = request.body as any;
    const db = getDb();

    const mat = db.prepare('SELECT * FROM materials WHERE id = ?').get(Number(id)) as any;
    if (!mat) return reply.status(404).send({ error: 'Not found' });

    const isRep = db.prepare(
      'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ? AND role = ?'
    ).get(mat.space_id, userId, 'rep');
    if (!isRep) return reply.status(403).send({ error: 'Not authorized' });

    if (body.pinned !== undefined) {
      db.prepare('UPDATE materials SET pinned = ? WHERE id = ?').run(body.pinned ? 1 : 0, Number(id));
    }

    return { success: true };
  });

  app.delete('/api/materials/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const mat = db.prepare('SELECT * FROM materials WHERE id = ?').get(Number(id)) as any;
    if (!mat) return reply.status(404).send({ error: 'Not found' });

    const isRep = db.prepare(
      'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ? AND role = ?'
    ).get(mat.space_id, userId, 'rep');

    if (mat.uploader_id !== userId && !isRep) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    db.prepare('DELETE FROM materials WHERE id = ?').run(Number(id));
    return { success: true };
  });

  app.get('/api/spaces/:id/materials/summary', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const rows = db.prepare(`
      SELECT c.id as course_id, c.name as course_name, c.code as course_code,
             COUNT(m.id) as count,
             COUNT(DISTINCT m.uploader_id) as contributors,
             COALESCE(SUM(m.downloads), 0) as total_downloads,
             (SELECT m2.name FROM materials m2 WHERE m2.course_id = c.id ORDER BY m2.created_at DESC LIMIT 1) as latest_name,
             (SELECT m2.created_at FROM materials m2 WHERE m2.course_id = c.id ORDER BY m2.created_at DESC LIMIT 1) as latest_created_at
      FROM courses c
      LEFT JOIN materials m ON m.course_id = c.id
      WHERE c.space_id = ?
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all(id) as any[];

    return {
      courses: rows.map(r => ({
        course_id: r.course_id,
        count: r.count,
        contributors: r.contributors,
        total_downloads: r.total_downloads,
        latest: r.latest_name ? { name: r.latest_name, created_at: r.latest_created_at } : null,
      })),
    };
  });

  app.get('/api/materials/shared/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const material = db.prepare(`
      SELECT m.id, m.name, m.file_type, m.category, m.file_size, m.created_at,
             u.name as uploader_name, c.name as course_name, c.code as course_code,
             c.icon as course_icon, s.name as space_name, s.id as space_id
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      JOIN courses c ON m.course_id = c.id
      JOIN spaces s ON m.space_id = s.id
      WHERE m.id = ?
    `).get(Number(id)) as any;

    if (!material) {
      return reply.status(404).send({ error: 'Material not found' });
    }

    return material;
  });
}
