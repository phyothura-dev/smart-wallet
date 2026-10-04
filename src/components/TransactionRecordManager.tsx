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
  currencySymbol = 'Ks ',
}: TransactionRecordManagerProps<T>) {
  const isIncome = type === 'income';
  const idPrefix = isIncome ? 'income' : 'expense';

  // config texts and colors
  const config = {
    title: isIncome ? 'ဝင်ငွေ' : 'ထွက်ငွေ',
    desc: '',
    addBtn: '+ အသစ်ထည့်မည်',
    emptyTitle: isIncome ? 'ဝင်ငွေမှတ်တမ်း မရှိပါ' : 'ထွက်ငွေမှတ်တမ်း မရှိပါ',
    modalTitleAdd: isIncome ? 'ဝင်ငွေ အသစ်ထည့်မည်' : 'ထွက်ငွေ အသစ်ထည့်မည်',
    modalTitleEdit: isIncome ? 'ဝင်ငွေ ပြင်ဆင်မည်' : 'ထွက်ငွေ ပြင်ဆင်မည်',
    deleteModalTitle: isIncome
      ? 'ဝင်ငွေ ဖျက်မည်လား?'
      : 'ထွက်ငွေ ဖျက်မည်လား?',
    deleteModalDesc: 'ဤမှတ်တမ်းကို ဖျက်ပစ်ပါမည်။',
    totalLabel: (count: number) =>
      isIncome ? `စုစုပေါင်း ဝင်ငွေ (${count} ခု)` : `စုစုပေါင်း ထွက်ငွေ (${count} ခု)`,
    toastSuccessAdd: isIncome
      ? 'ဝင်ငွေမှတ်တမ်းအသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။'
      : 'အသုံးစရိတ်မှတ်တမ်းအသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။',
    toastSuccessEdit: isIncome
      ? 'ဝင်ငွေမှတ်တမ်းကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။'
      : 'အသုံးစရိတ်မှတ်တမ်းကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။',
    toastSuccessDelete: isIncome
      ? 'ဝင်ငွေမှတ်တမ်းကို ဖျက်ပစ်ပြီးပါပြီ။'
      : 'အသုံးစရိတ်မှတ်တမ်းကို ဖျက်ပစ်ပြီးပါပြီ။',
    sign: isIncome ? '+' : '-',
    textColor: isIncome ? 'text-[#059669]' : 'text-[#DC2626]',
    badgeClass: isIncome
      ? 'bg-emerald-50 text-[#059669]'
      : 'bg-rose-50 text-[#DC2626]',
    placeholderTitle: isIncome ? 'ဥပမာ- လစဉ်လစာငွေ' : 'ဥပမာ- စားသောက်စရိတ်',
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
      onShowToast('အမှားဖြစ်ပေါ်ခဲ့ပါသည်။ ထပ်မံကြိုးစားပါ။', 'error');
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
      onShowToast('ဖျက်ပစ်ရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* table container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
          <h3 className="font-semibold text-slate-800 text-sm">{config.title}</h3>
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
          <div className="border-b border-slate-100 px-4 sm:px-6 pb-4 sm:pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
              {/* Search */}
              <div className={`relative sm:col-span-2 ${wallets.length > 0 ? 'lg:col-span-4' : 'lg:col-span-5'}`}>
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  id={`${idPrefix}-search-input`}
                  type="text"
                  placeholder="ရှာဖွေပါ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all"
                />
              </div>

              {/* Category Select */}
              <div className={`relative ${wallets.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                <select
                  id={`${idPrefix}-filter-category`}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer truncate"
                >
                  <option value="all">ခေါင်းစဉ်: အားလုံး</option>
                  {relevantCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Wallet Select */}
              {wallets.length > 0 && (
                <div className="relative lg:col-span-3">
                  <select
                    id={`${idPrefix}-filter-wallet`}
                    value={walletFilter}
                    onChange={(e) => setWalletFilter(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer truncate"
                  >
                    <option value="all">ပိုက်ဆံအိတ်: အားလုံး</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {getWalletLabel(w.type, w.name)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
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
                    className="w-full min-w-0 px-2.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all cursor-pointer"
                  />
                </div>
                <span className="text-slate-300 text-xs font-semibold select-none flex-shrink-0">–</span>
                <div className="relative flex-1 min-w-0">
                  <input
                    id={`${idPrefix}-end-date`}
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    title="ပြီးဆုံးရက်"
                    className="w-full min-w-0 px-2.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-t border-slate-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">{config.emptyTitle}</h4>

            <button
              id={`btn-empty-state-add-${idPrefix}`}
              onClick={openAddModal}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-[#2563EB] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {config.addBtn}
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">မှတ်တမ်း မတွေ့ပါ</h4>
            <button
              id={`btn-reset-filters-${idPrefix}`}
              onClick={handleClearFilters}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              စစ်ထုတ်မှု ရှင်းလင်းမည်
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
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
                  {paginatedItems.map((item) => (
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.badgeClass}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-xs">{item.date}</td>
                      <td className={`py-4 px-4 font-semibold ${config.textColor} text-right`}>
                        {config.sign}{currencySymbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-edit-${idPrefix}-${item.id}`}
                            onClick={() => openEditModal(item)}
                            title="ပြင်ဆင်မည်"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-${idPrefix}-${item.id}`}
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
                      {config.totalLabel(filteredItems.length)}
                    </td>
                    <td className={`py-3.5 px-4 text-right ${config.textColor} font-bold text-base`}>
                      {config.sign}{currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-6"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedItems.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm break-words">{item.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${config.badgeClass}`}>
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
                      <span className={`font-bold ${config.textColor} text-base`}>
                        {config.sign}{currencySymbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                    <button
                      id={`btn-edit-${idPrefix}-mobile-${item.id}`}
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> ပြင်ဆင်မည်
                    </button>
                    <button
                      id={`btn-delete-${idPrefix}-mobile-${item.id}`}
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
                <span className="text-slate-700">{config.totalLabel(filteredItems.length)}</span>
                <span className={`${config.textColor} text-base font-bold`}>
                  {config.sign}{currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-fade-in" onClick={() => setIsOpenForm(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827]">
                {editingId ? config.modalTitleEdit : config.modalTitleAdd}
              </h3>
              <button
                id={`btn-close-${idPrefix}-modal`}
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
                  id={`${idPrefix}-input-title`}
                  type="text"
                  required
                  placeholder={config.placeholderTitle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    ပမာဏ ({currencySymbol.trim()}) *
                  </label>
                  <input
                    id={`${idPrefix}-input-amount`}
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    အမျိုးအစား *
                  </label>
                  <select
                    id={`${idPrefix}-input-category`}
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 bg-white rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>အမျိုးအစား ရွေးချယ်ပါ</option>
                    {relevantCategories.map((cat) => (
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
                    ပိုက်ဆံအိတ် *
                  </label>
                  <select
                    id={`${idPrefix}-input-wallet`}
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 bg-white rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
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
                  id={`${idPrefix}-input-date`}
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 text-base sm:text-sm focus:ring-1 focus:ring-blue-500 bg-white transition-colors cursor-pointer"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  id={`btn-cancel-${idPrefix}-form`}
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="px-4 py-2.5 sm:py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  id={`btn-save-${idPrefix}-form`}
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 sm:py-2 rounded-lg bg-[#2563EB] text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-1 cursor-pointer min-h-[44px] sm:min-h-0"
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
        <div id={`delete-${idPrefix}-confirm-modal`} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs animate-fade-in" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white rounded-xl max-w-sm w-full p-6 border border-slate-200 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-[#DC2626]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-[#111827]">{config.deleteModalTitle}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {config.deleteModalDesc}
              </p>
            </div>

            <div className="flex gap-3 w-full justify-center mt-2">
              <button
                id={`btn-delete-${idPrefix}-abort`}
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                id={`btn-delete-${idPrefix}-confirm`}
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
