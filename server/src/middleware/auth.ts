import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JwtPayload } from '../lib/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  request.user = payload;
}
