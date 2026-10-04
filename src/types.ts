export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  photoURL: string;
  currency: string;
  monthlyIncomeGoal: number | null;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

export type WalletType =
  | 'cash'
  | 'kbz_pay'
  | 'wave_pay'
  | 'aya_pay'
  | 'cb_pay'
  | 'uab_pay'
  | 'kbz_bank'
  | 'aya_bank'
  | 'cb_bank'
  | 'uab_bank'
  | 'yoma_bank'
  | 'mab_bank'
  | 'a_bank'
  | 'mcb_bank'
  | 'custom';

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  cash: 'ငွေသား (Cash)',
  kbz_pay: 'KBZPay',
  wave_pay: 'WavePay',
  aya_pay: 'AYA Pay',
  cb_pay: 'CBPay',
  uab_pay: 'UAB Pay',
  kbz_bank: 'KBZ Banking',
  aya_bank: 'AYA Banking',
  cb_bank: 'CB Banking',
  uab_bank: 'UAB Banking',
  yoma_bank: 'Yoma Bank',
  mab_bank: 'MAB Bank',
  a_bank: 'A Bank',
  mcb_bank: 'MCB Bank',
  custom: 'အခြား (Custom)',
};

export function getWalletLabel(type: string, fallbackName?: string): string {
  if (fallbackName && fallbackName.trim()) {
    return fallbackName;
  }
  if (type in WALLET_TYPE_LABELS) {
    return WALLET_TYPE_LABELS[type as WalletType];
  }
  return fallbackName || type;
}

export interface Wallet {
  id: string;
  type: WalletType;
  initialBalance: number;
  name?: string;
  createdAt: string;
}

export interface Transfer {
  id: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  date: string; // 'YYYY-MM-DD'
  createdAt: string;
}

export interface Income {
  id: string;
  title: string;
  amount: number;
  category: string; // Stored as name or ID, we will store category name for stability and custom entries
  date: string; // 'YYYY-MM-DD'
  walletId?: string;
  note?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // 'YYYY-MM-DD'
  walletId?: string;
  note?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  category: string;
  date: string;
  walletId?: string;
  note?: string;
  createdAt: string;
}

export type LoanType = 'lent' | 'borrowed'; // lent = ရရန်ရှိ, borrowed = ပေးရန်ရှိ
export type LoanStatus = 'pending' | 'partial' | 'completed'; // ဆပ်ရန်ကျန်, တစ်စိတ်တစ်ပိုင်းဆပ်ပြီး, အကြွေးကြေပြီး

export interface LoanRepayment {
  id: string;
  amount: number;
  date: string; // 'YYYY-MM-DD'
  walletId: string;
  note?: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  personName: string;
  type: LoanType;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: string; // 'YYYY-MM-DD'
  dueDate?: string; // 'YYYY-MM-DD'
  walletId: string;
  status: LoanStatus;
  note?: string;
  repayments: LoanRepayment[];
  createdAt: string;
}

