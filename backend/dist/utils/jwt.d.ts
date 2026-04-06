export interface AccessPayload {
    sub: string;
    email: string;
    jti: string;
    type: 'access';
    /** Impersonated portal user (student); must pair with `impEmail`. */
    imp?: string;
    impEmail?: string;
}
export interface RefreshPayload {
    sub: string;
    jti: string;
    type: 'refresh';
    imp?: string;
    impEmail?: string;
}
export type ImpersonationClaims = {
    userId: string;
    email: string;
};
declare const REFRESH_TTL_SEC: number;
/** Access and refresh share the same `jti` so the server can enforce one session per user (see session:active in Redis). */
export declare function signAccessToken(userId: string, email: string, jti: string, impersonation?: ImpersonationClaims): string;
export declare function signRefreshToken(userId: string, jti: string, impersonation?: ImpersonationClaims): {
    token: string;
    jti: string;
};
export declare function verifyAccessToken(token: string): AccessPayload;
export declare function verifyRefreshToken(token: string): RefreshPayload;
export declare function impersonationFromPayload(payload: AccessPayload | RefreshPayload): ImpersonationClaims | undefined;
export { REFRESH_TTL_SEC };
//# sourceMappingURL=jwt.d.ts.map