# DataTable Component Extraction — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract repeated table styling into a reusable `DataTable` component and migrate all data-table pages to use it.

**Architecture:** Single `DataTable` component using CSS Grid for desktop rendering with automatic mobile card layout. Declarative `columns` prop API. All inline styles use `useColors()` and `useBreakpoint()` hooks per project conventions.

**Tech Stack:** React 19, TypeScript (strict), inline styles, existing `Card`/`Paginator`/`Badge` UI primitives.

**Design doc:** `docs/plans/2026-02-23-table-styling-extraction-design.md`

---

## Migration Scope (10 confirmed files)

| # | File | Table Type | Lines (Desktop) | Lines (Mobile) | Has Pagination |
|---|------|-----------|-----------------|----------------|----------------|
| 1 | TransfersPage.tsx | HTML `<table>` | 129-160 | 91-125 | Yes |
| 2 | AdjustmentsPage.tsx | HTML `<table>` | 150-181 | 114-146 | Yes |
| 3 | PurchaseOrdersPage.tsx | HTML `<table>` | 134-181 | 89-130 | Yes |
| 4 | ProductsPage.tsx | HTML `<table>` | 104-172 | 58-100 | Yes |
| 5 | TeamPage.tsx | HTML `<table>` | 557-623 | 515-551 | Yes |
| 6 | CustomersPage.tsx | Grid-based | 199-225 | inline | Yes |
| 7 | AdminUsersTab.tsx | HTML `<table>` | 206-227 | No | No |
| 8 | PODetailPage.tsx | HTML `<table>` | 216-264 | No | No |
| 9 | ReceiveOrdersPage.tsx | HTML `<table>` | 486-518 | No | Yes |
| 10 | SalesPage.tsx | HTML `<table>` | ~280-500 | Unknown | Yes |

**Note:** ReceiveOrdersPage also has an inline-edit form table (lines 289-451) with nested batch sub-rows. This is too complex/unique for DataTable — skip it, only migrate the history table. SalesPage may also have expansion/reversal features that need investigation during migration.

---

### Task 1: Create the DataTable component

**Files:**
- Create: `src/components/ui/DataTable.tsx`
- Modify: `src/components/ui/index.ts`

**Step 1: Create `src/components/ui/DataTable.tsx`**

Write the full component. Reference the design doc for the API. Key implementation details:

```tsx
import { useState, type ReactNode } from 'react';
import { useColors } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { Card } from './Card';

export interface DataTableColumn<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T, index: number) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  striped?: boolean;
  hoverable?: boolean;
  emptyMessage?: string;
  compact?: boolean;
  children?: ReactNode; // slot for footer content (e.g., Paginator)
}
```

Implementation notes:
- `gridTemplateColumns` is built by joining `column.width ?? '1fr'` for each column
- Default `keyExtractor`: try `(row as Record<string, unknown>).id`, fall back to index
- Cell rendering: if `render` exists use it, else if `accessor` exists use `String(row[accessor] ?? '')`, else empty
- Desktop: outer `div` with `overflow: 'auto'`, header row div, data rows in a loop, then `{children}` for footer
- Mobile: each row becomes a `<Card>` with label-value pairs. Filter columns by `!hideOnMobile`. Card gets `onClick` from `onRowClick`.
- Hover state: use `useState` tracking hovered row index (not direct DOM manipulation) for cleaner React patterns
- Empty state: centered `emptyMessage ?? 'No data to display'` div

**Step 2: Add barrel export to `src/components/ui/index.ts`**

Add at the end:
```ts
export { DataTable, type DataTableColumn, type DataTableProps } from './DataTable';
```

