import { FastifyInstance } from 'fastify';
import { getDb, isSpaceMember } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadFile, uploadFileBuffer, deleteFileByUrl } from '../lib/upload.js';
import { isNonEmptyString, fail } from '../lib/validate.js';
import { CourseRow, MaterialRow, MembershipRow } from '../db/rows.js';

const DEMO_FILE_URL = 'https://utfs.io/f/0YOWD4Ku08Y31gp6G6UR8FXkzYnomKRt4LGjCbgJflrZdB9E';

export function materialRoutes(app: FastifyInstance) {
  app.get('/api/courses/:id/materials', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const course = await db.prepare<CourseRow>('SELECT space_id FROM courses WHERE id = ?').get(Number(id));
    if (!course) return reply.status(404).send({ error: 'Course not found' });

    if (!await isSpaceMember(course.space_id, userId)) {
      return reply.status(403).send({ error: 'Not a member of this space' });
    }

    const query = request.query as { sort?: string };
    const sortMap: Record<string, string> = {
      newest: 'm.created_at DESC',
      oldest: 'm.created_at ASC',
      downloads: 'm.downloads DESC',
      alpha: 'm.name ASC',
    };
    const order = sortMap[query.sort || 'newest'] || 'm.created_at DESC';

    const materials = await db.prepare(`
      SELECT m.id, m.name, m.file_type, m.category, m.file_size, m.created_at,
             m.pinned, m.downloads, m.file_data IS NOT NULL as has_file,
             u.name as uploader_name, c.name as course_name, c.code as course_code
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      JOIN courses c ON m.course_id = c.id
      WHERE m.course_id = ?
      ORDER BY m.pinned DESC, ${order}
    `).all(Number(id)) as unknown as MaterialRow[];

    return {
      materials: materials.map(m => ({ ...m, pinned: Boolean(m.pinned), has_file: Boolean(m.has_file), downloads: m.downloads || 0 })),
    };
  });

  app.post('/api/courses/:id/materials', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();
    const ct = request.headers['content-type'] || '';

    const course = await db.prepare<CourseRow>('SELECT space_id FROM courses WHERE id = ?').get(Number(id));
    if (!course) return reply.status(404).send({ error: 'Course not found' });

    const membership = await db.prepare<MembershipRow>(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(course.space_id, userId);
    if (!membership || membership.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can upload materials' });
    }

    let name: string;
    let fileUrl: string | null = null;
    let fileSize = 0;
    let fileType = 'other';
    let category = 'Other';

    if (ct.includes('multipart/form-data')) {
      const data = await request.file();
      if (!data) return reply.status(400).send({ error: 'No file data received' });

      const nameField = (data.fields as Record<string, { value?: string }>).name;
      const categoryField = (data.fields as Record<string, { value?: string }>).category;
      name = nameField?.value || data.filename.replace(/\.[^/.]+$/, '');
      category = categoryField?.value || 'Other';
      fileType = data.filename.split('.').pop()?.toLowerCase() || 'other';

      const buffer = await data.toBuffer();
      fileSize = buffer.length;

      if (buffer.length > 0) {
        const result = await uploadFileBuffer(buffer, data.filename, data.mimetype);
        fileUrl = result.url;
      }
    } else {
      const data = request.body as {
        name: string; file_data?: string; file_url?: string; file_name?: string; file_size?: number; file_type?: string; category?: string;
      };
      if (!isNonEmptyString(data.name, 200)) return fail(reply, 'Material name is required (max 200 chars)');
      name = data.name;
      fileType = data.file_type || 'other';
      category = data.category || 'Other';
      fileSize = data.file_size || 0;

      if (data.file_url) {
        fileUrl = data.file_url;
        if (!fileSize && data.file_size) fileSize = data.file_size;
        const ext = (data.file_name || '').split('.').pop()?.toLowerCase();
        if (ext && fileType === 'other') fileType = ext;
      } else if (data.file_data) {
        const result = await uploadFile(data.file_data, `${name}.${fileType}`, undefined);
        fileUrl = result.url;
      }
    }

    const insertResult = await db.prepare(
      `INSERT INTO materials (space_id, course_id, name, file_data, file_size, file_type, category, uploader_id)
       VALUES ((SELECT space_id FROM courses WHERE id = ?), ?, ?, ?, ?, ?, ?, ?)`
    ).run(Number(id), Number(id), name, fileUrl, fileSize, fileType, category, userId);

    const material = await db.prepare(`
      SELECT m.*, u.name as uploader_name
      FROM materials m JOIN users u ON m.uploader_id = u.id
      WHERE m.id = ?
    `).get(insertResult.lastInsertRowid) as MaterialRow | null;

    return { material: { ...material, pinned: false, downloads: 0 } };
  });

  app.get('/api/materials/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const material = await db.prepare<MaterialRow>(
      'SELECT name, file_data, file_type, file_size FROM materials WHERE id = ?'
    ).get(Number(id));

    if (!material) {
      return reply.status(404).send({ error: 'Material not found' });
    }
    if (!material.file_data) {
      return reply.redirect(DEMO_FILE_URL);
    }

    await db.prepare('UPDATE materials SET downloads = downloads + 1 WHERE id = ?').run(Number(id));

    return reply.redirect(material.file_data as string);
  });

  app.patch('/api/materials/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const body = request.body as Record<string, unknown>;
    const db = getDb();

    const mat = await db.prepare<MaterialRow>('SELECT id, space_id, uploader_id FROM materials WHERE id = ?').get(Number(id));
    if (!mat) return reply.status(404).send({ error: 'Not found' });

    const isRep = await db.prepare(
      'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ? AND role = ?'
    ).get(mat.space_id, userId, 'rep');
    if (!isRep) return reply.status(403).send({ error: 'Not authorized' });

    if (body.pinned !== undefined) {
      await db.prepare('UPDATE materials SET pinned = ? WHERE id = ?').run(body.pinned ? 1 : 0, Number(id));
    }

    return { success: true };
  });

  app.delete('/api/materials/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const mat = await db.prepare<MaterialRow>('SELECT id, space_id, uploader_id, file_data FROM materials WHERE id = ?').get(Number(id));
    if (!mat) return reply.status(404).send({ error: 'Not found' });

    const isRep = await db.prepare(
      'SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ? AND role = ?'
    ).get(mat.space_id, userId, 'rep');

    if (mat.uploader_id !== userId && !isRep) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    await db.prepare('DELETE FROM materials WHERE id = ?').run(Number(id));
    await deleteFileByUrl(mat.file_data);
    return { success: true };
  });

  app.get('/api/spaces/:id/materials/summary', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    if (!await isSpaceMember(id, userId)) {
      return reply.status(403).send({ error: 'Not a member of this space' });
    }

    const db = getDb();

    const rows = await db.prepare(`
      SELECT c.id as course_id, c.name as course_name, c.code as course_code,
             COUNT(m.id) as count,
             COUNT(DISTINCT m.uploader_id) as contributors,
             COALESCE(SUM(m.downloads), 0) as total_downloads,
             latest.name as latest_name,
             latest.created_at as latest_created_at
      FROM courses c
      LEFT JOIN materials m ON m.course_id = c.id
      LEFT JOIN (
        SELECT course_id, name, created_at,
               ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at DESC) as rn
        FROM materials
      ) latest ON latest.course_id = c.id AND latest.rn = 1
      WHERE c.space_id = ?
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all(id) as unknown as {
      course_id: number;
      count: number;
      contributors: number;
      total_downloads: number;
      latest_name: string | null;
      latest_created_at: string | null;
    }[];

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

  app.get('/api/spaces/:id/materials/recent', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    if (!await isSpaceMember(id, userId)) {
      return reply.status(403).send({ error: 'Not a member of this space' });
    }

    const query = request.query as { limit?: string };
    const limit = Math.min(Math.max(Number(query.limit) || 5, 1), 10);
    const db = getDb();

    const materials = await db.prepare(`
      SELECT m.id, m.name, m.file_type, m.category, m.file_size, m.created_at,
             m.downloads, m.file_data IS NOT NULL as has_file,
             u.name as uploader_name, c.id as course_id, c.name as course_name, c.code as course_code, c.icon as course_icon
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      JOIN courses c ON m.course_id = c.id
      WHERE m.space_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(id, limit) as unknown as MaterialRow[];

    return {
      materials: materials.map(m => ({
        ...m,
        pinned: Boolean(m.pinned),
        has_file: Boolean(m.has_file),
        downloads: m.downloads || 0,
      })),
    };
  });

  app.get('/api/materials/shared/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const material = await db.prepare(`
      SELECT m.id, m.name, m.file_type, m.category, m.file_size, m.created_at, m.course_id, m.pinned, m.downloads,
             m.file_data IS NOT NULL as has_file,
             u.name as uploader_name, c.name as course_name, c.code as course_code,
             c.icon as course_icon, s.name as space_name, s.id as space_id
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      JOIN courses c ON m.course_id = c.id
      JOIN spaces s ON m.space_id = s.id
      WHERE m.id = ?
    `).get(Number(id)) as MaterialRow | null;

    if (!material) {
      return reply.status(404).send({ error: 'Material not found' });
    }

    return { ...material, has_file: Boolean(material.has_file) };
  });
}
