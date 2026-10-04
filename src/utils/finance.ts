import { Wallet, Income, Expense, Transfer, Loan, getWalletLabel } from '../types';

export interface CalculatedWallet extends Wallet {
  displayName: string;
  totalIncome: number;
  totalExpense: number;
  totalTransfersOut: number;
  totalTransfersIn: number;
  totalLentOut: number;
  totalBorrowedIn: number;
  totalRepaymentsReceived: number;
  totalRepaymentsPaid: number;
  currentBalance: number;
  txCount: number;
}

// calculate wallet balances
export function calculateWalletBalances(
  wallets: Wallet[],
  incomes: Income[],
  expenses: Expense[],
  transfers: Transfer[],
  loans: Loan[] = []
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

    // loans lent out from this wallet
    const loansLentOut = loans.filter(
      (l) => l.type === 'lent' && (l.walletId === w.id || (isThisDefault && !l.walletId))
    );
    // loans borrowed into this wallet
    const loansBorrowedIn = loans.filter(
      (l) => l.type === 'borrowed' && (l.walletId === w.id || (isThisDefault && !l.walletId))
    );

    // repayments
    let totalRepaymentsReceived = 0;
    let totalRepaymentsPaid = 0;
    let walletRepaymentsCount = 0;

    for (const loan of loans) {
      if (!loan.repayments || !Array.isArray(loan.repayments)) continue;
      for (const rep of loan.repayments) {
        const matchesWallet = rep.walletId === w.id || (isThisDefault && !rep.walletId);
        if (matchesWallet) {
          walletRepaymentsCount++;
          if (loan.type === 'lent') {
            totalRepaymentsReceived += rep.amount;
          } else {
            totalRepaymentsPaid += rep.amount;
          }
        }
      }
    }

    const totalIncome = walletIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = walletExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTransfersOut = walletTransfersOut.reduce((sum, t) => sum + t.amount, 0);
    const totalTransfersIn = walletTransfersIn.reduce((sum, t) => sum + t.amount, 0);
    const totalLentOut = loansLentOut.reduce((sum, l) => sum + l.amount, 0);
    const totalBorrowedIn = loansBorrowedIn.reduce((sum, l) => sum + l.amount, 0);

    const currentBalance =
      (w.initialBalance || 0) +
      totalIncome -
      totalExpense -
      totalTransfersOut +
      totalTransfersIn -
      totalLentOut +
      totalBorrowedIn +
      totalRepaymentsReceived -
      totalRepaymentsPaid;

    return {
      ...w,
      displayName: getWalletLabel(w.type, w.name),
      totalIncome,
      totalExpense,
      totalTransfersOut,
      totalTransfersIn,
      totalLentOut,
      totalBorrowedIn,
      totalRepaymentsReceived,
      totalRepaymentsPaid,
      currentBalance,
      txCount:
        walletIncomes.length +
        walletExpenses.length +
        walletTransfersOut.length +
        walletTransfersIn.length +
        loansLentOut.length +
        loansBorrowedIn.length +
        walletRepaymentsCount,
    };
  });
}

// format currency
export function formatCurrency(amount: number, symbol = 'Ks '): string {
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// local date string
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// current month start and end dates
export function getCurrentMonthRange(refDate: Date = new Date()): { start: string; end: string } {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: getLocalDateString(start),
    end: getLocalDateString(end),
  };
}

// check current month date
export function isDateInCurrentMonth(dateStr?: string, refDate: Date = new Date()): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  const year = refDate.getFullYear();
  const month = refDate.getMonth() + 1;
  const currentYM = `${year}-${String(month).padStart(2, '0')}`;

  if (trimmed.startsWith(currentYM)) {
    return true;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.getFullYear() === year && parsed.getMonth() + 1 === month;
  }
  return false;
}

// goal progress info
export interface GoalProgress {
  isGoalSet: boolean;
  monthlyGoal: number;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  percentage: number;
  clampedPercentage: number;
  remaining: number;
  excess: number;
  isAchieved: boolean;
}

// calculate goal progress
export function calculateGoalProgress(
  totalIncome: number,
  totalExpense: number,
  monthlyGoal: number | null | undefined
): GoalProgress {
  const goalNum = monthlyGoal !== null && monthlyGoal !== undefined ? Number(monthlyGoal) : 0;
  const incomeNum = Number(totalIncome) || 0;
  const expenseNum = Number(totalExpense) || 0;
  const netIncome = incomeNum - expenseNum;
  const isGoalSet = !isNaN(goalNum) && goalNum > 0;

  if (!isGoalSet) {
    return {
      isGoalSet: false,
      monthlyGoal: 0,
      totalIncome: incomeNum,
      totalExpense: expenseNum,
      netIncome,
      percentage: 0,
      clampedPercentage: 0,
      remaining: 0,
      excess: 0,
      isAchieved: false,
    };
  }

  const percentage = Math.round((netIncome / goalNum) * 100);
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const remaining = Math.max(0, goalNum - netIncome);
  const excess = Math.max(0, netIncome - goalNum);
  const isAchieved = netIncome >= goalNum;

  return {
    isGoalSet: true,
    monthlyGoal: goalNum,
    totalIncome: incomeNum,
    totalExpense: expenseNum,
    netIncome,
    percentage,
    clampedPercentage,
    remaining,
    excess,
    isAchieved,
  };
}
