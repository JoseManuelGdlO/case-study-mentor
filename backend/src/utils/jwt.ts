import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';

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

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

export function signAccessToken(userId: string, email: string): string {
  const payload: AccessPayload = { sub: userId, email, type: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(userId: string): { token: string; jti: string } {
  const jti = randomUUID();
  const payload: RefreshPayload = { sub: userId, jti, type: 'refresh' };
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return decoded;
}

export { REFRESH_TTL_SEC };
