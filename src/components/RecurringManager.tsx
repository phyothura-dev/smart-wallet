import { useState, useMemo } from 'react';
import { RecurringTransaction, RecurringFrequency, Category, Wallet, getWalletLabel } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import CustomSelect from './CustomSelect';
import { Plus, Pencil, Trash2, X, Repeat, Play, Pause, CheckCircle2, CalendarClock } from 'lucide-react';

interface RecurringManagerProps {
  recurring: RecurringTransaction[];
  categories: Category[];
  wallets: Wallet[];
  onAddRecurring: (data: Omit<RecurringTransaction, 'id' | 'createdAt'>) => Promise<void>;
  onEditRecurring: (id: string, data: Partial<Omit<RecurringTransaction, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
  onRecordRecurringNow: (item: RecurringTransaction) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function RecurringManager({
  recurring,
  categories,
  wallets,
  onAddRecurring,
  onEditRecurring,
  onDeleteRecurring,
  onRecordRecurringNow,
  onShowToast,
}: RecurringManagerProps) {
  const { t } = useLanguage();
  const { formatAmount, baseCurrencySymbol } = useCurrency();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [walletId, setWalletId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const relevantCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const sortedItems = useMemo(() => {
    return [...recurring].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  }, [recurring]);

  const summary = useMemo(() => {
    let monthlyBills = 0;
    let monthlyIncome = 0;
    let activeCount = 0;

    recurring.forEach((item) => {
      if (!item.isActive) return;
      activeCount++;
      const monthlyEquivalent =
        item.frequency === 'weekly'
          ? item.amount * 4.33
          : item.frequency === 'yearly'
          ? item.amount / 12
          : item.amount;

      if (item.type === 'expense') monthlyBills += monthlyEquivalent;
      else monthlyIncome += monthlyEquivalent;
    });

    return { monthlyBills, monthlyIncome, activeCount };
  }, [recurring]);

  const getDueStatus = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr < today) return { label: t.recurring.overdue, cls: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900' };
    if (dateStr === today) return { label: t.recurring.dueToday, cls: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900' };
    const diffDays = Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
    if (diffDays <= 7) return { label: t.recurring.dueSoon, cls: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900' };
    return null;
  };

  const getFrequencyLabel = (freq: RecurringFrequency) => {
    if (freq === 'weekly') return t.recurring.weekly;
    if (freq === 'yearly') return t.recurring.yearly;
    return t.recurring.monthly;
  };

  const getWalletName = (id: string) => {
    const found = wallets.find((w) => w.id === id) || wallets[0];
    return found ? getWalletLabel(found.type, found.name) : '-';
  };

  const openAddModal = () => {
    setEditingItem(null);
    setType('expense');
    setTitle('');
    setAmount('');
    const expCats = categories.filter((c) => c.type === 'expense');
    setCategory(expCats[0]?.name || '');
    setWalletId(wallets[0]?.id || '');
    setFrequency('monthly');
    setNextDueDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: RecurringTransaction) => {
    setEditingItem(item);
    setType(item.type);
    setTitle(item.title);
    setAmount(String(item.amount));
    setCategory(item.category);
    setWalletId(item.walletId);
    setFrequency(item.frequency);
    setNextDueDate(item.nextDueDate);
    setNote(item.note || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0 || !category || !nextDueDate) {
      onShowToast(t.records.fillRequired, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onEditRecurring(editingItem.id, {
          type,
          title: title.trim(),
          amount: numAmount,
          category,
          walletId: walletId || wallets[0]?.id || '',
          frequency,
          nextDueDate,
          note: note.trim(),
        });
        onShowToast(t.recurring.editSuccess, 'success');
      } else {
        await onAddRecurring({
          type,
          title: title.trim(),
          amount: numAmount,
          category,
          walletId: walletId || wallets[0]?.id || '',
          frequency,
          nextDueDate,
          isActive: true,
          note: note.trim(),
        });
        onShowToast(t.recurring.addSuccess, 'success');
      }
      setIsModalOpen(false);
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordNow = async (item: RecurringTransaction) => {
    setRecordingId(item.id);
    try {
      await onRecordRecurringNow(item);
      onShowToast(t.recurring.recordedSuccess, 'success');
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setRecordingId(null);
    }
  };

  const handleToggleActive = async (item: RecurringTransaction) => {
    try {
      await onEditRecurring(item.id, { isActive: !item.isActive });
    } catch {
      onShowToast(t.records.actionError, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDeleteRecurring(deletingId);
      onShowToast(t.recurring.deleteSuccess, 'info');
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.recurring.title}</h2>
        <button
          id="btn-add-recurring"
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.recurring.addRecurring}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.recurring.monthlyIncome}</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{formatAmount(summary.monthlyIncome)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.recurring.monthlyBills}</p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">-{formatAmount(summary.monthlyBills)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.recurring.activeCount}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.activeCount}</p>
        </div>
      </div>

      {/* List */}
      {sortedItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.recurring.noRecurring}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{t.recurring.noRecurringDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const dueBadge = item.isActive ? getDueStatus(item.nextDueDate) : null;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !item.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        item.type === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {item.type === 'income' ? t.dashboard.incomeLabel : t.dashboard.expenseLabel}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{item.title}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                      {getFrequencyLabel(item.frequency)}
                    </span>
                    {!item.isActive && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-medium">
                        {t.recurring.paused}
                      </span>
                    )}
                    {dueBadge && (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${dueBadge.cls}`}>
                        {dueBadge.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>{getWalletName(item.walletId)}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {item.nextDueDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                  <span
                    className={`text-base font-bold ${
                      item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {formatAmount(item.amount)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.isActive && (
                      <button
                        type="button"
                        onClick={() => handleRecordNow(item)}
                        disabled={recordingId === item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.recurring.recordNow}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title={item.isActive ? t.recurring.pause : t.recurring.resume}
                    >
                      {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingItem ? t.recurring.editRecurring : t.recurring.addRecurring}
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
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    const first = categories.find((c) => c.type === 'expense');
                    if (first) setCategory(first.name);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    type === 'expense'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.dashboard.expenseLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    const first = categories.find((c) => c.type === 'income');
                    if (first) setCategory(first.name);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    type === 'income'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.dashboard.incomeLabel}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.common.title} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'income' ? t.records.titlePlaceholderIncome : t.records.titlePlaceholderExpense}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t.common.amount} ({baseCurrencySymbol.trim()}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t.common.category} *
                  </label>
                  <CustomSelect
                    value={category}
                    onChange={setCategory}
                    options={relevantCategories.map((c) => ({ value: c.name, label: c.name }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t.recurring.frequency} *
                  </label>
                  <CustomSelect
                    value={frequency}
                    onChange={(val) => setFrequency(val as RecurringFrequency)}
                    options={[
                      { value: 'weekly', label: t.recurring.weekly },
                      { value: 'monthly', label: t.recurring.monthly },
                      { value: 'yearly', label: t.recurring.yearly },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t.recurring.nextDueDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {wallets.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t.common.wallet} *
                  </label>
                  <CustomSelect
                    value={walletId}
                    onChange={setWalletId}
                    options={wallets.map((w) => ({ value: w.id, label: getWalletLabel(w.type, w.name) }))}
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.common.note}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.records.notePlaceholder}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
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
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.recurring.deleteConfirm}</p>
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
