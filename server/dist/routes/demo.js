import { resetDatabase } from '../db/reset.js';
export function demoRoutes(app) {
    app.post('/api/demo/reset', async (request, reply) => {
        try {
            await resetDatabase();
            return { success: true, message: 'Database reset to demo state' };
        }
        catch (err) {
            return reply.status(500).send({ error: 'Reset failed', details: err.message });
        }
    });
}
//# sourceMappingURL=demo.js.map