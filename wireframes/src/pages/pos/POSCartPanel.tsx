import React from 'react';
import clsx from 'clsx';
import { ShoppingCart, X, Plus, Minus, Trash2, Search, User, Check, ArrowLeft, Percent } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import type { ThemeColors } from '@/types/theme.types';
import type { Product, Customer } from '@/types';
import { POSPaymentForm } from './POSPaymentForm';
import type { SplitEntry, PaymentMethodType } from './POSPaymentForm';

interface CartItem extends Product {
  qty: number;
}

interface HeldOrder {
  id: number;
  items: CartItem[];
  time: string;
  discountValue: string;
  discountType: 'percent' | 'fixed';
}

export interface POSCartPanelProps {
  isOverlay?: boolean;
  cart: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  discount: number;
  discountLabel: string;
  total: number;
  // Cart actions
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  holdOrder: () => void;
  recallOrder: (orderId: number) => void;
  setPosScreen: (screen: 'catalog' | 'checkout') => void;
  // Held orders
  heldOrders: HeldOrder[];
  // Customer state
  selectedCust: Customer | null;
  posCustomer: string | null;
  setPosCustomer: (val: string | null) => void;
  showCustPicker: boolean;
  setShowCustPicker: (val: boolean) => void;
  custSearch: string;
  setCustSearch: (val: string) => void;
  showQuickAddCust: boolean;
  setShowQuickAddCust: (val: boolean) => void;
  quickCustForm: { name: string; phone: string };
  setQuickCustForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string }>>;
  handleQuickAddCust: () => void;
  customers: Customer[];
  // Discount state
  canApplyDiscount: boolean;
  roleMaxDiscountPercent: number;
  manualDiscountValue: string;
  setManualDiscountValue: (val: string) => void;
  manualDiscountType: 'percent' | 'fixed';
  setManualDiscountType: (val: 'percent' | 'fixed') => void;
  discountExceedsLimit: boolean;
  // Payment state (forwarded to POSPaymentForm)
  paymentMethod: PaymentMethodType;
  setPaymentMethod: (val: PaymentMethodType) => void;
  splitMode: boolean;
  setSplitMode: (val: boolean) => void;
  splits: SplitEntry[];
  setSplits: React.Dispatch<React.SetStateAction<SplitEntry[]>>;
  amountTendered: string;
  setAmountTendered: (val: string) => void;
  cardType: string;
  setCardType: (val: string) => void;
  cardTransNo: string;
  setCardTransNo: (val: string) => void;
  momoProvider: string;
  setMomoProvider: (val: string) => void;
  momoPhone: string;
  setMomoPhone: (val: string) => void;
  momoRef: string;
  setMomoRef: (val: string) => void;
  canPay: boolean;
  handlePayment: () => void;
  splitTotal: number;
  splitRemaining: number;
  addSplit: () => void;
  removeSplit: (idx: number) => void;
  updateSplit: (idx: number, patch: Partial<SplitEntry>) => void;
  isSplitEntryValid: (sp: SplitEntry) => boolean;
  COLORS: ThemeColors;
}

