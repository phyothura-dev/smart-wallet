import React, { useState, useEffect } from "react";
import { ArrowRightLeft, X } from "lucide-react";
import { Wallet, Transfer, getWalletLabel } from "../types";
import { getLocalDateString } from "../utils/finance";
import { useLanguage } from "../contexts/LanguageContext";
import CustomSelect from "./CustomSelect";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  defaultFromWalletId?: string;
  currencySymbol?: string;
  onAddTransfer?: (data: Omit<Transfer, "id" | "createdAt">) => Promise<void>;
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  wallets,
  defaultFromWalletId,
  currencySymbol = "Ks ",
  onAddTransfer,
  onShowToast,
}: TransferModalProps) {
  const { t } = useLanguage();
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(getLocalDateString());
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const from = defaultFromWalletId || wallets[0]?.id || "";
      const to = wallets.find((w) => w.id !== from)?.id || "";
      setTransferFrom(from);
      setTransferTo(to);
      setTransferAmount("");
      setTransferDate(getLocalDateString());
    }
  }, [isOpen, defaultFromWalletId, wallets]);

  if (!isOpen) return null;

  const getWalletNameById = (id: string) => {
    const found = wallets.find((w) => w.id === id);
    if (!found) return "အမည်မသိ";
    return getWalletLabel(found.type, found.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddTransfer) return;

    if (!transferFrom || !transferTo) {
      onShowToast(t.records.fillRequired, "error");
      return;
    }
    if (transferFrom === transferTo) {
      onShowToast(t.wallets.sameWalletError, "error");
      return;
    }
    const parsedAmount = parseFloat(transferAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      onShowToast(t.records.invalidAmount, "error");
      return;
    }
    if (!transferDate) {
      onShowToast(t.records.fillRequired, "error");
      return;
    }

    setIsTransferring(true);
    try {
      await onAddTransfer({
        fromWalletId: transferFrom,
        toWalletId: transferTo,
        amount: parsedAmount,
        date: transferDate,
      });
      onShowToast(t.wallets.transferSuccess, "success");
      onClose();
    } catch {
      onShowToast(t.records.actionError, "error");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div
      id="modal-transfer-form"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.wallets.transferTitle}
            </h3>
          </div>
          <button
            id="btn-close-transfer-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* from wallet */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t.wallets.fromWallet} *
            </label>
            <CustomSelect
              id="select-transfer-from"
              value={transferFrom}
              onChange={(newFrom) => {
                setTransferFrom(newFrom);
                if (newFrom === transferTo) {
                  const other = wallets.find((w) => w.id !== newFrom);
                  if (other) setTransferTo(other.id);
                }
              }}
              options={wallets.map((w) => ({
                value: w.id,
                label: getWalletNameById(w.id),
              }))}
            />
          </div>

          {/* to wallet */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t.wallets.toWallet} *
            </label>
            <CustomSelect
              id="select-transfer-to"
              value={transferTo}
              onChange={setTransferTo}
              options={wallets
                .filter((w) => w.id !== transferFrom)
                .map((w) => ({
                  value: w.id,
                  label: getWalletNameById(w.id),
                }))}
            />
          </div>

          {/* amount */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t.wallets.transferAmount} ({currencySymbol.trim()}) *
            </label>
            <input
              id="input-transfer-amount"
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800"
            />
          </div>

          {/* date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t.wallets.transferDate} *
            </label>
            <input
              id="input-transfer-date"
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 cursor-pointer"
            />
          </div>

          {/* buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              id="btn-submit-transfer"
              type="submit"
              disabled={isTransferring}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {isTransferring ? t.common.saving : t.wallets.transferSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
