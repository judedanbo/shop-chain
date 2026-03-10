import { Users, Store, DollarSign, TrendingUp, Activity, UserCheck, ShoppingBag } from 'lucide-react';
import type { AdminUserRecord, AdminShopRecord } from '@/types/admin.types';
import type { PlanId } from '@/types';
import { PLAN_TIERS, PLAN_ORDER } from '@/constants/plans';
import { INV_USER_GROWTH } from '@/constants/adminInvestors';
import { FIN_REVENUE } from '@/constants/adminFinances';
import { MOCK_AUDIT_LOG, AUDIT_RISK_LEVELS, riskLevel } from '@/constants/adminAuditData';
import type { AdminThemeColors } from '@/constants/adminThemes';

interface AdminOverviewTabProps {
  C: AdminThemeColors;
  users: AdminUserRecord[];
  shops: AdminShopRecord[];
}

function buildSvgPath(values: number[], w: number, h: number, pad = 10) {
  const min = Math.min(...values);
  const max = Math.max(...values) || 1;
  const stepX = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const last = pts[pts.length - 1] ?? { x: 0, y: 0 };
  const first = pts[0] ?? { x: 0, y: 0 };
  const area = `${line} L${last.x},${h} L${first.x},${h} Z`;
  return { line, area, pts };
}