**Step 3: Verify it builds**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/ui/DataTable.tsx src/components/ui/index.ts
git commit -m "feat: add DataTable component with grid-based rendering and mobile card layout"
```

---

### Task 2: Migrate TransfersPage.tsx

**Files:**
- Modify: `src/pages/inventory/TransfersPage.tsx`

This is the simplest table — 8 columns, no custom cell rendering beyond badges, standard hover + pagination. Good first migration to validate the component.

**Step 1: Replace the table section (lines 88-160)**

The current code has three branches:
1. Empty state (`TRANSFERS.length === 0`)
2. Mobile card view (`isMobile(bp)`)
3. Desktop HTML table

Replace branches 2 and 3 with a single `<DataTable>` usage. Keep the empty state check.

Define columns:
```tsx
const transferColumns: DataTableColumn<typeof TRANSFERS[number]>[] = [
  { header: 'Transfer #', render: (t) => <span style={{ fontSize: 12, fontFamily: 'monospace', color: COLORS.accent }}>{t.id}</span>, width: '1fr' },
  { header: 'Product', render: (t) => <span style={{ fontWeight: 500 }}>{t.product}</span>, width: '1.5fr' },
  { header: 'Quantity', render: (t) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t.qty}</span>, width: '80px' },
  { header: 'From', render: (t) => <Badge color="neutral">{t.from}</Badge>, width: '1fr' },
  { header: 'To', render: (t) => <Badge color="accent">{t.to}</Badge>, width: '1fr' },
  { header: 'Date', render: (t) => <span style={{ fontSize: 12, color: COLORS.textMuted }}>{formatDate(t.date)}</span>, width: '1fr', hideOnMobile: true },
  { header: 'Initiated By', render: (t) => <span style={{ fontSize: 12, color: COLORS.textMuted }}>{t.by}</span>, width: '1fr', hideOnMobile: true },
  { header: 'Status', render: (t) => <StatusBadge status={t.status} />, width: '100px' },
];
```

Usage:
```tsx
{TRANSFERS.length === 0 ? (
  <EmptyState icon={ArrowRightLeft} title="No transfers yet" description="Stock transfers between locations will appear here." />
) : (
  <Card noPadding>
    <DataTable columns={transferColumns} data={pgd.items} keyExtractor={(t) => t.id}>
      <div style={{ padding: '0 16px', borderTop: `1px solid ${COLORS.border}` }}>
        <Paginator {...pgd} perPage={isMobile(bp) ? 8 : 10} onPage={v => setTblPage(v)} />
      </div>
    </DataTable>
  </Card>
)}
```

Pagination: call `paginate(TRANSFERS, tblPage, isMobile(bp) ? 8 : 10)` once before the JSX.

**Step 2: Remove unused imports**

The `isMobile` import may no longer be needed at the top level (DataTable handles it internally). However, `isMobile` is still needed for the `perPage` logic. Keep it if still used. Remove any other dead imports (e.g., `rg` if only used for stats grid — check before removing).

**Step 3: Verify it builds**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/pages/inventory/TransfersPage.tsx
git commit -m "refactor: migrate TransfersPage to DataTable component"
```

---

### Task 3: Migrate AdjustmentsPage.tsx

**Files:**
- Modify: `src/pages/inventory/AdjustmentsPage.tsx`

Very similar to TransfersPage — 8 columns, standard pagination, mobile/desktop branching.

**Step 1: Define columns and replace table section (lines ~114-181)**

Columns: Ref #, Product, Type, Quantity, Date, Adjusted By, Reason, Status

Pattern identical to Task 2. Replace the mobile card view + desktop table with a single `<DataTable>` inside a `<Card noPadding>`. Use `paginate()` with responsive perPage.

**Step 2: Verify it builds**

Run: `npm run typecheck`

**Step 3: Commit**

```bash
git add src/pages/inventory/AdjustmentsPage.tsx
git commit -m "refactor: migrate AdjustmentsPage to DataTable component"
```

---

### Task 4: Migrate PurchaseOrdersPage.tsx

**Files:**
- Modify: `src/pages/purchaseOrders/PurchaseOrdersPage.tsx`

9 columns, row click navigation, mobile cards with badges.

**Step 1: Define columns and replace table section (lines ~89-181)**

Columns: PO #, Supplier, Items, Total Value, Created, Expected, Location, Status, Actions

The row has `onClick` → navigation to PO detail. Use `onRowClick` prop.

The Actions column has a view button (Eye icon). Include it as a column with `hideOnMobile: true`.

**Step 2: Verify it builds**

Run: `npm run typecheck`

**Step 3: Commit**

```bash
git add src/pages/purchaseOrders/PurchaseOrdersPage.tsx
git commit -m "refactor: migrate PurchaseOrdersPage to DataTable component"
```

---

### Task 5: Migrate ProductsPage.tsx

**Files:**
- Modify: `src/pages/products/ProductsPage.tsx`

10 columns, row click navigation, batch tracking badge, expiry display. This is the most column-heavy table.

**Step 1: Define columns and replace table section (lines ~58-174)**

Columns: Product (image + name + SKU), Category, Price, Stock, Reorder Pt., Expiry, Location, Status, Actions

The Product column has a product image thumbnail, name, and SKU — use a custom `render` function. Several columns should be `hideOnMobile: true` (Reorder Pt., Expiry, Location, Actions).

**Step 2: Verify it builds**

Run: `npm run typecheck`

**Step 3: Commit**

```bash
git add src/pages/products/ProductsPage.tsx
git commit -m "refactor: migrate ProductsPage to DataTable component"
```

---

### Task 6: Migrate TeamPage.tsx

**Files:**
- Modify: `src/pages/team/TeamPage.tsx`

6 columns, action menu dropdown (Edit, Deactivate, Delete), avatar with role color gradient.

**Step 1: Define columns and replace table section (lines ~515-623)**

Columns: Member (avatar + name + email), Phone, Role, Status, Last Active, Actions

