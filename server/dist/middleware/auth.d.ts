import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../lib/jwt.js';
declare module 'fastify' {
    interface FastifyRequest {
        user?: JwtPayload;
    }
}
export declare function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
//# sourceMappingURL=auth.d.ts.map