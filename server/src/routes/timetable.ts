import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

export function timetableRoutes(app: FastifyInstance) {
  app.get('/api/spaces/:id/timetable', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const entries = db.prepare(`
      SELECT t.*, c.name as course_name, c.code as course_code, c.icon as course_icon, c.color_index
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      WHERE t.space_id = ?
      ORDER BY
        CASE t.day
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END,
        t.start_time
    `).all(id) as any[];

    return { timetable: entries };
  });

  app.post('/api/spaces/:id/timetable', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      course_id: number; day: string; start_time: string;
      end_time: string; venue?: string; lecturer?: string;
    };
    const db = getDb();

    const isMember = db.prepare(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(id, request.user!.userId) as any;

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can edit the timetable' });
    }

    const result = db.prepare(
      'INSERT INTO timetable (space_id, course_id, day, start_time, end_time, venue, lecturer) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, body.course_id, body.day, body.start_time, body.end_time, body.venue || null, body.lecturer || null);

    const entry = db.prepare(`
      SELECT t.*, c.name as course_name, c.code as course_code, c.icon as course_icon, c.color_index
      FROM timetable t JOIN courses c ON t.course_id = c.id WHERE t.id = ?
    `).get(result.lastInsertRowid);

    return { entry };
  });

  app.delete('/api/timetable/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const entry = db.prepare('SELECT * FROM timetable WHERE id = ?').get(Number(id)) as any;
    if (!entry) return reply.status(404).send({ error: 'Not found' });

    const isMember = db.prepare(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(entry.space_id, request.user!.userId) as any;

    if (!isMember || isMember.role !== 'rep') {
      return reply.status(403).send({ error: 'Only class reps can edit the timetable' });
    }

    db.prepare('DELETE FROM timetable WHERE id = ?').run(Number(id));
    return { success: true };
  });
}
