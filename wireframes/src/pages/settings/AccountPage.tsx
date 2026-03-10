import { useState } from 'react';
import clsx from 'clsx';
import { User, CreditCard, Shield, BarChart3, Bell, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useColors, useShop, useAuth } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { PLAN_TIERS, TRIAL_DAYS, PLAN_ORDER, PLAN_FEATURES_TABLE } from '@/constants/plans';
import type { PlanId, PlanLimits } from '@/types';
import { ProfileTab } from './ProfileTab';
import { SubscriptionTab } from './SubscriptionTab';
import { SecurityTab } from './SecurityTab';
import { UsageTab } from './UsageTab';
import { NotificationsTab } from './NotificationsTab';

// ─── Exported types (used by sub-components) ──────────────────

export interface PaymentMethodItem {
  id: string;
  type: string;
  provider: string;
  last4: string;
  name: string;
  role: string;
  added: string;
  status: string;
  expiry?: string;
}

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  avatar: string;
}

export interface PwFormData {
  current: string;
  newPw: string;
  confirm: string;
}

export interface PmFormData {
  type: string;
  provider: string;
  last4: string;
  name: string;
  expiry: string;
}

export interface NotifPrefs {
  [key: string]: { app: boolean; email: boolean; sms: boolean };
}

export interface QuietHoursData {
  enabled: boolean;
  from: string;
  to: string;
}

export interface UsageItemRow {
  label: string;
  used: number;
  max: number;
  suffix?: string;
  formatUsed?: (v: number) => string;
  formatMax?: (v: number) => string;
}

export interface DemoUsageData {
  shops: number;
  branches: number;
  team: number;
  products: number;
  transactions: number;
  storageMB: number;
  suppliers?: number;
  warehouses?: number;
}

export interface RoleInfo {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  access: string;
}

export interface DemoSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface BillingEntry {
  id: string;
  date: string;
  desc: string;
  amount: string;
  status: string;
}

export interface PlanTierData {
  name: string;
  icon: string;
  color: string;
  price: number;
  limits: PlanLimits;
}

// ─── Local constants ───────────────────────────────────────────

interface AccountTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

const ACCOUNT_TABS: AccountTab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const DEMO_SESSIONS: DemoSession[] = [
  { id: 's1', device: 'Chrome on Windows', location: 'Accra, Ghana', lastActive: 'Now', current: true },
  { id: 's2', device: 'Safari on iPhone', location: 'Accra, Ghana', lastActive: '2 hours ago', current: false },
  { id: 's3', device: 'Firefox on MacOS', location: 'Kumasi, Ghana', lastActive: '3 days ago', current: false },
];

const DEMO_BILLING: BillingEntry[] = [
  {
    id: 'inv-001',
    date: '2026-02-01',
    desc: 'Max Plan \u2014 February 2026',
    amount: 'GH\u20B5 149.00',
    status: 'paid',
  },
  {
    id: 'inv-002',
    date: '2026-01-01',
    desc: 'Max Plan \u2014 January 2026',
    amount: 'GH\u20B5 149.00',
    status: 'paid',
  },
  {
    id: 'inv-003',
    date: '2025-12-01',
    desc: 'Basic Plan \u2014 December 2025',
    amount: 'GH\u20B5 49.00',
    status: 'paid',
  },
];

const DEMO_USAGE: DemoUsageData = { shops: 1, branches: 2, team: 5, products: 42, transactions: 87, storageMB: 45 };

