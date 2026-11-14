import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from './_lib/firebaseAdmin.js';
import {
  formatMoney,
  getYangonDateString,
  parseQuickTransaction,
  sendTelegramMessage,
  type CategoryHint,
} from './_lib/telegram.js';

interface TelegramUpdate {
  message?: {
    message_id: number;
    text?: string;
    chat: {
      id: number;
      type: string;
    };
    from?: {
      id: number;
      username?: string;
      first_name?: string;
    };
  };
}

const HELP_TEXT = [
  '<b>SmartWallet Bot Commands</b>',
  '',
  '• <code>/link CODE</code> — SmartWallet account ချိတ်ဆက်ရန်',
  '• <code>/balance</code> — Wallet လက်ကျန်ငွေများ ကြည့်ရန်',
  '• <code>/summary</code> — ဒီလ ဝင်ငွေ/အသုံးစရိတ် အနှစ်ချုပ်',
  '• <code>/expense 5000 Coffee</code> — အသုံးစရိတ် ထည့်ရန်',
  '• <code>/income 300000 Salary</code> — ဝင်ငွေ ထည့်ရန်',
  '• <code>/unlink</code> — Account ချိတ်ဆက်မှု ဖြုတ်ရန်',
  '',
  '<i>Tip:</i> <code>-5000 Coffee</code>, <code>+100000 Bonus</code> (သို့) <code>ကော်ဖီ ၃၅၀၀</code> လို စာသားပို့ပြီးလည်း တိုက်ရိုက်မှတ်နိုင်ပါတယ်။',
].join('\n');

async function handleLinkCode(
  chatId: number,
  username: string | undefined,
  code: string
): Promise<void> {
  const db = getAdminDb();
  const normalizedCode = code.trim().toUpperCase();
  const codeRef = db.collection('telegramLinkCodes').doc(normalizedCode);
  const codeSnap = await codeRef.get();

  if (!codeSnap.exists) {
    await sendTelegramMessage(
      chatId,
      '❌ Link code မမှန်ကန်ပါ (သို့) သက်တမ်းကုန်သွားပါပြီ။ SmartWallet App ထဲမှ code အသစ်ပြန်ထုတ်ပေးပါ။'
    );
    return;
  }

  const { uid, expiresAt } = codeSnap.data() as { uid: string; expiresAt: number };
  if (Date.now() > expiresAt) {
    await codeRef.delete();
    await sendTelegramMessage(
      chatId,
      '⏰ Link code သက်တမ်းကုန်သွားပါပြီ။ SmartWallet App ထဲမှ code အသစ်ပြန်ထုတ်ပေးပါ။'
    );
    return;
  }

  const batch = db.batch();
  batch.set(db.collection('telegramUsers').doc(String(chatId)), {
    uid,
    username: username || null,
    linkedAt: new Date().toISOString(),
  });
  batch.set(
    db.collection('users').doc(uid),
    {
      telegramChatId: String(chatId),
      telegramUsername: username || null,
    },
    { merge: true }
  );
  batch.delete(codeRef);
  await batch.commit();

  await sendTelegramMessage(
    chatId,
    '✅ SmartWallet account နဲ့ ချိတ်ဆက်ပြီးပါပြီ!\n\n' + HELP_TEXT
  );
}

async function getLinkedUid(chatId: number): Promise<string | null> {
  const db = getAdminDb();
  const snap = await db.collection('telegramUsers').doc(String(chatId)).get();
  if (!snap.exists) return null;
  return (snap.data()?.uid as string) || null;
}

