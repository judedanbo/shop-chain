import { PLAN_TIERS } from '@/constants/plans';
import type { PlanId, PlanUsage, UsageItem, UsageData } from '@/types';

export function computePlanUsage(planId: PlanId, usage: UsageData): PlanUsage {
  const plan = PLAN_TIERS[planId] ?? PLAN_TIERS.free;
  const rawItems: Array<{
    key: string;
    label: string;
    used: number;
    max: number;
    suffix?: string;
    formatMax?: (v: number) => string;
    formatUsed?: (v: number) => string;
  }> = [
    { key: 'shops', label: 'Shops', used: usage.shops ?? 0, max: plan.limits.shops },
    {
      key: 'branches',
      label: 'Branches',
      used: usage.branches ?? 0,
      max: plan.limits.branchesPerShop === -1 ? -1 : plan.limits.branchesPerShop * Math.max(usage.shops ?? 1, 1),
    },
    { key: 'team', label: 'Team Members', used: usage.team ?? 0, max: plan.limits.teamPerShop },
    { key: 'products', label: 'Products', used: usage.products ?? 0, max: plan.limits.productsPerShop },
    {
      key: 'transactions',
      label: 'Monthly Transactions',
      used: usage.transactions ?? 0,
      max: plan.limits.monthlyTransactions,
    },
    {
      key: 'storageMB',
      label: 'Storage',
      used: usage.storageMB ?? 0,
      max: plan.limits.storageMB,
      suffix: 'MB',
      formatMax: (v) => (v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v} MB`),
      formatUsed: (v) => (v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v} MB`),
    },
    { key: 'suppliers', label: 'Suppliers', used: usage.suppliers ?? 0, max: plan.limits.suppliers },
    { key: 'warehouses', label: 'Warehouses', used: usage.warehouses ?? 0, max: plan.limits.warehouses },
  ];

  const items: UsageItem[] = rawItems.map((item) => {
    const unlimited = item.max === -1;
    const pct = unlimited ? 0 : item.max > 0 ? Math.round((item.used / item.max) * 100) : 0;
    return {
      ...item,
      unlimited,
      pct,
      warning: !unlimited && pct >= 80 && pct < 100,
      blocked: !unlimited && pct >= 100,
    };
  });

  const warnings = items.filter((i) => i.warning);
  const blocked = items.filter((i) => i.blocked);
  const worstPct = Math.max(...items.filter((i) => !i.unlimited).map((i) => i.pct), 0);
  return { items, warnings, blocked, worstPct, plan };
}
