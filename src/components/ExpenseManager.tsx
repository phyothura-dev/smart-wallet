import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Edit3, Calendar, AlertTriangle, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Expense, Category, UserProfile, Wallet, getWalletLabel } from '../types';
import Pagination from './Pagination';

type ExpenseSortField = 'title' | 'category' | 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

interface ExpenseManagerProps {
  expenses: Expense[];
  categories: Category[];
  wallets?: Wallet[];
  profile: UserProfile | null;
  onAddExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onEditExpense: (id: string, data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function ExpenseManager({
  expenses,
  categories,
  wallets = [],
  profile,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onShowToast,
}: ExpenseManagerProps) {
  const currencySymbol = 'Ks ';

  // Sort State
  const [sortField, setSortField] = useState<ExpenseSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State (Minimum 80 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(80);

  // State
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form values
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [walletId, setWalletId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter categories to only expense categories
  const expenseCategories = categories.filter((cat) => cat.type === 'expense');

  const getWalletName = (wId?: string) => {
    if (!wId) {
      const def = wallets[0];
      return def ? getWalletLabel(def.type, def.name) : null;
    }
    const found = wallets.find((w) => w.id === wId);
    return found ? getWalletLabel(found.type, found.name) : null;
  };

  const handleSort = (field: ExpenseSortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'amount' || field === 'date' ? 'desc' : 'asc');
    }
  };

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      let result = 0;
      if (sortField === 'title') {
        result = a.title.localeCompare(b.title);
      } else if (sortField === 'category') {
        result = a.category.localeCompare(b.category);
      } else if (sortField === 'date') {
        result = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        result = a.amount - b.amount;
      }
      return sortOrder === 'asc' ? result : -result;
    });
  }, [expenses, sortField, sortOrder]);

  // Paginated Expenses (80+ items per page)
  const totalPages = Math.max(1, Math.ceil(sortedExpenses.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedExpenses, currentPage, itemsPerPage]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  const renderSortIcon = (field: ExpenseSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
    );
  };

  const openAddModal = () => {
    setTitle('');
    setAmount('');
    setCategory(expenseCategories[0]?.name || '');
    setWalletId(wallets[0]?.id || '');
    setDate(new Date().toISOString().substring(0, 10));
    setEditingId(null);
    setIsOpenForm(true);
  };

  const openEditModal = (item: Expense) => {
    setTitle(item.title);
    setAmount(item.amount.toString());
    setCategory(item.category);
    setWalletId(item.walletId || wallets[0]?.id || '');
    setDate(item.date);
    setEditingId(item.id);
    setIsOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('ကျေးဇူးပြု၍ အချက်အလက်အားလုံး ပြည့်စုံစွာ ဖြည့်သွင်းပေးပါ။', 'error');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      onShowToast('ငွေပမာဏသည် သုညထက် ကြီးရပါမည်။', 'error');
      return;
    }
    if (!category) {
      onShowToast('ကျေးဇူးပြု၍ အမျိုးအစား ရွေးချယ်ပေးပါ။', 'error');
      return;
    }
    if (!date) {
      onShowToast('ကျေးဇူးပြု၍ အချက်အလက်အားလုံး ပြည့်စုံစွာ ဖြည့်သွင်းပေးပါ။', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataPayload = {
        title: title.trim(),
        amount: parsedAmount,
        category,
        walletId: walletId || undefined,
        date,
      };

      if (editingId) {
        await onEditExpense(editingId, dataPayload);
        onShowToast('ထွက်ငွေမှတ်တမ်းကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။', 'success');
      } else {
        await onAddExpense(dataPayload);
        onShowToast('ထွက်ငွေမှတ်တမ်းအသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။', 'success');
      }
      setIsOpenForm(false);
    } catch (err) {
      console.error(err);
      onShowToast('အမှားဖြစ်ပေါ်ခဲ့ပါသည်။ ထပ်မံကြိုးစားပါ။', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await onDeleteExpense(deletingId);
      onShowToast('ထွက်ငွေမှတ်တမ်းကို ဖျက်ပစ်ပြီးပါပြီ။', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('ဖျက်ပစ်ရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Expense History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Sleek integrated card header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">ထွက်ငွေ စီမံခန့်ခွဲမှု</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">သင်၏ သုံးစွဲခဲ့သော စရိတ်စကများကို ခြေရာခံပါ။</p>
          </div>
          <button
            id="btn-open-add-expense"
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#4F46E5] px-4 py-2 sm:px-3.5 sm:py-1.5 text-xs font-semibold text-white hover:bg-[#4338CA] transition-all focus:outline-none cursor-pointer w-full sm:w-auto min-h-[40px] sm:min-h-0"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> ထွက်ငွေအသစ်ထည့်မည်
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">ထွက်ငွေမှတ်တမ်း မရှိသေးပါ</h4>
          
            <button
              id="btn-empty-state-add-expense"
              onClick={openAddModal}
              className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-[#4F46E5] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ထွက်ငွေအသစ်ထည့်မည်
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <th
                      onClick={() => handleSort('title')}
                      className="py-3 px-6 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>ခေါင်းစဉ်</span>
                        {renderSortIcon('title')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('category')}
                      className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>အမျိုးအစား</span>
                        {renderSortIcon('category')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>ရက်စွဲ</span>
                        {renderSortIcon('date')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('amount')}
                      className="py-3 px-4 text-right cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>ပမာဏ</span>
                        {renderSortIcon('amount')}
                      </div>
                    </th>
                    <th className="py-3 px-6 text-center">လုပ်ဆောင်ချက်</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedExpenses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                      <td className="py-4 px-6 font-semibold text-[#111827]">
                        <div className="flex items-center gap-2">
                          <span>{item.title}</span>
                          {getWalletName(item.walletId) && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/60">
                              {getWalletName(item.walletId)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-[#DC2626]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-xs">{item.date}</td>
                      <td className="py-4 px-4 font-semibold text-[#DC2626] text-right">
                        -{currencySymbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-edit-expense-${item.id}`}
                            onClick={() => openEditModal(item)}
                            title="ပြင်ဆင်မည်"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-expense-${item.id}`}
                            onClick={() => setDeletingId(item.id)}
                            title="ဖျက်မည်"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-slate-800 text-sm">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-6">
                      စုစုပေါင်း ထွက်ငွေ ({expenses.length} ခု)
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#DC2626] font-bold text-base">
                      -{currencySymbol}{totalExpenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-6"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedExpenses.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm break-words">{item.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-[#DC2626]">
                          {item.category}
                        </span>
                        {getWalletName(item.walletId) && (
                          <>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {getWalletName(item.walletId)}
                            </span>
                          </>
                        )}
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-500 text-xs">{item.date}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-[#DC2626] text-base">
                        -{currencySymbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                    <button
                      id={`btn-edit-expense-mobile-${item.id}`}
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> ပြင်ဆင်မည်
                    </button>
                    <button
                      id={`btn-delete-expense-mobile-${item.id}`}
                      onClick={() => setDeletingId(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-100 bg-rose-50/60 text-xs font-medium text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer min-h-[36px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ဖျက်မည်
                    </button>
                  </div>
                </div>
              ))}

              {/* Mobile Total Footer */}
              <div className="p-4 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between font-semibold text-sm">
                <span className="text-slate-700">စုစုပေါင်း ထွက်ငွေ ({expenses.length} ခု)</span>
                <span className="text-[#DC2626] text-base font-bold">
                  -{currencySymbol}{totalExpenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalItems={sortedExpenses.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              pageSizeOptions={[80, 160, 240]}
            />
          </>
        )}
      </div>

      {/* Slide-over / Modal Form */}
      {isOpenForm && (
        <div id="expense-form-modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-fade-in" onClick={() => setIsOpenForm(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827]">
                {editingId ? 'ထွက်ငွေမှတ်တမ်း ပြင်ဆင်ခြင်း' : 'ထွက်ငွေအသစ်ထည့်မည်'}
              </h3>
              <button
                id="btn-close-expense-modal"
                onClick={() => setIsOpenForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  ခေါင်းစဉ် *
                </label>
                <input
                  id="expense-input-title"
                  type="text"
                  required
                  placeholder="ဥပမာ- စားသောက်စရိတ်"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-base sm:text-sm focus:ring-1 focus:ring-indigo-500 bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    ပမာဏ ({currencySymbol}) *
                  </label>
                  <input
                    id="expense-input-amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-base sm:text-sm focus:ring-1 focus:ring-indigo-500 bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    အမျိုးအစား *
                  </label>
                  <select
                    id="expense-input-category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 bg-white rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-base sm:text-sm focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>အမျိုးအစား ရွေးချယ်ပါ</option>
                    {expenseCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {wallets.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    ပိုက်ဆံအိတ် / အကောင့် *
                  </label>
                  <select
                    id="expense-input-wallet"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 bg-white rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-base sm:text-sm focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {getWalletLabel(w.type, w.name)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  ရက်စွဲ *
                </label>
                <input
                  id="expense-input-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-base sm:text-sm focus:ring-1 focus:ring-indigo-500 bg-white transition-colors cursor-pointer"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  id="btn-cancel-expense-form"
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="px-4 py-2.5 sm:py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  id="btn-save-expense-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 sm:py-2 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#4338CA] transition-colors flex items-center justify-center gap-1 cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  {isSubmitting ? 'သိမ်းဆည်းနေသည်...' : 'သိမ်းဆည်းမည်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {deletingId && (
        <div id="delete-expense-confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs animate-fade-in" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white rounded-xl max-w-sm w-full p-6 border border-slate-200 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-[#DC2626]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-[#111827]">ဤထွက်ငွေမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                ဤမှတ်တမ်းကို ဖျက်ပစ်ပြီးပါက ပြန်လည်ရယူ၍ မရနိုင်ပါ။
              </p>
            </div>

            <div className="flex gap-3 w-full justify-center mt-2">
              <button
                id="btn-delete-expense-abort"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                id="btn-delete-expense-confirm"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-lg bg-[#DC2626] text-sm font-medium text-white hover:bg-[#B91C1C] transition-colors cursor-pointer"
              >
                ဖျက်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
