import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Building2,
  Wallet as WalletIcon,
  Banknote,
  Coins,
  Plus,
  Edit3,
  Trash2,
  ArrowRightLeft,
  ArrowRight,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  X
} from 'lucide-react';
import { Wallet, WalletType, Income, Expense, Transfer, Loan, getWalletLabel, WALLET_TYPE_LABELS } from '../types';
import { calculateWalletBalances } from '../utils/finance';
import TransferModal from './TransferModal';

interface WalletManagerProps {
  wallets: Wallet[];
  incomes: Income[];
  expenses: Expense[];
  transfers?: Transfer[];
  loans?: Loan[];
  onAddWallet: (data: Omit<Wallet, 'id' | 'createdAt'>) => Promise<void>;
  onEditWallet: (id: string, data: Partial<Wallet>) => Promise<void>;
  onDeleteWallet: (id: string) => Promise<void>;
  onAddTransfer?: (data: Omit<Transfer, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteTransfer?: (id: string) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  currencySymbol?: string;
}

export const SUPPORTED_WALLET_TYPES: { id: WalletType; label: string }[] = [
  { id: 'cash', label: 'ငွေသား (Cash)' },
  { id: 'kbz_pay', label: 'KBZPay' },
  { id: 'wave_pay', label: 'WavePay' },
  { id: 'aya_pay', label: 'AYA Pay' },
  { id: 'cb_pay', label: 'CBPay' },
  { id: 'uab_pay', label: 'UAB Pay' },
  { id: 'kbz_bank', label: 'KBZ Banking' },
  { id: 'aya_bank', label: 'AYA Banking' },
  { id: 'cb_bank', label: 'CB Banking' },
  { id: 'uab_bank', label: 'UAB Banking' },
  { id: 'yoma_bank', label: 'Yoma Bank' },
  { id: 'mab_bank', label: 'MAB Bank' },
  { id: 'a_bank', label: 'A Bank' },
  { id: 'mcb_bank', label: 'MCB Bank' },
  { id: 'custom', label: 'အခြား (Custom)' },
];

export function getWalletIcon(type: string) {
  switch (type) {
    case 'cash':
      return Banknote;
    case 'kbz_pay':
    case 'wave_pay':
    case 'cb_pay':
    case 'aya_pay':
    case 'uab_pay':
      return Smartphone;
    case 'kbz_bank':
    case 'aya_bank':
    case 'cb_bank':
    case 'uab_bank':
    case 'yoma_bank':
    case 'mab_bank':
    case 'a_bank':
    case 'mcb_bank':
      return Building2;
    case 'custom':
      return Coins;
    default:
      return WalletIcon;
  }
}

export function getWalletTypeLabel(type: string, fallbackName?: string) {
  return getWalletLabel(type, fallbackName);
}

export default function WalletManager({
  wallets,
  incomes,
  expenses,
  transfers = [],
  loans = [],
  onAddWallet,
  onEditWallet,
  onDeleteWallet,
  onAddTransfer,
  onDeleteTransfer,
  onShowToast,
  currencySymbol = 'Ks '
}: WalletManagerProps) {
  // wallet modal state
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // form fields
  const [type, setType] = useState<WalletType>('cash');
  const [walletName, setWalletName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');

  // transfer modal state
  const [isOpenTransferModal, setIsOpenTransferModal] = useState(false);
  const [selectedTransferFromId, setSelectedTransferFromId] = useState<string | undefined>(undefined);
  const [deletingTransferId, setDeletingTransferId] = useState<string | null>(null);

  const getWalletNameById = (id: string) => {
    const found = wallets.find((w) => w.id === id);
    if (!found) return 'အမည်မသိ';
    return getWalletLabel(found.type, found.name);
  };

  // wallet balances
  const walletStats = useMemo(() => {
    return calculateWalletBalances(wallets, incomes, expenses, transfers, loans);
  }, [wallets, incomes, expenses, transfers, loans]);

  const totalAssets = useMemo(() => {
    return walletStats.reduce((sum, w) => sum + w.currentBalance, 0);
  }, [walletStats]);

  // sort transfers
  const sortedTransfers = useMemo(() => {
    return [...transfers].sort((a, b) => {
      const d = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (d !== 0) return d;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [transfers]);

  // unused wallet types
  const unusedTypes = useMemo(() => {
    const used = wallets.map((w) => w.type);
    return SUPPORTED_WALLET_TYPES.filter((t) => t.id === 'custom' || !used.includes(t.id));
  }, [wallets]);

  const openAddModal = () => {
    if (unusedTypes.length === 0) {
      onShowToast('ပိုက်ဆံအိတ် အမျိုးအစား အားလုံး ထည့်သွင်းပြီးဖြစ်ပါသည်။', 'info');
      return;
    }
    setType(unusedTypes[0]?.id || 'cash');
    setWalletName('');
    setInitialBalance('0');
    setEditingId(null);
    setIsOpenModal(true);
  };

  const openEditModal = (w: Wallet) => {
    setType(w.type);
    setWalletName(w.name || '');
    setInitialBalance((w.initialBalance || 0).toString());
    setEditingId(w.id);
    setIsOpenModal(true);
  };

  const openTransferModal = (defaultFromId?: string) => {
    setSelectedTransferFromId(defaultFromId);
    setIsOpenTransferModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedInitial = parseFloat(initialBalance);
    if (isNaN(parsedInitial) || parsedInitial < 0) {
      onShowToast('စတင်လက်ကျန်ငွေသည် သုည သို့မဟုတ် အပေါင်းကိန်း ဖြစ်ရပါမည်။', 'error');
      return;
    }

    if (!editingId && type !== 'custom' && wallets.some((w) => w.type === type)) {
      onShowToast('ဤပိုက်ဆံအိတ် အမျိုးအစား ထည့်သွင်းပြီးဖြစ်ပါသည်။', 'error');
      return;
    }

    const trimmedName = type === 'custom' ? walletName.trim() : '';
    if (type === 'custom' && !trimmedName) {
      onShowToast('အခြား ပိုက်ဆံအိတ်အတွက် အမည်ထည့်သွင်းပေးပါ။', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onEditWallet(editingId, {
          initialBalance: parsedInitial,
          ...(type === 'custom' ? { name: trimmedName } : {}),
        });
        onShowToast('ပိုက်ဆံအိတ်ကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။', 'success');
      } else {
        await onAddWallet({
          type,
          initialBalance: parsedInitial,
          ...(type === 'custom' ? { name: trimmedName } : {}),
        });
        onShowToast('ပိုက်ဆံအိတ်အသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။', 'success');
      }
      setIsOpenModal(false);
    } catch {
      onShowToast('လုပ်ဆောင်မှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    if (wallets.length <= 1) {
      onShowToast('အနည်းဆုံး ပိုက်ဆံအိတ်တစ်ခု ရှိရပါမည်။', 'error');
      setDeletingId(null);
      return;
    }

    setIsSubmitting(true);
    try {
      await onDeleteWallet(deletingId);
      onShowToast('ပိုက်ဆံအိတ်ကို အောင်မြင်စွာ ဖျက်ပြီးပါပြီ။', 'info');
      setDeletingId(null);
    } catch {
      onShowToast('ဖျက်ပစ်ခြင်း မအောင်မြင်ပါ။', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransferConfirm = async () => {
    if (!deletingTransferId || !onDeleteTransfer) return;
    setIsSubmitting(true);
    try {
      await onDeleteTransfer(deletingTransferId);
      onShowToast('ငွေလွှဲမှတ်တမ်းကို ဖျက်ပြီးပါပြီ။', 'info');
      setDeletingTransferId(null);
    } catch {
      onShowToast('ဖျက်ပစ်ခြင်း မအောင်မြင်ပါ။', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* overview card */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              လက်ကျန်ငွေ
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
              {currencySymbol}{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-blue-200/80 mt-1">
              ပိုက်ဆံအိတ် {wallets.length} ခု
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {wallets.length >= 2 && onAddTransfer && (
              <button
                id="btn-transfer-top"
                onClick={() => openTransferModal()}
                className="flex items-center justify-center gap-2 bg-blue-700/80 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl border border-blue-500/30 transition-all text-sm cursor-pointer shadow-xs"
              >
                <ArrowRightLeft className="w-4 h-4" />
                ငွေလွှဲမည်
              </button>
            )}

            {unusedTypes.length > 0 && (
              <button
                id="btn-add-wallet-top"
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 bg-white text-blue-950 hover:bg-blue-50 font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + အသစ်ထည့်မည်
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {walletStats.map((w) => {
          const IconComp = getWalletIcon(w.type);

          return (
            <div
              key={w.id}
              className="bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all p-5 flex flex-col justify-between shadow-2xs group"
            >
              <div>
                {/* Header row: Icon, Type Name & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-700 border border-blue-100">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-base truncate">{w.displayName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        စတင်ငွေ: {currencySymbol}{w.initialBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    {wallets.length >= 2 && onAddTransfer && (
                      <button
                        onClick={() => openTransferModal(w.id)}
                        title="ဤအကောင့်မှ ငွေလွှဲမည်"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      id={`btn-edit-wallet-${w.id}`}
                      onClick={() => openEditModal(w)}
                      title="ပြင်ဆင်မည်"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {wallets.length > 1 && (
                      <button
                        id={`btn-delete-wallet-${w.id}`}
                        onClick={() => setDeletingId(w.id)}
                        title="ဖျက်မည်"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Balance display */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    လက်ကျန်ငွေ
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {currencySymbol}{w.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer mini stats */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1 text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">+{currencySymbol}{w.totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-rose-600 justify-end">
                  <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">-{currencySymbol}{w.totalExpense.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Transfers Section */}
      {transfers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">မကြာသေးမီက ငွေလွှဲမှတ်တမ်းများ</h3>
            </div>
            <span className="text-xs text-slate-400">စုစုပေါင်း {transfers.length} ခု</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sortedTransfers.map((t) => {
              const fromName = getWalletNameById(t.fromWalletId);
              const toName = getWalletNameById(t.toWalletId);

              return (
                <div key={t.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
                        {fromName}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                        {toName}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">• {t.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-bold text-slate-900 text-sm">
                      {currencySymbol}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {onDeleteTransfer && (
                      <button
                        onClick={() => setDeletingTransferId(t.id)}
                        title="ငွေလွှဲမှတ်တမ်း ဖျက်မည်"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Wallet Modal */}
      {isOpenModal && (
        <div
          id="modal-wallet-form"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'ပိုက်ဆံအိတ် ပြင်ဆင်မည်' : 'ပိုက်ဆံအိတ် အသစ်ထည့်မည်'}
              </h3>
              <button
                id="btn-close-wallet-modal"
                onClick={() => setIsOpenModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Wallet Type */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  အမျိုးအစား *
                </label>
                {editingId ? (
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold cursor-not-allowed">
                    <span>{getWalletTypeLabel(type)}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      (ပြင်ဆင်၍မရပါ)
                    </span>
                  </div>
                ) : (
                  <select
                    id="select-wallet-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as WalletType)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                  >
                    {unusedTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Custom Wallet Name (only shown if type is 'custom') */}
              {type === 'custom' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    စိတ်ကြိုက်အမည် *
                  </label>
                  <input
                    id="input-wallet-custom-name"
                    type="text"
                    required
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder="အမည်..."
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              )}

              {/* Initial Balance */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  စတင်လက်ကျန်ငွေ ({currencySymbol.trim()}) *
                </label>
                <input
                  id="input-wallet-initial-balance"
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  id="btn-submit-wallet"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'သိမ်းဆည်းနေသည်...' : editingId ? 'ပြင်ဆင်မည်' : 'ထည့်သွင်းမည်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isOpenTransferModal}
        onClose={() => setIsOpenTransferModal(false)}
        wallets={wallets}
        defaultFromWalletId={selectedTransferFromId}
        currencySymbol={currencySymbol}
        onAddTransfer={onAddTransfer}
        onShowToast={onShowToast}
      />

      {/* Delete Wallet Confirmation Modal */}
      {deletingId && (
        <div
          id="modal-delete-wallet"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">ပိုက်ဆံအိတ် ဖျက်မည်လား?</h4>
              <p className="text-xs text-slate-500 mt-1">
                ဤပိုက်ဆံအိတ်ကို ဖျက်ပစ်ပါမည်။
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                id="btn-cancel-delete-wallet"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                id="btn-confirm-delete-wallet"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'ဖျက်နေသည်...' : 'ဖျက်မည်'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Transfer Confirmation Modal */}
      {deletingTransferId && (
        <div
          id="modal-delete-transfer"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">ငွေလွှဲမှတ်တမ်း ဖျက်မည်လား?</h4>
              <p className="text-xs text-slate-500 mt-1">
                ဤငွေလွှဲမှတ်တမ်းကို ဖျက်ပစ်ပါမည်။
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                id="btn-cancel-delete-transfer"
                onClick={() => setDeletingTransferId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                id="btn-confirm-delete-transfer"
                onClick={handleDeleteTransferConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'ဖျက်နေသည်...' : 'ဖျက်မည်'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
