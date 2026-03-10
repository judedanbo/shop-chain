import { useState } from 'react';
import {
  Bell,
  Menu,
  Search,
  ArrowLeft,
  User,
  Store,
  Package,
  ShoppingCart,
  RotateCcw,
  AlertTriangle,
  Users,
  Monitor,
  UserPlus,
  CheckCircle,
  Eye,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, useAuth, useNavigation, useNotifications } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile, isSmall } from '@/utils/responsive';
import { Input } from '@/components/ui/Input';
import { RoleSwitcher } from '@/components/features';
import { getRoleMeta } from '@/constants/demoData';
import type { PageId, NotificationCategory, ThemeColors } from '@/types';

export interface HeaderProps {
  profileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
  roleSwitcherOpen: boolean;
  setRoleSwitcherOpen: (v: boolean) => void;
  onOpenMobileMenu: () => void;
}

function getPageTitle(
  page: PageId,
  selectedSupplier: { name: string } | null,
  selectedPO: { id: string } | null,
  selectedWarehouse: { name: string } | null,
): string {
  const titles: Record<string, string> = {
    dashboard: 'Inventory Dashboard',
    products: 'Product Catalog',
    categories: 'Product Categories',
    units: 'Units of Measure',
    addProduct: 'Add New Product',
    editProduct: 'Edit Product',
    productDetail: 'Product Details',
    adjustments: 'Stock Adjustments',
    transfers: 'Stock Transfers',
    suppliers: 'Supplier Management',
    supplierDetail: selectedSupplier ? selectedSupplier.name : 'Supplier Details',
    purchaseOrders: 'Purchase Orders',
    poDetail: selectedPO ? selectedPO.id : 'PO Details',
    warehouses: 'Warehouse Management',
    warehouseDetail: selectedWarehouse ? selectedWarehouse.name : 'Warehouse Details',
    pos: 'Point of Sale',
    sales: 'Sales',
    salesAnalysis: 'Sales & Kitchen Analysis',
    notifications: 'Notifications',
    team: 'Team Management',
    permissions: 'Role Permissions',
    settings: 'Shop Settings',
    account: 'Account',
    customers: 'Customers',
  };
  return titles[page] || 'Dashboard';
}

const CATEGORY_ICONS: Record<NotificationCategory, typeof Bell> = {
  stock_alert: Package,
  order_update: ShoppingCart,
  sale_event: RotateCcw,
  approval_request: AlertTriangle,
  team_update: Users,
  system: Monitor,
  customer: UserPlus,
};

