import { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  ShoppingCart,
  BarChart3,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowLeftRight,
  CalendarDays,
  Clock,
  Target,
  Users,
  ArrowLeft,
  ChefHat,
  Utensils,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation, useKitchenOrders } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { formatCurrency } from '@/utils/formatters';
import { Card, Button } from '@/components/ui';
import type { SaleRecord } from '@/types';

interface SalesAnalysisPageProps {
  salesHistory: SaleRecord[];
}

// ─── Helpers ───

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function filterActive(sales: SaleRecord[]): SaleRecord[] {
  return sales.filter((s) => s.status === 'completed');
}

function getSalesInRange(sales: SaleRecord[], start: Date, end: Date): SaleRecord[] {
  return sales.filter((s) => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });
}

function formatMinutes(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── Component ───

export function SalesAnalysisPage({ salesHistory }: SalesAnalysisPageProps) {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { setPage } = useNavigation();
  const mobile = isMobile(bp);
  const { orders: kitchenOrders } = useKitchenOrders();

  const [activeTab, setActiveTab] = useState<'sales' | 'kitchen'>('sales');

  const analysis = useMemo(() => {
    const today = getStartOfDay(new Date());
    const todayEnd = getEndOfDay(new Date());

    // Today
    const todayAll = getSalesInRange(salesHistory, today, todayEnd);
    const todayActive = filterActive(todayAll);
    const todayRevenue = todayActive.reduce((s, r) => s + r.total, 0);
    const todayCount = todayActive.length;
    const todayItems = todayActive.reduce((s, r) => s + r.itemCount, 0);
    const todayDiscount = todayActive.reduce((s, r) => s + r.discount, 0);
    const todayAvg = todayCount > 0 ? todayRevenue / todayCount : 0;

    // POS vs Bar breakdown (today)
    const posRevenue = todayActive.filter((s) => s.source !== 'bar').reduce((sum, r) => sum + r.total, 0);
    const barRevenue = todayActive.filter((s) => s.source === 'bar').reduce((sum, r) => sum + r.total, 0);
    const posCount = todayActive.filter((s) => s.source !== 'bar').length;
    const barCount = todayActive.filter((s) => s.source === 'bar').length;

    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = getEndOfDay(new Date(yesterday));
    const yesterdayActive = filterActive(getSalesInRange(salesHistory, yesterday, yesterdayEnd));
    const yesterdayRevenue = yesterdayActive.reduce((s, r) => s + r.total, 0);
    const yesterdayCount = yesterdayActive.length;

    // This week (Mon–today)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
    const weekActive = filterActive(getSalesInRange(salesHistory, weekStart, todayEnd));
    const weekRevenue = weekActive.reduce((s, r) => s + r.total, 0);
    const weekCount = weekActive.length;
    const daysInWeek = Math.max(1, Math.ceil((todayEnd.getTime() - weekStart.getTime()) / 86400000));
    const weekDailyAvg = weekRevenue / daysInWeek;

    // Last week (same period)
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    const lastWeekEndDay = getEndOfDay(lastWeekEnd);
    const lastWeekActive = filterActive(getSalesInRange(salesHistory, lastWeekStart, lastWeekEndDay));
    const lastWeekRevenue = lastWeekActive.reduce((s, r) => s + r.total, 0);

    // This month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthActive = filterActive(getSalesInRange(salesHistory, monthStart, todayEnd));
    const monthRevenue = monthActive.reduce((s, r) => s + r.total, 0);
    const monthCount = monthActive.length;
    const daysInMonth = today.getDate();
    const monthDailyAvg = monthRevenue / daysInMonth;

    // All time
    const allActive = filterActive(salesHistory);
    const allRevenue = allActive.reduce((s, r) => s + r.total, 0);

    // Payment method breakdown (today)
    const paymentBreakdown: Record<string, { count: number; total: number; label: string }> = {};
    todayActive.forEach((s) => {
      const key = s.paymentMethod;
      if (!paymentBreakdown[key]) paymentBreakdown[key] = { count: 0, total: 0, label: s.payLabel };
      const entry = paymentBreakdown[key];
      if (entry) {
        entry.count++;
        entry.total += s.total;
      }
    });

    // Top products today
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    todayActive.forEach((s) => {
      s.items.forEach((item) => {
        if (!productMap[item.id]) productMap[item.id] = { name: item.name, qty: 0, revenue: 0 };
        const entry = productMap[item.id];
        if (entry) {
          entry.qty += item.qty;
          entry.revenue += item.qty * item.price;
        }
      });
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Hourly breakdown (today)
    const hourly: number[] = Array(24).fill(0);
    todayActive.forEach((s) => {
      const hour = new Date(s.date).getHours();
      hourly[hour] = (hourly[hour] ?? 0) + s.total;
    });

    // Daily revenue (last 7 days) for chart
    const dailyRevenue: { label: string; revenue: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayEnd = getEndOfDay(new Date(day));
      const dayActive = filterActive(getSalesInRange(salesHistory, day, dayEnd));
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
      dailyRevenue.push({
        label: i === 0 ? 'Today' : i === 1 ? 'Yest.' : (dayNames[day.getDay()] ?? ''),
        revenue: dayActive.reduce((s, r) => s + r.total, 0),
        count: dayActive.length,
      });
    }

    // Customer breakdown (today)
    const customerSales = todayActive.filter((s) => s.customerId);
    const walkInSales = todayActive.filter((s) => !s.customerId);

    // Projections
    const monthProjection = monthDailyAvg * new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const weekProjection = weekDailyAvg * 7;

    // Percentage changes
    const revenueDiff =
      yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : todayRevenue > 0 ? 100 : 0;
    const weekDiff =
      lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : weekRevenue > 0 ? 100 : 0;

    return {
      todayRevenue,
      todayCount,
      todayItems,
      todayDiscount,
      todayAvg,
      yesterdayRevenue,
      yesterdayCount,
      revenueDiff,
      weekRevenue,
      weekCount,
      weekDailyAvg,
      weekDiff,
      weekProjection,
      monthRevenue,
      monthCount,
      monthDailyAvg,
      monthProjection,
      allRevenue,
      paymentBreakdown,
      topProducts,
      hourly,
      dailyRevenue,
      customerSales: customerSales.length,
      walkInSales: walkInSales.length,
      posRevenue,
      barRevenue,
      posCount,
      barCount,
    };
  }, [salesHistory]);

  // ─── Kitchen Analysis ───

  const kitchenAnalysis = useMemo(() => {
    const validOrders = kitchenOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'rejected');
    const completedOrders = kitchenOrders.filter((o) => o.completedAt);

    // Speed metrics (in milliseconds)
    const acceptTimes = kitchenOrders
      .filter((o) => o.acceptedAt && o.createdAt)
      .map((o) => new Date(o.acceptedAt!).getTime() - new Date(o.createdAt).getTime());
    const avgAcceptTime = acceptTimes.length > 0 ? acceptTimes.reduce((a, b) => a + b, 0) / acceptTimes.length : 0;

    const completeTimes = kitchenOrders
      .filter((o) => o.completedAt && o.acceptedAt)
      .map((o) => new Date(o.completedAt!).getTime() - new Date(o.acceptedAt!).getTime());
    const avgCompleteTime =
      completeTimes.length > 0 ? completeTimes.reduce((a, b) => a + b, 0) / completeTimes.length : 0;

    const serveTimes = kitchenOrders
      .filter((o) => o.servedAt && o.completedAt)
      .map((o) => new Date(o.servedAt!).getTime() - new Date(o.completedAt!).getTime());
    const avgServeTime = serveTimes.length > 0 ? serveTimes.reduce((a, b) => a + b, 0) / serveTimes.length : 0;

    // Efficiency
    const totalOrders = kitchenOrders.length;
    const acceptedCount = kitchenOrders.filter((o) => !['pending', 'rejected', 'cancelled'].includes(o.status)).length;
    const rejectedCount = kitchenOrders.filter((o) => o.status === 'rejected').length;
    const cancelledCount = kitchenOrders.filter((o) => o.status === 'cancelled').length;
    const acceptanceRate = totalOrders > 0 ? (acceptedCount / totalOrders) * 100 : 0;
    const rejectionRate = totalOrders > 0 ? (rejectedCount / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0;

    // Revenue
    const kitchenRevenue = validOrders.filter((o) => !o.barFulfilled).reduce((s, o) => s + (o.total ?? 0), 0);
    const barDirectRevenue = validOrders.filter((o) => o.barFulfilled).reduce((s, o) => s + (o.total ?? 0), 0);
    const totalRevenue = kitchenRevenue + barDirectRevenue;
    const avgOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // Top items
    const itemMap: Record<string, { name: string; qty: number }> = {};
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!itemMap[item.productId]) itemMap[item.productId] = { name: item.name, qty: 0 };
        const entry = itemMap[item.productId];
        if (entry) entry.qty += item.qty;
      });
    });
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    // Hourly order volume
    const hourly: number[] = Array(24).fill(0);
    kitchenOrders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      hourly[hour] = (hourly[hour] ?? 0) + 1;
    });

    // Till performance
    const tillPerf: Record<string, { name: string; revenue: number; orders: number }> = {};
    validOrders.forEach((o) => {
      if (!tillPerf[o.tillId]) tillPerf[o.tillId] = { name: o.tillName, revenue: 0, orders: 0 };
      const entry = tillPerf[o.tillId];
      if (entry) {
        entry.revenue += o.total ?? 0;
        entry.orders++;
      }
    });
    const tillPerfList = Object.values(tillPerf).sort((a, b) => b.revenue - a.revenue);

    return {
      totalOrders,
      validCount: validOrders.length,
      completedCount: completedOrders.length,
      avgAcceptTime,
      avgCompleteTime,
      avgServeTime,
      acceptanceRate,
      rejectionRate,
      cancellationRate,
      kitchenRevenue,
      barDirectRevenue,
      totalRevenue,
      avgOrderValue,
      topItems,
      hourly,
      tillPerfList,
    };
  }, [kitchenOrders]);

  // ─── Shared Styles ───

  const metricRowCls = 'border-b border-border/[0.03]';

  const pctBadge = (val: number): React.CSSProperties => ({
    color: val >= 0 ? COLORS.success : COLORS.danger,
    background: `${val >= 0 ? COLORS.success : COLORS.danger}12`,
  });
  const pctBadgeCls = 'px-2 py-0.5';

  const payIcons: Record<string, typeof Banknote> = {
    cash: Banknote,
    card: CreditCard,
    momo: Smartphone,
    split: ArrowLeftRight,
  };

  const payColors: Record<string, string> = {
    cash: COLORS.success,
    card: COLORS.primary,
    momo: COLORS.warning,
    split: COLORS.accent,
  };

  // ─── Hourly bar chart ───
  const peakHour = analysis.hourly.reduce((max, v, i) => (v > (analysis.hourly[max] ?? 0) ? i : max), 0);
  const maxHourly = Math.max(...analysis.hourly, 1);

  return (
    <div className="flex flex-col gap-[14px] md:gap-5">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={() => setPage('dashboard')} />
        <div>
          <h2 className="text-text m-0 text-[20px] font-extrabold sm:text-[24px]">Sales & Kitchen Analysis</h2>
          <p className="text-text-dim m-0 text-xs">Performance metrics, trends and kitchen efficiency</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-surface-alt border-border flex gap-1 rounded-xl border p-1">
        {[
          { key: 'sales' as const, label: 'Sales Analysis', icon: BarChart3 },
          { key: 'kitchen' as const, label: 'Kitchen Analysis', icon: ChefHat },
        ].map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border-none px-4 py-2.5 font-[inherit] text-[13px] transition-all',
              activeTab === tab.key ? 'bg-surface text-primary font-bold' : 'text-text-muted font-medium',
            )}
            style={{
              boxShadow: activeTab === tab.key ? `0 1px 3px ${COLORS.border}` : 'none',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === Sales Analysis Tab === */}
      {activeTab === 'sales' && (
        <>
          {/* === KPI Summary Cards === */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-4">
            {/* Today's Revenue */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-text-muted text-[11px] font-semibold tracking-wide uppercase">
                    Today's Revenue
                  </div>
                  <div className="text-text mt-1.5 text-[28px] font-extrabold tracking-tight">
                    {formatCurrency(analysis.todayRevenue)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-[3px] rounded-[6px] ${pctBadgeCls}`}
                      style={pctBadge(analysis.revenueDiff)}
                    >
                      {analysis.revenueDiff >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {analysis.revenueDiff >= 0 ? '+' : ''}
                      {analysis.revenueDiff.toFixed(1)}%
                    </span>
                    <span className="text-text-dim text-[11px]">vs yesterday</span>
                  </div>
                </div>
                <div className="bg-success/[0.08] flex h-11 w-11 items-center justify-center rounded-xl">
                  <DollarSign size={22} className="text-success" />
                </div>
              </div>
            </Card>

            {/* Transactions */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-text-muted text-[11px] font-semibold tracking-wide uppercase">Transactions</div>
                  <div className="text-text mt-1.5 text-[28px] font-extrabold tracking-tight">
                    {analysis.todayCount}
                  </div>
                  <div className="text-text-dim mt-2 text-[11px]">Yesterday: {analysis.yesterdayCount}</div>
                </div>
                <div className="bg-primary/[0.08] flex h-11 w-11 items-center justify-center rounded-xl">
                  <Receipt size={22} className="text-primary" />
                </div>
              </div>
            </Card>

            {/* Average Order */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-text-muted text-[11px] font-semibold tracking-wide uppercase">
                    Avg Order Value
                  </div>
                  <div className="text-text mt-1.5 text-[28px] font-extrabold tracking-tight">
                    {formatCurrency(analysis.todayAvg)}
                  </div>
                  <div className="text-text-dim mt-2 text-[11px]">{analysis.todayItems} items sold today</div>
                </div>
                <div className="bg-accent/[0.08] flex h-11 w-11 items-center justify-center rounded-xl">
                  <ShoppingCart size={22} className="text-accent" />
                </div>
              </div>
            </Card>

            {/* Discounts */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-text-muted text-[11px] font-semibold tracking-wide uppercase">
                    Discounts Given
                  </div>
                  <div className="text-text mt-1.5 text-[28px] font-extrabold tracking-tight">
                    {formatCurrency(analysis.todayDiscount)}
                  </div>
                  <div className="text-text-dim mt-2 text-[11px]">
                    {analysis.todayRevenue > 0
                      ? `${((analysis.todayDiscount / (analysis.todayRevenue + analysis.todayDiscount)) * 100).toFixed(1)}% of gross`
                      : 'No sales yet'}
                  </div>
                </div>
                <div className="bg-warning/[0.08] flex h-11 w-11 items-center justify-center rounded-xl">
                  <Target size={22} className="text-warning" />
                </div>
              </div>
            </Card>
          </div>

          {/* Revenue by Source */}
          <Card>
            <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
              <DollarSign size={16} className="text-success" />
              Revenue by Source (Today)
            </div>
            <div className="mb-3.5 flex gap-3">
              <div className="bg-primary/[0.03] flex-1 rounded-[10px] px-3 py-3.5 text-center">
                <div className="text-primary text-[22px] font-extrabold">{formatCurrency(analysis.posRevenue)}</div>
                <div className="text-text-muted mt-1 text-[11px] font-semibold">POS ({analysis.posCount} sales)</div>
              </div>
              <div className="bg-warning/[0.03] flex-1 rounded-[10px] px-3 py-3.5 text-center">
                <div className="text-warning text-[22px] font-extrabold">{formatCurrency(analysis.barRevenue)}</div>
                <div className="text-text-muted mt-1 text-[11px] font-semibold">
                  Bar/Restaurant ({analysis.barCount} sales)
                </div>
              </div>
            </div>
            {analysis.todayRevenue > 0 && (
              <div className="bg-surface-alt flex h-2 overflow-hidden rounded">
                <div
                  className="bg-primary h-full rounded-l"
                  style={{ width: `${(analysis.posRevenue / analysis.todayRevenue) * 100}%` }}
                />
                <div className="bg-warning h-full flex-1 rounded-r" />
              </div>
            )}
          </Card>

          {/* === Comparison & Projections === */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {/* Period Comparison */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <CalendarDays size={16} className="text-primary" />
                Period Comparison
              </div>

              <div className={`flex items-center justify-between py-2.5 ${metricRowCls}`}>
                <div>
                  <div className="text-text text-[13px] font-semibold">Today</div>
                  <div className="text-text-dim text-[11px]">{analysis.todayCount} transactions</div>
                </div>
                <div className="text-right">
                  <div className="text-text text-[15px] font-bold">{formatCurrency(analysis.todayRevenue)}</div>
                </div>
              </div>

              <div className={`flex items-center justify-between py-2.5 ${metricRowCls}`}>
                <div>
                  <div className="text-text text-[13px] font-semibold">Yesterday</div>
                  <div className="text-text-dim text-[11px]">{analysis.yesterdayCount} transactions</div>
                </div>
                <div className="text-right">
                  <div className="text-text text-[15px] font-bold">{formatCurrency(analysis.yesterdayRevenue)}</div>
                  <span
                    className={`inline-flex items-center gap-[3px] rounded-[6px] ${pctBadgeCls}`}
                    style={pctBadge(analysis.revenueDiff)}
                  >
                    {analysis.revenueDiff >= 0 ? '+' : ''}
                    {analysis.revenueDiff.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className={`flex items-center justify-between py-2.5 ${metricRowCls}`}>
                <div>
                  <div className="text-text text-[13px] font-semibold">This Week</div>
                  <div className="text-text-dim text-[11px]">{analysis.weekCount} transactions</div>
                </div>
                <div className="text-right">
                  <div className="text-text text-[15px] font-bold">{formatCurrency(analysis.weekRevenue)}</div>
                  <span
                    className={`inline-flex items-center gap-[3px] rounded-[6px] ${pctBadgeCls}`}
                    style={pctBadge(analysis.weekDiff)}
                  >
                    {analysis.weekDiff >= 0 ? '+' : ''}
                    {analysis.weekDiff.toFixed(1)}% vs last
                  </span>
                </div>
              </div>

              <div className={`flex items-center justify-between border-b-0 py-2.5 ${metricRowCls}`}>
                <div>
                  <div className="text-text text-[13px] font-semibold">This Month</div>
                  <div className="text-text-dim text-[11px]">{analysis.monthCount} transactions</div>
                </div>
                <div className="text-right">
                  <div className="text-text text-[15px] font-bold">{formatCurrency(analysis.monthRevenue)}</div>
                </div>
              </div>
            </Card>

            {/* Projections */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <Target size={16} className="text-accent" />
                Projections & Run Rate
              </div>

              <div className="bg-accent/[0.03] mb-3.5 rounded-xl px-4 py-3.5">
                <div className="text-accent mb-1.5 text-[11px] font-bold tracking-wide uppercase">
                  Daily Average (This Month)
                </div>
                <div className="text-text text-2xl font-extrabold">{formatCurrency(analysis.monthDailyAvg)}</div>
                <div className="text-text-dim mt-1 text-[11px]">
                  Based on {new Date().getDate()} day{new Date().getDate() !== 1 ? 's' : ''} of data
                </div>
              </div>

              <div className={`flex items-center justify-between py-2.5 ${metricRowCls}`}>
                <div>
                  <div className="text-text text-[13px] font-semibold">Weekly Projection</div>
                  <div className="text-text-dim text-[11px]">At current daily avg</div>
                </div>
                <div className="text-success text-base font-bold">{formatCurrency(analysis.weekProjection)}</div>
              </div>

              <div className={`flex items-center justify-between py-2.5 ${metricRowCls}`}>
                <div>
                  <div className="text-text text-[13px] font-semibold">Monthly Projection</div>
                  <div className="text-text-dim text-[11px]">Projected end-of-month</div>
                </div>
                <div className="text-success text-base font-bold">{formatCurrency(analysis.monthProjection)}</div>
              </div>

              <div className={`flex items-center justify-between border-b-0 py-2.5 ${metricRowCls}`}>
                <div>
                  <div className="text-text text-[13px] font-semibold">Week Daily Avg</div>
                  <div className="text-text-dim text-[11px]">Average this week</div>
                </div>
                <div className="text-text text-base font-bold">{formatCurrency(analysis.weekDailyAvg)}</div>
              </div>
            </Card>
          </div>

          {/* === 7-Day Revenue Chart + Payment Breakdown === */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[2fr_1fr]">
            {/* 7-Day Revenue */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <BarChart3 size={16} className="text-primary" />
                7-Day Revenue
              </div>
              <div className="flex h-[180px] items-end pt-2.5" style={{ gap: mobile ? 6 : 10 }}>
                {analysis.dailyRevenue.map((d, i) => {
                  const maxVal = Math.max(...analysis.dailyRevenue.map((x) => x.revenue), 1);
                  const barH = (d.revenue / maxVal) * 150;
                  const isToday = i === analysis.dailyRevenue.length - 1;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="text-text-dim text-[9px] font-semibold">
                        {d.revenue > 0 ? formatCurrency(d.revenue).replace('GH₵ ', '') : '—'}
                      </div>
                      <div
                        className="w-full max-w-[48px] transition-all duration-300"
                        style={{
                          height: Math.max(barH, 4),
                          borderRadius: '6px 6px 3px 3px',
                          background: isToday
                            ? `linear-gradient(180deg, ${COLORS.primary}, ${COLORS.primary}90)`
                            : `${COLORS.primary}25`,
                        }}
                      />
                      <div
                        className={clsx(
                          'text-[10px]',
                          isToday ? 'text-primary font-bold' : 'text-text-dim font-medium',
                        )}
                      >
                        {d.label}
                      </div>
                      <div className="text-text-dim text-[9px]">{d.count}txn</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Payment Breakdown */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <CreditCard size={16} className="text-accent" />
                Payment Methods (Today)
              </div>
              {Object.keys(analysis.paymentBreakdown).length === 0 ? (
                <div className="text-text-dim p-[30px] text-center text-xs">No sales today</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {Object.entries(analysis.paymentBreakdown).map(([method, data]) => {
                    const pct = analysis.todayRevenue > 0 ? (data.total / analysis.todayRevenue) * 100 : 0;
                    const Icon = payIcons[method] || Banknote;
                    const color = payColors[method] || COLORS.textMuted;
                    return (
                      <div key={method}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-[30px] w-[30px] items-center justify-center rounded-lg"
                              style={{ background: `${color}15` }}
                            >
                              <Icon size={14} style={{ color }} />
                            </div>
                            <div>
                              <div className="text-text text-xs font-semibold">{data.label}</div>
                              <div className="text-text-dim text-[10px]">
                                {data.count} txn{data.count !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-text text-[13px] font-bold">{formatCurrency(data.total)}</div>
                            <div className="text-text-dim text-[10px]">{pct.toFixed(0)}%</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-[5px] overflow-hidden rounded-sm" style={{ background: `${color}12` }}>
                          <div
                            className="h-full rounded-sm transition-all duration-400"
                            style={{
                              width: `${pct}%`,
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* === Hourly Distribution + Top Products + Customer Mix === */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {/* Hourly Distribution */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <Clock size={16} className="text-warning" />
                Hourly Distribution
              </div>
              {analysis.hourly.every((v) => v === 0) ? (
                <div className="text-text-dim p-[30px] text-center text-xs">No sales today</div>
              ) : (
                <>
                  <div className="flex h-[120px] items-end gap-0.5">
                    {analysis.hourly.slice(6, 22).map((val, i) => {
                      const hour = i + 6;
                      const barH = (val / maxHourly) * 100;
                      const isPeak = hour === peakHour;
                      return (
                        <div key={hour} className="flex flex-1 flex-col items-center gap-0.5">
                          <div
                            className="w-full"
                            style={{
                              height: Math.max(barH, 2),
                              borderRadius: '3px 3px 1px 1px',
                              background: isPeak ? COLORS.warning : `${COLORS.warning}30`,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 flex justify-between">
                    <span className="text-text-dim text-[9px]">6am</span>
                    <span className="text-text-dim text-[9px]">12pm</span>
                    <span className="text-text-dim text-[9px]">6pm</span>
                    <span className="text-text-dim text-[9px]">10pm</span>
                  </div>
                  <div className="bg-warning/[0.03] mt-3 rounded-lg px-3 py-2">
                    <span className="text-text text-[11px] font-semibold">Peak hour: </span>
                    <span className="text-text-dim text-[11px]">
                      {peakHour}:00 — {formatCurrency(analysis.hourly[peakHour])}
                    </span>
                  </div>
                </>
              )}
            </Card>

            {/* Top Products */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <ShoppingCart size={16} className="text-success" />
                Top Products (Today)
              </div>
              {analysis.topProducts.length === 0 ? (
                <div className="text-text-dim p-[30px] text-center text-xs">No sales today</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {analysis.topProducts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 py-2"
                      style={{
                        borderBottom: i < analysis.topProducts.length - 1 ? `1px solid ${COLORS.border}08` : 'none',
                      }}
                    >
                      <div
                        className={clsx(
                          'flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold',
                          i === 0 ? 'text-success' : 'text-text-dim',
                        )}
                        style={{
                          background: i === 0 ? `${COLORS.success}20` : COLORS.surfaceAlt,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-text overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                          {p.name}
                        </div>
                        <div className="text-text-dim text-[10px]">{p.qty} units</div>
                      </div>
                      <div className="text-text text-xs font-bold">{formatCurrency(p.revenue)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Customer Mix */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <Users size={16} className="text-primary" />
                Customer Mix (Today)
              </div>
              {analysis.todayCount === 0 ? (
                <div className="text-text-dim p-[30px] text-center text-xs">No sales today</div>
              ) : (
                <>
                  <div className="mb-4 flex gap-3">
                    {/* Registered */}
                    <div className="bg-primary/[0.03] flex-1 rounded-[10px] px-3 py-3.5 text-center">
                      <div className="text-primary text-[22px] font-extrabold">{analysis.customerSales}</div>
                      <div className="text-text-muted mt-1 text-[11px] font-semibold">Registered</div>
                    </div>
                    {/* Walk-ins */}
                    <div className="bg-text-muted/[0.03] flex-1 rounded-[10px] px-3 py-3.5 text-center">
                      <div className="text-text-muted text-[22px] font-extrabold">{analysis.walkInSales}</div>
                      <div className="text-text-muted mt-1 text-[11px] font-semibold">Walk-ins</div>
                    </div>
                  </div>
                  {/* Ratio bar */}
                  <div className="bg-surface-alt flex h-2 overflow-hidden rounded">
                    <div
                      className="bg-primary h-full rounded-l"
                      style={{ width: `${(analysis.customerSales / analysis.todayCount) * 100}%` }}
                    />
                    <div className="h-full flex-1 rounded-r" style={{ background: `${COLORS.textMuted}30` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between">
                    <span className="text-primary text-[10px] font-semibold">
                      {analysis.todayCount > 0 ? ((analysis.customerSales / analysis.todayCount) * 100).toFixed(0) : 0}%
                      registered
                    </span>
                    <span className="text-text-dim text-[10px]">
                      {analysis.todayCount > 0 ? ((analysis.walkInSales / analysis.todayCount) * 100).toFixed(0) : 0}%
                      walk-ins
                    </span>
                  </div>
                </>
              )}

              {/* Quick action */}
              <div className="border-border mt-4 border-t pt-3">
                <div
                  onClick={() => setPage('sales')}
                  className="text-primary flex cursor-pointer items-center gap-1 text-xs font-semibold"
                >
                  View All Sales →
                </div>
              </div>
            </Card>
          </div>

          {/* === All-Time Summary === */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-text-muted text-[11px] font-semibold tracking-wide uppercase">
                  All-Time Revenue
                </div>
                <div className="text-text mt-1 text-[22px] font-extrabold">{formatCurrency(analysis.allRevenue)}</div>
              </div>
              <div className="flex gap-5">
                <div>
                  <div className="text-text-dim mb-0.5 text-[10px]">Total Transactions</div>
                  <div className="text-text text-base font-bold">{filterActive(salesHistory).length}</div>
                </div>
                <div>
                  <div className="text-text-dim mb-0.5 text-[10px]">All-Time Avg</div>
                  <div className="text-text text-base font-bold">
                    {formatCurrency(
                      filterActive(salesHistory).length > 0
                        ? analysis.allRevenue / filterActive(salesHistory).length
                        : 0,
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* === Kitchen Analysis Tab === */}
      {activeTab === 'kitchen' && (
        <>
          {/* Speed KPI Cards */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {[
              {
                label: 'Avg Accept Time',
                value: formatMinutes(kitchenAnalysis.avgAcceptTime),
                icon: Clock,
                color: COLORS.primary,
                desc: 'Order to accepted',
              },
              {
                label: 'Avg Prep Time',
                value: formatMinutes(kitchenAnalysis.avgCompleteTime),
                icon: ChefHat,
                color: COLORS.warning,
                desc: 'Accepted to completed',
              },
              {
                label: 'Avg Serve Time',
                value: formatMinutes(kitchenAnalysis.avgServeTime),
                icon: Utensils,
                color: COLORS.success,
                desc: 'Completed to served',
              },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-text-muted text-[11px] font-semibold tracking-wide uppercase">{kpi.label}</div>
                    <div className="text-text mt-1.5 text-[28px] font-extrabold tracking-tight">{kpi.value}</div>
                    <div className="text-text-dim mt-2 text-[11px]">{kpi.desc}</div>
                  </div>
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `${kpi.color}15` }}
                  >
                    <kpi.icon size={22} style={{ color: kpi.color }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Efficiency & Revenue */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {/* Efficiency */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <Target size={16} className="text-primary" />
                Order Efficiency
              </div>
              <div className="mb-3.5">
                <div className="text-text-dim mb-1 text-[11px]">
                  Total Orders: <span className="text-text font-bold">{kitchenAnalysis.totalOrders}</span>
                </div>
              </div>
              {[
                { label: 'Acceptance Rate', value: kitchenAnalysis.acceptanceRate, color: COLORS.success },
                { label: 'Rejection Rate', value: kitchenAnalysis.rejectionRate, color: COLORS.danger },
                { label: 'Cancellation Rate', value: kitchenAnalysis.cancellationRate, color: COLORS.warning },
              ].map((stat) => (
                <div key={stat.label} className="mb-3">
                  <div className="mb-1 flex justify-between">
                    <span className="text-text text-xs font-semibold">{stat.label}</span>
                    <span className="text-xs font-bold" style={{ color: stat.color }}>
                      {stat.value.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-sm" style={{ background: `${stat.color}12` }}>
                    <div
                      className="h-full rounded-sm transition-all duration-400"
                      style={{
                        width: `${Math.min(stat.value, 100)}%`,
                        background: stat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </Card>

            {/* Revenue */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <DollarSign size={16} className="text-success" />
                Kitchen & Bar Revenue
              </div>
              <div className="mb-3.5 flex gap-3">
                <div className="bg-accent/[0.03] flex-1 rounded-[10px] px-3 py-3.5 text-center">
                  <div className="text-accent text-[22px] font-extrabold">
                    {formatCurrency(kitchenAnalysis.kitchenRevenue)}
                  </div>
                  <div className="text-text-muted mt-1 text-[11px] font-semibold">Kitchen</div>
                </div>
                <div className="bg-warning/[0.03] flex-1 rounded-[10px] px-3 py-3.5 text-center">
                  <div className="text-warning text-[22px] font-extrabold">
                    {formatCurrency(kitchenAnalysis.barDirectRevenue)}
                  </div>
                  <div className="text-text-muted mt-1 text-[11px] font-semibold">Bar Direct</div>
                </div>
              </div>
              <div className={`flex items-center justify-between py-2.5 ${metricRowCls}`}>
                <div>
                  <div className="text-text text-[13px] font-semibold">Total Revenue</div>
                </div>
                <div className="text-text text-base font-bold">{formatCurrency(kitchenAnalysis.totalRevenue)}</div>
              </div>
              <div className={`flex items-center justify-between border-b-0 py-2.5 ${metricRowCls}`}>
                <div>
                  <div className="text-text text-[13px] font-semibold">Avg Order Value</div>
                </div>
                <div className="text-text text-base font-bold">{formatCurrency(kitchenAnalysis.avgOrderValue)}</div>
              </div>
            </Card>
          </div>

          {/* Top Items & Hourly Volume */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {/* Top Items */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <ShoppingCart size={16} className="text-success" />
                Most Ordered Items
              </div>
              {kitchenAnalysis.topItems.length === 0 ? (
                <div className="text-text-dim p-[30px] text-center text-xs">No orders yet</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {kitchenAnalysis.topItems.map((item, i) => {
                    const maxQty = Math.max(...kitchenAnalysis.topItems.map((x) => x.qty), 1);
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <div
                          className={clsx(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                            i === 0 ? 'text-success' : 'text-text-dim',
                          )}
                          style={{
                            background: i === 0 ? `${COLORS.success}20` : COLORS.surfaceAlt,
                          }}
                        >
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-text overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                            {item.name}
                          </div>
                          <div className="bg-primary/[0.07] mt-1 h-1 overflow-hidden rounded-sm">
                            <div
                              className="bg-primary h-full rounded-sm"
                              style={{ width: `${(item.qty / maxQty) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-text shrink-0 text-xs font-bold">{item.qty} units</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Hourly Volume */}
            <Card>
              <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
                <Clock size={16} className="text-warning" />
                Order Volume by Hour
              </div>
              {kitchenAnalysis.hourly.every((v) => v === 0) ? (
                <div className="text-text-dim p-[30px] text-center text-xs">No orders yet</div>
              ) : (
                (() => {
                  const maxH = Math.max(...kitchenAnalysis.hourly, 1);
                  const peakH = kitchenAnalysis.hourly.reduce(
                    (max, v, i) => (v > (kitchenAnalysis.hourly[max] ?? 0) ? i : max),
                    0,
                  );
                  return (
                    <>
                      <div className="flex h-[120px] items-end gap-0.5">
                        {kitchenAnalysis.hourly.slice(6, 22).map((val, i) => {
                          const hour = i + 6;
                          const barH = (val / maxH) * 100;
                          const isPeak = hour === peakH;
                          return (
                            <div key={hour} className="flex flex-1 flex-col items-center gap-0.5">
                              <div
                                className="w-full"
                                style={{
                                  height: Math.max(barH, 2),
                                  borderRadius: '3px 3px 1px 1px',
                                  background: isPeak ? COLORS.warning : `${COLORS.warning}30`,
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-1.5 flex justify-between">
                        <span className="text-text-dim text-[9px]">6am</span>
                        <span className="text-text-dim text-[9px]">12pm</span>
                        <span className="text-text-dim text-[9px]">6pm</span>
                        <span className="text-text-dim text-[9px]">10pm</span>
                      </div>
                      <div className="bg-warning/[0.03] mt-3 rounded-lg px-3 py-2">
                        <span className="text-text text-[11px] font-semibold">Peak hour: </span>
                        <span className="text-text-dim text-[11px]">
                          {peakH}:00 — {kitchenAnalysis.hourly[peakH]} orders
                        </span>
                      </div>
                    </>
                  );
                })()
              )}
            </Card>
          </div>

          {/* Till Performance */}
          <Card>
            <div className="text-text mb-3.5 flex items-center gap-2 text-[15px] font-bold">
              <Receipt size={16} className="text-primary" />
              Till Performance
            </div>
            {kitchenAnalysis.tillPerfList.length === 0 ? (
              <div className="text-text-dim p-[30px] text-center text-xs">No till data</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-surface-alt">
                      <th className="form-label px-3.5 py-2.5 text-left tracking-wide">Till</th>
                      <th className="form-label px-3.5 py-2.5 text-center tracking-wide">Orders</th>
                      <th className="form-label px-3.5 py-2.5 text-right tracking-wide">Revenue</th>
                      <th className="form-label px-3.5 py-2.5 text-right tracking-wide">Avg/Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kitchenAnalysis.tillPerfList.map((till) => (
                      <tr key={till.name} className="border-border/[0.03] border-t">
                        <td className="text-text px-3.5 py-2.5 text-xs font-semibold">{till.name}</td>
                        <td className="text-text-muted px-3.5 py-2.5 text-center text-xs">{till.orders}</td>
                        <td className="text-text px-3.5 py-2.5 text-right font-mono text-xs font-bold">
                          {formatCurrency(till.revenue)}
                        </td>
                        <td className="text-text-muted px-3.5 py-2.5 text-right font-mono text-xs">
                          {formatCurrency(till.orders > 0 ? till.revenue / till.orders : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
