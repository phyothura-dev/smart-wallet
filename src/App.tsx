import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useUserData } from './hooks/useUserData';
import { usePWA } from './hooks/usePWA';

// layout components
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ToastContainer, Toast } from './components/Toast';

import { RefreshCw } from 'lucide-react';
import { isDateInCurrentMonth } from './utils/finance';

// lazy view components
const Dashboard = lazy(() => import('./components/Dashboard'));
const IncomeManager = lazy(() => import('./components/IncomeManager'));
const ExpenseManager = lazy(() => import('./components/ExpenseManager'));
const WalletManager = lazy(() => import('./components/WalletManager'));
const CategoryManager = lazy(() => import('./components/CategoryManager'));
const TransactionHistory = lazy(() => import('./components/TransactionHistory'));
const ProfileManager = lazy(() => import('./components/ProfileManager'));
const LoanManager = lazy(() => import('./components/LoanManager'));

function ViewLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
      <p className="text-xs font-semibold">စာမျက်နှာ ဖွင့်နေပါသည်...</p>
    </div>
  );
}

export default function App() {
  // auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // navigation state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // pwa state
  const { isInstallable, isOnline, isUpdateAvailable, installApp, updateApp } = usePWA();

  // toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handleShowToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const handleCloseToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // auth listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // user data hook
  const {
    profile,
    categories,
    wallets,
    transfers,
    incomes,
    expenses,
    loans,
    dataLoading,
    dbError,
    handleAddIncome,
    handleEditIncome,
    handleDeleteIncome,
    handleAddExpense,
    handleEditExpense,
    handleDeleteExpense,
    handleAddCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleAddWallet,
    handleEditWallet,
    handleDeleteWallet,
    handleAddTransfer,
    handleDeleteTransfer,
    handleUpdateProfile,
    handleAddLoan,
    handleEditLoan,
    handleDeleteLoan,
    handleAddLoanRepayment,
    handleDeleteLoanRepayment,
  } = useUserData(user);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      handleShowToast('အကောင့်မှ အောင်မြင်စွာ ထွက်ပြီးပါပြီ။', 'info');
      setCurrentTab('dashboard');
    } catch {
      handleShowToast('အကောင့်မှ ထွက်ခြင်း မအောင်မြင်ပါ။ ထပ်မံကြိုးစားကြည့်ပါ။', 'error');
    }
  };

  // current month income and expense
  const currentMonthTotals = useMemo(() => {
    const income = incomes
      .filter((inc) => isDateInCurrentMonth(inc.date))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const expense = expenses
      .filter((exp) => isDateInCurrentMonth(exp.date))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    return { income, expense };
  }, [incomes, expenses]);

  // auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <img
          src="/logo.png"
          alt="SmartWallet"
          className="h-14 w-14 object-contain mb-4 animate-bounce drop-shadow-sm rounded-2xl"
        />
        <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          Loading secure session...
        </div>
      </div>
    );
  }

  // unauthenticated view
  if (!user) {
    return (
      <>
        <Auth onShowToast={handleShowToast} />
        <ToastContainer toasts={toasts} onClose={handleCloseToast} />
      </>
    );
  }

  // database error view
  if (dbError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 md:p-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <img
              src="/logo.png"
              alt="SmartWallet"
              className="h-10 w-10 object-contain rounded-xl"
            />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Database Connection Trouble</h2>
              <p className="text-xs text-slate-500 font-medium">FinTrack secure synchronization could not be established</p>
            </div>
          </div>

          <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
              <span>🚨</span> Firestore error code: <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-xs">{dbError.code}</code>
            </p>
            <p className="text-xs text-rose-800 leading-relaxed font-mono whitespace-pre-wrap break-all">
              {dbError.message}
            </p>
            {dbError.path && (
              <p className="text-[11px] text-slate-500">
                Attempted path: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs text-slate-700">{dbError.path}</code>
              </p>
            )}
          </div>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <h3 className="font-bold text-slate-900 text-sm">Most Common Solutions:</h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">1</span>
                <div>
                  <p className="font-semibold text-slate-900">Create the Cloud Firestore Database</p>
                  <p className="text-slate-500 mt-0.5">
                    If this is a brand new Firebase project, Firestore might not be initialized yet. Go to your <a href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/firestore`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Firebase Console &gt; Build &gt; Firestore Database</a> and click <strong>Create database</strong>. Choose Native Mode and your preferred region.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">2</span>
                <div>
                  <p className="font-semibold text-slate-900">Deploy Firestore Security Rules</p>
                  <p className="text-slate-500 mt-0.5">
                    If you get a <code>permission-denied</code> error, your Firestore Rules are likely blocking read/write operations. In the <a href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/firestore/rules`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Rules tab</a> of your database, deploy standard rules.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">3</span>
                <div>
                  <p className="font-semibold text-slate-900">Check Database ID Mismatch</p>
                  <p className="text-slate-500 mt-0.5">
                    Your app is configured to use database ID: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold">{auth.app.options.projectId}/(default)</code>. If your database is named something else, update it in your configuration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex justify-center py-2 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              ပြန်လည်ချိတ်ဆက်မည်
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              အကောင့်မှ ထွက်မည်
            </button>
          </div>
        </div>
      </div>
    );
  }

  // data loading spinner
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <img
          src="/logo.png"
          alt="SmartWallet"
          className="h-14 w-14 object-contain mb-4 animate-pulse drop-shadow-sm rounded-2xl"
        />
        <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          အချက်အလက်များကို ချိတ်ဆက်ရယူနေပါသည်...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9FAFB]">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />

      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        profile={profile}
        onSignOut={handleSignOut}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isInstallable={isInstallable}
        onInstallApp={installApp}
      />

      {/* Main content frame */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative">
        <Header
          currentTab={currentTab}
          profile={profile}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          totalIncomeForMonth={currentMonthTotals.income}
          totalExpenseForMonth={currentMonthTotals.expense}
          isInstallable={isInstallable}
          onInstallApp={installApp}
          isOnline={isOnline}
          isUpdateAvailable={isUpdateAvailable}
          onUpdateApp={updateApp}
        />

        {/* Scrollable layout sandbox */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8 scrollbar-thin">
          <div className="mx-auto w-full max-w-7xl">
            <Suspense fallback={<ViewLoadingSpinner />}>
              {currentTab === 'dashboard' && (
                <Dashboard
                  incomes={incomes}
                  expenses={expenses}
                  wallets={wallets}
                  transfers={transfers}
                  loans={loans}
                  profile={profile}
                  onChangeTab={setCurrentTab}
                  onAddTransfer={handleAddTransfer}
                  onShowToast={handleShowToast}
                />
              )}

              {currentTab === 'incomes' && (
                <IncomeManager
                  incomes={incomes}
                  categories={categories}
                  wallets={wallets}
                  profile={profile}
                  onAddIncome={handleAddIncome}
                  onEditIncome={handleEditIncome}
                  onDeleteIncome={handleDeleteIncome}
                  onShowToast={handleShowToast}
                />
              )}

              {currentTab === 'expenses' && (
                <ExpenseManager
                  expenses={expenses}
                  categories={categories}
                  wallets={wallets}
                  profile={profile}
                  onAddExpense={handleAddExpense}
                  onEditExpense={handleEditExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onShowToast={handleShowToast}
                />
              )}

              {currentTab === 'loans' && (
                <LoanManager
                  loans={loans}
                  wallets={wallets}
                  profile={profile}
                  onAddLoan={handleAddLoan}
                  onEditLoan={handleEditLoan}
                  onDeleteLoan={handleDeleteLoan}
                  onAddLoanRepayment={handleAddLoanRepayment}
                  onDeleteLoanRepayment={handleDeleteLoanRepayment}
                  onShowToast={handleShowToast}
                />
              )}

              {currentTab === 'wallets' && (
                <WalletManager
                  wallets={wallets}
                  incomes={incomes}
                  expenses={expenses}
                  transfers={transfers}
                  loans={loans}
                  onAddWallet={handleAddWallet}
                  onEditWallet={handleEditWallet}
                  onDeleteWallet={handleDeleteWallet}
                  onAddTransfer={handleAddTransfer}
                  onDeleteTransfer={handleDeleteTransfer}
                  onShowToast={handleShowToast}
                />
              )}

              {currentTab === 'categories' && (
                <CategoryManager
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onRenameCategory={handleRenameCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onShowToast={handleShowToast}
                />
              )}

              {currentTab === 'transactions' && (
                <TransactionHistory
                  incomes={incomes}
                  expenses={expenses}
                  categories={categories}
                  wallets={wallets}
                  profile={profile}
                  onShowToast={handleShowToast}
                />
              )}

              {currentTab === 'profile' && (
                <ProfileManager
                  profile={profile}
                  onUpdateProfile={handleUpdateProfile}
                  onShowToast={handleShowToast}
                />
              )}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
