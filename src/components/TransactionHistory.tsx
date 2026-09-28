import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { Income, Expense, Category, UserProfile, Transaction, Wallet, getWalletLabel } from '../types';
import Pagination from './Pagination';
import { exportTransactionsToCSV } from '../utils/export';
import { getCurrentMonthRange } from '../utils/finance';

type TxSortField = 'type' | 'title' | 'category' | 'wallet' | 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

interface TransactionHistoryProps {
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
  wallets?: Wallet[];
  profile: UserProfile | null;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function TransactionHistory({
  incomes,
  expenses,
  categories: _categories,
  wallets = [],
  profile: _profile,
  onShowToast,
}: TransactionHistoryProps) {
  const currencySymbol = 'Ks ';

  // default date range to current month
  const currentMonth = useMemo(() => getCurrentMonthRange(), []);

  // filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [startDate, setStartDate] = useState(currentMonth.start);
  const [endDate, setEndDate] = useState(currentMonth.end);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(80);

  // sort state
  const [sortField, setSortField] = useState<TxSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // unified list
  const allTransactions = useMemo(() => {
    const list: Transaction[] = [
      ...incomes.map((inc) => ({ ...inc, type: 'income' as const })),
      ...expenses.map((exp) => ({ ...exp, type: 'expense' as const })),
    ];
    return list;
  }, [incomes, expenses]);

  const getWalletName = (wId?: string) => {
    if (!wId) {
      const def = wallets[0];
      return def ? getWalletLabel(def.type, def.name) : null;
    }
    const found = wallets.find((w) => w.id === wId);
    return found ? getWalletLabel(found.type, found.name) : null;
  };

  // column sorting
  const handleSort = (field: TxSortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'amount' || field === 'date' ? 'desc' : 'asc');
    }
  };

  const renderSortIcon = (field: TxSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  // apply filters and sorting
  const filteredTransactions = useMemo(() => {
    let list = [...allTransactions];

    // search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((tx) => tx.title.toLowerCase().includes(q));
    }

    // type filter
    if (typeFilter !== 'all') {
      list = list.filter((tx) => tx.type === typeFilter);
    }

    // wallet filter
    if (walletFilter !== 'all') {
      list = list.filter((tx) => {
        const effectiveWalletId = tx.walletId || wallets[0]?.id;
        return effectiveWalletId === walletFilter;
      });
    }

    // date range filter
    if (startDate) {
      list = list.filter((tx) => tx.date >= startDate);
    }
    if (endDate) {
      list = list.filter((tx) => tx.date <= endDate);
    }

    // dynamic sort
    list.sort((a, b) => {
      let result = 0;
      if (sortField === 'type') {
        result = a.type.localeCompare(b.type);
      } else if (sortField === 'title') {
        result = a.title.localeCompare(b.title);
      } else if (sortField === 'category') {
        result = a.category.localeCompare(b.category);
      } else if (sortField === 'wallet') {
        const wA = getWalletName(a.walletId) || '';
        const wB = getWalletName(b.walletId) || '';
        result = wA.localeCompare(wB);
      } else if (sortField === 'date') {
        result = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (result === 0) {
          result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      } else if (sortField === 'amount') {
        result = a.amount - b.amount;
      }
      return sortOrder === 'asc' ? result : -result;
    });

    return list;
  }, [allTransactions, search, typeFilter, walletFilter, startDate, endDate, wallets, sortField, sortOrder]);

  // reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, walletFilter, startDate, endDate]);

  // paginated transactions
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // filtered totals
  const { totalIncome, totalExpense, netTotal } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') {
        inc += tx.amount;
      } else {
        exp += tx.amount;
      }
    }
    return {
      totalIncome: inc,
      totalExpense: exp,
      netTotal: inc - exp,
    };
  }, [filteredTransactions]);

  // clear filters
  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setWalletFilter('all');
    setStartDate(currentMonth.start);
    setEndDate(currentMonth.end);
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      if (onShowToast) onShowToast('ထုတ်ယူရန် စာရင်းမှတ်တမ်း မရှိပါ။', 'error');
      return;
    }
    try {
      exportTransactionsToCSV(filteredTransactions, wallets, currencySymbol);
      if (onShowToast) {
        onShowToast(`စာရင်း ${filteredTransactions.length} ခုကို Excel/CSV အဖြစ် အောင်မြင်စွာ ထုတ်ယူပြီးပါပြီ။`, 'success');
      }
    } catch {
      if (onShowToast) {
        onShowToast('Excel ထုတ်ယူရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-2xs">
        {/* Title & Export Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">စာရင်းမှတ်တမ်းအားလုံး</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredTransactions.length}
            </span>
          </div>

          <button
            id="btn-export-excel"
            type="button"
            onClick={handleExportExcel}
            disabled={filteredTransactions.length === 0}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs self-stretch sm:self-auto"
            title="Excel/CSV ဖိုင်အဖြစ် ဒေါင်းလုဒ်ရယူပါ"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Excel / CSV ထုတ်ယူမည်</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Search */}
          <div className={`relative sm:col-span-2 ${wallets.length > 0 ? 'lg:col-span-4' : 'lg:col-span-5'}`}>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              id="tx-search-input"
              type="text"
              placeholder="မှတ်တမ်းများကို ရှာဖွေပါ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all"
            />
          </div>

          {/* Type Filter Select */}
          <div className={`relative ${wallets.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <select
              id="tx-filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="all">အမျိုးအစား: အားလုံး</option>
              <option value="income">ဝင်ငွေသာ</option>
              <option value="expense">ထွက်ငွေသာ</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Wallet Filter Select */}
          {wallets.length > 0 && (
            <div className="relative lg:col-span-3">
              <select
                id="tx-filter-wallet"
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer truncate"
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
                id="tx-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="စတင်ရက်"
                className="w-full min-w-0 px-2.5 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all cursor-pointer"
              />
            </div>
            <span className="text-slate-300 text-xs font-semibold select-none flex-shrink-0">–</span>
            <div className="relative flex-1 min-w-0">
              <input
                id="tx-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="ပြီးဆုံးရက်"
                className="w-full min-w-0 px-2.5 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800 text-base">မှတ်တမ်း မတွေ့ရှိပါ</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              ရွေးချယ်ထားသော စစ်ထုတ်မှုများနှင့် ကိုက်ညီသော မှတ်တမ်း မရှိပါ။
            </p>
            {allTransactions.length > 0 && (
              <button
                id="btn-reset-filters-empty-state"
                onClick={handleClearFilters}
                className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                စစ်ထုတ်မှုများ ဖျက်မည်
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <th
                      onClick={() => handleSort('type')}
                      className="py-3.5 px-6 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>အမျိုးအစား</span>
                        {renderSortIcon('type')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('title')}
                      className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>ခေါင်းစဉ်</span>
                        {renderSortIcon('title')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('category')}
                      className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>ခေါင်းစဉ်အုပ်စု</span>
                        {renderSortIcon('category')}
                      </div>
                    </th>
                    {wallets.length > 0 && (
                      <th
                        onClick={() => handleSort('wallet')}
                        className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>ပိုက်ဆံအိတ်</span>
                          {renderSortIcon('wallet')}
                        </div>
                      </th>
                    )}
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>ရက်စွဲ</span>
                        {renderSortIcon('date')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('amount')}
                      className="py-3.5 px-6 text-right cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>ပမာဏ</span>
                        {renderSortIcon('amount')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.map((tx) => (
                    <tr key={`${tx.type}-${tx.id}`} className="hover:bg-slate-50/40 transition-colors text-sm text-slate-700">
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-[#059669]'
                            : 'bg-rose-50 text-[#DC2626]'
                        }`}>
                          {tx.type === 'income' ? (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#059669]" />
                              ဝင်ငွေ
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5 text-[#DC2626]" />
                              ထွက်ငွေ
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#111827]">{tx.title}</td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded">
                          {tx.category}
                        </span>
                      </td>
                      {wallets.length > 0 && (
                        <td className="py-4 px-4">
                          {getWalletName(tx.walletId) ? (
                            <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/70">
                              {getWalletName(tx.walletId)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-4 text-xs text-slate-500">{tx.date}</td>
                      <td className={`py-4 px-6 text-right font-semibold ${
                        tx.type === 'income' ? 'text-[#059669]' : 'text-[#DC2626]'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}
                        {currencySymbol}
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-slate-800 text-sm">
                  {typeFilter === 'income' && (
                    <tr>
                      <td colSpan={wallets.length > 0 ? 5 : 4} className="py-3.5 px-6">
                        စုစုပေါင်း ဝင်ငွေ ({filteredTransactions.length} ခု)
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-base text-[#059669]">
                        +{currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  {typeFilter === 'expense' && (
                    <tr>
                      <td colSpan={wallets.length > 0 ? 5 : 4} className="py-3.5 px-6">
                        စုစုပေါင်း ထွက်ငွေ ({filteredTransactions.length} ခု)
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-base text-[#DC2626]">
                        -{currencySymbol}{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  {typeFilter === 'all' && (
                    <tr>
                      <td colSpan={wallets.length > 0 ? 5 : 4} className="py-3.5 px-6">
                        <div className="flex items-center gap-3.5 flex-wrap">
                          <span className="font-bold text-slate-900">စုစုပေါင်း ({filteredTransactions.length} ခု):</span>
                          <span className="text-xs font-semibold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            ဝင်ငွေ: +{currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs font-semibold text-[#DC2626] bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            ထွက်ငွေ: -{currencySymbol}{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-400 font-medium">အသားတင်</span>
                          <span className={`font-bold text-base ${netTotal >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                            {netTotal >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(netTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedTransactions.map((tx) => (
                <div key={`${tx.type}-${tx.id}`} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-[#059669]'
                            : 'bg-rose-50 text-[#DC2626]'
                        }`}>
                          {tx.type === 'income' ? (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-[#059669]" />
                              ဝင်ငွေ
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3 h-3 text-[#DC2626]" />
                              ထွက်ငွေ
                            </>
                          )}
                        </span>
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          {tx.category}
                        </span>
                        {getWalletName(tx.walletId) && (
                          <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200/60">
                            {getWalletName(tx.walletId)}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900 text-sm break-words">{tx.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{tx.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`font-bold text-base ${
                        tx.type === 'income' ? 'text-[#059669]' : 'text-[#DC2626]'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}
                        {currencySymbol}
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile Total Footer */}
              <div className="p-4 bg-slate-50 border-t-2 border-slate-200 space-y-2 font-semibold text-xs">
                {typeFilter === 'income' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">စုစုပေါင်း ဝင်ငွေ ({filteredTransactions.length} ခု):</span>
                    <span className="font-bold text-[#059669] text-base">
                      +{currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {typeFilter === 'expense' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">စုစုပေါင်း ထွက်ငွေ ({filteredTransactions.length} ခု):</span>
                    <span className="font-bold text-[#DC2626] text-base">
                      -{currencySymbol}{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {typeFilter === 'all' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>စုစုပေါင်း ဝင်ငွေ:</span>
                      <span className="font-bold text-[#059669]">
                        +{currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>စုစုပေါင်း ထွက်ငွေ:</span>
                      <span className="font-bold text-[#DC2626]">
                        -{currencySymbol}{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                      <span className="text-slate-800">အသားတင် လက်ကျန်ငွေ:</span>
                      <span className={netTotal >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}>
                        {netTotal >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(netTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTransactions.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              pageSizeOptions={[80, 160, 240]}
            />
          </>
        )}
      </div>
    </div>
  );
}
