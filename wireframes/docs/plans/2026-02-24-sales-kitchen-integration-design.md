# Sales & Kitchen Integration Design

**Date:** 2026-02-24
**Status:** Approved
**Approach:** Convert till data to SaleRecords on close, filter-based daily reset, combined analysis page

## Requirements Summary

1. Add Bar/Restaurant sales to overall sales page (no reversals for bar sales)
2. Start every day fresh — POS, Bar/Restaurant, Kitchen show only today's data
3. New combined Sales & Kitchen Analysis page with tabs

## Section 1: Till-to-Sale Conversion

**Type change** — add `source` to `SaleRecord`:
```typescript
source?: 'pos' | 'bar';  // defaults to 'pos' for backwards compat
```

**Till close** generates one `SaleRecord` per till:
- `id`: `BAR-YYYYMMDD-XXXX`
- `source: 'bar'`
- `items`: aggregated from all served/completed orders (excl rejected/cancelled)
- `total`: sum of order totals minus discount
- Payment info from till's payments
- `cashier`: till's `openedBy`
- `status: 'completed'`

**Requires:** `closeTill` needs a callback to push SaleRecords into `salesHistory` (lives in App.tsx state).

**Reversal gating** — bar sales (`source === 'bar'`) cannot be reversed. Hide reversal button.

## Section 2: Daily Fresh Start

Filter-based, not deletion-based. Operational views show today only.

- **Bar/Restaurant**: Filter tills to today's `openedAt` only
- **Kitchen**: Filter orders to today's `createdAt` only
- **Till Management**: Show today's tills only in active view
- **POS**: No change needed (cart resets per session)

All historical data preserved in `salesHistory` for the analysis page.

Update seed data timestamps to use `Date.now()` so demo data shows as today.

## Section 3: Combined Sales & Kitchen Analysis Page

Replace existing `SalesAnalysisPage` with combined page at same route.

**Tab 1: Sales Analysis** (enhanced)
- All existing metrics (revenue, trends, payment breakdown, top products, hourly)
- Revenue split: POS vs Bar/Restaurant source breakdown
- Bar-specific: average till amount, orders per till
- Date range selector

**Tab 2: Kitchen Analysis** (new)
- Speed: avg order-to-accepted, accepted-to-completed, completed-to-served times
- Efficiency: orders/hour, acceptance rate, rejection rate, cancellation rate
- Revenue: kitchen vs bar revenue, avg order value
- Top items: most ordered kitchen and bar items
- Peak hours: order volume by hour chart
- Till performance: revenue per till, orders per till

**Navigation:** Accessible from Sales page, Sidebar, and Bar/Restaurant page.

## Files Affected

- `src/types/sales.types.ts` — add `source` field
- `src/context/KitchenOrderContext.tsx` — till close generates SaleRecords via callback
- `src/App.tsx` — pass `setSalesHistory` callback to context, wire up new page
- `src/pages/sales/SalesPage.tsx` — hide reversal for bar sales, show source badge
- `src/pages/barPos/BarPOSPage.tsx` — filter tills/orders to today
- `src/pages/kitchen/KitchenDisplayPage.tsx` — filter orders to today
- `src/pages/tillManagement/TillManagementPage.tsx` — filter to today
- `src/pages/sales/SalesAnalysisPage.tsx` — replace with combined analysis page (tabs)
- `src/constants/demoData.ts` — update seed timestamps to today
