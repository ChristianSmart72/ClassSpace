export interface JwtPayload {
    userId: number;
    email: string;
}
export declare function signToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload | null;
//# sourceMappingURL=jwt.d.ts.map