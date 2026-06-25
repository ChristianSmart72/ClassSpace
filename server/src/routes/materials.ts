import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

export function materialRoutes(app: FastifyInstance) {
  app.get('/api/courses/:id/materials', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const materials = db.prepare(`
      SELECT m.id, m.name, m.file_type, m.category, m.file_size, m.created_at,
             u.name as uploader_name, c.name as course_name, c.code as course_code
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      JOIN courses c ON m.course_id = c.id
      WHERE m.course_id = ?
      ORDER BY m.created_at DESC
    `).all(Number(id)) as any[];

    return { materials };
  });

  app.post('/api/courses/:id/materials', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

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

    return { material };
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
