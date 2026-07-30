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
import { createTables } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { getDb, UPLOADS_DIR } from './db/connection.js';
import { validateEnv } from './lib/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';

async function main() {
  validateEnv();

  const app = Fastify({ logger: true });

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

  const userResult = await db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userResult.count === 0) {
    console.log('Empty database — seeding demo data...');
    await seedDatabase();
  }

  const oppResult = await db.prepare('SELECT COUNT(*) as count FROM opportunities').get() as any;
  if (oppResult.count === 0) {
    const firstUser = await db.prepare('SELECT id FROM users LIMIT 1').get() as any;
    const firstSpace = await db.prepare('SELECT id FROM spaces LIMIT 1').get() as any;
    if (firstUser && firstSpace) {
      const now = new Date();
      const d = (days: number) => new Date(now.getTime() + days * 86400000).toISOString().split('T')[0];
      const opps = [
        { title: 'MTN Foundation Scholarship 2026', description: 'Full scholarship for Nigerian university students studying STEM courses. Covers tuition, accommodation, and a monthly stipend. Open to 200–400L students with a minimum CGPA of 3.5.', category: 'scholarship', link: 'https://www.mtn.com/foundation', deadline: d(14) },
        { title: 'Shell SIWES Industrial Internship', description: 'Six-month paid SIWES placement at Shell Nigeria for engineering students. Work alongside professionals on real oil & gas projects. Includes mentorship and certificate on completion.', category: 'internship', link: 'https://www.shell.com.ng/careers', deadline: d(7) },
        { title: 'Google AI for Students Workshop', description: 'Free two-day hands-on workshop on machine learning and AI fundamentals. Learn TensorFlow, build your first ML model, and get a Google certificate. Open to all levels.', category: 'bootcamp', link: 'https://events.withgoogle.com', deadline: d(3) },
        { title: 'University Engineering Design Competition', description: 'Annual design challenge for engineering students. Build a working prototype that solves a local infrastructure problem. Winners get ₦500,000 and publication in the engineering journal.', category: 'competition', link: null, deadline: d(21) },
        { title: 'Industrial Training Placement at Dangote', description: 'Structured industrial training (IT) placement at Dangote Group for students in engineering, science, and management. Three to six months duration with stipend and official letter.', category: 'internship', link: 'https://dangote.com/careers', deadline: d(10) },
        { title: 'TechQuest Nigeria 2026 — Hackathon', description: "Nigeria's biggest student hackathon. 48-hour sprint to build a tech solution for education or healthcare. First prize is N1,000,000 and a Silicon Valley trip. Team of 2-4.", category: 'competition', link: null, deadline: d(30) },
        { title: 'NLNG Science & Technology Scholarship', description: 'Nigerian LNG Limited scholarship for final-year science and engineering students. Covers examination fees, project funding, and post-graduation employment consideration.', category: 'scholarship', link: 'https://nlng.com/scholarships', deadline: d(45) },
      ];
      for (const o of opps) {
        await db.prepare(
          'INSERT INTO opportunities (space_id, author_id, title, description, category, link, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(firstSpace.id, firstUser.id, o.title, o.description, o.category, o.link, o.deadline);
      }
      console.log('Demo opportunities seeded.');
    }
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

  await app.listen({ port: PORT, host: HOST });
  console.log(`ClassSpace API running on http://${HOST}:${PORT}`);
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
