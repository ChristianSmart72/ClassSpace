import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import compress from '@fastify/compress';
import path from 'path';
import fs from 'fs';
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
import { resetRoutes } from './routes/reset.js';
import { resetPageRoute } from './routes/reset-page.js';
import { createTables } from './db/schema.js';
import { getDb, UPLOADS_DIR } from './db/connection.js';
import { validateEnv } from './lib/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';

async function main() {
  validateEnv();

  const app = Fastify({ logger: true, bodyLimit: 50 * 1024 * 1024 });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(cors, {
    origin: IS_PROD
      ? [/\.onrender\.com$/, 'https://classspace.app']
      : true,
    credentials: true,
  });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
  await app.register(compress, { global: true, threshold: 1024 });

  app.setErrorHandler(async (error, request, reply) => {
    const err = error as any;
    const statusCode = err.statusCode || err.status || 500;
    const message = IS_PROD && statusCode >= 500
      ? 'Internal server error'
      : err.message || 'Unknown error';
    if (statusCode >= 500) {
      request.log.error(err);
    }
    return reply.status(statusCode).send({
      error: message,
      ...(IS_PROD ? {} : { stack: err.stack }),
    });
  });

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  await app.register(staticFiles, {
    root: UPLOADS_DIR,
    prefix: '/api/uploads/',
    decorateReply: false,
  });

  const db = getDb();
  await createTables();

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
  resetRoutes(app);
  resetPageRoute(app);

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

  await app.listen({ port: PORT, host: HOST });
  console.log(`ClassSpace API running on http://${HOST}:${PORT}`);
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
