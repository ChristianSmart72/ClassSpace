import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import compress from '@fastify/compress';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRoutes } from './routes/auth.js';
import { spaceRoutes } from './routes/spaces.js';
import { announcementRoutes } from './routes/announcements.js';
import { materialRoutes } from './routes/materials.js';
import { shareRoutes } from './routes/share.js';
import { demoRoutes } from './routes/demo.js';
import { reactionRoutes } from './routes/reactions.js';
import { timetableRoutes } from './routes/timetable.js';
import { pollRoutes } from './routes/polls.js';
import { opportunityRoutes } from './routes/opportunities.js';
import { pushRoutes } from './routes/push.js';
import { createTables } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { getDb } from './db/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
  await app.register(compress, { global: true, threshold: 1024 });

  const db = getDb();
  createTables();
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount === 0) {
    console.log('Empty database — seeding demo data...');
    await seedDatabase();
  }

  authRoutes(app);
  spaceRoutes(app);
  announcementRoutes(app);
  materialRoutes(app);
  shareRoutes(app);
  demoRoutes(app);
  reactionRoutes(app);
  timetableRoutes(app);
  pollRoutes(app);
  opportunityRoutes(app);
  pushRoutes(app);

  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  if (IS_PROD) {
    const clientDist = path.join(__dirname, '../../client/dist');
    await app.register(staticFiles, {
      root: clientDist,
      prefix: '/',
      cacheControl: true,
      maxAge: '365d',
      immutable: true,
    });
    app.setNotFoundHandler(async (_request, reply) => {
      return reply.sendFile('index.html');
    });
  }

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`ClassSpace API running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
