import React from 'react';
import { Monitor, Plus, XCircle, Clock, ChevronLeft, CreditCard, Bell, X, Receipt } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import type { Till, KitchenOrder, ThemeColors } from '@/types';
import type { KitchenNotification } from '@/context/KitchenOrderContext';
import type { Breakpoint } from '@/hooks';
import { isMobile, isSmall } from '@/utils/responsive';
import { TillOrderCard } from './TillOrderCard';
import { TillAddOrderForm } from './TillAddOrderForm';
import { TillPaymentPanel } from './TillPaymentPanel';
import { getNotificationStyle } from './TillManagementPage';
import type { CartItem, PaymentMethod } from './TillManagementPage';
import type { Product, OrderType } from '@/types';

interface TillDetailPanelProps {
  selectedTill: Till | null;
  tillOrdersSorted: KitchenOrder[];
  paidOrderIds: Set<string>;
  COLORS: ThemeColors;
  bp: Breakpoint;
  userName: string;

  // Notification state
  showNotifications: boolean;
  kitchenNotifs: KitchenNotification[];
  unreadNotifCount: number;

  // Panel visibility
  showPayment: boolean;
  showAddOrder: boolean;

  // Add order form props
  orderType: OrderType;
  orderTable: string;
  orderSearch: string;
  orderItems: CartItem[];
  filteredProducts: Product[];
  orderTotal: number;
  orderItemCount: number;

  // Payment panel props
  paymentComplete: boolean;
  payingAmount: number;
  paymentMethod: PaymentMethod;
  amountTendered: string;
  cardType: string;
  cardTransNo: string;
  momoProvider: string;
  momoPhone: string;
  momoTransId: string;
  change: number;
  canProcessPayment: boolean;
  outstandingBalance: number;
  isClosingTill: boolean;
  canApplyDiscount: boolean;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  discountExceedsLimit: boolean;
  discountAmount: number;
  discountLabel: string;
  roleMaxDiscountPercent: number;

  // Callbacks
  onMobileBack: () => void;
  onToggleNotifications: () => void;
  onCloseNotifications: () => void;
  onShowAddOrder: () => void;
  onShowPayment: () => void;
  onShowReceipt: () => void;
  onCloseTillClick: () => void;
  onServeOrder: (orderId: string) => void;
  onServeOrderItem: (orderId: string, productId: string) => void;
  onReturnOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string, userName: string) => void;
  onSetOrderType: (type: OrderType) => void;
  onSetOrderTable: (value: string) => void;
  onSetOrderSearch: (value: string) => void;
  onAddItem: (product: Product) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onSendOrder: () => void;
  onCancelAddOrder: () => void;
  onSetPaymentMethod: (method: PaymentMethod) => void;
  onSetAmountTendered: (value: string) => void;
  onSetCardType: (value: string) => void;
  onSetCardTransNo: (value: string) => void;
  onSetMomoProvider: (value: string) => void;
  onSetMomoPhone: (value: string) => void;
  onSetMomoTransId: (value: string) => void;
  onSetDiscountType: (type: 'percent' | 'fixed') => void;
  onSetDiscountValue: (value: string) => void;
  onProcessPayment: () => void;
  onCloseTill: () => void;
  onPaymentDone: () => void;
  onPayMore: () => void;
  onCancelPayment: () => void;
}

// ─── Kitchen Notifications sub-section ───
const KitchenNotificationsSection: React.FC<{
  kitchenNotifs: KitchenNotification[];
  unreadNotifCount: number;
  COLORS: ThemeColors;
  onClose: () => void;
}> = ({ kitchenNotifs, unreadNotifCount, COLORS, onClose }) => (
  <div className="p-4">
    <div className="mb-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-primary" />
        <span className="text-text text-sm font-bold">Kitchen Notifications</span>
        {unreadNotifCount > 0 && <Badge color="danger">{unreadNotifCount}</Badge>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="text-text-muted border-none bg-transparent p-1"
      >
        <X size={16} />
      </button>
    </div>

    {kitchenNotifs.length === 0 ? (
      <div className="text-text-dim p-8 text-center">
        <Bell size={24} className="mx-auto mb-2 opacity-40" />
        <div className="text-[13px]">No kitchen notifications yet</div>
        <div className="mt-1 text-[11px]">Updates will appear when the kitchen processes your orders</div>
      </div>
    ) : (
      kitchenNotifs.map((notif) => {
        const ns = getNotificationStyle(notif.type, COLORS);
        const NotifIcon = ns.icon;
        return (
          <div
            key={notif.id}
            className="mb-2 rounded-[10px] p-3 transition-all duration-150"
            style={{
              background: notif.read ? COLORS.surface : ns.bg,
              border: `1px solid ${notif.read ? COLORS.border : ns.text + '30'}`,
            }}
          >
            <div className="flex items-start gap-2.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: notif.read ? COLORS.surfaceAlt : ns.bg,
                }}
              >
                <NotifIcon size={14} style={{ color: ns.text }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-text mb-0.5 text-xs font-semibold">{notif.message}</div>
                <div className="text-text-dim text-[10px]">{new Date(notif.timestamp).toLocaleTimeString()}</div>
              </div>
              {!notif.read && <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: ns.text }} />}
            </div>
          </div>
        );
      })
    )}
  </div>
);

