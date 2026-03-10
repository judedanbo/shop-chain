# Till Payment Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove per-order payment, add till-level multi-payment, gate till closing on unresolved orders, and require payment before closing.

**Architecture:** Inline modifications to `TillManagementPage.tsx` (state, payment panel, order cards, close-till flow, close-till modal). Minor adjustment to `KitchenOrderContext.tsx` to add a `recordTillPayment` function that records a single till-level payment without tying to specific orders.

**Tech Stack:** React, TypeScript, inline styles

---

## Context

The current Till Management has per-order "Pay" buttons on order cards and a bulk payment mode. The design requires:
1. Remove per-order payment — all payments happen at till level
2. Payment panel shows outstanding balance (total order amounts minus total collected) and accepts partial payments
3. Till cannot close if orders are unresolved (pending, accepted/preparing, or completed/ready-unserved)
4. Close Till click → check unresolved orders → show payment panel for outstanding amount → after payment/proceed → close till → show receipt

## Critical Files

- **Modify:** `src/pages/tillManagement/TillManagementPage.tsx`
- **Modify:** `src/context/KitchenOrderContext.tsx` (add `recordTillPayment`)
- **Reference:** `src/types/kitchen.types.ts` (Till, TillPayment, KitchenOrder types)

---

## Task 1: Add `recordTillPayment` to KitchenOrderContext

**File:** `src/context/KitchenOrderContext.tsx`

This new function records a single payment against the till total (not tied to specific orders). It creates one `TillPayment` entry with orderId set to `'TILL'` to indicate it's a till-level payment.

### Step 1: Add the interface

After `RecordBulkPaymentParams` (line 53), add:

```typescript
interface RecordTillPaymentParams {
  tillId: string;
  amount: number;
  method: 'cash' | 'card' | 'momo';
  amountTendered?: number;
  change?: number;
  cardType?: string;
  cardTransNo?: string;
  momoProvider?: string;
  momoPhone?: string;
  momoTransId?: string;
}
```

### Step 2: Add to context value interface

In `KitchenOrderContextValue` (line 55), add after `recordBulkPayment`:

```typescript
recordTillPayment: (params: RecordTillPaymentParams) => void;
```

### Step 3: Implement the function

After the `recordBulkPayment` useCallback (after line 457), add:

```typescript
const recordTillPayment = useCallback((params: RecordTillPaymentParams) => {
  const payment: TillPayment = {
    id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: 'TILL',
    amount: params.amount,
    method: params.method,
    paidAt: new Date().toISOString(),
    amountTendered: params.amountTendered,
    change: params.change,
    cardType: params.cardType,
    cardTransNo: params.cardTransNo,
    momoProvider: params.momoProvider,
    momoPhone: params.momoPhone,
    momoTransId: params.momoTransId,
  };
  setTills(prev => prev.map(t => {
    if (t.id !== params.tillId) return t;
    return {
      ...t,
      totalPayments: t.totalPayments + 1,
      totalPaymentAmount: t.totalPaymentAmount + params.amount,
      payments: [...t.payments, payment],
    };
  }));
  toast.success(`Payment of GH₵ ${params.amount.toFixed(2)} recorded`);
}, [toast]);
```

### Step 4: Add to context provider value

In the `useMemo` that returns the context value, add `recordTillPayment` to the object.

### Step 5: Verify

Run: `npm run typecheck`

### Step 6: Commit

```bash
git add src/context/KitchenOrderContext.tsx
git commit -m "feat: add recordTillPayment to KitchenOrderContext"
```

---

## Task 2: Update state and derived data in TillManagementPage

**File:** `src/pages/tillManagement/TillManagementPage.tsx`

### Step 1: Add `recordTillPayment` to destructuring

At line 73-77, add `recordTillPayment` to the `useKitchenOrders()` destructuring:

```typescript
const {
  tills, openTill, closeTill, placeOrder, recordPayment, recordBulkPayment, recordTillPayment,
  getOrdersForTill, serveOrder, returnOrder,
  unseenUpdates, markOrdersSeen, getKitchenNotificationsForTill,
} = useKitchenOrders();
```

