import { useMemo, useState } from 'react';
import {
  PieChart,
  Repeat,
  Target,
  ArrowRight,
  AlertTriangle,
  Play,
  RefreshCw,
} from 'lucide-react';
import type { Budget, Expense, RecurringTransaction, SavingsGoal } from '../types';
import { getLocalDateString, isDateInCurrentMonth } from '../utils/finance';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface DashboardPlanningWidgetsProps {
  budgets: Budget[];
  expenses: Expense[];
  recurring: RecurringTransaction[];
  savingsGoals: SavingsGoal[];
  onChangeTab: (tab: string) => void;
  onRecordRecurringNow?: (item: RecurringTransaction) => Promise<void>;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function DashboardPlanningWidgets({
  budgets,
  expenses,
  recurring,
  savingsGoals,
  onChangeTab,
  onRecordRecurringNow,
  onShowToast,
}: DashboardPlanningWidgetsProps) {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [recordingId, setRecordingId] = useState<string | null>(null);

  const topBudgets = useMemo(() => {
    const spentByCategory: Record<string, number> = {};
    expenses.forEach((exp) => {
      if (isDateInCurrentMonth(exp.date)) {
        spentByCategory[exp.category] = (spentByCategory[exp.category] || 0) + (Number(exp.amount) || 0);
      }
    });

    return budgets
      .map((b) => {
        const spent = spentByCategory[b.category] || 0;
        const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
        return { ...b, spent, pct };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [budgets, expenses]);

  const upcomingRecurring = useMemo(() => {
    const today = getLocalDateString();
    return recurring
      .filter((item) => item.isActive)
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
      .slice(0, 3)
      .map((item) => {
        const isOverdue = item.nextDueDate < today;
        const isDueToday = item.nextDueDate === today;
        return { ...item, isOverdue, isDueToday };
      });
  }, [recurring]);

  const topGoals = useMemo(() => {
    return [...savingsGoals]
      .map((g) => {
        const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
        return { ...g, pct };
      })
      .sort((a, b) => {
        const aDone = a.currentAmount >= a.targetAmount ? 1 : 0;
        const bDone = b.currentAmount >= b.targetAmount ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return b.pct - a.pct;
      })
      .slice(0, 3);
  }, [savingsGoals]);

  const handleRecordNow = async (item: RecurringTransaction) => {
    if (!onRecordRecurringNow) return;
    setRecordingId(item.id);
    try {
      await onRecordRecurringNow(item);
      onShowToast?.(`${item.title} (${formatAmount(item.amount)})`, 'success');
    } catch {
      onShowToast?.(t.common.error, 'error');
    } finally {
      setRecordingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Monthly Budgets Widget */}
      <div
        id="card-budgets-overview"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs flex flex-col"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0">
              <PieChart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
              {t.dashboard.budgetsOverview}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onChangeTab('budgets')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex-shrink-0"
          >
            {t.dashboard.manageWallets} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topBudgets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.dashboard.noBudgets}</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            {topBudgets.map((b) => {
              const isOver = b.pct >= 100;
              const isWarn = !isOver && b.pct >= 80;
              const barColor = isOver
                ? 'bg-rose-500'
                : isWarn
                ? 'bg-amber-500'
                : 'bg-emerald-500';
              return (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {b.category}
                      </span>
                      {(isOver || isWarn) && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isOver
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {isOver ? t.dashboard.budgetExceededLabel : t.dashboard.budgetWarningLabel}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex-shrink-0">
                      {b.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span>{formatAmount(b.spent)}</span>
                    <span>{formatAmount(b.monthlyLimit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Recurring Widget */}
      <div
        id="card-recurring-overview"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs flex flex-col"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center flex-shrink-0">
              <Repeat className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
              {t.dashboard.upcomingRecurring}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onChangeTab('recurring')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex-shrink-0"
          >
            {t.dashboard.manageWallets} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingRecurring.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.dashboard.noRecurring}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {upcomingRecurring.map((item) => (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                    <span
                      className={
                        item.isOverdue
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : item.isDueToday
                          ? 'text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-slate-400 dark:text-slate-500'
                      }
                    >
                      {item.nextDueDate}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span
                      className={`font-semibold ${
                        item.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                </div>
                {onRecordRecurringNow && (
                  <button
                    type="button"
                    onClick={() => handleRecordNow(item)}
                    disabled={recordingId === item.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-60 flex-shrink-0"
                  >
                    {recordingId === item.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    {t.dashboard.recordNow}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Savings Goals Widget */}
      <div
        id="card-goals-overview"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs flex flex-col"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
              {t.dashboard.savingsGoalsOverview}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onChangeTab('goals')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex-shrink-0"
          >
            {t.dashboard.manageWallets} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topGoals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.dashboard.noGoals}</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            {topGoals.map((g) => (
              <div key={g.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {g.title}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex-shrink-0">
                    {g.pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${g.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>{formatAmount(g.currentAmount)}</span>
                  <span>{formatAmount(g.targetAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
