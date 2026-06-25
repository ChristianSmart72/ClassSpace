import { verifyToken } from '../lib/jwt.js';
export async function authMiddleware(request, reply) {
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
//# sourceMappingURL=auth.js.map