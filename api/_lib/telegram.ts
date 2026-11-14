import { GoogleGenAI, Type } from '@google/genai';

export interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  title: string;
  category: string;
  note?: string;
}

export interface CategoryHint {
  name: string;
  type: 'income' | 'expense';
}

export function getYangonDateString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yangon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function formatMoney(amount: number, currency = 'MMK'): string {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured.');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Telegram sendMessage failed:', response.status, body);
  }
}

function normalizeMyanmarDigits(input: string): string {
  const myanmarDigits = '၀၁၂၃၄၅၆၇၈၉';
  return input.replace(/[၀-၉]/g, (d) => String(myanmarDigits.indexOf(d)));
}

function parseByCommandOrRegex(
  rawText: string,
  categories: CategoryHint[]
): ParsedTransaction | null {
  const text = normalizeMyanmarDigits(rawText).trim();

  let forcedType: 'income' | 'expense' | null = null;
  let body = text;

  const cmdMatch = text.match(/^\/(expense|income|in|out)\s+(.+)$/i);
  if (cmdMatch) {
    const cmd = cmdMatch[1].toLowerCase();
    forcedType = cmd === 'income' || cmd === 'in' ? 'income' : 'expense';
    body = cmdMatch[2].trim();
  } else if (text.startsWith('+')) {
    forcedType = 'income';
    body = text.slice(1).trim();
  } else if (text.startsWith('-')) {
    forcedType = 'expense';
    body = text.slice(1).trim();
  }

  // Match patterns like "5000 Coffee", "5,000 Coffee", or "Coffee 5000"
  const amountFirst = body.match(/^(\d[\d,]*(?:\.\d+)?)\s+(.+)$/);
  const amountLast = body.match(/^(.+?)\s+(\d[\d,]*(?:\.\d+)?)$/);

  let amountStr: string | null = null;
  let title: string | null = null;

  if (amountFirst) {
    amountStr = amountFirst[1];
    title = amountFirst[2];
  } else if (amountLast && forcedType) {
    title = amountLast[1];
    amountStr = amountLast[2];
  }

  if (!amountStr || !title) {
    return null;
  }

  const amount = Number(amountStr.replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const type = forcedType ?? 'expense';
  const defaultCategory =
    categories.find((c) => c.type === type)?.name ||
    (type === 'income' ? 'အခြားဝင်ငွေ' : 'အထွေထွေ');

  return {
    type,
    amount,
    title: title.trim(),
    category: defaultCategory,
  };
}

async function parseWithGemini(
  rawText: string,
  categories: CategoryHint[]
): Promise<ParsedTransaction | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const incomeCats = categories.filter((c) => c.type === 'income').map((c) => c.name);
  const expenseCats = categories.filter((c) => c.type === 'expense').map((c) => c.name);

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Extract a single personal finance transaction from this message (which may be in Burmese or English):
"${rawText}"

Available income categories: ${incomeCats.join(', ') || 'Salary, Bonus, Other'}
Available expense categories: ${expenseCats.join(', ') || 'Food, Transport, Shopping, Bills, Other'}

Rules:
- Convert any Burmese numerals (၀-၉) to standard numbers.
- Pick the closest matching category from the lists above for the detected type.
- If the message is NOT a financial transaction (e.g. a greeting or random chat), set isTransaction to false.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isTransaction: { type: Type.BOOLEAN },
          type: { type: Type.STRING, enum: ['income', 'expense'] },
          amount: { type: Type.NUMBER },
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          note: { type: Type.STRING },
        },
        required: ['isTransaction'],
      },
    },
  });

  const text = response.text;
  if (!text) return null;

  const parsed = JSON.parse(text) as {
    isTransaction: boolean;
    type?: 'income' | 'expense';
    amount?: number;
    title?: string;
    category?: string;
    note?: string;
  };

  if (!parsed.isTransaction || !parsed.amount || parsed.amount <= 0 || !parsed.title) {
    return null;
  }

  const type = parsed.type === 'income' ? 'income' : 'expense';
  return {
    type,
    amount: parsed.amount,
    title: parsed.title.trim(),
    category:
      parsed.category?.trim() ||
      categories.find((c) => c.type === type)?.name ||
      (type === 'income' ? 'အခြားဝင်ငွေ' : 'အထွေထွေ'),
    note: parsed.note?.trim() || undefined,
  };
}

export async function parseQuickTransaction(
  rawText: string,
  categories: CategoryHint[]
): Promise<ParsedTransaction | null> {
  const direct = parseByCommandOrRegex(rawText, categories);
  if (direct) return direct;

  try {
    return await parseWithGemini(rawText, categories);
  } catch (err) {
    console.error('Gemini parse error:', err);
    return null;
  }
}
