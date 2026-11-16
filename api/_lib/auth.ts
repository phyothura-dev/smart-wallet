import type { VercelRequest } from '@vercel/node';
import { getAdminAuth } from './firebaseAdmin.js';

export function extractBearerToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

export async function verifyRequestUid(req: VercelRequest): Promise<string | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}