export const POSCartPanel: React.FC<POSCartPanelProps> = ({
  isOverlay = false,
  cart,
  totalItems,
  subtotal,
  tax,
  discount,
  discountLabel,
  total,
  updateQty,
  removeFromCart,
  setCart,
  holdOrder,
  recallOrder,
  setPosScreen,
  heldOrders,
  selectedCust,
  posCustomer,
  setPosCustomer,
  showCustPicker,
  setShowCustPicker,
  custSearch,
  setCustSearch,
  showQuickAddCust,
  setShowQuickAddCust,
  quickCustForm,
  setQuickCustForm,
  handleQuickAddCust,
  customers,
  canApplyDiscount,
  roleMaxDiscountPercent,
  manualDiscountValue,
  setManualDiscountValue,
  manualDiscountType,
  setManualDiscountType,
  discountExceedsLimit,
  paymentMethod,
  setPaymentMethod,
  splitMode,
  setSplitMode,
  splits,
  setSplits,
  amountTendered,
  setAmountTendered,
  cardType,
  setCardType,
  cardTransNo,
  setCardTransNo,
  momoProvider,
  setMomoProvider,
  momoPhone,
  setMomoPhone,
  momoRef,
  setMomoRef,
  canPay,
  handlePayment,
  splitTotal,
  splitRemaining,
  addSplit,
  removeSplit,
  updateSplit,
  isSplitEntryValid,
  COLORS,
}) => {
  const panelStyle: React.CSSProperties = isOverlay
    ? {
        boxShadow: '-8px 0 40px rgba(0,0,0,0.3)',
        animation: 'slideIn 0.25s ease reverse',
        animationDirection: 'normal',
      }
    : {};

  return (
    <div
      className={clsx(
        'flex flex-col',
        isOverlay ? 'bg-surface z-modal fixed top-0 right-0 bottom-0 w-full max-w-[400px]' : 'relative h-full',
      )}
      style={panelStyle}
    >
      {/* Cart Header */}
      <div className="border-border flex items-center justify-between border-b px-4 py-[14px] md:px-5 md:py-4">
        <div className="flex items-center gap-2">
          {isOverlay && (
            <button type="button" className="p-1" onClick={() => setPosScreen('catalog')} aria-label="Back to catalog">
              <ArrowLeft size={18} className="text-text-muted" />
            </button>
          )}
          <ShoppingCart size={18} className="text-primary" />
          <span className="text-text text-[15px] font-bold">Cart</span>
          <Badge color="primary">{totalItems}</Badge>
        </div>
        <div className="flex gap-1.5">
          {cart.length > 0 && (
            <Button size="sm" variant="ghost" onClick={holdOrder}>
              Hold
            </Button>
          )}
          {cart.length > 0 && (
            <Button size="sm" variant="ghost" className="text-danger" onClick={() => setCart([])}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Held Orders */}
      {heldOrders.length > 0 && (
        <div className="bg-warning-bg border-border flex gap-1.5 overflow-x-auto border-b px-4 py-2">
          <span className="text-warning self-center text-[11px] font-semibold whitespace-nowrap">Held:</span>
          {heldOrders.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => recallOrder(o.id)}
              className="bg-surface border-border text-text rounded-lg border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
            >
              {o.items.length} items {o.time}
            </button>
          ))}
        </div>
      )}

      {/* Customer Selection Strip */}
      <div className="border-border flex items-center gap-2 border-b px-4 py-2">
        <User size={14} className="text-text-dim shrink-0" />
        {selectedCust ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <span className="text-text text-xs font-bold">{selectedCust.name}</span>
              <span className="text-text-dim ml-1.5 text-[10px]">{selectedCust.phone}</span>
            </div>
            <button
              type="button"
              onClick={() => setPosCustomer(null)}
              aria-label="Remove customer"
              className="text-text-dim p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowCustPicker(true);
              setCustSearch('');
            }}
            className="text-primary flex flex-1 items-center gap-1 text-xs font-semibold"
          >
            <Plus size={13} /> Assign Customer
          </button>
        )}
      </div>

      {/* Customer Picker Dropdown */}
      {showCustPicker && (
        <div
          className="bg-surface border-border absolute top-[80px] right-2 left-2 z-10 flex max-h-[360px] flex-col overflow-hidden rounded-xl border"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          <div className="border-border flex items-center justify-between border-b px-3.5 py-2.5">
            <span className="text-text text-[13px] font-bold">Select Customer</span>
            <button
              type="button"
              onClick={() => setShowCustPicker(false)}
              aria-label="Close customer picker"
              className="text-text-dim"
            >
              <X size={16} />
            </button>
          </div>
          <div className="border-border border-b px-3.5 py-2">
            <div className="relative">
              <Search size={13} className="text-text-dim absolute top-1/2 left-2.5 -translate-y-1/2" />
              <input
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                placeholder="Search by name or phone\u2026"
                autoFocus
                className="border-border bg-surface-alt text-text box-border w-full rounded-lg border py-2 pr-2.5 pl-[30px] font-[inherit] text-xs outline-none"
              />
            </div>
          </div>
          <div className="max-h-[220px] flex-1 overflow-y-auto">
            {/* Walk-in option */}
            <button
              type="button"
              onClick={() => {
                setPosCustomer(null);
                setShowCustPicker(false);
              }}
              className="hover:bg-primary/[0.03] flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors"
              style={{ borderBottom: `1px solid ${COLORS.border}06` }}
            >
              <div className="bg-surface-alt flex h-[30px] w-[30px] items-center justify-center rounded-lg text-sm">
                {'\u{1F6B6}'}
              </div>
              <div>
                <div className="text-text-muted text-xs font-semibold">Walk-in Customer</div>
                <div className="text-text-dim text-[9px]">No customer record</div>
              </div>
            </button>
            {/* Customer list */}
            {customers
              .filter((c) => {
                if (!custSearch) return true;
                const s = custSearch.toLowerCase();
                return c.name.toLowerCase().includes(s) || c.phone.includes(s);
              })
              .slice(0, 8)
              .map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    setPosCustomer(c.id);
                    setShowCustPicker(false);
                  }}
                  className={clsx(
                    'hover:bg-primary/[0.03] flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors',
                    posCustomer === c.id && 'bg-primary/[0.03]',
                  )}
                  style={{
                    borderBottom: `1px solid ${COLORS.border}06`,
                  }}
                >
                  <div className="text-primary bg-primary/[0.08] flex h-[30px] w-[30px] items-center justify-center rounded-lg text-xs font-extrabold">
                    {c.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-text text-xs font-semibold">{c.name}</div>
                    <div className="text-text-dim text-[10px]">
                      {c.phone} · {c.type}
                    </div>
                  </div>
                  {c.loyaltyPts > 100 && (
                    <span className="text-warning text-[9px] font-bold">\u2B50 {c.loyaltyPts}</span>
                  )}
                  {posCustomer === c.id && <Check size={14} className="text-primary" />}
                </button>
              ))}
            {customers.filter((c) => {
              if (!custSearch) return true;
              const s = custSearch.toLowerCase();
              return c.name.toLowerCase().includes(s) || c.phone.includes(s);
            }).length === 0 &&
              custSearch && (
                <div className="text-text-dim px-3.5 py-4 text-center text-[11px]">
                  No customers found for &quot;{custSearch}&quot;
                </div>
              )}
          </div>
          {/* Quick Add */}
          <div className="border-border bg-surface-alt border-t px-3.5 py-2.5">
            {!showQuickAddCust ? (
              <button
                type="button"
                onClick={() => setShowQuickAddCust(true)}
                className="text-primary flex items-center gap-1.5 text-xs font-semibold"
              >
                <Plus size={14} /> Create New Customer
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-text text-[11px] font-bold">Quick Add Customer</div>
                <input
                  value={quickCustForm.name}
                  onChange={(e) => setQuickCustForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Customer name *"
                  className="border-border text-text bg-surface box-border rounded-lg border px-2.5 py-2 font-[inherit] text-xs outline-none"
                />
                <input
                  value={quickCustForm.phone}
                  onChange={(e) => setQuickCustForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone number *"
                  className="border-border text-text bg-surface box-border rounded-lg border px-2.5 py-2 font-[inherit] text-xs outline-none"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickAddCust(false);
                      setQuickCustForm({ name: '', phone: '' });
                    }}
                    className="border-border text-text-muted flex-1 rounded-lg border bg-transparent px-2.5 py-[7px] font-[inherit] text-[11px] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickAddCust}
                    disabled={!quickCustForm.name.trim() || !quickCustForm.phone.trim()}
                    className="flex-1 rounded-lg border-none px-2.5 py-[7px] font-[inherit] text-[11px] font-bold"
                    style={{
                      background:
                        quickCustForm.name.trim() && quickCustForm.phone.trim() ? COLORS.primary : COLORS.surfaceAlt,
                      color: quickCustForm.name.trim() && quickCustForm.phone.trim() ? '#fff' : COLORS.textDim,
                      cursor: quickCustForm.name.trim() && quickCustForm.phone.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Add & Select
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Items + Payment (scrollable) */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-3 py-2 md:px-4">
          {cart.length === 0 ? (
            <div className="text-text-dim py-10 text-center">
              <ShoppingCart size={32} className="text-border mb-2" />
              <div className="text-[13px] font-medium">Cart is empty</div>
              <div className="text-text-dim mt-1 text-[11px]">Tap products to add them</div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="border-border/[0.03] flex items-center gap-2.5 border-b py-2.5">
                <div className="bg-surface-alt flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg">
                  {item.image}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-text overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                    {item.name}
                  </div>
                  <div className="text-text-muted font-mono text-[11px]">
                    GH₵ {item.price.toFixed(2)} \u00D7 {item.qty} ={' '}
                    <span className="text-text font-semibold">GH₵ {(item.price * item.qty).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                    className="bg-surface-alt border-border flex h-[26px] w-[26px] items-center justify-center rounded-md border"
                  >
                    <Minus size={12} className="text-text-muted" />
                  </button>
                  <span className="text-text w-[22px] text-center text-[13px] font-bold">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="bg-surface-alt border-border flex h-[26px] w-[26px] items-center justify-center rounded-md border"
                  >
                    <Plus size={12} className="text-text-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                    className="ml-0.5 flex h-[26px] w-[26px] items-center justify-center rounded-md"
                  >
                    <Trash2 size={13} className="text-danger" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary + Payment */}
        {cart.length > 0 && (
          <div className="border-border border-t-[1.5px] px-[14px] py-3 md:px-5 md:py-[14px]">
            {/* Totals */}
            <div className="mb-3">
              <div className="text-text-muted flex justify-between py-[2px] text-xs">
                <span>Subtotal</span>
                <span className="font-mono">GH₵ {subtotal.toFixed(2)}</span>
              </div>
              <div className="text-text-muted flex justify-between py-[2px] text-xs">
                <span>NHIL/VAT (12.5%)</span>
                <span className="font-mono">GH₵ {tax.toFixed(2)}</span>
              </div>
              {/* Discount Input */}
              {canApplyDiscount && roleMaxDiscountPercent > 0 && (
                <div className="border-border mt-1 border-t border-dashed py-1.5">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Percent size={12} className="text-primary" />
                    <span className="text-text-muted flex-1 text-[11px] font-bold">Discount</span>
                    <span className="text-text-dim text-[9px]">max {roleMaxDiscountPercent}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Type toggle: % / GH₵ */}
                    <div className="border-border flex shrink-0 overflow-hidden rounded-md border-[1.5px]">
                      <button
                        type="button"
                        onClick={() => setManualDiscountType('percent')}
                        className="border-none px-2 py-1 font-[inherit] text-[10px] font-bold"
                        style={{
                          background: manualDiscountType === 'percent' ? COLORS.primary : COLORS.surfaceAlt,
                          color: manualDiscountType === 'percent' ? '#fff' : COLORS.textMuted,
                        }}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualDiscountType('fixed')}
                        className="border-none px-1.5 py-1 font-[inherit] text-[10px] font-bold"
                        style={{
                          background: manualDiscountType === 'fixed' ? COLORS.primary : COLORS.surfaceAlt,
                          color: manualDiscountType === 'fixed' ? '#fff' : COLORS.textMuted,
                        }}
                      >
                        GH₵
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={manualDiscountType === 'percent' ? '0' : '0.00'}
                      value={manualDiscountValue}
                      onChange={(e) => setManualDiscountValue(e.target.value)}
                      className="bg-surface-alt text-text min-w-0 flex-1 rounded-md px-2 py-[5px] font-mono text-xs outline-none"
                      style={{
                        border: `1.5px solid ${discountExceedsLimit ? COLORS.danger : COLORS.border}`,
                      }}
                    />
                    {manualDiscountValue && (
                      <button
                        type="button"
                        onClick={() => setManualDiscountValue('')}
                        className="flex border-none bg-transparent p-0.5"
                      >
                        <X size={12} className="text-text-dim" />
                      </button>
                    )}
                  </div>
                  {discountExceedsLimit && (
                    <div className="text-danger mt-0.5 text-[9px]">
                      Exceeds your role limit ({roleMaxDiscountPercent}%) — clamped
                    </div>
                  )}
                </div>
              )}
              {/* Discount amount display */}
              {discount > 0 && (
                <div className="text-success flex justify-between py-[2px] text-xs">
                  <span>{discountLabel}</span>
                  <span className="font-mono">-GH₵ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="text-text border-border mt-2 flex justify-between border-t-[1.5px] pt-2 text-base font-bold">
                <span>Total</span>
                <span className="font-mono">GH₵ {total.toFixed(2)}</span>
              </div>
            </div>

            <POSPaymentForm
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              splitMode={splitMode}
              setSplitMode={setSplitMode}
              splits={splits}
              setSplits={setSplits}
              amountTendered={amountTendered}
              setAmountTendered={setAmountTendered}
              cardType={cardType}
              setCardType={setCardType}
              cardTransNo={cardTransNo}
              setCardTransNo={setCardTransNo}
              momoProvider={momoProvider}
              setMomoProvider={setMomoProvider}
              momoPhone={momoPhone}
              setMomoPhone={setMomoPhone}
              momoRef={momoRef}
              setMomoRef={setMomoRef}
              total={total}
              canPay={canPay}
              handlePayment={handlePayment}
              splitTotal={splitTotal}
              splitRemaining={splitRemaining}
              addSplit={addSplit}
              removeSplit={removeSplit}
              updateSplit={updateSplit}
              isSplitEntryValid={isSplitEntryValid}
              COLORS={COLORS}
            />
          </div>
        )}
      </div>
    </div>
  );
};
