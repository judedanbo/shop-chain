import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Shield,
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  Bell,
  FileText,
  Settings,
  ArrowLeft,
  Menu,
  BarChart3,
} from 'lucide-react';
import { useAuth, useColors } from '@/context';
import { TabButton } from '@/components/ui';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { ADMIN_DEMO_USERS, ADMIN_DEMO_SHOPS } from '@/constants/adminData';
import { ADMIN_THEMES, syncAdminCssVars, type AdminThemeId, type AdminThemeColors } from '@/constants/adminThemes';
import type { AdminUserRecord } from '@/types/admin.types';

/* ── Lazy-loaded tab components ── */
const AdminOverviewTab = lazy(() => import('./AdminOverviewTab').then((m) => ({ default: m.AdminOverviewTab })));
const AdminUsersTab = lazy(() => import('./AdminUsersTab').then((m) => ({ default: m.AdminUsersTab })));
const AdminShopsTab = lazy(() => import('./AdminShopsTab').then((m) => ({ default: m.AdminShopsTab })));
const AdminSubscriptionsTab = lazy(() =>
  import('./AdminSubscriptionsTab').then((m) => ({ default: m.AdminSubscriptionsTab })),
);
const AdminFinancesTab = lazy(() => import('./AdminFinancesTab').then((m) => ({ default: m.AdminFinancesTab })));
const AdminInvestorsTab = lazy(() => import('./AdminInvestorsTab').then((m) => ({ default: m.AdminInvestorsTab })));
const AdminAnnouncementsTab = lazy(() =>
  import('./AdminAnnouncementsTab').then((m) => ({ default: m.AdminAnnouncementsTab })),
);
const AdminAuditFraudTab = lazy(() => import('./AdminAuditFraudTab').then((m) => ({ default: m.AdminAuditFraudTab })));
const AdminTeamTab = lazy(() => import('./AdminTeamTab').then((m) => ({ default: m.AdminTeamTab })));
const AdminSettingsTab = lazy(() => import('./AdminSettingsTab').then((m) => ({ default: m.AdminSettingsTab })));

/* ── Admin navigation ── */
const ADMIN_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'shops', label: 'Shops', icon: Store },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'finances', label: 'Finances', icon: BarChart3 },
  { id: 'investors', label: 'Investors', icon: BarChart3 },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'audit', label: 'Audit & Fraud', icon: FileText },
  { id: 'team', label: 'Admin Team', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/* ── Spinner fallback ── */
const TabLoader: React.FC<{ C: AdminThemeColors }> = ({ C }) => (
  <div className="flex h-full min-h-[200px] items-center justify-center">
    <div
      className="h-7 w-7 rounded-full"
      style={{
        border: `3px solid ${C.border}`,
        borderTopColor: C.primary,
        animation: 'spin 0.8s linear infinite',
      }}
    />
  </div>
);

/* ── Map AdminUser from constants to AdminUserRecord (loose → strict) ── */
const toUserRecords = (users: typeof ADMIN_DEMO_USERS): AdminUserRecord[] =>
  users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    status: u.status as AdminUserRecord['status'],
    plan: u.plan as AdminUserRecord['plan'],
    shops: u.shops,
    branches: u.branches,
    joined: u.joined,
    lastActive: u.lastActive,
    avatar: u.avatar,
  }));

