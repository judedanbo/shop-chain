import { useMemo } from 'react';
import { Box, Package, DollarSign, AlertTriangle, Download, Clock, Receipt } from 'lucide-react';
import { useColors, useNavigation } from '@/context';
import { getExpiryStatus, formatCurrency } from '@/utils/formatters';
import { Card, Button, ProgressBar } from '@/components/ui';
import type { Product, SaleRecord } from '@/types';
import { KPICard } from './KPICard';
import { LowStockAlerts } from './LowStockAlerts';
import { ExpiryAlerts } from './ExpiryAlerts';
import { RecentActivity } from './RecentActivity';

interface DashboardPageProps {
  products: Product[];
  salesHistory: SaleRecord[];
}

export const DashboardPage = ({ products, salesHistory }: DashboardPageProps) => {
  const COLORS = useColors();
  const { setPage } = useNavigation();

  const totalProducts = products.length;
  const totalStock = products.reduce((a, p) => a + p.stock, 0);
  const lowStock = products.filter((p) => p.status === 'low_stock').length;
  const outOfStock = products.filter((p) => p.status === 'out_of_stock').length;
  const totalValue = products.reduce((a, p) => a + p.stock * p.cost, 0);
  const expiringSoon = products.filter((p) => getExpiryStatus(p.expiryDate) === 'expiring_soon').length;
  const expired = products.filter((p) => getExpiryStatus(p.expiryDate) === 'expired').length;

  // Today's sales metrics
  const todaySales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const active = salesHistory.filter((s) => {
      const d = new Date(s.date);
      return d >= today && d <= todayEnd && s.status === 'completed';
    });

    const revenue = active.reduce((sum, s) => sum + s.total, 0);
    const count = active.length;

    // Last 7 days revenue for sparkline
    const weekData: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      const dayRevenue = salesHistory
        .filter((s) => {
          const d = new Date(s.date);
          return d >= day && d <= dayEnd && s.status === 'completed';
        })
        .reduce((sum, s) => sum + s.total, 0);
      weekData.push(dayRevenue);
    }

    // Yesterday's revenue for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    const yesterdayRevenue = salesHistory
      .filter((s) => {
        const d = new Date(s.date);
        return d >= yesterday && d <= yesterdayEnd && s.status === 'completed';
      })
      .reduce((sum, s) => sum + s.total, 0);

    const diff = yesterdayRevenue > 0 ? ((revenue - yesterdayRevenue) / yesterdayRevenue) * 100 : revenue > 0 ? 100 : 0;

    return { revenue, count, weekData, diff };
  }, [salesHistory]);

  const kpis = [
    {
      label: 'Total Products',
      value: totalProducts,
      icon: Box,
      color: COLORS.primary,
      trend: '+3',
      chartData: [5, 6, 5, 7, 8, 8],
      trendUp: true,
    },
    {
      label: 'Total Stock Units',
      value: totalStock.toLocaleString(),
      icon: Package,
      color: COLORS.accent,
      trend: '+124',
      chartData: [2500, 2600, 2580, 2700, 2650, 2704],
      trendUp: true,
    },
    {
      label: 'Inventory Value',
      value: `GH₵ ${totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: COLORS.success,
      trend: '+8.2%',
      chartData: [150000, 155000, 148000, 162000, 158000, 165000],
      trendUp: true,
    },
    {
      label: 'Low / Out of Stock',
      value: `${lowStock} / ${outOfStock}`,
      icon: AlertTriangle,
      color: COLORS.danger,
      trend: '-2',
      chartData: [6, 5, 7, 4, 5, 4],
      trendUp: false,
    },
    {
      label: 'Expiring / Expired',
      value: `${expiringSoon} / ${expired}`,
      icon: Clock,
      color: COLORS.warning,
      trend: expired > 0 ? `${expired} expired` : 'OK',
      chartData: [3, 2, 4, 3, 2, expiringSoon + expired],
      trendUp: false,
    },
  ];

  return (
    <div className="flex flex-col gap-3 md:gap-5">
      {/* KPIs */}
      <div className="xl2:grid-cols-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {kpis.map((kpi, i) => (
          <KPICard key={i} {...kpi} />
        ))}
        {/* Today's Sales — clickable KPI card */}
        <Card onClick={() => setPage('salesAnalysis')} hover>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-text-muted mb-2 text-xs font-medium">Today's Sales</div>
              <div className="text-text text-2xl font-bold tracking-[-0.5px]">{formatCurrency(todaySales.revenue)}</div>
              <div className="mt-2 flex items-center gap-1">
                <span
                  className="text-[11px] font-semibold"
                  style={{
                    color: todaySales.diff >= 0 ? COLORS.success : COLORS.danger,
                  }}
                >
                  {todaySales.diff >= 0 ? '+' : ''}
                  {todaySales.diff.toFixed(1)}%
                </span>
                <span className="text-text-dim text-[11px]">vs yesterday</span>
              </div>
              <div className="text-text-dim mt-1 text-[11px]">
                {todaySales.count} transaction{todaySales.count !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-orange/[0.09] flex h-10 w-10 items-center justify-center rounded-[10px]">
                <Receipt size={20} className="text-orange" />
              </div>
              {/* Inline sparkline for 7-day sales */}
              {todaySales.weekData.some((v) => v > 0) &&
                (() => {
                  const data = todaySales.weekData;
                  const max = Math.max(...data);
                  const min = Math.min(...data);
                  const range = max - min || 1;
                  const h = 40;
                  const w = 120;
                  const pts = data
                    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
                    .join(' ');
                  return (
                    <svg width={w} height={h} className="block">
                      <defs>
                        <linearGradient id="grad-sales-dash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLORS.orange} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#grad-sales-dash)" />
                      <polyline
                        points={pts}
                        fill="none"
                        stroke={COLORS.orange}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  );
                })()}
            </div>
          </div>
          {/* Subtle "View Analysis" link */}
          <div className="border-border mt-2.5 flex items-center gap-1 border-t pt-2">
            <span className="text-primary text-[11px] font-semibold">View Sales Analysis →</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <LowStockAlerts products={products} />
        <ExpiryAlerts products={products} />
        <RecentActivity salesHistory={salesHistory} />
      </div>

      {/* Category Breakdown */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-text text-[15px] font-semibold">Stock by Category</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={Download}>
              Export
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(() => {
            const catColors = [
              COLORS.accent,
              COLORS.primary,
              COLORS.success,
              COLORS.orange,
              COLORS.warning,
              COLORS.danger,
            ];
            const catMap: Record<string, number> = {};
            products.forEach((p) => {
              catMap[p.category] = (catMap[p.category] ?? 0) + p.stock;
            });
            const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
            return entries.map(([cat, count], i) => ({
              cat,
              count,
              pct: totalStock > 0 ? Math.round((count / totalStock) * 100) : 0,
              color: catColors[i % catColors.length] ?? COLORS.accent,
            }));
          })().map((c, i) => (
            <div
              key={i}
              className="bg-surface-alt rounded-[10px] px-4 py-3.5"
              style={{ borderLeft: `3px solid ${c.color}` }}
            >
              <div className="text-text-muted mb-1 text-xs">{c.cat}</div>
              <div className="text-text text-xl font-bold">{c.count.toLocaleString()}</div>
              <ProgressBar value={c.pct} max={100} color={c.color} />
              <div className="text-text-dim mt-1 text-[11px]">{c.pct}% of total</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
