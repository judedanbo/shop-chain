import React, { useState } from 'react';
import {
  Search,
  X,
  RotateCcw,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Filter,
  BarChart3,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, useShop, useAuth, useNotifications, useNavigation } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { paginate } from '@/utils/pagination';
import { Button, Paginator, StatusBadge } from '@/components/ui';
import type { SaleRecord, Customer } from '@/types';

// ─── Props ───

interface SalesPageProps {
  salesHistory: SaleRecord[];
  setSalesHistory: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  customers: Customer[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
}

const MOMO_LABELS: Record<string, string> = {
  mtn: 'MTN MoMo',
  vodafone: 'Vodafone Cash',
  telecel: 'Telecel Cash',
};

// ─── SalesPage ───

export const SalesPage: React.FC<SalesPageProps> = ({ salesHistory, setSalesHistory, setCustomers }) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { canAccess, hasFullAccess } = useShop();
  const { currentRole } = useAuth();
  const { dispatch: notifDispatch } = useNotifications();
  const { setPage } = useNavigation();
  const mobile = isMobile(bp);

  // Permissions
  const canInitiateReversal = canAccess('pos_void');
  const canApproveReversal = hasFullAccess('pos_void');

  // ─── State ───
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'reversed' | 'pending_reversal'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'momo' | 'split'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'pos' | 'bar'>('all');
  const [tblPage, setTblPage] = useState(1);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [showReversalModal, setShowReversalModal] = useState<SaleRecord | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [showPendingReversals, setShowPendingReversals] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Computed ───
  const activeSales = salesHistory.filter((s) => s.status === 'completed');
  const reversedSales = salesHistory.filter((s) => s.status === 'reversed');
  const pendingReversals = salesHistory.filter((s) => s.status === 'pending_reversal');

