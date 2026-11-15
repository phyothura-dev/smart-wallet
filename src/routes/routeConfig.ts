import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  PieChart,
  Repeat,
  Target,
  HandCoins,
  WalletCards,
  FolderTree,
  UserCircle,
  TrendingUp,
  CalendarClock,
  Settings2,
} from 'lucide-react';
import type { Translations } from '../i18n/translations';

export type RouteId =
  | 'dashboard'
  | 'incomes'
  | 'expenses'
  | 'transactions'
  | 'budgets'
  | 'recurring'
  | 'goals'
  | 'loans'
  | 'wallets'
  | 'categories'
  | 'profile';

export type NavLabelKey = keyof Translations['nav'];

export interface RouteItem {
  id: RouteId;
  labelKey: NavLabelKey;
  icon: LucideIcon;
}

export interface RouteGroup {
  id: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  items: RouteItem[];
}

export const PRIMARY_ROUTE: RouteItem = {
  id: 'dashboard',
  labelKey: 'dashboard',
  icon: LayoutDashboard,
};

export const SIDEBAR_GROUPS: RouteGroup[] = [
  {
    id: 'cashflow',
    labelKey: 'groupCashflow',
    icon: TrendingUp,
    items: [
      { id: 'incomes', labelKey: 'incomes', icon: ArrowUpRight },
      { id: 'expenses', labelKey: 'expenses', icon: ArrowDownRight },
      { id: 'transactions', labelKey: 'transactions', icon: ArrowLeftRight },
    ],
  },
  {
    id: 'planning',
    labelKey: 'groupPlanning',
    icon: CalendarClock,
    items: [
      { id: 'budgets', labelKey: 'budgets', icon: PieChart },
      { id: 'recurring', labelKey: 'recurring', icon: Repeat },
      { id: 'goals', labelKey: 'goals', icon: Target },
      { id: 'loans', labelKey: 'loans', icon: HandCoins },
    ],
  },
  {
    id: 'accounts',
    labelKey: 'groupAccounts',
    icon: Settings2,
    items: [
      { id: 'wallets', labelKey: 'wallets', icon: WalletCards },
      { id: 'categories', labelKey: 'categories', icon: FolderTree },
      { id: 'profile', labelKey: 'profile', icon: UserCircle },
    ],
  },
];

export const MOBILE_BOTTOM_TABS: RouteItem[] = [
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { id: 'incomes', labelKey: 'incomes', icon: ArrowUpRight },
  { id: 'expenses', labelKey: 'expenses', icon: ArrowDownRight },
  { id: 'wallets', labelKey: 'wallets', icon: WalletCards },
];

export const ALL_ROUTE_IDS: RouteId[] = [
  PRIMARY_ROUTE.id,
  ...SIDEBAR_GROUPS.flatMap((g) => g.items.map((i) => i.id)),
];

export function isValidRouteId(value: string): value is RouteId {
  return ALL_ROUTE_IDS.includes(value as RouteId);
}

export function getGroupForRoute(routeId: RouteId): string | null {
  const group = SIDEBAR_GROUPS.find((g) => g.items.some((item) => item.id === routeId));
  return group ? group.id : null;
}

export function getRouteTitle(routeId: RouteId, t: Translations): string {
  switch (routeId) {
    case 'dashboard':
      return t.nav.dashboard;
    case 'incomes':
      return t.nav.incomes;
    case 'expenses':
      return t.nav.expenses;
    case 'transactions':
      return t.nav.transactions;
    case 'budgets':
      return t.nav.budgets;
    case 'recurring':
      return t.nav.recurring;
    case 'goals':
      return t.nav.goals;
    case 'loans':
      return t.nav.loans;
    case 'wallets':
      return t.nav.wallets;
    case 'categories':
      return t.nav.categories;
    case 'profile':
      return t.nav.profile;
    default:
      return 'SmartWallet';
  }
}
