import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { UserProfile } from '../types';
import {
  CurrencyCode,
  DEFAULT_EXCHANGE_RATES,
  normalizeCurrencyCode,
  getCurrencySymbol,
  mergeExchangeRates,
  convertCurrencyAmount,
} from '../utils/currency';

const DISPLAY_CURRENCY_STORAGE_KEY = 'smartwallet-display-currency';

interface CurrencyContextValue {
  baseCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  setDisplayCurrency: (code: CurrencyCode) => void;
  currencySymbol: string;
  baseCurrencySymbol: string;
  exchangeRates: Record<CurrencyCode, number>;
  convertFromBase: (amount: number) => number;
  formatAmount: (
    amountInBase: number,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
  ) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({
  profile,
  children,
}: {
  profile: UserProfile | null;
  children: React.ReactNode;
}) {
  const baseCurrency = useMemo(
    () => normalizeCurrencyCode(profile?.currency),
    [profile?.currency]
  );

  const exchangeRates = useMemo(
    () => mergeExchangeRates(profile?.exchangeRates),
    [profile?.exchangeRates]
  );

  const [displayCurrency, setDisplayCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
      if (saved) return normalizeCurrencyCode(saved);
    } catch {
      // ignore storage errors
    }
    return normalizeCurrencyCode(profile?.currency);
  });

  // Sync default display currency if user hasn't explicitly picked one yet
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
      if (!saved && profile?.currency) {
        setDisplayCurrencyState(normalizeCurrencyCode(profile.currency));
      }
    } catch {
      // ignore
    }
  }, [profile?.currency]);

  const setDisplayCurrency = useCallback((code: CurrencyCode) => {
    const normalized = normalizeCurrencyCode(code);
    setDisplayCurrencyState(normalized);
    try {
      localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, normalized);
    } catch {
      // ignore storage errors
    }
  }, []);

  const currencySymbol = useMemo(
    () => getCurrencySymbol(displayCurrency),
    [displayCurrency]
  );

  const baseCurrencySymbol = useMemo(
    () => getCurrencySymbol(baseCurrency),
    [baseCurrency]
  );

  const convertFromBase = useCallback(
    (amount: number) => convertCurrencyAmount(amount, baseCurrency, displayCurrency, exchangeRates),
    [baseCurrency, displayCurrency, exchangeRates]
  );

  const formatAmount = useCallback(
    (
      amountInBase: number,
      options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
    ) => {
      const converted = convertFromBase(amountInBase);
      const minDigits = options?.minimumFractionDigits ?? (displayCurrency === 'MMK' ? 2 : 2);
      const maxDigits = options?.maximumFractionDigits ?? 2;
      return `${currencySymbol}${converted.toLocaleString(undefined, {
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits,
      })}`;
    },
    [convertFromBase, currencySymbol, displayCurrency]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      baseCurrency,
      displayCurrency,
      setDisplayCurrency,
      currencySymbol,
      baseCurrencySymbol,
      exchangeRates: exchangeRates ?? DEFAULT_EXCHANGE_RATES,
      convertFromBase,
      formatAmount,
    }),
    [
      baseCurrency,
      displayCurrency,
      setDisplayCurrency,
      currencySymbol,
      baseCurrencySymbol,
      exchangeRates,
      convertFromBase,
      formatAmount,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