export const TillDetailPanel: React.FC<TillDetailPanelProps> = ({
  selectedTill,
  tillOrdersSorted,
  paidOrderIds,
  COLORS,
  bp,
  userName,
  showNotifications,
  kitchenNotifs,
  unreadNotifCount,
  showPayment,
  showAddOrder,
  orderType,
  orderTable,
  orderSearch,
  orderItems,
  filteredProducts,
  orderTotal,
  orderItemCount,
  paymentComplete,
  payingAmount,
  paymentMethod,
  amountTendered,
  cardType,
  cardTransNo,
  momoProvider,
  momoPhone,
  momoTransId,
  change,
  canProcessPayment,
  outstandingBalance,
  isClosingTill,
  canApplyDiscount,
  discountType,
  discountValue,
  discountExceedsLimit,
  discountAmount,
  discountLabel,
  roleMaxDiscountPercent,
  onMobileBack,
  onToggleNotifications,
  onCloseNotifications,
  onShowAddOrder,
  onShowPayment,
  onShowReceipt,
  onCloseTillClick,
  onServeOrder,
  onServeOrderItem,
  onReturnOrder,
  onCancelOrder,
  onSetOrderType,
  onSetOrderTable,
  onSetOrderSearch,
  onAddItem,
  onUpdateQty,
  onRemoveItem,
  onSendOrder,
  onCancelAddOrder,
  onSetPaymentMethod,
  onSetAmountTendered,
  onSetCardType,
  onSetCardTransNo,
  onSetMomoProvider,
  onSetMomoPhone,
  onSetMomoTransId,
  onSetDiscountType,
  onSetDiscountValue,
  onProcessPayment,
  onCloseTill,
  onPaymentDone,
  onPayMore,
  onCancelPayment,
}) => {
  const mobile = isMobile(bp);
  const small = isSmall(bp);

  if (!selectedTill) {
    return (
      <div
        className="bg-surface flex flex-1 flex-col items-center justify-center p-10"
        style={{
          borderRadius: small ? 0 : 14,
          border: small ? 'none' : `1px solid ${COLORS.border}`,
        }}
      >
        <Monitor size={32} className="text-text-dim mb-3 opacity-40" />
        <div className="text-text-muted text-sm font-semibold">Select a till to view details</div>
        <div className="text-text-dim mt-1 text-xs">Choose from the list on the left</div>
      </div>
    );
  }

  return (
    <div
      className="bg-surface flex flex-1 flex-col overflow-hidden"
      style={{
        borderRadius: small ? 0 : 14,
        border: small ? 'none' : `1px solid ${COLORS.border}`,
      }}
    >
      {/* Till header */}
      <div className="border-border flex flex-wrap items-center gap-2.5 border-b px-4 py-3.5">
        {mobile && (
          <button
            type="button"
            onClick={onMobileBack}
            aria-label="Go back"
            className="text-text-muted border-none bg-transparent p-1"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-text text-base font-bold">{selectedTill.name}</span>
            <span
              className="rounded-[6px] px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: selectedTill.isActive ? COLORS.successBg : COLORS.surfaceAlt,
                color: selectedTill.isActive ? COLORS.success : COLORS.textDim,
              }}
            >
              {selectedTill.isActive ? 'Active' : 'Closed'}
            </span>
          </div>
          <div className="text-text-dim text-[11px]">
            Opened by {selectedTill.openedBy} · {new Date(selectedTill.openedAt).toLocaleTimeString()} ·{' '}
            {selectedTill.orderCount} orders placed
            {selectedTill.totalPayments > 0 && (
              <span className="text-success">
                {' '}
                · {selectedTill.totalPayments} paid (GH₵ {selectedTill.totalPaymentAmount.toFixed(2)})
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5">
          {/* Kitchen notifications button */}
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-[inherit] text-[11px] font-semibold"
            style={{
              border: `1.5px solid ${showNotifications ? COLORS.primary : COLORS.border}`,
              background: showNotifications ? COLORS.primaryBg : COLORS.surface,
              color: showNotifications ? COLORS.primary : COLORS.textMuted,
            }}
          >
            <Bell size={14} />
            {!small && 'Kitchen'}
            {unreadNotifCount > 0 && (
              <span className="bg-danger absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-lg text-[9px] font-bold text-white">
                {unreadNotifCount}
              </span>
            )}
          </button>
          {selectedTill.isActive && (
            <Button variant="primary" size="sm" icon={Plus} onClick={onShowAddOrder}>
              {!small && 'Add Order'}
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={CreditCard} onClick={onShowPayment}>
            {!small && 'Payment'}
          </Button>
          {!selectedTill.isActive && (
            <Button variant="secondary" size="sm" icon={Receipt} onClick={onShowReceipt}>
              {!small && 'Receipt'}
            </Button>
          )}
          {selectedTill.isActive && (
            <Button variant="danger" size="sm" icon={XCircle} onClick={onCloseTillClick}>
              {!small && 'Close Till'}
            </Button>
          )}
        </div>
      </div>

      {/* Orders list / panels */}
      <div className="flex-1 overflow-auto p-4">
        {showNotifications ? (
          <KitchenNotificationsSection
            kitchenNotifs={kitchenNotifs}
            unreadNotifCount={unreadNotifCount}
            COLORS={COLORS}
            onClose={onCloseNotifications}
          />
        ) : showPayment ? (
          <TillPaymentPanel
            paymentComplete={paymentComplete}
            payingAmount={payingAmount}
            paymentMethod={paymentMethod}
            amountTendered={amountTendered}
            cardType={cardType}
            cardTransNo={cardTransNo}
            momoProvider={momoProvider}
            momoPhone={momoPhone}
            momoTransId={momoTransId}
            change={change}
            canProcessPayment={canProcessPayment}
            selectedTill={selectedTill}
            outstandingBalance={outstandingBalance}
            isClosingTill={isClosingTill}
            canApplyDiscount={canApplyDiscount}
            discountType={discountType}
            discountValue={discountValue}
            discountExceedsLimit={discountExceedsLimit}
            discountAmount={discountAmount}
            discountLabel={discountLabel}
            roleMaxDiscountPercent={roleMaxDiscountPercent}
            COLORS={COLORS}
            onSetPaymentMethod={onSetPaymentMethod}
            onSetAmountTendered={onSetAmountTendered}
            onSetCardType={onSetCardType}
            onSetCardTransNo={onSetCardTransNo}
            onSetMomoProvider={onSetMomoProvider}
            onSetMomoPhone={onSetMomoPhone}
            onSetMomoTransId={onSetMomoTransId}
            onSetDiscountType={onSetDiscountType}
            onSetDiscountValue={onSetDiscountValue}
            onProcessPayment={onProcessPayment}
            onCloseTill={onCloseTill}
            onDone={onPaymentDone}
            onPayMore={onPayMore}
            onCancel={onCancelPayment}
          />
        ) : showAddOrder ? (
          <TillAddOrderForm
            orderType={orderType}
            orderTable={orderTable}
            orderSearch={orderSearch}
            orderItems={orderItems}
            filteredProducts={filteredProducts}
            orderTotal={orderTotal}
            orderItemCount={orderItemCount}
            COLORS={COLORS}
            onSetOrderType={onSetOrderType}
            onSetOrderTable={onSetOrderTable}
            onSetOrderSearch={onSetOrderSearch}
            onAddItem={onAddItem}
            onUpdateQty={onUpdateQty}
            onRemoveItem={onRemoveItem}
            onSendOrder={onSendOrder}
            onCancel={onCancelAddOrder}
          />
        ) : (
          <>
            {tillOrdersSorted.length === 0 ? (
              <div className="text-text-dim p-10 text-center">
                <Clock size={24} className="mx-auto mb-2 opacity-40" />
                <div className="text-[13px]">No orders yet</div>
                {selectedTill.isActive && (
                  <Button variant="primary" size="sm" icon={Plus} onClick={onShowAddOrder} className="mt-3">
                    Add First Order
                  </Button>
                )}
              </div>
            ) : (
              tillOrdersSorted.map((order) => (
                <TillOrderCard
                  key={order.id}
                  order={order}
                  isPaid={paidOrderIds.has(order.id)}
                  selectedTill={selectedTill}
                  COLORS={COLORS}
                  onServeOrder={onServeOrder}
                  onServeOrderItem={onServeOrderItem}
                  onReturnOrder={onReturnOrder}
                  onCancelOrder={onCancelOrder}
                  userName={userName}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