const CATEGORY_COLORS: Record<NotificationCategory, (c: ThemeColors) => string> = {
  stock_alert: (c) => c.warning,
  order_update: (c) => c.primary,
  sale_event: (c) => c.accent,
  approval_request: (c) => c.danger,
  team_update: (c) => c.success,
  system: (c) => c.textMuted,
  customer: (c) => c.primary,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function Header({
  profileOpen,
  setProfileOpen,
  roleSwitcherOpen,
  setRoleSwitcherOpen,
  onOpenMobileMenu,
}: HeaderProps) {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { currentRole, setActiveShop, setActiveBranch, setAuthScreen } = useAuth();
  const { page, setPage, selectedSupplier, selectedPO, selectedWarehouse } = useNavigation();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);

  const mobile = isSmall(bp);
  const pageTitle = getPageTitle(page, selectedSupplier, selectedPO, selectedWarehouse);

  const recentNotifs = notifications.slice(0, 6);

  const handleNotifClick = (n: (typeof notifications)[0]) => {
    markAsRead(n.id);
    if (n.actionUrl) {
      setPage(n.actionUrl);
    }
    setNotifOpen(false);
  };

  return (
    <div className="bg-surface border-border flex h-14 shrink-0 items-center justify-between gap-3 border-b px-3 sm:h-[60px] sm:px-4 md:h-16 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {mobile && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open menu"
            className="text-text-muted shrink-0 p-1"
          >
            <Menu size={22} />
          </button>
        )}
        <h1 className="text-text m-0 overflow-hidden text-[15px] font-bold text-ellipsis whitespace-nowrap sm:text-base md:text-lg">
          {pageTitle}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        {!isMobile(bp) && (
          <div className="w-[160px] md:w-[200px] lg:w-[260px]">
            <Input icon={Search} placeholder="Search..." />
          </div>
        )}
        <RoleSwitcher
          isOpen={roleSwitcherOpen}
          onToggle={() => {
            setRoleSwitcherOpen(!roleSwitcherOpen);
            setProfileOpen(false);
            setNotifOpen(false);
          }}
          onClose={() => setRoleSwitcherOpen(false)}
        />

        {/* ─── Notifications Bell ─── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
              setRoleSwitcherOpen(false);
            }}
            aria-label="Notifications"
            className="relative p-1"
          >
            <Bell
              size={20}
              className="transition-colors duration-150"
              style={{ color: notifOpen ? COLORS.primary : COLORS.textMuted }}
            />
            {unreadCount > 0 && (
              <div className="bg-danger border-surface absolute top-0 right-0 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 px-[3px] text-[9px] font-[800] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <>
              <div
                onClick={() => setNotifOpen(false)}
                aria-hidden="true"
                className="z-dropdown-backdrop fixed inset-0"
              />
              <div
                className="bg-surface border-border z-dropdown absolute top-[calc(100%+8px)] animate-[modalIn_0.15s_ease] overflow-hidden rounded-2xl border-[1.5px] shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
                style={{
                  right: mobile ? -60 : 0,
                  width: mobile ? 'calc(100vw - 24px)' : 380,
                  maxWidth: mobile ? 'calc(100vw - 24px)' : 380,
                }}
              >
                {/* Header */}
                <div className="border-border flex items-center justify-between border-b px-[18px] py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-text text-sm font-[800]">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-danger min-w-[18px] rounded-lg px-[7px] py-0.5 text-center text-[10px] font-[800] text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllRead();
                      }}
                      className="text-primary flex items-center gap-1 border-none bg-none font-[inherit] text-[11px] font-semibold"
                    >
                      <CheckCircle size={12} /> Mark all read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-[420px] overflow-y-auto">
                  {recentNotifs.length === 0 ? (
                    <div className="p-10 text-center">
                      <Bell size={28} className="text-text-dim mb-2" />
                      <div className="text-text-muted text-[13px] font-semibold">No notifications</div>
                      <div className="text-text-dim mt-1 text-[11px]">You're all caught up!</div>
                    </div>
                  ) : (
                    recentNotifs.map((n) => {
                      const Icon = CATEGORY_ICONS[n.category];
                      const color = CATEGORY_COLORS[n.category](COLORS);
                      return (
                        <button
                          type="button"
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={clsx(
                            'border-border/[0.03] hover:bg-primary/[0.03] flex w-full gap-3 border-b px-[18px] py-3 text-left transition-[background] duration-100',
                            !n.read && 'bg-primary/[0.02]',
                          )}
                        >
                          {/* Icon */}
                          <div
                            className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px]"
                            style={{ background: `${color}15` }}
                          >
                            <Icon size={16} style={{ color }} />
                          </div>
                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={clsx(
                                  'text-text text-xs leading-[1.3]',
                                  n.read ? 'font-semibold' : 'font-bold',
                                )}
                              >
                                {n.title}
                              </span>
                              <span className="text-text-dim mt-0.5 shrink-0 text-[9px] whitespace-nowrap">
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>
                            <div className="text-text-dim mt-[3px] [display:-webkit-box] overflow-hidden text-[11px] leading-[1.4] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                              {n.message}
                            </div>
                            {n.requiresAction && !n.actionTaken && (
                              <div className="bg-warning/[0.07] text-warning mt-[5px] inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold">
                                <AlertTriangle size={10} /> Action required
                              </div>
                            )}
                          </div>
                          {/* Unread dot */}
                          {!n.read && <div className="bg-primary mt-1 size-2 shrink-0 rounded-full" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-border border-t px-[18px] py-2.5 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotifOpen(false);
                        setPage('notifications');
                      }}
                      className="text-primary inline-flex items-center gap-[5px] border-none bg-none font-[inherit] text-xs font-bold"
                    >
                      <Eye size={13} /> View All Notifications
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar + Profile dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setRoleSwitcherOpen(false);
              setNotifOpen(false);
            }}
            aria-label="Profile menu"
            className="flex size-[34px] items-center justify-center rounded-[10px] text-[13px] font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${getRoleMeta(currentRole).color}80, ${getRoleMeta(currentRole).color}40)`,
            }}
          >
            JA
          </button>
          {profileOpen && (
            <>
              <div
                onClick={() => setProfileOpen(false)}
                aria-hidden="true"
                className="z-dropdown-backdrop fixed inset-0"
              />
              <div className="bg-surface border-border z-dropdown absolute top-[calc(100%+6px)] right-0 min-w-[240px] animate-[modalIn_0.15s_ease] rounded-[14px] border p-2 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
                <div className="border-border mb-1.5 flex items-center gap-3 border-b px-3.5 py-3">
                  <div
                    className="flex size-[42px] shrink-0 items-center justify-center rounded-xl text-base font-[800] text-white"
                    style={{
                      background: `linear-gradient(135deg, ${getRoleMeta(currentRole).color}60, ${getRoleMeta(currentRole).color}30)`,
                    }}
                  >
                    JA
                  </div>
                  <div>
                    <div className="text-text text-sm font-bold">Jude Appiah</div>
                    <div className="text-text-dim text-[11px]">jude@shopchain.com</div>
                  </div>
                </div>
                {[
                  {
                    label: 'Account',
                    icon: User,
                    action: () => {
                      setProfileOpen(false);
                      setPage('account');
                    },
                  },
                  {
                    label: 'Switch Shop',
                    icon: Store,
                    action: () => {
                      setProfileOpen(false);
                      setActiveBranch(null);
                      setAuthScreen('shopSelect');
                    },
                  },
                ].map((item, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={item.action}
                    className="text-text flex w-full items-center gap-2.5 rounded-[10px] px-3.5 py-[9px] text-[13px] font-medium transition-[background] duration-100"
                  >
                    <item.icon size={15} className="text-text-dim" /> {item.label}
                  </button>
                ))}
                <div className="bg-border mx-2 my-1 h-px" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveShop(null);
                    setActiveBranch(null);
                    setAuthScreen('login');
                  }}
                  className="text-danger flex w-full items-center gap-2.5 rounded-[10px] px-3.5 py-[9px] text-[13px] font-semibold"
                >
                  <ArrowLeft size={15} /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