### Step 2: Remove per-order payment state, add closing-till state

Replace the payment state block (lines 96-107) with:

```typescript
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
```

This removes: `payingOrderId`, `isBulkPayment`. Adds: `isClosingTill`.

### Step 3: Add outstanding balance derived data

After line 139 (`payableOrders`), add:

```typescript
// Outstanding balance: total of all order amounts minus total collected
const totalOrderAmount = tillOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
const outstandingBalance = Math.max(0, totalOrderAmount - (selectedTill?.totalPaymentAmount ?? 0));

// Unresolved orders: orders that must be resolved before closing
const unresolvedOrders = tillOrders.filter(o =>
  o.status === 'pending' || o.status === 'accepted' || o.status === 'completed'
);
const hasUnresolvedOrders = unresolvedOrders.length > 0;
```

### Step 4: Simplify `resetPayment`

Replace the `resetPayment` function (lines 244-255):

```typescript
const resetPayment = () => {
  setPaymentMethod(null);
  setAmountTendered('');
  setCardType('');
  setCardTransNo('');
  setMomoProvider('');
  setMomoPhone('');
  setMomoTransId('');
  setPaymentComplete(false);
};
```

### Step 5: Remove `payingOrder`, simplify `payingAmount` and `change`

Remove `payingOrder` (line 257). Replace `bulkPayableOrdersSorted`, `bulkPayingAmount`, `payingAmount`, and `change` (lines 259-268) with:

```typescript
const payingAmount = outstandingBalance;

const change = paymentMethod === 'cash' && amountTendered ? Math.max(0, parseFloat(amountTendered) - payingAmount) : 0;
```

### Step 6: Simplify `canProcessPayment`

Replace lines 270-276. When outstanding is zero (closing-till flow), no payment method is needed:

```typescript
const canProcessPayment = payingAmount === 0 ? true
  : paymentMethod === 'cash'
    ? parseFloat(amountTendered) >= payingAmount
    : paymentMethod === 'card'
      ? cardType.trim() !== '' && cardTransNo.trim() !== ''
      : paymentMethod === 'momo'
        ? momoProvider.trim() !== '' && momoPhone.trim() !== '' && momoTransId.trim() !== ''
        : false;
```

### Step 7: Rewrite `processPayment`

Replace lines 278-315 with:

```typescript
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
```

### Step 8: Update `handleCloseTill`

Replace lines 155-162:

```typescript
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
```

### Step 9: Update `selectTill` to reset closing state

In `selectTill` (lines 164-173), replace with:

```typescript
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
```

### Step 10: Verify

Run: `npm run typecheck`
Expect: may have errors from removed variables still referenced in the render. These will be fixed in Tasks 3 and 4.

### Step 11: Commit (defer to after Task 4 when all references are updated)

---

## Task 3: Remove per-order Pay button from order cards

**File:** `src/pages/tillManagement/TillManagementPage.tsx`

### Step 1: Remove payment-related variables and Pay button from `renderOrderCard`

In `renderOrderCard` (starts at line 414), remove:
- Line 417: `const isPayable = ...` — delete entirely
- Lines 467-478: The `{isPayable && (...)}` block with the Pay button — delete entirely

Keep the `isPaid` badge — it's still useful for visual feedback.

### Step 2: Verify

Run: `npm run typecheck`

---

## Task 4: Rewrite payment panel for till-level payments

**File:** `src/pages/tillManagement/TillManagementPage.tsx`

### Step 1: Rewrite `renderPaymentPanel` (lines 651-906)

Replace the entire function. The new version:

**Success state** (when `paymentComplete` is true):
- Show checkmark and "Payment Recorded"
- Show amount paid
- Show change if cash
- Show till payment summary (total payments, total collected)
- If `isClosingTill`: show "Proceed to Close Till" button (calls `handleCloseTill`)
- If not closing: show "Done" and "Pay More" buttons (Pay More only if outstanding > 0)

