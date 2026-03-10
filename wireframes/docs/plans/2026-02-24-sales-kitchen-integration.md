# Sales & Kitchen Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Bar/Restaurant sales into the overall sales system, add daily fresh start filtering, and build a combined Sales & Kitchen Analysis page.

**Architecture:** Till close generates SaleRecords (source: 'bar') pushed into App.tsx's salesHistory via callback. Operational views filter to today using date comparisons. The existing SalesAnalysisPage is replaced with a tabbed combined analysis page (Sales + Kitchen).

**Tech Stack:** React 19, TypeScript strict, inline styles, lucide-react icons, useColors() theme hook.

---

### Task 1: Add `source` field to SaleRecord type

**Files:**
- Modify: `src/types/sales.types.ts`

**Step 1: Add source field to SaleRecord**

In `src/types/sales.types.ts`, add `source` field to the `SaleRecord` interface, after the `status` field:

```typescript
source?: 'pos' | 'bar';
```

This is optional and defaults to `'pos'` for backwards compatibility — existing POS sales don't need updating.

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no existing code references `source` yet)

**Step 3: Commit**

```bash
git add src/types/sales.types.ts
git commit -m "feat: add source field to SaleRecord type for bar/pos distinction"
```

---

### Task 2: Wire closeTill to generate SaleRecords via callback

**Files:**
- Modify: `src/context/KitchenOrderContext.tsx` — accept and call `onTillClose` callback
- Modify: `src/App.tsx` — pass `onTillClose` callback to KitchenOrderProvider

**Step 1: Add onTillClose prop to KitchenOrderProvider**

In `src/context/KitchenOrderContext.tsx`:

1. Add prop to the provider component:

```typescript
interface KitchenOrderProviderProps {
  children: ReactNode;
  onTillClose?: (saleRecord: SaleRecord) => void;
}
```

2. Change the provider signature:

```typescript
export function KitchenOrderProvider({ children, onTillClose }: KitchenOrderProviderProps) {
```

3. Import `SaleRecord` and `SaleItem` from `@/types`:

```typescript
import type { SaleRecord, SaleItem } from '@/types';
```

**Step 2: Update closeTill to generate a SaleRecord**

Inside `closeTill`, after marking the till inactive, build and emit a SaleRecord:

```typescript
const closeTill = useCallback((id: string) => {
  setTills(prev => {
    const till = prev.find(t => t.id === id);
    if (till && onTillClose) {
      // Gather all valid orders for this till
      const tillOrders = orders.filter(o => o.tillId === id && o.status !== 'rejected' && o.status !== 'cancelled');

      // Aggregate items from orders
      const itemMap = new Map<string, SaleItem>();
      tillOrders.forEach(o => {
        o.items.forEach(item => {
          const existing = itemMap.get(item.productId);
          if (existing) {
            existing.qty += item.qty;
          } else {
            itemMap.set(item.productId, {
              id: item.productId,
              name: item.name,
              qty: item.qty,
              price: (o.total ?? 0) / Math.max(o.items.reduce((s, it) => s + it.qty, 0), 1),
            });
          }
        });
      });

      const items = Array.from(itemMap.values());
      const subtotal = tillOrders.reduce((s, o) => s + (o.total ?? 0), 0);
      const discountAmount = till.discount ?? 0;
      const total = subtotal - discountAmount;

      // Determine primary payment method from till payments
      const methodCounts: Record<string, number> = {};
      till.payments.forEach(p => {
        methodCounts[p.method] = (methodCounts[p.method] ?? 0) + p.amount;
      });
      const primaryMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0];
      const paymentMethod = primaryMethod ? primaryMethod[0] : 'cash';
      const payLabels: Record<string, string> = { cash: 'Cash', card: 'Card', momo: 'MoMo' };

      // Build mixed payment info if multiple methods
      const methodKeys = Object.keys(methodCounts);
      const isSplit = methodKeys.length > 1;

      const saleRecord: SaleRecord = {
        id: `BAR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${id.slice(-4)}`,
        date: new Date().toISOString(),
        items,
        itemCount: items.reduce((s, i) => s + i.qty, 0),
        subtotal,
        tax: 0,
        discount: discountAmount,
        discountType: till.discountType,
        discountInput: till.discountInput,
        total,
        paymentMethod: isSplit ? 'split' : paymentMethod,
        payLabel: isSplit ? `Split (${methodKeys.length})` : (payLabels[paymentMethod] ?? 'Cash'),
        cashier: till.openedBy,
        customerId: null,
        customerName: `Till: ${till.name}`,
        customerPhone: null,
        status: 'completed',
        source: 'bar',
        ...(isSplit ? {
          splits: methodKeys.map(m => ({
            method: m,
            label: payLabels[m] ?? m,
            amount: methodCounts[m] ?? 0,
          })),
        } : {}),
      };

      onTillClose(saleRecord);
    }
    return prev.map(t => t.id === id ? { ...t, isActive: false, closedAt: new Date().toISOString() } : t);
  });
}, [orders, onTillClose]);
```

