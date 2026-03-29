export interface AccessPayload {
    sub: string;
    email: string;
    type: 'access';
}
export interface RefreshPayload {
    sub: string;
    jti: string;
    type: 'refresh';
}
declare const REFRESH_TTL_SEC: number;
export declare function signAccessToken(userId: string, email: string): string;
export declare function signRefreshToken(userId: string): {
    token: string;
    jti: string;
};
export declare function verifyAccessToken(token: string): AccessPayload;
export declare function verifyRefreshToken(token: string): RefreshPayload;
export { REFRESH_TTL_SEC };
//# sourceMappingURL=jwt.d.ts.map