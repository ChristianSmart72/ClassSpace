import { FastifyInstance } from 'fastify';
import { getDb } from '../db/connection.js';
import { createTables, DROP_TABLES } from '../db/schema.js';
import { seedDatabase } from '../db/seed.js';
import bcrypt from 'bcryptjs';

const FALLBACK_HASH = '$2a$10$8pv6iJktAiBjXLxpOpBzVOWHCPk5lnMpw.EveJ1eIWg2bt4T/6qpa';

export function resetRoutes(app: FastifyInstance) {
  app.post('/api/db/reset', async (request, reply) => {
    const { token } = request.body as { token?: string };
    const hash = process.env.DB_RESET_TOKEN_HASH || FALLBACK_HASH;

    if (!token) {
      return reply.status(400).send({ error: 'Reset token is required' });
    }

    const valid = await bcrypt.compare(token, hash);
    if (!valid) {
      return reply.status(403).send({ error: 'Invalid reset token' });
    }

    try {
      const db = getDb();
      await db.batch(DROP_TABLES);
      await createTables();
      await seedDatabase();
      return { success: true, message: 'Database reset and re-seeded successfully' };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Reset failed: ' + err.message });
    }
  });
}
