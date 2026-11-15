import { useState, useEffect } from 'react';
import { LogOut, Download, PanelLeftClose, PanelLeftOpen, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { PRIMARY_ROUTE, SIDEBAR_GROUPS, getGroupForRoute, type RouteId } from '../routes/routeConfig';

interface SidebarProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  profile: UserProfile | null;
  onSignOut: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isInstallable?: boolean;
  onInstallApp?: () => void;
}

export default function Sidebar({
  currentRoute,
  onNavigate,
  profile,
  onSignOut,
  isCollapsed = false,
  onToggleCollapse,
  isInstallable = false,
  onInstallApp,
}: SidebarProps) {
  const { t } = useLanguage();

  // Track which accordion groups are open; auto-open the group of the active route
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const activeGroup = getGroupForRoute(currentRoute);
    return {
      cashflow: activeGroup === 'cashflow' || activeGroup === null,
      planning: activeGroup === 'planning',
      accounts: activeGroup === 'accounts',
    };
  });

  useEffect(() => {
    const activeGroup = getGroupForRoute(currentRoute);
    if (activeGroup) {
      setOpenGroups((prev) => (prev[activeGroup] ? prev : { ...prev, [activeGroup]: true }));
    }
  }, [currentRoute]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const PrimaryIcon = PRIMARY_ROUTE.icon;
  const isPrimaryActive = currentRoute === PRIMARY_ROUTE.id;

  return (
    <aside
      id="app-sidebar"
      className={`hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ease-in-out flex-shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header/Logo */}
      <div
        id="sidebar-header"
        className={`flex h-16 items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
          isCollapsed ? 'justify-center px-0' : 'justify-between px-5'
        }`}
      >
        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'hidden' : ''}`}>
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
              {t.nav.financeHub}
            </span>
          </div>
        </div>

        {onToggleCollapse && (
          <button
            id="btn-toggle-sidebar-collapse"
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors focus:outline-none cursor-pointer flex-shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Navigation Items with Collapsible Sub-menu Dropdowns */}
      <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto scrollbar-thin">
        {/* Primary Dashboard Item */}
        <button
          id={`sidebar-item-${PRIMARY_ROUTE.id}`}
          type="button"
          onClick={() => onNavigate(PRIMARY_ROUTE.id)}
          title={isCollapsed ? t.nav[PRIMARY_ROUTE.labelKey] : undefined}
          className={`flex w-full min-h-[42px] items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          } ${
            isPrimaryActive
              ? 'bg-[#F3F4F6] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-semibold'
              : 'text-[#4B5563] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <PrimaryIcon
            className={`h-5 w-5 flex-shrink-0 ${
              isPrimaryActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          />
          <span className={`truncate ${isCollapsed ? 'hidden' : ''}`}>{t.nav[PRIMARY_ROUTE.labelKey]}</span>
        </button>

        {/* Collapsible Groups */}
        {SIDEBAR_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = !!openGroups[group.id];
          const hasActiveChild = group.items.some((item) => item.id === currentRoute);

          if (isCollapsed) {
            return (
              <div key={group.id} className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      id={`sidebar-item-${item.id}`}
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      title={t.nav[item.labelKey]}
                      className={`flex w-full min-h-[40px] items-center justify-center rounded-xl transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#F3F4F6] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400'
                          : 'text-[#4B5563] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <IconComponent
                        className={`h-[18px] w-[18px] flex-shrink-0 ${
                          isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={group.id} className="pt-1">
              <button
                id={`sidebar-group-${group.id}`}
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className={`flex w-full min-h-[42px] items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  hasActiveChild && !isOpen
                    ? 'text-[#2563EB] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-semibold'
                    : 'text-[#4B5563] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <GroupIcon className="h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{t.nav[group.labelKey]}</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-1 ml-3 pl-2.5 border-l border-slate-200/80 dark:border-slate-800 space-y-1">
                  {group.items.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = currentRoute === item.id;
                    return (
                      <button
                        id={`sidebar-item-${item.id}`}
                        key={item.id}
                        type="button"
                        onClick={() => onNavigate(item.id)}
                        className={`flex w-full min-h-[38px] items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#F3F4F6] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-semibold'
                            : 'text-[#4B5563] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        <IconComponent
                          className={`h-4 w-4 flex-shrink-0 ${
                            isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                        <span className="truncate">{t.nav[item.labelKey]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile Info & Sign Out */}
      <div className={`border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/80 ${isCollapsed ? 'p-3' : ''}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
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
          <div className={`flex-1 min-w-0 ${isCollapsed ? 'hidden' : ''}`}>
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
            onClick={onInstallApp}
            title={isCollapsed ? t.nav.installApp : undefined}
            className={`mt-3 flex w-full min-h-[40px] items-center gap-3 rounded-xl px-4 py-2 text-sm font-semibold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors cursor-pointer border border-blue-100 dark:border-blue-900 ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Download className="h-4 w-4 text-[#2563EB] dark:text-blue-400 flex-shrink-0" />
            <span className={isCollapsed ? 'hidden' : ''}>{t.nav.installApp}</span>
          </button>
        )}

        <button
          id="sidebar-btn-signout"
          type="button"
          onClick={onSignOut}
          title={isCollapsed ? t.nav.signOut : undefined}
          className={`mt-2.5 flex w-full min-h-[40px] items-center gap-3 rounded-xl px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
          <span className={isCollapsed ? 'hidden' : ''}>{t.nav.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
