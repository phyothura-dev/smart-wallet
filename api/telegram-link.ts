import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from './_lib/firebaseAdmin.js';

function normalizeBotUsername(raw?: string): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^@+/, '')
    .split('?')[0]
    .replace(/\/+$/, '')
    .trim();
  return cleaned || null;
}

function extractBearerToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization Bearer token' });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);

    if (req.method === 'GET') {
      const userSnap = await userRef.get();
      const data = userSnap.data();
      return res.status(200).json({
        linked: Boolean(data?.telegramChatId),
        telegramUsername: data?.telegramUsername || null,
        botUsername: normalizeBotUsername(process.env.TELEGRAM_BOT_USERNAME),
      });
    }

    if (req.method === 'DELETE') {
      const userSnap = await userRef.get();
      const chatId = userSnap.data()?.telegramChatId;
      if (chatId) {
        await db.collection('telegramUsers').doc(String(chatId)).delete();
      }
      await userRef.set(
        {
          telegramChatId: FieldValue.delete(),
          telegramUsername: FieldValue.delete(),
        },
        { merge: true }
      );
      return res.status(200).json({ linked: false });
    }

    // POST: Generate a short-lived 6-character code for Telegram /start <CODE> or /link <CODE>
    const code = randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await db.collection('telegramLinkCodes').doc(code).set({
      uid,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    const botUsername = normalizeBotUsername(process.env.TELEGRAM_BOT_USERNAME);
    const deepLink = botUsername ? `https://t.me/${botUsername}?start=${code}` : null;

    return res.status(200).json({
      code,
      expiresAt,
      botUsername,
      deepLink,
    });
  } catch (error) {
    console.error('telegram-link error:', error);
    return res.status(401).json({ error: 'Invalid token or server error' });
  }
}
