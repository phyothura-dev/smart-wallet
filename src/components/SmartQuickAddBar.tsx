import React, { useState } from 'react';
import { Sparkles, RefreshCw, Plus } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getLocalDateString } from '../utils/finance';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import type { Income, Expense } from '../types';

interface SmartQuickAddBarProps {
  onAddIncome?: (data: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  onAddExpense?: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface ParsedQuickAddResponse {
  type: 'income' | 'expense';
  amount: number;
  title: string;
  category: string;
  walletId?: string;
  note?: string;
}

export default function SmartQuickAddBar({
  onAddIncome,
  onAddExpense,
  onShowToast,
}: SmartQuickAddBarProps) {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [text, setText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  if (!onAddIncome || !onAddExpense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const user = auth.currentUser;
    if (!user) return;

    setIsParsing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: trimmed }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('API endpoint not available (use Vercel or vercel dev).');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.common.error);
      }

      const parsed = data as ParsedQuickAddResponse;
      const payload = {
        title: parsed.title,
        amount: parsed.amount,
        category: parsed.category,
        date: getLocalDateString(),
        ...(parsed.walletId ? { walletId: parsed.walletId } : {}),
        note: parsed.note || 'Quick Add (AI)',
      };

      if (parsed.type === 'income') {
        await onAddIncome(payload);
      } else {
        await onAddExpense(payload);
      }

      setText('');
      onShowToast?.(
        `${t.dashboard.quickAddSuccess}: ${parsed.title} (${formatAmount(parsed.amount)})`,
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.common.error;
      onShowToast?.(msg, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <form
      id="smart-quick-add-bar"
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3 shadow-2xs flex items-center gap-2"
    >
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <input
        id="input-smart-quick-add"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.dashboard.quickAddPlaceholder}
        disabled={isParsing}
        className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
      />
      <button
        id="btn-smart-quick-add"
        type="submit"
        disabled={isParsing || !text.trim()}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
      >
        {isParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        {t.dashboard.quickAddBtn}
      </button>
    </form>
  );
}
