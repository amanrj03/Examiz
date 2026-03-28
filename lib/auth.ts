import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export type JWTPayload =
  | { role: 'org'; id: string; email: string; name: string }
  | { role: 'student'; id: string; username: string; name: string; classId: string; organizationId: string };

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): JWTPayload | null {
  const cookie = req.cookies.get('auth_token')?.value;
  if (cookie) return verifyToken(cookie);
  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return verifyToken(header.slice(7));
  return null;
}
