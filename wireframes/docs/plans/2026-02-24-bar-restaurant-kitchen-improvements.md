# Bar/Restaurant, Kitchen & POS Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve Bar/Restaurant and Kitchen pages with shop name titles, bill calculation fixes, per-till discounts, item-level serving, and pending order cancellation.

**Architecture:** Extend existing types (`KitchenOrderStatus`, `KitchenOrderItem`, `Till`) with new fields. Add `cancelOrder` and `serveOrderItem` methods to `KitchenOrderContext`. Update UI components in BarPOS, Kitchen, and TillManagement pages. No new files needed.

**Tech Stack:** React 19, TypeScript (strict mode), inline styles, Vite

---

### Task 1: Extend Types — Add `cancelled` status and item-level serving fields

**Files:**
- Modify: `src/types/kitchen.types.ts`

**Step 1: Add `cancelled` to `KitchenOrderStatus` and new fields**

In `src/types/kitchen.types.ts`, make these changes:

Line 1 — extend the status union:
```typescript
export type KitchenOrderStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'served' | 'returned' | 'cancelled';
```

Lines 5-10 — add item-level serving fields to `KitchenOrderItem`:
```typescript
export interface KitchenOrderItem {
  productId: string;
  name: string;
  qty: number;
  notes?: string;
  itemStatus?: 'pending' | 'served';
  servedAt?: string;
}
```

After line 31 (end of `KitchenOrder`) — add cancellation fields:
```typescript
export interface KitchenOrder {
  // ... existing fields ...
  cancelledAt?: string;
  cancelledBy?: string;
}
```

Add discount fields to `Till` interface (after `closedAt?`):
```typescript
export interface Till {
  // ... existing fields ...
  discount?: number;
  discountType?: 'percent' | 'fixed';
  discountInput?: number;
}
```

**Step 2: Verify types compile**

Run: `npm run typecheck`
Expected: PASS (new optional fields are backwards-compatible)

**Step 3: Commit**

```bash
git add src/types/kitchen.types.ts
git commit -m "feat: extend kitchen types with cancelled status, item serving, and till discount fields"
```

---

### Task 2: Add `cancelOrder` and `serveOrderItem` to KitchenOrderContext

**Files:**
- Modify: `src/context/KitchenOrderContext.tsx`

**Step 1: Add `cancelOrder` and `serveOrderItem` to the context interface**

In `KitchenOrderContextValue` interface (around line 68), add after the `returnOrder` line:
```typescript
cancelOrder: (id: string, cancelledBy: string) => void;
serveOrderItem: (orderId: string, productId: string) => void;
```

**Step 2: Implement `cancelOrder`**

After the `returnOrder` callback (around line 347), add:
```typescript
const cancelOrder = useCallback((id: string, cancelledBy: string) => {
  setOrders(prev => {
    const order = prev.find(o => o.id === id);
    if (!order || order.status !== 'pending') return prev;
    return prev.map(o => {
      if (o.id !== id) return o;
      return { ...o, status: 'cancelled' as const, cancelledAt: new Date().toISOString(), cancelledBy };
    });
  });
  toast.success(`Order ${id} cancelled`);
}, [toast]);
```

**Step 3: Implement `serveOrderItem`**

After the `cancelOrder` callback, add:
```typescript
const serveOrderItem = useCallback((orderId: string, productId: string) => {
  setOrders(prev => prev.map(o => {
    if (o.id !== orderId) return o;
    const updatedItems = o.items.map(item =>
      item.productId === productId && item.itemStatus !== 'served'
        ? { ...item, itemStatus: 'served' as const, servedAt: new Date().toISOString() }
        : item
    );
    // Auto-mark order as served when all items are served
    const allServed = updatedItems.every(item => item.itemStatus === 'served');
    if (allServed && (o.status === 'completed' || o.status === 'accepted')) {
      return { ...o, items: updatedItems, status: 'served' as const, servedAt: new Date().toISOString() };
    }
    return { ...o, items: updatedItems };
  }));
}, []);
```

**Step 4: Update `placeOrder` to set `itemStatus` on bar items**

In the `placeOrder` callback, when creating bar items for the barOrder, set their `itemStatus` to `'served'`:

Find the bar order creation (around line 249, inside `params.barItems` block). Change:
```typescript
items: params.barItems,
```
to:
```typescript
items: params.barItems.map(item => ({ ...item, itemStatus: 'served' as const, servedAt: now })),
```

