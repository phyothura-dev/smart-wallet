import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from './_lib/firebaseAdmin.js';
import { formatMoney, getYangonDateString, sendTelegramMessage } from './_lib/telegram.js';

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = getAdminDb();
    const today = getYangonDateString();
    const soonThreshold = addDays(today, 3);
    const linkedUsers = await db.collection('telegramUsers').get();

    let sentCount = 0;

    for (const doc of linkedUsers.docs) {
      const chatId = doc.id;
      const uid = doc.data().uid as string;
      if (!uid) continue;

      const userRef = db.collection('users').doc(uid);
      const [userSnap, loansSnap] = await Promise.all([
        userRef.get(),
        userRef.collection('loans').get(),
      ]);

      const currency = (userSnap.data()?.currency as string) || 'MMK';
      const dueLoans: string[] = [];

      loansSnap.forEach((loanDoc) => {
        const loan = loanDoc.data();
        if (loan.status === 'completed' || !loan.dueDate) return;
        if (loan.dueDate <= soonThreshold) {
          const remaining = Math.max(0, (Number(loan.amount) || 0) - (Number(loan.paidAmount) || 0));
          const typeLabel = loan.type === 'lent' ? 'ရရန်ရှိ' : 'ပေးရန်ရှိ';
          const statusTag = loan.dueDate < today ? '⚠️ ရက်ကျော်' : '⏰ နီးကပ်';
          dueLoans.push(
            `• ${statusTag} [${typeLabel}] <b>${loan.personName}</b> — ${formatMoney(remaining, currency)} (Due: ${loan.dueDate})`
          );
        }
      });

      if (dueLoans.length > 0) {
        await sendTelegramMessage(
          chatId,
          `<b>🔔 SmartWallet ချေးငွေ သတိပေးချက်</b>\n\n${dueLoans.join('\n')}`
        );
        sentCount += 1;
      }
    }

    return res.status(200).json({ ok: true, remindersSent: sentCount });
  } catch (error) {
    console.error('cron-reminders error:', error);
    return res.status(500).json({ error: 'Cron failed' });
  }
}
