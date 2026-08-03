import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { hashPassword, verifyPassword } from '../lib/hash.js';
import { signToken } from '../lib/jwt.js';
import { authMiddleware } from '../middleware/auth.js';
import { isValidEmail, isNonEmptyString, fail } from '../lib/validate.js';
import { MembershipRow, SpaceRow, UserRow } from '../db/rows.js';

async function getUserSpace(userId: number) {
  const db = getDb();
  const member = await db.prepare<MembershipRow & { space_id: string }>(
    'SELECT sm.space_id, sm.role FROM space_members sm WHERE sm.user_id = ? LIMIT 1'
  ).get(userId);
  if (!member) return null;
  const space = await db.prepare<SpaceRow>('SELECT * FROM spaces WHERE id = ?').get(member.space_id);
  if (!space) return null;
  const courses = await db.prepare('SELECT * FROM courses WHERE space_id = ? ORDER BY id').all(member.space_id);
  return { ...space, courses, memberRole: member.role };
}

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>('/api/auth/register', async (request, reply) => {
    const { name, email, password } = request.body;

    if (!isNonEmptyString(name, 60)) {
      return fail(reply, 'Name is required (max 60 characters)');
    }
    if (!isValidEmail(email)) {
      return fail(reply, 'A valid email address is required');
    }
    if (typeof password !== 'string' || password.length < 6) {
      return fail(reply, 'Password must be at least 6 characters');
    }
    if (password.length > 128) {
      return fail(reply, 'Password is too long (max 128 characters)');
    }

    const db = getDb();
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const result = await db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, passwordHash, 'member');

    const userId = result.lastInsertRowid;
    const token = signToken({ userId, email });

    return {
      token,
      user: { id: userId, name, email, role: 'member', avatar: null },
    };
  });

  app.post<{ Body: LoginBody }>('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!isValidEmail(email) || typeof password !== 'string' || !password) {
      return fail(reply, 'A valid email and password are required');
    }

    const db = getDb();
    const user = await db.prepare<UserRow>(
      'SELECT id, name, email, password_hash, role, avatar FROM users WHERE email = ?'
    ).get(email);

    if (!user) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, user.password_hash ?? '');
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = signToken({ userId: user.id, email: user.email });
    const space = await getUserSpace(user.id);

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      ...(space ? { space } : {}),
    };
  });

  app.get('/api/auth/me', { preHandler: authMiddleware }, async (request) => {
    const db = getDb();
    const user = await db.prepare<UserRow>(
      'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?'
    ).get(request.user!.userId);

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const space = await getUserSpace(user.id);

    return { user, ...(space ? { space } : {}) };
  });
}