For kitchen items (around line 269), set `itemStatus: 'pending'`:
```typescript
items: params.items.map(item => ({ ...item, itemStatus: 'pending' as const })),
```

**Step 5: Add to the value object and useMemo deps**

In the `value` useMemo (around line 515), add `cancelOrder` and `serveOrderItem` to both the object and the dependency array.

**Step 6: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 7: Commit**

```bash
git add src/context/KitchenOrderContext.tsx
git commit -m "feat: add cancelOrder and serveOrderItem to KitchenOrderContext"
```

---

### Task 3: Page Titles — Show Shop Name

**Files:**
- Modify: `src/pages/barPos/BarPOSPage.tsx`
- Modify: `src/pages/kitchen/KitchenDisplayPage.tsx`

**Step 1: BarPOSPage — use shop name**

The component already imports `useAuth` (line 7). `useAuth` returns `activeShop`.

Line 38 already destructures from `useAuth()`:
```typescript
const { user } = useAuth();
```
Change to:
```typescript
const { user, activeShop } = useAuth();
```

Line 251 (empty state heading):
Change `Bar & Restaurant POS` to `{activeShop?.name ?? 'Bar & Restaurant POS'}`

Line 265 (top bar title):
Change `Bar & Restaurant` to `{activeShop?.name ?? 'Bar & Restaurant'}`

**Step 2: KitchenDisplayPage — use shop name**

Add `useAuth` to imports (line 6):
```typescript
import { useColors, useKitchenOrders, useAuth } from '@/context';
```

At the top of the component (after line 38), add:
```typescript
const { activeShop } = useAuth();
```

Line 127 (empty state heading):
Change `Kitchen Display` to `{activeShop?.name ? `${activeShop.name} Kitchen` : 'Kitchen Display'}`

Line 140 (top bar title):
Change `Kitchen Display` to `{activeShop?.name ? `${activeShop.name} Kitchen` : 'Kitchen Display'}`

**Step 3: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/barPos/BarPOSPage.tsx src/pages/kitchen/KitchenDisplayPage.tsx
git commit -m "feat: show shop name as page title for Bar/Restaurant and Kitchen"
```

---

### Task 4: Bill Calculation — Exclude Rejected and Cancelled Orders

**Files:**
- Modify: `src/pages/tillManagement/TillManagementPage.tsx`

**Step 1: Fix `totalOrderAmount` calculation**

Line 139:
```typescript
const totalOrderAmount = tillOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
```
Change to:
```typescript
const totalOrderAmount = tillOrders
  .filter(o => o.status !== 'rejected' && o.status !== 'cancelled')
  .reduce((sum, o) => sum + (o.total ?? 0), 0);
```

**Step 2: Fix unresolved orders to exclude cancelled**

Line 143-145:
```typescript
const unresolvedOrders = tillOrders.filter(o =>
  o.status === 'pending' || o.status === 'accepted' || o.status === 'completed'
);
```
This is already correct — it doesn't include `cancelled`. No change needed.

**Step 3: Add `cancelled` to status styling**

In `getStatusStyle` function (line 34-43), add after the `returned` entry:
```typescript
cancelled: { bg: COLORS.dangerBg, text: COLORS.danger, label: 'Cancelled' },
```

**Step 4: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/tillManagement/TillManagementPage.tsx
git commit -m "fix: exclude rejected and cancelled orders from till bill totals"
```

---

### Task 5: Waiter Cancellation — BarPOS and TillOrdersDrawer

**Files:**
- Modify: `src/pages/barPos/BarPOSPage.tsx`
- Modify: `src/pages/barPos/TillOrdersDrawer.tsx`

**Step 1: BarPOSPage — destructure `cancelOrder`**

Line 41, add `cancelOrder` to the destructured context:
```typescript
const { tills, openTill, closeTill, placeOrder, getOrdersForTill, holdOrder, resumeOrder, discardHeldOrder, getHeldOrdersForTill, unseenUpdates, markOrdersSeen, cancelOrder } = useKitchenOrders();
```

No additional UI needed in BarPOSPage itself — the cancel button goes in TillOrdersDrawer.

**Step 2: TillOrdersDrawer — add cancel functionality**

