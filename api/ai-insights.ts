import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyRequestUid } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebaseAdmin.js';
import { getYangonDateString } from './_lib/telegram.js';

interface InsightResult {
  month: string;
  language: 'mm' | 'en';
  healthScore: number;
  summary: string;
  warnings: string[];
  tips: string[];
  generatedAt: string;
}

function getPreviousMonthPrefix(currentMonth: string): string {
  const [yearStr, monthStr] = currentMonth.split('-');
  let year = Number(yearStr);
  let month = Number(monthStr) - 1;
  if (month <= 0) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uid = await verifyRequestUid(req);
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const currentMonth = getYangonDateString().slice(0, 7);
    const requestedLang =
      (req.method === 'GET' ? req.query.lang : req.body?.language) === 'en' ? 'en' : 'mm';
    const forceRefresh = req.method === 'POST' && Boolean(req.body?.forceRefresh);

    const cacheRef = userRef.collection('aiInsights').doc(currentMonth);
    const cacheSnap = await cacheRef.get();

    if (cacheSnap.exists && !forceRefresh) {
      const cached = cacheSnap.data() as InsightResult;
      if (cached.language === requestedLang) {
        return res.status(200).json({ insight: cached, cached: true });
      }
    }

    if (req.method === 'GET') {
      return res.status(200).json({ insight: null, cached: false });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const prevMonth = getPreviousMonthPrefix(currentMonth);
    const [userSnap, incomesSnap, expensesSnap, budgetsSnap, loansSnap, goalsSnap] = await Promise.all([
      userRef.get(),
      userRef.collection('incomes').where('date', '>=', `${prevMonth}-01`).get(),
      userRef.collection('expenses').where('date', '>=', `${prevMonth}-01`).get(),
      userRef.collection('budgets').get(),
      userRef.collection('loans').get(),
      userRef.collection('savingsGoals').get(),
    ]);

    const currency = (userSnap.data()?.currency as string) || 'MMK';
    let currentIncome = 0;
    let prevIncome = 0;
    let currentExpense = 0;
    let prevExpense = 0;
    const categoryTotals = new Map<string, number>();

    incomesSnap.forEach((doc) => {
      const d = doc.data();
      const amt = Number(d.amount) || 0;
      if (typeof d.date === 'string') {
        if (d.date.startsWith(currentMonth)) currentIncome += amt;
        else if (d.date.startsWith(prevMonth)) prevIncome += amt;
      }
    });

    expensesSnap.forEach((doc) => {
      const d = doc.data();
      const amt = Number(d.amount) || 0;
      if (typeof d.date === 'string') {
        if (d.date.startsWith(currentMonth)) {
          currentExpense += amt;
          const cat = String(d.category || 'Other');
          categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + amt);
        } else if (d.date.startsWith(prevMonth)) {
          prevExpense += amt;
        }
      }
    });

    const topCategories = [...categoryTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const budgetStatus = budgetsSnap.docs.map((doc) => {
      const b = doc.data();
      const cat = String(b.category || '');
      const limit = Number(b.monthlyLimit) || 0;
      const spent = categoryTotals.get(cat) || 0;
      return {
        category: cat,
        limit,
        spent,
        percentUsed: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      };
    });

    let activeLent = 0;
    let activeBorrowed = 0;
    loansSnap.forEach((doc) => {
      const l = doc.data();
      if (l.status === 'completed') return;
      const rem = Math.max(0, (Number(l.amount) || 0) - (Number(l.paidAmount) || 0));
      if (l.type === 'lent') activeLent += rem;
      else activeBorrowed += rem;
    });

    const goalsSummary = goalsSnap.docs.map((doc) => {
      const g = doc.data();
      return {
        title: String(g.title || ''),
        current: Number(g.currentAmount) || 0,
        target: Number(g.targetAmount) || 0,
      };
    });

    const snapshot = {
      month: currentMonth,
      currency,
      currentMonthIncome: currentIncome,
      currentMonthExpense: currentExpense,
      previousMonthIncome: prevIncome,
      previousMonthExpense: prevExpense,
      topExpenseCategories: topCategories,
      budgets: budgetStatus,
      activeLoans: { toReceive: activeLent, toPay: activeBorrowed },
      savingsGoals: goalsSummary,
    };

    const langInstruction =
      requestedLang === 'mm'
        ? 'Write all text fields (summary, warnings, tips) in natural, polite Burmese (မြန်မာဘာသာ).'
        : 'Write all text fields (summary, warnings, tips) in clear, concise English.';

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a practical personal finance advisor analyzing a user's monthly financial snapshot.
${langInstruction}

Financial Snapshot (${currency}):
${JSON.stringify(snapshot, null, 2)}

Instructions:
- Give a realistic financial healthScore from 0 to 100 based on savings rate, budget adherence, and debt load.
- Keep summary to 1-2 concise sentences.
- Include up to 3 specific warnings (e.g., over-budget categories, spending spike vs last month, or high debt; empty array if none).
- Include 2-3 actionable, concrete tips tailored to the numbers above.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['healthScore', 'summary', 'warnings', 'tips'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(rawText) as {
      healthScore: number;
      summary: string;
      warnings: string[];
      tips: string[];
    };

    const insight: InsightResult = {
      month: currentMonth,
      language: requestedLang,
      healthScore: Math.max(0, Math.min(100, Math.round(parsed.healthScore))),
      summary: parsed.summary,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.slice(0, 3) : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
      generatedAt: new Date().toISOString(),
    };

    await cacheRef.set(insight);

    return res.status(200).json({ insight, cached: false });
  } catch (error) {
    console.error('ai-insights error:', error);
    return res.status(500).json({ error: 'Failed to generate AI insights' });
  }
}