Note: The `closeTill` callback must now include `orders` and `onTillClose` in its dependency array.

**Step 3: Pass the callback from App.tsx**

In `src/App.tsx`, the `KitchenOrderProvider` wraps inside `AppProviders` (in `src/index.tsx`) or is used in the component tree. Find where `KitchenOrderProvider` is rendered and add the callback.

First, check where `KitchenOrderProvider` is used. It's likely in `src/context/index.tsx` or `src/index.tsx` as part of `AppProviders`.

The callback should be:

```typescript
onTillClose={(sale: SaleRecord) => setSalesHistory(prev => [sale, ...prev])}
```

Since `KitchenOrderProvider` is in the provider tree and `setSalesHistory` is in `App.tsx`, we need to bridge this. The approach:

1. In `App.tsx`, define a `handleTillClose` callback using `useCallback`:

```typescript
const handleTillClose = useCallback((sale: SaleRecord) => {
  setSalesHistory(prev => [sale, ...prev]);
}, []);
```

2. Find `KitchenOrderProvider` in the provider tree. If it's in `AppProviders` (separate from App.tsx), we need to either:
   - Move `KitchenOrderProvider` to wrap inside `App.tsx`, or
   - Pass the callback through context

Check the provider structure to determine the right approach. The simplest is to have `KitchenOrderProvider` accept the `onTillClose` prop and thread it from wherever it's rendered.

**Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/context/KitchenOrderContext.tsx src/App.tsx src/index.tsx
git commit -m "feat: generate SaleRecord on till close and push to salesHistory"
```

---

### Task 3: Update INITIAL_SALES seed data timestamps to today

**Files:**
- Modify: `src/constants/demoData.ts`

**Step 1: Update seed sale timestamps**

Change the 10 `INITIAL_SALES` entries to use today-relative dates. Replace the hardcoded `2026-02-*` dates with `Date.now()`-based expressions similar to how SEED_TILLS and SEED_ORDERS already do it in KitchenOrderContext.

Replace the entire `INITIAL_SALES` array dates:
- Entries 1-2: Today (varying hours ago)
- Entries 3-4: Yesterday
- Entries 5-6: 2 days ago
- Entries 7-8: 3 days ago
- Entries 9-10: 4+ days ago

Example transformation for the first entry:

```typescript
{
  id: 'TXN-20260215-0041', date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  // ... rest unchanged
}
```

For the second entry:
```typescript
  date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
```

Continue with similar offsets:
- Entry 3: `Date.now() - 86400000 - 3600000` (yesterday, 1h in)
- Entry 4: `Date.now() - 86400000 - 7200000` (yesterday, 2h in)
- Entry 5: `Date.now() - 2 * 86400000` (2 days ago)
- Entry 6: `Date.now() - 2 * 86400000 - 3600000`
- Entry 7: `Date.now() - 3 * 86400000`
- Entry 8: `Date.now() - 3 * 86400000 - 3600000`
- Entry 9: `Date.now() - 4 * 86400000`
- Entry 10: `Date.now() - 5 * 86400000`

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/constants/demoData.ts
git commit -m "feat: update INITIAL_SALES timestamps to today-relative dates"
```

