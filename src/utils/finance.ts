import { Wallet, Income, Expense, Transfer, getWalletLabel } from '../types';

export interface CalculatedWallet extends Wallet {
  displayName: string;
  totalIncome: number;
  totalExpense: number;
  totalTransfersOut: number;
  totalTransfersIn: number;
  currentBalance: number;
  txCount: number;
}

/**
 * Deterministically calculates balances and transaction counts for all user wallets.
 * Current Balance = Initial Balance + Incomes - Expenses - Transfers Out + Transfers In
 */
export function calculateWalletBalances(
  wallets: Wallet[],
  incomes: Income[],
  expenses: Expense[],
  transfers: Transfer[]
): CalculatedWallet[] {
  if (!wallets || wallets.length === 0) return [];
  const defaultWallet = wallets[0];

  return wallets.map((w) => {
    const isThisDefault = defaultWallet && defaultWallet.id === w.id;

    const walletIncomes = incomes.filter(
      (inc) => inc.walletId === w.id || (isThisDefault && !inc.walletId)
    );
    const walletExpenses = expenses.filter(
      (exp) => exp.walletId === w.id || (isThisDefault && !exp.walletId)
    );
    const walletTransfersOut = transfers.filter((t) => t.fromWalletId === w.id);
    const walletTransfersIn = transfers.filter((t) => t.toWalletId === w.id);

    const totalIncome = walletIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = walletExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTransfersOut = walletTransfersOut.reduce((sum, t) => sum + t.amount, 0);
    const totalTransfersIn = walletTransfersIn.reduce((sum, t) => sum + t.amount, 0);

    const currentBalance =
      (w.initialBalance || 0) + totalIncome - totalExpense - totalTransfersOut + totalTransfersIn;

    return {
      ...w,
      displayName: getWalletLabel(w.type, w.name),
      totalIncome,
      totalExpense,
      totalTransfersOut,
      totalTransfersIn,
      currentBalance,
      txCount:
        walletIncomes.length +
        walletExpenses.length +
        walletTransfersOut.length +
        walletTransfersIn.length,
    };
  });
}

/**
 * Helper to format currency numbers consistently.
 */
export function formatCurrency(amount: number, symbol = 'Ks '): string {
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
