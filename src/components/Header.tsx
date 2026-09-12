import { Menu, TrendingUp, Download, WifiOff, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentTab: string;
  profile: UserProfile | null;
  onOpenMobileSidebar: () => void;
  totalIncomeForMonth?: number;
  isInstallable?: boolean;
  onInstallApp?: () => void;
  isOnline?: boolean;
  isUpdateAvailable?: boolean;
  onUpdateApp?: () => void;
}

export default function Header({
  currentTab,
  profile,
  onOpenMobileSidebar,
  totalIncomeForMonth = 0,
  isInstallable = false,
  onInstallApp,
  isOnline = true,
  isUpdateAvailable = false,
  onUpdateApp,
}: HeaderProps) {
  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'ပင်မ ခြုံငုံသုံးသပ်ချက်';
      case 'incomes':
        return 'ဝင်ငွေ စီမံခန့်ခွဲမှု';
      case 'expenses':
        return 'ထွက်ငွေ စီမံခန့်ခွဲမှု';
      case 'wallets':
        return 'ပိုက်ဆံအိတ်များ စီမံခန့်ခွဲမှု';
      case 'categories':
        return 'ကိုယ်ပိုင်အမျိုးအစားများ';
      case 'transactions':
        return 'စာရင်းမှတ်တမ်းအားလုံး';
      case 'profile':
        return 'ကိုယ်ရေးအချက်အလက် စီမံမှု';
      default:
        return 'SmartWallet';
    }
  };

  // Safe checks for currency
  const currencySymbol = 'Ks ';
  const monthlyGoal = profile?.monthlyIncomeGoal;
  const isGoalSet = monthlyGoal && monthlyGoal > 0;
  const goalProgressPercent = isGoalSet
    ? Math.min(100, Math.round((totalIncomeForMonth / monthlyGoal) * 100))
    : 0;

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 md:px-8"
    >
      {/* Mobile Menu & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          id="btn-toggle-mobile-sidebar"
          onClick={onOpenMobileSidebar}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden focus:outline-none flex-shrink-0 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 id="header-page-title" className="text-base sm:text-lg font-semibold text-[#111827] tracking-tight font-sans truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Stats/Badges Row */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Offline indicator badge */}
        {!isOnline && (
          <div
            id="badge-offline"
            className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 sm:px-2.5 py-1 text-[11px] font-semibold text-amber-800"
            title="အင်တာနက်ပြတ်တောက်နေပါသည် (Offline Cache ဖြင့် အလုပ်လုပ်နေသည်)"
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span className="hidden sm:inline">Offline စနစ်</span>
            <span className="sm:hidden">Offline</span>
          </div>
        )}

        {/* Update Available notification button */}
        {isUpdateAvailable && onUpdateApp && (
          <button
            id="btn-pwa-update"
            type="button"
            onClick={onUpdateApp}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="App ဗားရှင်းအသစ် ရရှိနေပါပြီ။ နှိပ်၍ Update ပြုလုပ်ပါ။"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Update ရပြီ</span>
          </button>
        )}

        {/* In-app PWA Install Button */}
        {isInstallable && onInstallApp && (
          <button
            id="btn-pwa-install"
            type="button"
            onClick={onInstallApp}
            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#4F46E5] rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
            title="SmartWallet ကို App တစ်ခုအနေဖြင့် သွင်းယူပါ"
          >
            <Download className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="hidden sm:inline">App သွင်းမည်</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}

        {/* Monthly Goal Progress Indicator (Desktop Accent) */}
        {isGoalSet && (
          <>
            <div className="hidden md:flex items-center gap-3 bg-[#EEF2FF] border border-indigo-100 rounded-lg px-3 py-1">
              <TrendingUp className="w-4 h-4 text-[#4F46E5]" />
              <div className="text-xs">
                <span className="font-medium text-[#4F46E5]">
                  ရည်မှန်းချက်: {currencySymbol}
                  {monthlyGoal.toLocaleString()}
                </span>
                <span className="text-slate-500 ml-1">({goalProgressPercent}%)</span>
                <div className="w-20 bg-slate-200 h-1 rounded-full mt-0.5 overflow-hidden">
                  <div
                    className="bg-[#4F46E5] h-full rounded-full transition-all duration-500"
                    style={{ width: `${goalProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mobile Goal badge */}
            <div className="flex md:hidden items-center gap-1.5 bg-[#EEF2FF] border border-indigo-100/80 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#4F46E5]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{goalProgressPercent}%</span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