---

### Task 4: Daily fresh start — filter operational views to today

**Files:**
- Modify: `src/pages/barPos/BarPOSPage.tsx` — filter tills to today
- Modify: `src/pages/kitchen/KitchenDisplayPage.tsx` — filter orders to today
- Modify: `src/pages/tillManagement/TillManagementPage.tsx` — filter tills to today

**Step 1: Create a shared isToday helper**

In each file, add a helper at the top (or create a shared utility):

```typescript
function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
```

Better approach: Add it to `src/utils/dates.ts` or inline it in each file (simpler for a wireframe).

**Step 2: Filter tills in BarPOSPage**

In `src/pages/barPos/BarPOSPage.tsx`, after getting `tills` from context, filter to today:

```typescript
const todayTills = useMemo(() => tills.filter(t => isToday(t.openedAt)), [tills]);
```

Then replace all references to `tills` with `todayTills` in the component (the active till list, the till selector, etc.). Be careful: `activeTillId` should still reference the full tills array via context for operations (openTill, closeTill still work on full data), but the UI display should use `todayTills`.

**Step 3: Filter orders in KitchenDisplayPage**

In `src/pages/kitchen/KitchenDisplayPage.tsx`, filter orders to today:

```typescript
const todayOrders = useMemo(() => orders.filter(o => isToday(o.createdAt)), [orders]);
```

Replace `orders` with `todayOrders` in the filtering/display logic (the `filteredOrders` computation, the status counts).

**Step 4: Filter tills in TillManagementPage**

In `src/pages/tillManagement/TillManagementPage.tsx`, filter tills to today:

```typescript
const todayTills = useMemo(() => tills.filter(t => isToday(t.openedAt)), [tills]);
```

Replace `tills` with `todayTills` in the active/closed till display sections.

**Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/pages/barPos/BarPOSPage.tsx src/pages/kitchen/KitchenDisplayPage.tsx src/pages/tillManagement/TillManagementPage.tsx
git commit -m "feat: filter operational views to show today's data only"
```

---

### Task 5: Hide reversal button for bar sales in SalesPage

**Files:**
- Modify: `src/pages/sales/SalesPage.tsx` — hide reverse button for bar source, add source badge

**Step 1: Add source badge to sale rows**

In the desktop table and mobile card views, show a small badge next to the receipt # indicating the source:

```typescript
{s.source === 'bar' && (
  <span style={{
    fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
    background: `${COLORS.warning}15`, color: COLORS.warning, marginLeft: 6,
  }}>BAR</span>
)}
```

Add this after the receipt # `<span>` in both the desktop `<td>` and mobile card views.

**Step 2: Hide reversal button for bar sales**

In the desktop table actions column (around line 428), add `s.source !== 'bar'` to the condition:

```typescript
{s.status !== 'reversed' && s.status !== 'pending_reversal' && s.source !== 'bar' && canInitiateReversal && (
```

Same for mobile card (around line 501):

```typescript
{s.status !== 'reversed' && s.status !== 'pending_reversal' && s.source !== 'bar' && canInitiateReversal && (
```

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/sales/SalesPage.tsx
git commit -m "feat: show source badge on bar sales and hide reversal button"
```

---

### Task 6: Add source filter to SalesPage

**Files:**
- Modify: `src/pages/sales/SalesPage.tsx` — add source filter pills

**Step 1: Add source filter state**

```typescript
const [sourceFilter, setSourceFilter] = useState<'all' | 'pos' | 'bar'>('all');
```

**Step 2: Add source filter logic**

In the `filtered` computation, add after the date filter:

```typescript
// Source
if (sourceFilter !== 'all') {
  if (sourceFilter === 'bar' && s.source !== 'bar') return false;
  if (sourceFilter === 'pos' && s.source === 'bar') return false;
}
```

**Step 3: Add source filter pills to the extra filters section**

In the `{showFilters && ...}` section, add a source filter group:

```typescript
<div>
  <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Source</div>
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
    {(['all', 'pos', 'bar'] as const).map(v => (
      <button key={v} onClick={() => { setSourceFilter(v); setTblPage(1); }} style={pillStyle(sourceFilter === v)}>
        {v === 'all' ? 'All' : v === 'pos' ? 'POS' : 'Bar/Restaurant'}
      </button>
    ))}
  </div>
</div>
```

**Step 4: Include sourceFilter in the "clear all filters" logic**

Update the clear filters condition and handler to include `sourceFilter`:

Condition: add `|| sourceFilter !== 'all'`
Handler: add `setSourceFilter('all');`

**Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/pages/sales/SalesPage.tsx
git commit -m "feat: add source filter (POS/Bar) to sales page"
```

---

### Task 7: Replace SalesAnalysisPage with combined tabbed page — Sales Analysis tab

**Files:**
- Modify: `src/pages/sales/SalesAnalysisPage.tsx` — replace entirely with tabbed page

**Step 1: Add KitchenOrder types to props**

Update the props interface to accept kitchen data:

```typescript
import type { SaleRecord, KitchenOrder, Till } from '@/types';

interface SalesAnalysisPageProps {
  salesHistory: SaleRecord[];
  kitchenOrders: KitchenOrder[];
  tills: Till[];
}
```

**Step 2: Add tab state and tab UI**

At the top of the component, add:

```typescript
const [activeTab, setActiveTab] = useState<'sales' | 'kitchen'>('sales');
```

Add tab bar UI after the back button / title section:

```typescript
{/* Tab Bar */}
<div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}>
  {([
    { key: 'sales', label: 'Sales Analysis', icon: BarChart3 },
    { key: 'kitchen', label: 'Kitchen Analysis', icon: ChefHat },
  ] as const).map(tab => (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
        background: activeTab === tab.key ? COLORS.surface : 'transparent',
        color: activeTab === tab.key ? COLORS.primary : COLORS.textMuted,
        boxShadow: activeTab === tab.key ? `0 1px 3px ${COLORS.border}` : 'none',
        transition: 'all 0.15s',
      }}
    >
      <tab.icon size={15} />
      {tab.label}
    </button>
  ))}
</div>
```

**Step 3: Enhance Sales Analysis with source breakdown**

In the existing sales analysis section (now rendered conditionally when `activeTab === 'sales'`), add:

1. **Revenue split by source** — POS vs Bar breakdown in the KPI section:

```typescript
const posRevenue = todayActive.filter(s => s.source !== 'bar').reduce((s, r) => s + r.total, 0);
const barRevenue = todayActive.filter(s => s.source === 'bar').reduce((s, r) => s + r.total, 0);
```

Add a card or section showing POS vs Bar revenue split with a visual bar.

2. **Bar-specific metrics** — average till amount, orders per till:

```typescript
const barSales = allActive.filter(s => s.source === 'bar');
const avgTillAmount = barSales.length > 0 ? barSales.reduce((s, r) => s + r.total, 0) / barSales.length : 0;
```

**Step 4: Wrap existing analysis in sales tab conditional**

```typescript
{activeTab === 'sales' && (
  <> {/* Existing sales analysis content */} </>
)}
```

**Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: May have errors — kitchen types need importing. Fix any issues.

**Step 6: Commit**

```bash
git add src/pages/sales/SalesAnalysisPage.tsx
git commit -m "feat: add tab UI and source breakdown to Sales Analysis tab"
```

---

### Task 8: Build Kitchen Analysis tab

**Files:**
- Modify: `src/pages/sales/SalesAnalysisPage.tsx` — add kitchen analysis tab content

**Step 1: Compute kitchen metrics**

Add kitchen analysis computation inside the `useMemo` or in a separate `useMemo`:

```typescript
const kitchenAnalysis = useMemo(() => {
  const validOrders = kitchenOrders.filter(o => o.status !== 'cancelled' && o.status !== 'rejected');
  const completedOrders = kitchenOrders.filter(o => o.completedAt);
  const servedOrders = kitchenOrders.filter(o => o.servedAt);

  // Speed metrics
  const acceptTimes = kitchenOrders
    .filter(o => o.acceptedAt && o.createdAt)
    .map(o => new Date(o.acceptedAt!).getTime() - new Date(o.createdAt).getTime());
  const avgAcceptTime = acceptTimes.length > 0 ? acceptTimes.reduce((a, b) => a + b, 0) / acceptTimes.length : 0;

  const completeTimes = kitchenOrders
    .filter(o => o.completedAt && o.acceptedAt)
    .map(o => new Date(o.completedAt!).getTime() - new Date(o.acceptedAt!).getTime());
  const avgCompleteTime = completeTimes.length > 0 ? completeTimes.reduce((a, b) => a + b, 0) / completeTimes.length : 0;

  const serveTimes = kitchenOrders
    .filter(o => o.servedAt && o.completedAt)
    .map(o => new Date(o.servedAt!).getTime() - new Date(o.completedAt!).getTime());
  const avgServeTime = serveTimes.length > 0 ? serveTimes.reduce((a, b) => a + b, 0) / serveTimes.length : 0;

  // Efficiency
  const totalOrders = kitchenOrders.length;
  const acceptedCount = kitchenOrders.filter(o => o.status !== 'pending' && o.status !== 'rejected' && o.status !== 'cancelled').length;
  const rejectedCount = kitchenOrders.filter(o => o.status === 'rejected').length;
  const cancelledCount = kitchenOrders.filter(o => o.status === 'cancelled').length;
  const acceptanceRate = totalOrders > 0 ? (acceptedCount / totalOrders) * 100 : 0;
  const rejectionRate = totalOrders > 0 ? (rejectedCount / totalOrders) * 100 : 0;
  const cancellationRate = totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0;

  // Revenue
  const kitchenRevenue = validOrders.filter(o => !o.barFulfilled).reduce((s, o) => s + (o.total ?? 0), 0);
  const barDirectRevenue = validOrders.filter(o => o.barFulfilled).reduce((s, o) => s + (o.total ?? 0), 0);
  const avgOrderValue = validOrders.length > 0 ? (kitchenRevenue + barDirectRevenue) / validOrders.length : 0;

  // Top items
  const itemMap: Record<string, { name: string; qty: number }> = {};
  validOrders.forEach(o => {
    o.items.forEach(item => {
      if (!itemMap[item.productId]) itemMap[item.productId] = { name: item.name, qty: 0 };
      const entry = itemMap[item.productId];
      if (entry) entry.qty += item.qty;
    });
  });
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 8);

  // Hourly order volume
  const hourly: number[] = Array(24).fill(0);
  kitchenOrders.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    hourly[hour] = (hourly[hour] ?? 0) + 1;
  });

  // Till performance
  const tillPerf: Record<string, { name: string; revenue: number; orders: number }> = {};
  validOrders.forEach(o => {
    if (!tillPerf[o.tillId]) tillPerf[o.tillId] = { name: o.tillName, revenue: 0, orders: 0 };
    const entry = tillPerf[o.tillId];
    if (entry) { entry.revenue += (o.total ?? 0); entry.orders++; }
  });
  const tillPerfList = Object.values(tillPerf).sort((a, b) => b.revenue - a.revenue);

  return {
    totalOrders, validOrders: validOrders.length, completedOrders: completedOrders.length,
    avgAcceptTime, avgCompleteTime, avgServeTime,
    acceptanceRate, rejectionRate, cancellationRate,
    kitchenRevenue, barDirectRevenue, avgOrderValue,
    topItems, hourly, tillPerfList,
  };
}, [kitchenOrders]);
```

**Step 2: Render Kitchen Analysis tab content**

When `activeTab === 'kitchen'`, render:

1. **Speed KPI cards**: avg accept time, avg prep time, avg serve time (format as minutes/seconds)
2. **Efficiency section**: orders processed, acceptance/rejection/cancellation rates with visual bars
3. **Revenue section**: kitchen vs bar-direct revenue, avg order value
4. **Top items chart**: horizontal bar list of most ordered items
5. **Hourly volume chart**: similar to existing hourly chart but for order count
6. **Till performance table**: revenue and order count per till

Format time values as minutes:

```typescript
function formatMinutes(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
```

Use the same card/grid layout patterns as the existing Sales Analysis tab for visual consistency.

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/sales/SalesAnalysisPage.tsx
git commit -m "feat: add Kitchen Analysis tab with speed, efficiency, and revenue metrics"
```

---

### Task 9: Wire up combined analysis page in App.tsx and navigation

**Files:**
- Modify: `src/App.tsx` — pass kitchen data to SalesAnalysisPage
- Modify: `src/components/layout/Sidebar.tsx` — update navigation (if needed)
- Modify: `src/components/layout/Header.tsx` — update page title
- Modify: `src/pages/barPos/BarPOSPage.tsx` — add link to analysis page
- Modify: `src/pages/sales/SalesPage.tsx` — update analysis button label

**Step 1: Pass kitchen orders and tills to SalesAnalysisPage in App.tsx**

The `SalesAnalysisPage` now needs `kitchenOrders` and `tills` from `KitchenOrderContext`. Since `SalesAnalysisPage` is rendered inside the provider tree, it can use `useKitchenOrders()` directly instead of receiving props.

Better approach: Have the page component call `useKitchenOrders()` internally rather than threading props through App.tsx. This is simpler.

Update `SalesAnalysisPage` to use the context hook:

```typescript
const { orders: kitchenOrders, tills } = useKitchenOrders();
```

And remove `kitchenOrders` and `tills` from the props interface (keep only `salesHistory`).

Update App.tsx: no changes needed since the page already gets `salesHistory` as prop and will pull kitchen data from context.

**Step 2: Update Header page title**

In `src/components/layout/Header.tsx`, update the title for `salesAnalysis`:

```typescript
salesAnalysis: 'Sales & Kitchen Analysis',
```

**Step 3: Update SalesPage analysis button label**

In `src/pages/sales/SalesPage.tsx`, change the analysis button:

```typescript
<Button variant="secondary" icon={BarChart3} onClick={() => setPage('salesAnalysis')}>Sales & Kitchen Analysis</Button>
```

**Step 4: Add analysis link to BarPOSPage**

Add a button or link in the BarPOSPage header area that navigates to the analysis page:

```typescript
<Button variant="ghost" icon={BarChart3} size="sm" onClick={() => setPage('salesAnalysis')}>Analysis</Button>
```

Import `BarChart3` from lucide-react if not already imported.

**Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/pages/sales/SalesAnalysisPage.tsx src/App.tsx src/components/layout/Header.tsx src/pages/sales/SalesPage.tsx src/pages/barPos/BarPOSPage.tsx
git commit -m "feat: wire combined analysis page and add navigation links"
```

---

### Task 10: Final verification — typecheck, build, and manual test

**Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: PASS with no errors

**Step 2: Run production build**

Run: `npm run build`
Expected: PASS with no errors

**Step 3: Manual test checklist**

Start dev server (`npm run dev`) and verify:

- [ ] **Sales page**: Bar sales show "BAR" badge, no reversal button on bar sales
- [ ] **Sales page**: Source filter works (All / POS / Bar)
- [ ] **Bar/Restaurant**: Only today's tills visible
- [ ] **Kitchen Display**: Only today's orders visible
- [ ] **Till Management**: Only today's tills visible
- [ ] **Close a till**: Verify it creates a SaleRecord in Sales page with source=bar
- [ ] **Sales & Kitchen Analysis**: Tab switching works
- [ ] **Sales Analysis tab**: Shows POS vs Bar revenue breakdown
- [ ] **Kitchen Analysis tab**: Shows speed, efficiency, revenue, top items, hourly, till performance
- [ ] **Navigation**: Analysis page accessible from Sales page, Bar/Restaurant page, and sidebar
- [ ] **Seed data**: Sales show as today/yesterday/etc. (not old Feb dates)

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address any issues found during final verification"
```
