import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { customAlphabet } from 'nanoid';
const generateId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);
const generateCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
export function spaceRoutes(app) {
    app.post('/api/spaces', { preHandler: authMiddleware }, async (request, reply) => {
        const { name, dept, level, uni, courses } = request.body;
        const userId = request.user.userId;
        if (!name || !dept || !level || !uni) {
            return reply.status(400).send({ error: 'All space fields are required' });
        }
        const db = getDb();
        const spaceId = generateId();
        const inviteCode = generateCode();
        const tx = db.transaction(() => {
            db.prepare('INSERT INTO spaces (id, name, dept, level, uni, rep_id, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)').run(spaceId, name, dept, level, uni, userId, inviteCode);
            db.prepare('INSERT INTO space_members (space_id, user_id, role) VALUES (?, ?, ?)').run(spaceId, userId, 'rep');
            db.prepare('UPDATE users SET role = ? WHERE id = ?').run('rep', userId);
            for (const course of courses) {
                db.prepare('INSERT INTO courses (space_id, name, code, icon, color_index) VALUES (?, ?, ?, ?, ?)').run(spaceId, course.name, course.code, course.icon || '📚', course.color_index ?? 0);
            }
        });
        tx();
        const space = db.prepare('SELECT * FROM spaces WHERE id = ?').get(spaceId);
        const spaceCourses = db.prepare('SELECT * FROM courses WHERE space_id = ?').all(spaceId);
        const token = request.headers.authorization?.substring(7);
        return { space: { ...space, courses: spaceCourses }, token };
    });
    app.get('/api/spaces/:id', { preHandler: authMiddleware }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.user.userId;
        const db = getDb();
        const space = db.prepare('SELECT * FROM spaces WHERE id = ?').get(id);
        if (!space) {
            return reply.status(404).send({ error: 'Space not found' });
        }
        const courses = db.prepare('SELECT * FROM courses WHERE space_id = ?').all(id);
        const members = db.prepare(`SELECT u.id, u.name, u.email, u.role, u.avatar, sm.role as member_role
       FROM space_members sm JOIN users u ON sm.user_id = u.id
       WHERE sm.space_id = ?`).all(id);
        const membership = db.prepare('SELECT role FROM space_members WHERE space_id = ? AND user_id = ?').get(id, userId);
        return {
            space: { ...space, courses },
            members,
            isMember: !!membership,
            memberRole: membership?.role || null,
        };
    });
    app.post('/api/spaces/join', async (request, reply) => {
        const { inviteCode } = request.body;
        const auth = request.headers.authorization;
        let userId = null;
        if (auth && auth.startsWith('Bearer ')) {
            const { verifyToken } = await import('../lib/jwt.js');
            const payload = verifyToken(auth.substring(7));
            if (payload)
                userId = payload.userId;
        }
        if (!inviteCode) {
            return reply.status(400).send({ error: 'Invite code is required' });
        }
        const db = getDb();
        const space = db.prepare('SELECT * FROM spaces WHERE invite_code = ?').get(inviteCode);
        if (!space) {
            return reply.status(404).send({ error: 'Space not found with that invite code' });
        }
        if (userId) {
            const existing = db.prepare('SELECT id FROM space_members WHERE space_id = ? AND user_id = ?').get(space.id, userId);
            if (!existing) {
                db.prepare('INSERT INTO space_members (space_id, user_id, role) VALUES (?, ?, ?)').run(space.id, userId, 'member');
            }
        }
        const courses = db.prepare('SELECT * FROM courses WHERE space_id = ?').all(space.id);
        const rep = db.prepare('SELECT name FROM users WHERE id = ?').get(space.rep_id);
        return { space: { ...space, rep: rep?.name, courses } };
    });
    app.get('/api/spaces/:id/members', { preHandler: authMiddleware }, async (request) => {
        const { id } = request.params;
        const db = getDb();
        const members = db.prepare(`SELECT u.id, u.name, u.email, u.role, u.avatar, sm.role as member_role, sm.joined_at
       FROM space_members sm JOIN users u ON sm.user_id = u.id
       WHERE sm.space_id = ?`).all(id);
        return { members };
    });
}
//# sourceMappingURL=spaces.js.map