  // Date helpers
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 6 * 86400000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filtered = salesHistory.filter((s) => {
    // Search
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!s.id.toLowerCase().includes(q) && !s.customerName.toLowerCase().includes(q)) return false;
    }
    // Status
    if (statusFilter !== 'all') {
      if (s.status !== statusFilter) return false;
    }
    // Payment
    if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;
    // Date
    if (dateFilter !== 'all') {
      const saleTime = new Date(s.date).getTime();
      if (dateFilter === 'today' && saleTime < todayStart) return false;
      if (dateFilter === 'week' && saleTime < weekStart) return false;
      if (dateFilter === 'month' && saleTime < monthStart) return false;
    }
    // Source
    if (sourceFilter !== 'all') {
      if (sourceFilter === 'bar' && s.source !== 'bar') return false;
      if (sourceFilter === 'pos' && s.source === 'bar') return false;
    }
    return true;
  });

  const PER_PAGE = 10;
  const pag = paginate(filtered, tblPage, PER_PAGE);

  // ─── Reversal Functions ───
  const handleReverseSale = (sale: SaleRecord) => {
    setShowReversalModal(sale);
    setReversalReason('');
  };

  const executeReversal = (saleId: string, reason: string, approver?: string) => {
    const sale = salesHistory.find((s) => s.id === saleId);
    if (!sale || sale.status === 'reversed') return;
    setSalesHistory((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        return {
          ...s,
          status: 'reversed' as const,
          reversedAt: new Date().toISOString(),
          reversedBy: approver || currentRole,
          reversalReason: reason || s.reversalReason || 'No reason provided',
        };
      }),
    );
    if (sale.customerId && setCustomers) {
      setCustomers((prev: Customer[]) =>
        prev.map((c) =>
          c.id === sale.customerId
            ? {
                ...c,
                totalSpent: Math.max(0, c.totalSpent - sale.total),
                visits: Math.max(0, c.visits - 1),
                loyaltyPts: Math.max(0, (c.loyaltyPts || 0) - Math.floor(sale.total / 10)),
              }
            : c,
        ),
      );
    }
    // Notify about approved or direct reversal
    if (sale.reversalRequestedBy) {
      notifDispatch.reversalApproved(approver || currentRole, currentRole, saleId, sale.reversalRequestedBy);
    } else {
      notifDispatch.reversalDirect(
        approver || currentRole,
        currentRole,
        saleId,
        sale.total,
        reason || 'No reason provided',
      );
    }
    setShowReversalModal(null);
    setReversalReason('');
  };

  const requestReversal = (saleId: string, reason: string) => {
    const reqSale = salesHistory.find((s) => s.id === saleId);
    setSalesHistory((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        return {
          ...s,
          status: 'pending_reversal' as const,
          reversalReason: reason,
          reversalRequestedBy: currentRole,
          reversalRequestedAt: new Date().toISOString(),
        };
      }),
    );
    if (reqSale) {
      notifDispatch.reversalRequested(currentRole, currentRole, saleId, reqSale.total, reason);
    }
    setShowReversalModal(null);
    setReversalReason('');
  };

  const rejectReversal = (saleId: string) => {
    const rejSale = salesHistory.find((s) => s.id === saleId);
    setSalesHistory((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        return {
          ...s,
          status: 'completed' as const,
          reversalReason: undefined,
          reversalRequestedBy: undefined,
          reversalRequestedAt: undefined,
        };
      }),
    );
    if (rejSale?.reversalRequestedBy) {
      notifDispatch.reversalRejected(currentRole, currentRole, saleId, rejSale.reversalRequestedBy);
    }
  };

  const confirmReversal = () => {
    if (!showReversalModal || !reversalReason.trim()) return;
    const saleId = showReversalModal.id;
    if (canApproveReversal) {
      executeReversal(saleId, reversalReason.trim());
    } else {
      requestReversal(saleId, reversalReason.trim());
    }
  };

  // ─── KPI Data ───
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.total, 0);
  const totalSalesCount = activeSales.length;
  const avgOrderValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
  const reversedCount = reversedSales.length;

  // ─── Styles ───
  const cardStyle: React.CSSProperties = {
    flex: '1 1 0',
    minWidth: mobile ? '45%' : 180,
  };

  const kpiIconBox = (color: string): React.CSSProperties => ({
    background: `${color}18`,
    color: color,
  });

  const inputCls = 'py-[9px] pr-3 pl-9';

  const pillStyle = (active: boolean, color?: string): React.CSSProperties => ({
    border: active ? `1.5px solid ${color || COLORS.primary}` : `1px solid ${COLORS.border}`,
    background: active ? `${color || COLORS.primary}15` : 'transparent',
    color: active ? color || COLORS.primary : COLORS.textMuted,
  });
  const pillCls = 'px-3.5 py-1.5';

  const thCls = 'px-3.5 py-2.5';

  const tdStyle = (isReversed?: boolean): React.CSSProperties => ({
    borderBottom: `1px solid ${COLORS.border}08`,
    textDecoration: isReversed ? 'line-through' : 'none',
  });
  const tdCls = 'px-3.5 py-3';

  // Payment label helper
  const payLabel = (s: SaleRecord) => {
    if (s.paymentMethod === 'split') return 'Split';
    if (s.paymentMethod === 'momo') return MOMO_LABELS[s.momoProvider || ''] || 'MoMo';
    if (s.paymentMethod === 'card') return s.cardType || 'Card';
    return 'Cash';
  };

  // ─── Render ───
  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6 lg:p-7">
      {/* Header */}
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-2.5 sm:mb-6">
        <div>
          <h1 className="text-text m-0 text-[22px] font-black sm:text-[26px]">Sales</h1>
          <p className="text-text-dim mt-1 text-xs">View and manage all sales transactions</p>
        </div>
        <Button variant="secondary" icon={BarChart3} onClick={() => setPage('salesAnalysis')}>
          Sales & Kitchen Analysis
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="mb-[18px] flex flex-wrap gap-2.5 sm:mb-6 sm:gap-[14px]">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: COLORS.success },
          { label: 'Total Sales', value: String(totalSalesCount), icon: ShoppingCart, color: COLORS.primary },
          { label: 'Avg Order Value', value: formatCurrency(avgOrderValue), icon: TrendingUp, color: COLORS.accent },
          { label: 'Reversed', value: String(reversedCount), icon: RotateCcw, color: COLORS.danger },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="border-border bg-surface relative overflow-hidden rounded-2xl border-[1.5px] p-[14px] sm:p-[18px] lg:p-5"
            style={cardStyle}
          >
            <div
              className="mb-2.5 flex h-[38px] w-[38px] items-center justify-center rounded-xl"
              style={kpiIconBox(kpi.color)}
            >
              <kpi.icon size={18} />
            </div>
            <div className="text-text font-mono text-[18px] leading-none font-black sm:text-[22px]">{kpi.value}</div>
            <div className="form-label mt-1 font-semibold tracking-wide">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Reversals Banner */}
      {canApproveReversal && pendingReversals.length > 0 && (
        <div className="border-warning/[0.25] bg-warning/[0.03] mb-[18px] overflow-hidden rounded-[14px] border-[1.5px]">
          <button
            type="button"
            onClick={() => setShowPendingReversals(!showPendingReversals)}
            className="flex w-full items-center justify-between px-[18px] py-3"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-warning" />
              <span className="text-warning text-[13px] font-bold">
                {pendingReversals.length} Pending Reversal{pendingReversals.length > 1 ? 's' : ''}
              </span>
            </div>
            {showPendingReversals ? (
              <ChevronUp size={16} className="text-warning" />
            ) : (
              <ChevronDown size={16} className="text-warning" />
            )}
          </button>
          {showPendingReversals && (
            <div className="flex flex-col gap-2.5 px-[18px] pb-3.5">
              {pendingReversals.map((s) => (
                <div
                  key={s.id}
                  className="bg-surface border-border flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3"
                >
                  <div className="min-w-[200px] flex-1">
                    <div className="text-text text-xs font-bold">{s.id}</div>
                    <div className="text-text-dim mt-0.5 text-[10px]">
                      {s.customerName} &middot; {formatCurrency(s.total)} &middot; {s.reversalRequestedBy}
                    </div>
                    {s.reversalReason && (
                      <div className="text-text-muted mt-0.5 text-[10px] italic">"{s.reversalReason}"</div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="success"
                      size="sm"
                      icon={Check}
                      onClick={() => executeReversal(s.id, s.reversalReason || '', currentRole)}
                    >
                      Approve
                    </Button>
                    <Button variant="danger" size="sm" icon={X} onClick={() => rejectReversal(s.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div
        className="mb-[18px] flex gap-3"
        style={{
          flexDirection: mobile ? 'column' : 'row',
          alignItems: mobile ? 'stretch' : 'center',
        }}
      >
        {/* Search */}
        <div className="relative flex-1" style={{ maxWidth: mobile ? '100%' : 320 }}>
          <Search size={14} className="text-text-dim absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setTblPage(1);
            }}
            placeholder="Search receipt # or customer..."
            className={`border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] font-[inherit] text-xs outline-none ${inputCls}`}
          />
          {searchQ && (
            <button
              type="button"
              onClick={() => {
                setSearchQ('');
                setTblPage(1);
              }}
              aria-label="Clear search"
              className="text-text-dim absolute top-1/2 right-2.5 -translate-y-1/2"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All'],
              ['completed', 'Completed'],
              ['reversed', 'Reversed'],
              ['pending_reversal', 'Pending'],
            ] as const
          ).map(([val, label]) => (
            <button
              type="button"
              key={val}
              className={`rounded-lg font-[inherit] text-[11px] font-semibold transition-all duration-150 ${pillCls}`}
              onClick={() => {
                setStatusFilter(val);
                setTblPage(1);
              }}
              style={pillStyle(statusFilter === val)}
            >
              {label}
              {val === 'pending_reversal' && pendingReversals.length > 0 && (
                <span className="bg-warning ml-[5px] inline-block min-w-[14px] rounded-md px-[5px] py-px text-center text-[9px] font-extrabold text-white">
                  {pendingReversals.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          className={`rounded-lg font-[inherit] text-[11px] font-semibold transition-all duration-150 ${pillCls}`}
          onClick={() => setShowFilters(!showFilters)}
          style={pillStyle(showFilters, COLORS.accent)}
        >
          <Filter size={12} className="mr-1 align-middle" />
          Filters
        </button>
      </div>

      {/* Extra Filters */}
      {showFilters && (
        <div className="border-border bg-surface mb-[18px] flex flex-wrap gap-3 rounded-[14px] border-[1.5px] px-[18px] py-3.5">
          {/* Payment filter */}
          <div>
            <div className="form-label mb-1.5 tracking-wide">Payment</div>
            <div className="flex flex-wrap gap-1">
              {(['all', 'cash', 'card', 'momo', 'split'] as const).map((v) => (
                <button
                  type="button"
                  key={v}
                  className={`rounded-lg font-[inherit] text-[11px] font-semibold transition-all duration-150 ${pillCls}`}
                  onClick={() => {
                    setPaymentFilter(v);
                    setTblPage(1);
                  }}
                  style={pillStyle(paymentFilter === v)}
                >
                  {v === 'all' ? 'All' : v === 'momo' ? 'MoMo' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Date filter */}
          <div>
            <div className="form-label mb-1.5 tracking-wide">Date Range</div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['all', 'All Time'],
                  ['today', 'Today'],
                  ['week', 'This Week'],
                  ['month', 'This Month'],
                ] as const
              ).map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  className={`rounded-lg font-[inherit] text-[11px] font-semibold transition-all duration-150 ${pillCls}`}
                  onClick={() => {
                    setDateFilter(v);
                    setTblPage(1);
                  }}
                  style={pillStyle(dateFilter === v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {/* Source filter */}
          <div>
            <div className="form-label mb-1.5 tracking-wide">Source</div>
            <div className="flex flex-wrap gap-1">
              {(['all', 'pos', 'bar'] as const).map((v) => (
                <button
                  type="button"
                  key={v}
                  className={`rounded-lg font-[inherit] text-[11px] font-semibold transition-all duration-150 ${pillCls}`}
                  onClick={() => {
                    setSourceFilter(v);
                    setTblPage(1);
                  }}
                  style={pillStyle(sourceFilter === v)}
                >
                  {v === 'all' ? 'All' : v === 'pos' ? 'POS' : 'Bar/Restaurant'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-text-dim mb-3 text-[11px]">
        {filtered.length} sale{filtered.length !== 1 ? 's' : ''} found
        {(searchQ ||
          statusFilter !== 'all' ||
          paymentFilter !== 'all' ||
          dateFilter !== 'all' ||
          sourceFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQ('');
              setStatusFilter('all');
              setPaymentFilter('all');
              setDateFilter('all');
              setSourceFilter('all');
              setTblPage(1);
            }}
            className="text-primary ml-2 border-none bg-transparent font-[inherit] text-[11px] font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* ─── Desktop Table ─── */}
      {!mobile ? (
        <div className="border-border bg-surface overflow-hidden rounded-2xl border-[1.5px]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-alt">
                  <th
                    className={`form-label border-b-border border-b-[1.5px] text-left tracking-[0.5px] whitespace-nowrap ${thCls}`}
                  >
                    Receipt #
                  </th>
                  <th
                    className={`form-label border-b-border border-b-[1.5px] text-left tracking-[0.5px] whitespace-nowrap ${thCls}`}
                  >
                    Date / Time
                  </th>
                  <th
                    className={`form-label border-b-border border-b-[1.5px] text-left tracking-[0.5px] whitespace-nowrap ${thCls}`}
                  >
                    Customer
                  </th>
                  <th
                    className={`form-label border-b-border border-b-[1.5px] text-center tracking-[0.5px] whitespace-nowrap ${thCls}`}
                  >
                    Items
                  </th>
                  <th
                    className={`form-label border-b-border border-b-[1.5px] text-left tracking-[0.5px] whitespace-nowrap ${thCls}`}
                  >
                    Payment
                  </th>
                  <th
                    className={`form-label border-b-border border-b-[1.5px] text-center tracking-[0.5px] whitespace-nowrap ${thCls}`}
                  >
                    Status
                  </th>
                  <th
                    className={`form-label border-b-border border-b-[1.5px] text-right tracking-[0.5px] whitespace-nowrap ${thCls}`}
                  >
                    Total
                  </th>
                  <th
                    className={`form-label border-b-border border-b-[1.5px] text-center tracking-[0.5px] whitespace-nowrap ${thCls}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pag.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-text-dim p-10 text-center text-[13px]">
                      No sales match your filters
                    </td>
                  </tr>
                )}
                {pag.items.map((s) => {
                  const isReversed = s.status === 'reversed';
                  const isExpanded = expandedSale === s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <tr
                        onClick={() => setExpandedSale(isExpanded ? null : s.id)}
                        className="cursor-pointer transition-colors"
                        style={{
                          background: isExpanded ? `${COLORS.primary}06` : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = `${COLORS.primary}04`;
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td
                          className={`align-middle text-xs ${tdCls} ${isReversed ? 'text-text-dim' : 'text-text'}`}
                          style={tdStyle()}
                        >
                          <span
                            className={clsx(
                              'font-mono text-[11px] font-bold',
                              isReversed ? 'text-text-dim' : 'text-primary',
                            )}
                          >
                            {s.id}
                          </span>
                          {s.source === 'bar' && (
                            <span className="bg-warning/[0.08] text-warning ml-1.5 rounded px-1.5 py-px text-[9px] font-bold">
                              BAR
                            </span>
                          )}
                        </td>
                        <td className={`align-middle text-xs ${tdCls}`} style={tdStyle()}>
                          <span className="text-text-muted text-[11px]">{formatDateTime(s.date)}</span>
                        </td>
                        <td className={`align-middle text-xs ${tdCls}`} style={tdStyle()}>
                          <div className="text-xs font-semibold">{s.customerName}</div>
                          {s.customerPhone && <div className="text-text-dim text-[10px]">{s.customerPhone}</div>}
                        </td>
                        <td className={`text-center align-middle text-xs ${tdCls}`} style={tdStyle()}>
                          <span className="text-xs font-semibold">{s.itemCount}</span>
                        </td>
                        <td className={`align-middle text-xs ${tdCls}`} style={tdStyle()}>
                          <span className="text-[11px]">{payLabel(s)}</span>
                        </td>
                        <td className={`text-center align-middle text-xs ${tdCls}`} style={tdStyle()}>
                          <StatusBadge status={s.status} />
                        </td>
                        <td
                          className={`text-right align-middle font-mono text-xs text-[13px] font-bold ${tdCls}`}
                          style={tdStyle(isReversed)}
                        >
                          {formatCurrency(s.total)}
                        </td>
                        <td className={`text-center align-middle text-xs ${tdCls}`} style={tdStyle()}>
                          {s.status !== 'reversed' &&
                            s.status !== 'pending_reversal' &&
                            s.source !== 'bar' &&
                            canInitiateReversal && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReverseSale(s);
                                }}
                                className="bg-danger-bg text-danger border-danger/[0.19] rounded-md border px-2.5 py-1 font-[inherit] text-[10px] font-semibold"
                              >
                                Reverse
                              </button>
                            )}
                          {s.status === 'pending_reversal' && (
                            <span className="text-warning text-[10px] font-semibold">Awaiting</span>
                          )}
                        </td>
                      </tr>
                      {/* Expanded Detail */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-surface-alt p-0">
                            {renderDetailPanel(s)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-3.5">
            <Paginator
              total={pag.total}
              page={pag.page}
              totalPages={pag.totalPages}
              perPage={PER_PAGE}
              start={pag.start}
              onPage={setTblPage}
            />
          </div>
        </div>
      ) : (
        /* ─── Mobile Cards ─── */
        <div className="flex flex-col gap-2.5">
          {pag.items.length === 0 && (
            <div className="border-border text-text-dim bg-surface rounded-[14px] border-[1.5px] p-10 text-center text-[13px]">
              No sales match your filters
            </div>
          )}
          {pag.items.map((s) => {
            const isReversed = s.status === 'reversed';
            const isExpanded = expandedSale === s.id;
            return (
              <div
                key={s.id}
                className="bg-surface overflow-hidden rounded-[14px] transition-colors"
                style={{
                  border: `1.5px solid ${isExpanded ? COLORS.primary + '40' : COLORS.border}`,
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedSale(isExpanded ? null : s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedSale(isExpanded ? null : s.id);
                    }
                  }}
                  className="cursor-pointer px-4 py-3.5"
                >
                  {/* Top row: receipt # + status + total */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'font-mono text-[11px] font-bold',
                          isReversed ? 'text-text-dim' : 'text-primary',
                        )}
                      >
                        {s.id}
                      </span>
                      {s.source === 'bar' && (
                        <span className="bg-warning/[0.08] text-warning rounded px-1.5 py-px text-[9px] font-bold">
                          BAR
                        </span>
                      )}
                      <StatusBadge status={s.status} />
                    </div>
                    <span
                      className={clsx(
                        'font-mono text-sm font-extrabold',
                        isReversed ? 'text-text-dim line-through' : 'text-text',
                      )}
                    >
                      {formatCurrency(s.total)}
                    </span>
                  </div>
                  {/* Details row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-text text-xs font-semibold">{s.customerName}</div>
                      <div className="text-text-dim mt-0.5 text-[10px]">
                        {s.itemCount} item{s.itemCount > 1 ? 's' : ''} &middot; {payLabel(s)} &middot;{' '}
                        {formatDateTime(s.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {s.status !== 'reversed' &&
                        s.status !== 'pending_reversal' &&
                        s.source !== 'bar' &&
                        canInitiateReversal && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReverseSale(s);
                            }}
                            className="bg-danger-bg text-danger border-danger/[0.19] rounded-md border px-2 py-1 font-[inherit] text-[10px] font-semibold"
                          >
                            <RotateCcw size={10} className="mr-[3px] align-middle" />
                            Rev
                          </button>
                        )}
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-text-dim" />
                      ) : (
                        <ChevronDown size={14} className="text-text-dim" />
                      )}
                    </div>
                  </div>
                </div>
                {isExpanded && <div className="border-border border-t">{renderDetailPanel(s)}</div>}
              </div>
            );
          })}
          <Paginator
            total={pag.total}
            page={pag.page}
            totalPages={pag.totalPages}
            perPage={PER_PAGE}
            start={pag.start}
            onPage={setTblPage}
          />
        </div>
      )}

      {/* ─── Reversal Confirmation Modal ─── */}
      {showReversalModal && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-5"
          style={{
            animation: 'modalIn 0.2s ease',
          }}
        >
          <div
            className="border-border bg-surface w-full max-w-[440px] overflow-hidden rounded-[18px] border-[1.5px]"
            style={{
              boxShadow: `0 20px 60px rgba(0,0,0,0.25)`,
            }}
          >
            {/* Header */}
            <div className="border-border flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="bg-danger-bg flex h-[34px] w-[34px] items-center justify-center rounded-[10px]">
                  <RotateCcw size={16} className="text-danger" />
                </span>
                <span className="text-text text-[15px] font-extrabold">
                  {canApproveReversal ? 'Reverse Sale' : 'Request Reversal'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowReversalModal(null)}
                aria-label="Close"
                className="text-text-dim"
              >
                <X size={18} />
              </button>
            </div>
            {/* Sale Summary */}
            <div className="border-border bg-surface-alt border-b px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-text text-[13px] font-bold">{showReversalModal.customerName}</div>
                  <div className="text-text-dim mt-0.5 text-[10px]">
                    {showReversalModal.id} &middot; {showReversalModal.itemCount} items &middot;{' '}
                    {showReversalModal.payLabel}
                  </div>
                  <div className="text-text-dim text-[10px]">{formatDateTime(showReversalModal.date)}</div>
                </div>
                <div className="text-danger font-mono text-xl font-black">
                  {formatCurrency(showReversalModal.total)}
                </div>
              </div>
            </div>
            {/* Reason */}
            <div className="px-5 py-4">
              <div className="text-text-muted mb-1.5 text-[11px] font-bold tracking-wide uppercase">
                Reason for reversal *
              </div>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g., Customer returned items, wrong product sold, pricing error..."
                rows={3}
                className="border-border bg-surface-alt text-text box-border w-full resize-y rounded-[10px] border-[1.5px] px-3 py-2.5 font-[inherit] text-xs outline-none"
              />
              {!canApproveReversal && (
                <div className="text-warning border-warning/[0.19] bg-warning/[0.07] mt-2.5 flex items-center gap-2 rounded-[10px] border px-3 py-2.5 text-[11px]">
                  <Clock size={14} className="shrink-0" />
                  <span>As a {currentRole}, this reversal will require approval from a Manager or Owner.</span>
                </div>
              )}
            </div>
            {/* Actions */}
            <div className="border-border flex justify-end gap-2 border-t px-5 py-3">
              <Button variant="ghost" onClick={() => setShowReversalModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={canApproveReversal ? RotateCcw : Clock}
                onClick={confirmReversal}
                disabled={!reversalReason.trim()}
              >
                {canApproveReversal ? 'Reverse Sale' : 'Submit for Approval'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Detail Panel (shared between desktop & mobile) ───
  function renderDetailPanel(s: SaleRecord) {
    const isReversed = s.status === 'reversed';
    const isPending = s.status === 'pending_reversal';

    return (
      <div className="p-[14px] sm:p-5">
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 sm:gap-[18px] lg:grid-cols-3">
          {/* Items Section */}
          <div>
            <div className="form-label mb-2 tracking-wide">Items ({s.itemCount})</div>
            <div className="border-border overflow-hidden rounded-[10px] border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg">
                    <th className="text-text-dim px-2.5 py-1.5 text-left text-[9px] font-bold uppercase">Product</th>
                    <th className="text-text-dim px-2.5 py-1.5 text-center text-[9px] font-bold uppercase">Qty</th>
                    <th className="text-text-dim px-2.5 py-1.5 text-right text-[9px] font-bold uppercase">Price</th>
                    <th className="text-text-dim px-2.5 py-1.5 text-right text-[9px] font-bold uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {s.items.map((item, i) => (
                    <tr key={i} className="border-t-border/[0.03] border-t">
                      <td className="text-text px-2.5 py-1.5 text-[11px]">{item.name}</td>
                      <td className="text-text-muted px-2.5 py-1.5 text-center text-[11px]">{item.qty}</td>
                      <td className="text-text-muted px-2.5 py-1.5 text-right font-mono text-[11px]">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="text-text px-2.5 py-1.5 text-right font-mono text-[11px] font-semibold">
                        {formatCurrency(item.qty * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financials Section */}
          <div>
            <div className="form-label mb-2 tracking-wide">Financials</div>
            <div className="border-border bg-bg rounded-[10px] border p-3">
              {[
                ['Subtotal', formatCurrency(s.subtotal)],
                ['Tax', formatCurrency(s.tax)],
                ...(s.discount > 0
                  ? [
                      [
                        'Discount',
                        `- ${formatCurrency(s.discount)}${s.discountType === 'percent' && s.discountInput ? ` (${s.discountInput}%)` : ''}`,
                      ],
                    ]
                  : []),
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-1 text-[11px]">
                  <span className="text-text-muted">{label}</span>
                  <span className="text-text font-mono">{val}</span>
                </div>
              ))}
              <div className="border-t-border mt-1.5 flex justify-between border-t-[1.5px] pt-2 text-[13px] font-extrabold">
                <span className="text-text">Total</span>
                <span className={clsx('font-mono', isReversed ? 'text-danger line-through' : 'text-text')}>
                  {formatCurrency(s.total)}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="form-label mt-3.5 mb-2 tracking-wide">Payment Details</div>
            <div className="border-border bg-bg rounded-[10px] border p-3">
              <div className="text-text mb-1.5 text-[11px] font-semibold">{s.payLabel}</div>
              {s.paymentMethod === 'cash' && s.amountTendered != null && (
                <>
                  <div className="flex justify-between py-0.5 text-[11px]">
                    <span className="text-text-muted">Tendered</span>
                    <span className="text-text font-mono">{formatCurrency(s.amountTendered)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-[11px]">
                    <span className="text-text-muted">Change</span>
                    <span className="text-success font-mono">{formatCurrency(s.change || 0)}</span>
                  </div>
                </>
              )}
              {s.paymentMethod === 'card' && (
                <>
                  {s.cardType && <div className="text-text-muted py-0.5 text-[11px]">Type: {s.cardType}</div>}
                  {s.cardTransNo && <div className="text-text-muted py-0.5 text-[11px]">Trans #: {s.cardTransNo}</div>}
                </>
              )}
              {s.paymentMethod === 'momo' && (
                <>
                  {s.momoProvider && (
                    <div className="text-text-muted py-0.5 text-[11px]">
                      Provider: {MOMO_LABELS[s.momoProvider] || s.momoProvider}
                    </div>
                  )}
                  {s.momoPhone && <div className="text-text-muted py-0.5 text-[11px]">Phone: {s.momoPhone}</div>}
                  {s.momoRef && <div className="text-text-muted py-0.5 text-[11px]">Ref: {s.momoRef}</div>}
                </>
              )}
              {s.paymentMethod === 'split' && s.splits && (
                <div className="flex flex-col gap-1">
                  {s.splits.map((sp, i) => (
                    <div
                      key={i}
                      className={`flex justify-between py-0.5 text-[11px] ${i > 0 ? 'border-t-border/[0.03] border-t' : ''}`}
                    >
                      <span className="text-text-muted">
                        {sp.label}
                        {sp.detail ? ` (${sp.detail})` : ''}
                      </span>
                      <span className="text-text font-mono">{formatCurrency(sp.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reversal Info Section (if applicable) */}
          {(isReversed || isPending) && (
            <div>
              <div className="form-label mb-2 tracking-wide">Reversal Info</div>
              <div
                className="rounded-[10px] p-3"
                style={{
                  border: `1px solid ${isReversed ? COLORS.danger : COLORS.warning}30`,
                  background: isReversed ? `${COLORS.danger}06` : `${COLORS.warning}06`,
                }}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <StatusBadge status={s.status} />
                </div>
                {s.reversalReason && (
                  <div className="text-text mb-1.5 text-[11px]">
                    <span className="font-semibold">Reason:</span> {s.reversalReason}
                  </div>
                )}
                {isReversed && s.reversedBy && (
                  <div className="text-text-dim text-[10px]">
                    Reversed by <span className="text-text-muted font-semibold">{s.reversedBy}</span>
                    {s.reversedAt && <> on {formatDateTime(s.reversedAt)}</>}
                  </div>
                )}
                {isPending && s.reversalRequestedBy && (
                  <div className="text-text-dim text-[10px]">
                    Requested by <span className="text-text-muted font-semibold">{s.reversalRequestedBy}</span>
                    {s.reversalRequestedAt && <> on {formatDateTime(s.reversalRequestedAt)}</>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cashier / Meta */}
        <div className="text-text-dim mt-3 flex flex-wrap gap-3.5 text-[10px]">
          <span>
            Cashier: <span className="text-text-muted font-semibold">{s.cashier}</span>
          </span>
          {s.customerId && (
            <span>
              Customer ID: <span className="text-text-muted font-mono">{s.customerId}</span>
            </span>
          )}
        </div>
      </div>
    );
  }
};
