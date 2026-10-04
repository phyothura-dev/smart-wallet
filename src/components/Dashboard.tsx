import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Folder,
  ArrowRight,
  Activity,
  Calendar,
  WalletCards,
  Plus,
  ArrowRightLeft,
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Income, Expense, UserProfile, Transaction, Wallet, Transfer, Loan, getWalletLabel } from '../types';
import { getWalletIcon } from './WalletManager';
import { calculateWalletBalances } from '../utils/finance';
import TransferModal from './TransferModal';

type TimeFrame = 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom';

interface DashboardProps {
  incomes: Income[];
  expenses: Expense[];
  wallets?: Wallet[];
  transfers?: Transfer[];
  loans?: Loan[];
  profile: UserProfile | null;
  onChangeTab: (tab: string) => void;
  onAddTransfer?: (data: Omit<Transfer, 'id' | 'createdAt'>) => Promise<void>;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function Dashboard({
  incomes,
  expenses,
  wallets = [],
  transfers = [],
  loans = [],
  profile: _profile,
  onChangeTab,
  onAddTransfer,
  onShowToast
}: DashboardProps) {
  const currencySymbol = 'Ks ';

  // time frame filter state
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // quick transfer modal state
  const [isOpenTransferModal, setIsOpenTransferModal] = useState(false);
  const [selectedFromWalletId, setSelectedFromWalletId] = useState<string | undefined>(undefined);

  // date range filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (timeFrame === 'this_month') {
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { start, end, label: 'ဒီလ' };
    }
    if (timeFrame === 'last_month') {
      const prevDate = new Date(year, month - 1, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = prevDate.getMonth();
      const start = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
      const end = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { start, end, label: 'ပြီးခဲ့သည့်လ' };
    }
    if (timeFrame === 'this_year') {
      return { start: `${year}-01-01`, end: `${year}-12-31`, label: 'ဒီနှစ်' };
    }
    if (timeFrame === 'custom') {
      return { start: customStart, end: customEnd, label: 'ရက်စွဲရွေးချယ်မှု' };
    }
    return { start: '', end: '', label: 'ကာလအားလုံး' };
  }, [timeFrame, customStart, customEnd]);

  // filtered incomes and expenses
  const periodData = useMemo(() => {
    const filteredIncomes = incomes.filter((inc) => {
      if (dateRange.start && inc.date < dateRange.start) return false;
      if (dateRange.end && inc.date > dateRange.end) return false;
      return true;
    });

    const filteredExpenses = expenses.filter((exp) => {
      if (dateRange.start && exp.date < dateRange.start) return false;
      if (dateRange.end && exp.date > dateRange.end) return false;
      return true;
    });

    const totalIncome = filteredIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    const netFlow = totalIncome - totalExpense;

    return {
      filteredIncomes,
      filteredExpenses,
      totalIncome,
      totalExpense,
      netFlow
    };
  }, [incomes, expenses, dateRange]);

  // wallet balances
  const walletBalances = useMemo(() => {
    return calculateWalletBalances(wallets, incomes, expenses, transfers, loans);
  }, [wallets, incomes, expenses, transfers, loans]);

  const openTransferModal = (defaultFromId?: string) => {
    setSelectedFromWalletId(defaultFromId);
    setIsOpenTransferModal(true);
  };

  // total net assets
  const totalAssets = useMemo(() => {
    if (walletBalances.length > 0) {
      return walletBalances.reduce((sum, w) => sum + w.currentBalance, 0);
    }
    const allInc = incomes.reduce((sum, item) => sum + item.amount, 0);
    const allExp = expenses.reduce((sum, item) => sum + item.amount, 0);
    return allInc - allExp;
  }, [walletBalances, incomes, expenses]);

  // loan stats
  const loanStats = useMemo(() => {
    let lent = 0;
    let borrowed = 0;
    let active = 0;
    for (const l of loans) {
      if (l.type === 'lent') lent += l.remainingAmount;
      else borrowed += l.remainingAmount;
      if (l.status !== 'completed') active++;
    }
    return { lent, borrowed, active };
  }, [loans]);

  // recent transactions
  const recentTransactions = useMemo(() => {
    const combined: Transaction[] = [
      ...incomes.map((inc) => ({ ...inc, type: 'income' as const })),
      ...expenses.map((exp) => ({ ...exp, type: 'expense' as const })),
    ];
    return combined
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);
  }, [incomes, expenses]);

  // monthly bar chart data
  const monthlyChartData = useMemo(() => {
    const months = [
      'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်',
      'ဧပြီ', 'မေ', 'ဇွန်',
      'ဇူလိုင်', 'ဩဂုတ်', 'စက်တင်ဘာ',
      'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'
    ];

    const chartDataMap: { [key: string]: { monthName: string; income: number; expense: number; sortKey: string } } = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      chartDataMap[key] = {
        monthName: `${months[monthIndex]} ${String(year).substring(2)}`,
        income: 0,
        expense: 0,
        sortKey: key
      };
    }

    incomes.forEach((inc) => {
      const key = inc.date.substring(0, 7);
      if (chartDataMap[key]) {
        chartDataMap[key].income += inc.amount;
      }
    });

    expenses.forEach((exp) => {
      const key = exp.date.substring(0, 7);
      if (chartDataMap[key]) {
        chartDataMap[key].expense += exp.amount;
      }
    });

    return Object.values(chartDataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [incomes, expenses]);

  // expense category pie chart data
  const categoryChartData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    periodData.filteredExpenses.forEach((exp) => {
      const cat = exp.category || 'အခြား';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    });

    const totalExpense = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

    const data = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      percentage: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0,
    }));

    return data.sort((a, b) => b.value - a.value);
  }, [periodData.filteredExpenses]);

  const COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Time-Frame Filter Toolbar (Streamlined) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          {[
            { id: 'this_month', label: 'ဒီလ' },
            { id: 'last_month', label: 'ပြီးခဲ့သည့်လ' },
            { id: 'this_year', label: 'ဒီနှစ်' },
            { id: 'all', label: 'အားလုံး' },
            { id: 'custom', label: 'ရက်စွဲရွေးမည်' },
          ].map((tf) => {
            const isActive = timeFrame === tf.id;
            return (
              <button
                key={tf.id}
                id={`btn-timeframe-${tf.id}`}
                onClick={() => setTimeFrame(tf.id as TimeFrame)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Custom date range picker if custom selected */}
        {timeFrame === 'custom' && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs animate-in fade-in duration-150">
            <span className="text-slate-400">မှ</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border-0 text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
            <span className="text-slate-400">ထိ</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border-0 text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Overview Metric Cards (Hero) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-5">
        {/* Total Assets Balance Card */}
        <div id="card-total-balance" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              လက်ကျန်ငွေ
            </span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              totalAssets >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 break-words">
              {totalAssets < 0 ? '-' : ''}
              {currencySymbol}
              {Math.abs(totalAssets).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Period Income Card */}
        <div id="card-total-income" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ဝင်ငွေ
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 break-words">
              +{currencySymbol}
              {periodData.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Period Expenses Card */}
        <div id="card-total-expenses" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ထွက်ငွေ
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-2">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-rose-600 break-words">
              -{currencySymbol}
              {periodData.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className={`text-xs font-semibold ${periodData.netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              အသားတင်: {periodData.netFlow >= 0 ? '+' : ''}{currencySymbol}{periodData.netFlow.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Loans Overview Strip (Clean & Minimalist) */}
      {loans.length > 0 && (
        <div
          id="dash-loan-overview-strip"
          onClick={() => onChangeTab('loans')}
          className="bg-white rounded-xl border border-slate-200/90 px-4 py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <HandCoins className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-800">
                ချေးငွေနှင့် အကြွေးများ
              </span>
              <span className="text-[11px] font-medium text-slate-400 ml-1.5">
                ({loanStats.active} ခု ဆပ်ရန်ကျန်)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 text-xs pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">ရရန်ရှိ:</span>
              <span className="font-bold text-emerald-600">
                {currencySymbol}{loanStats.lent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">ပေးရန်ရှိ:</span>
              <span className="font-bold text-amber-600">
                {currencySymbol}{loanStats.borrowed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />
          </div>
        </div>
      )}

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Monthly Income vs Expense Chart */}
        <div id="card-monthly-chart" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-2 flex flex-col min-h-[300px] sm:h-[360px]">
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="font-semibold text-slate-900 text-sm">လစဉ် နှိုင်းယှဉ်ချက်</h4>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-[#2563EB] rounded-sm" />
                <span className="text-slate-600 font-medium">ဝင်ငွေ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                <span className="text-slate-600 font-medium">ထွက်ငွေ</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[220px] w-full">
            {incomes.length === 0 && expenses.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <Activity className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">ဇယားတွင် ဖော်ပြရန် မှတ်တမ်းမရှိသေးပါ</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '12px' }}
                    formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="income" fill="#2563EB" radius={[3, 3, 0, 0]} barSize={12} />
                  <Bar dataKey="expense" fill="#DC2626" radius={[3, 3, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses by Category Pie Chart (Reflecting Period) */}
        <div id="card-category-chart" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col min-h-[300px] sm:h-[360px]">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 text-sm">အမျိုးအစားအလိုက် သုံးစွဲမှု</h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              {dateRange.label}
            </span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            {periodData.filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <Folder className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">ဤကာလတွင် သုံးစွဲမှု မှတ်တမ်း မရှိသေးပါ</p>
              </div>
            ) : (
              <>
                <div className="h-36 sm:h-40 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={66}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'ပမာဏ']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-0.5">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">စုစုပေါင်း</span>
                    <span className="text-sm sm:text-base font-bold text-slate-800">
                      {currencySymbol}
                      {periodData.totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Categorized list */}
                <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 max-h-32 scrollbar-thin">
                  {categoryChartData.slice(0, 4).map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate text-slate-700">{entry.name}</span>
                      </div>
                      <div className="text-slate-500 flex-shrink-0 ml-2">
                        {currencySymbol}{entry.value.toLocaleString()} <span className="text-slate-400 text-[10px]">({entry.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div id="card-recent-transactions" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-semibold text-slate-900 text-sm">လတ်တလော မှတ်တမ်း</h4>
          <button
            id="dash-btn-view-all-tx"
            onClick={() => onChangeTab('transactions')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer min-h-[36px]"
          >
            အားလုံးကြည့်မည် <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div>
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <Calendar className="h-9 w-9 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">မှတ်တမ်းများ မရှိသေးပါ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <div key={`${tx.type}-${tx.id}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-bold ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {tx.type === 'income' ? <TrendingUp className="h-4.5 w-4.5" /> : <TrendingDown className="h-4.5 w-4.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{tx.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600">
                          {tx.category}
                        </span>
                        <span>•</span>
                        <span className="text-[11px]">{tx.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm sm:text-base font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {currencySymbol}
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Transfer Modal */}
      <TransferModal
        isOpen={isOpenTransferModal}
        onClose={() => setIsOpenTransferModal(false)}
        wallets={wallets}
        defaultFromWalletId={selectedFromWalletId}
        currencySymbol={currencySymbol}
        onAddTransfer={onAddTransfer}
        onShowToast={onShowToast || (() => {})}
      />
    </div>
  );
}
