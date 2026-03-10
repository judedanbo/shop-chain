import { useState } from 'react';
import clsx from 'clsx';
import {
  CreditCard,
  Users,
  BarChart3,
  Settings,
  Plus,
  Minus,
  Check,
  X,
  Gift,
  Edit,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import type { AdminUserRecord, PlanLifecycle } from '@/types/admin.types';
import { PLAN_TIERS, PLAN_ORDER } from '@/constants/plans';
import type { PlanId } from '@/types';
import { MOCK_PAYMENT_METHODS, MOCK_PAYMENT_HISTORY, MOCK_USER_USAGE, PLAN_ICON_OPTIONS } from '@/constants/adminData';
import { computePlanUsage } from '@/utils/planUsage';
import type { AdminThemeColors } from '@/constants/adminThemes';

interface AdminSubscriptionsTabProps {
  C: AdminThemeColors;
  users: AdminUserRecord[];
}

type SubTab = 'overview' | 'plans' | 'userSubs' | 'usage';

const LIMIT_LABELS: Record<string, string> = {
  shops: 'Shops',
  branchesPerShop: 'Branches / Shop',
  teamPerShop: 'Team / Shop',
  productsPerShop: 'Products / Shop',
  monthlyTransactions: 'Monthly Transactions',
  storageMB: 'Storage (MB)',
  suppliers: 'Suppliers',
  warehouses: 'Warehouses',
};

const USAGE_KEYS: { key: string; label: string; limitKey: string }[] = [
  { key: 'shops', label: 'Shops', limitKey: 'shops' },
  { key: 'branches', label: 'Branches', limitKey: 'branchesPerShop' },
  { key: 'team', label: 'Team', limitKey: 'teamPerShop' },
  { key: 'products', label: 'Products', limitKey: 'productsPerShop' },
  { key: 'transactions', label: 'Transactions', limitKey: 'monthlyTransactions' },
  { key: 'storageMB', label: 'Storage (MB)', limitKey: 'storageMB' },
];

interface NewPlanForm {
  name: string;
  icon: string;
  color: string;
  price: number;
  lifecycle: 'draft' | 'active';
}

interface LocalPlan {
  id: string;
  name: string;
  icon: string;
  color: string;
  price: number;
  lifecycle: PlanLifecycle;
  availableFrom: string | null;
  retireAt: string | null;
  migrateAt: string | null;
  fallbackPlanId: string | null;
  grandfathered: boolean;
  limits: Record<string, number>;
  features: Record<string, unknown>;
}

interface PlanFormState {
  lifecycle: PlanLifecycle;
  availableFrom: string | null;
  retireAt: string | null;
  migrateAt: string | null;
  fallbackPlanId: string | null;
  grandfathered: boolean;
}

const COLOR_OPTIONS = [
  '#6B7280',
  '#3B82F6',
  '#8B5CF6',
  '#F97316',
  '#EF4444',
  '#059669',
  '#EC4899',
  '#06B6D4',
  '#D97706',
];

export function AdminSubscriptionsTab({ C, users }: AdminSubscriptionsTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showExemptionModal, setShowExemptionModal] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState<NewPlanForm>({
    name: '',
    icon: '⭐',
    color: '#F97316',
    price: 0,
    lifecycle: 'draft',
  });
  const [adminPlans, setAdminPlans] = useState<LocalPlan[]>(() =>
    PLAN_ORDER.map((pid) => {
      const t = PLAN_TIERS[pid];
      return {
        id: pid,
        name: t.name,
        icon: t.icon,
        color: t.color,
        price: t.price,
        lifecycle: 'active' as PlanLifecycle,
        availableFrom: null,
        retireAt: null,
        migrateAt: null,
        fallbackPlanId: null,
        grandfathered: false,
        limits: { ...t.limits },
        features: { ...t.features },
      };
    }),
  );
  const [planForm, setPlanForm] = useState<PlanFormState>({
    lifecycle: 'active',
    availableFrom: null,
    retireAt: null,
    migrateAt: null,
    fallbackPlanId: null,
    grandfathered: false,
  });

  // ─── Lifecycle definitions ────────────────────────────────
  const LIFECYCLE: Record<
    string,
    { label: string; color: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }>; desc: string }
  > = {
    draft: { label: 'Draft', color: C.textDim ?? '#999', icon: Edit, desc: 'Not visible to users' },
    scheduled: { label: 'Scheduled', color: C.primary ?? '#3B82F6', icon: Clock, desc: 'Goes live on activation date' },
    active: { label: 'Active', color: C.success ?? '#10B981', icon: CheckCircle, desc: 'Available for new signups' },
    retiring: {
      label: 'Retiring',
      color: C.warning ?? '#F59E0B',
      icon: AlertTriangle,
      desc: 'No new signups after retire date',
    },
    retired: { label: 'Retired', color: C.textDim ?? '#999', icon: Lock, desc: 'Fully retired' },
  };

  const planLifecycleBadge = (lc: string) => {
    const l = LIFECYCLE[lc] ?? LIFECYCLE['active']!;
    const LcIcon = l.icon;
    return (
      <span
        className="inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[10px] font-bold"
        style={{
          background: `${l.color}30`,
          color: l.color,
        }}
      >
        <LcIcon size={10} />
        {l.label}
      </span>
    );
  };

  const getAdminPlan = (id: string) => adminPlans.find((p) => p.id === id);

  // ─── Helper badges ──────────────────────────────────────────
  const planBadge = (planId: string) => {
    const p = (PLAN_TIERS as Record<string, (typeof PLAN_TIERS)[PlanId]>)[planId] ?? PLAN_TIERS.free;
    return (
      <span
        className="rounded-[5px] px-2 py-0.5 text-[10px] font-bold"
        style={{
          background: `${p.color}35`,
          color: p.color,
        }}
      >
        {p.icon} {p.name}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      active: { bg: `${C.success ?? ''}38`, color: C.success ?? '' },
      deactivated: { bg: `${C.danger ?? ''}38`, color: C.danger ?? '' },
      pending: { bg: C.warningBg ?? '', color: C.warning ?? '' },
      suspended: { bg: `${C.danger ?? ''}38`, color: C.danger ?? '' },
    };
    const s = map[status] ?? map['active']!;
    return (
      <span
        className="rounded-[5px] px-2 py-0.5 text-[10px] font-bold capitalize"
        style={{
          background: s.bg,
          color: s.color,
        }}
      >
        {status}
      </span>
    );
  };

  const payTxBadge = (status: string) => {
    const m: Record<string, { bg: string; color: string }> = {
      paid: { bg: `${C.success ?? ''}38`, color: C.success ?? '' },
      failed: { bg: `${C.danger ?? ''}38`, color: C.danger ?? '' },
      refunded: { bg: `${C.warning ?? ''}38`, color: C.warning ?? '' },
    };
    const s = m[status] ?? m['paid']!;
    return (
      <span
        className="rounded px-1.5 py-0.5 text-[10px] font-bold capitalize"
        style={{
          background: s.bg,
          color: s.color,
        }}
      >
        {status}
      </span>
    );
  };

  // ─── Computed metrics ───────────────────────────────────────
  const planCounts: Record<string, number> = {};
  const planRevenue: Record<string, number> = {};
  for (const pid of PLAN_ORDER) {
    planCounts[pid] = 0;
    planRevenue[pid] = 0;
  }
  users.forEach((u) => {
    planCounts[u.plan] = (planCounts[u.plan] ?? 0) + 1;
    planRevenue[u.plan] = (planRevenue[u.plan] ?? 0) + PLAN_TIERS[u.plan].price;
  });
  const mrr = Object.values(planRevenue).reduce((a, b) => a + b, 0);
  const activeSubscribers = users.filter((u) => u.plan !== 'free' && u.status === 'active').length;
  const arpu = activeSubscribers > 0 ? mrr / activeSubscribers : 0;

  // ─── Shared styles ──────────────────────────────────────────
  const cardCls = 'p-5 rounded-[14px] bg-surface';
  const cardDyn: React.CSSProperties = {
    border: `1.5px solid ${C.border}`,
  };
  const inputCls =
    'rounded-[10px] px-3.5 py-2.5 text-[13px] font-[inherit] outline-none box-border bg-surface-alt text-text';
  const inputDyn: React.CSSProperties = {
    border: `1.5px solid ${C.border}`,
  };

  // ─── Sub-tab pills ─────────────────────────────────────────
  const tabs: { id: SubTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'plans', label: 'Plans' },
    { id: 'userSubs', label: 'User Subs' },
    { id: 'usage', label: 'Usage' },
  ];

  const renderPills = () => (
    <div className="mb-5 flex flex-wrap gap-1.5">
      {tabs.map((t) => {
        const active = subTab === t.id;
        return (
          <button
            type="button"
            key={t.id}
            onClick={() => {
              setSubTab(t.id);
              setEditingPlan(null);
              setSelectedUserId(null);
            }}
            className={clsx(
              'rounded-[10px] px-4 py-2 font-[inherit] text-xs font-semibold',
              active ? 'bg-primary-bg text-primary' : 'text-text-muted',
            )}
            style={{
              border: active ? `1.5px solid ${C.primary}30` : '1.5px solid transparent',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 1 — Overview
  // ═══════════════════════════════════════════════════════════
  const renderOverview = () => (
    <div>
      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {[
          { label: 'MRR', value: `$${mrr.toLocaleString()}`, icon: <CreditCard size={16} color={C.primary} /> },
          { label: 'ARPU', value: `$${arpu.toFixed(2)}`, icon: <Users size={16} color={C.success} /> },
          {
            label: 'Active Subscribers',
            value: String(activeSubscribers),
            icon: <BarChart3 size={16} color={C.warning} />,
          },
        ].map((kpi, i) => (
          <div key={i} className={cardCls} style={cardDyn}>
            <div className="mb-2 flex items-center gap-2">
              {kpi.icon}
              <span className="text-text-muted text-[11px] font-semibold">{kpi.label}</span>
            </div>
            <div className="text-text text-[22px] font-bold">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Plan breakdown table */}
      <div className={`${cardCls} mb-5 overflow-x-auto`} style={cardDyn}>
        <div className="text-text mb-3 text-[13px] font-bold">Plan Breakdown</div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-border border-b">
              {['Plan', 'Users', 'Revenue', '% of Total'].map((h) => (
                <th key={h} className="text-text-muted px-2.5 py-2 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_ORDER.map((pid) => {
              const count = planCounts[pid] ?? 0;
              const rev = planRevenue[pid] ?? 0;
              const pct = mrr > 0 ? ((rev / mrr) * 100).toFixed(1) : '0.0';
              return (
                <tr key={pid} className="border-b-border/[0.13] border-b">
                  <td className="px-2.5 py-2">{planBadge(pid)}</td>
                  <td className="text-text px-2.5 py-2">{count}</td>
                  <td className="text-text px-2.5 py-2">${rev.toLocaleString()}</td>
                  <td className="text-text-muted px-2.5 py-2">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Exemptions */}
      <div className={cardCls} style={cardDyn}>
        <div className="mb-3 flex items-center gap-2">
          <Gift size={14} color={C.textMuted} />
          <span className="text-text text-[13px] font-bold">Payment Exemptions</span>
        </div>
        <div className="text-text-dim p-[30px] text-center text-[13px]">No active exemptions</div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 2 — Plans
  // ═══════════════════════════════════════════════════════════
  const renderPlans = () => {
    const sortedPlans = [...adminPlans].sort((a, b) => a.price - b.price);
    const activePlans = sortedPlans.filter((p) => p.lifecycle === 'active' || p.lifecycle === 'retiring');
    const draftScheduledPlans = sortedPlans.filter((p) => p.lifecycle === 'draft' || p.lifecycle === 'scheduled');
    const retiredPlans = sortedPlans.filter((p) => p.lifecycle === 'retired');

    const renderPlanGroup = (plans: LocalPlan[], title: string) => {
      if (plans.length === 0) return null;
      return (
        <div className="mb-5">
          <div className="text-text-muted mb-2.5 text-xs font-bold tracking-[0.5px] uppercase">{title}</div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {plans.map((plan) => {
              const count = planCounts[plan.id] ?? 0;
              const rev = planRevenue[plan.id] ?? 0;
              return (
                <div key={plan.id} className={`${cardCls} relative overflow-hidden`} style={cardDyn}>
                  <div className="absolute top-0 right-0 left-0 h-1" style={{ background: plan.color }} />
                  <div className="mt-1 mb-1.5 flex items-center gap-2">
                    <span className="text-[22px]">{plan.icon}</span>
                    <div className="flex-1">
                      <div className="text-text text-[15px] font-bold">{plan.name}</div>
                      <div className="text-text-muted text-xs">${plan.price}/mo</div>
                    </div>
                    {planLifecycleBadge(plan.lifecycle)}
                  </div>
                  <div className="text-text-muted mb-3 flex justify-between text-xs">
                    <span>{count} users</span>
                    <span>${rev.toLocaleString()}/mo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const p = plan;
                      setPlanForm({
                        lifecycle: p.lifecycle,
                        availableFrom: p.availableFrom,
                        retireAt: p.retireAt,
                        migrateAt: p.migrateAt,
                        fallbackPlanId: p.fallbackPlanId,
                        grandfathered: p.grandfathered,
                      });
                      setEditingPlan(editingPlan === plan.id ? null : plan.id);
                    }}
                    className={clsx(
                      'w-full rounded-lg py-2 font-[inherit] text-xs font-semibold',
                      editingPlan === plan.id ? 'bg-primary-bg text-primary' : 'text-text-muted',
                    )}
                    style={{
                      border: `1.5px solid ${C.border}`,
                    }}
                  >
                    <Settings size={12} className="mr-1 align-middle" />
                    {editingPlan === plan.id ? 'Editing...' : 'Edit'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div>
        {/* New Plan button */}
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setNewPlanForm({ name: '', icon: '⭐', color: '#F97316', price: 0, lifecycle: 'draft' });
              setShowAddPlan(true);
            }}
            className="flex items-center gap-1.5 rounded-[10px] border-none px-[18px] py-[9px] font-[inherit] text-xs font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark ?? C.primary})`,
            }}
          >
            <Plus size={14} /> New Plan
          </button>
        </div>

        {renderPlanGroup(activePlans, 'Active Plans')}
        {renderPlanGroup(draftScheduledPlans, 'Draft & Scheduled')}
        {renderPlanGroup(retiredPlans, 'Retired')}

        {/* Inline plan editor */}
        {editingPlan &&
          (() => {
            const plan = adminPlans.find((p) => p.id === editingPlan);
            if (!plan) return null;
            const subCount = planCounts[plan.id] ?? 0;
            const isProtected = PLAN_ORDER.includes(plan.id as PlanId) && plan.id === 'free';
            return (
              <div className="mb-5" style={cardDyn}>
                <div className="text-text mb-4 text-sm font-bold">
                  Edit Plan: {plan.icon} {plan.name}
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="text-text-muted mb-1 block text-[11px] font-semibold">Plan Name</label>
                    <input defaultValue={plan.name} className={`${inputCls} w-full`} style={inputDyn} readOnly />
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block text-[11px] font-semibold">Price ($/mo)</label>
                    <input
                      defaultValue={plan.price}
                      type="number"
                      className={`${inputCls} w-full`}
                      style={inputDyn}
                      readOnly
                    />
                  </div>
                </div>

                {/* Limits */}
                <div className="text-text mb-2.5 text-xs font-bold">Limits</div>
                <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {Object.entries(plan.limits).map(([key, val]) => (
                    <div
                      key={key}
                      className="border-border/[0.27] bg-surface-alt flex items-center gap-2 rounded-[10px] border px-3 py-2"
                    >
                      <span className="text-text-muted flex-1 text-xs">{LIMIT_LABELS[key] ?? key}</span>
                      <button
                        type="button"
                        className="border-border text-text-muted flex h-6 w-6 items-center justify-center rounded-[6px] border bg-transparent"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-text min-w-[40px] text-center text-[13px] font-semibold">
                        {val === -1 ? '\u221E' : val}
                      </span>
                      <button
                        type="button"
                        className="border-border text-text-muted flex h-6 w-6 items-center justify-center rounded-[6px] border bg-transparent"
                      >
                        <Plus size={10} />
                      </button>
                      <label className="text-text-dim flex cursor-pointer items-center gap-1 text-[10px]">
                        <input type="checkbox" defaultChecked={val === -1} style={{ accentColor: C.primary }} />
                        Unlimited
                      </label>
                    </div>
                  ))}
                </div>

                {/* Lifecycle Management */}
                <div className="text-text mb-2.5 text-xs font-bold">Lifecycle Management</div>
                {!isProtected && (
                  <div className="mb-4">
                    <label className="text-text-muted mb-2 block text-[11px] font-bold">Lifecycle Status</label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(LIFECYCLE).map(([key, l]) => {
                        const sel = planForm.lifecycle === key;
                        const disabled =
                          key === 'retired' && subCount > 0 && !planForm.fallbackPlanId && !planForm.grandfathered;
                        const LcIcon = l.icon;
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              if (disabled) return;
                              const updates: Partial<PlanFormState> = { lifecycle: key as PlanLifecycle };
                              if (key === 'active') {
                                updates.availableFrom = null;
                                updates.retireAt = null;
                                updates.migrateAt = null;
                                updates.fallbackPlanId = null;
                                updates.grandfathered = false;
                              }
                              if (key === 'draft') {
                                updates.availableFrom = null;
                                updates.retireAt = null;
                                updates.migrateAt = null;
                              }
                              setPlanForm((p) => ({ ...p, ...updates }));
                            }}
                            className={clsx(
                              'flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition-all duration-150',
                              disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                            )}
                            style={{
                              border: `1.5px solid ${sel ? l.color : C.border}`,
                              background: sel ? `${l.color}20` : 'transparent',
                            }}
                          >
                            <LcIcon size={12} style={{ color: l.color }} />
                            <span
                              className={clsx('text-xs', sel ? 'font-bold' : 'font-medium')}
                              style={{ color: sel ? l.color : C.textMuted }}
                            >
                              {l.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Scheduled state */}
                {planForm.lifecycle === 'scheduled' && (
                  <div className="border-primary/[0.19] bg-primary/[0.07] mb-3.5 rounded-xl border p-4">
                    <div className="mb-2.5 flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      <span className="text-text text-xs font-bold">Activation Schedule</span>
                    </div>
                    <div className="flex flex-wrap items-end gap-2.5">
                      <div className="min-w-[160px] flex-1">
                        <label className="text-text-dim mb-1 block text-[10px] font-bold">Available From</label>
                        <input
                          type="date"
                          value={planForm.availableFrom ?? ''}
                          onChange={(e) => setPlanForm((p) => ({ ...p, availableFrom: e.target.value }))}
                          className="bg-surface-alt text-text w-full rounded-lg px-3 py-2 font-[inherit] text-xs outline-none"
                          style={{
                            border: `1.5px solid ${C.border}`,
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlanForm((p) => ({ ...p, lifecycle: 'active', availableFrom: null }))}
                        className="border-success/[0.31] bg-success/[0.09] text-success rounded-lg border px-3.5 py-2 font-[inherit] text-[11px] font-bold whitespace-nowrap"
                      >
                        Activate Now
                      </button>
                    </div>
                    {planForm.availableFrom &&
                      (() => {
                        const days = Math.ceil((new Date(planForm.availableFrom).getTime() - Date.now()) / 86400000);
                        return (
                          <div className="text-primary mt-2 text-[11px] font-semibold">
                            {days > 0
                              ? `Goes live in ${days} day${days !== 1 ? 's' : ''}`
                              : days === 0
                                ? 'Goes live today'
                                : 'Date is in the past — will activate on save'}
                          </div>
                        );
                      })()}
                  </div>
                )}

                {/* Draft state */}
                {planForm.lifecycle === 'draft' && (
                  <div className="bg-surface-alt border-border mb-3.5 rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      <Edit size={14} className="text-text-dim" />
                      <span className="text-text text-xs font-bold">
                        This plan is in draft and not visible to users
                      </span>
                    </div>
                  </div>
                )}

                {/* Retiring state */}
                {planForm.lifecycle === 'retiring' && (
                  <div className="border-warning/[0.19] bg-warning/[0.07] mb-3.5 rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-warning" />
                      <span className="text-text text-xs font-bold">Retirement Schedule</span>
                    </div>
                    <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-text-dim mb-1 block text-[10px] font-bold">Stop New Signups</label>
                        <input
                          type="date"
                          value={planForm.retireAt ?? ''}
                          onChange={(e) => setPlanForm((p) => ({ ...p, retireAt: e.target.value }))}
                          className="bg-surface-alt text-text w-full rounded-lg px-3 py-2 font-[inherit] text-xs outline-none"
                          style={{
                            border: `1.5px solid ${C.border}`,
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-text-dim mb-1 block text-[10px] font-bold">Migrate Subscribers On</label>
                        <input
                          type="date"
                          value={planForm.migrateAt ?? ''}
                          onChange={(e) => setPlanForm((p) => ({ ...p, migrateAt: e.target.value }))}
                          disabled={planForm.grandfathered}
                          className={clsx(
                            'bg-surface-alt text-text w-full rounded-lg px-3 py-2 font-[inherit] text-xs outline-none',
                            planForm.grandfathered && 'opacity-40',
                          )}
                          style={{
                            border: `1.5px solid ${C.border}`,
                          }}
                        />
                      </div>
                    </div>
                    {/* Grandfathered vs Migrate */}
                    <div className="mb-3.5">
                      <label className="text-text-dim mb-2 block text-[10px] font-bold">Existing Subscribers</label>
                      <div className="flex flex-wrap gap-2">
                        <div
                          onClick={() =>
                            setPlanForm((p) => ({ ...p, grandfathered: true, fallbackPlanId: null, migrateAt: null }))
                          }
                          className="min-w-[140px] flex-1 cursor-pointer rounded-[10px] px-3.5 py-3"
                          style={{
                            border: `1.5px solid ${planForm.grandfathered ? C.success : C.border}`,
                            background: planForm.grandfathered ? `${C.success}15` : 'transparent',
                          }}
                        >
                          <div
                            className={clsx(
                              'mb-0.5 text-xs font-bold',
                              planForm.grandfathered ? 'text-success' : 'text-text',
                            )}
                          >
                            Grandfather
                          </div>
                          <div className="text-text-dim text-[10px]">
                            Keep existing subscribers on this plan indefinitely
                          </div>
                        </div>
                        <div
                          onClick={() => setPlanForm((p) => ({ ...p, grandfathered: false }))}
                          className="min-w-[140px] flex-1 cursor-pointer rounded-[10px] px-3.5 py-3"
                          style={{
                            border: `1.5px solid ${!planForm.grandfathered ? C.primary : C.border}`,
                            background: !planForm.grandfathered ? `${C.primary}15` : 'transparent',
                          }}
                        >
                          <div
                            className={clsx(
                              'mb-0.5 text-xs font-bold',
                              !planForm.grandfathered ? 'text-primary' : 'text-text',
                            )}
                          >
                            Migrate
                          </div>
                          <div className="text-text-dim text-[10px]">
                            Move subscribers to another plan on migration date
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Fallback Plan Selector */}
                    {!planForm.grandfathered && (
                      <div>
                        <label className="text-text-dim mb-1.5 block text-[10px] font-bold">Migrate To</label>
                        <div className="flex flex-wrap gap-1.5">
                          {adminPlans
                            .filter(
                              (p) => p.id !== editingPlan && (p.lifecycle === 'active' || p.lifecycle === 'retiring'),
                            )
                            .map((p) => {
                              const sel = planForm.fallbackPlanId === p.id;
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => setPlanForm((prev) => ({ ...prev, fallbackPlanId: p.id }))}
                                  style={{
                                    border: `1.5px solid ${sel ? p.color : C.border}`,
                                    background: sel ? `${p.color}20` : 'transparent',
                                  }}
                                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2"
                                >
                                  <span className="text-sm">{p.icon}</span>
                                  <span
                                    className={clsx('text-xs', sel ? 'font-bold' : 'font-medium')}
                                    style={{ color: sel ? p.color : C.textMuted }}
                                  >
                                    {p.name}
                                  </span>
                                  {sel && <CheckCircle size={12} style={{ color: p.color }} />}
                                </div>
                              );
                            })}
                        </div>
                        {!planForm.fallbackPlanId && (
                          <div className="text-danger mt-1.5 text-[10px]">
                            Please select a fallback plan for migrated subscribers.
                          </div>
                        )}
                      </div>
                    )}
                    {/* Retirement Timeline */}
                    {planForm.retireAt && (
                      <div className="bg-surface-alt border-border border">
                        <div className="text-text mb-1 text-[11px] font-bold">Retirement Timeline</div>
                        <div className="relative my-2 flex h-8 items-center">
                          <div className="bg-border absolute top-3.5 right-0 left-0 h-1 rounded-sm" />
                          <div className="absolute top-1.5 left-[5%] flex flex-col items-center">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                background: C.success,
                                border: `2px solid ${C.surface}`,
                              }}
                            />
                            <div className="text-success mt-1.5 text-[8px] font-bold">Now</div>
                          </div>
                          <div className="absolute top-1.5 left-[45%] flex flex-col items-center">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                background: C.warning,
                                border: `2px solid ${C.surface}`,
                              }}
                            />
                            <div className="text-warning mt-1.5 text-[8px] font-bold">Retire {planForm.retireAt}</div>
                          </div>
                          {!planForm.grandfathered && planForm.migrateAt && (
                            <div className="absolute top-1.5 left-[85%] flex flex-col items-center">
                              <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  background: C.danger,
                                  border: `2px solid ${C.surface}`,
                                }}
                              />
                              <div className="text-danger mt-1.5 text-[8px] font-bold">
                                Migrate {planForm.migrateAt}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-text-dim mt-3 text-[10px]">
                          {subCount} subscriber{subCount !== 1 ? 's' : ''} on this plan.
                          {planForm.grandfathered
                            ? ' They will keep this plan indefinitely.'
                            : planForm.fallbackPlanId
                              ? ` They will be migrated to ${getAdminPlan(planForm.fallbackPlanId)?.name ?? '…'}.`
                              : ' Select a fallback plan.'}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setPlanForm((p) => ({
                          ...p,
                          lifecycle: 'active',
                          retireAt: null,
                          migrateAt: null,
                          fallbackPlanId: null,
                          grandfathered: false,
                        }))
                      }
                      className="border-border text-text-muted mt-3 rounded-lg border bg-transparent px-3.5 py-[7px] font-[inherit] text-[11px] font-semibold"
                    >
                      Cancel Retirement
                    </button>
                  </div>
                )}

                {/* Retired state */}
                {planForm.lifecycle === 'retired' && (
                  <div className="bg-surface-alt border-border mb-3.5 rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Lock size={14} className="text-text-dim" />
                      <span className="text-text text-xs font-bold">This plan is retired</span>
                    </div>
                    <div className="text-text-dim mb-2 text-[11px]">
                      {planForm.grandfathered
                        ? `${subCount} subscriber${subCount !== 1 ? 's' : ''} grandfathered on this plan.`
                        : planForm.fallbackPlanId
                          ? `Subscribers ${subCount > 0 ? 'being' : 'were'} migrated to ${getAdminPlan(planForm.fallbackPlanId)?.name ?? '…'}.`
                          : 'No active subscribers.'}
                    </div>
                    {subCount === 0 && (
                      <button
                        type="button"
                        onClick={() => setPlanForm((p) => ({ ...p, lifecycle: 'draft' }))}
                        className="border-primary/[0.25] bg-primary/[0.08] text-primary rounded-lg border px-3.5 py-[7px] font-[inherit] text-[11px] font-bold"
                      >
                        Reactivate as Draft
                      </button>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="text-text-muted rounded-[10px] bg-transparent px-5 py-2 font-[inherit] text-xs font-semibold"
                    style={{
                      border: `1.5px solid ${C.border}`,
                    }}
                  >
                    <X size={12} className="mr-1 align-middle" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPlans((prev) => prev.map((p) => (p.id === editingPlan ? { ...p, ...planForm } : p)));
                      setEditingPlan(null);
                    }}
                    className="rounded-[10px] border-none px-5 py-2 font-[inherit] text-xs font-semibold text-white"
                    style={{
                      background: C.primary,
                    }}
                  >
                    <Check size={12} className="mr-1 align-middle" /> Save
                  </button>
                </div>
              </div>
            );
          })()}

        {/* New Plan Modal */}
        {showAddPlan && (
          <div
            className="z-modal-backdrop fixed inset-0 flex items-center justify-center p-4 backdrop-blur-[6px]"
            style={{
              background: 'rgba(0,0,0,0.6)',
            }}
            onClick={() => setShowAddPlan(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-surface max-h-[85vh] w-full max-w-[420px] overflow-auto rounded-[18px]"
              style={{
                border: `1.5px solid ${C.border}`,
              }}
            >
              <div className="border-border flex items-center justify-between border-b px-[22px] py-[18px]">
                <div className="text-text text-base font-extrabold">Create New Plan</div>
                <button
                  type="button"
                  onClick={() => setShowAddPlan(false)}
                  aria-label="Close"
                  className="text-text-dim"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-4 px-[22px] py-[18px]">
                {/* Plan Name */}
                <div>
                  <label className="text-text-muted mb-1 block text-[11px] font-bold">Plan Name</label>
                  <input
                    value={newPlanForm.name}
                    onChange={(e) => setNewPlanForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Pro, Enterprise"
                    className={`${inputCls} w-full`}
                    style={inputDyn}
                  />
                </div>
                {/* Price & Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-text-muted mb-1 block text-[11px] font-bold">Monthly Price (GH₵)</label>
                    <input
                      type="number"
                      value={newPlanForm.price}
                      onChange={(e) => setNewPlanForm((p) => ({ ...p, price: Math.max(0, Number(e.target.value)) }))}
                      className={`${inputCls} w-full`}
                      style={inputDyn}
                    />
                  </div>
                  <div>
                    <label className="text-text-muted mb-1 block text-[11px] font-bold">Brand Color</label>
                    <div className="flex flex-wrap gap-[5px]">
                      {COLOR_OPTIONS.map((c) => (
                        <div
                          key={c}
                          onClick={() => setNewPlanForm((p) => ({ ...p, color: c }))}
                          className="h-6 w-6 cursor-pointer rounded-[6px]"
                          style={{
                            background: c,
                            border: newPlanForm.color === c ? '2.5px solid #fff' : '2px solid transparent',
                            boxShadow: newPlanForm.color === c ? `0 0 0 2px ${c}` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Icon Selection */}
                <div>
                  <label className="text-text-muted mb-1.5 block text-[11px] font-bold">Plan Icon</label>
                  {PLAN_ICON_OPTIONS.map((group) => (
                    <div key={group.group} className="mb-2">
                      <div className="text-text-dim mb-1 text-[9px] font-bold tracking-[0.5px] uppercase">
                        {group.group}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.icons.map((ico) => (
                          <div
                            key={ico}
                            onClick={() => setNewPlanForm((p) => ({ ...p, icon: ico }))}
                            className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg text-lg transition-all duration-100"
                            style={{
                              border: `2px solid ${newPlanForm.icon === ico ? C.primary : 'transparent'}`,
                              background: newPlanForm.icon === ico ? `${C.primary}25` : C.surfaceAlt,
                            }}
                          >
                            {ico}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Initial Status */}
                <div>
                  <label className="text-text-muted mb-1.5 block text-[11px] font-bold">Initial Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['draft', 'active'] as const).map((lc) => {
                      const l = LIFECYCLE[lc]!;
                      const sel = newPlanForm.lifecycle === lc;
                      const LcIcon = l.icon;
                      return (
                        <div
                          key={lc}
                          onClick={() => setNewPlanForm((p) => ({ ...p, lifecycle: lc }))}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 transition-all duration-150"
                          style={{
                            border: `1.5px solid ${sel ? l.color : C.border}`,
                            background: sel ? `${l.color}20` : 'transparent',
                          }}
                        >
                          <LcIcon size={12} style={{ color: l.color }} />
                          <span
                            className={clsx('text-xs', sel ? 'font-bold' : 'font-medium')}
                            style={{ color: sel ? l.color : C.textMuted }}
                          >
                            {l.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-text-dim mt-1 text-[10px]">{LIFECYCLE[newPlanForm.lifecycle]?.desc}</div>
                </div>
                {/* Actions */}
                <div className="mt-1 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddPlan(false)}
                    className="border-border text-text-muted rounded-lg border bg-transparent px-[18px] py-[9px] font-[inherit] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newPlanForm.name.trim()}
                    onClick={() => {
                      const id = newPlanForm.name.toLowerCase().replace(/\s+/g, '_');
                      const baseLimits: Record<string, number> = {
                        shops: 1,
                        branchesPerShop: 1,
                        teamPerShop: 5,
                        productsPerShop: 100,
                        monthlyTransactions: 500,
                        storageMB: 512,
                        suppliers: 10,
                        warehouses: 1,
                      };
                      const baseFeatures: Record<string, unknown> = {
                        pos: 'basic',
                        receipts: 'name_only',
                        reports: 'basic',
                        barcode: false,
                        purchaseOrders: 'view',
                        stockTransfers: false,
                        lowStockAlerts: false,
                        twoFA: false,
                        apiAccess: false,
                        dataExport: false,
                        customBranding: false,
                        auditTrail: 0,
                        generalManager: false,
                        support: 'email_48h',
                      };
                      setAdminPlans((prev) => [
                        ...prev,
                        {
                          id,
                          name: newPlanForm.name,
                          icon: newPlanForm.icon,
                          color: newPlanForm.color,
                          price: newPlanForm.price,
                          lifecycle: newPlanForm.lifecycle || 'draft',
                          availableFrom: null,
                          retireAt: null,
                          migrateAt: null,
                          fallbackPlanId: null,
                          grandfathered: false,
                          limits: baseLimits,
                          features: baseFeatures,
                        },
                      ]);
                      setShowAddPlan(false);
                    }}
                    className={clsx(
                      'rounded-lg border-none px-[18px] py-[9px] font-[inherit] text-xs font-bold text-white',
                      !newPlanForm.name.trim() && 'opacity-50',
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark ?? C.primary})`,
                    }}
                  >
                    Create Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 3 — User Subs
  // ═══════════════════════════════════════════════════════════
  const renderUserSubs = () => {
    const selectedUser = selectedUserId ? users.find((u) => u.id === selectedUserId) : null;

    // ─── User detail view ──────────────────────────────────
    if (selectedUser) {
      const tier = PLAN_TIERS[selectedUser.plan];
      const methods = MOCK_PAYMENT_METHODS[selectedUser.id] ?? [];
      const history = MOCK_PAYMENT_HISTORY[selectedUser.id] ?? [];

      return (
        <div>
          <button
            type="button"
            onClick={() => setSelectedUserId(null)}
            className="text-text-muted mb-4 flex items-center gap-1.5 rounded-lg bg-transparent px-3.5 py-1.5 font-[inherit] text-xs font-semibold"
            style={{
              border: `1.5px solid ${C.border}`,
            }}
          >
            <X size={12} /> Back
          </button>

          {/* Current plan */}
          <div className="mb-4 flex items-center gap-3.5" style={cardDyn}>
            <span className="text-[28px]">{tier.icon}</span>
            <div>
              <div className="text-text text-[15px] font-bold">{selectedUser.name}</div>
              <div className="text-text-muted text-xs">{selectedUser.email}</div>
            </div>
            <div className="ml-auto text-right">
              {planBadge(selectedUser.plan)}
              <div className="text-text mt-1 text-lg font-bold">${tier.price}/mo</div>
            </div>
          </div>

          {/* Payment methods */}
          <div className="mb-4" style={cardDyn}>
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={14} color={C.textMuted} />
              <span className="text-text text-[13px] font-bold">Payment Methods</span>
            </div>
            {methods.length === 0 ? (
              <div className="text-text-dim p-2.5 text-xs">No payment methods on file</div>
            ) : (
              methods.map((pm) => (
                <div key={pm.id} className="border-b-border/[0.13] flex items-center gap-2.5 border-b py-2">
                  <span className="text-text text-xs font-semibold">
                    {pm.provider} ****{pm.last4}
                  </span>
                  {pm.isDefault && (
                    <span className="bg-primary/[0.15] text-primary rounded px-1.5 py-px text-[9px] font-bold">
                      DEFAULT
                    </span>
                  )}
                  <span
                    className={clsx(
                      'ml-auto text-[10px] font-semibold',
                      pm.status === 'expired' ? 'text-danger' : 'text-success',
                    )}
                  >
                    {pm.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Payment history */}
          <div className="mb-4 overflow-x-auto" style={cardDyn}>
            <div className="text-text mb-3 text-[13px] font-bold">Payment History</div>
            {history.length === 0 ? (
              <div className="text-text-dim p-2.5 text-xs">No payment history</div>
            ) : (
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-border border-b">
                    {['Date', 'Amount', 'Method', 'Status', 'Ref'].map((h) => (
                      <th key={h} className="text-text-muted px-2 py-1.5 text-left text-[10px] font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => (
                    <tr key={tx.id} className="border-b-border/[0.13] border-b">
                      <td className="text-text px-2 py-1.5">{tx.date}</td>
                      <td className="text-text px-2 py-1.5 font-semibold">${tx.amount}</td>
                      <td className="text-text-muted px-2 py-1.5">{tx.method}</td>
                      <td className="px-2 py-1.5">{payTxBadge(tx.status)}</td>
                      <td className="text-text-dim px-2 py-1.5 font-mono text-[10px]">{tx.txRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Resource Usage */}
          {(() => {
            const rawUsage = MOCK_USER_USAGE[selectedUser.id] ?? {};
            const pu = computePlanUsage(selectedUser.plan, rawUsage as Parameters<typeof computePlanUsage>[1]);
            return (
              <div className="mb-4" style={cardDyn}>
                <div className="text-text mb-2.5 flex items-center gap-1.5 text-[13px] font-extrabold">
                  <BarChart3 size={14} className="text-primary" /> Resource Usage
                  {pu.blocked.length > 0 && (
                    <span className="bg-danger/[0.13] text-danger rounded-[5px] px-2 py-0.5 text-[10px] font-bold">
                      {pu.blocked.length} at limit
                    </span>
                  )}
                  {pu.blocked.length === 0 && pu.warnings.length > 0 && (
                    <span className="bg-warning/[0.13] text-warning rounded-[5px] px-2 py-0.5 text-[10px] font-bold">
                      {pu.warnings.length} near limit
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {pu.items
                    .filter((item) => item.max !== 0)
                    .map((item) => {
                      const barColor = item.unlimited
                        ? C.primary
                        : item.blocked
                          ? C.danger
                          : item.warning
                            ? C.warning
                            : C.success;
                      return (
                        <div
                          key={item.key}
                          className="rounded-lg p-2.5"
                          style={{
                            background: item.blocked ? `${C.danger}06` : C.surfaceAlt,
                            border: `1px solid ${item.blocked ? `${C.danger}25` : C.border}`,
                          }}
                        >
                          <div className="mb-1 flex justify-between">
                            <span className="text-text text-[11px] font-semibold">{item.label}</span>
                            <span className={clsx('text-[11px] font-bold', item.blocked ? 'text-danger' : 'text-text')}>
                              {item.formatUsed ? item.formatUsed(item.used) : item.used} /{' '}
                              {item.unlimited ? '∞' : item.formatMax ? item.formatMax(item.max) : item.max}
                              {!item.unlimited && (
                                <span
                                  className={clsx(
                                    'ml-1 text-[9px]',
                                    item.blocked ? 'text-danger' : item.warning ? 'text-warning' : 'text-text-dim',
                                  )}
                                >
                                  ({item.pct}%)
                                </span>
                              )}
                            </span>
                          </div>
                          <div
                            className="h-1.5 overflow-hidden rounded-[3px]"
                            style={{
                              background: `${C.bg ?? C.border}80`,
                            }}
                          >
                            <div
                              className="h-full rounded-[3px] transition-[width] duration-[400ms] ease-in-out"
                              style={{
                                width: `${item.unlimited ? 15 : Math.min(item.pct, 100)}%`,
                                background: barColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex flex-wrap gap-2.5">
            <select className={`${inputCls} min-w-[160px] flex-1`} style={inputDyn} defaultValue={selectedUser.plan}>
              {PLAN_ORDER.map((pid) => (
                <option key={pid} value={pid}>
                  {PLAN_TIERS[pid].icon} {PLAN_TIERS[pid].name} — ${PLAN_TIERS[pid].price}/mo
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowExemptionModal(true)}
              className="flex items-center gap-1.5 rounded-[10px] border-none px-[18px] py-2.5 font-[inherit] text-xs font-semibold text-white"
              style={{
                background: C.warning,
              }}
            >
              <Gift size={12} /> Grant Exemption
            </button>
          </div>

          {/* Exemption modal */}
          {showExemptionModal && (
            <div
              className="z-modal-backdrop fixed inset-0 flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.45)',
              }}
            >
              <div className={`${cardCls} max-h-[85vh] w-[92%] overflow-auto sm:w-[420px]`} style={cardDyn}>
                <div className="text-text mb-4 text-sm font-bold">Grant Billing Exemption</div>
                <div className="mb-3">
                  <label className="text-text-muted mb-1 block text-[11px] font-semibold">Period</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="e.g. 3" className={`${inputCls} flex-1`} style={inputDyn} />
                    <select className={`${inputCls} w-[100px]`} style={inputDyn}>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>
                <label className="text-text-muted mb-3 flex cursor-pointer items-center gap-1.5 text-xs">
                  <input type="checkbox" style={{ accentColor: C.primary }} />
                  Unlimited (no expiry)
                </label>
                <div className="mb-4">
                  <label className="text-text-muted mb-1 block text-[11px] font-semibold">Reason</label>
                  <textarea
                    rows={3}
                    placeholder="Reason for exemption..."
                    className={`${inputCls} w-full resize-y`}
                    style={inputDyn}
                  />
                </div>
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowExemptionModal(false)}
                    className="text-text-muted rounded-[10px] bg-transparent px-[18px] py-2 font-[inherit] text-xs font-semibold"
                    style={{
                      border: `1.5px solid ${C.border}`,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExemptionModal(false)}
                    className="rounded-[10px] border-none px-[18px] py-2 font-[inherit] text-xs font-semibold text-white"
                    style={{
                      background: C.primary,
                    }}
                  >
                    Grant
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // ─── User list view ────────────────────────────────────
    const q = userSearch.toLowerCase();
    const filtered = users.filter((u) => {
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    return (
      <div>
        <div className="relative mb-4">
          <input
            placeholder="Search users by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className={`${inputCls} w-full pl-3.5`}
            style={inputDyn}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {filtered.map((u) => (
            <div
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              className={`${cardCls} flex cursor-pointer items-center gap-3 px-4 py-3 transition-[border-color] duration-150`}
              style={cardDyn}
            >
              <div className="bg-primary/[0.13] text-primary flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-xs font-bold">
                {u.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-text overflow-hidden text-[13px] font-semibold text-ellipsis whitespace-nowrap">
                  {u.name}
                </div>
                <div className="text-text-muted overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">
                  {u.email}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {planBadge(u.plan)}
                {statusBadge(u.status)}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-text-dim p-[30px] text-center text-[13px]">No users found</div>
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 4 — Usage
  // ═══════════════════════════════════════════════════════════
  const renderUsage = () => (
    <div className="flex flex-col gap-3.5">
      {users.map((u) => {
        const tier = PLAN_TIERS[u.plan];
        const usage = MOCK_USER_USAGE[u.id] ?? {};

        return (
          <div key={u.id} className={cardCls} style={cardDyn}>
            <div className="mb-3.5 flex items-center gap-2.5">
              <div className="bg-primary/[0.13] text-primary flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[11px] font-bold">
                {u.avatar}
              </div>
              <span className="text-text text-[13px] font-semibold">{u.name}</span>
              {planBadge(u.plan)}
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {USAGE_KEYS.map(({ key, label, limitKey }) => {
                const used = usage[key] ?? 0;
                const max = (tier.limits as unknown as Record<string, number>)[limitKey] ?? 0;
                const unlimited = max === -1;
                const pct = unlimited ? (used > 0 ? 15 : 0) : max > 0 ? Math.min((used / max) * 100, 100) : 0;
                const barColor = pct >= 85 ? C.danger : pct >= 60 ? C.warning : C.success;
                const maxLabel = unlimited ? 'Unlimited' : String(max);

                return (
                  <div key={key}>
                    <div className="mb-0.5 flex justify-between">
                      <span className="text-text-muted text-[11px]">{label}</span>
                      <span className="text-text-dim text-[10px]">
                        {used.toLocaleString()} / {maxLabel}
                      </span>
                    </div>
                    <div className="bg-border h-1.5 overflow-hidden rounded-sm">
                      <div
                        className="h-full rounded-sm transition-[width] duration-300"
                        style={{
                          width: `${pct}%`,
                          background: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div>
      {renderPills()}
      {subTab === 'overview' && renderOverview()}
      {subTab === 'plans' && renderPlans()}
      {subTab === 'userSubs' && renderUserSubs()}
      {subTab === 'usage' && renderUsage()}
    </div>
  );
}
