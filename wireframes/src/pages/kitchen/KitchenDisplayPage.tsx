import React, { useState, useEffect, useMemo } from 'react';
import {
  ChefHat,
  Clock,
  Check,
  X,
  AlertCircle,
  UtensilsCrossed,
  ShoppingBag,
  Bell,
  Filter,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { useColors, useKitchenOrders, useAuth } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isSmall } from '@/utils/responsive';
import { Button } from '@/components/ui';
import { clsx } from 'clsx';
import type { KitchenOrder, KitchenOrderStatus } from '@/types';

// ─── Date filter helper ───

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ─── Quick reject reasons ───
const QUICK_REJECT_REASONS = ['Out of stock', 'Item unavailable today', 'Kitchen at capacity', 'Ingredient shortage'];

type FilterTab = 'all' | 'pending' | 'accepted' | 'completed' | 'rejected' | 'served' | 'returned' | 'cancelled';

// ─── Time ago helper ───
function timeAgo(isoDate: string): { text: string; minutes: number } {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return { text: 'Just now', minutes: 0 };
  if (mins < 60) return { text: `${mins}m ago`, minutes: mins };
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return { text: `${hrs}h ${remainMins}m ago`, minutes: mins };
}

// ─── KitchenDisplayPage ───

export const KitchenDisplayPage: React.FC = () => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { activeShop } = useAuth();
  const { orders, acceptOrder, rejectOrder, completeOrder } = useKitchenOrders();

  const small = isSmall(bp);

  // ─── State ───
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [rejectingOrder, setRejectingOrder] = useState<KitchenOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [, setTick] = useState(0);

  // Tick every 30s for live time-ago updates
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders to today only (daily fresh start)
  const todayOrders = useMemo(() => orders.filter((o) => isToday(o.createdAt)), [orders]);

  // ─── Filtered & sorted orders ───
  // Exclude bar-fulfilled orders (drinks served directly from bar)
  const kitchenOrders = useMemo(() => todayOrders.filter((o) => !o.barFulfilled), [todayOrders]);

  const filteredOrders = useMemo(() => {
    let list = [...kitchenOrders];
    if (activeFilter !== 'all') {
      list = list.filter((o) => o.status === activeFilter);
    }
    // Sort: pending first (oldest first), then accepted (oldest first), then completed/rejected (newest first)
    list.sort((a, b) => {
      const priority: Record<KitchenOrderStatus, number> = {
        pending: 0,
        accepted: 1,
        completed: 2,
        served: 3,
        returned: 4,
        rejected: 5,
        cancelled: 6,
      };
      const pDiff = priority[a.status] - priority[b.status];
      if (pDiff !== 0) return pDiff;
      if (a.status === 'completed' || a.status === 'rejected' || a.status === 'served' || a.status === 'returned') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return list;
  }, [kitchenOrders, activeFilter]);

  // ─── Counts for filter badges ───
  const counts = useMemo(
    () => ({
      all: kitchenOrders.length,
      pending: kitchenOrders.filter((o) => o.status === 'pending').length,
      accepted: kitchenOrders.filter((o) => o.status === 'accepted').length,
      completed: kitchenOrders.filter((o) => o.status === 'completed').length,
      rejected: kitchenOrders.filter((o) => o.status === 'rejected').length,
      served: kitchenOrders.filter((o) => o.status === 'served').length,
      returned: kitchenOrders.filter((o) => o.status === 'returned').length,
      cancelled: kitchenOrders.filter((o) => o.status === 'cancelled').length,
    }),
    [kitchenOrders],
  );

  // ─── Handle reject ───
  const handleReject = () => {
    if (!rejectingOrder || !rejectReason.trim()) return;
    rejectOrder(rejectingOrder.id, rejectReason.trim());
    setRejectingOrder(null);
    setRejectReason('');
  };

  // ─── Filter tabs config ───
  const filterTabs: { id: FilterTab; label: string; color: string }[] = [
    { id: 'all', label: 'All', color: COLORS.text },
    { id: 'pending', label: 'Pending', color: COLORS.warning },
    { id: 'accepted', label: 'Preparing', color: COLORS.primary },
    { id: 'completed', label: 'Ready', color: COLORS.success },
    { id: 'served', label: 'Served', color: COLORS.success },
    { id: 'returned', label: 'Returned', color: COLORS.danger },
    { id: 'rejected', label: 'Rejected', color: COLORS.danger },
    { id: 'cancelled', label: 'Cancelled', color: COLORS.danger },
  ];

  // ─── Status styling ───
  const getStatusStyle = (status: KitchenOrderStatus) => {
    const map: Record<KitchenOrderStatus, { bg: string; text: string; border: string; label: string }> = {
      pending: { bg: COLORS.warningBg, text: COLORS.warning, border: COLORS.warning, label: 'Pending' },
      accepted: { bg: COLORS.primaryBg, text: COLORS.primary, border: COLORS.primary, label: 'Preparing' },
      completed: { bg: COLORS.successBg, text: COLORS.success, border: COLORS.success, label: 'Ready for Pickup' },
      served: { bg: COLORS.successBg, text: COLORS.success, border: COLORS.success, label: 'Served' },
      returned: { bg: COLORS.dangerBg, text: COLORS.danger, border: COLORS.danger, label: 'Returned' },
      rejected: { bg: COLORS.dangerBg, text: COLORS.danger, border: COLORS.danger, label: 'Rejected' },
      cancelled: { bg: COLORS.dangerBg, text: COLORS.danger, border: COLORS.danger, label: 'Cancelled' },
    };
    return map[status];
  };

  // ─── Empty state ───
  if (kitchenOrders.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-5 p-10">
        <div
          className="flex size-[72px] items-center justify-center rounded-[20px]"
          style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` }}
        >
          <ChefHat size={36} className="text-white" />
        </div>
        <div className="text-center">
          <div className="text-text mb-2 text-[22px] font-extrabold">
            {activeShop?.name ? `${activeShop.name} Kitchen` : 'Kitchen Display'}
          </div>
          <div className="text-text-dim max-w-[360px] text-sm">
            No orders yet. Orders sent from the Bar & Restaurant POS will appear here in real time.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ─── Top Bar ─── */}
      <div
        className="border-border bg-surface flex flex-wrap items-center gap-3 border-b"
        style={{ padding: small ? '10px 12px' : '12px 20px' }}
      >
        <div className="flex items-center gap-2">
          <ChefHat size={20} className="text-accent shrink-0" />
          <span className="text-text text-base font-bold whitespace-nowrap">
            {activeShop?.name ? `${activeShop.name} Kitchen` : 'Kitchen Display'}
          </span>
          {counts.pending > 0 && (
            <span
              className="rounded-[10px] px-2 py-0.5 text-[11px] font-bold text-white"
              style={{
                background: COLORS.warning,
                animation: 'kitchenPulse 2s infinite',
              }}
            >
              {counts.pending} new
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 font-[inherit] text-[11px] font-semibold whitespace-nowrap"
              style={{
                border: `1.5px solid ${activeFilter === tab.id ? tab.color : COLORS.border}`,
                background: activeFilter === tab.id ? tab.color + '15' : 'transparent',
                color: activeFilter === tab.id ? tab.color : COLORS.textMuted,
              }}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span
                  className="rounded-lg px-[5px] py-0 text-[9px] font-bold text-white"
                  style={{
                    background: activeFilter === tab.id ? tab.color : COLORS.textDim,
                  }}
                >
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Order Grid ─── */}
      <div className="flex-1 overflow-auto" style={{ padding: small ? 12 : 20 }}>
        {filteredOrders.length === 0 ? (
          <div className="text-text-dim p-[60px] text-center">
            <Filter size={24} className="mx-auto mb-2 opacity-40" />
            <div className="text-[13px]">No orders in this category</div>
          </div>
        ) : (
          <div className="xl2:grid-cols-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4">
            {filteredOrders.map((order) => {
              const ss = getStatusStyle(order.status);
              const ta = timeAgo(order.createdAt);
              const isUrgent = order.status === 'pending' && ta.minutes >= 10;
              const isWarning = order.status === 'pending' && ta.minutes >= 5 && ta.minutes < 10;

              return (
                <div
                  key={order.id}
                  className={clsx(
                    'bg-surface overflow-hidden rounded-[14px] transition-all duration-200',
                    (order.status === 'rejected' ||
                      order.status === 'served' ||
                      order.status === 'returned' ||
                      order.status === 'cancelled') &&
                      'opacity-65',
                  )}
                  style={{
                    border: `2px solid ${isUrgent ? COLORS.danger : isWarning ? COLORS.warning : ss.border + '40'}`,
                    ...(order.status === 'pending' ? { animation: 'fadeIn 0.3s ease' } : {}),
                  }}
                >
                  {/* Order header */}
                  <div
                    className="border-border flex items-center justify-between border-b px-3.5 py-3"
                    style={{ background: ss.bg }}
                  >
                    <div>
                      <div className="text-text text-[13px] font-bold">{order.id}</div>
                      <div className="text-text-muted mt-0.5 text-[11px]">
                        {order.tillName}
                        {order.serverName ? ` — ${order.serverName}` : ''}
                      </div>
                    </div>
                    <span
                      className="rounded-lg px-2.5 py-[3px] text-[10px] font-bold tracking-wide uppercase"
                      style={{
                        background: ss.text + '20',
                        color: ss.text,
                      }}
                    >
                      {ss.label}
                    </span>
                  </div>

                  {/* Order meta */}
                  <div className="border-border flex flex-wrap gap-2 border-b px-3.5 py-2.5">
                    {/* Time ago */}
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold"
                      style={{ color: isUrgent ? COLORS.danger : isWarning ? COLORS.warning : COLORS.textMuted }}
                    >
                      <Clock size={12} /> {ta.text}
                    </span>
                    {/* Order type */}
                    <span className="text-text-muted inline-flex items-center gap-1 text-[11px] font-semibold">
                      {order.orderType === 'dine_in' ? (
                        <>
                          <UtensilsCrossed size={12} /> Dine-in
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={12} /> Takeaway
                        </>
                      )}
                    </span>
                    {/* Table */}
                    {order.table && (
                      <span className="text-accent inline-flex items-center gap-1 text-[11px] font-semibold">
                        {order.table}
                      </span>
                    )}
                  </div>

                  {/* Items list — NO PRICES */}
                  <div className="px-3.5 py-2.5">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 py-1.5"
                        style={{
                          borderBottom: idx < order.items.length - 1 ? `1px dashed ${COLORS.border}` : 'none',
                        }}
                      >
                        <span className="text-primary min-w-[28px] text-right text-[13px] font-bold">{item.qty}x</span>
                        <div className="flex-1">
                          <div
                            className={clsx(
                              'text-text text-[13px] font-semibold',
                              order.status === 'cancelled' && 'line-through',
                            )}
                          >
                            {item.name}
                          </div>
                          {item.notes && <div className="text-accent mt-0.5 text-[11px] italic">{item.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rejection reason */}
                  {order.status === 'rejected' && order.rejectionReason && (
                    <div className="bg-danger-bg mx-3.5 mb-2.5 flex items-start gap-1.5 rounded-lg px-2.5 py-2">
                      <AlertCircle size={14} className="text-danger mt-px shrink-0" />
                      <span className="text-danger text-[11px] font-medium">{order.rejectionReason}</span>
                    </div>
                  )}

                  {/* Completion time */}
                  {order.status === 'completed' && order.completedAt && (
                    <div className="bg-success-bg text-success mx-3.5 mb-2.5 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold">
                      <Check size={12} /> Completed at {new Date(order.completedAt).toLocaleTimeString()}
                    </div>
                  )}

                  {/* Served time */}
                  {order.status === 'served' && order.servedAt && (
                    <div className="bg-success-bg text-success mx-3.5 mb-2.5 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold">
                      <CheckCircle size={12} /> Served at {new Date(order.servedAt).toLocaleTimeString()}
                    </div>
                  )}

                  {/* Return reason */}
                  {order.status === 'returned' && order.returnReason && (
                    <div className="bg-danger-bg mx-3.5 mb-2.5 flex items-start gap-1.5 rounded-lg px-2.5 py-2">
                      <RotateCcw size={14} className="text-danger mt-px shrink-0" />
                      <span className="text-danger text-[11px] font-medium">{order.returnReason}</span>
                    </div>
                  )}

                  {/* Cancelled info */}
                  {order.status === 'cancelled' && (
                    <div className="bg-danger-bg text-danger mx-3.5 mb-2.5 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold">
                      <X size={12} /> Cancelled{order.cancelledBy ? ` by ${order.cancelledBy}` : ''}
                      {order.cancelledAt ? ` at ${new Date(order.cancelledAt).toLocaleTimeString()}` : ''}
                    </div>
                  )}

                  {/* Action buttons */}
                  {(order.status === 'pending' || order.status === 'accepted') && (
                    <div className="border-border flex gap-2 border-t px-3.5 py-2.5">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            icon={Check}
                            size="sm"
                            onClick={() => acceptOrder(order.id)}
                            className="flex-1 justify-center"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            icon={X}
                            size="sm"
                            onClick={() => {
                              setRejectingOrder(order);
                              setRejectReason('');
                            }}
                            className="flex-1 justify-center"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {order.status === 'accepted' && (
                        <Button
                          variant="success"
                          icon={Bell}
                          size="sm"
                          onClick={() => completeOrder(order.id)}
                          className="flex-1 justify-center px-4 py-2.5"
                        >
                          Ready for Pickup
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Reject Modal ─── */}
      {rejectingOrder && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-5"
          onClick={() => setRejectingOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-border w-full max-w-[440px] rounded-2xl border p-6"
            style={{ animation: 'modalIn 0.2s ease' }}
          >
            <div className="text-text mb-1 text-lg font-bold">Reject Order</div>
            <div className="text-text-dim mb-1.5 text-xs">
              Order {rejectingOrder.id} from {rejectingOrder.tillName}
            </div>
            <div className="text-text-muted mb-4 text-xs">
              {rejectingOrder.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
            </div>

            {/* Quick reasons */}
            <div className="mb-3">
              <div className="text-text-muted mb-1.5 text-[11px] font-semibold tracking-wide uppercase">
                Quick Reasons
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REJECT_REASONS.map((reason) => (
                  <button
                    type="button"
                    key={reason}
                    onClick={() => setRejectReason(reason)}
                    className="rounded-[20px] px-3 py-[5px] font-[inherit] text-[11px] font-semibold"
                    style={{
                      border: `1px solid ${rejectReason === reason ? COLORS.danger : COLORS.border}`,
                      background: rejectReason === reason ? COLORS.dangerBg : 'transparent',
                      color: rejectReason === reason ? COLORS.danger : COLORS.textMuted,
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom reason */}
            <div className="mb-4">
              <div className="text-text-muted mb-1.5 text-[11px] font-semibold tracking-wide uppercase">Reason</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                className="bg-surface-alt text-text border-border box-border w-full resize-y rounded-[10px] border-[1.5px] px-3 py-2.5 font-[inherit] text-[13px] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejectingOrder(null)}>
                Cancel
              </Button>
              <Button variant="danger" icon={X} onClick={handleReject} disabled={!rejectReason.trim()}>
                Reject Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