The Actions column has a three-dot dropdown menu. This is custom cell rendering — use `render` prop. The Member column has avatar with gradient based on role — also custom `render`.

**Step 2: Verify it builds**

Run: `npm run typecheck`

**Step 3: Commit**

```bash
git add src/pages/team/TeamPage.tsx
git commit -m "refactor: migrate TeamPage to DataTable component"
```

---

### Task 7: Migrate CustomersPage.tsx

**Files:**
- Modify: `src/pages/customers/CustomersPage.tsx`

6 columns, grid-based (not HTML table), row click navigation, alternating backgrounds.

**Step 1: Define columns and replace grid table section (lines ~199-225)**

Columns: Customer (avatar + name), Phone, Type, Total Spent, Visits, Actions

This is already grid-based, so the migration is mostly API alignment.

**Step 2: Verify it builds**

Run: `npm run typecheck`

**Step 3: Commit**

```bash
git add src/pages/customers/CustomersPage.tsx
git commit -m "refactor: migrate CustomersPage to DataTable component"
```

---

### Task 8: Migrate AdminUsersTab.tsx (payment history table)

**Files:**
- Modify: `src/pages/admin/AdminUsersTab.tsx`

Small compact table for payment history. 6 columns, no pagination, alternating rows. Uses `compact` variant.

**Step 1: Define columns and replace table section (lines ~206-227)**

Columns: Date, Amount, Plan, Method, Status, Ref

Use `compact={true}` and `striped={true}`. No `onRowClick`. No mobile view needed (this is inside a detail panel).

**Step 2: Verify it builds**

Run: `npm run typecheck`

**Step 3: Commit**

```bash
git add src/pages/admin/AdminUsersTab.tsx
git commit -m "refactor: migrate AdminUsersTab payment history to DataTable component"
```

---

### Task 9: Migrate PODetailPage.tsx

**Files:**
- Modify: `src/pages/purchaseOrders/PODetailPage.tsx`

Line items table inside PO detail view. 6 columns, no pagination, includes a summary footer row.

**Step 1: Read the file first to understand exact structure**

Read lines 200-280 to understand the table structure, especially the summary footer.

**Step 2: Define columns and replace table section (lines ~216-264)**

Columns: Product, Unit Cost, Ordered, Received, Line Total, Status

The summary footer (order totals) can go in the `children` slot of DataTable, or remain as a separate div below.

**Step 3: Verify it builds**

Run: `npm run typecheck`

**Step 4: Commit**

```bash
git add src/pages/purchaseOrders/PODetailPage.tsx
git commit -m "refactor: migrate PODetailPage line items to DataTable component"
```

---

### Task 10: Migrate ReceiveOrdersPage.tsx (history table only)

**Files:**
- Modify: `src/pages/inventory/ReceiveOrdersPage.tsx`

History table only (lines 486-518). The inline-edit form table (lines 289-451) is too complex for DataTable — skip it.

**Step 1: Read the file to confirm exact structure of history table**

Read lines 480-540 to understand the history table.

**Step 2: Define columns and replace history table section**

Columns: Receipt #, Date, Warehouse, Items, Total Qty, Notes, Created By, Status

**Step 3: Verify it builds**

Run: `npm run typecheck`

**Step 4: Commit**

```bash
git add src/pages/inventory/ReceiveOrdersPage.tsx
git commit -m "refactor: migrate ReceiveOrdersPage history table to DataTable component"
```

---

### Task 11: Investigate and migrate SalesPage.tsx

**Files:**
- Modify: `src/pages/sales/SalesPage.tsx` (or `SalesHistoryPage.tsx` — confirm exact filename)

This table may have unique features (expandable rows, reversal workflow). Read first, then decide migration approach.

**Step 1: Read the file to understand table structure**

Read the full file (or relevant sections). Identify:
- Column definitions
- Expandable row behavior
- Reversal modal integration
- Pagination structure

**Step 2: Assess DataTable fit**

If the table has expandable rows or inline actions that don't fit the DataTable API, either:
- a) Skip this migration (document why)
- b) Add an `expandable` feature to DataTable if it's simple enough

**Step 3: Migrate if feasible**

Define columns and replace table section.

**Step 4: Verify it builds**

Run: `npm run typecheck`

**Step 5: Commit**

```bash
git add src/pages/sales/Sales*.tsx
git commit -m "refactor: migrate SalesPage to DataTable component"
```

---

### Task 12: Final verification and cleanup

**Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 2: Run build**

Run: `npm run build`
Expected: Successful production build

**Step 3: Quick visual scan**

Run: `npm run dev`
Manually check 2-3 migrated pages to verify tables render correctly.

**Step 4: Commit any cleanup**

If any small fixes were needed:
```bash
git add -A
git commit -m "chore: table extraction cleanup"
```
