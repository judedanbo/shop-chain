import React from 'react';
import { UtensilsCrossed, ShoppingBag, Hash, Search, Minus, Plus, Trash2, Send } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import type { Product, OrderType, ThemeColors } from '@/types';
import type { CartItem } from './TillManagementPage';

interface TillAddOrderFormProps {
  orderType: OrderType;
  orderTable: string;
  orderSearch: string;
  orderItems: CartItem[];
  filteredProducts: Product[];
  orderTotal: number;
  orderItemCount: number;
  COLORS: ThemeColors;
  onSetOrderType: (type: OrderType) => void;
  onSetOrderTable: (value: string) => void;
  onSetOrderSearch: (value: string) => void;
  onAddItem: (product: Product) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onSendOrder: () => void;
  onCancel: () => void;
}

export const TillAddOrderForm: React.FC<TillAddOrderFormProps> = ({
  orderType,
  orderTable,
  orderSearch,
  orderItems,
  filteredProducts,
  orderTotal,
  orderItemCount,
  COLORS,
  onSetOrderType,
  onSetOrderTable,
  onSetOrderSearch,
  onAddItem,
  onUpdateQty,
  onRemoveItem,
  onSendOrder,
  onCancel,
}) => (
  <div className="border-border bg-surface-alt border-t p-4">
    <div className="mb-3 flex items-center justify-between">
      <div className="text-text text-sm font-bold">New Order</div>
      <button
        type="button"
        onClick={onCancel}
        className="text-danger border-none bg-transparent font-[inherit] text-xs font-semibold"
      >
        Cancel
      </button>
    </div>

    {/* Order type toggle */}
    <div className="mb-2.5 flex gap-1.5">
      <button
        type="button"
        onClick={() => onSetOrderType('dine_in')}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-[7px] font-[inherit] text-[11px] font-semibold"
        style={{
          border: `1.5px solid ${orderType === 'dine_in' ? COLORS.primary : COLORS.border}`,
          background: orderType === 'dine_in' ? COLORS.primaryBg : 'transparent',
          color: orderType === 'dine_in' ? COLORS.primary : COLORS.textMuted,
        }}
      >
        <UtensilsCrossed size={12} /> Dine-in
      </button>
      <button
        type="button"
        onClick={() => onSetOrderType('takeaway')}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-[7px] font-[inherit] text-[11px] font-semibold"
        style={{
          border: `1.5px solid ${orderType === 'takeaway' ? COLORS.accent : COLORS.border}`,
          background: orderType === 'takeaway' ? COLORS.accentBg : 'transparent',
          color: orderType === 'takeaway' ? COLORS.accent : COLORS.textMuted,
        }}
      >
        <ShoppingBag size={12} /> Takeaway
      </button>
    </div>

    {/* Table input */}
    {orderType === 'dine_in' && (
      <div className="relative mb-2.5">
        <Hash
          size={12}
          className="text-text-dim absolute"
          style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          value={orderTable}
          onChange={(e) => onSetOrderTable(e.target.value)}
          placeholder="Table number"
          className="bg-surface text-text border-border box-border w-full rounded-lg border-[1.5px] py-[7px] pr-2.5 pl-7 font-[inherit] text-[11px] outline-none"
        />
      </div>
    )}

    {/* Product search */}
    <div className="relative mb-2.5">
      <Search
        size={12}
        className="text-text-dim absolute"
        style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }}
      />
      <input
        value={orderSearch}
        onChange={(e) => onSetOrderSearch(e.target.value)}
        placeholder="Search products..."
        className="bg-surface text-text border-border box-border w-full rounded-lg border-[1.5px] py-[7px] pr-2.5 pl-7 font-[inherit] text-[11px] outline-none"
      />
    </div>

    {/* Product list */}
    <div className="border-border mb-2.5 max-h-40 overflow-auto rounded-lg border">
      {filteredProducts.slice(0, 20).map((p) => {
        const inCart = orderItems.find((i) => i.id === p.id);
        return (
          <div
            key={p.id}
            onClick={() => onAddItem(p)}
            className="border-border flex cursor-pointer items-center gap-2 border-b px-3 py-2 text-[11px] transition-colors duration-100"
            style={{
              background: inCart ? COLORS.primaryBg : COLORS.surface,
            }}
          >
            <span className="text-base">{p.image}</span>
            <div className="min-w-0 flex-1">
              <div className="text-text truncate font-semibold">{p.name}</div>
              <div className="text-text-dim text-[10px]">
                {p.category} · Stock: {p.stock}
              </div>
            </div>
            <span className="text-primary font-bold whitespace-nowrap">GH₵ {p.price.toFixed(2)}</span>
            {inCart && <Badge color="primary">{inCart.qty}</Badge>}
          </div>
        );
      })}
    </div>

    {/* Cart items */}
    {orderItems.length > 0 && (
      <div className="mb-2.5">
        {orderItems.map((item) => (
          <div key={item.id} className="border-border flex items-center gap-1.5 border-b py-1.5">
            <span className="text-sm">{item.image}</span>
            <div className="min-w-0 flex-1">
              <div className="text-text truncate text-[11px] font-semibold">{item.name}</div>
              <div className="text-primary text-[10px] font-semibold">GH₵ {(item.price * item.qty).toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-[3px]">
              <button
                type="button"
                onClick={() => onUpdateQty(item.id, -1)}
                className="border-border bg-surface text-text-muted flex h-[22px] w-[22px] items-center justify-center rounded border"
              >
                <Minus size={10} />
              </button>
              <span className="text-text min-w-4 text-center text-[11px] font-bold">{item.qty}</span>
              <button
                type="button"
                onClick={() => onUpdateQty(item.id, 1)}
                className="border-border bg-surface text-text-muted flex h-[22px] w-[22px] items-center justify-center rounded border"
              >
                <Plus size={10} />
              </button>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="bg-danger-bg text-danger ml-0.5 flex h-[22px] w-[22px] items-center justify-center rounded border-none"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-between py-2 text-[13px] font-bold">
          <span className="text-text">
            {orderItemCount} item{orderItemCount !== 1 ? 's' : ''}
          </span>
          <span className="text-primary">GH₵ {orderTotal.toFixed(2)}</span>
        </div>
      </div>
    )}

    <Button
      variant="primary"
      icon={Send}
      onClick={onSendOrder}
      disabled={orderItems.length === 0}
      className="w-full justify-center px-4 py-2.5 text-[13px]"
    >
      Send to Kitchen
    </Button>
  </div>
);
