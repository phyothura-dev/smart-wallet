import { Menu, WifiOff, RefreshCw, Sun, Moon } from 'lucide-react';
import { UserProfile } from '../types';
import type { ResolvedTheme } from '../hooks/useTheme';

interface HeaderProps {
  currentTab: string;
  profile: UserProfile | null;
  onOpenMobileSidebar: () => void;
  totalIncomeForMonth?: number;
  totalExpenseForMonth?: number;
  isInstallable?: boolean;
  onInstallApp?: () => void;
  isOnline?: boolean;
  isUpdateAvailable?: boolean;
  onUpdateApp?: () => void;
  resolvedTheme?: ResolvedTheme;
  onToggleTheme?: () => void;
}

export default function Header({
  currentTab,
  profile: _profile,
  onOpenMobileSidebar,
  isOnline = true,
  isUpdateAvailable = false,
  onUpdateApp,
  resolvedTheme = 'light',
  onToggleTheme,
}: HeaderProps) {
  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'ပင်မစာမျက်နှာ';
      case 'incomes':
        return 'ဝင်ငွေ';
      case 'expenses':
        return 'ထွက်ငွေ';
      case 'loans':
        return 'ချေးငွေနှင့် အကြွေးများ';
      case 'wallets':
        return 'ပိုက်ဆံအိတ်များ';
      case 'categories':
        return 'အမျိုးအစားများ';
      case 'transactions':
        return 'မှတ်တမ်း';
      case 'profile':
        return 'ပရိုဖိုင်';
      default:
        return 'SmartWallet';
    }
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 md:px-8 transition-colors duration-200"
    >
      {/* Mobile Menu & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          id="btn-toggle-mobile-sidebar"
          onClick={onOpenMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none flex-shrink-0 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 id="header-page-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Status Badges & Theme Toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isOnline && (
          <div
            id="badge-offline"
            className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Offline</span>
          </div>
        )}

        {isUpdateAvailable && onUpdateApp && (
          <button
            id="btn-pwa-update"
            type="button"
            onClick={onUpdateApp}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Update ရပြီ</span>
          </button>
        )}

        {onToggleTheme && (
          <button
            id="btn-header-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            title={resolvedTheme === 'dark' ? 'အလင်းပုံစံ (Light Mode) သို့ပြောင်းမည်' : 'အမှောင်ပုံစံ (Dark Mode) သို့ပြောင်းမည်'}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </header>
  );
}

