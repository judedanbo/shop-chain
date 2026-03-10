import React from 'react';
import { CheckCircle, RotateCcw, AlertCircle, Ban } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import type { KitchenOrder, KitchenOrderItem, Till, ThemeColors } from '@/types';
import { getStatusStyle } from './TillManagementPage';

interface TillOrderCardProps {
  order: KitchenOrder;
  isPaid: boolean;
  selectedTill: Till | null;
  COLORS: ThemeColors;
  onServeOrder: (orderId: string) => void;
  onServeOrderItem: (orderId: string, productId: string) => void;
  onReturnOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string, userName: string) => void;
  userName: string;
}

export const TillOrderCard: React.FC<TillOrderCardProps> = ({
  order,
  isPaid,
  selectedTill,
  COLORS,
  onServeOrder,
  onServeOrderItem,
  onReturnOrder,
  onCancelOrder,
  userName,
}) => {
  const sc = getStatusStyle(order.status, COLORS);

  return (
    <Card className="mb-2.5 p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-text text-xs font-bold">{order.id}</span>
        <div className="flex items-center gap-1.5">
          {isPaid && (
            <span className="bg-success-bg text-success border-success/[0.19] rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold">
              Paid
            </span>
          )}
          <span
            className="rounded-[6px] px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: sc.bg, color: sc.text }}
          >
            {sc.label}
          </span>
        </div>
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
          .map((item: KitchenOrderItem, idx: number) => (
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
                <span className="text-success bg-success-bg rounded px-1.5 py-px text-[9px] font-semibold">Served</span>
              ) : order.status === 'completed' || order.status === 'served' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onServeOrderItem(order.id, item.productId);
                  }}
                  className="text-primary bg-primary-bg border-primary/[0.19] rounded border px-2 py-0.5 font-[inherit] text-[9px] font-semibold"
                >
                  Serve
                </button>
              ) : null}
            </div>
          ))}
      </div>
      {order.total != null && <div className="text-primary mt-1.5 text-xs font-bold">GH₵ {order.total.toFixed(2)}</div>}
      {order.rejectionReason && (
        <div className="bg-danger-bg text-danger mt-1.5 rounded-lg px-2.5 py-1.5 text-[11px]">
          <AlertCircle size={10} className="mr-1" /> {order.rejectionReason}
        </div>
      )}
      {order.returnReason && (
        <div className="bg-danger-bg text-danger mt-1.5 rounded-lg px-2.5 py-1.5 text-[11px]">
          <RotateCcw size={10} className="mr-1" /> {order.returnReason}
        </div>
      )}
      {order.status === 'cancelled' && order.cancelledBy && (
        <div className="bg-danger-bg text-danger mt-1.5 rounded-lg px-2.5 py-1.5 text-[11px]">
          <Ban size={10} className="mr-1" /> Cancelled by {order.cancelledBy}
        </div>
      )}
      <div className="text-text-dim mt-1.5 text-[10px]">
        {order.serverName && <span>{order.serverName} · </span>}
        {new Date(order.createdAt).toLocaleTimeString()}
      </div>

      {/* Action buttons */}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {order.status === 'completed' && (
          <>
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle}
              onClick={() => onServeOrder(order.id)}
              className="flex-1 justify-center"
            >
              Mark Served
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={RotateCcw}
              onClick={() => onReturnOrder(order.id)}
              className="flex-1 justify-center"
            >
              Return
            </Button>
          </>
        )}
        {order.status === 'pending' && selectedTill?.isActive && (
          <Button
            variant="danger"
            size="sm"
            icon={Ban}
            onClick={() => onCancelOrder(order.id, userName)}
            className="flex-1 justify-center"
          >
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
};
