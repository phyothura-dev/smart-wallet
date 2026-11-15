import { Menu, WifiOff, RefreshCw, Sun, Moon, Languages } from 'lucide-react';
import { UserProfile } from '../types';
import type { ResolvedTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { CURRENCY_LIST, type CurrencyCode } from '../utils/currency';
import CustomSelect from './CustomSelect';

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
  const { language, toggleLanguage, t } = useLanguage();
  const { displayCurrency, setDisplayCurrency } = useCurrency();

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return t.nav.dashboard;
      case 'incomes':
        return t.nav.incomes;
      case 'expenses':
        return t.nav.expenses;
      case 'loans':
        return t.nav.loans;
      case 'wallets':
        return t.nav.wallets;
      case 'categories':
        return t.nav.categories;
      case 'transactions':
        return t.nav.transactions;
      case 'profile':
        return t.nav.profile;
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
            <span>{t.header.offline}</span>
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
            <span>{t.header.updateAvailable}</span>
          </button>
        )}

        <CustomSelect
          id="select-header-currency"
          value={displayCurrency}
          onChange={(val) => setDisplayCurrency(val as CurrencyCode)}
          options={CURRENCY_LIST.map((c) => ({
            value: c.code,
            label: `${c.code} (${c.shortLabel})`,
          }))}
          size="sm"
          menuAlign="right"
          ariaLabel={t.profile.displayCurrency}
          buttonClassName="bg-slate-50 dark:bg-slate-800 font-bold text-xs min-w-[92px]"
        />

        <button
          id="btn-header-lang-toggle"
          type="button"
          onClick={toggleLanguage}
          title={t.header.switchLanguage}
          aria-label={t.header.switchLanguage}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <Languages className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>{language === 'mm' ? 'MM' : 'EN'}</span>
        </button>

        {onToggleTheme && (
          <button
            id="btn-header-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            title={resolvedTheme === 'dark' ? t.header.switchToLight : t.header.switchToDark}
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

