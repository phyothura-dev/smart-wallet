import { useState } from 'react';
import { LayoutGrid, X, Download, LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MOBILE_BOTTOM_TABS, SIDEBAR_GROUPS, type RouteId } from '../routes/routeConfig';
import type { UserProfile } from '../types';

interface MobileBottomNavProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  profile: UserProfile | null;
  isInstallable?: boolean;
  onInstallApp?: () => void;
  onSignOut: () => void;
}

export default function MobileBottomNav({
  currentRoute,
  onNavigate,
  profile,
  isInstallable = false,
  onInstallApp,
  onSignOut,
}: MobileBottomNavProps) {
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryIds = new Set(MOBILE_BOTTOM_TABS.map((tab) => tab.id));
  const isMoreRouteActive = !primaryIds.has(currentRoute);

  const handleSelect = (routeId: RouteId) => {
    onNavigate(routeId);
    setMoreOpen(false);
  };

  return (
    <>
      {/* More Menu Bottom Sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          />
          <div className="relative z-10 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 pt-3 pb-7 shadow-2xl max-h-[82vh] overflow-y-auto">
            {/* Drag Handle */}
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />

            {/* Profile Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.fullName || 'User'}
                    className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-sm border border-blue-200 dark:border-blue-800 flex-shrink-0">
                    {profile?.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {profile?.fullName || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {profile?.email || ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label={t.common.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grouped Routes */}
            <div className="space-y-4">
              {SIDEBAR_GROUPS.map((group) => {
                const secondaryItems = group.items.filter((item) => !primaryIds.has(item.id));
                if (secondaryItems.length === 0) return null;

                return (
                  <div key={group.id}>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">
                      {t.nav[group.labelKey]}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {secondaryItems.map((item) => {
                        const Icon = item.icon;
                        const active = currentRoute === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item.id)}
                            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center transition-all cursor-pointer border ${
                              active
                                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400'
                                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                              {t.nav[item.labelKey]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* App Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              {isInstallable && onInstallApp && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    onInstallApp();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 py-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.nav.installApp}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onSignOut();
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.nav.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16">
          {MOBILE_BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentRoute === tab.id;
            return (
              <button
                key={tab.id}
                id={`mobile-nav-${tab.id}`}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 px-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#2563EB] dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-6 rounded-full transition-colors ${
                    isActive ? 'bg-blue-50 dark:bg-blue-950/70' : ''
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.25 : 1.9} />
                </div>
                <span className="text-[10px] font-semibold truncate max-w-full leading-none">
                  {t.nav[tab.labelKey]}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: More */}
          <button
            id="mobile-nav-more"
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 px-1 transition-colors cursor-pointer ${
              moreOpen || isMoreRouteActive
                ? 'text-[#2563EB] dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`flex items-center justify-center w-8 h-6 rounded-full transition-colors ${
                moreOpen || isMoreRouteActive ? 'bg-blue-50 dark:bg-blue-950/70' : ''
              }`}
            >
              <LayoutGrid className="w-[18px] h-[18px]" strokeWidth={moreOpen || isMoreRouteActive ? 2.25 : 1.9} />
            </div>
            <span className="text-[10px] font-semibold truncate max-w-full leading-none">
              {t.nav.more}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