async function handleBalance(chatId: number, uid: string): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(uid);
  const [userSnap, walletsSnap, incomesSnap, expensesSnap, transfersSnap] = await Promise.all([
    userRef.get(),
    userRef.collection('wallets').get(),
    userRef.collection('incomes').get(),
    userRef.collection('expenses').get(),
    userRef.collection('transfers').get(),
  ]);

  const currency = (userSnap.data()?.currency as string) || 'MMK';
  const balances = new Map<string, number>();

  walletsSnap.forEach((doc) => {
    const w = doc.data();
    balances.set(doc.id, Number(w.initialBalance) || 0);
  });

  incomesSnap.forEach((doc) => {
    const item = doc.data();
    if (item.walletId && balances.has(item.walletId)) {
      balances.set(item.walletId, (balances.get(item.walletId) || 0) + (Number(item.amount) || 0));
    }
  });

  expensesSnap.forEach((doc) => {
    const item = doc.data();
    if (item.walletId && balances.has(item.walletId)) {
      balances.set(item.walletId, (balances.get(item.walletId) || 0) - (Number(item.amount) || 0));
    }
  });

  transfersSnap.forEach((doc) => {
    const t = doc.data();
    const amt = Number(t.amount) || 0;
    if (t.fromWalletId && balances.has(t.fromWalletId)) {
      balances.set(t.fromWalletId, (balances.get(t.fromWalletId) || 0) - amt);
    }
    if (t.toWalletId && balances.has(t.toWalletId)) {
      balances.set(t.toWalletId, (balances.get(t.toWalletId) || 0) + amt);
    }
  });

  if (walletsSnap.empty) {
    await sendTelegramMessage(chatId, '💳 Wallet မရှိသေးပါ။ App ထဲတွင် Wallet အရင်ဖန်တီးပါ။');
    return;
  }

  let total = 0;
  const lines: string[] = ['<b>💳 Wallet Balances</b>', ''];
  walletsSnap.forEach((doc) => {
    const w = doc.data();
    const bal = balances.get(doc.id) || 0;
    total += bal;
    const label = (w.name as string) || (w.type as string) || 'Wallet';
    lines.push(`• <b>${label}:</b> ${formatMoney(bal, currency)}`);
  });
  lines.push('', `<b>စုစုပေါင်း:</b> ${formatMoney(total, currency)}`);

  await sendTelegramMessage(chatId, lines.join('\n'));
}