**Payment input state** (when `paymentComplete` is false):
- Header: "Process Payment" (or "Close Till — Payment" if `isClosingTill`)
- Cancel button (if closing till, goes back to close-till confirm instead of just hiding)
- Till payment summary banner (total payments collected so far)
- Outstanding balance display: "Outstanding Balance: GH₵ X.XX"
  - If zero: show "All orders paid. Proceed to close." with "Proceed to Close Till" button (if closing) or "Done" (if not closing)
  - If > 0: show payment method selector + method-specific inputs + Process button
- Payment method selector: Cash / Card / MoMo (same UI as current)
- Method-specific inputs: same as current (cash amount tendered with change calc, card type + trans no, momo provider + phone + trans ID)
- Process button: "Process GH₵ X.XX"

The full replacement code for `renderPaymentPanel`:

```typescript
const renderPaymentPanel = () => {
  if (paymentComplete) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: COLORS.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <CheckCircle size={28} style={{ color: COLORS.success }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>Payment Recorded</div>
        <div style={{ fontSize: 14, color: COLORS.textDim, marginBottom: 4 }}>
          GH₵ {payingAmount.toFixed(2)}
        </div>
        {paymentMethod === 'cash' && change > 0 && (
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.success, marginBottom: 12 }}>Change: GH₵ {change.toFixed(2)}</div>
        )}
        {selectedTill && (
          <div style={{ padding: 12, borderRadius: 10, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, marginTop: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4 }}>Till Payment Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: COLORS.text }}>Total Payments</span>
              <span style={{ fontWeight: 700, color: COLORS.text }}>{selectedTill.totalPayments}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
              <span style={{ color: COLORS.text }}>Total Collected</span>
              <span style={{ fontWeight: 700, color: COLORS.success }}>GH₵ {selectedTill.totalPaymentAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {isClosingTill ? (
            <Button variant="primary" icon={XCircle} onClick={handleCloseTill}>
              Proceed to Close Till
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => { setShowPayment(false); resetPayment(); }}>
                Done
              </Button>
              {outstandingBalance > 0 && (
                <Button variant="primary" onClick={() => { resetPayment(); }}>
                  Pay More
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, borderTop: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>
          {isClosingTill ? 'Close Till — Payment' : 'Process Payment'}
        </div>
        <button onClick={() => {
          setShowPayment(false);
          resetPayment();
          if (isClosingTill) { setIsClosingTill(false); setShowCloseTillConfirm(true); }
        }}
          style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: COLORS.danger, cursor: 'pointer', fontFamily: 'inherit' }}>
          {isClosingTill ? 'Back' : 'Cancel'}
        </button>
      </div>

      {/* Till payment summary */}
      {selectedTill && selectedTill.totalPayments > 0 && (
        <div style={{ padding: 10, borderRadius: 8, background: COLORS.successBg, border: `1px solid ${COLORS.success}30`, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: COLORS.success }}>
            <Wallet size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {selectedTill.totalPayments} payment{selectedTill.totalPayments !== 1 ? 's' : ''} recorded
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.success }}>GH₵ {selectedTill.totalPaymentAmount.toFixed(2)}</div>
        </div>
      )}

      {/* Outstanding balance display */}
      <div style={{ padding: 12, borderRadius: 10, background: COLORS.primaryBg, border: `1.5px solid ${COLORS.primary}30`, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Outstanding Balance</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
          <span style={{ color: COLORS.text }}>Amount Due</span>
          <span style={{ color: payingAmount > 0 ? COLORS.primary : COLORS.success }}>GH₵ {payingAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Zero balance — proceed without payment */}
      {payingAmount === 0 ? (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 13, color: COLORS.success, fontWeight: 600, marginBottom: 12 }}>All orders paid</div>
          {isClosingTill ? (
            <Button variant="primary" icon={XCircle} onClick={handleCloseTill} style={{ width: '100%', justifyContent: 'center' }}>
              Proceed to Close Till
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => { setShowPayment(false); resetPayment(); }} style={{ width: '100%', justifyContent: 'center' }}>
              Done
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Payment method selection */}
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment Method</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { key: 'cash' as const, icon: Banknote, label: 'Cash' },
              { key: 'card' as const, icon: CreditCard, label: 'Card' },
              { key: 'momo' as const, icon: Smartphone, label: 'MoMo' },
            ].map(m => {
              const sel = paymentMethod === m.key;
              const Icon = m.icon;
              return (
                <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10,
                    border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                    background: sel ? COLORS.primaryBg : COLORS.surface,
                    color: sel ? COLORS.primary : COLORS.textMuted,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                  <Icon size={18} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Cash fields */}
          {paymentMethod === 'cash' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4 }}>Amount Tendered</label>
              <input type="number" value={amountTendered} onChange={e => setAmountTendered(e.target.value)} placeholder={`Min GH₵ ${payingAmount.toFixed(2)}`}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: COLORS.surface, fontSize: 14, fontWeight: 700, color: COLORS.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              {amountTendered && parseFloat(amountTendered) >= payingAmount && (
                <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: COLORS.success }}>
                  Change: GH₵ {change.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Card fields */}
          {paymentMethod === 'card' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4 }}>Card Type</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {['Visa', 'Mastercard', 'Other'].map(ct => (
                  <button key={ct} onClick={() => setCardType(ct)}
                    style={{
                      flex: 1, padding: '7px 8px', borderRadius: 8,
                      border: `1.5px solid ${cardType === ct ? COLORS.primary : COLORS.border}`,
                      background: cardType === ct ? COLORS.primaryBg : COLORS.surface,
                      color: cardType === ct ? COLORS.primary : COLORS.textMuted,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    {ct}
                  </button>
                ))}
              </div>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4 }}>Transaction Number</label>
              <input value={cardTransNo} onChange={e => setCardTransNo(e.target.value)} placeholder="e.g. TXN-12345"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: COLORS.surface, fontSize: 13, color: COLORS.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          )}

          {/* MoMo fields */}
          {paymentMethod === 'momo' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4 }}>Provider</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {['MTN MoMo', 'Vodafone Cash', 'AirtelTigo'].map(prov => (
                  <button key={prov} onClick={() => setMomoProvider(prov)}
                    style={{
                      flex: 1, padding: '7px 6px', borderRadius: 8,
                      border: `1.5px solid ${momoProvider === prov ? COLORS.primary : COLORS.border}`,
                      background: momoProvider === prov ? COLORS.primaryBg : COLORS.surface,
                      color: momoProvider === prov ? COLORS.primary : COLORS.textMuted,
                      fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    {prov}
                  </button>
                ))}
              </div>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4 }}>Phone Number</label>
              <input value={momoPhone} onChange={e => setMomoPhone(e.target.value)} placeholder="e.g. 024 XXX XXXX"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: COLORS.surface, fontSize: 13, color: COLORS.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10 }} />
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4 }}>Transaction ID</label>
              <input value={momoTransId} onChange={e => setMomoTransId(e.target.value)} placeholder="e.g. MOMO-XXXXXX"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: COLORS.surface, fontSize: 13, color: COLORS.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          )}

          {paymentMethod && (
            <Button variant="primary" icon={CheckCircle} onClick={processPayment} disabled={!canProcessPayment}
              style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14 }}>
              Process GH₵ {payingAmount.toFixed(2)}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
```

