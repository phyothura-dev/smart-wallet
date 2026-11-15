import { lazy, Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { ResolvedTheme, ThemeMode } from '../hooks/useTheme';
import type { RouteId } from './routeConfig';
import type {
  UserProfile,
  Category,
  CategoryType,
  Wallet,
  Transfer,
  Income,
  Expense,
  Loan,
  LoanType,
  LoanRepayment,
  Budget,
  RecurringTransaction,
  SavingsGoal,
} from '../types';

const Dashboard = lazy(() => import('../components/Dashboard'));
const IncomeManager = lazy(() => import('../components/IncomeManager'));
const ExpenseManager = lazy(() => import('../components/ExpenseManager'));
const TransactionHistory = lazy(() => import('../components/TransactionHistory'));
const BudgetManager = lazy(() => import('../components/BudgetManager'));
const RecurringManager = lazy(() => import('../components/RecurringManager'));
const SavingsGoalManager = lazy(() => import('../components/SavingsGoalManager'));
const LoanManager = lazy(() => import('../components/LoanManager'));
const WalletManager = lazy(() => import('../components/WalletManager'));
const CategoryManager = lazy(() => import('../components/CategoryManager'));
const ProfileManager = lazy(() => import('../components/ProfileManager'));

function ViewLoadingSpinner() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mb-2" />
      <p className="text-xs font-semibold">{t.app.loadingPage}</p>
    </div>
  );
}

interface AppRoutesProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  profile: UserProfile | null;
  categories: Category[];
  wallets: Wallet[];
  transfers: Transfer[];
  incomes: Income[];
  expenses: Expense[];
  loans: Loan[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  savingsGoals: SavingsGoal[];
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  onChangeTheme: (theme: ThemeMode) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  // CRUD handlers
  onAddIncome: (data: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  onEditIncome: (id: string, data: Partial<Omit<Income, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onAddExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onEditExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onAddCategory: (name: string, type: CategoryType) => Promise<void>;
  onRenameCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddWallet: (data: Omit<Wallet, 'id' | 'createdAt'>) => Promise<void>;
  onEditWallet: (id: string, data: Partial<Wallet>) => Promise<void>;
  onDeleteWallet: (id: string) => Promise<void>;
  onAddTransfer: (data: Omit<Transfer, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteTransfer: (id: string) => Promise<void>;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onAddLoan: (data: { personName: string; type: LoanType; amount: number; startDate: string; dueDate?: string; walletId: string; note?: string }) => Promise<void>;
  onEditLoan: (id: string, data: { personName?: string; type?: LoanType; amount?: number; startDate?: string; dueDate?: string; walletId?: string; note?: string }) => Promise<void>;
  onDeleteLoan: (id: string) => Promise<void>;
  onAddLoanRepayment: (loanId: string, repaymentData: Omit<LoanRepayment, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteLoanRepayment: (loanId: string, repaymentId: string) => Promise<void>;
  onAddBudget: (data: { category: string; monthlyLimit: number }) => Promise<void>;
  onEditBudget: (id: string, data: { category?: string; monthlyLimit?: number }) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  onAddRecurring: (data: Omit<RecurringTransaction, 'id' | 'createdAt'>) => Promise<void>;
  onEditRecurring: (id: string, data: Partial<Omit<RecurringTransaction, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
  onRecordRecurringNow: (item: RecurringTransaction) => Promise<void>;
  onAddSavingsGoal: (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<void>;
  onEditSavingsGoal: (id: string, data: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteSavingsGoal: (id: string) => Promise<void>;
  onAddSavingsContribution: (id: string, addAmount: number) => Promise<void>;
}

export default function AppRoutes(props: AppRoutesProps) {
  const { currentRoute, onNavigate, onShowToast } = props;

  return (
    <Suspense fallback={<ViewLoadingSpinner />}>
      {currentRoute === 'dashboard' && (
        <Dashboard
          incomes={props.incomes}
          expenses={props.expenses}
          wallets={props.wallets}
          transfers={props.transfers}
          loans={props.loans}
          profile={props.profile}
          resolvedTheme={props.resolvedTheme}
          onChangeTab={(tab) => onNavigate(tab as RouteId)}
          onAddTransfer={props.onAddTransfer}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'incomes' && (
        <IncomeManager
          incomes={props.incomes}
          categories={props.categories}
          wallets={props.wallets}
          profile={props.profile}
          onAddIncome={props.onAddIncome}
          onEditIncome={props.onEditIncome}
          onDeleteIncome={props.onDeleteIncome}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'expenses' && (
        <ExpenseManager
          expenses={props.expenses}
          categories={props.categories}
          wallets={props.wallets}
          profile={props.profile}
          onAddExpense={props.onAddExpense}
          onEditExpense={props.onEditExpense}
          onDeleteExpense={props.onDeleteExpense}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'transactions' && (
        <TransactionHistory
          incomes={props.incomes}
          expenses={props.expenses}
          categories={props.categories}
          wallets={props.wallets}
          profile={props.profile}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'budgets' && (
        <BudgetManager
          budgets={props.budgets}
          categories={props.categories}
          expenses={props.expenses}
          onAddBudget={props.onAddBudget}
          onEditBudget={props.onEditBudget}
          onDeleteBudget={props.onDeleteBudget}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'recurring' && (
        <RecurringManager
          recurring={props.recurring}
          categories={props.categories}
          wallets={props.wallets}
          onAddRecurring={props.onAddRecurring}
          onEditRecurring={props.onEditRecurring}
          onDeleteRecurring={props.onDeleteRecurring}
          onRecordRecurringNow={props.onRecordRecurringNow}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'goals' && (
        <SavingsGoalManager
          goals={props.savingsGoals}
          onAddGoal={props.onAddSavingsGoal}
          onEditGoal={props.onEditSavingsGoal}
          onDeleteGoal={props.onDeleteSavingsGoal}
          onAddContribution={props.onAddSavingsContribution}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'loans' && (
        <LoanManager
          loans={props.loans}
          wallets={props.wallets}
          profile={props.profile}
          onAddLoan={props.onAddLoan}
          onEditLoan={props.onEditLoan}
          onDeleteLoan={props.onDeleteLoan}
          onAddLoanRepayment={props.onAddLoanRepayment}
          onDeleteLoanRepayment={props.onDeleteLoanRepayment}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'wallets' && (
        <WalletManager
          wallets={props.wallets}
          incomes={props.incomes}
          expenses={props.expenses}
          transfers={props.transfers}
          loans={props.loans}
          onAddWallet={props.onAddWallet}
          onEditWallet={props.onEditWallet}
          onDeleteWallet={props.onDeleteWallet}
          onAddTransfer={props.onAddTransfer}
          onDeleteTransfer={props.onDeleteTransfer}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'categories' && (
        <CategoryManager
          categories={props.categories}
          onAddCategory={props.onAddCategory}
          onRenameCategory={props.onRenameCategory}
          onDeleteCategory={props.onDeleteCategory}
          onShowToast={onShowToast}
        />
      )}

      {currentRoute === 'profile' && (
        <ProfileManager
          profile={props.profile}
          onUpdateProfile={props.onUpdateProfile}
          onShowToast={onShowToast}
          theme={props.theme}
          onChangeTheme={props.onChangeTheme}
        />
      )}
    </Suspense>
  );
}
