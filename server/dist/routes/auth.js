import { getDb } from '../db/connection.js';
import { hashPassword, verifyPassword } from '../lib/hash.js';
import { signToken } from '../lib/jwt.js';
import { authMiddleware } from '../middleware/auth.js';
export function authRoutes(app) {
    app.post('/api/auth/register', async (request, reply) => {
        const { name, email, password } = request.body;
        if (!name || !email || !password) {
            return reply.status(400).send({ error: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return reply.status(400).send({ error: 'Password must be at least 6 characters' });
        }
        const db = getDb();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return reply.status(409).send({ error: 'Email already registered' });
        }
        const passwordHash = await hashPassword(password);
        const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email, passwordHash, 'member');
        const userId = result.lastInsertRowid;
        const token = signToken({ userId, email });
        return {
            token,
            user: { id: userId, name, email, role: 'member', avatar: null },
        };
    });
    app.post('/api/auth/login', async (request, reply) => {
        const { email, password } = request.body;
        if (!email || !password) {
            return reply.status(400).send({ error: 'Email and password are required' });
        }
        const db = getDb();
        const user = db.prepare('SELECT id, name, email, password_hash, role, avatar FROM users WHERE email = ?').get(email);
        if (!user) {
            return reply.status(401).send({ error: 'Invalid email or password' });
        }
        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) {
            return reply.status(401).send({ error: 'Invalid email or password' });
        }
        const token = signToken({ userId: user.id, email: user.email });
        return {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        };
    });
    app.get('/api/auth/me', { preHandler: authMiddleware }, async (request) => {
        const db = getDb();
        const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(request.user.userId);
        if (!user) {
            throw { statusCode: 404, message: 'User not found' };
        }
        return { user };
    });
}
//# sourceMappingURL=auth.js.map