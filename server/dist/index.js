import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { authRoutes } from './routes/auth.js';
import { spaceRoutes } from './routes/spaces.js';
import { announcementRoutes } from './routes/announcements.js';
import { materialRoutes } from './routes/materials.js';
import { shareRoutes } from './routes/share.js';
import { demoRoutes } from './routes/demo.js';
import { createTables } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { getDb } from './db/connection.js';
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
async function main() {
    const app = Fastify({ logger: true });
    await app.register(cors, { origin: true });
    await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
    // Init DB
    const db = getDb();
    createTables();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        console.log('Empty database — seeding demo data...');
        await seedDatabase();
    }
    // Routes
    authRoutes(app);
    spaceRoutes(app);
    announcementRoutes(app);
    materialRoutes(app);
    shareRoutes(app);
    demoRoutes(app);
    // Health check
    app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
    try {
        await app.listen({ port: PORT, host: HOST });
        console.log(`ClassSpace API running on http://${HOST}:${PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map