import React, { useState, useMemo } from 'react';
import { Monitor, Plus, ChevronLeft, RotateCcw, AlertCircle, ChefHat, CheckCircle } from 'lucide-react';
import { useColors, useAuth, useNavigation, useKitchenOrders, useToast, useShop } from '@/context';
import { DISCOUNT_ROLE_LIMITS } from '@/constants/demoData';
import type { KitchenNotification } from '@/context/KitchenOrderContext';
import { useBreakpoint } from '@/hooks';
import { isMobile, isSmall } from '@/utils/responsive';
import { Button } from '@/components/ui';
import type { Product, KitchenOrderItem, OrderType, ThemeColors } from '@/types';
import { TillListPanel } from './TillListPanel';
import { TillDetailPanel } from './TillDetailPanel';
import { TillReceiptPreview } from './TillReceiptPreview';

// ─── Local types (exported for sub-components) ───

export interface CartItem extends Product {
  qty: number;
  notes?: string;
}

interface TillManagementPageProps {
  products: Product[];
}

// ─── Payment types (exported for sub-components) ───

export type PaymentMethod = 'cash' | 'card' | 'momo' | null;

// ─── Status helpers (exported for sub-components) ───

export function getStatusStyle(status: string, COLORS: ThemeColors) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: COLORS.warningBg, text: COLORS.warning, label: 'Pending' },
    accepted: { bg: COLORS.primaryBg, text: COLORS.primary, label: 'Preparing' },
    completed: { bg: COLORS.successBg, text: COLORS.success, label: 'Ready' },
    rejected: { bg: COLORS.dangerBg, text: COLORS.danger, label: 'Rejected' },
    served: { bg: COLORS.successBg, text: COLORS.success, label: 'Served' },
    returned: { bg: COLORS.dangerBg, text: COLORS.danger, label: 'Returned' },
    cancelled: { bg: COLORS.dangerBg, text: COLORS.danger, label: 'Cancelled' },
  };
  return map[status] ?? map['pending']!;
}

export function getNotificationStyle(type: KitchenNotification['type'], COLORS: ThemeColors) {
  const map: Record<string, { bg: string; text: string; icon: typeof ChefHat }> = {
    accepted: { bg: COLORS.primaryBg, text: COLORS.primary, icon: ChefHat },
    rejected: { bg: COLORS.dangerBg, text: COLORS.danger, icon: AlertCircle },
    completed: { bg: COLORS.successBg, text: COLORS.success, icon: CheckCircle },
    returned: { bg: COLORS.dangerBg, text: COLORS.danger, icon: RotateCcw },
  };
  return map[type] ?? map['accepted']!;
}

// ─── Date filter helper ───

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ─── Quick return reasons ───

const QUICK_RETURN_REASONS = ['Wrong order', 'Customer complaint', 'Food quality issue', 'Customer left'];

// ─── TillManagementPage ───

