import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'classspace-hackathon-2026';
const JWT_EXPIRES = '7d';
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map