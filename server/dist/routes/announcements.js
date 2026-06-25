import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
export function announcementRoutes(app) {
    app.get('/api/spaces/:id/announcements', async (request) => {
        const { id } = request.params;
        const query = request.query;
        const db = getDb();
        let sql = `
      SELECT a.*, u.name as author_name, c.name as course_name, c.code as course_code, c.icon as course_icon
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.space_id = ?
    `;
        const params = [id];
        if (query.filter && query.filter === 'urgent') {
            sql += ' AND a.urgent = 1';
        }
        else if (query.filter && query.filter === 'pinned') {
            sql += ' AND a.pinned = 1';
        }
        else if (query.filter && query.filter !== 'all') {
            sql += ' AND c.code = ?';
            params.push(query.filter);
        }
        sql += ' ORDER BY a.pinned DESC, a.urgent DESC, a.created_at DESC';
        const announcements = db.prepare(sql).all(...params);
        return { announcements };
    });
    app.post('/api/spaces/:id/announcements', { preHandler: authMiddleware }, async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        const userId = request.user.userId;
        if (!body.title || !body.body) {
            return reply.status(400).send({ error: 'Title and body are required' });
        }
        const db = getDb();
        const result = db.prepare(`INSERT INTO announcements (space_id, course_id, title, body, type, author_id, urgent, pinned, deadline, venue, instructions, submission_method, format)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, body.course_id || null, body.title, body.body, body.type || 'announcement', userId, body.urgent ? 1 : 0, body.pinned ? 1 : 0, body.deadline || null, body.venue || null, body.instructions || null, body.submission_method || null, body.format || null);
        const announcement = db.prepare(`
      SELECT a.*, u.name as author_name
      FROM announcements a JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);
        return { announcement };
    });
    app.get('/api/announcements/:id', async (request, reply) => {
        const { id } = request.params;
        const db = getDb();
        const announcement = db.prepare(`
      SELECT a.*, u.name as author_name, c.name as course_name, c.code as course_code, c.icon as course_icon
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `).get(id);
        if (!announcement) {
            return reply.status(404).send({ error: 'Announcement not found' });
        }
        return announcement;
    });
    app.get('/api/announcements/shared/:id', async (request, reply) => {
        const { id } = request.params;
        const db = getDb();
        const announcement = db.prepare(`
      SELECT a.*, u.name as author_name, c.name as course_name, c.code as course_code, c.icon as course_icon,
             s.name as space_name, s.dept, s.level, s.uni, s.id as space_id
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      JOIN spaces s ON a.space_id = s.id
      WHERE a.id = ?
    `).get(id);
        if (!announcement) {
            return reply.status(404).send({ error: 'Announcement not found' });
        }
        return announcement;
    });
}
//# sourceMappingURL=announcements.js.map