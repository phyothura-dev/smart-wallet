import { Menu, TrendingUp, Download, WifiOff, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';
import { calculateGoalProgress } from '../utils/finance';

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
}

export default function Header({
  currentTab,
  profile,
  onOpenMobileSidebar,
  totalIncomeForMonth = 0,
  totalExpenseForMonth = 0,
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

  // monthly goal progress (net amount)
  const goalProgress = calculateGoalProgress(
    totalIncomeForMonth,
    totalExpenseForMonth,
    profile?.monthlyIncomeGoal
  );

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
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
            title="SmartWallet ကို App တစ်ခုအနေဖြင့် သွင်းယူပါ"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="hidden sm:inline">App သွင်းမည်</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}

        {/* Monthly Goal Progress Indicator */}
        {goalProgress.isGoalSet && (
          <>
            <div
              className={`hidden sm:flex items-center gap-2 border rounded-lg px-2.5 py-1 text-xs transition-all ${
                goalProgress.isAchieved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-[#EFF6FF] border-blue-100 text-[#2563EB]'
              }`}
              title={`ဒီလ အသားတင်ဝင်ငွေ: Ks ${goalProgress.netIncome.toLocaleString()} / Ks ${goalProgress.monthlyGoal.toLocaleString()} (${goalProgress.percentage}%)`}
            >
              <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-semibold text-xs whitespace-nowrap">
                ရည်မှန်းချက် {goalProgress.percentage}%
              </span>
              <div className="w-14 sm:w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    goalProgress.isAchieved ? 'bg-emerald-500' : 'bg-[#2563EB]'
                  }`}
                  style={{ width: `${goalProgress.clampedPercentage}%` }}
                />
              </div>
            </div>

            {/* Mobile Goal badge */}
            <div
              className={`flex sm:hidden items-center gap-1.5 border rounded-lg px-2 py-1 text-[11px] font-bold ${
                goalProgress.isAchieved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-[#EFF6FF] border-blue-100 text-[#2563EB]'
              }`}
              title={`ဒီလ အသားတင်ဝင်ငွေ: Ks ${goalProgress.netIncome.toLocaleString()} / Ks ${goalProgress.monthlyGoal.toLocaleString()} (${goalProgress.percentage}%)`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{goalProgress.percentage}%</span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

