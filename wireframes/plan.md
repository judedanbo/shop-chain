# Plan: Waiter Order Statuses — "Preparing", "Served", "Returned"

## Goal
1. Rename the "In Progress" status label to **"Preparing"** across the Bar POS and Kitchen Display.
2. Add two new waiter-actionable statuses: **Served** and **Returned**.
3. Allow waiters (via the Bar POS Till Orders drawer) to mark completed orders as "Served" or "Returned".

---

## Step 1: Update the `KitchenOrderStatus` type

**File:** `src/types/kitchen.types.ts`

- Add `'served'` and `'returned'` to the `KitchenOrderStatus` union type:
  ```ts
  export type KitchenOrderStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'served' | 'returned';
  ```
- Add `servedAt?: string` and `returnedAt?: string` timestamp fields to the `KitchenOrder` interface.
- Add `returnReason?: string` field to `KitchenOrder` for tracking why an order was returned.

---

## Step 2: Add `serveOrder` and `returnOrder` to the Kitchen Order Context

**File:** `src/context/KitchenOrderContext.tsx`

- Add two new functions to the context interface:
  - `serveOrder(id: string): void` — transitions a `completed` order to `served`, sets `servedAt`.
  - `returnOrder(id: string, reason: string): void` — transitions a `completed` or `served` order to `returned`, sets `returnedAt` and `returnReason`.
- Implement both functions in the provider, following the same pattern as `acceptOrder` / `rejectOrder` / `completeOrder`.

---

## Step 3: Rename "In Progress" → "Preparing" in status labels

**Files to update:**

1. **`src/pages/barPos/TillOrdersDrawer.tsx`** (~line 43)
   - Change `accepted` label from `'In Progress'` to `'Preparing'`.
   - Add entries for `served` and `returned` statuses with appropriate colors.

2. **`src/pages/kitchen/KitchenDisplayPage.tsx`** (~lines 96, 107)
   - Change `accepted` label from `'In Progress'` to `'Preparing'` in filter tabs.
   - Change `accepted` label from `'In Progress'` to `'Preparing'` in `getStatusStyle`.
   - Add `served` and `returned` entries to status styles.

---

## Step 4: Add waiter action buttons in the TillOrdersDrawer

**File:** `src/pages/barPos/TillOrdersDrawer.tsx`

- For orders with status `completed` (Ready), show two action buttons:
  - **"Mark Served"** (green/success) — calls `serveOrder(order.id)`.
  - **"Return"** (red/danger) — opens a return reason prompt/modal, then calls `returnOrder(order.id, reason)`.
- Add a simple inline return reason input (or a small modal) for the "Return" flow, with quick-select reasons like:
  - "Wrong order"
  - "Customer complaint"
  - "Food quality issue"
  - "Customer left"

---

## Step 5: Update Kitchen Display to show new statuses

**File:** `src/pages/kitchen/KitchenDisplayPage.tsx`

- Add filter tabs for "Served" and "Returned" so kitchen staff can also see the full order lifecycle.
- Display the new status badges on order cards.
- Show return reason on returned orders (similar to how rejection reasons are shown).

---

## Step 6: Add seed data for new statuses

**File:** `src/context/KitchenOrderContext.tsx`

- Add 1-2 sample orders with `served` and `returned` statuses to the initial seed data, so the wireframe demonstrates all states.

---

## Files Modified (Summary)

| File | Changes |
|------|---------|
| `src/types/kitchen.types.ts` | Add `served`, `returned` to status type; add timestamp and reason fields |
| `src/context/KitchenOrderContext.tsx` | Add `serveOrder`, `returnOrder` functions; add seed data |
| `src/pages/barPos/TillOrdersDrawer.tsx` | Rename "In Progress" → "Preparing"; add Served/Returned colors; add action buttons + return reason UI |
| `src/pages/kitchen/KitchenDisplayPage.tsx` | Rename "In Progress" → "Preparing"; add Served/Returned tabs, styles, display |