### Step 2: Verify

Run: `npm run typecheck`

---

## Task 5: Update detail panel header and close-till modal

**File:** `src/pages/tillManagement/TillManagementPage.tsx`

### Step 1: Update "Payment" button in till header

At line 1149, replace the Payment button `onClick` to remove `isBulkPayment`:

```typescript
<Button variant="secondary" size="sm" icon={CreditCard} onClick={() => { resetPayment(); setShowPayment(true); setShowAddOrder(false); setShowNotifications(false); }}>
  {!small && 'Payment'}
</Button>
```

### Step 2: Update "Close Till" button onClick

At line 1158, replace the Close Till button `onClick` to check for unresolved orders and route to payment panel:

```typescript
<Button variant="danger" size="sm" icon={XCircle} onClick={() => {
  if (hasUnresolvedOrders) {
    setShowCloseTillConfirm(true);
  } else {
    resetPayment();
    setIsClosingTill(true);
    setShowPayment(true);
    setShowAddOrder(false);
    setShowNotifications(false);
  }
}}>
  {!small && 'Close Till'}
</Button>
```

### Step 3: Rewrite close-till confirmation modal

Replace the close-till modal (lines 1235-1274) with a version that always shows unresolved orders and disables the Close button:

```jsx
{showCloseTillConfirm && selectedTill && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
    onClick={() => setShowCloseTillConfirm(false)}>
    <div onClick={e => e.stopPropagation()}
      style={{ background: COLORS.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Cannot Close Till</div>
      <div style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 12 }}>
        <strong>{selectedTill.name}</strong> has unresolved orders that must be served, cancelled, or rejected before closing.
      </div>
      {/* Unresolved orders breakdown */}
      <div style={{ padding: 14, borderRadius: 10, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, marginBottom: 16 }}>
        {unresolvedOrders.filter(o => o.status === 'pending').length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: COLORS.warning }}>Pending</span>
            <span style={{ fontWeight: 700, color: COLORS.warning }}>{unresolvedOrders.filter(o => o.status === 'pending').length}</span>
          </div>
        )}
        {unresolvedOrders.filter(o => o.status === 'accepted').length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: COLORS.primary }}>Preparing</span>
            <span style={{ fontWeight: 700, color: COLORS.primary }}>{unresolvedOrders.filter(o => o.status === 'accepted').length}</span>
          </div>
        )}
        {unresolvedOrders.filter(o => o.status === 'completed').length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: COLORS.success }}>Ready (unserved)</span>
            <span style={{ fontWeight: 700, color: COLORS.success }}>{unresolvedOrders.filter(o => o.status === 'completed').length}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 16 }}>
        Resolve all orders above, then try closing again.
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={() => setShowCloseTillConfirm(false)}>OK</Button>
      </div>
    </div>
  </div>
)}
```