Add `Ban` icon to imports (line 2):
```typescript
import { X, Clock, AlertCircle, Pause, Play, Trash2, CheckCircle, RotateCcw, Ban } from 'lucide-react';
```

Add `useAuth` to context imports (line 3):
```typescript
import { useColors, useKitchenOrders, useAuth } from '@/context';
```

In the component (line 28), destructure `cancelOrder`:
```typescript
const { serveOrder, returnOrder, cancelOrder } = useKitchenOrders();
const { user } = useAuth();
```

In `statusColors` (line 58-65), add the cancelled entry after `returned`:
```typescript
cancelled: { bg: COLORS.dangerBg, text: COLORS.danger, label: 'Cancelled' },
```

After the existing `{order.status === 'completed' && (...)}` action buttons block (line 95-104), add a cancel button for pending orders:
```typescript
{order.status === 'pending' && (
  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
    <Button variant="danger" size="sm" icon={Ban} onClick={() => cancelOrder(order.id, user?.name ?? 'Staff')} style={{ flex: 1, justifyContent: 'center' }}>
      Cancel Order
    </Button>
  </div>
)}
```

After the rejection reason display (line 80-84), add a cancelled order display:
```typescript
{order.status === 'cancelled' && order.cancelledBy && (
  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: COLORS.dangerBg, fontSize: 11, color: COLORS.danger }}>
    <Ban size={10} style={{ marginRight: 4 }} /> Cancelled by {order.cancelledBy}
  </div>
)}
```