const ROLES: RoleInfo[] = [
  {
    id: 'owner',
    label: 'Owner',
    icon: '\uD83D\uDC51',
    color: '#F59E0B',
    description: 'Full access including billing, shop deletion, and team management',
    access: 'Everything',
  },
  {
    id: 'general_manager',
    label: 'General Manager',
    icon: '\uD83C\uDF10',
    color: '#0EA5E9',
    description: 'Full operational access across all branches',
    access: 'All branches',
  },
  {
    id: 'manager',
    label: 'Manager',
    icon: '\uD83D\uDD37',
    color: '#3B82F6',
    description: 'All operations except billing and shop deletion',
    access: 'Dashboard, Products, POS, Orders, Suppliers, Warehouses, Team, Reports',
  },
  {
    id: 'inventory_manager',
    label: 'Inventory Manager',
    icon: '\uD83D\uDCE6',
    color: '#10B981',
    description: 'Full inventory control',
    access: 'Products, Categories, Units, Purchase Orders, Warehouses',
  },
  {
    id: 'inventory_officer',
    label: 'Inventory Officer',
    icon: '\uD83D\uDCCB',
    color: '#06B6D4',
    description: 'Day-to-day stock operations',
    access: 'Products, Adjustments, Transfers, Receiving',
  },
  {
    id: 'salesperson',
    label: 'Salesperson',
    icon: '\uD83D\uDED2',
    color: '#8B5CF6',
    description: 'POS access and customer-facing operations',
    access: 'POS, View products',
  },
  {
    id: 'cashier',
    label: 'Cashier',
    icon: '\uD83D\uDCB0',
    color: '#EF4444',
    description: 'POS register only',
    access: 'POS only',
  },
  {
    id: 'accountant',
    label: 'Accountant',
    icon: '\uD83D\uDCCA',
    color: '#F97316',
    description: 'Financial oversight',
    access: 'Dashboard analytics, Reports',
  },
  {
    id: 'viewer',
    label: 'Viewer',
    icon: '\uD83D\uDC41\uFE0F',
    color: '#6B7280',
    description: 'Read-only access across all modules',
    access: 'View everything',
  },
];

// ─── Component ─────────────────────────────────────────────────