async function handleSummary(chatId: number, uid: string): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(uid);
  const currentMonth = getYangonDateString().slice(0, 7); // YYYY-MM

  const [userSnap, incomesSnap, expensesSnap, loansSnap] = await Promise.all([
    userRef.get(),
    userRef.collection('incomes').where('date', '>=', `${currentMonth}-01`).get(),
    userRef.collection('expenses').where('date', '>=', `${currentMonth}-01`).get(),
    userRef.collection('loans').get(),
  ]);

  const currency = (userSnap.data()?.currency as string) || 'MMK';
  let totalIncome = 0;
  let totalExpense = 0;

  incomesSnap.forEach((doc) => {
    const d = doc.data();
    if (typeof d.date === 'string' && d.date.startsWith(currentMonth)) {
      totalIncome += Number(d.amount) || 0;
    }
  });

  expensesSnap.forEach((doc) => {
    const d = doc.data();
    if (typeof d.date === 'string' && d.date.startsWith(currentMonth)) {
      totalExpense += Number(d.amount) || 0;
    }
  });

  let activeLoans = 0;
  loansSnap.forEach((doc) => {
    if (doc.data().status !== 'completed') activeLoans += 1;
  });

  const net = totalIncome - totalExpense;
  const text = [
    `<b>📊 ${currentMonth} လစဉ်အနှစ်ချုပ်</b>`,
    '',
    `• ဝင်ငွေ: +${formatMoney(totalIncome, currency)}`,
    `• အသုံးစရိတ်: -${formatMoney(totalExpense, currency)}`,
    `• လက်ကျန်: <b>${formatMoney(net, currency)}</b>`,
    `• မကြေသေးသော ချေးငွေ: ${activeLoans} ခု`,
  ].join('\n');

  await sendTelegramMessage(chatId, text);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (incomingSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized webhook request' });
    }
  }

  try {
    const update = req.body as TelegramUpdate;
    const message = update?.message;
    const text = message?.text?.trim();
    const chatId = message?.chat?.id;

    if (!chatId || !text) {
      return res.status(200).json({ ok: true });
    }

    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        '👋 <b>SmartWallet Bot</b> မှ ကြိုဆိုပါတယ်!\n\nApp ထဲမှ Profile → Telegram Link code ကိုယူပြီး <code>/link CODE</code> ဖြင့် ချိတ်ဆက်နိုင်ပါတယ်။\n\n' +
          HELP_TEXT
      );
      return res.status(200).json({ ok: true });
    }

    if (text.startsWith('/start ') || text.startsWith('/link ')) {
      const code = text.split(/\s+/)[1] || '';
      await handleLinkCode(chatId, message.from?.username, code);
      return res.status(200).json({ ok: true });
    }

    if (text === '/help') {
      await sendTelegramMessage(chatId, HELP_TEXT);
      return res.status(200).json({ ok: true });
    }

    const uid = await getLinkedUid(chatId);
    if (!uid) {
      await sendTelegramMessage(
        chatId,
        '🔗 Account မချိတ်ဆက်ရသေးပါ။ SmartWallet App မှ code ယူပြီး <code>/link CODE</code> ဖြင့် ချိတ်ဆက်ပါ။'
      );
      return res.status(200).json({ ok: true });
    }

    if (text === '/unlink') {
      const db = getAdminDb();
      await Promise.all([
        db.collection('telegramUsers').doc(String(chatId)).delete(),
        db
          .collection('users')
          .doc(uid)
          .set(
            {
              telegramChatId: FieldValue.delete(),
              telegramUsername: FieldValue.delete(),
            },
            { merge: true }
          ),
      ]);
      await sendTelegramMessage(chatId, '🔓 SmartWallet account ချိတ်ဆက်မှု ဖြုတ်ပြီးပါပြီ။');
      return res.status(200).json({ ok: true });
    }

    if (text === '/balance') {
      await handleBalance(chatId, uid);
      return res.status(200).json({ ok: true });
    }

    if (text === '/summary') {
      await handleSummary(chatId, uid);
      return res.status(200).json({ ok: true });
    }

    // Parse transaction (/expense, /income, -5000 Coffee, or natural language)
    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const [userSnap, catsSnap, walletsSnap] = await Promise.all([
      userRef.get(),
      userRef.collection('categories').get(),
      userRef.collection('wallets').limit(1).get(),
    ]);

    const categories: CategoryHint[] = catsSnap.docs.map((d) => ({
      name: String(d.data().name || ''),
      type: d.data().type === 'income' ? 'income' : 'expense',
    }));

    const parsed = await parseQuickTransaction(text, categories);
    if (!parsed) {
      await sendTelegramMessage(
        chatId,
        '🤔 စာသားကို နားမလည်လိုက်ပါ။ ဥပမာ- <code>/expense 5000 Coffee</code> (သို့) <code>-5000 Coffee</code> လို့ ရိုက်ထည့်ကြည့်ပါ။'
      );
      return res.status(200).json({ ok: true });
    }

    const currency = (userSnap.data()?.currency as string) || 'MMK';
    const defaultWalletId = walletsSnap.empty ? undefined : walletsSnap.docs[0].id;
    const dateStr = getYangonDateString();
    const collectionName = parsed.type === 'income' ? 'incomes' : 'expenses';

    await userRef.collection(collectionName).add({
      title: parsed.title,
      amount: parsed.amount,
      category: parsed.category,
      date: dateStr,
      ...(defaultWalletId ? { walletId: defaultWalletId } : {}),
      note: parsed.note ? `${parsed.note} (via Telegram)` : 'via Telegram',
      createdAt: new Date().toISOString(),
    });

    const icon = parsed.type === 'income' ? '🟢 ဝင်ငွေ' : '🔴 အသုံးစရိတ်';
    await sendTelegramMessage(
      chatId,
      `${icon} မှတ်တမ်းတင်ပြီးပါပြီ!\n• <b>ခေါင်းစဉ်:</b> ${parsed.title}\n• <b>ပမာဏ:</b> ${formatMoney(parsed.amount, currency)}\n• <b>Category:</b> ${parsed.category}\n• <b>ရက်စွဲ:</b> ${dateStr}`
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('telegram-webhook error:', error);
    return res.status(200).json({ ok: true });
  }
}