**Step 3: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/barPos/BarPOSPage.tsx src/pages/barPos/TillOrdersDrawer.tsx
git commit -m "feat: add cancel button for pending orders in BarPOS orders drawer"
```

---

### Task 6: Kitchen Display — Show Cancelled Orders Distinctly

**Files:**
- Modify: `src/pages/kitchen/KitchenDisplayPage.tsx`

**Step 1: Add `cancelled` to FilterTab type and filter tabs**

Line 20:
```typescript
type FilterTab = 'all' | 'pending' | 'accepted' | 'completed' | 'rejected' | 'served' | 'returned' | 'cancelled';
```

In `filterTabs` array (lines 96-104), add after the `rejected` entry:
```typescript
{ id: 'cancelled', label: 'Cancelled', color: COLORS.danger },
```

**Step 2: Add `cancelled` to counts**

In the `counts` useMemo (lines 77-85), add:
```typescript
cancelled: kitchenOrders.filter(o => o.status === 'cancelled').length,
```

**Step 3: Add `cancelled` to status styling**

In `getStatusStyle` (lines 108-117), add to the map:
```typescript
cancelled: { bg: COLORS.dangerBg, text: COLORS.danger, border: COLORS.danger, label: 'Cancelled' },
```

**Step 4: Add `cancelled` to sort priority**

In the sort function (line 65), update the priority map:
```typescript
const priority: Record<KitchenOrderStatus, number> = { pending: 0, accepted: 1, completed: 2, served: 3, returned: 4, rejected: 5, cancelled: 6 };
```

**Step 5: Add `cancelled` to opacity reduction**

Line 199:
```typescript
opacity: (order.status === 'rejected' || order.status === 'served' || order.status === 'returned' || order.status === 'cancelled') ? 0.65 : 1,
```

**Step 6: Add cancelled order display (strikethrough and badge)**

After the return reason block (lines 275-280), add a cancelled reason block:
```typescript
{order.status === 'cancelled' && (
  <div style={{ margin: '0 14px 10px', padding: '6px 10px', borderRadius: 8, background: COLORS.dangerBg, fontSize: 11, color: COLORS.danger, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
    <X size={12} /> Cancelled{order.cancelledBy ? ` by ${order.cancelledBy}` : ''}{order.cancelledAt ? ` at ${new Date(order.cancelledAt).toLocaleTimeString()}` : ''}
  </div>
)}
```

For the items list, apply strikethrough for cancelled orders. On the item name div (line 241), update to:
```typescript
<div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, textDecoration: order.status === 'cancelled' ? 'line-through' : 'none' }}>{item.name}</div>
```

**Step 7: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 8: Commit**

```bash
git add src/pages/kitchen/KitchenDisplayPage.tsx
git commit -m "feat: show cancelled orders distinctly in kitchen display"
```

---

### Task 7: Item-Level Serving in TillOrdersDrawer

**Files:**
- Modify: `src/pages/barPos/TillOrdersDrawer.tsx`

**Step 1: Destructure `serveOrderItem` from context**

Update line 28 to also get `serveOrderItem`:
```typescript
const { serveOrder, returnOrder, cancelOrder, serveOrderItem } = useKitchenOrders();
```

**Step 2: Replace the simple items display with item-level serving**

Replace the items display line (around line 74-76):
```typescript
<div style={{ fontSize: 11, color: COLORS.textDim }}>
  {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
</div>
```

With expanded item-level view that sorts bar items (served) first:
```typescript
<div style={{ fontSize: 11 }}>
  {[...order.items]
    .sort((a, b) => {
      // Served items first (bar items)
      if (a.itemStatus === 'served' && b.itemStatus !== 'served') return -1;
      if (a.itemStatus !== 'served' && b.itemStatus === 'served') return 1;
      return 0;
    })
    .map((item, idx) => (
    <div key={idx} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '3px 0',
      borderBottom: idx < order.items.length - 1 ? `1px dashed ${COLORS.border}` : 'none',
      opacity: item.itemStatus === 'served' ? 0.7 : 1,
    }}>
      <span style={{
        color: item.itemStatus === 'served' ? COLORS.success : COLORS.textDim,
        textDecoration: order.status === 'cancelled' ? 'line-through' : 'none',
      }}>
        {item.qty}x {item.name}
      </span>
      {item.itemStatus === 'served' ? (
        <span style={{ fontSize: 9, fontWeight: 600, color: COLORS.success, padding: '1px 6px', borderRadius: 4, background: COLORS.successBg }}>Served</span>
      ) : (order.status === 'completed' || order.status === 'served') ? (
        <button onClick={(e) => { e.stopPropagation(); serveOrderItem(order.id, item.productId); }}
          style={{
            fontSize: 9, fontWeight: 600, color: COLORS.primary, padding: '2px 8px',
            borderRadius: 4, background: COLORS.primaryBg, border: `1px solid ${COLORS.primary}30`,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          Serve
        </button>
      ) : null}
    </div>
  ))}
</div>
```

**Step 3: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/barPos/TillOrdersDrawer.tsx
git commit -m "feat: add item-level serving in BarPOS orders drawer"
```

---

### Task 8: Item-Level Serving and Cancellation in TillManagementPage

**Files:**
- Modify: `src/pages/tillManagement/TillManagementPage.tsx`

**Step 1: Destructure new context methods**

Line 73-77, add `cancelOrder` and `serveOrderItem` to destructuring:
```typescript
const {
  tills, openTill, closeTill, placeOrder, recordTillPayment,
  getOrdersForTill, serveOrder, returnOrder, cancelOrder, serveOrderItem,
  unseenUpdates, markOrdersSeen, getKitchenNotificationsForTill,
} = useKitchenOrders();
```

Also add `useAuth` destructuring to get `user` for cancelledBy and `activeShop` for shop context:
```typescript
const { user, activeShop, activeBranch } = useAuth();
```
(This line already exists at line 70.)

**Step 2: Add `Ban` to icon imports**

Line 2-8, add `Ban` to the lucide imports:
```typescript
import {
  Monitor, Plus, XCircle, Clock, ChevronLeft,
  CreditCard, Banknote, Smartphone, CheckCircle,
  Send, UtensilsCrossed, ShoppingBag, Hash,
  Search, Minus, Trash2, RotateCcw, AlertCircle,
  Bell, ChefHat, X, Printer, Mail, MessageSquare,
  Eye, Receipt, Wallet, Ban,
} from 'lucide-react';
```

**Step 3: Update `renderOrderCard` with item-level serving and cancel button**

In `renderOrderCard` (starting line 395), replace the simple items display (around line 414-416):
```typescript
<div style={{ fontSize: 11, color: COLORS.textDim }}>
  {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
</div>
```

With the item-level view (same pattern as Task 7):
```typescript
<div style={{ fontSize: 11 }}>
  {[...order.items]
    .sort((a, b) => {
      if (a.itemStatus === 'served' && b.itemStatus !== 'served') return -1;
      if (a.itemStatus !== 'served' && b.itemStatus === 'served') return 1;
      return 0;
    })
    .map((item, idx) => (
    <div key={idx} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '3px 0',
      borderBottom: idx < order.items.length - 1 ? `1px dashed ${COLORS.border}` : 'none',
      opacity: item.itemStatus === 'served' ? 0.7 : 1,
    }}>
      <span style={{
        color: item.itemStatus === 'served' ? COLORS.success : COLORS.textDim,
        textDecoration: order.status === 'cancelled' ? 'line-through' : 'none',
      }}>
        {item.qty}x {item.name}
      </span>
      {item.itemStatus === 'served' ? (
        <span style={{ fontSize: 9, fontWeight: 600, color: COLORS.success, padding: '1px 6px', borderRadius: 4, background: COLORS.successBg }}>Served</span>
      ) : (order.status === 'completed' || order.status === 'served') ? (
        <button onClick={(e) => { e.stopPropagation(); serveOrderItem(order.id, item.productId); }}
          style={{
            fontSize: 9, fontWeight: 600, color: COLORS.primary, padding: '2px 8px',
            borderRadius: 4, background: COLORS.primaryBg, border: `1px solid ${COLORS.primary}30`,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          Serve
        </button>
      ) : null}
    </div>
  ))}
</div>
```

In the action buttons section (around line 436-447), add a cancel button for pending orders. After the `order.status === 'completed'` block, add:
```typescript
{order.status === 'pending' && selectedTill?.isActive && (
  <Button variant="danger" size="sm" icon={Ban} onClick={() => cancelOrder(order.id, user?.name ?? 'Staff')} style={{ flex: 1, justifyContent: 'center' }}>
    Cancel
  </Button>
)}
```

Also display cancelled info after rejection/return reason blocks (around line 420-428):
```typescript
{order.status === 'cancelled' && order.cancelledBy && (
  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: COLORS.dangerBg, fontSize: 11, color: COLORS.danger }}>
    <Ban size={10} style={{ marginRight: 4 }} /> Cancelled by {order.cancelledBy}
  </div>
)}
```

**Step 4: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/tillManagement/TillManagementPage.tsx
git commit -m "feat: add item-level serving and cancel button in TillManagement"
```

---

### Task 9: Per-Till Discount in TillManagement Payment Flow

**Files:**
- Modify: `src/pages/tillManagement/TillManagementPage.tsx`

**Step 1: Import discount constants and shop context**

Add to imports (around line 15 area):
```typescript
import { DISCOUNT_ROLE_LIMITS } from '@/constants/demoData';
```

The `useAuth` import already exists and provides `currentRole` indirectly. We need `currentRole` from `useAuth()`:
Update the `useAuth` destructuring (line 70):
```typescript
const { user, activeShop, activeBranch, currentRole } = useAuth();
```

Also need `useShop`:
```typescript
import { useColors, useAuth, useNavigation, useKitchenOrders, useToast, useShop } from '@/context';
```

And destructure:
```typescript
const { canAccess } = useShop();
```

**Step 2: Add discount state**

After the existing payment state declarations (around line 106), add:
```typescript
const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
const [discountValue, setDiscountValue] = useState('');
```

**Step 3: Compute discount values**

After `payingAmount` (line 265), add discount computation:
```typescript
const canApplyDiscount = canAccess('pos_discount');
const roleMaxDiscountPercent = DISCOUNT_ROLE_LIMITS[currentRole] ?? 0;
const rawDiscountVal = parseFloat(discountValue) || 0;

let discountAmount = 0;
let discountLabel = '';
if (canApplyDiscount && rawDiscountVal > 0 && outstandingBalance > 0) {
  if (discountType === 'percent') {
    const clampedPct = Math.min(rawDiscountVal, roleMaxDiscountPercent);
    discountAmount = outstandingBalance * clampedPct / 100;
    discountLabel = `Discount (${clampedPct}%)`;
  } else {
    const maxByRole = outstandingBalance * roleMaxDiscountPercent / 100;
    discountAmount = Math.min(rawDiscountVal, maxByRole);
    discountLabel = `Discount (GH₵ ${discountAmount.toFixed(2)})`;
  }
  discountAmount = Math.min(discountAmount, outstandingBalance);
}
const discountedBalance = Math.max(0, outstandingBalance - discountAmount);
const discountExceedsLimit = discountType === 'percent'
  ? rawDiscountVal > roleMaxDiscountPercent
  : rawDiscountVal > (outstandingBalance * roleMaxDiscountPercent / 100);
```

**Step 4: Use `discountedBalance` instead of `outstandingBalance` for payment**

Replace `const payingAmount = outstandingBalance;` (line 265) — move it after the discount computation:
```typescript
const payingAmount = discountedBalance;
```

**Step 5: Add `resetPayment` cleanup for discount**

In `resetPayment` (line 254-263), add:
```typescript
setDiscountValue('');
setDiscountType('percent');
```

**Step 6: Add discount UI in `renderPaymentPanel`**

In the payment panel (inside `renderPaymentPanel`, after the "previous payments" summary around line 693 area), add the discount section before the payment method selection:

```typescript
{/* Discount section */}
{canApplyDiscount && outstandingBalance > 0 && (
  <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Discount</div>
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      <button onClick={() => setDiscountType('percent')}
        style={{
          flex: 1, padding: '6px 10px', borderRadius: 6,
          border: `1.5px solid ${discountType === 'percent' ? COLORS.primary : COLORS.border}`,
          background: discountType === 'percent' ? COLORS.primaryBg : 'transparent',
          color: discountType === 'percent' ? COLORS.primary : COLORS.textMuted,
          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
        Percentage (%)
      </button>
      <button onClick={() => setDiscountType('fixed')}
        style={{
          flex: 1, padding: '6px 10px', borderRadius: 6,
          border: `1.5px solid ${discountType === 'fixed' ? COLORS.primary : COLORS.border}`,
          background: discountType === 'fixed' ? COLORS.primaryBg : 'transparent',
          color: discountType === 'fixed' ? COLORS.primary : COLORS.textMuted,
          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
        Fixed (GH₵)
      </button>
    </div>
    <input
      type="number"
      value={discountValue}
      onChange={e => setDiscountValue(e.target.value)}
      placeholder={discountType === 'percent' ? 'Enter %' : 'Enter amount'}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: `1.5px solid ${discountExceedsLimit ? COLORS.warning : COLORS.border}`,
        background: COLORS.surfaceAlt, fontSize: 13, color: COLORS.text,
        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
      }}
    />
    {discountExceedsLimit && (
      <div style={{ fontSize: 10, color: COLORS.warning, marginTop: 4 }}>
        Your role allows max {roleMaxDiscountPercent}% discount. Value will be clamped.
      </div>
    )}
    {discountAmount > 0 && (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
        <span style={{ color: COLORS.textMuted }}>{discountLabel}</span>
        <span style={{ fontWeight: 700, color: COLORS.danger }}>-GH₵ {discountAmount.toFixed(2)}</span>
      </div>
    )}
  </div>
)}
```

**Step 7: Update the payment summary display**

In the payment panel, find where `outstandingBalance` / `payingAmount` is displayed as the amount to pay. Make sure it shows the breakdown:
- Subtotal (original outstanding): `GH₵ {outstandingBalance.toFixed(2)}`
- Discount: `-GH₵ {discountAmount.toFixed(2)}` (if applicable)
- Amount to pay: `GH₵ {payingAmount.toFixed(2)}`

Look for the amount display in the payment panel and update it to show the discounted amount.

**Step 8: Verify**

Run: `npm run typecheck`
Expected: PASS

**Step 9: Commit**

```bash
git add src/pages/tillManagement/TillManagementPage.tsx
git commit -m "feat: add per-till discount in TillManagement payment flow"
```

---

### Task 10: Final Verification and Build

**Files:** None (verification only)

**Step 1: Type check**

Run: `npm run typecheck`
Expected: PASS with no errors

**Step 2: Production build**

Run: `npm run build`
Expected: Successful build with no errors

**Step 3: Manual smoke test**

Run: `npm run dev`

Verify:
1. Bar & Restaurant page shows shop name in header
2. Kitchen page shows shop name in header
3. Create an order with bar + kitchen items — bar items auto-served
4. In orders drawer, bar items show "Served" badge at top
5. Kitchen items show "Serve" button when order is completed
6. Cancel a pending order from the orders drawer — verify it shows as cancelled
7. Kitchen display shows the cancelled order with strikethrough and badge
8. In Till Management, verify rejected/cancelled orders excluded from total
9. In payment modal, apply a discount and verify clamping works
10. Close till verifying cancelled orders don't block closure

**Step 4: Commit any remaining fixes**

If any issues found in smoke test, fix and commit.

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final verification of bar/restaurant/kitchen improvements"
```
