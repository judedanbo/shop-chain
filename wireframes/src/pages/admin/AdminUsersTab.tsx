import { useState } from 'react';
import clsx from 'clsx';
import { Search, ChevronRight, ArrowLeft, Phone, MapPin, Calendar } from 'lucide-react';
import type { AdminUserRecord } from '@/types/admin.types';
import { PLAN_TIERS } from '@/constants/plans';
import type { PlanId } from '@/types';
import { MOCK_PAYMENT_METHODS, MOCK_PAYMENT_HISTORY, MOCK_USER_USAGE } from '@/constants/adminData';
import type { AdminThemeColors } from '@/constants/adminThemes';

interface AdminUsersTabProps {
  C: AdminThemeColors;
  users: AdminUserRecord[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUserRecord[]>>;
}

export function AdminUsersTab({ C, users, setUsers }: AdminUsersTabProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'deactivated' | 'pending'>('all');

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
        className="rounded-[5px] px-2 py-[2px] text-[10px] font-bold capitalize"
        style={{ background: s.bg, color: s.color }}
      >
        {status}
      </span>
    );
  };

  const planBadge = (planId: string) => {
    const p = PLAN_TIERS[planId as PlanId] ?? PLAN_TIERS.free;
    return (
      <span
        className="rounded-[5px] px-2 py-[2px] text-[10px] font-bold"
        style={{ background: `${p.color}35`, color: p.color }}
      >
        {p.icon} {p.name}
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
        className="rounded-[4px] px-1.5 py-[2px] text-[10px] font-bold capitalize"
        style={{ background: s.bg, color: s.color }}
      >
        {status}
      </span>
    );
  };

  // ─── User List View ──────────────────────────────────────────
  if (!selectedUser) {
    const q = userSearch.toLowerCase();
    const filtered = users.filter((u) => {
      if (userFilter !== 'all' && u.status !== userFilter) return false;
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      return true;
    });

    return (
      <div>
        <div className="mb-4 flex flex-wrap gap-2.5">
          <div className="relative min-w-[180px] flex-1">
            <Search size={14} className="text-text-dim absolute top-1/2 left-2.5 -translate-y-1/2" />
            <input
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-surface text-text border-border w-full rounded-[10px] border-[1.5px] py-2 pr-2.5 pl-8 font-[inherit] text-[13px] outline-none"
            />
          </div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value as 'all' | 'active' | 'deactivated' | 'pending')}
            className="bg-surface text-text border-border rounded-[10px] border-[1.5px] px-3 py-2 font-[inherit] text-[13px] outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="bg-surface border-border overflow-hidden rounded-[14px] border-[1.5px]">
          {filtered.map((u, i) => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={clsx('flex cursor-pointer items-center gap-3 px-4 py-3', i % 2 !== 0 && 'bg-surface-alt')}
              style={{
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ background: C.primary }}
              >
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
              <div className="flex shrink-0 items-center gap-2">
                {planBadge(u.plan)}
                {statusBadge(u.status)}
                <ChevronRight size={14} color={C.textDim} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-text-muted p-8 text-center text-[13px]">No users found.</div>}
        </div>
      </div>
    );
  }

  // ─── User Detail View ────────────────────────────────────────
  const u = selectedUser;
  const plan = PLAN_TIERS[u.plan as PlanId] ?? PLAN_TIERS.free;
  const methods = MOCK_PAYMENT_METHODS[u.id] ?? [];
  const history = MOCK_PAYMENT_HISTORY[u.id] ?? [];
  const usage = MOCK_USER_USAGE[u.id] ?? {};
  const city = u.joined.slice(0, 4) === '2025' ? 'Accra' : 'Kumasi';

  const usageBars: { label: string; key: string; max: number }[] = [
    {
      label: 'Products',
      key: 'products',
      max: plan.limits.productsPerShop === -1 ? 1000 : plan.limits.productsPerShop,
    },
    {
      label: 'Transactions',
      key: 'transactions',
      max: plan.limits.monthlyTransactions === -1 ? 15000 : plan.limits.monthlyTransactions,
    },
    { label: 'Storage (MB)', key: 'storageMB', max: plan.limits.storageMB },
    { label: 'Team', key: 'team', max: plan.limits.teamPerShop === -1 ? 50 : plan.limits.teamPerShop },
    { label: 'Shops', key: 'shops', max: plan.limits.shops === -1 ? 10 : plan.limits.shops },
    { label: 'Branches', key: 'branches', max: plan.limits.branchesPerShop === -1 ? 10 : plan.limits.branchesPerShop },
  ];

  const toggleStatus = () => {
    const next: AdminUserRecord = { ...u, status: u.status === 'active' ? 'deactivated' : 'active' };
    setUsers((prev) => prev.map((x) => (x.id === u.id ? next : x)));
    setSelectedUser(next);
  };

  const cardCls = 'rounded-[14px] p-4 mb-4';
  const sectionTitle = (t: string) => <div className="text-text mb-3 text-sm font-bold">{t}</div>;

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={() => setSelectedUser(null)}
        className="text-primary mb-4 flex items-center gap-1.5 border-none bg-transparent p-0 font-[inherit] text-[13px] font-semibold"
      >
        <ArrowLeft size={16} /> Back to Users
      </button>

      {/* User header */}
      <div className={`${cardCls} bg-surface border-border flex flex-wrap items-center gap-4 border-[1.5px]`}>
        <div
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ background: C.primary }}
        >
          {u.avatar}
        </div>
        <div className="min-w-[140px] flex-1">
          <div className="text-text text-xl font-bold">{u.name}</div>
          <div className="text-text-muted mt-0.5 text-xs">{u.email}</div>
          <div className="mt-1.5 flex gap-2">
            {planBadge(u.plan)} {statusBadge(u.status)}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {[
          { icon: <Phone size={14} />, label: 'Phone', value: u.phone },
          { icon: <MapPin size={14} />, label: 'City', value: city },
          { icon: <Calendar size={14} />, label: 'Joined', value: u.joined },
          { icon: <Calendar size={14} />, label: 'Last Active', value: u.lastActive },
        ].map((item, i) => (
          <div key={i} className="bg-surface border-border flex items-center gap-2.5 rounded-[14px] border-[1.5px] p-4">
            <span className="text-primary">{item.icon}</span>
            <div>
              <div className="text-text-dim text-[10px] font-semibold">{item.label}</div>
              <div className="text-text text-[13px] font-semibold">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription */}
      <div className={`${cardCls} bg-surface border-border border-[1.5px]`}>
        {sectionTitle('Subscription')}
        <div className="flex items-center gap-3">
          <span className="text-[22px]">{plan.icon}</span>
          <div>
            <div className="text-text text-sm font-bold">{plan.name} Plan</div>
            <div className="text-text-muted text-xs">GHS {plan.price}/mo</div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className={`${cardCls} bg-surface border-border border-[1.5px]`}>
        {sectionTitle('Payment Methods')}
        {methods.length === 0 && <div className="text-text-muted text-xs">No payment methods on file.</div>}
        {methods.map((pm) => (
          <div key={pm.id} className="border-border flex items-center gap-2.5 border-b py-2">
            <span className="text-base">{pm.type === 'momo' ? '📱' : '💳'}</span>
            <div className="flex-1">
              <div className="text-text text-[13px] font-semibold">
                {pm.provider} ****{pm.last4}
              </div>
              <div className="text-text-muted text-[11px]">{pm.name}</div>
            </div>
            <div className="flex items-center gap-1.5">
              {pm.isDefault && (
                <span className="bg-primary/[0.19] text-primary rounded-[4px] px-1.5 py-px text-[9px] font-bold">
                  DEFAULT
                </span>
              )}
              {statusBadge(pm.status)}
            </div>
          </div>
        ))}
      </div>

      {/* Payment History */}
      <div className={`${cardCls} bg-surface border-border border-[1.5px]`}>
        {sectionTitle('Payment History')}
        {history.length === 0 && <div className="text-text-muted text-xs">No payment history.</div>}
        {history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-border border-b-[1.5px]">
                  {['Date', 'Amount', 'Plan', 'Method', 'Status', 'Ref'].map((h) => (
                    <th
                      key={h}
                      className="text-text-dim px-2 py-1.5 text-left text-[10px] font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={clsx(i % 2 !== 0 && 'bg-surface-alt')}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <td className="text-text px-2 py-1.5 whitespace-nowrap">{tx.date}</td>
                    <td className="text-text px-2 py-1.5 font-semibold">GHS {tx.amount}</td>
                    <td className="text-text-muted px-2 py-1.5">{tx.plan}</td>
                    <td className="text-text-muted px-2 py-1.5 whitespace-nowrap">{tx.method}</td>
                    <td className="px-2 py-1.5">{payTxBadge(tx.status)}</td>
                    <td className="text-text-dim px-2 py-1.5 font-mono text-[10px]">{tx.txRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className={`${cardCls} bg-surface border-border border-[1.5px]`}>
        {sectionTitle('Usage Stats')}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {usageBars.map((bar) => {
            const val = (usage as Record<string, number>)[bar.key] ?? 0;
            const pct = bar.max > 0 ? Math.min((val / bar.max) * 100, 100) : 0;
            return (
              <div key={bar.key}>
                <div className="text-text-muted mb-1 flex justify-between text-[11px]">
                  <span>{bar.label}</span>
                  <span className="text-text font-semibold">
                    {val.toLocaleString()} / {bar.max === -1 ? '~' : bar.max.toLocaleString()}
                  </span>
                </div>
                <div className="bg-border h-1.5 rounded">
                  <div
                    className="h-full rounded transition-[width] duration-300"
                    style={{
                      width: `${pct}%`,
                      background: pct > 85 ? C.danger : pct > 60 ? C.warning : C.primary,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2.5">
        <button
          type="button"
          onClick={toggleStatus}
          className="rounded-lg border-none px-5 py-2 font-[inherit] text-[13px] font-semibold text-white"
          style={{
            background: u.status === 'active' ? C.danger : C.success,
          }}
        >
          {u.status === 'active' ? 'Deactivate User' : 'Reactivate User'}
        </button>
      </div>
    </div>
  );
}