export const SuperAdminDashboard: React.FC = () => {
  const { setAuthScreen } = useAuth();
  const userColors = useColors();
  const bp = useBreakpoint();
  const mobile = isMobile(bp);

  /* ── Theme ── */
  const [adminTheme, setAdminTheme] = useState<AdminThemeId>('dark');
  const C = ADMIN_THEMES[adminTheme];

  /* Sync admin palette to CSS custom properties so Tailwind semantic classes work */
  useEffect(() => {
    syncAdminCssVars(C);
    return () => syncAdminCssVars(userColors);
  }, [C, userColors]);

  /* ── Navigation ── */
  const [adminPage, setAdminPage] = useState('overview');
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(!mobile);

  /* ── Shared admin data ── */
  const [users, setUsers] = useState(() => toUserRecords(ADMIN_DEMO_USERS));
  const shops = ADMIN_DEMO_SHOPS;

  useEffect(() => {
    if (mobile) setAdminSidebarOpen(false);
  }, [adminPage, mobile]);

  const sideW = mobile ? 240 : 220;

  const renderTab = () => {
    const fallback = <TabLoader C={C} />;
    return (
      <Suspense fallback={fallback}>
        {(() => {
          switch (adminPage) {
            case 'overview':
              return <AdminOverviewTab C={C} users={users} shops={shops} />;
            case 'users':
              return <AdminUsersTab C={C} users={users} setUsers={setUsers} />;
            case 'shops':
              return <AdminShopsTab C={C} shops={shops} users={users} />;
            case 'subscriptions':
              return <AdminSubscriptionsTab C={C} users={users} />;
            case 'finances':
              return <AdminFinancesTab C={C} />;
            case 'investors':
              return <AdminInvestorsTab C={C} />;
            case 'announcements':
              return <AdminAnnouncementsTab C={C} />;
            case 'audit':
              return <AdminAuditFraudTab C={C} />;
            case 'team':
              return <AdminTeamTab C={C} />;
            case 'settings':
              return <AdminSettingsTab C={C} adminTheme={adminTheme} setAdminTheme={setAdminTheme} />;
            default:
              return <AdminOverviewTab C={C} users={users} shops={shops} />;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className="bg-bg text-text flex min-h-screen font-[Inter,system-ui,sans-serif]">
      {/* ── Sidebar ── */}
      {(adminSidebarOpen || !mobile) && (
        <>
          {mobile && (
            <div
              aria-hidden="true"
              className="z-mobile-overlay fixed inset-0 bg-black/50"
              onClick={() => setAdminSidebarOpen(false)}
            />
          )}
          <aside
            className="bg-surface flex shrink-0 flex-col"
            style={{
              width: sideW,
              borderRight: `1.5px solid ${C.border}`,
              ...(mobile ? { position: 'fixed' as const, left: 0, top: 0, bottom: 0, zIndex: 999 } : {}),
            }}
          >
            {/* Brand */}
            <div className="border-border border-b px-[18px] py-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                  style={{ background: `linear-gradient(135deg, ${C.adminAccent}, ${C.adminAccent}BB)` }}
                >
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-text text-sm font-extrabold">ShopChain</div>
                  <div
                    className="text-[10px] font-semibold tracking-[0.8px] uppercase"
                    style={{ color: C.adminAccent }}
                  >
                    Admin Portal
                  </div>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3">
              {ADMIN_NAV.map((item) => {
                const active = adminPage === item.id;
                return (
                  <TabButton
                    key={item.id}
                    active={active}
                    variant="filter"
                    onClick={() => setAdminPage(item.id)}
                    className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5"
                    style={{
                      background: active ? C.primaryBg : 'transparent',
                      color: active ? C.primary : C.textMuted,
                      border: `1.5px solid ${active ? C.primary + '40' : 'transparent'}`,
                    }}
                  >
                    <item.icon size={16} style={{ color: active ? C.primary : C.textDim }} />
                    <span className="text-[13px]" style={{ fontWeight: active ? 700 : 500 }}>
                      {item.label}
                    </span>
                  </TabButton>
                );
              })}
            </nav>

            {/* Footer: theme toggle + exit */}
            <div className="border-border border-t px-2.5 py-3">
              <div className="mb-2.5 flex gap-2 px-3.5">
                {(['dark', 'light'] as const).map((t) => (
                  <TabButton
                    key={t}
                    active={adminTheme === t}
                    variant="filter"
                    onClick={() => setAdminTheme(t)}
                    className="rounded-lg py-1.5 text-center text-[11px]"
                    style={{
                      flex: 1,
                      background: adminTheme === t ? C.primaryBg : 'transparent',
                      color: adminTheme === t ? C.primary : C.textDim,
                      border: `1px solid ${adminTheme === t ? C.primary + '30' : 'transparent'}`,
                    }}
                  >
                    {t === 'dark' ? '🌙' : '☀️'} {t}
                  </TabButton>
                ))}
              </div>
              <div
                className="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3.5 py-2.5"
                style={{ color: C.adminAccent }}
                onClick={() => setAuthScreen('login')}
              >
                <ArrowLeft size={16} /> <span className="text-[13px] font-semibold">Exit Admin</span>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ── Main content area ── */}
      <div className="bg-bg flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="bg-surface border-border flex h-14 shrink-0 items-center gap-3 border-b-[1.5px] px-5">
          {mobile && (
            <button
              type="button"
              aria-label="Open menu"
              className="text-text-muted"
              onClick={() => setAdminSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
          )}
          <div className="text-text text-base font-extrabold">
            {ADMIN_NAV.find((n) => n.id === adminPage)?.label || 'Overview'}
          </div>
          <div className="flex-1" />
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">{renderTab()}</div>
      </div>
    </div>
  );
};
