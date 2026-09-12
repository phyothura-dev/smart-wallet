import { LayoutDashboard, ArrowUpRight, ArrowDownRight, FolderTree, ArrowLeftRight, UserCircle, LogOut, Wallet, WalletCards, X, Download } from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  profile: UserProfile | null;
  onSignOut: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
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
  isInstallable = false,
  onInstallApp,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'ပင်မစာမျက်နှာ', icon: LayoutDashboard },
    { id: 'incomes', label: 'ဝင်ငွေ', icon: ArrowUpRight },
    { id: 'expenses', label: 'ထွက်ငွေ', icon: ArrowDownRight },
    { id: 'wallets', label: 'ပိုက်ဆံအိတ်များ', icon: WalletCards },
    { id: 'categories', label: 'အမျိုးအစားများ', icon: FolderTree },
    { id: 'transactions', label: 'မှတ်တမ်း', icon: ArrowLeftRight },
    { id: 'profile', label: 'ပရိုဖိုင်', icon: UserCircle },
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 sm:w-64 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Header/Logo */}
        <div id="sidebar-header" className="flex h-16 items-center justify-between px-5 sm:px-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-500/25">
              <Wallet className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-bold text-slate-900 tracking-tight leading-tight font-sans">
                SmartWallet
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 tracking-wide uppercase">
                Finance Hub
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            id="btn-close-mobile-sidebar"
            onClick={onCloseMobile}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden focus:outline-none cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 sm:py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                id={`sidebar-item-${item.id}`}
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex w-full min-h-[44px] items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#F3F4F6] text-[#4F46E5] font-semibold'
                    : 'text-[#4B5563] hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <IconComponent
                  className={`h-5 w-5 ${isActive ? 'text-[#4F46E5]' : 'text-slate-400'}`}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Info & Sign Out */}
        <div className="border-t border-slate-200 p-4 sm:p-5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <img
              id="sidebar-user-avatar"
              src={profile?.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
              referrerPolicy="no-referrer"
              alt="Profile"
              className="h-9 w-9 rounded-full border border-slate-200 object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {profile?.fullName || 'User'}
              </p>
              <p className="truncate text-xs text-[#6B7280]">
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
              className="mt-3 flex w-full min-h-[44px] items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-100"
            >
              <Download className="h-5 w-5 text-[#4F46E5] flex-shrink-0" />
              App သွင်းမည် (PWA)
            </button>
          )}

          <button
            id="sidebar-btn-signout"
            onClick={() => {
              onSignOut();
              onCloseMobile();
            }}
            className="mt-3 flex w-full min-h-[44px] items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-rose-500 flex-shrink-0" />
            အကောင့်မှ ထွက်မည်
          </button>
        </div>
      </aside>
    </>
  );
}
