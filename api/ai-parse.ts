import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRequestUid } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebaseAdmin.js';
import { parseQuickTransaction, type CategoryHint } from './_lib/telegram.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uid = await verifyRequestUid(req);
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
      return res.status(400).json({ error: 'Missing text input' });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const [catsSnap, walletsSnap] = await Promise.all([
      userRef.collection('categories').get(),
      userRef.collection('wallets').get(),
    ]);

    const categories: CategoryHint[] = catsSnap.docs.map((d) => ({
      name: String(d.data().name || ''),
      type: d.data().type === 'income' ? 'income' : 'expense',
    }));

    const parsed = await parseQuickTransaction(text, categories);
    if (!parsed) {
      return res.status(422).json({
        error: 'Could not parse transaction from input',
      });
    }

    // Match wallet name if mentioned in text, otherwise default to first wallet
    const lowerText = text.toLowerCase();
    let matchedWalletId: string | undefined = walletsSnap.empty ? undefined : walletsSnap.docs[0].id;
    for (const wDoc of walletsSnap.docs) {
      const wData = wDoc.data();
      const wName = String(wData.name || '').toLowerCase();
      const wType = String(wData.type || '').replace(/_/g, ' ').toLowerCase();
      if ((wName && lowerText.includes(wName)) || (wType && lowerText.includes(wType))) {
        matchedWalletId = wDoc.id;
        break;
      }
    }

    return res.status(200).json({
      ...parsed,
      walletId: matchedWalletId,
    });
  } catch (error) {
    console.error('ai-parse error:', error);
    return res.status(500).json({ error: 'Failed to parse transaction' });
  }
}
