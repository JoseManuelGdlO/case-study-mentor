/**
 * Access tokens carry `jti` (shared with the refresh token); the API checks it against Redis `session:active:${userId}`.
 * Deploy: tokens issued before that field existed are rejected; affected users must sign in again.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

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

export type ImpersonationClaims = { userId: string; email: string };

function normalizeImpersonation(
  imp: string | undefined,
  impEmail: string | undefined
): ImpersonationClaims | undefined {
  const hasImp = typeof imp === 'string' && imp.length > 0;
  const hasEmail = typeof impEmail === 'string' && impEmail.length > 0;
  if (hasImp !== hasEmail) throw new Error('Invalid impersonation claims');
  if (hasImp && hasEmail) return { userId: imp!, email: impEmail! };
  return undefined;
}

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

/** Access and refresh share the same `jti` so the server can enforce one session per user (see session:active in Redis). */
export function signAccessToken(
  userId: string,
  email: string,
  jti: string,
  impersonation?: ImpersonationClaims
): string {
  const payload: AccessPayload = {
    sub: userId,
    email,
    jti,
    type: 'access',
    ...(impersonation ? { imp: impersonation.userId, impEmail: impersonation.email } : {}),
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(
  userId: string,
  jti: string,
  impersonation?: ImpersonationClaims
): { token: string; jti: string } {
  const payload: RefreshPayload = {
    sub: userId,
    jti,
    type: 'refresh',
    ...(impersonation ? { imp: impersonation.userId, impEmail: impersonation.email } : {}),
  };
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  if (typeof decoded.jti !== 'string' || !decoded.jti) throw new Error('Invalid token');
  normalizeImpersonation(decoded.imp, decoded.impEmail);
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  normalizeImpersonation(decoded.imp, decoded.impEmail);
  return decoded;
}

export function impersonationFromPayload(payload: AccessPayload | RefreshPayload): ImpersonationClaims | undefined {
  return normalizeImpersonation(payload.imp, payload.impEmail);
}

export { REFRESH_TTL_SEC };
