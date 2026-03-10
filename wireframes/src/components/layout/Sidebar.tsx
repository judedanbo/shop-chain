import React from 'react';
import { Package, ChevronDown, ChevronRight, X, ArrowLeft, Lock, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useColors, useAuth, useNavigation, useShop, useToast } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isSmall } from '@/utils/responsive';
import { ThemePicker, ShopLogo } from '@/components/features';
import { NAV_ITEMS, NAV_PERM_MAP, getRoleMeta } from '@/constants/demoData';
import { PLAN_TIERS } from '@/constants/plans';
import type { PageId } from '@/types';

/** Maps sub-page IDs to their parent nav item so the sidebar highlights the correct entry. */
const PAGE_PARENT_MAP: Partial<Record<PageId, string>> = {
  addProduct: 'products',
  editProduct: 'products',
  productDetail: 'products',
  supplierDetail: 'suppliers',
  poDetail: 'purchaseOrders',
  createPO: 'purchaseOrders',
  warehouseDetail: 'warehouses',
  permissions: 'team',
  salesAnalysis: 'dashboard',
  tillManagement: 'barPos',
};

export interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
}

export function Sidebar({ sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { activeShop, setActiveShop, setActiveBranch, setAuthScreen, currentRole } = useAuth();
  const { page, setPage } = useNavigation();
  const { userPlan, canAccess } = useShop();
  const { addToastWithTitle } = useToast();

  const mobile = isSmall(bp);
  const tablet = bp === 'lg';
  const autoCollapsed = tablet || sidebarCollapsed;
  const collapsedNav = !mobile && autoCollapsed;
  const sidebarWidth = mobile ? 260 : autoCollapsed ? 72 : 240;

  return (
    <div
      className="bg-surface flex shrink-0 flex-col overflow-hidden"
      style={{
        width: sidebarWidth,
        borderRight: mobile ? 'none' : `1px solid ${COLORS.border}`,
        ...(mobile
          ? ({
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 999 /* Z.SIDEBAR */,
              boxShadow: mobileMenuOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
              transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease',
            } as React.CSSProperties)
          : { transition: 'width 0.25s ease' }),
      }}
    >
      {/* Logo */}
      <div
        className="border-border flex flex-col gap-2.5 border-b"
        style={{ padding: collapsedNav ? '16px 12px' : '16px 20px' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }}
          >
            <Package size={20} className="text-white" />
          </div>
          {!collapsedNav && (
            <div className="flex-1">
              <div className="text-text text-base font-bold tracking-[-0.3px]">ShopChain</div>
              <div className="text-text-dim text-[10px] font-medium tracking-[1px] uppercase">Inventory</div>
            </div>
          )}
          {mobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="text-text-muted p-1"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {/* Active shop badge */}
        {activeShop && (
          <button
            type="button"
            onClick={() => {
              setActiveBranch(null);
              setAuthScreen('shopSelect');
            }}
            className="bg-surface-alt border-border flex w-full items-center rounded-[10px] border text-left transition-all duration-150"
            style={{
              gap: collapsedNav ? 0 : 8,
              padding: collapsedNav ? '6px' : '7px 10px',
              justifyContent: collapsedNav ? 'center' : 'flex-start',
            }}
          >
            <ShopLogo
              shop={activeShop}
              size={collapsedNav ? 28 : 24}
              borderRadius={collapsedNav ? 8 : 6}
              fontSize={collapsedNav ? 16 : 14}
            />
            {!collapsedNav && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-text overflow-hidden text-xs font-bold text-ellipsis whitespace-nowrap">
                    {activeShop.name}
                  </div>
                  <div className="text-text-dim text-[10px]">{activeShop.type}</div>
                </div>
                <ChevronDown size={13} className="text-text-dim shrink-0" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const permKey = NAV_PERM_MAP[item.id];
          const hasAccess = !permKey || canAccess(permKey);
          const parentId = PAGE_PARENT_MAP[page as PageId];
          const isActive = page === item.id || parentId === item.id;
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                if (!hasAccess) {
                  addToastWithTitle('Access Denied', `You don't have permission to access ${item.label}.`, 'deny');
                  return;
                }
                setPage(item.id as PageId);
              }}
              className={clsx(
                'relative flex w-full items-center gap-3 rounded-[10px] text-left text-[13px] transition-all duration-200',
                hasAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
              )}
              style={{
                padding: collapsedNav ? '10px 16px' : '10px 14px',
                background: isActive && hasAccess ? COLORS.primaryBg : 'transparent',
                color: !hasAccess ? COLORS.textDim : isActive ? COLORS.primaryLight : COLORS.textMuted,
                fontWeight: isActive ? 600 : 500,
              }}
              title={collapsedNav ? item.label + (!hasAccess ? ' (locked)' : '') : undefined}
            >
              {isActive && hasAccess && (
                <div className="bg-primary absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-[4px]" />
              )}
              <Icon size={18} />
              {!collapsedNav && <span className="flex-1">{item.label}</span>}
              {!hasAccess && !collapsedNav && <Lock size={12} className="text-text-dim" />}
            </button>
          );
        })}
      </nav>

      {/* Theme Picker */}
      <div className="border-border border-t px-3 pt-2 pb-1">
        <ThemePicker collapsed={collapsedNav} />
      </div>

      {/* Collapse toggle */}
      {!mobile && !tablet && (
        <div className="px-3 pt-1 pb-2">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-text-dim flex w-full items-center justify-center gap-2 rounded-lg p-2 text-xs transition-all duration-200"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronDown size={16} className="rotate-90" /> <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* User profile + Logout */}
      <div className="border-border border-t" style={{ padding: collapsedNav ? '8px' : '8px 12px' }}>
        <div
          className="bg-surface-alt flex items-center rounded-[10px]"
          style={{
            gap: collapsedNav ? 0 : 10,
            padding: collapsedNav ? '6px' : '8px 10px',
          }}
        >
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${getRoleMeta(currentRole).color}80, ${getRoleMeta(currentRole).color}40)`,
            }}
          >
            JA
          </div>
          {!collapsedNav && (
            <div className="min-w-0 flex-1">
              <div className="text-text overflow-hidden text-xs font-bold text-ellipsis whitespace-nowrap">
                Jude Appiah
              </div>
              <div className="text-[10px] font-semibold" style={{ color: getRoleMeta(currentRole).color }}>
                {getRoleMeta(currentRole).icon} {getRoleMeta(currentRole).label}
              </div>
            </div>
          )}
        </div>
        {/* Plan Badge */}
        {!collapsedNav && (
          <button
            type="button"
            onClick={() => setPage('account')}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all duration-150"
            style={{
              background: `${PLAN_TIERS[userPlan as keyof typeof PLAN_TIERS]?.color || COLORS.textDim}08`,
              border: `1px solid ${PLAN_TIERS[userPlan as keyof typeof PLAN_TIERS]?.color || COLORS.textDim}15`,
            }}
          >
            <span className="text-sm">{PLAN_TIERS[userPlan as keyof typeof PLAN_TIERS]?.icon || '🆓'}</span>
            <div className="min-w-0 flex-1">
              <div
                className="text-[11px] font-bold"
                style={{ color: PLAN_TIERS[userPlan as keyof typeof PLAN_TIERS]?.color || COLORS.textDim }}
              >
                {PLAN_TIERS[userPlan as keyof typeof PLAN_TIERS]?.name || 'Free'} Plan
              </div>
            </div>
            {userPlan !== 'max' && <Zap size={12} className="text-accent shrink-0" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setActiveShop(null);
            setActiveBranch(null);
            setAuthScreen('login');
          }}
          className="text-danger mt-1 flex w-full items-center gap-2 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{
            justifyContent: collapsedNav ? 'center' : 'flex-start',
            padding: collapsedNav ? '8px' : '8px 10px',
          }}
        >
          <ArrowLeft size={14} />
          {!collapsedNav && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );
}
