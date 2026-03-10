# DataTable Component Extraction — Design

**Date:** 2026-02-23
**Status:** Approved

## Problem

~18 files across the codebase repeat inline table/grid-table styles. There are no shared Table/TableHeader/TableCell components. Every table duplicates `width: '100%'`, `borderCollapse: 'collapse'`, header typography (uppercase, dim text, small font), cell padding, row borders, alternating backgrounds, hover effects, and mobile/desktop branching.

## Current State

Two table rendering patterns exist in the codebase:

- **HTML `<table>` elements** — 3 files (TeamPage, PurchaseOrdersPage, AdminUsersTab)
- **CSS Grid-based layouts** — 12-17 files using `display: 'grid'` with `gridTemplateColumns`

Both patterns share identical styling conventions but implement them independently.

## Decision

**Approach A: Single `DataTable` component using CSS Grid.** All table-like layouts (including the 3 HTML table files) will be migrated to a single grid-based component. This is a wireframe/prototype app, so semantic HTML tables are not critical.

## Component API

```tsx
interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;           // Grid column width (e.g., '2fr', '80px'). Default: '1fr'
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyExtractor?: (row: T) => string | number;
  striped?: boolean;        // Alternating row backgrounds. Default: true
  hoverable?: boolean;      // Row hover effect. Default: true
  emptyMessage?: string;    // Shown when data is empty. Default: "No data to display"
  compact?: boolean;        // Reduced padding variant
}
```

## Rendering

### Desktop (CSS Grid)

- **Container:** `width: '100%'`, `overflow: 'auto'`
- **Header row:** `display: 'grid'`, `gridTemplateColumns` built from column widths, `background: COLORS.surfaceAlt`, `borderBottom: 1px solid COLORS.border`
- **Header cells:** `fontSize: 11`, `fontWeight: 700`, `textTransform: 'uppercase'`, `letterSpacing: 0.5`, `padding: '12px 16px'`, `color: COLORS.textDim`
- **Data rows:** Same grid template, `padding: '12px 16px'`, `borderBottom: 1px solid COLORS.border`
- **Hover:** `background: COLORS.surfaceAlt` on mouseEnter (when `hoverable`)
- **Striped:** Odd rows get `COLORS.surfaceAlt` background
- **Compact:** `padding: '6px 8px'`, `fontSize: 12`

### Mobile (Card Layout)

- Uses `useBreakpoint()` to detect mobile
- Each row renders as a `Card` component
- Columns marked `hideOnMobile` are omitted
- Each visible column becomes a label-value pair (header as label, cell content as value)
- `onRowClick` still works on the card

## File Location

- **New file:** `src/components/ui/DataTable.tsx`
- **Barrel export:** Added to `src/components/ui/index.ts`
- **Conventions:** Named export, inline styles via `useColors()`, responsive via `useBreakpoint()`

## Edge Cases

- **Empty data:** Centered empty message in table area
- **Row click:** Adds `cursor: 'pointer'` and hover when `onRowClick` is provided
- **`keyExtractor`:** Defaults to `(row) => row.id`, falls back to array index
- **Column width:** Defaults to `'1fr'` when not specified
- **`accessor` vs `render`:** `render` takes priority; if neither is provided, cell is empty

## Migration Scope

~18 files will be refactored to use `<DataTable>`:

**HTML table migrations (3):**
- TeamPage.tsx
- PurchaseOrdersPage.tsx
- AdminUsersTab.tsx

**Grid-based table migrations (12-17):**
- CustomersPage.tsx
- ReceiveOrdersPage.tsx
- AdminShopsTab.tsx
- SalesAnalysisPage.tsx
- Inventory pages
- And others identified during implementation