export function AdminOverviewTab({ C, users, shops }: AdminOverviewTabProps) {
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const activeShops = shops.filter((s) => s.status === 'active').length;
  const mrr = users.reduce((sum, u) => sum + (PLAN_TIERS[u.plan]?.price ?? 0), 0);
  const newSignups = users.filter((u) => u.joined >= '2026-02-01').length;

  const planCounts = PLAN_ORDER.reduce<Record<PlanId, number>>(
    (acc, id) => {
      acc[id] = users.filter((u) => u.plan === id).length;
      return acc;
    },
    {} as Record<PlanId, number>,
  );

  const kpis = [
    { label: 'Total Users', value: users.length, sub: `${activeUsers} active`, Icon: Users, color: C.primary },
    {
      label: 'Active Users',
      value: activeUsers,
      sub: `${users.length ? Math.round((activeUsers / users.length) * 100) : 0}% of total`,
      Icon: UserCheck,
      color: C.success,
    },
    { label: 'Total Shops', value: shops.length, sub: `${activeShops} active`, Icon: Store, color: C.accent },
    {
      label: 'Active Shops',
      value: activeShops,
      sub: `${shops.length ? Math.round((activeShops / shops.length) * 100) : 0}% of total`,
      Icon: ShoppingBag,
      color: C.warning,
    },
    {
      label: 'MRR',
      value: `\u20B5${mrr.toLocaleString()}`,
      sub: 'monthly recurring',
      Icon: DollarSign,
      color: C.success,
    },
    { label: 'New Signups', value: newSignups, sub: 'this month', Icon: TrendingUp, color: C.primary },
  ];

  const growthVals = INV_USER_GROWTH.map((d) => d.total);
  const revenueVals = FIN_REVENUE.map((d) => d.subscriptions);
  const growth = buildSvgPath(growthVals, 400, 120);
  const revenue = buildSvgPath(revenueVals, 400, 120);

  const recentLogs = MOCK_AUDIT_LOG.slice(0, 8);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface border-border rounded-[14px] border-[1.5px] p-[18px]">
            <div className="flex items-center gap-3">
              <div
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full"
                style={{ background: k.color + '18' }}
              >
                <k.Icon size={18} color={k.color} />
              </div>
              <div>
                <div className="form-label text-text-muted tracking-[0.5px]">{k.label}</div>
                <div className="text-text text-[26px] font-black">{k.value}</div>
                <div className="text-text-dim text-[11px]">{k.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Distribution */}
      <div>
        <div className="text-text mb-2.5 text-[15px] font-extrabold">Plan Distribution</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const tier = PLAN_TIERS[id];
            const count = planCounts[id];
            const pct = users.length ? Math.round((count / users.length) * 100) : 0;
            return (
              <div key={id} className="bg-surface border-border rounded-[14px] border-[1.5px] p-[18px] text-center">
                <div className="mb-1 text-[22px]">{tier.icon}</div>
                <div className="text-[13px] font-extrabold" style={{ color: tier.color }}>
                  {tier.name}
                </div>
                <div className="text-text text-[28px] font-black">{count}</div>
                <div className="text-text-dim text-[11px]">{pct}% of users</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div>
        <div className="text-text mb-2.5 text-[15px] font-extrabold">Revenue Breakdown</div>
        <div className="bg-surface border-border rounded-[14px] border-[1.5px] p-[18px]">
          <div className="flex flex-col gap-2.5">
            {PLAN_ORDER.map((id) => {
              const tier = PLAN_TIERS[id];
              const count = planCounts[id];
              const planMrr = count * (tier.price ?? 0);
              const pct = mrr > 0 ? Math.round((planMrr / mrr) * 100) : 0;
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className="w-7 text-center text-base">{tier.icon}</div>
                  <div className="w-20 text-xs font-bold" style={{ color: tier.color }}>
                    {tier.name}
                  </div>
                  <div className="bg-border h-2 flex-1 overflow-hidden rounded">
                    <div
                      className="h-full rounded transition-[width] duration-300"
                      style={{
                        width: `${pct}%`,
                        background: tier.color,
                      }}
                    />
                  </div>
                  <div className="text-text w-20 text-right text-xs font-bold">₵{planMrr.toLocaleString()}</div>
                  <div className="text-text-dim w-10 text-right text-[11px]">{pct}%</div>
                </div>
              );
            })}
            <div className="border-border flex items-center justify-between border-t pt-2.5">
              <div className="text-text text-xs font-extrabold">Total MRR</div>
              <div className="text-success text-base font-black">₵{mrr.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {/* User Growth */}
        <div className="bg-surface border-border rounded-[14px] border-[1.5px] p-[18px]">
          <div className="text-text mb-2 text-[13px] font-extrabold">User Growth (12 months)</div>
          <svg viewBox="0 0 400 120" className="h-auto w-full">
            <defs>
              <linearGradient id="ugFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.primary} stopOpacity={0.25} />
                <stop offset="100%" stopColor={C.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={growth.area} fill="url(#ugFill)" />
            <path d={growth.line} fill="none" stroke={C.primary} strokeWidth={2.5} strokeLinejoin="round" />
            <text x={10} y={118} fontSize={9} fill={C.textDim}>
              {INV_USER_GROWTH[0]?.month}
            </text>
            <text x={350} y={118} fontSize={9} fill={C.textDim} textAnchor="end">
              {INV_USER_GROWTH[INV_USER_GROWTH.length - 1]?.month}
            </text>
          </svg>
        </div>

        {/* Revenue Trend */}
        <div className="bg-surface border-border rounded-[14px] border-[1.5px] p-[18px]">
          <div className="text-text mb-2 text-[13px] font-extrabold">Revenue Trend (12 months)</div>
          <svg viewBox="0 0 400 120" className="h-auto w-full">
            <defs>
              <linearGradient id="rvFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.success} stopOpacity={0.25} />
                <stop offset="100%" stopColor={C.success} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={revenue.area} fill="url(#rvFill)" />
            <path d={revenue.line} fill="none" stroke={C.success} strokeWidth={2.5} strokeLinejoin="round" />
            <text x={10} y={118} fontSize={9} fill={C.textDim}>
              {FIN_REVENUE[0]?.month}
            </text>
            <text x={350} y={118} fontSize={9} fill={C.textDim} textAnchor="end">
              {FIN_REVENUE[FIN_REVENUE.length - 1]?.month}
            </text>
          </svg>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div>
        <div className="text-text mb-2.5 text-[15px] font-extrabold">Recent Activity</div>
        <div className="flex flex-col gap-2">
          {recentLogs.map((evt) => {
            const rl = riskLevel(evt.risk);
            const rlDef = AUDIT_RISK_LEVELS[rl];
            return (
              <div
                key={evt.id}
                className="bg-surface border-border flex items-start gap-3 rounded-xl border-[1.5px] p-3.5"
              >
                <div className="bg-primary-bg flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full">
                  <Activity size={15} color={C.primary} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-text text-[13px]">
                    {evt.action} <span className="text-primary font-bold">{evt.target}</span>
                  </div>
                  <div className="text-text-dim mt-0.5 text-[11px]">
                    {evt.ts} &middot; {evt.actor}
                  </div>
                </div>
                <div
                  className="rounded-lg px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
                  style={{
                    background: rlDef.color + '18',
                    color: rlDef.color,
                  }}
                >
                  {evt.risk}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