### Step 4: Clean up unused imports and variables

Remove `recordPayment`, `recordBulkPayment` from the `useKitchenOrders()` destructuring if no longer used. Remove `paidOrderIds`, `payableOrders`, `bulkPayableOrdersSorted`, `bulkPayingAmount` derived data since they're no longer needed.

Check that these are truly unused:
- `paidOrderIds` — still used in `renderOrderCard` for the "Paid" badge. **Keep it.**
- `payableOrders` — no longer used after removing per-order payment. **Remove it.**
- `recordPayment` — no longer called. **Remove from destructuring.**
- `recordBulkPayment` — no longer called. **Remove from destructuring.**

### Step 5: Verify

Run: `npm run typecheck`
Expected: Clean pass

### Step 6: Commit all TillManagementPage changes

```bash
git add src/pages/tillManagement/TillManagementPage.tsx src/context/KitchenOrderContext.tsx
git commit -m "feat: till-level multi-payment, close-till gating on unresolved orders"
```

---

## Task 6: Final verification

### Step 1: Run typecheck

```bash
npm run typecheck
```

### Step 2: Run dev server and manually test

```bash
npm run dev
```

Test scenarios:
1. Open Till Management, open a till, place orders
2. Verify no "Pay" button appears on order cards
3. Click "Payment" button in till header — verify outstanding balance shows
4. Make a partial cash payment — verify balance reduces, "Pay More" appears
5. Make another payment (card or MoMo) for remaining balance — verify "All orders paid"
6. With unresolved orders (pending/preparing/ready), click "Close Till" — verify blocked with warning
7. Serve/reject all orders, click "Close Till" — verify payment panel appears
8. With zero balance, verify "Proceed to Close Till" button appears
9. Close the till — verify receipt appears with thermal style
