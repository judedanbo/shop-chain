# Bar/Restaurant, Kitchen & POS Improvements Design

**Date:** 2026-02-24
**Status:** Approved
**Approach:** Minimal data model changes — add fields to existing types, modify components in-place

## Requirements Summary

1. Change page titles (Bar & Restaurant, Kitchen Display) to show actual shop name
2. Exclude rejected and cancelled orders from till bill totals
3. Allow discounts on Bar Restaurant sales (per-till at payment time, same rules as POS)
4. Bar items served ahead of kitchen items; allow item-level serving on orders
5. Allow waiter to cancel orders before kitchen accepts (pending only)
6. Show cancelled orders distinctly in kitchen display
7. Cancelled order costs excluded from till outstanding amount

## Section 1: Page Titles

**Current:** "Bar & Restaurant" / "Kitchen Display" hardcoded.
**Change:** Use `activeShop?.name` from `useAuth()`. Icons (Coffee, ChefHat) remain. Fallback to current text if no shop name.

**Files:** `BarPOSPage.tsx`, `KitchenDisplayPage.tsx`

## Section 2: Bill Calculation — Exclude Rejected & Cancelled

**Current:** `totalOrderAmount = tillOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)` sums all orders.
**Change:** Filter out `rejected` and `cancelled`:

```ts
const totalOrderAmount = tillOrders
  .filter(o => o.status !== 'rejected' && o.status !== 'cancelled')
  .reduce((sum, o) => sum + (o.total ?? 0), 0);
```

Also update unresolved orders logic to exclude cancelled.

**Files:** `TillManagementPage.tsx`, `KitchenOrderContext.tsx`

## Section 3: Discounts on Bar Restaurant Sales

Port POS discount system to Till Management payment flow:
- Role-based limits from `DISCOUNT_ROLE_LIMITS`
- Permission gated by `canAccess('pos_discount')`
- Percentage or fixed, clamped to role max
- Applied against outstanding balance at payment time

**Type additions to `Till`:**
```ts
discount?: number;
discountType?: 'percent' | 'fixed';
discountInput?: number;
```

**UI:** Discount input section in payment modal with toggle, input, clamping, and warning.

**Files:** `kitchen.types.ts`, `TillManagementPage.tsx`, `KitchenOrderContext.tsx`

## Section 4: Item-Level Serving

**Type additions to `KitchenOrderItem`:**
```ts
itemStatus?: 'pending' | 'served';
servedAt?: string;
```

- Bar items (skipKitchen) auto-set to `itemStatus: 'served'` at order creation
- Kitchen items start as `itemStatus: 'pending'`
- New context method: `serveOrderItem(orderId, productId)`
- Auto-mark order as served when all items served

**UI:** Per-item serve buttons in TillOrdersDrawer and TillManagementPage. Bar items show "Served" badge, kitchen items show "Serve" button when order is completed.

**Files:** `kitchen.types.ts`, `KitchenOrderContext.tsx`, `TillOrdersDrawer.tsx`, `TillManagementPage.tsx`

## Section 5: Bar Items Served Ahead

Bar items auto-marked as served at creation (Section 4). In order views, bar items appear at top with "Served" badge; kitchen items show kitchen status below. Natural priority without separate mechanism.

**Files:** `TillOrdersDrawer.tsx`, `TillManagementPage.tsx`

## Section 6: Waiter Cancellation of Pending Orders

**Type changes:**
- Add `'cancelled'` to `KitchenOrderStatus`
- Add `cancelledAt?: string` and `cancelledBy?: string` to `KitchenOrder`

**Context:** `cancelOrder(orderId, cancelledBy)` — only if `status === 'pending'`

**Kitchen display:** Cancelled orders shown with "Cancelled" badge, strikethrough items, reduced opacity. Added to filter tabs.

**BarPOS/TillOrdersDrawer:** Cancel button on pending orders. Cancelled orders shown with label, no action buttons.

**Bill impact:** Excluded from `totalOrderAmount` and not counted as unresolved for till closure.

**Files:** `kitchen.types.ts`, `KitchenOrderContext.tsx`, `KitchenDisplayPage.tsx`, `BarPOSPage.tsx`, `TillOrdersDrawer.tsx`, `TillManagementPage.tsx`
