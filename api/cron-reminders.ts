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
    const currentMonth = today.slice(0, 7);
    const soonThreshold = addDays(today, 3);
    const linkedUsers = await db.collection('telegramUsers').get();

    let sentCount = 0;

    for (const doc of linkedUsers.docs) {
      const chatId = doc.id;
      const uid = doc.data().uid as string;
      if (!uid) continue;

      const userRef = db.collection('users').doc(uid);
      const [userSnap, loansSnap, recurringSnap, budgetsSnap, monthExpensesSnap] = await Promise.all([
        userRef.get(),
        userRef.collection('loans').get(),
        userRef.collection('recurring').get(),
        userRef.collection('budgets').get(),
        userRef.collection('expenses').where('date', '>=', `${currentMonth}-01`).get(),
      ]);

      const currency = (userSnap.data()?.currency as string) || 'MMK';
      const dueLoans: string[] = [];
      const dueRecurring: string[] = [];
      const overBudgets: string[] = [];

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

      recurringSnap.forEach((recDoc) => {
        const rec = recDoc.data();
        if (!rec.isActive || !rec.nextDueDate) return;
        if (rec.nextDueDate <= soonThreshold) {
          const typeLabel = rec.type === 'income' ? 'ဝင်ငွေ' : 'ထွက်ငွေ';
          const statusTag = rec.nextDueDate < today ? '⚠️ ရက်ကျော်' : '⏰ နီးကပ်';
          dueRecurring.push(
            `• ${statusTag} [${typeLabel}] <b>${rec.title}</b> — ${formatMoney(Number(rec.amount) || 0, currency)} (Due: ${rec.nextDueDate})`
          );
        }
      });

      if (!budgetsSnap.empty) {
        const spentByCategory = new Map<string, number>();
        monthExpensesSnap.forEach((expDoc) => {
          const exp = expDoc.data();
          if (typeof exp.date === 'string' && exp.date.startsWith(currentMonth) && typeof exp.category === 'string') {
            spentByCategory.set(exp.category, (spentByCategory.get(exp.category) || 0) + (Number(exp.amount) || 0));
          }
        });

        budgetsSnap.forEach((bDoc) => {
          const b = bDoc.data();
          const category = String(b.category || '');
          const limit = Number(b.monthlyLimit) || 0;
          const spent = spentByCategory.get(category) || 0;
          if (limit > 0 && spent >= limit) {
            const pct = Math.round((spent / limit) * 100);
            overBudgets.push(
              `• 🚨 <b>${category}</b> — ${formatMoney(spent, currency)} / ${formatMoney(limit, currency)} (${pct}%)`
            );
          }
        });
      }

      const sections: string[] = [];
      if (dueLoans.length > 0) {
        sections.push(`<b>💳 ချေးငွေ သတိပေးချက်</b>\n${dueLoans.join('\n')}`);
      }
      if (dueRecurring.length > 0) {
        sections.push(`<b>🔁 ပုံမှန်စာရင်း သတိပေးချက်</b>\n${dueRecurring.join('\n')}`);
      }
      if (overBudgets.length > 0) {
        sections.push(`<b>📊 ဘတ်ဂျက် ကျော်လွန်မှု</b>\n${overBudgets.join('\n')}`);
      }

      if (sections.length > 0) {
        await sendTelegramMessage(
          chatId,
          `<b>🔔 SmartWallet နေ့စဉ်သတိပေးချက်</b>\n\n${sections.join('\n\n')}`
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
