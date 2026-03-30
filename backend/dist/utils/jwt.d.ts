export interface AccessPayload {
    sub: string;
    email: string;
    jti: string;
    type: 'access';
}
export interface RefreshPayload {
    sub: string;
    jti: string;
    type: 'refresh';
}
declare const REFRESH_TTL_SEC: number;
/** Access and refresh share the same `jti` so the server can enforce one session per user (see session:active in Redis). */
export declare function signAccessToken(userId: string, email: string, jti: string): string;
export declare function signRefreshToken(userId: string, jti: string): {
    token: string;
    jti: string;
};
export declare function verifyAccessToken(token: string): AccessPayload;
export declare function verifyRefreshToken(token: string): RefreshPayload;
export { REFRESH_TTL_SEC };
//# sourceMappingURL=jwt.d.ts.map