export const AccountPage = () => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { userPlan, setUserPlan, trialDaysLeft, liveUsage } = useShop();
  const { currentRole: currentUserRole } = useAuth();
  const mobile = isMobile(bp);

  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState<ProfileData>({
    name: 'Jude Appiah',
    email: 'jude@shopchain.com',
    phone: '+233 24 111 2222',
    company: 'ShopChain Demo Ltd',
    city: 'Accra',
    avatar: 'JA',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [pwForm, setPwForm] = useState<PwFormData>({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [sessions, setSessions] = useState<DemoSession[]>(DEMO_SESSIONS);
  const [payMethods, setPayMethods] = useState<PaymentMethodItem[]>([
    {
      id: 'pm1',
      type: 'momo',
      provider: 'MTN MoMo',
      last4: '2222',
      name: 'Jude Appiah',
      role: 'primary',
      added: '2025-06-15',
      status: 'active',
    },
    {
      id: 'pm2',
      type: 'card',
      provider: 'Visa',
      last4: '8841',
      name: 'Jude Appiah',
      expiry: '09/27',
      role: 'backup',
      added: '2025-08-01',
      status: 'active',
    },
  ]);
  const [autoPay, setAutoPay] = useState(true);
  const [showAddPM, setShowAddPM] = useState(false);
  const [editPM, setEditPM] = useState<string | null>(null);
  const [pmForm, setPmForm] = useState<PmFormData>({
    type: 'momo',
    provider: '',
    last4: '',
    name: 'Jude Appiah',
    expiry: '',
  });
  const [confirmRemovePM, setConfirmRemovePM] = useState<PaymentMethodItem | null>(null);

  const renewalDate = new Date('2026-03-01');
  const today = new Date();
  const daysToRenew = Math.max(0, Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    low_stock: { app: true, email: true, sms: false },
    new_member: { app: true, email: false, sms: false },
    pos_summary: { app: false, email: true, sms: false },
    po_updates: { app: true, email: true, sms: false },
    billing: { app: true, email: true, sms: true },
    security: { app: true, email: true, sms: true },
    announcements: { app: true, email: false, sms: false },
    weekly_digest: { app: false, email: true, sms: false },
  });
  const [quietHours, setQuietHours] = useState<QuietHoursData>({ enabled: false, from: '22:00', to: '06:00' });

  const plan = PLAN_TIERS[userPlan as PlanId] || PLAN_TIERS.free;

  // ─── Handlers ─────────────────────────────────────────────

  const handleProfileSave = () => {
    setProfileSaving(true);
    setTimeout(() => {
      setProfileSaving(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    }, 800);
  };

  const handlePwSave = () => {
    setPwSaving(true);
    setTimeout(() => {
      setPwSaving(false);
      setPwSaved(true);
      setPwForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 2000);
    }, 800);
  };

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((x) => x.id !== id));
  };

  const handleRevokeAllOther = () => {
    setSessions((prev) => prev.filter((s) => s.current));
  };

  // ─── Usage tab data ───────────────────────────────────────

  const u: DemoUsageData = (liveUsage as DemoUsageData) || DEMO_USAGE;
  const isDecisionMaker = ['owner', 'manager', 'general_manager'].includes(currentUserRole);
  const roleMeta = ROLES.find((r) => r.id === currentUserRole);
  const usageItems: UsageItemRow[] = [
    { label: 'Shops', used: u.shops, max: plan.limits.shops },
    {
      label: 'Branches',
      used: u.branches,
      max: plan.limits.branchesPerShop === -1 ? -1 : plan.limits.branchesPerShop * Math.max(u.shops, 1),
    },
    { label: 'Team Members', used: u.team, max: plan.limits.teamPerShop },
    { label: 'Products', used: u.products, max: plan.limits.productsPerShop },
    { label: 'Monthly Transactions', used: u.transactions, max: plan.limits.monthlyTransactions },
    { label: 'Suppliers', used: u.suppliers || 0, max: plan.limits.suppliers },
    { label: 'Warehouses', used: u.warehouses || 0, max: plan.limits.warehouses },
    {
      label: 'Storage',
      used: u.storageMB,
      max: plan.limits.storageMB,
      suffix: 'MB',
      formatUsed: (v: number) => (v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v} MB`),
      formatMax: (v: number) => (v >= 1024 ? `${v / 1024} GB` : `${v} MB`),
    },
  ];
  const usageWarnings = usageItems.filter(
    (it) => it.max !== -1 && it.max > 0 && it.used / it.max >= 0.8 && it.used / it.max < 1,
  );
  const usageBlocked = usageItems.filter((it) => it.max !== -1 && it.max > 0 && it.used >= it.max);

  return (
    <div className="mx-auto max-w-[800px]" style={{ animation: 'modalIn 0.25s ease' }}>
      {/* Trial Banner */}
      {trialDaysLeft > 0 && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl px-[18px] py-3"
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent}15, ${COLORS.primary}10)`,
            border: `1.5px solid ${COLORS.accent}25`,
          }}
        >
          <span className="text-lg">{'\uD83C\uDF89'}</span>
          <div className="min-w-[180px] flex-1">
            <div className="text-text text-[13px] font-bold">
              Day {TRIAL_DAYS - trialDaysLeft + 1} of {TRIAL_DAYS} — Max Trial
            </div>
            <div className="text-text-dim text-[11px]">{trialDaysLeft} days left. Upgrade to keep all features.</div>
          </div>
          <button
            type="button"
            onClick={() => setShowPlanModal(true)}
            className="rounded-lg border-none px-4 py-[7px] font-[inherit] text-xs font-bold whitespace-nowrap text-white"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-5 flex gap-1 overflow-x-auto pb-1">
        {ACCOUNT_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-[10px] font-[inherit] text-xs whitespace-nowrap"
              style={{
                padding: mobile ? '8px 12px' : '9px 16px',
                border: `1.5px solid ${active ? COLORS.primary : COLORS.border}`,
                background: active ? COLORS.primaryBg : 'transparent',
                fontWeight: active ? 700 : 600,
                color: active ? COLORS.primary : COLORS.textMuted,
              }}
            >
              <t.icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── PROFILE TAB ─── */}
      {tab === 'profile' && (
        <ProfileTab
          profile={profile}
          setProfile={setProfile}
          profileSaving={profileSaving}
          profileSaved={profileSaved}
          onSave={handleProfileSave}
          plan={plan}
          COLORS={COLORS}
          bp={bp}
        />
      )}

      {/* ─── SUBSCRIPTION TAB ─── */}
      {tab === 'subscription' && (
        <SubscriptionTab
          plan={plan}
          payMethods={payMethods}
          setPayMethods={setPayMethods}
          autoPay={autoPay}
          setAutoPay={setAutoPay}
          billingHistory={DEMO_BILLING}
          pmForm={pmForm}
          setPmForm={setPmForm}
          showAddPM={showAddPM}
          setShowAddPM={setShowAddPM}
          editPM={editPM}
          setEditPM={setEditPM}
          confirmRemovePM={confirmRemovePM}
          setConfirmRemovePM={setConfirmRemovePM}
          profileName={profile.name}
          renewalDate={renewalDate}
          daysToRenew={daysToRenew}
          setShowPlanModal={setShowPlanModal}
          COLORS={COLORS}
          bp={bp}
        />
      )}

      {/* ─── SECURITY TAB ─── */}
      {tab === 'security' && (
        <SecurityTab
          pwForm={pwForm}
          setPwForm={setPwForm}
          pwSaving={pwSaving}
          pwSaved={pwSaved}
          onPwSave={handlePwSave}
          twoFAEnabled={twoFAEnabled}
          setTwoFAEnabled={setTwoFAEnabled}
          showQR={showQR}
          setShowQR={setShowQR}
          sessions={sessions}
          onRevokeSession={handleRevokeSession}
          onRevokeAllOther={handleRevokeAllOther}
          COLORS={COLORS}
          bp={bp}
        />
      )}

      {/* ─── USAGE TAB ─── */}
      {tab === 'usage' && (
        <UsageTab
          usage={u}
          plan={plan}
          usageItems={usageItems}
          warnings={usageWarnings}
          blocked={usageBlocked}
          isDecisionMaker={isDecisionMaker}
          roleMeta={roleMeta}
          currentRole={currentUserRole}
          userPlan={userPlan}
          setShowPlanModal={setShowPlanModal}
          COLORS={COLORS}
          bp={bp}
        />
      )}

      {/* ─── NOTIFICATIONS TAB ─── */}
      {tab === 'notifications' && (
        <NotificationsTab
          notifPrefs={notifPrefs}
          setNotifPrefs={setNotifPrefs}
          quietHours={quietHours}
          setQuietHours={setQuietHours}
          COLORS={COLORS}
          bp={bp}
        />
      )}

      {/* ─── PLAN COMPARISON MODAL ─── */}
      {showPlanModal && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[6px]"
          onClick={() => setShowPlanModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-border max-h-[90vh] w-full max-w-[680px] overflow-auto rounded-[18px] border-[1.5px]"
            style={{ animation: 'modalIn 0.25s ease' }}
          >
            <div className="border-border bg-surface sticky top-0 z-[2] flex items-center justify-between rounded-t-[18px] border-b px-6 py-5">
              <div>
                <div className="text-text text-lg font-extrabold">Choose Your Plan</div>
                <div className="text-text-dim text-xs">
                  All prices in GH{'\u20B5'} {'\u00B7'} Cancel anytime
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                aria-label="Close"
                className="text-text-dim p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {/* Plan cards */}
              <div className="mb-6 grid gap-3" style={{ gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)' }}>
                {PLAN_ORDER.map((pid) => {
                  const p = PLAN_TIERS[pid];
                  const current = pid === userPlan;
                  const recommended = pid === 'basic';
                  return (
                    <div
                      key={pid}
                      className="relative rounded-[14px] p-[18px] transition-all duration-200"
                      style={{
                        background: current ? `${p.color}08` : COLORS.surfaceAlt,
                        border: `2px solid ${current ? p.color : COLORS.border}`,
                      }}
                    >
                      {recommended && !current && (
                        <div
                          className="absolute top-[-10px] left-1/2 -translate-x-1/2 rounded-md px-2.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase"
                          style={{
                            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                          }}
                        >
                          Recommended
                        </div>
                      )}
                      <div className="mb-3.5 text-center">
                        <div className="text-[28px]">{p.icon}</div>
                        <div className="text-text mt-1 text-base font-extrabold">{p.name}</div>
                        <div className="mt-1 text-2xl font-extrabold" style={{ color: p.color }}>
                          {p.price === 0 ? 'Free' : `\u20B5${p.price}`}
                          <span className="text-text-dim text-xs font-medium">{p.price > 0 ? '/mo' : ''}</span>
                        </div>
                      </div>
                      <div className="mb-4 flex flex-col gap-1.5">
                        {PLAN_FEATURES_TABLE.slice(0, 5).map((ft) => (
                          <div key={ft.key} className="text-text-dim flex justify-between text-[11px]">
                            <span>{ft.label}</span>
                            <span className="text-text font-bold">{ft.format(p.limits[ft.key])}</span>
                          </div>
                        ))}
                      </div>
                      {current ? (
                        <div className="bg-surface-alt text-text-dim rounded-lg px-4 py-[9px] text-center text-xs font-bold">
                          Current Plan
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUserPlan(pid);
                            setShowPlanModal(false);
                          }}
                          className="w-full rounded-lg border-none px-4 py-2.5 font-[inherit] text-xs font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${p.color}, ${p.color}CC)`,
                            boxShadow: `0 4px 12px ${p.color}30`,
                          }}
                        >
                          {PLAN_ORDER.indexOf(pid) > PLAN_ORDER.indexOf(userPlan as PlanId) ? 'Upgrade' : 'Downgrade'}{' '}
                          to {p.name}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detailed comparison */}
              <div className="border-border overflow-hidden rounded-xl border">
                <div className="bg-surface-alt text-text px-4 py-2.5 text-xs font-bold">Detailed Comparison</div>
                {PLAN_FEATURES_TABLE.map((ft, i) => (
                  <div
                    key={ft.key}
                    className={clsx(
                      'border-border grid items-center border-t px-4 py-2.5 text-[11px]',
                      i % 2 !== 0 && 'bg-surface-alt',
                    )}
                    style={{
                      gridTemplateColumns: mobile ? '1fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr',
                    }}
                  >
                    <div className="text-text-muted font-semibold">{ft.label}</div>
                    {PLAN_ORDER.map((pid) => (
                      <div key={pid} className="text-text text-center font-bold">
                        {ft.format(PLAN_TIERS[pid].limits[ft.key])}
                      </div>
                    ))}
                  </div>
                ))}
                {/* Feature rows */}
                {[
                  { label: 'Barcode Scanner', values: ['\u2014', '\u2713', '\u2713'] },
                  { label: 'Purchase Orders', values: ['View', 'Full', 'Auto-reorder'] },
                  { label: 'API Access', values: ['\u2014', '\u2014', '\u2713'] },
                  { label: 'Custom Branding', values: ['\u2014', '\u2014', '\u2713'] },
                  { label: 'General Manager Role', values: ['\u2014', '\u2014', '\u2713'] },
                  { label: '2FA Security', values: ['\u2014', '\u2713', '\u2713'] },
                  { label: 'Priority Support', values: ['Community', 'Email 48h', 'WhatsApp 4h'] },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className="border-border grid items-center border-t px-4 py-2.5 text-[11px]"
                    style={{
                      gridTemplateColumns: mobile ? '1fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr',
                      background: (PLAN_FEATURES_TABLE.length + i) % 2 === 0 ? 'transparent' : COLORS.surfaceAlt,
                    }}
                  >
                    <div className="text-text-muted font-semibold">{row.label}</div>
                    {row.values.map((v, vi) => (
                      <div
                        key={vi}
                        className="text-center font-bold"
                        style={{
                          color: v === '\u2014' ? COLORS.textDim : v === '\u2713' ? COLORS.success : COLORS.text,
                        }}
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