export const TillManagementPage: React.FC<TillManagementPageProps> = ({ products }) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { user, activeShop, activeBranch, currentRole } = useAuth();
  const { goBack } = useNavigation();
  const { toast } = useToast();
  const { canAccess } = useShop();
  const {
    tills,
    openTill,
    closeTill,
    placeOrder,
    recordTillPayment,
    getOrdersForTill,
    serveOrder,
    returnOrder,
    cancelOrder,
    serveOrderItem,
    unseenUpdates,
    markOrdersSeen,
    getKitchenNotificationsForTill,
  } = useKitchenOrders();

  const mobile = isMobile(bp);
  const small = isSmall(bp);

  // ─── State ───
  const [selectedTillId, setSelectedTillId] = useState<string | null>(null);
  const [showOpenTillModal, setShowOpenTillModal] = useState(false);
  const [newTillName, setNewTillName] = useState('');
  const [showCloseTillConfirm, setShowCloseTillConfirm] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Add order state
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [orderTable, setOrderTable] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');

  // Payment state — till-level
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [amountTendered, setAmountTendered] = useState('');
  const [cardType, setCardType] = useState('');
  const [cardTransNo, setCardTransNo] = useState('');
  const [momoProvider, setMomoProvider] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoTransId, setMomoTransId] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isClosingTill, setIsClosingTill] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');

  // Return order state
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  // Kitchen notifications panel
  const [showNotifications, setShowNotifications] = useState(false);

  // Receipt / Close Till state
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptAction, setReceiptAction] = useState<'preview' | 'print' | 'email' | 'sms' | null>(null);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [receiptPhone, setReceiptPhone] = useState('');

  // Filter tills to today only (daily fresh start)
  const todayTills = useMemo(() => tills.filter((t) => isToday(t.openedAt)), [tills]);

  // ─── Derived data ───
  const allTills = [...todayTills].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
  });

  const selectedTill = tills.find((t) => t.id === selectedTillId) ?? null;
  const tillOrders = selectedTillId ? getOrdersForTill(selectedTillId) : [];
  const tillOrdersSorted = [...tillOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Payable orders: served or completed, not yet paid
  const paidOrderIds = useMemo(() => {
    if (!selectedTill) return new Set<string>();
    return new Set(selectedTill.payments.map((p) => p.orderId));
  }, [selectedTill]);

  // Outstanding balance: total of all order amounts minus total collected
  const totalOrderAmount = tillOrders
    .filter((o) => o.status !== 'rejected' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total ?? 0), 0);
  const outstandingBalance = Math.max(0, totalOrderAmount - (selectedTill?.totalPaymentAmount ?? 0));

  // Unresolved orders: orders that must be resolved before closing
  const unresolvedOrders = tillOrders.filter(
    (o) => o.status === 'pending' || o.status === 'accepted' || o.status === 'completed',
  );
  const hasUnresolvedOrders = unresolvedOrders.length > 0;

  // Kitchen notifications for selected till
  const kitchenNotifs = selectedTillId ? getKitchenNotificationsForTill(selectedTillId) : [];
  const unreadNotifCount = kitchenNotifs.filter((n) => !n.read).length;

  // ─── Till management ───
  const handleOpenTill = () => {
    if (!newTillName.trim()) return;
    const till = openTill(newTillName.trim(), user?.name ?? 'Staff');
    setSelectedTillId(till.id);
    setNewTillName('');
    setShowOpenTillModal(false);
    if (mobile) setMobileView('detail');
  };

  const handleCloseTill = () => {
    if (!selectedTillId) return;
    closeTill(selectedTillId);
    setShowCloseTillConfirm(false);
    setShowPayment(false);
    setIsClosingTill(false);
    setShowReceipt(true);
    setReceiptAction('preview');
    toast.success(`Till closed successfully`);
  };

  const selectTill = (id: string) => {
    setSelectedTillId(id);
    setShowAddOrder(false);
    setShowPayment(false);
    setPaymentComplete(false);
    setShowNotifications(false);
    setIsClosingTill(false);
    resetPayment();
    markOrdersSeen(id);
    if (mobile) setMobileView('detail');
  };

  // ─── Add order helpers ───
  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        if (!orderSearch) return p.stock > 0;
        const s = orderSearch.toLowerCase();
        return (
          p.stock > 0 &&
          (p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s) || (p.barcode && p.barcode.includes(s)))
        );
      }),
    [products, orderSearch],
  );

  const addItemToOrder = (product: Product) => {
    setOrderItems((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        if (exists.qty >= product.stock) return prev;
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateOrderItemQty = (id: string, delta: number) => {
    setOrderItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const newQty = i.qty + delta;
        if (newQty < 1) return i;
        const prod = products.find((p) => p.id === id);
        if (prod && newQty > prod.stock) return i;
        return { ...i, qty: newQty };
      }),
    );
  };

  const removeOrderItem = (id: string) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== id));
  };

  const orderTotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const orderItemCount = orderItems.reduce((s, i) => s + i.qty, 0);

  const sendOrder = () => {
    if (!selectedTill || !selectedTill.isActive || orderItems.length === 0) return;

    const kitchenItems = orderItems.filter((i) => !i.skipKitchen);
    const barItems = orderItems.filter((i) => i.skipKitchen);

    const kitchenOrderItems: KitchenOrderItem[] = kitchenItems.map((i) => ({
      productId: i.id,
      name: i.name,
      qty: i.qty,
      notes: i.notes,
    }));
    const barOrderItems: KitchenOrderItem[] = barItems.map((i) => ({
      productId: i.id,
      name: i.name,
      qty: i.qty,
      notes: i.notes,
    }));

    placeOrder({
      tillId: selectedTill.id,
      tillName: selectedTill.name,
      table: orderTable || undefined,
      orderType,
      items: kitchenOrderItems,
      serverName: user?.name ?? 'Staff',
      total: kitchenItems.reduce((s, i) => s + i.price * i.qty, 0) || undefined,
      barItems: barOrderItems.length > 0 ? barOrderItems : undefined,
      barTotal: barItems.reduce((s, i) => s + i.price * i.qty, 0) || undefined,
    });

    setOrderItems([]);
    setOrderTable('');
    setOrderType('dine_in');
    setOrderSearch('');
    setShowAddOrder(false);
  };

  // ─── Payment helpers ───
  const resetPayment = () => {
    setPaymentMethod(null);
    setAmountTendered('');
    setCardType('');
    setCardTransNo('');
    setMomoProvider('');
    setMomoPhone('');
    setMomoTransId('');
    setPaymentComplete(false);
    setDiscountValue('');
    setDiscountType('percent');
  };

  // Discount computation
  const canApplyDiscount = canAccess('bar_discount');
  const roleMaxDiscountPercent = DISCOUNT_ROLE_LIMITS[currentRole] ?? 0;
  const rawDiscountVal = parseFloat(discountValue) || 0;

  let discountAmount = 0;
  let discountLabel = '';
  if (canApplyDiscount && rawDiscountVal > 0 && outstandingBalance > 0) {
    if (discountType === 'percent') {
      const clampedPct = Math.min(rawDiscountVal, roleMaxDiscountPercent);
      discountAmount = (outstandingBalance * clampedPct) / 100;
      discountLabel = `Discount (${clampedPct}%)`;
    } else {
      const maxByRole = (outstandingBalance * roleMaxDiscountPercent) / 100;
      discountAmount = Math.min(rawDiscountVal, maxByRole);
      discountLabel = `Discount (GH₵ ${discountAmount.toFixed(2)})`;
    }
    discountAmount = Math.min(discountAmount, outstandingBalance);
  }
  const discountedBalance = Math.max(0, outstandingBalance - discountAmount);
  const discountExceedsLimit =
    discountType === 'percent'
      ? rawDiscountVal > roleMaxDiscountPercent
      : rawDiscountVal > (outstandingBalance * roleMaxDiscountPercent) / 100;

  const payingAmount = discountedBalance;

  const change =
    paymentMethod === 'cash' && amountTendered ? Math.max(0, parseFloat(amountTendered) - payingAmount) : 0;

  const canProcessPayment =
    payingAmount === 0
      ? true
      : paymentMethod === 'cash'
        ? parseFloat(amountTendered) >= payingAmount
        : paymentMethod === 'card'
          ? cardType.trim() !== '' && cardTransNo.trim() !== ''
          : paymentMethod === 'momo'
            ? momoProvider.trim() !== '' && momoPhone.trim() !== '' && momoTransId.trim() !== ''
            : false;

  const processPayment = () => {
    if (!selectedTillId || !paymentMethod) return;
    if (payingAmount <= 0) return;
    if (!canProcessPayment) return;

    recordTillPayment({
      tillId: selectedTillId,
      amount: payingAmount,
      method: paymentMethod,
      amountTendered: paymentMethod === 'cash' ? parseFloat(amountTendered) : undefined,
      change: paymentMethod === 'cash' ? change : undefined,
      cardType: paymentMethod === 'card' ? cardType : undefined,
      cardTransNo: paymentMethod === 'card' ? cardTransNo : undefined,
      momoProvider: paymentMethod === 'momo' ? momoProvider : undefined,
      momoPhone: paymentMethod === 'momo' ? momoPhone : undefined,
      momoTransId: paymentMethod === 'momo' ? momoTransId : undefined,
    });
    setPaymentComplete(true);
  };

  // ─── Return order ───
  const handleReturn = () => {
    if (!returningOrderId || !returnReason.trim()) return;
    returnOrder(returningOrderId, returnReason.trim());
    setReturningOrderId(null);
    setReturnReason('');
  };

  // ─── Receipt helpers ───
  const handleReceiptPrint = () => {
    setReceiptAction('print');
    toast.success('Sending to printer...');
  };
  const handleReceiptEmail = () => {
    if (!receiptEmail.trim()) return;
    setReceiptAction(null);
    toast.success(`Receipt emailed to ${receiptEmail}`);
    setReceiptEmail('');
  };
  const handleReceiptSms = () => {
    if (!receiptPhone.trim()) return;
    setReceiptAction(null);
    toast.success(`Receipt sent via SMS to ${receiptPhone}`);
    setReceiptPhone('');
  };

  // ─── Main Render ───
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top Bar */}
      <div
        className="border-border bg-surface flex items-center gap-2.5 border-b"
        style={{ padding: small ? '10px 12px' : '12px 20px' }}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="text-text-muted flex items-center border-none bg-transparent p-1"
        >
          <ChevronLeft size={20} />
        </button>
        <Monitor size={20} className="text-primary shrink-0" />
        <span className="text-text text-base font-bold">Till Management</span>
        <div className="flex-1" />
        <div className="text-text-dim text-xs">
          {todayTills.filter((t) => t.isActive).length} active · {todayTills.filter((t) => !t.isActive).length} closed
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden" style={{ gap: small ? 0 : 16, padding: small ? 0 : 16 }}>
        {(!mobile || mobileView === 'list') && (
          <TillListPanel
            allTills={allTills}
            selectedTillId={selectedTillId}
            unseenUpdates={unseenUpdates}
            COLORS={COLORS}
            bp={bp}
            onSelectTill={selectTill}
            onOpenTillModal={() => setShowOpenTillModal(true)}
            getOrdersForTill={getOrdersForTill}
          />
        )}
        {(!mobile || mobileView === 'detail') && (
          <TillDetailPanel
            selectedTill={selectedTill}
            tillOrdersSorted={tillOrdersSorted}
            paidOrderIds={paidOrderIds}
            COLORS={COLORS}
            bp={bp}
            userName={user?.name ?? 'Staff'}
            showNotifications={showNotifications}
            kitchenNotifs={kitchenNotifs}
            unreadNotifCount={unreadNotifCount}
            showPayment={showPayment}
            showAddOrder={showAddOrder}
            orderType={orderType}
            orderTable={orderTable}
            orderSearch={orderSearch}
            orderItems={orderItems}
            filteredProducts={filteredProducts}
            orderTotal={orderTotal}
            orderItemCount={orderItemCount}
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
            outstandingBalance={outstandingBalance}
            isClosingTill={isClosingTill}
            canApplyDiscount={canApplyDiscount}
            discountType={discountType}
            discountValue={discountValue}
            discountExceedsLimit={discountExceedsLimit}
            discountAmount={discountAmount}
            discountLabel={discountLabel}
            roleMaxDiscountPercent={roleMaxDiscountPercent}
            onMobileBack={() => setMobileView('list')}
            onToggleNotifications={() => {
              setShowNotifications(!showNotifications);
              setShowPayment(false);
              setShowAddOrder(false);
              if (selectedTillId) markOrdersSeen(selectedTillId);
            }}
            onCloseNotifications={() => {
              setShowNotifications(false);
              if (selectedTillId) markOrdersSeen(selectedTillId);
            }}
            onShowAddOrder={() => {
              setShowAddOrder(true);
              setShowPayment(false);
              setShowNotifications(false);
            }}
            onShowPayment={() => {
              resetPayment();
              setShowPayment(true);
              setShowAddOrder(false);
              setShowNotifications(false);
            }}
            onShowReceipt={() => {
              setShowReceipt(true);
              setReceiptAction('preview');
            }}
            onCloseTillClick={() => {
              if (hasUnresolvedOrders) {
                setShowCloseTillConfirm(true);
              } else {
                resetPayment();
                setIsClosingTill(true);
                setShowPayment(true);
                setShowAddOrder(false);
                setShowNotifications(false);
              }
            }}
            onServeOrder={serveOrder}
            onServeOrderItem={serveOrderItem}
            onReturnOrder={(orderId) => {
              setReturningOrderId(orderId);
              setReturnReason('');
            }}
            onCancelOrder={cancelOrder}
            onSetOrderType={setOrderType}
            onSetOrderTable={setOrderTable}
            onSetOrderSearch={setOrderSearch}
            onAddItem={addItemToOrder}
            onUpdateQty={updateOrderItemQty}
            onRemoveItem={removeOrderItem}
            onSendOrder={sendOrder}
            onCancelAddOrder={() => {
              setShowAddOrder(false);
              setOrderItems([]);
              setOrderSearch('');
              setOrderTable('');
              setOrderType('dine_in');
            }}
            onSetPaymentMethod={setPaymentMethod}
            onSetAmountTendered={setAmountTendered}
            onSetCardType={setCardType}
            onSetCardTransNo={setCardTransNo}
            onSetMomoProvider={setMomoProvider}
            onSetMomoPhone={setMomoPhone}
            onSetMomoTransId={setMomoTransId}
            onSetDiscountType={setDiscountType}
            onSetDiscountValue={setDiscountValue}
            onProcessPayment={processPayment}
            onCloseTill={handleCloseTill}
            onPaymentDone={() => {
              setShowPayment(false);
              resetPayment();
            }}
            onPayMore={() => {
              resetPayment();
            }}
            onCancelPayment={() => {
              setShowPayment(false);
              resetPayment();
              if (isClosingTill) {
                setIsClosingTill(false);
                setShowCloseTillConfirm(true);
              }
            }}
          />
        )}
      </div>

      {/* Open Till Modal */}
      {showOpenTillModal && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-5"
          onClick={() => setShowOpenTillModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-border w-full max-w-[400px] rounded-2xl border p-6"
            style={{
              animation: 'modalIn 0.2s ease',
            }}
          >
            <div className="text-text mb-1 text-lg font-bold">Open New Till</div>
            <div className="text-text-dim mb-5 text-xs">Give this till a name so your team can identify it.</div>
            <input
              value={newTillName}
              onChange={(e) => setNewTillName(e.target.value)}
              placeholder="e.g. Bar Till 1, Main Register, Patio"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleOpenTill();
              }}
              className="bg-surface-alt text-text border-border mb-4 box-border w-full rounded-[10px] border-[1.5px] px-3.5 py-3 font-[inherit] text-sm outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowOpenTillModal(false);
                  setNewTillName('');
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" icon={Plus} onClick={handleOpenTill} disabled={!newTillName.trim()}>
                Open Till
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Till Confirm */}
      {showCloseTillConfirm && selectedTill && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-5"
          onClick={() => setShowCloseTillConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-border w-full max-w-[440px] rounded-2xl border p-6"
          >
            <div className="text-text mb-1 text-lg font-bold">Cannot Close Till</div>
            <div className="text-text-dim mb-3 text-[13px]">
              <strong>{selectedTill.name}</strong> has unresolved orders that must be served, cancelled, or rejected
              before closing.
            </div>
            <div className="bg-surface-alt border-border mb-4 rounded-[10px] border p-3.5">
              {unresolvedOrders.filter((o) => o.status === 'pending').length > 0 && (
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-warning">Pending</span>
                  <span className="text-warning font-bold">
                    {unresolvedOrders.filter((o) => o.status === 'pending').length}
                  </span>
                </div>
              )}
              {unresolvedOrders.filter((o) => o.status === 'accepted').length > 0 && (
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-primary">Preparing</span>
                  <span className="text-primary font-bold">
                    {unresolvedOrders.filter((o) => o.status === 'accepted').length}
                  </span>
                </div>
              )}
              {unresolvedOrders.filter((o) => o.status === 'completed').length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-success">Ready (unserved)</span>
                  <span className="text-success font-bold">
                    {unresolvedOrders.filter((o) => o.status === 'completed').length}
                  </span>
                </div>
              )}
            </div>
            <div className="text-text-dim mb-4 text-xs">Resolve all orders above, then try closing again.</div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCloseTillConfirm(false)}>
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview / Print / Email / SMS Modal */}
      {showReceipt && selectedTill && (
        <TillReceiptPreview
          till={selectedTill}
          tillOrders={getOrdersForTill(selectedTill.id)}
          receiptAction={receiptAction}
          receiptEmail={receiptEmail}
          receiptPhone={receiptPhone}
          activeShopName={activeShop?.name}
          activeBranchName={activeBranch?.name}
          activeShopCity={activeShop?.city}
          onSetReceiptAction={setReceiptAction}
          onSetReceiptEmail={setReceiptEmail}
          onSetReceiptPhone={setReceiptPhone}
          onReceiptPrint={handleReceiptPrint}
          onReceiptEmail={handleReceiptEmail}
          onReceiptSms={handleReceiptSms}
          onClose={() => {
            setShowReceipt(false);
            setReceiptAction(null);
          }}
        />
      )}

      {/* Return Order Modal */}
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

            <div className="mb-3">
              <div className="text-text-muted mb-1.5 text-[11px] font-semibold tracking-wide uppercase">
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

            <div className="mb-4">
              <div className="text-text-muted mb-1.5 text-[11px] font-semibold tracking-wide uppercase">Reason</div>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Enter return reason..."
                rows={3}
                className="bg-surface-alt text-text border-border box-border w-full resize-y rounded-[10px] border-[1.5px] px-3 py-2.5 font-[inherit] text-[13px] outline-none"
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
