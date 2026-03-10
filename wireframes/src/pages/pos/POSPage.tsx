import React, { useState } from 'react';
import { ShoppingCart, X, RotateCcw, Clock, FileText, Trash2 } from 'lucide-react';
import { useColors, useShop, useAuth, useNotifications, useToast } from '@/context';
import { DISCOUNT_ROLE_LIMITS } from '@/constants/demoData';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { Button, Badge } from '@/components/ui';
import { ScannerModal } from '@/components/modals';
import { addVerifiableSale } from '@/utils/verifyStore';
import type { Product, Customer, SaleRecord } from '@/types';
import { POSProductGrid } from './POSProductGrid';
import { POSCartPanel } from './POSCartPanel';
import { POSReceipt } from './POSReceipt';
import { POSSalesLog } from './POSSalesLog';
import type { SplitEntry, PaymentMethodType } from './POSPaymentForm';

// ─── Local interfaces ───

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

interface POSPageProps {
  products: Product[];
  customers: Customer[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  salesHistory: SaleRecord[];
  setSalesHistory: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
}

// Generate 12-char cryptographically random alphanumeric token
const VERIFY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateVerifyToken(): string {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => VERIFY_CHARS[b % VERIFY_CHARS.length]).join('');
}

// ─── POSPage ───

