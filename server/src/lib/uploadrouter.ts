import { FastifyInstance } from 'fastify';
import { createUploadthing, createRouteHandler } from 'uploadthing/fastify';
import { verifyToken } from './jwt.js';

export const MAX_DIRECT_FILE_SIZE = 1 * 1024 * 1024 * 1024;

export function registerUploadRouter(app: FastifyInstance) {
  const f = createUploadthing();

  const router = {
    blob: f({ blob: { maxFileSize: '1GB', maxFileCount: 5 } })
      .middleware(async ({ req }) => {
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const user = verifyToken(token);
        if (!user) throw new Error('Unauthorized');
        return { userId: user.userId };
      })
      .onUploadComplete(() => {}),
  };

  createRouteHandler(
    app,
    {
      router,
      config: {
        token: process.env.UPLOADTHING_SECRET,
        logLevel: 'Error',
      },
    },
    () => {}
  );
}
