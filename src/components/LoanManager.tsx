import React, { useState, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  Search,
  ChevronDown,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet as WalletIcon,
  X,
  User,
  Check
} from 'lucide-react';
import { Loan, LoanType, LoanStatus, LoanRepayment, Wallet, UserProfile, getWalletLabel } from '../types';
import { getLocalDateString } from '../utils/finance';

interface LoanManagerProps {
  loans: Loan[];
  wallets: Wallet[];
  profile?: UserProfile | null;
  onAddLoan: (data: Omit<Loan, 'id' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status' | 'repayments'>) => Promise<void>;
  onEditLoan: (id: string, data: { personName?: string; type?: LoanType; amount?: number; startDate?: string; dueDate?: string; walletId?: string; note?: string }) => Promise<void>;
  onDeleteLoan: (id: string) => Promise<void>;
  onAddLoanRepayment: (loanId: string, data: Omit<LoanRepayment, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteLoanRepayment: (loanId: string, repaymentId: string) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  currencySymbol?: string;
}

type TabFilter = 'all' | 'lent' | 'borrowed' | 'completed';

export default function LoanManager({
  loans = [],
  wallets = [],
  profile,
  onAddLoan,
  onEditLoan,
  onDeleteLoan,
  onAddLoanRepayment,
  onDeleteLoanRepayment,
  onShowToast,
  currencySymbol = profile?.currency ? `${profile.currency} ` : 'Ks '
}: LoanManagerProps) {
  // filter states
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');
  const [walletFilter, setWalletFilter] = useState('all');

  // loan modal state
  const [isOpenLoanModal, setIsOpenLoanModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // loan form fields
  const [personName, setPersonName] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('lent');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  // repayment modal state
  const [isOpenRepaymentModal, setIsOpenRepaymentModal] = useState(false);
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState<Loan | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentWalletId, setRepaymentWalletId] = useState('');
  const [repaymentDate, setRepaymentDate] = useState(getLocalDateString());
  const [repaymentNote, setRepaymentNote] = useState('');

  // history modal state
  const [isOpenHistoryModal, setIsOpenHistoryModal] = useState(false);
  const [selectedLoanForHistory, setSelectedLoanForHistory] = useState<Loan | null>(null);

  // delete loan confirmation
  const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null);

  // helper for wallet name
  const getWalletName = (wId?: string) => {
    if (!wId) {
      const def = wallets[0];
      return def ? getWalletLabel(def.type, def.name) : 'ပိုက်ဆံအိတ် မရှိပါ';
    }
    const found = wallets.find((w) => w.id === wId);
    return found ? getWalletLabel(found.type, found.name) : 'ပိုက်ဆံအိတ် မရှိပါ';
  };

  // overdue check
  const checkIsOverdue = (due?: string, status?: LoanStatus) => {
    if (!due || status === 'completed') return false;
    const today = getLocalDateString();
    return due < today;
  };

  // summary statistics
  const { totalLentRemaining, totalLentOriginal, totalBorrowedRemaining, totalBorrowedOriginal, activeCount, completedCount } =
    useMemo(() => {
      let lentRem = 0;
      let lentOrig = 0;
      let borrowedRem = 0;
      let borrowedOrig = 0;
      let active = 0;
      let comp = 0;

      for (const loan of loans) {
        if (loan.type === 'lent') {
          lentRem += loan.remainingAmount;
          lentOrig += loan.amount;
        } else {
          borrowedRem += loan.remainingAmount;
          borrowedOrig += loan.amount;
        }

        if (loan.status === 'completed') {
          comp++;
        } else {
          active++;
        }
      }

      return {
        totalLentRemaining: lentRem,
        totalLentOriginal: lentOrig,
        totalBorrowedRemaining: borrowedRem,
        totalBorrowedOriginal: borrowedOrig,
        activeCount: active,
        completedCount: comp,
      };
    }, [loans]);

  // filtered loans
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // tab filter
      if (activeTab === 'lent' && loan.type !== 'lent') return false;
      if (activeTab === 'borrowed' && loan.type !== 'borrowed') return false;
      if (activeTab === 'completed' && loan.status !== 'completed') return false;

      // search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = loan.personName.toLowerCase().includes(query);
        const matchesNote = loan.note ? loan.note.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesNote) return false;
      }

      // wallet filter
      if (walletFilter !== 'all' && loan.walletId !== walletFilter) {
        return false;
      }

      return true;
    });
  }, [loans, activeTab, search, walletFilter]);

  // open add loan modal
  const handleOpenAddModal = () => {
    setEditingLoan(null);
    setPersonName('');
    setLoanType('lent');
    setAmount('');
    setWalletId(wallets[0]?.id || '');
    setStartDate(getLocalDateString());
    setDueDate('');
    setNote('');
    setIsOpenLoanModal(true);
  };

  // open edit loan modal
  const handleOpenEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setPersonName(loan.personName);
    setLoanType(loan.type);
    setAmount(loan.amount.toString());
    setWalletId(loan.walletId || wallets[0]?.id || '');
    setStartDate(loan.startDate);
    setDueDate(loan.dueDate || '');
    setNote(loan.note || '');
    setIsOpenLoanModal(true);
  };

  // save loan
  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      onShowToast('လူအမည် သို့မဟုတ် အဖွဲ့အစည်းအမည် ဖြည့်သွင်းပေးပါ။', 'error');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      onShowToast('ငွေပမာဏသည် သုညထက် ကြီးရပါမည်။', 'error');
      return;
    }
    if (!walletId && wallets.length > 0) {
      onShowToast('ပိုက်ဆံအိတ် ရွေးချယ်ပေးပါ။', 'error');
      return;
    }

    if (editingLoan && parsedAmount < editingLoan.paidAmount) {
      onShowToast(`ငွေပမာဏသည် ပြန်ဆပ်ပြီးငွေ (${currencySymbol}${editingLoan.paidAmount.toLocaleString()}) ထက် မနည်းရပါ။`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingLoan) {
        await onEditLoan(editingLoan.id, {
          personName,
          type: loanType,
          amount: parsedAmount,
          startDate,
          dueDate: dueDate || undefined,
          walletId: walletId || wallets[0]?.id || '',
          note: note || undefined,
        });
        onShowToast('ချေးငွေ အချက်အလက်ကို ပြင်ဆင်ပြီးပါပြီ။', 'success');
      } else {
        await onAddLoan({
          personName,
          type: loanType,
          amount: parsedAmount,
          startDate,
          dueDate: dueDate || undefined,
          walletId: walletId || wallets[0]?.id || '',
          note: note || undefined,
        });
        onShowToast('ချေးငွေ မှတ်တမ်းအသစ် ထည့်သွင်းပြီးပါပြီ။', 'success');
      }
      setIsOpenLoanModal(false);
    } catch {
      onShowToast('လုပ်ဆောင်မှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားကြည့်ပါ။', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // confirm delete loan
  const handleConfirmDeleteLoan = async () => {
    if (!deletingLoanId) return;
    try {
      await onDeleteLoan(deletingLoanId);
      onShowToast('ချေးငွေ မှတ်တမ်းကို ဖျက်ပစ်ပြီးပါပြီ။', 'success');
    } catch {
      onShowToast('ဖျက်ပစ်ရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။', 'error');
    } finally {
      setDeletingLoanId(null);
    }
  };

  // open repayment modal
  const handleOpenRepaymentModal = (loan: Loan) => {
    setSelectedLoanForRepayment(loan);
    setRepaymentAmount('');
    setRepaymentWalletId(loan.walletId || wallets[0]?.id || '');
    setRepaymentDate(getLocalDateString());
    setRepaymentNote('');
    setIsOpenRepaymentModal(true);
  };

  // submit repayment
  const handleSubmitRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRepayment) return;

    const parsedRepay = parseFloat(repaymentAmount);
    if (isNaN(parsedRepay) || parsedRepay <= 0) {
      onShowToast('ပြန်ဆပ်မည့် ပမာဏသည် သုညထက် ကြီးရပါမည်။', 'error');
      return;
    }

    if (parsedRepay > selectedLoanForRepayment.remainingAmount) {
      onShowToast(`ပြန်ဆပ်မည့် ပမာဏသည် ကျန်ငွေ (${currencySymbol}${selectedLoanForRepayment.remainingAmount.toLocaleString()}) ထက် မကျော်ရပါ။`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddLoanRepayment(selectedLoanForRepayment.id, {
        amount: parsedRepay,
        date: repaymentDate,
        walletId: repaymentWalletId || selectedLoanForRepayment.walletId,
        note: repaymentNote || undefined,
      });
      onShowToast('ပြန်ဆပ်မှု မှတ်တမ်းကို အောင်မြင်စွာ မှတ်သားပြီးပါပြီ။', 'success');
      setIsOpenRepaymentModal(false);
    } catch {
      onShowToast('ပြန်ဆပ်မှု ထည့်သွင်းရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // open history modal
  const handleOpenHistoryModal = (loan: Loan) => {
    setSelectedLoanForHistory(loan);
    setIsOpenHistoryModal(true);
  };

  // delete repayment item
  const handleDeleteRepaymentItem = async (repaymentId: string) => {
    if (!selectedLoanForHistory) return;
    try {
      await onDeleteLoanRepayment(selectedLoanForHistory.id, repaymentId);
      onShowToast('ပြန်ဆပ်မှတ်တမ်းကို ပယ်ဖျက်ပြီးပါပြီ။', 'success');
      // update local preview state
      const updatedList = (selectedLoanForHistory.repayments || []).filter((r) => r.id !== repaymentId);
      setSelectedLoanForHistory({
        ...selectedLoanForHistory,
        repayments: updatedList,
      });
    } catch {
      onShowToast('ပယ်ဖျက်ရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Lent (Receivable) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ရရန်ရှိ</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight">
              {currencySymbol}{totalLentRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Total Borrowed (Payable) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ပေးရန်ရှိ</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold text-amber-600 tracking-tight">
              {currencySymbol}{totalBorrowedRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Active vs Completed count */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ဆပ်ရန်ကျန်</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB] border border-blue-100">
              <HandCoins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {activeCount} <span className="text-sm font-medium text-slate-500">ခု</span>
            </div>
            {completedCount > 0 && (
              <span className="text-[11px] font-medium text-slate-400">
                (ကြေအေးပြီး {completedCount})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
          <h3 className="font-semibold text-slate-800 text-sm">ချေးငွေနှင့် အကြွေးများ</h3>
          <button
            id="btn-open-add-loan"
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 sm:px-3.5 sm:py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-all focus:outline-none cursor-pointer w-full sm:w-auto min-h-[40px] sm:min-h-0"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span>+ အသစ်ထည့်မည်</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="border-b border-slate-100 px-4 sm:px-6 pb-4 sm:pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg sm:col-span-2 lg:col-span-5 overflow-x-auto scrollbar-none">
              {(
                [
                  { id: 'all', label: 'အားလုံး' },
                  { id: 'lent', label: 'ရရန်ရှိ' },
                  { id: 'borrowed', label: 'ပေးရန်ရှိ' },
                  { id: 'completed', label: 'ကြေအေးပြီး' },
                ] as { id: TabFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[64px] py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                    activeTab === tab.id
                      ? 'bg-white text-[#2563EB] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className={`relative ${wallets.length > 0 ? 'lg:col-span-4' : 'lg:col-span-7'}`}>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="loan-search-input"
                type="text"
                placeholder="ရှာဖွေပါ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs font-medium transition-all"
              />
            </div>

            {/* Wallet Filter */}
            {wallets.length > 0 && (
              <div className="relative lg:col-span-3">
                <select
                  id="loan-filter-wallet"
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
          </div>
        </div>

        {/* Content Section */}
        {loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
              <HandCoins className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">မှတ်တမ်း မရှိသေးပါ</h4>

          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">မှတ်တမ်း မတွေ့ပါ</h4>
            <button
              id="btn-reset-loan-filters"
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSearch('');
                setWalletFilter('all');
              }}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              စစ်ထုတ်မှု ရှင်းလင်းမည်
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <th className="py-3 px-6">အမည် / မှတ်ချက်</th>
                    <th className="py-3 px-4">အမျိုးအစား</th>
                    <th className="py-3 px-4">ပိုက်ဆံအိတ်</th>
                    <th className="py-3 px-4 text-right">ပမာဏ</th>
                    <th className="py-3 px-4">ဆပ်ပြီး / ကျန်ငွေ</th>
                    <th className="py-3 px-4">သတ်မှတ်ရက်</th>
                    <th className="py-3 px-4 text-center">အခြေအနေ</th>
                    <th className="py-3 px-6 text-right">လုပ်ဆောင်ချက်</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredLoans.map((loan) => {
                    const overdue = checkIsOverdue(loan.dueDate, loan.status);
                    const percent = loan.amount > 0 ? Math.min(100, Math.round((loan.paidAmount / loan.amount) * 100)) : 0;

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Person Name & Note */}
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loan.personName}</span>
                          </div>
                          {loan.note && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {loan.note}
                            </p>
                          )}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {loan.type === 'lent' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> ရရန်ရှိ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                              <ArrowUpRight className="w-3 h-3 text-amber-600" /> ပေးရန်ရှိ
                            </span>
                          )}
                        </td>

                        {/* Wallet */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            <WalletIcon className="w-3 h-3 text-slate-400" />
                            {getWalletName(loan.walletId)}
                          </span>
                        </td>

                        {/* Original Amount */}
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                          {currencySymbol}{loan.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Repaid Progress */}
                        <td className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">
                          <div className="flex justify-between items-center text-[11px] mb-1 font-medium">
                            <span className="text-slate-500">ဆပ်ပြီး: {currencySymbol}{loan.paidAmount.toLocaleString()}</span>
                            <span className="font-bold text-slate-700">{percent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                loan.status === 'completed'
                                  ? 'bg-emerald-500'
                                  : loan.type === 'lent'
                                  ? 'bg-blue-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            ကျန်ငွေ: <span className="font-semibold text-slate-700">{currencySymbol}{loan.remainingAmount.toLocaleString()}</span>
                          </p>
                        </td>

                        {/* Due Date & Overdue Tag */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {loan.dueDate ? (
                            <div className="space-y-0.5">
                              <span className="text-slate-700 text-[11px] font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {loan.dueDate}
                              </span>
                              {overdue && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  <AlertCircle className="w-2.5 h-2.5" /> ရက်လွန်နေပြီ
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">မသတ်မှတ်ထားပါ</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {loan.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> ကြေအေးပြီး
                            </span>
                          ) : loan.status === 'partial' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                              <Clock className="w-3 h-3" /> တစ်စိတ်တစ်ပိုင်း
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                              <Clock className="w-3 h-3" /> ဆပ်ရန်ကျန်
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Add Repayment Button */}
                            {loan.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleOpenRepaymentModal(loan)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                                title="ပြန်ဆပ်မှတ်တမ်း ထည့်မည်"
                              >
                                {loan.type === 'lent' ? 'လက်ခံမည်' : 'ဆပ်မည်'}
                              </button>
                            )}

                            {/* View History */}
                            <button
                              type="button"
                              onClick={() => handleOpenHistoryModal(loan)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                              title="ပြန်ဆပ်မှတ်တမ်းများ ကြည့်မည်"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(loan)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                              title="ပြင်ဆင်မည်"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeletingLoanId(loan.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ဖျက်ပစ်မည်"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredLoans.map((loan) => {
                const overdue = checkIsOverdue(loan.dueDate, loan.status);
                const percent = loan.amount > 0 ? Math.min(100, Math.round((loan.paidAmount / loan.amount) * 100)) : 0;

                return (
                  <div key={loan.id} className="p-4 space-y-3">
                    {/* Top Row: Person & Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{loan.personName}</span>
                        </h4>
                        {loan.note && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{loan.note}</p>
                        )}
                      </div>
                      <div>
                        {loan.type === 'lent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <ArrowDownLeft className="w-2.5 h-2.5" /> ရရန်ရှိ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <ArrowUpRight className="w-2.5 h-2.5" /> ပေးရန်ရှိ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Info: Amount & Progress */}
                    <div className="bg-slate-50/80 rounded-lg p-3 space-y-2 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">မူလငွေ: {currencySymbol}{loan.amount.toLocaleString()}</span>
                        <span className="font-bold text-slate-900">
                          ကျန်ငွေ: {currencySymbol}{loan.remainingAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            loan.status === 'completed'
                              ? 'bg-emerald-500'
                              : loan.type === 'lent'
                              ? 'bg-blue-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>ဆပ်ပြီး: {currencySymbol}{loan.paidAmount.toLocaleString()}</span>
                        <span className="font-semibold text-slate-700">{percent}%</span>
                      </div>
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <WalletIcon className="w-3 h-3 text-slate-400" />
                          <span>{getWalletName(loan.walletId)}</span>
                        </div>
                        {loan.dueDate && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>သတ်မှတ်ရက်: {loan.dueDate}</span>
                            {overdue && <span className="text-rose-600 font-bold">(ရက်လွန်)</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {loan.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRepaymentModal(loan)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors cursor-pointer"
                          >
                            {loan.type === 'lent' ? 'လက်ခံမည်' : 'ဆပ်မည်'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenHistoryModal(loan)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="မှတ်တမ်း"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(loan)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="ပြင်ဆင်မည်"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingLoanId(loan.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="ဖျက်မည်"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Loan Modal */}
      {isOpenLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingLoan ? 'ချေးငွေ ပြင်ဆင်မည်' : 'ချေးငွေ အသစ်ထည့်မည်'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenLoanModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLoan} className="mt-4 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">အမျိုးအစား</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoanType('lent')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      loanType === 'lent'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>ရရန်ရှိ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanType('borrowed')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      loanType === 'borrowed'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>ပေးရန်ရှိ</span>
                  </button>
                </div>
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  လူအမည် <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="အမည်..."
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ငွေပမာဏ ({currencySymbol.trim()}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Wallet Select */}
              {wallets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ပိုက်ဆံအိတ် <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    required
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {getWalletLabel(w.type, w.name)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ရက်စွဲ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    သတ်မှတ်ရက်
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">မှတ်ချက်</label>
                <input
                  type="text"
                  placeholder="မှတ်ချက်..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenLoanModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'သိမ်းဆည်းနေသည်...' : 'သိမ်းဆည်းမည်'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment Modal */}
      {isOpenRepaymentModal && selectedLoanForRepayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {selectedLoanForRepayment.type === 'lent' ? 'ငွေလက်ခံမည်' : 'ငွေဆပ်မည်'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenRepaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Loan Card Banner */}
            <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800">{selectedLoanForRepayment.personName}</span>
                <span className="text-slate-500">မူလ: {currencySymbol}{selectedLoanForRepayment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                <span className="text-slate-600">ကျန်ရှိငွေ:</span>
                <span className="font-bold text-blue-600 text-sm">
                  {currencySymbol}{selectedLoanForRepayment.remainingAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitRepayment} className="mt-4 space-y-4">
              {/* Repayment Amount */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    ပမာဏ ({currencySymbol.trim()}) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setRepaymentAmount(selectedLoanForRepayment.remainingAmount.toString())}
                    className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    အပြည့်ဆပ်မည်
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  max={selectedLoanForRepayment.remainingAmount}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Wallet Select */}
              {wallets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ပိုက်ဆံအိတ် <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={repaymentWalletId}
                    onChange={(e) => setRepaymentWalletId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    required
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {getWalletLabel(w.type, w.name)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ရက်စွဲ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={repaymentDate}
                  onChange={(e) => setRepaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  required
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">မှတ်ချက်</label>
                <input
                  type="text"
                  placeholder="မှတ်ချက်..."
                  value={repaymentNote}
                  onChange={(e) => setRepaymentNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenRepaymentModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'သိမ်းဆည်းနေသည်...' : selectedLoanForRepayment.type === 'lent' ? 'လက်ခံမည်' : 'ဆပ်မည်'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment History Modal */}
      {isOpenHistoryModal && selectedLoanForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">ပြန်ဆပ်မှတ်တမ်း</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedLoanForHistory.personName} ({selectedLoanForHistory.type === 'lent' ? 'ရရန်ရှိ' : 'ပေးရန်ရှိ'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Repayments List */}
            <div className="mt-4 max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {!selectedLoanForHistory.repayments || selectedLoanForHistory.repayments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  မှတ်တမ်း မရှိသေးပါ။
                </div>
              ) : (
                selectedLoanForHistory.repayments.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {currencySymbol}{rep.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {rep.date}
                        </span>
                        <span>•</span>
                        <span>{getWalletName(rep.walletId)}</span>
                      </div>
                      {rep.note && (
                        <p className="text-[11px] text-slate-500 mt-1 italic">"{rep.note}"</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRepaymentItem(rep.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="ဤပြန်ဆပ်မှုကို ပယ်ဖျက်မည်"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpenHistoryModal(false)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLoanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">ဖျက်ပစ်မည်လား?</h4>
            <p className="text-xs text-slate-500 mt-1.5">
              ဤချေးငွေမှတ်တမ်းကို အပြီးတိုင် ဖျက်ပစ်ပါမည်။
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingLoanId(null)}
                className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLoan}
                className="flex-1 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
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
