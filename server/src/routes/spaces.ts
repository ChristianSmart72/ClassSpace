import { FastifyInstance } from 'fastify';
import { getDb, isSpaceMember } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { customAlphabet } from 'nanoid';
import { isNonEmptyString, fail } from '../lib/validate.js';
import { SpaceRow, CourseRow, MembershipRow } from '../db/rows.js';

const generateId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);
const generateCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

interface CreateSpaceBody {
  name: string;
  dept: string;
  level: string;
  uni: string;
  slug?: string;
  courses: { name: string; code: string; icon: string; color_index: number }[];
}

function sanitizeSlug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

interface JoinSpaceBody {
  inviteCode: string;
}

export function spaceRoutes(app: FastifyInstance) {
  app.post('/api/spaces', { preHandler: authMiddleware }, async (request, reply) => {
    const { name, dept, level, uni, slug, courses } = request.body as CreateSpaceBody;
    const userId = request.user!.userId;

    if (!isNonEmptyString(name, 120) || !isNonEmptyString(dept, 120) || !isNonEmptyString(level, 40) || !isNonEmptyString(uni, 120)) {
      return fail(reply, 'Space name, department, level, and university are required (max 120 chars each)');
    }

    const db = getDb();
    let spaceId = slug ? sanitizeSlug(slug) : sanitizeSlug(name);

    if (!spaceId || spaceId.length < 3) {
      spaceId = generateId();
    }

    const existing = await db.prepare<{ id: string }>('SELECT id FROM spaces WHERE id = ?').get(spaceId);
    if (existing) {
      return reply.status(409).send({ error: `Slug "${spaceId}" is already taken. Choose another.` });
    }

    const inviteCode = generateCode();
    const courseList = Array.isArray(courses) ? courses : [];

    const stmts: ({ sql: string; args: any[] })[] = [
      {
        sql: 'INSERT INTO spaces (id, name, dept, level, uni, rep_id, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [spaceId, name, dept, level, uni, userId, inviteCode],
      },
      {
        sql: 'INSERT INTO space_members (space_id, user_id, role) VALUES (?, ?, ?)',
        args: [spaceId, userId, 'rep'],
      },
      {
        sql: 'UPDATE users SET role = ? WHERE id = ?',
        args: ['rep', userId],
      },
    ];

    for (const course of courseList) {
      stmts.push({
        sql: 'INSERT INTO courses (space_id, name, code, icon, color_index) VALUES (?, ?, ?, ?, ?)',
        args: [spaceId, course.name, course.code, course.icon || '📚', course.color_index ?? 0],
      });
    }

    await db.batch(stmts);

    const space = await db.prepare<SpaceRow>('SELECT * FROM spaces WHERE id = ?').get(spaceId);
    const spaceCourses = await db.prepare<CourseRow>('SELECT * FROM courses WHERE space_id = ?').all(spaceId);

    const token = request.headers.authorization?.substring(7);
    return { space: { ...space, courses: spaceCourses }, token };
  });

  app.get('/api/spaces/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const db = getDb();

    const space = await db.prepare<SpaceRow>('SELECT * FROM spaces WHERE id = ?').get(id);
    if (!space) {
      return reply.status(404).send({ error: 'Space not found' });
    }

    const membership = await db.prepare<MembershipRow>(
      'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?'
    ).get(id, userId);

    if (!membership) {
      return reply.status(403).send({ error: 'Not a member of this space' });
    }

    const courses = await db.prepare<CourseRow>('SELECT * FROM courses WHERE space_id = ?').all(id);
    const members = await db.prepare<{ id: number; name: string; email: string; role: string; avatar: string | null; member_role: string }>(`
       SELECT u.id, u.name, u.email, u.role, u.avatar, sm.role as member_role
       FROM space_members sm JOIN users u ON sm.user_id = u.id
       WHERE sm.space_id = ?
    `).all(id);

    return {
      space: { ...space, courses },
      members,
      isMember: true,
      memberRole: membership.role,
    };
  });

  app.post('/api/spaces/join', async (request, reply) => {
    const { inviteCode } = request.body as JoinSpaceBody;
    const auth = request.headers.authorization;
    let userId: number | null = null;

    if (auth && auth.startsWith('Bearer ')) {
      const { verifyToken } = await import('../lib/jwt.js');
      const payload = verifyToken(auth.substring(7));
      if (payload) userId = payload.userId;
    }

    if (!inviteCode) {
      return reply.status(400).send({ error: 'Invite code is required' });
    }

    const db = getDb();
    const space = await db.prepare<SpaceRow>('SELECT * FROM spaces WHERE invite_code = ?').get(inviteCode);
    if (!space) {
      return reply.status(404).send({ error: 'Space not found with that invite code' });
    }

    if (userId) {
      const existing = await db.prepare(
        'SELECT id FROM space_members WHERE space_id = ? AND user_id = ?'
      ).get(space.id, userId);
      if (!existing) {
        await db.prepare(
          'INSERT INTO space_members (space_id, user_id, role) VALUES (?, ?, ?)'
        ).run(space.id, userId, 'member');
      }
    }

    const courses = await db.prepare<CourseRow>('SELECT * FROM courses WHERE space_id = ?').all(space.id);
    const rep = await db.prepare<{ name: string }>('SELECT name FROM users WHERE id = ?').get(space.rep_id);

    return { space: { ...space, rep: rep?.name, courses } };
  });

  app.get('/api/spaces/:id/members', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    if (!await isSpaceMember(id, userId)) {
      return reply.status(403).send({ error: 'Not a member of this space' });
    }

    const db = getDb();

    const members = await db.prepare<{ id: number; name: string; email: string; role: string; avatar: string | null; member_role: string; joined_at: string }>(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, sm.role as member_role, sm.joined_at
       FROM space_members sm JOIN users u ON sm.user_id = u.id
       WHERE sm.space_id = ?`
    ).all(id);

    return { members };
  });

  app.get('/api/user/spaces', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const db = getDb();

    const rows = await db.prepare(`
      SELECT s.id, s.name, s.uni, s.dept, s.level, s.invite_code, sm.role as member_role
      FROM space_members sm
      JOIN spaces s ON sm.space_id = s.id
      WHERE sm.user_id = ?
      ORDER BY s.created_at DESC
    `).all(userId) as unknown as { id: string; name: string; uni: string; dept: string; level: string; invite_code: string; member_role: string }[];

    return { spaces: rows };
  });
}
