export type CurrencyCode = 'MMK' | 'USD' | 'THB' | 'SGD' | 'EUR' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  shortLabel: string;
  nameEn: string;
  nameMm: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  MMK: {
    code: 'MMK',
    symbol: 'Ks ',
    shortLabel: 'Ks',
    nameEn: 'Myanmar Kyat (MMK)',
    nameMm: 'မြန်မာကျပ် (MMK)',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    shortLabel: '$',
    nameEn: 'US Dollar (USD)',
    nameMm: 'အမေရိကန်ဒေါ်လာ (USD)',
  },
  THB: {
    code: 'THB',
    symbol: '฿',
    shortLabel: '฿',
    nameEn: 'Thai Baht (THB)',
    nameMm: 'ထိုင်းဘတ် (THB)',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    shortLabel: 'S$',
    nameEn: 'Singapore Dollar (SGD)',
    nameMm: 'စင်ကာပူဒေါ်လာ (SGD)',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    shortLabel: '€',
    nameEn: 'Euro (EUR)',
    nameMm: 'ယူရို (EUR)',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    shortLabel: '¥',
    nameEn: 'Japanese Yen (JPY)',
    nameMm: 'ဂျပန်ယန်း (JPY)',
  },
};

export const CURRENCY_LIST: CurrencyConfig[] = Object.values(CURRENCY_CONFIGS);

/**
 * Exchange rates expressed as value in MMK per 1 unit of currency.
 * e.g., 1 USD = 4500 MMK, 1 MMK = 1 MMK
 */
export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  MMK: 1,
  USD: 4500,
  THB: 130,
  SGD: 3350,
  EUR: 4850,
  JPY: 30,
};

export function normalizeCurrencyCode(raw?: string | null): CurrencyCode {
  if (!raw) return 'MMK';
  const upper = raw.trim().toUpperCase();
  if (upper === 'KS' || upper === 'MMK') return 'MMK';
  if (upper in CURRENCY_CONFIGS) return upper as CurrencyCode;
  return 'MMK';
}

export function getCurrencySymbol(code?: string | null): string {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCY_CONFIGS[normalized].symbol;
}

export function getCurrencyShortLabel(code?: string | null): string {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCY_CONFIGS[normalized].shortLabel;
}

export function mergeExchangeRates(
  customRates?: Record<string, number> | null
): Record<CurrencyCode, number> {
  const merged: Record<CurrencyCode, number> = { ...DEFAULT_EXCHANGE_RATES };
  if (customRates) {
    for (const code of Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]) {
      const val = customRates[code];
      if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
        merged[code] = val;
      }
    }
  }
  merged.MMK = 1;
  return merged;
}

export function convertCurrencyAmount(
  amount: number,
  fromCode: string | undefined | null,
  toCode: string | undefined | null,
  customRates?: Record<string, number> | null
): number {
  const from = normalizeCurrencyCode(fromCode);
  const to = normalizeCurrencyCode(toCode);
  if (from === to) return amount;

  const rates = mergeExchangeRates(customRates);
  const amountInMmk = amount * rates[from];
  return amountInMmk / rates[to];
}

export async function fetchLiveExchangeRates(): Promise<Record<CurrencyCode, number>> {
  const response = await fetch('https://open.er-api.com/v6/latest/MMK');
  if (!response.ok) {
    throw new Error('Failed to fetch live exchange rates');
  }
  const data = (await response.json()) as {
    result?: string;
    rates?: Record<string, number>;
  };
  if (data.result !== 'success' || !data.rates) {
    throw new Error('Invalid exchange rate response');
  }

  const next: Record<CurrencyCode, number> = { ...DEFAULT_EXCHANGE_RATES };
  for (const code of Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]) {
    if (code === 'MMK') {
      next.MMK = 1;
      continue;
    }
    const ratePerMmk = data.rates[code];
    if (typeof ratePerMmk === 'number' && ratePerMmk > 0) {
      next[code] = Math.round((1 / ratePerMmk) * 100) / 100;
    }
  }
  return next;
}
