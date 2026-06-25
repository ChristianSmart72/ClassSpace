import { FastifyInstance } from 'fastify';
import { resetDatabase } from '../db/reset.js';

export function demoRoutes(app: FastifyInstance) {
  app.post('/api/demo/reset', async (request, reply) => {
    try {
      await resetDatabase();
      return { success: true, message: 'Database reset to demo state' };
    } catch (err: any) {
      return reply.status(500).send({ error: 'Reset failed', details: err.message });
    }
  });
}
