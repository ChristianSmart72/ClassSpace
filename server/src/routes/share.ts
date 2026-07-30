import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';

export function shareRoutes(app: FastifyInstance) {
  app.get('/api/share/space/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const space = await db.prepare('SELECT * FROM spaces WHERE id = ?').get(id) as any;
    if (!space) return reply.status(404).send({ error: 'Space not found' });

    const rep = await db.prepare('SELECT name FROM users WHERE id = ?').get(space.rep_id) as any;
    const latestAnn = await db.prepare(
      "SELECT title FROM announcements WHERE space_id = ? ORDER BY created_at DESC LIMIT 1"
    ).get(id) as any;

    return {
      type: 'space',
      name: space.name,
      dept: space.dept,
      level: space.level,
      uni: space.uni,
      rep: rep?.name,
      announcementTeaser: latestAnn?.title || null,
      id: space.id,
      invite_code: space.invite_code,
    };
  });

  app.get('/api/share/ann/:id', async (request, reply) => {
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

    return {
      type: 'announcement',
      id: ann.id,
      title: ann.title,
      body: ann.body,
      author: ann.author_name,
      time: ann.created_at,
      urgent: !!ann.urgent,
      pinned: !!ann.pinned,
      type_label: ann.type,
      course: ann.course_name ? { name: ann.course_name, code: ann.course_code, icon: ann.course_icon } : null,
      space: { id: ann.space_id, name: ann.space_name },
    };
  });

  app.get('/api/share/mat/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const mat = await db.prepare(`
      SELECT m.*, u.name as uploader_name, c.name as course_name, c.code as course_code, c.icon as course_icon,
             s.name as space_name, s.id as space_id
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      JOIN courses c ON m.course_id = c.id
      JOIN spaces s ON m.space_id = s.id
      WHERE m.id = ?
    `).get(id) as any;

    if (!mat) return reply.status(404).send({ error: 'Material not found' });

    return {
      type: 'material',
      id: mat.id,
      name: mat.name,
      file_type: mat.file_type,
      category: mat.category,
      file_size: mat.file_size,
      uploader: mat.uploader_name,
      course: { name: mat.course_name, code: mat.course_code, icon: mat.course_icon },
      space: { id: mat.space_id, name: mat.space_name },
    };
  });

  app.get('/api/share/course/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const course = await db.prepare(`
      SELECT c.*, s.name as space_name, s.id as space_id
      FROM courses c JOIN spaces s ON c.space_id = s.id
      WHERE c.id = ?
    `).get(id) as any;

    if (!course) return reply.status(404).send({ error: 'Course not found' });

    const files = await db.prepare(`
      SELECT id, name, file_type, category, file_size FROM materials WHERE course_id = ?
    `).all(id) as any[];

    return {
      type: 'course',
      id: course.id,
      name: course.name,
      code: course.code,
      icon: course.icon,
      color_index: course.color_index,
      files: files.slice(0, 5),
      totalFiles: files.length,
      space: { id: course.space_id, name: course.space_name },
    };
  });
}
