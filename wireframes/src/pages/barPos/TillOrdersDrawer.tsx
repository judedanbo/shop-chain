import React, { useState } from 'react';
import { X, Clock, AlertCircle, Pause, Play, Trash2, CheckCircle, RotateCcw, Ban } from 'lucide-react';
import { useColors, useKitchenOrders, useAuth } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isSmall } from '@/utils/responsive';
import { Button, Card } from '@/components/ui';
import type { KitchenOrder, Till, HeldOrder } from '@/types';

// ─── Order History ───

interface TillOrdersDrawerProps {
  till: Till;
  orders: KitchenOrder[];
  onClose: () => void;
}

const QUICK_RETURN_REASONS = ['Wrong order', 'Customer complaint', 'Food quality issue', 'Customer left'];

export const TillOrdersDrawer: React.FC<TillOrdersDrawerProps> = ({ till, orders, onClose }) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const small = isSmall(bp);
  const { serveOrder, returnOrder, cancelOrder, serveOrderItem } = useKitchenOrders();
  const { user } = useAuth();
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  const handleReturn = () => {
    if (!returningOrderId || !returnReason.trim()) return;
    returnOrder(returningOrderId, returnReason.trim());
    setReturningOrderId(null);
    setReturnReason('');
  };

  return (
    <div aria-hidden="true" className="z-modal-backdrop fixed inset-0 flex justify-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border-border flex h-full flex-col overflow-hidden border-l"
        style={{ width: small ? '100%' : 420 }}
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="text-text text-base font-bold">{till.name} — Orders</div>
            <div className="text-text-dim text-[11px]">Opened {new Date(till.openedAt).toLocaleTimeString()}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted border-none bg-none p-1"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {orders.length === 0 ? (
            <div className="text-text-dim p-10 text-center">
              <Clock size={24} className="mx-auto mb-2 opacity-40" />
              <div className="text-[13px]">No orders yet</div>
            </div>
          ) : (
            orders.map((order) => {
              const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                pending: { bg: COLORS.warningBg, text: COLORS.warning, label: 'Pending' },
                accepted: { bg: COLORS.primaryBg, text: COLORS.primary, label: 'Preparing' },
                completed: { bg: COLORS.successBg, text: COLORS.success, label: 'Ready' },
                rejected: { bg: COLORS.dangerBg, text: COLORS.danger, label: 'Rejected' },
                served: { bg: COLORS.successBg, text: COLORS.success, label: 'Served' },
                returned: { bg: COLORS.dangerBg, text: COLORS.danger, label: 'Returned' },
                cancelled: { bg: COLORS.dangerBg, text: COLORS.danger, label: 'Cancelled' },
              };
              const sc = statusColors[order.status] ?? statusColors['pending']!;
              return (
                <Card key={order.id} className="mb-2.5 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-text text-xs font-bold">{order.id}</span>
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {sc.label}
                    </span>
                  </div>
                  {order.table && (
                    <div className="text-text-muted mb-1 text-[11px]">
                      {order.table} | {order.orderType === 'dine_in' ? 'Dine-in' : 'Takeaway'}
                    </div>
                  )}
                  <div className="text-[11px]">
                    {[...order.items]
                      .sort((a, b) => {
                        if (a.itemStatus === 'served' && b.itemStatus !== 'served') return -1;
                        if (a.itemStatus !== 'served' && b.itemStatus === 'served') return 1;
                        return 0;
                      })
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-[3px]"
                          style={{
                            borderBottom: idx < order.items.length - 1 ? `1px dashed ${COLORS.border}` : 'none',
                            opacity: item.itemStatus === 'served' ? 0.7 : 1,
                          }}
                        >
                          <span
                            style={{
                              color: item.itemStatus === 'served' ? COLORS.success : COLORS.textDim,
                              textDecoration: order.status === 'cancelled' ? 'line-through' : 'none',
                            }}
                          >
                            {item.qty}x {item.name}
                          </span>
                          {item.itemStatus === 'served' ? (
                            <span className="text-success bg-success-bg rounded px-1.5 py-px text-[9px] font-semibold">
                              Served
                            </span>
                          ) : order.status === 'completed' || order.status === 'served' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                serveOrderItem(order.id, item.productId);
                              }}
                              className="text-primary bg-primary-bg border-primary/[0.19] rounded border px-2 py-0.5 font-[inherit] text-[9px] font-semibold"
                            >
                              Serve
                            </button>
                          ) : null}
                        </div>
                      ))}
                  </div>
                  {order.total != null && (
                    <div className="text-primary mt-1.5 text-xs font-bold">GH₵ {order.total.toFixed(2)}</div>
                  )}
                  {order.rejectionReason && (
                    <div className="bg-danger-bg text-danger mt-1.5 rounded-lg px-2.5 py-1.5 text-[11px]">
                      <AlertCircle size={10} className="mr-1 inline" /> {order.rejectionReason}
                    </div>
                  )}
                  {order.returnReason && (
                    <div className="bg-danger-bg text-danger mt-1.5 rounded-lg px-2.5 py-1.5 text-[11px]">
                      <RotateCcw size={10} className="mr-1 inline" /> {order.returnReason}
                    </div>
                  )}
                  {order.status === 'cancelled' && order.cancelledBy && (
                    <div className="bg-danger-bg text-danger mt-1.5 rounded-lg px-2.5 py-1.5 text-[11px]">
                      <Ban size={10} className="mr-1 inline" /> Cancelled by {order.cancelledBy}
                    </div>
                  )}
                  <div className="text-text-dim mt-1.5 text-[10px]">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </div>

                  {/* Waiter action buttons for completed orders */}
                  {order.status === 'completed' && (
                    <div className="mt-2.5 flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        icon={CheckCircle}
                        onClick={() => serveOrder(order.id)}
                        className="flex-1 justify-center"
                      >
                        Mark Served
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={RotateCcw}
                        onClick={() => {
                          setReturningOrderId(order.id);
                          setReturnReason('');
                        }}
                        className="flex-1 justify-center"
                      >
                        Return
                      </Button>
                    </div>
                  )}
                  {order.status === 'pending' && (
                    <div className="mt-2.5 flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Ban}
                        onClick={() => cancelOrder(order.id, user?.name ?? 'Staff')}
                        className="flex-1 justify-center"
                      >
                        Cancel Order
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Return reason modal */}
      {returningOrderId && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-5"
          onClick={() => setReturningOrderId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-border w-full max-w-[440px] rounded-2xl border p-6"
          >
            <div className="text-text mb-1 text-lg font-bold">Return Order</div>
            <div className="text-text-dim mb-4 text-xs">Order {returningOrderId}</div>

            {/* Quick reasons */}
            <div className="mb-3">
              <div className="text-text-muted mb-1.5 text-[11px] font-semibold tracking-[0.5px] uppercase">
                Quick Reasons
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_RETURN_REASONS.map((reason) => (
                  <button
                    type="button"
                    key={reason}
                    onClick={() => setReturnReason(reason)}
                    className="rounded-[20px] px-3 py-[5px] font-[inherit] text-[11px] font-semibold"
                    style={{
                      border: `1px solid ${returnReason === reason ? COLORS.danger : COLORS.border}`,
                      background: returnReason === reason ? COLORS.dangerBg : 'transparent',
                      color: returnReason === reason ? COLORS.danger : COLORS.textMuted,
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom reason */}
            <div className="mb-4">
              <div className="text-text-muted mb-1.5 text-[11px] font-semibold tracking-[0.5px] uppercase">Reason</div>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Enter return reason..."
                rows={3}
                className="border-border bg-surface-alt text-text box-border w-full resize-y rounded-[10px] border-[1.5px] px-3 py-2.5 font-[inherit] text-[13px] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReturningOrderId(null)}>
                Cancel
              </Button>
              <Button variant="danger" icon={RotateCcw} onClick={handleReturn} disabled={!returnReason.trim()}>
                Return Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Held Orders ───

interface HeldOrdersDrawerProps {
  till: Till;
  heldOrders: HeldOrder[];
  onResume: (id: string) => void;
  onDiscard: (id: string) => void;
  onClose: () => void;
}

export const HeldOrdersDrawer: React.FC<HeldOrdersDrawerProps> = ({
  till,
  heldOrders,
  onResume,
  onDiscard,
  onClose,
}) => {
  const bp = useBreakpoint();
  const small = isSmall(bp);

  return (
    <div aria-hidden="true" className="z-modal-backdrop fixed inset-0 flex justify-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border-border flex h-full flex-col overflow-hidden border-l"
        style={{ width: small ? '100%' : 420 }}
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="text-text text-base font-bold">{till.name} — Held Orders</div>
            <div className="text-text-dim text-[11px]">
              {heldOrders.length} held order{heldOrders.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted border-none bg-none p-1"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {heldOrders.length === 0 ? (
            <div className="text-text-dim p-10 text-center">
              <Pause size={24} className="mx-auto mb-2 opacity-40" />
              <div className="text-[13px]">No held orders</div>
            </div>
          ) : (
            heldOrders.map((held) => {
              const heldTotal = held.items.reduce((s, i) => s + i.price * i.qty, 0);
              const heldItemCount = held.items.reduce((s, i) => s + i.qty, 0);
              return (
                <Card key={held.id} className="mb-2.5 p-3.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-text text-xs font-bold">{held.label || held.id}</span>
                    <span className="bg-warning-bg text-warning rounded-md px-2 py-0.5 text-[10px] font-semibold">
                      Held
                    </span>
                  </div>
                  {held.table && (
                    <div className="text-text-muted mb-1 text-[11px]">
                      {held.table} | {held.orderType === 'dine_in' ? 'Dine-in' : 'Takeaway'}
                    </div>
                  )}
                  <div className="text-text-dim text-[11px]">
                    {held.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-primary text-xs font-bold">GH₵ {heldTotal.toFixed(2)}</span>
                      <span className="text-text-dim ml-2 text-[10px]">
                        {heldItemCount} item{heldItemCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-text-dim text-[10px]">{new Date(held.heldAt).toLocaleTimeString()}</div>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Play}
                      onClick={() => onResume(held.id)}
                      className="flex-1 justify-center"
                    >
                      Resume
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => onDiscard(held.id)}
                      className="flex-none"
                    >
                      Discard
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
