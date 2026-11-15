import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { Category, UserProfile, Wallet, getWalletLabel } from '../types';
import { getLocalDateString, getCurrentMonthRange } from '../utils/finance';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import CustomSelect from './CustomSelect';
import Pagination from './Pagination';

export type TransactionRecordType = 'income' | 'expense';

export interface BaseTransactionRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  walletId?: string;
  date: string;
  note?: string;
  createdAt?: string;
}

export interface TransactionRecordManagerProps<T extends BaseTransactionRecord> {
  type: TransactionRecordType;
  items: T[];
  categories: Category[];
  wallets?: Wallet[];
  profile?: UserProfile | null;
  onAddItem: (data: Omit<T, 'id' | 'createdAt'>) => Promise<void>;
  onEditItem: (id: string, data: Omit<T, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  currencySymbol?: string;
}

type SortField = 'title' | 'category' | 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

export default function TransactionRecordManager<T extends BaseTransactionRecord>({
  type,
  items,
  categories,
  wallets = [],
  onAddItem,
  onEditItem,
  onDeleteItem,
  onShowToast,
  currencySymbol: _currencySymbolProp,
}: TransactionRecordManagerProps<T>) {
  const { language, t } = useLanguage();
  const { currencySymbol, baseCurrencySymbol, convertFromBase } = useCurrency();
  const isIncome = type === 'income';
  const idPrefix = isIncome ? 'income' : 'expense';

  // config texts and colors
  const config = {
    title: isIncome ? t.nav.incomes : t.nav.expenses,
    desc: '',
    addBtn: `+ ${t.common.add}`,
    emptyTitle: isIncome ? t.records.noIncomes : t.records.noExpenses,
    modalTitleAdd: isIncome ? t.records.addIncome : t.records.addExpense,
    modalTitleEdit: isIncome ? t.records.editIncome : t.records.editExpense,
    deleteModalTitle: t.records.deleteConfirm,
    deleteModalDesc: language === 'mm' ? 'ဤမှတ်တမ်းကို ဖျက်ပစ်ပါမည်။' : 'This record will be permanently deleted.',
    totalLabel: (count: number) =>
      `${t.records.totalFiltered} ${isIncome ? t.nav.incomes : t.nav.expenses} (${count} ${t.common.recordsCount})`,
    toastSuccessAdd: t.records.addSuccess,
    toastSuccessEdit: t.records.editSuccess,
    toastSuccessDelete: t.records.deleteSuccess,
    sign: isIncome ? '+' : '-',
    textColor: isIncome ? 'text-[#059669]' : 'text-[#DC2626]',
    badgeClass: isIncome
      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400'
      : 'bg-rose-50 dark:bg-rose-950/60 text-[#DC2626] dark:text-rose-400',
    placeholderTitle: isIncome ? t.records.titlePlaceholderIncome : t.records.titlePlaceholderExpense,
  };

  // default date range to current month
  const currentMonth = useMemo(() => getCurrentMonthRange(), []);

  // filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [startDate, setStartDate] = useState(currentMonth.start);
  const [endDate, setEndDate] = useState(currentMonth.end);

  // sort state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(80);

  // form state
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form values
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [walletId, setWalletId] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // filtered categories
  const relevantCategories = useMemo(() => {
    return categories.filter((cat) => cat.type === type);
  }, [categories, type]);

  const getWalletName = (wId?: string) => {
    if (!wId) {
      const def = wallets[0];
      return def ? getWalletLabel(def.type, def.name) : null;
    }
    const found = wallets.find((w) => w.id === wId);
    return found ? getWalletLabel(found.type, found.name) : null;
  };

  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'amount' || field === 'date' ? 'desc' : 'asc');
    }
  };

  // clear filters
  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setWalletFilter('all');
    setStartDate(currentMonth.start);
    setEndDate(currentMonth.end);
    setCurrentPage(1);
  };

  // apply filters
  const filteredItems = useMemo(() => {
    let list = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((item) => item.title.toLowerCase().includes(q));
    }

    if (categoryFilter !== 'all') {
      list = list.filter((item) => item.category === categoryFilter);
    }

    if (walletFilter !== 'all') {
      list = list.filter((item) => {
        if (item.walletId) {
          return item.walletId === walletFilter;
        }
        return wallets[0]?.id === walletFilter;
      });
    }

    if (startDate) {
      list = list.filter((item) => item.date >= startDate);
    }
    if (endDate) {
      list = list.filter((item) => item.date <= endDate);
    }

    return list;
  }, [items, search, categoryFilter, walletFilter, startDate, endDate, wallets]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
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
  }, [filteredItems, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedItems, currentPage, itemsPerPage]);

  const totalAmount = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredItems]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  const openAddModal = () => {
    setTitle('');
    setAmount('');
    setCategory(relevantCategories[0]?.name || '');
    setWalletId(wallets[0]?.id || '');
    setDate(getLocalDateString());
    setEditingId(null);
    setIsOpenForm(true);
  };

  const openEditModal = (item: T) => {
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
      onShowToast(t.records.fillRequired, 'error');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      onShowToast(t.records.invalidAmount, 'error');
      return;
    }
    if (!category) {
      onShowToast(t.records.selectCategory, 'error');
      return;
    }
    if (!date) {
      onShowToast(t.records.fillRequired, 'error');
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
      } as Omit<T, 'id' | 'createdAt'>;

      if (editingId) {
        await onEditItem(editingId, dataPayload);
        onShowToast(config.toastSuccessEdit, 'success');
      } else {
        await onAddItem(dataPayload);
        onShowToast(config.toastSuccessAdd, 'success');
      }
      setIsOpenForm(false);
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await onDeleteItem(deletingId);
      onShowToast(config.toastSuccessDelete, 'success');
    } catch {
      onShowToast(t.records.actionError, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* table container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{config.title}</h3>
          <button
            id={`btn-open-add-${idPrefix}`}
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 sm:px-3.5 sm:py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-all focus:outline-none cursor-pointer w-full sm:w-auto min-h-[40px] sm:min-h-0"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> {config.addBtn}
          </button>
        </div>

        {/* Filter Controls Row */}
        {items.length > 0 && (
          <div className="border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 pb-4 sm:pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
              {/* Search */}
              <div className={`relative sm:col-span-2 ${wallets.length > 0 ? 'lg:col-span-4' : 'lg:col-span-5'}`}>
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  id={`${idPrefix}-search-input`}
                  type="text"
                  placeholder={t.common.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all"
                />
              </div>

              {/* Category Select */}
              <div className={wallets.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <CustomSelect
                  id={`${idPrefix}-filter-category`}
                  size="sm"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { value: 'all', label: t.records.allCategories },
                    ...relevantCategories.map((c) => ({
                      value: c.name,
                      label: c.name,
                    })),
                  ]}
                />
              </div>

              {/* Wallet Select */}
              {wallets.length > 0 && (
                <div className="lg:col-span-3">
                  <CustomSelect
                    id={`${idPrefix}-filter-wallet`}
                    size="sm"
                    value={walletFilter}
                    onChange={setWalletFilter}
                    options={[
                      { value: 'all', label: t.records.allWallets },
                      ...wallets.map((w) => ({
                        value: w.id,
                        label: getWalletLabel(w.type, w.name),
                      })),
                    ]}
                  />
                </div>
              )}

              {/* Date Range Inputs */}
              <div className={`flex items-center gap-1.5 sm:col-span-2 ${wallets.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                <div className="relative flex-1 min-w-0">
                  <input
                    id={`${idPrefix}-start-date`}
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    title="စတင်ရက်"
                    className="w-full h-9 min-w-0 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all cursor-pointer"
                  />
                </div>
                <span className="text-slate-300 dark:text-slate-600 text-xs font-semibold select-none flex-shrink-0">–</span>
                <div className="relative flex-1 min-w-0">
                  <input
                    id={`${idPrefix}-end-date`}
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    title="ပြီးဆုံးရက်"
                    className="w-full h-9 min-w-0 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-4">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{config.emptyTitle}</h4>

            <button
              id={`btn-empty-state-add-${idPrefix}`}
              onClick={openAddModal}
              className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {config.addBtn}
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t.records.noFilteredResults}</h4>
            <button
              id={`btn-reset-filters-${idPrefix}`}
              onClick={handleClearFilters}
              className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {t.common.clearFilters}
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                    <th
                      onClick={() => handleSort('title')}
                      className="py-3 px-6 cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{t.common.title}</span>
                        {renderSortIcon('title')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('category')}
                      className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{t.common.category}</span>
                        {renderSortIcon('category')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{t.common.date}</span>
                        {renderSortIcon('date')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('amount')}
                      className="py-3 px-4 text-right cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{t.common.amount}</span>
                        {renderSortIcon('amount')}
                      </div>
                    </th>
                    <th className="py-3 px-6 text-center">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors text-sm text-slate-700 dark:text-slate-300">
                      <td className="py-4 px-6 font-semibold text-[#111827] dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span>{item.title}</span>
                          {getWalletName(item.walletId) && (
                            <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                              {getWalletName(item.walletId)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.badgeClass}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs">{item.date}</td>
                      <td className={`py-4 px-4 font-semibold ${config.textColor} text-right`}>
                        {config.sign}{currencySymbol}{convertFromBase(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-edit-${idPrefix}-${item.id}`}
                            onClick={() => openEditModal(item)}
                            title={t.common.edit}
                            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors focus:outline-none cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-${idPrefix}-${item.id}`}
                            onClick={() => setDeletingId(item.id)}
                            title={t.common.delete}
                            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/70 border-t-2 border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-6">
                      {config.totalLabel(filteredItems.length)}
                    </td>
                    <td className={`py-3.5 px-4 text-right ${config.textColor} font-bold text-base`}>
                      {config.sign}{currencySymbol}{convertFromBase(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-6"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm break-words">{item.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${config.badgeClass}`}>
                          {item.category}
                        </span>
                        {getWalletName(item.walletId) && (
                          <>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                              {getWalletName(item.walletId)}
                            </span>
                          </>
                        )}
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">{item.date}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`font-bold ${config.textColor} text-base`}>
                        {config.sign}{currencySymbol}{convertFromBase(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50 dark:border-slate-800">
                    <button
                      id={`btn-edit-${idPrefix}-mobile-${item.id}`}
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> {t.common.edit}
                    </button>
                    <button
                      id={`btn-delete-${idPrefix}-mobile-${item.id}`}
                      onClick={() => setDeletingId(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/50 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors cursor-pointer min-h-[36px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t.common.delete}
                    </button>
                  </div>
                </div>
              ))}

              {/* Mobile Total Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-t-2 border-slate-200 dark:border-slate-700 flex items-center justify-between font-semibold text-sm">
                <span className="text-slate-700 dark:text-slate-200">{config.totalLabel(filteredItems.length)}</span>
                <span className={`${config.textColor} text-base font-bold`}>
                  {config.sign}{currencySymbol}{convertFromBase(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalItems={sortedItems.length}
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
        <div id={`${idPrefix}-form-modal`} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-fade-in" onClick={() => setIsOpenForm(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827] dark:text-slate-100">
                {editingId ? config.modalTitleEdit : config.modalTitleAdd}
              </h3>
              <button
                id={`btn-close-${idPrefix}-modal`}
                onClick={() => setIsOpenForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.common.title} *
                </label>
                <input
                  id={`${idPrefix}-input-title`}
                  type="text"
                  required
                  placeholder={config.placeholderTitle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t.common.amount} ({baseCurrencySymbol.trim()}) *
                  </label>
                  <input
                    id={`${idPrefix}-input-amount`}
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t.common.category} *
                  </label>
                  <CustomSelect
                    id={`${idPrefix}-input-category`}
                    value={category}
                    onChange={setCategory}
                    placeholder={t.records.selectCategory}
                    options={relevantCategories.map((cat) => ({
                      value: cat.name,
                      label: cat.name,
                    }))}
                  />
                </div>
              </div>

              {wallets.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t.common.wallet} *
                  </label>
                  <CustomSelect
                    id={`${idPrefix}-input-wallet`}
                    value={walletId}
                    onChange={setWalletId}
                    options={wallets.map((w) => ({
                      value: w.id,
                      label: getWalletLabel(w.type, w.name),
                    }))}
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.common.date} *
                </label>
                <input
                  id={`${idPrefix}-input-date`}
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors cursor-pointer"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  id={`btn-cancel-${idPrefix}-form`}
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="px-4 py-2.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  {t.common.cancel}
                </button>
                <button
                  id={`btn-save-${idPrefix}-form`}
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 sm:py-2 rounded-lg bg-[#2563EB] text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-1 cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  {isSubmitting ? t.common.saving : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {deletingId && (
        <div id={`delete-${idPrefix}-confirm-modal`} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-fade-in" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/60 text-[#DC2626] dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-[#111827] dark:text-slate-100">{config.deleteModalTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {config.deleteModalDesc}
              </p>
            </div>

            <div className="flex gap-3 w-full justify-center mt-2">
              <button
                id={`btn-delete-${idPrefix}-abort`}
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                id={`btn-delete-${idPrefix}-confirm`}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-lg bg-[#DC2626] text-sm font-medium text-white hover:bg-[#B91C1C] transition-colors cursor-pointer"
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
