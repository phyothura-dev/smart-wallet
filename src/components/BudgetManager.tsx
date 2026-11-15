import { useState, useMemo } from 'react';
import { Budget, Category, Expense } from '../types';
import { isDateInCurrentMonth } from '../utils/finance';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import CustomSelect from './CustomSelect';
import { Plus, Pencil, Trash2, X, PieChart, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetManagerProps {
  budgets: Budget[];
  categories: Category[];
  expenses: Expense[];
  onAddBudget: (data: { category: string; monthlyLimit: number }) => Promise<void>;
  onEditBudget: (id: string, data: { category?: string; monthlyLimit?: number }) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function BudgetManager({
  budgets,
  categories,
  expenses,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  onShowToast,
}: BudgetManagerProps) {
  const { t } = useLanguage();
  const { formatAmount, baseCurrencySymbol } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  // Current month spending per category
  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((exp) => {
      if (isDateInCurrentMonth(exp.date)) {
        map[exp.category] = (map[exp.category] || 0) + (Number(exp.amount) || 0);
      }
    });
    return map;
  }, [expenses]);

  const budgetRows = useMemo(() => {
    return budgets
      .map((b) => {
        const spent = spentByCategory[b.category] || 0;
        const remaining = b.monthlyLimit - spent;
        const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
        return { ...b, spent, remaining, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, spentByCategory]);

  const totals = useMemo(() => {
    const totalLimit = budgetRows.reduce((s, b) => s + b.monthlyLimit, 0);
    const totalSpent = budgetRows.reduce((s, b) => s + b.spent, 0);
    const remaining = totalLimit - totalSpent;
    const pct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
    return { totalLimit, totalSpent, remaining, pct };
  }, [budgetRows]);

  const availableCategories = useMemo(() => {
    const used = new Set(budgets.map((b) => b.category));
    return expenseCategories.filter((c) => !used.has(c.name) || editingBudget?.category === c.name);
  }, [expenseCategories, budgets, editingBudget]);

  const openAddModal = () => {
    setEditingBudget(null);
    setCategory(availableCategories[0]?.name || '');
    setMonthlyLimit('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategory(b.category);
    setMonthlyLimit(String(b.monthlyLimit));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(monthlyLimit);
    if (!category || isNaN(limitNum) || limitNum <= 0) {
      onShowToast(t.records.invalidAmount, 'error');
      return;
    }

    if (!editingBudget && budgets.some((b) => b.category === category)) {
      onShowToast(t.budgets.duplicateCategory, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBudget) {
        await onEditBudget(editingBudget.id, { category, monthlyLimit: limitNum });
        onShowToast(t.budgets.editSuccess, 'success');
      } else {
        await onAddBudget({ category, monthlyLimit: limitNum });
        onShowToast(t.budgets.addSuccess, 'success');
      }
      setIsModalOpen(false);
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDeleteBudget(deletingId);
      onShowToast(t.budgets.deleteSuccess, 'info');
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.budgets.title}</h2>
        <button
          id="btn-add-budget"
          type="button"
          onClick={openAddModal}
          disabled={availableCategories.length === 0 && !editingBudget}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.budgets.addBudget}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.budgets.totalBudget}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatAmount(totals.totalLimit)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.budgets.totalSpent}</p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{formatAmount(totals.totalSpent)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.budgets.remaining}</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              totals.remaining < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatAmount(Math.abs(totals.remaining))}
          </p>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {budgetRows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.budgets.noBudgets}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{t.budgets.noBudgetsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetRows.map((b) => {
            const isOver = b.spent > b.monthlyLimit;
            const isNear = !isOver && b.pct >= 75;
            const barColor = isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500';
            const badgeClass = isOver
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900'
              : isNear
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';

            return (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{b.category}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
                        {isOver ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {isOver ? t.budgets.overBudget : isNear ? t.budgets.nearLimit : t.budgets.onTrack}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t.budgets.monthlyLimit}: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatAmount(b.monthlyLimit)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(b)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      aria-label={t.common.edit}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(b.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      aria-label={t.common.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {t.budgets.spentThisMonth}: <span className="font-bold">{formatAmount(b.spent)}</span> ({b.pct}%)
                    </span>
                    <span className={`font-semibold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isOver ? `-${formatAmount(Math.abs(b.remaining))}` : formatAmount(b.remaining)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingBudget ? t.budgets.editBudget : t.budgets.addBudget}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.common.category} *
                </label>
                <CustomSelect
                  value={category}
                  onChange={setCategory}
                  disabled={!!editingBudget}
                  options={availableCategories.map((c) => ({ value: c.name, label: c.name }))}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.budgets.monthlyLimit} ({baseCurrencySymbol.trim()}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="0"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? t.common.saving : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.budgets.deleteConfirm}</p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white cursor-pointer"
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