export const POSPage: React.FC<POSPageProps> = ({
  products,
  customers = [],
  setCustomers,
  salesHistory,
  setSalesHistory,
}) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { canAdd, showLimitBlock, canAccess, hasFullAccess } = useShop();
  const { currentRole, user, activeShop, activeBranch } = useAuth();
  const { dispatch: notifDispatch } = useNotifications();
  const { toast } = useToast();

  // Discount permissions
  const canApplyDiscount = canAccess('pos_discount');
  const roleMaxDiscountPercent = DISCOUNT_ROLE_LIMITS[currentRole] ?? 0;

  // Reversal permissions
  const canInitiateReversal = canAccess('pos_void');
  const canApproveReversal = hasFullAccess('pos_void');

  const [posScreen, setPosScreen] = useState<'catalog' | 'checkout'>('catalog');
  // Manual discount state
  const [manualDiscountValue, setManualDiscountValue] = useState('');
  const [manualDiscountType, setManualDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(null);
  const [amountTendered, setAmountTendered] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showHeldSheet, setShowHeldSheet] = useState(false);
  // Card payment details
  const [cardType, setCardType] = useState('');
  const [cardTransNo, setCardTransNo] = useState('');
  // MoMo payment details
  const [momoProvider, setMomoProvider] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoRef, setMomoRef] = useState('');
  const cashierName = user?.name ?? 'Cashier';
  const [showPosScanner, setShowPosScanner] = useState(false);
  // Customer selection
  const [posCustomer, setPosCustomer] = useState<string | null>(null);
  const [showCustPicker, setShowCustPicker] = useState(false);
  const [custSearch, setCustSearch] = useState('');
  const [showQuickAddCust, setShowQuickAddCust] = useState(false);
  const [quickCustForm, setQuickCustForm] = useState({ name: '', phone: '' });
  // Split payment
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState<SplitEntry[]>([]);
  // Sales history (lifted to App.tsx)
  const [receiptNo, setReceiptNo] = useState(
    () =>
      `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
  );
  const [currentVerifyToken, setCurrentVerifyToken] = useState(generateVerifyToken);
  const [showSalesLog, setShowSalesLog] = useState(false);
  // Reversal state
  const [showReversalModal, setShowReversalModal] = useState<SaleRecord | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [showPendingReversals, setShowPendingReversals] = useState(false);

  const mobile = isMobile(bp);

  const filtered = products.filter((p) => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    return matchCat && matchSearch && p.stock > 0;
  });

  const categories = ['All', ...new Set(products.map((p) => p.category))];

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        if (exists.qty >= product.stock) return prev;
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
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

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  // Tax rate — default 12.5%; will come from shop settings when settings context is implemented
  const taxRate = 0.125;
  const tax = subtotal * taxRate;

  // Manual discount — clamped to role limit
  const rawDiscountVal = parseFloat(manualDiscountValue) || 0;
  let discount = 0;
  let discountLabel = 'Discount';
  if (canApplyDiscount && rawDiscountVal > 0) {
    if (manualDiscountType === 'percent') {
      const clampedPct = Math.min(rawDiscountVal, roleMaxDiscountPercent);
      discount = (subtotal * clampedPct) / 100;
      discountLabel = `Discount (${clampedPct}%)`;
    } else {
      // Fixed amount — also ensure effective % doesn't exceed role limit
      const maxByRole = (subtotal * roleMaxDiscountPercent) / 100;
      discount = Math.min(rawDiscountVal, maxByRole);
      discountLabel = `Discount (GH₵ ${discount.toFixed(2)})`;
    }
    discount = Math.min(discount, subtotal); // never exceed subtotal
  }
  const discountExceedsLimit =
    canApplyDiscount &&
    rawDiscountVal > 0 &&
    ((manualDiscountType === 'percent' && rawDiscountVal > roleMaxDiscountPercent) ||
      (manualDiscountType === 'fixed' && subtotal > 0 && rawDiscountVal > (subtotal * roleMaxDiscountPercent) / 100));

  const total = subtotal + tax - discount;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const change = amountTendered ? parseFloat(amountTendered) - total : 0;

  // Reversal computed values
  const activeSales = salesHistory.filter((s) => s.status === 'completed');
  const reversedSales = salesHistory.filter((s) => s.status === 'reversed');
  const pendingReversals = salesHistory.filter((s) => s.status === 'pending_reversal');

  // Split payment helpers
  const MOMO_LABELS: Record<string, string> = {
    mtn: 'MTN MoMo',
    tcash: 'TCash',
    atcash: 'ATCash',
    gmoney: 'G-Money',
  };
  const splitTotal = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
  const splitRemaining = total - splitTotal;
  const addSplit = () => setSplits((prev) => [...prev, { method: 'cash', amount: prev.length === 0 ? '' : '' }]);
  const removeSplit = (idx: number) => setSplits((prev) => prev.filter((_, i) => i !== idx));
  const updateSplit = (idx: number, patch: Partial<SplitEntry>) =>
    setSplits((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const isSplitEntryValid = (sp: SplitEntry) => {
    const amt = parseFloat(sp.amount);
    if (!amt || amt <= 0) return false;
    if (sp.method === 'cash') return !!(sp.amountTendered && parseFloat(sp.amountTendered) >= amt);
    if (sp.method === 'card') return !!(sp.cardType && sp.cardTransNo?.trim());
    if (sp.method === 'momo') return !!(sp.momoProvider && sp.momoPhone?.trim() && sp.momoRef?.trim());
    return false;
  };
  const canPaySplit =
    splitMode && splits.length >= 2 && splits.every(isSplitEntryValid) && Math.abs(splitRemaining) < 0.01;

  const holdOrder = () => {
    if (cart.length === 0) return;
    setHeldOrders((prev) => [
      ...prev,
      {
        id: Date.now(),
        items: [...cart],
        time: new Date().toLocaleTimeString(),
        discountValue: manualDiscountValue,
        discountType: manualDiscountType,
      },
    ]);
    setCart([]);
    setManualDiscountValue('');
    setManualDiscountType('percent');
  };

  const recallOrder = (orderId: number) => {
    const order = heldOrders.find((o) => o.id === orderId);
    if (order) {
      setCart(order.items);
      setManualDiscountValue(order.discountValue);
      setManualDiscountType(order.discountType);
      setHeldOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  // ─── Reversal functions ───
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

    // Reverse customer stats if sale had a linked customer
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

    // Notify: direct reversal by manager/owner or approved reversal
    if (sale.reversalRequestedBy) {
      notifDispatch.reversalApproved(approver || currentRole, currentRole, saleId, sale.reversalRequestedBy);
    } else {
      notifDispatch.reversalDirect(cashierName, currentRole, saleId, sale.total, reason || 'No reason provided');
    }

    setShowReversalModal(null);
    setReversalReason('');
  };

  const requestReversal = (saleId: string, reason: string) => {
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

    // Notify managers about reversal request
    const reqSale = salesHistory.find((s) => s.id === saleId);
    if (reqSale) {
      notifDispatch.reversalRequested(cashierName, currentRole, saleId, reqSale.total, reason);
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
      notifDispatch.reversalRejected(cashierName, currentRole, saleId, rejSale.reversalRequestedBy);
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

  const selectedCust = posCustomer ? customers.find((c) => c.id === posCustomer) || null : null;

  const handlePayment = () => {
    if (canAdd && !canAdd('transactions')) {
      showLimitBlock && showLimitBlock('Monthly Transactions');
      return;
    }

    if (splitMode && canPaySplit) {
      // Build split sale record
      const splitDetails = splits.map((sp) => {
        const amt = parseFloat(sp.amount) || 0;
        const label =
          sp.method === 'cash'
            ? 'Cash'
            : sp.method === 'card'
              ? sp.cardType || 'Card'
              : MOMO_LABELS[sp.momoProvider || ''] || 'MoMo';
        const detail =
          sp.method === 'cash'
            ? `Tendered: GH₵ ${parseFloat(sp.amountTendered || '0').toFixed(2)}`
            : sp.method === 'card'
              ? `${sp.cardType} · ${sp.cardTransNo}`
              : `${MOMO_LABELS[sp.momoProvider || '']} · ${sp.momoPhone} · Ref: ${sp.momoRef}`;
        return { method: sp.method, label, amount: amt, detail };
      });
      const sale: SaleRecord = {
        id: receiptNo,
        date: new Date().toISOString(),
        items: cart.map((i) => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          price: i.price,
        })),
        itemCount: totalItems,
        subtotal,
        tax,
        discount,
        discountType: manualDiscountType,
        discountInput: rawDiscountVal,
        total,
        paymentMethod: 'split',
        payLabel: `Split (${splits.length})`,
        cashier: cashierName,
        customerId: posCustomer || null,
        customerName: selectedCust ? selectedCust.name : 'Walk-in',
        customerPhone: selectedCust ? selectedCust.phone : null,
        splits: splitDetails,
        verifyToken: currentVerifyToken,
        status: 'completed',
      };
      setSalesHistory((prev) => [sale, ...prev]);
      addVerifiableSale(sale);
    } else {
      if (!paymentMethod) return;
      const momoProviderLabels: Record<string, string> = {
        mtn: 'MTN MoMo',
        tcash: 'TCash',
        atcash: 'ATCash',
        gmoney: 'G-Money',
      };
      const payLabel =
        paymentMethod === 'cash'
          ? 'Cash'
          : paymentMethod === 'card'
            ? cardType
            : momoProviderLabels[momoProvider] || 'MoMo';
      const sale: SaleRecord = {
        id: receiptNo,
        date: new Date().toISOString(),
        items: cart.map((i) => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          price: i.price,
        })),
        itemCount: totalItems,
        subtotal,
        tax,
        discount,
        discountType: manualDiscountType,
        discountInput: rawDiscountVal,
        total,
        paymentMethod,
        payLabel,
        cashier: cashierName,
        customerId: posCustomer || null,
        customerName: selectedCust ? selectedCust.name : 'Walk-in',
        customerPhone: selectedCust ? selectedCust.phone : null,
        ...(paymentMethod === 'cash' ? { amountTendered: parseFloat(amountTendered), change } : {}),
        ...(paymentMethod === 'card' ? { cardType, cardTransNo } : {}),
        ...(paymentMethod === 'momo' ? { momoProvider, momoPhone, momoRef } : {}),
        verifyToken: currentVerifyToken,
        status: 'completed' as const,
      };
      setSalesHistory((prev) => [sale, ...prev]);
      addVerifiableSale(sale);
    }

    // Update customer stats if assigned
    if (posCustomer && setCustomers) {
      setCustomers((prev: Customer[]) =>
        prev.map((c) =>
          c.id === posCustomer
            ? {
                ...c,
                totalSpent: c.totalSpent + total,
                visits: c.visits + 1,
                lastVisit: new Date().toISOString().slice(0, 10),
                loyaltyPts: (c.loyaltyPts || 0) + Math.floor(total / 10),
              }
            : c,
        ),
      );
    }
    // Dispatch notification if discount was applied
    if (discount > 0 && rawDiscountVal > 0) {
      const effectivePercent =
        manualDiscountType === 'percent'
          ? Math.min(rawDiscountVal, roleMaxDiscountPercent)
          : subtotal > 0
            ? Math.round((discount / subtotal) * 100)
            : 0;
      notifDispatch.discountApplied(cashierName, currentRole, effectivePercent, discount, receiptNo);
    }

    setShowReceipt(true);
  };

  const resetAll = () => {
    setCart([]);
    setPaymentMethod(null);
    setShowReceipt(false);
    setAmountTendered('');
    setCardType('');
    setCardTransNo('');
    setMomoProvider('');
    setMomoPhone('');
    setMomoRef('');
    setSplitMode(false);
    setSplits([]);
    setManualDiscountValue('');
    setManualDiscountType('percent');
    setShowReversalModal(null);
    setReversalReason('');
    setShowPendingReversals(false);
    setPosScreen('catalog');
    setPosCustomer(null);
    setReceiptNo(
      `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    );
    setCurrentVerifyToken(generateVerifyToken());
  };

  // Update latest sale record when customer changes on receipt page
  const updateSaleCustomer = (custId: string | null) => {
    const cust = custId ? customers.find((c) => c.id === custId) : null;
    setSalesHistory((prev) => {
      if (prev.length === 0) return prev;
      const latest = prev[0];
      if (!latest) return prev;
      const rest = prev.slice(1);
      // If switching from no-customer to customer, update customer stats
      if (custId && !latest.customerId && setCustomers) {
        setCustomers((p: Customer[]) =>
          p.map((c) =>
            c.id === custId
              ? {
                  ...c,
                  totalSpent: c.totalSpent + latest.total,
                  visits: c.visits + 1,
                  lastVisit: new Date().toISOString().slice(0, 10),
                  loyaltyPts: (c.loyaltyPts || 0) + Math.floor(latest.total / 10),
                }
              : c,
          ),
        );
      }
      // If switching from customer to no-customer, revert stats
      if (!custId && latest.customerId && setCustomers) {
        const oldCustId = latest.customerId;
        setCustomers((p: Customer[]) =>
          p.map((c) =>
            c.id === oldCustId
              ? {
                  ...c,
                  totalSpent: Math.max(0, c.totalSpent - latest.total),
                  visits: Math.max(0, c.visits - 1),
                  loyaltyPts: Math.max(0, (c.loyaltyPts || 0) - Math.floor(latest.total / 10)),
                }
              : c,
          ),
        );
      }
      return [
        {
          ...latest,
          customerId: custId,
          customerName: cust ? cust.name : 'Walk-in',
          customerPhone: cust ? cust.phone : null,
        },
        ...rest,
      ];
    });
  };

  const handleQuickAddCust = () => {
    if (!quickCustForm.name.trim() || !quickCustForm.phone.trim()) return;
    const newId = `CUS-${String((customers?.length || 0) + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      id: newId,
      name: quickCustForm.name.trim(),
      phone: quickCustForm.phone.trim(),
      email: '',
      type: 'walk-in',
      notes: '',
      totalSpent: 0,
      visits: 0,
      lastVisit: null,
      createdAt: new Date().toISOString().slice(0, 10),
      loyaltyPts: 0,
    };
    if (setCustomers) setCustomers((prev: Customer[]) => [newCust, ...prev]);
    setPosCustomer(newId);
    if (showReceipt) updateSaleCustomer(newId);
    setShowQuickAddCust(false);
    setShowCustPicker(false);
    setQuickCustForm({ name: '', phone: '' });
  };

  const canPay = splitMode
    ? canPaySplit
    : paymentMethod &&
      ((paymentMethod === 'cash' && amountTendered && parseFloat(amountTendered) >= total) ||
        (paymentMethod === 'card' && cardType && cardTransNo.trim()) ||
        (paymentMethod === 'momo' && momoProvider && momoPhone.trim() && momoRef.trim()));

  // ─── Receipt Screen ───
  if (showReceipt) {
    return (
      <POSReceipt
        cart={cart}
        totalItems={totalItems}
        subtotal={subtotal}
        tax={tax}
        discount={discount}
        discountLabel={discountLabel}
        total={total}
        change={change}
        receiptNo={receiptNo}
        currentVerifyToken={currentVerifyToken}
        cashierName={cashierName}
        paymentMethod={paymentMethod}
        amountTendered={amountTendered}
        cardType={cardType}
        cardTransNo={cardTransNo}
        momoProvider={momoProvider}
        momoPhone={momoPhone}
        momoRef={momoRef}
        latestSale={salesHistory[0]}
        selectedCust={selectedCust}
        setPosCustomer={setPosCustomer}
        showCustPicker={showCustPicker}
        setShowCustPicker={setShowCustPicker}
        custSearch={custSearch}
        setCustSearch={setCustSearch}
        showQuickAddCust={showQuickAddCust}
        setShowQuickAddCust={setShowQuickAddCust}
        quickCustForm={quickCustForm}
        setQuickCustForm={setQuickCustForm}
        handleQuickAddCust={handleQuickAddCust}
        customers={customers}
        updateSaleCustomer={updateSaleCustomer}
        shopName={activeShop?.name ?? 'SHOPCHAIN'}
        branchName={activeBranch?.name}
        shopCity={activeShop?.city ?? 'Accra'}
        canInitiateReversal={canInitiateReversal}
        handleReverseSale={handleReverseSale}
        resetAll={resetAll}
        toast={toast}
        COLORS={COLORS}
      />
    );
  }

  // ─── Mobile Checkout Overlay ───
  if (mobile && posScreen === 'checkout') {
    return (
      <div className="bg-surface z-modal-backdrop fixed inset-0">
        <POSCartPanel
          isOverlay
          cart={cart}
          totalItems={totalItems}
          subtotal={subtotal}
          tax={tax}
          discount={discount}
          discountLabel={discountLabel}
          total={total}
          updateQty={updateQty}
          removeFromCart={removeFromCart}
          setCart={setCart}
          holdOrder={holdOrder}
          recallOrder={recallOrder}
          setPosScreen={setPosScreen}
          heldOrders={heldOrders}
          selectedCust={selectedCust}
          posCustomer={posCustomer}
          setPosCustomer={setPosCustomer}
          showCustPicker={showCustPicker}
          setShowCustPicker={setShowCustPicker}
          custSearch={custSearch}
          setCustSearch={setCustSearch}
          showQuickAddCust={showQuickAddCust}
          setShowQuickAddCust={setShowQuickAddCust}
          quickCustForm={quickCustForm}
          setQuickCustForm={setQuickCustForm}
          handleQuickAddCust={handleQuickAddCust}
          customers={customers}
          canApplyDiscount={canApplyDiscount}
          roleMaxDiscountPercent={roleMaxDiscountPercent}
          manualDiscountValue={manualDiscountValue}
          setManualDiscountValue={setManualDiscountValue}
          manualDiscountType={manualDiscountType}
          setManualDiscountType={setManualDiscountType}
          discountExceedsLimit={discountExceedsLimit}
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
          canPay={!!canPay}
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
    );
  }

  // ─── Main POS Layout ───
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - ' + (mobile ? '132' : '64') + 'px)' }}>
      {/* POS Header Bar */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 md:mb-[14px]">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary-bg flex size-9 items-center justify-center rounded-[10px] md:size-[42px]">
            <ShoppingCart size={mobile ? 18 : 22} className="text-primary" />
          </div>
          <div>
            <div className="text-text text-[16px] font-bold md:text-[20px]">Point of Sale</div>
            <div className="text-text-dim text-[11px]">
              Cashier: {cashierName}{' '}
              {new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {salesHistory.length > 0 && (
            <div
              onClick={() => setShowSalesLog(true)}
              className="border-border bg-surface text-text-muted flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-[5px] text-[11px] font-semibold"
            >
              <FileText size={13} /> {salesHistory.length} Sales
            </div>
          )}
          {heldOrders.length > 0 && <Badge color="warning">{heldOrders.length} held</Badge>}
          <Badge color="neutral">{products.filter((p) => p.stock > 0).length} products</Badge>
        </div>
      </div>

      {/* Sales Log Modal */}
      {showSalesLog && (
        <POSSalesLog
          salesHistory={salesHistory}
          showSalesLog={showSalesLog}
          setShowSalesLog={setShowSalesLog}
          activeSales={activeSales}
          reversedSales={reversedSales}
          pendingReversals={pendingReversals}
          showPendingReversals={showPendingReversals}
          setShowPendingReversals={setShowPendingReversals}
          canInitiateReversal={canInitiateReversal}
          canApproveReversal={canApproveReversal}
          currentRole={currentRole}
          handleReverseSale={handleReverseSale}
          executeReversal={executeReversal}
          rejectReversal={rejectReversal}
          COLORS={COLORS}
        />
      )}

      {/* Split Layout */}
      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden md:gap-4">
        {/* Left: Product Catalog */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <POSProductGrid
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            categories={categories}
            filtered={filtered}
            products={products}
            cart={cart}
            addToCart={addToCart}
            setShowPosScanner={setShowPosScanner}
            COLORS={COLORS}
          />

          {/* Mobile Floating Cart Button */}
          {mobile && cart.length > 0 && (
            <div
              onClick={() => setPosScreen('checkout')}
              className="z-pos-float fixed right-4 left-4 flex cursor-pointer items-center justify-center gap-2.5 rounded-[14px] px-5 py-3.5 text-white transition-[bottom] duration-[0.25s] ease-[ease]"
              style={{
                bottom: heldOrders.length > 0 ? 116 : 72,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                boxShadow: `0 6px 24px ${COLORS.primary}50`,
              }}
            >
              <ShoppingCart size={18} />
              <span className="text-sm font-bold">Checkout \u2014 GH₵ {subtotal.toFixed(2)}</span>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
                {totalItems}
              </div>
            </div>
          )}

          {/* Mobile Held Orders Floating Button */}
          {mobile && heldOrders.length > 0 && (
            <div
              onClick={() => setShowHeldSheet(true)}
              className="bg-surface border-warning/[0.31] z-pos-float-bar fixed right-4 bottom-[72px] left-4 flex cursor-pointer items-center justify-between rounded-xl border-[1.5px] px-4 py-2.5"
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              }}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-warning" />
                <span className="text-text text-[13px] font-bold">
                  {heldOrders.length} Held Order
                  {heldOrders.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-primary text-[11px] font-semibold">Tap to view \u2192</div>
            </div>
          )}

          {/* Mobile Held Orders Bottom Sheet */}
          {mobile && showHeldSheet && (
            <>
              <div
                onClick={() => setShowHeldSheet(false)}
                className="z-modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-[2px]"
              />
              <div
                className="bg-surface z-modal fixed right-0 bottom-0 left-0 flex max-h-[70vh] flex-col rounded-t-[18px]"
                style={{
                  boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
                  animation: 'modalIn 0.25s ease',
                }}
              >
                {/* Handle */}
                <div className="flex justify-center pt-2.5 pb-1">
                  <div className="bg-border h-1 w-9 rounded-sm" />
                </div>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-2 pb-3.5">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-warning" />
                    <span className="text-text text-base font-bold">Held Orders</span>
                    <Badge color="warning">{heldOrders.length}</Badge>
                  </div>
                  <div
                    onClick={() => setShowHeldSheet(false)}
                    className="bg-surface-alt flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg"
                  >
                    <X size={16} className="text-text-muted" />
                  </div>
                </div>
                {/* Orders List */}
                <div className="flex-1 overflow-y-auto px-4 pb-5">
                  {heldOrders.length === 0 ? (
                    <div className="text-text-dim p-[30px] text-center text-[13px]">No held orders</div>
                  ) : (
                    heldOrders.map((o, idx) => (
                      <div key={o.id} className="bg-surface-alt border-border mb-2.5 rounded-xl border p-3.5">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge color="warning">Hold #{idx + 1}</Badge>
                            <span className="text-text-dim text-[11px]">
                              {'\u{1F550}'} {o.time}
                            </span>
                          </div>
                          <span className="text-text font-mono text-xs font-bold">
                            GH₵ {o.items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="mb-2.5">
                          {o.items.map((i) => (
                            <div key={i.id} className="text-text-muted flex justify-between py-[2px] text-[11px]">
                              <span>
                                {i.name} \u00D7 {i.qty}
                              </span>
                              <span className="font-mono">GH₵ {(i.price * i.qty).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={RotateCcw}
                            onClick={() => {
                              recallOrder(o.id);
                              setShowHeldSheet(false);
                            }}
                            className="flex-1 justify-center"
                          >
                            Recall
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Discard held order with ${o.items.length} item${o.items.length !== 1 ? 's' : ''}? This cannot be undone.`,
                                )
                              ) {
                                setHeldOrders((prev) => prev.filter((h) => h.id !== o.id));
                              }
                            }}
                            className="text-danger"
                          >
                            Discard
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Cart Panel (Desktop only) */}
        {!mobile && (
          <div className="bg-surface border-border xl2:w-[400px] flex w-[320px] shrink-0 flex-col overflow-hidden rounded-[14px] border lg:w-[360px]">
            <POSCartPanel
              cart={cart}
              totalItems={totalItems}
              subtotal={subtotal}
              tax={tax}
              discount={discount}
              discountLabel={discountLabel}
              total={total}
              updateQty={updateQty}
              removeFromCart={removeFromCart}
              setCart={setCart}
              holdOrder={holdOrder}
              recallOrder={recallOrder}
              setPosScreen={setPosScreen}
              heldOrders={heldOrders}
              selectedCust={selectedCust}
              posCustomer={posCustomer}
              setPosCustomer={setPosCustomer}
              showCustPicker={showCustPicker}
              setShowCustPicker={setShowCustPicker}
              custSearch={custSearch}
              setCustSearch={setCustSearch}
              showQuickAddCust={showQuickAddCust}
              setShowQuickAddCust={setShowQuickAddCust}
              quickCustForm={quickCustForm}
              setQuickCustForm={setQuickCustForm}
              handleQuickAddCust={handleQuickAddCust}
              customers={customers}
              canApplyDiscount={canApplyDiscount}
              roleMaxDiscountPercent={roleMaxDiscountPercent}
              manualDiscountValue={manualDiscountValue}
              setManualDiscountValue={setManualDiscountValue}
              manualDiscountType={manualDiscountType}
              setManualDiscountType={setManualDiscountType}
              discountExceedsLimit={discountExceedsLimit}
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
              canPay={!!canPay}
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

      <ScannerModal
        isOpen={showPosScanner}
        onClose={() => setShowPosScanner(false)}
        products={products}
        mode="search"
        onScan={(result) => {
          if (typeof result === 'object' && 'notFound' in result && result.notFound) {
            setSearch(result.code);
          } else if (typeof result === 'object' && 'id' in result) {
            addToCart(result);
          }
        }}
      />

      {/* ─── Reversal Confirmation Modal ─── */}
      {showReversalModal && (
        <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div
            className="border-border bg-surface w-full max-w-[420px] overflow-hidden rounded-2xl border-[1.5px]"
            style={{ animation: 'modalIn 0.2s ease' }}
          >
            {/* Header */}
            <div className="border-border flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-danger" />
                <span className="text-text text-base font-[800]">
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
                    {showReversalModal.id} · {showReversalModal.itemCount} items · {showReversalModal.payLabel}
                  </div>
                  <div className="text-text-dim text-[10px]">
                    {new Date(showReversalModal.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    {new Date(showReversalModal.date).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-danger font-mono text-xl font-black">GH₵ {showReversalModal.total.toFixed(2)}</div>
              </div>
            </div>

            {/* Reason Input */}
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
};
