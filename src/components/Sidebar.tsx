import { LayoutDashboard, ArrowUpRight, ArrowDownRight, FolderTree, ArrowLeftRight, UserCircle, LogOut, WalletCards, X, Download, HandCoins, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  profile: UserProfile | null;
  onSignOut: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isInstallable?: boolean;
  onInstallApp?: () => void;
}

export default function Sidebar({
  currentTab,
  onChangeTab,
  profile,
  onSignOut,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  isInstallable = false,
  onInstallApp,
}: SidebarProps) {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'incomes', label: t.nav.incomes, icon: ArrowUpRight },
    { id: 'expenses', label: t.nav.expenses, icon: ArrowDownRight },
    { id: 'loans', label: t.nav.loans, icon: HandCoins },
    { id: 'wallets', label: t.nav.wallets, icon: WalletCards },
    { id: 'categories', label: t.nav.categories, icon: FolderTree },
    { id: 'transactions', label: t.nav.transactions, icon: ArrowLeftRight },
    { id: 'profile', label: t.nav.profile, icon: UserCircle },
  ];

  const handleTabClick = (tabId: string) => {
    onChangeTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 sm:w-64 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } max-w-[85vw] flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Header/Logo */}
        <div
          id="sidebar-header"
          className={`flex h-14 sm:h-16 items-center ${
            isCollapsed ? 'justify-between lg:justify-center px-5 lg:px-0' : 'justify-between px-5'
          } border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}
        >
          <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
            <img
              src="/logo.png"
              alt="SmartWallet"
              className="h-9 w-9 rounded-xl object-contain shadow-xs border border-blue-100/60 dark:border-slate-700 flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[17px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight font-sans truncate">
                SmartWallet
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
                Finance Hub
              </span>
            </div>
          </div>

          {/* Desktop Collapse / Expand Toggle */}
          {onToggleCollapse && (
            <button
              id="btn-toggle-sidebar-collapse"
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors focus:outline-none cursor-pointer flex-shrink-0"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          )}

          {/* Close button for mobile drawer */}
          <button
            id="btn-close-mobile-sidebar"
            onClick={onCloseMobile}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 lg:hidden focus:outline-none cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 sm:py-5 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                id={`sidebar-item-${item.id}`}
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`flex w-full min-h-[44px] items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  isCollapsed ? 'lg:justify-center lg:px-0' : ''
                } ${
                  isActive
                    ? 'bg-[#F3F4F6] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-semibold'
                    : 'text-[#4B5563] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <IconComponent
                  className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                />
                <span className={`truncate ${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile Info & Sign Out */}
        <div className={`border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/80 ${isCollapsed ? 'lg:p-3' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <img
              id="sidebar-user-avatar"
              src={
                profile?.photoURL
                  ? profile.photoURL.replace(/api\.dicebear\.com\/(7\.x|9\.x)\/(adventurer|initials)\/svg/, 'api.dicebear.com/10.x/micah/svg')
                  : `https://api.dicebear.com/10.x/micah/svg?seed=${encodeURIComponent(profile?.fullName || 'User')}`
              }
              referrerPolicy="no-referrer"
              alt="Profile"
              title={isCollapsed ? profile?.fullName || 'User' : undefined}
              className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 object-cover flex-shrink-0"
            />
            <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {profile?.fullName || 'User'}
              </p>
              <p className="truncate text-xs text-[#6B7280] dark:text-slate-400">
                {profile?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          
          {isInstallable && onInstallApp && (
            <button
              id="sidebar-btn-install"
              type="button"
              onClick={() => {
                onInstallApp();
                onCloseMobile();
              }}
              title={isCollapsed ? t.nav.installApp : undefined}
              className={`mt-3 flex w-full min-h-[44px] items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors cursor-pointer border border-blue-100 dark:border-blue-900 ${
                isCollapsed ? 'lg:justify-center lg:px-0' : ''
              }`}
            >
              <Download className="h-5 w-5 text-[#2563EB] dark:text-blue-400 flex-shrink-0" />
              <span className={isCollapsed ? 'lg:hidden' : ''}>{t.nav.installApp}</span>
            </button>
          )}

          <button
            id="sidebar-btn-signout"
            onClick={() => {
              onSignOut();
              onCloseMobile();
            }}
            title={isCollapsed ? t.nav.signOut : undefined}
            className={`mt-3 flex w-full min-h-[44px] items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer ${
              isCollapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <LogOut className="h-5 w-5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
            <span className={isCollapsed ? 'lg:hidden' : ''}>{t.nav.signOut}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
