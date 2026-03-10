import React from 'react';
import { Plus, Minus, Trash2, X, Send, UtensilsCrossed, ShoppingBag, Hash, Pause } from 'lucide-react';
import { useColors } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isSmall } from '@/utils/responsive';
import { Button, Badge } from '@/components/ui';
import type { Product, OrderType } from '@/types';

interface CartItem extends Product {
  qty: number;
  notes?: string;
}

interface OrderPanelProps {
  activeTillName: string | null;
  items: CartItem[];
  table: string;
  orderType: OrderType;
  totalItems: number;
  totalAmount: number;
  hasKitchenItems: boolean;
  hasBarOnlyItems: boolean;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveFromCart: (id: string) => void;
  onSetTable: (table: string) => void;
  onSetOrderType: (orderType: OrderType) => void;
  onSendToKitchen: () => void;
  onHoldOrder: () => void;
  onClearCart: () => void;
  editingNotes: string | null;
  noteText: string;
  onEditNotes: (itemId: string, currentNotes: string) => void;
  onSaveNotes: (itemId: string) => void;
  onCancelNotes: () => void;
  onSetNoteText: (text: string) => void;
  disabled: boolean;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  activeTillName,
  items,
  table,
  orderType,
  totalItems,
  totalAmount,
  hasKitchenItems,
  hasBarOnlyItems,
  onUpdateQty,
  onRemoveFromCart,
  onSetTable,
  onSetOrderType,
  onSendToKitchen,
  onHoldOrder,
  onClearCart,
  editingNotes,
  noteText,
  onEditNotes,
  onSaveNotes,
  onCancelNotes,
  onSetNoteText,
  disabled,
}) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const small = isSmall(bp);

  return (
    <div
      className="bg-surface flex flex-1 flex-col overflow-hidden"
      style={{
        borderRadius: small ? 0 : 14,
        border: small ? 'none' : `1px solid ${COLORS.border}`,
      }}
    >
      {/* Order header */}
      <div className="border-border border-b px-4 py-3.5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-text text-sm font-bold">
            {activeTillName ? `${activeTillName} — New Order` : 'No Active Till'}
          </div>
          {totalItems > 0 && (
            <div className="flex items-center gap-2">
              <Badge color="primary">{totalItems} items</Badge>
              <button
                type="button"
                onClick={onClearCart}
                className="text-danger border-none bg-none p-0 font-[inherit] text-xs font-semibold"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Order type toggle */}
        <div className="mb-2.5 flex gap-1.5">
          <button
            type="button"
            onClick={() => onSetOrderType('dine_in')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-[inherit] text-xs font-semibold"
            style={{
              border: `1.5px solid ${orderType === 'dine_in' ? COLORS.primary : COLORS.border}`,
              background: orderType === 'dine_in' ? COLORS.primaryBg : 'transparent',
              color: orderType === 'dine_in' ? COLORS.primary : COLORS.textMuted,
            }}
          >
            <UtensilsCrossed size={14} /> Dine-in
          </button>
          <button
            type="button"
            onClick={() => onSetOrderType('takeaway')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-[inherit] text-xs font-semibold"
            style={{
              border: `1.5px solid ${orderType === 'takeaway' ? COLORS.accent : COLORS.border}`,
              background: orderType === 'takeaway' ? COLORS.accentBg : 'transparent',
              color: orderType === 'takeaway' ? COLORS.accent : COLORS.textMuted,
            }}
          >
            <ShoppingBag size={14} /> Takeaway
          </button>
        </div>

        {/* Table input */}
        {orderType === 'dine_in' && (
          <div className="relative">
            <Hash size={14} className="text-text-dim absolute top-1/2 left-2.5 -translate-y-1/2" />
            <input
              value={table}
              onChange={(e) => onSetTable(e.target.value)}
              placeholder="Table number (e.g. Table 5, Bar Seat 3)"
              className="border-border bg-surface-alt text-text box-border w-full rounded-lg border-[1.5px] py-2 pr-3 pl-8 font-[inherit] text-xs outline-none"
            />
          </div>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-auto px-4 py-2">
        {items.length === 0 ? (
          <div className="text-text-dim p-10 text-center">
            <UtensilsCrossed size={24} className="mx-auto mb-2 opacity-40" />
            <div className="text-[13px]">Tap items to add to order</div>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border-border border-b py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.image}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-text overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                    {item.name}
                  </div>
                  <div className="text-primary flex items-center gap-1.5 text-[11px] font-semibold">
                    GH₵ {(item.price * item.qty).toFixed(2)}
                    {item.skipKitchen && (
                      <span className="text-accent bg-accent-bg rounded px-[5px] py-px text-[9px] font-bold">
                        Serve from Bar
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.id, -1)}
                    className="border-border bg-surface-alt text-text-muted flex h-[26px] w-[26px] items-center justify-center rounded-md border"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-text min-w-5 text-center text-[13px] font-bold">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="border-border bg-surface-alt text-text-muted flex h-[26px] w-[26px] items-center justify-center rounded-md border"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(item.id)}
                    className="bg-danger-bg text-danger ml-1 flex h-[26px] w-[26px] items-center justify-center rounded-md border-none"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {/* Item notes */}
              {editingNotes === item.id ? (
                <div className="mt-1.5 flex gap-1">
                  <input
                    value={noteText}
                    onChange={(e) => onSetNoteText(e.target.value)}
                    placeholder="e.g. no ice, extra spicy"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSaveNotes(item.id);
                    }}
                    className="border-border bg-surface-alt text-text flex-1 rounded-md border px-2 py-[5px] font-[inherit] text-[11px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onSaveNotes(item.id)}
                    className="bg-primary rounded-md border-none px-2.5 py-1 font-[inherit] text-[11px] font-semibold text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={onCancelNotes}
                    className="border-border text-text-muted rounded-md border bg-transparent px-2 py-1 font-[inherit] text-[11px]"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onEditNotes(item.id, item.notes || '')}
                  className="mt-1 border-none bg-none p-0 font-[inherit] text-[11px]"
                  style={{
                    color: item.notes ? COLORS.accent : COLORS.textDim,
                    fontStyle: item.notes ? 'normal' : 'italic',
                  }}
                >
                  {item.notes || '+ Add note'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Send to kitchen */}
      <div className="border-border bg-surface-alt border-t px-4 py-3">
        <div className="text-text-muted mb-1.5 flex justify-between text-xs">
          <span>Items</span>
          <span className="text-text font-bold">{totalItems}</span>
        </div>
        <div className="text-text mb-2.5 flex justify-between text-sm">
          <span className="font-semibold">Total</span>
          <span className="text-primary font-extrabold">GH₵ {totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={Pause}
            onClick={onHoldOrder}
            disabled={disabled}
            className="px-3.5 py-3 text-[13px]"
            style={{ flex: 0 }}
          >
            Hold
          </Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={onSendToKitchen}
            disabled={disabled}
            className="flex-1 justify-center px-5 py-3 text-sm"
          >
            {hasKitchenItems && hasBarOnlyItems
              ? 'Send Order'
              : hasKitchenItems
                ? 'Send to Kitchen'
                : hasBarOnlyItems
                  ? 'Serve from Bar'
                  : 'Send to Kitchen'}
          </Button>
        </div>
        {hasKitchenItems && hasBarOnlyItems && !disabled && (
          <div className="text-text-dim mt-1.5 text-center text-[10px]">Food → Kitchen · Drinks → Serve now</div>
        )}
      </div>
    </div>
  );
};
