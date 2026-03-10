# Plan: Migrate Remaining Inline Styles to Tailwind CSS Utility Classes

## Overview

The codebase contains **1,386 inline `style={{...}}` occurrences** across **97 `.tsx` files**. After categorization, approximately **~250 are convertible**, **~150 are semi-convertible** (conditional ternaries with static values), and **~980 are legitimate** (dynamic/computed values that must remain inline). This plan targets the convertible and semi-convertible styles.

## Audit Summary

### Style count by CSS property (most frequent)

| Property | Count | Convertible? |
|----------|-------|-------------|
| `color` | 332 | Mostly LEGITIMATE (dynamic theme colors via `COLORS.*` / `C.*`) |
| `padding` | 163 | **~60% CONVERTIBLE** (static values like `'8px 12px'`) |
| `background` | 73 | Mostly LEGITIMATE (gradients, hex-alpha, theme colors) |
| `fontSize` | 17 | **~70% CONVERTIBLE** (static values like `13`, `11`, `10`) |
| `borderBottom` | 14 | Mostly LEGITIMATE (dynamic `${C.border}`) |
| `marginRight` / `marginBottom` | 23 | **~50% CONVERTIBLE** |
| `flex` | 13 | Mostly LEGITIMATE (responsive calculations) |
| `fontWeight` | 9 | **~80% CONVERTIBLE** (static values like `700`, `800`) |
| `border` | 10 | Mostly LEGITIMATE (dynamic border color) |
| `animation` / `boxShadow` / `transform` | 56 | LEGITIMATE (keep inline) |

### Category breakdown

| Category | Count | % | Action |
|----------|-------|---|--------|
| **CONVERTIBLE** | ~250 | 18% | Replace with Tailwind classes |
| **SEMI-CONVERTIBLE** | ~150 | 11% | Refactor with `clsx` + Tailwind classes |
| **LEGITIMATE** | ~986 | 71% | Keep as inline styles |

### What stays as inline `style`

These **must** remain as inline styles per the project's Styling Guide in CLAUDE.md:

- Dynamic theme colors: `COLORS.*`, `C.*`, `colors.*` references (~203 occurrences)
- Computed hex-alpha: `${COLORS.primary}20`, `${color}40`
- CSS gradients: `linear-gradient(135deg, ${COLORS.primary}, ...)`
- `boxShadow`, `animation`, `backdropFilter`, `transform` (~56 occurrences)
- Dynamic conditional colors based on runtime data
- SVG/chart coordinates and data-driven values
- `gridTemplateColumns` computed from data
- Print-specific styles (PrintBarcodeModal, PrintPriceTagModal)
- `accentColor` on form inputs (no Tailwind equivalent)
- Component prop-driven values (width, height, borderRadius from props)

---

## Implementation Phases

### Phase 1: Common Patterns (global find-and-replace)

Target the most frequent **static patterns** that repeat across many files. These can be done with scripted replacements.

#### 1A. Static padding values

These appear in table cells, form elements, and card sections across ~30 files:

| Inline Style | Tailwind Replacement | Approx Count |
|-------------|---------------------|-------------|
| `padding: '8px 12px'` | `px-3 py-2` | ~25 |
| `padding: '6px 10px'` | `px-2.5 py-1.5` | ~15 |
| `padding: '12px 16px'` | `px-4 py-3` | ~12 |
| `padding: '16px 20px'` | `px-5 py-4` | ~8 |
| `padding: '10px 16px'` | `px-4 py-2.5` | ~6 |
| `padding: '3px 8px'` | `px-2 py-[3px]` | ~5 |
| `padding: '2px 6px'` | `px-1.5 py-0.5` | ~4 |
| `padding: '0 16px'` | `px-4` | ~4 |
| `padding: 16` | `p-4` | ~4 |
| `padding: 40` | `p-10` | ~3 |
| `padding: '18px 24px'` | `px-6 py-[18px]` | ~3 |
| `padding: '40px 24px'` | `px-6 py-10` | ~2 |

**Files affected:** AdminFinancesTab, AdminAuditFraudTab, AdminSubscriptionsTab, TeamPage, SupplierDetailPage, PODetailPage, SaleVerificationPage, CustomersPage, and ~20 more.

#### 1B. Static fontSize values

| Inline Style | Tailwind Replacement | Approx Count |
|-------------|---------------------|-------------|
| `fontSize: 10` | `text-[10px]` | ~5 |
| `fontSize: 11` | `text-[11px]` | ~4 |
| `fontSize: 12` | `text-xs` | ~3 |
| `fontSize: 13` | `text-[13px]` | ~3 |
| `fontSize: 14` | `text-sm` | ~2 |

#### 1C. Static fontWeight values

| Inline Style | Tailwind Replacement | Approx Count |
|-------------|---------------------|-------------|
| `fontWeight: 700` | `font-bold` | ~4 |
| `fontWeight: 800` | `font-extrabold` | ~3 |
| `fontWeight: 600` | `font-semibold` | ~2 |

#### 1D. Static text/layout properties

| Inline Style | Tailwind Replacement | Approx Count |
|-------------|---------------------|-------------|
| `textTransform: 'uppercase'` | `uppercase` | ~5 |
| `textAlign: 'center'` | `text-center` | ~4 |
| `textAlign: 'right'` | `text-right` | ~3 |
| `letterSpacing: 0.5` | `tracking-[0.5px]` | ~4 |
| `overflow: 'auto'` | `overflow-auto` | ~3 |
| `overflow: 'hidden'` | `overflow-hidden` | ~2 |
| `whiteSpace: 'nowrap'` | `whitespace-nowrap` | ~2 |

#### 1E. Static margin values

| Inline Style | Tailwind Replacement | Approx Count |
|-------------|---------------------|-------------|
| `marginBottom: 8` | `mb-2` | ~4 |
| `marginBottom: 2` | `mb-[2px]` | ~3 |
| `marginRight: 3` or `4` | `mr-[3px]` / `mr-1` | ~6 |

#### 1F. Static border/display properties

| Inline Style | Tailwind Replacement | Approx Count |
|-------------|---------------------|-------------|
| `display: 'flex'` | `flex` | ~3 |
| `display: 'grid'` | `grid` | ~2 |
| `display: 'none'` | `hidden` | ~2 |
| `position: 'relative'` | `relative` | ~2 |
| `borderRadius: 8` | `rounded-lg` | ~2 |

**Estimated total Phase 1 conversions: ~180**

---

### Phase 2: Semi-Convertible Ternaries (manual per-file)

These are inline styles with conditional values that can be expressed as `clsx(condition ? 'classA' : 'classB')`. Each requires manual inspection.

#### 2A. Conditional colors (keep as inline where dynamic, convert where static)

Many of these use `COLORS.*` and must stay inline. But a subset use fixed hex values or map to semantic classes:

```tsx
// BEFORE (semi-convertible)
style={{ color: isActive ? '#fff' : '#888' }}

// AFTER
className={clsx(isActive ? 'text-white' : 'text-[#888]')}
```

#### 2B. Alternating row backgrounds

A common pattern in admin tables:

```tsx
// BEFORE
style={{ background: i % 2 === 0 ? 'transparent' : C.surfaceAlt }}

// AFTER (if C.surfaceAlt maps to bg-surface-alt)
className={clsx(i % 2 !== 0 && 'bg-surface-alt')}
```

**Files:** AdminFinancesTab (~10), AdminAuditFraudTab (~8), AdminSubscriptionsTab (~6), SupplierDetailPage (~4), PODetailPage (~4).

#### 2C. Conditional padding/sizing

```tsx
// BEFORE
style={{ padding: compact ? '6px 8px' : '12px 16px' }}

// AFTER
className={clsx(compact ? 'px-2 py-1.5' : 'px-4 py-3')}
```

#### 2D. Conditional display/visibility

```tsx
// BEFORE
style={{ display: showX ? 'block' : 'none' }}

// AFTER
className={clsx(!showX && 'hidden')}
```

**Estimated total Phase 2 conversions: ~70** (the remaining ~80 semi-convertible involve dynamic theme colors and must stay inline)

---

### Phase 3: File-by-File Deep Clean (Top 10 files)

These files have the highest style counts and benefit most from focused attention. Each should be read in full, with every `style={{` evaluated individually.

| Priority | File | Total Styles | Convertible + Semi | Remaining |
|----------|------|-------------|-------------------|-----------|
| P1 | `src/pages/admin/AdminFinancesTab.tsx` | 101 | ~50 | ~51 |
| P2 | `src/pages/admin/AdminAuditFraudTab.tsx` | 88 | ~38 | ~50 |
| P3 | `src/pages/admin/AdminSubscriptionsTab.tsx` | 81 | ~34 | ~47 |
| P4 | `src/pages/purchaseOrders/PODetailPage.tsx` | 68 | ~20 | ~48 |
| P5 | `src/pages/team/TeamPage.tsx` | 65 | ~25 | ~40 |
| P6 | `src/pages/verify/SaleVerificationPage.tsx` | 53 | ~20 | ~33 |
| P7 | `src/pages/onboarding/CreateShopWizard.tsx` | 47 | ~18 | ~29 |
| P8 | `src/pages/settings/ShopSettingsPage.tsx` | 46 | ~18 | ~28 |
| P9 | `src/pages/pos/POSReceipt.tsx` | 40 | ~12 | ~28 |
| P10 | `src/pages/admin/AdminInvestorsTab.tsx` | 36 | ~14 | ~22 |

### Phase 4: Remaining Files (37 files with 5-29 styles each)

After Phase 3, continue with the remaining files in descending order of style count:

| Group | Files | Styles per file | Total styles |
|-------|-------|----------------|-------------|
| A (15-29) | SupplierDetailPage, SubscriptionTab, CustomersPage, ScannerModal, TillReceiptPreview, SalesAnalysisPage, ProductDetailPage, AdminTeamTab, WarehouseDetailPage | ~24 avg | ~216 |
| B (10-17) | CategoriesPage, POSPaymentForm, PurchaseOrdersPage, ShopSelectScreen, AccountPage, AddSupplierModal, SecurityTab, KitchenDisplayPage, ReorderLevelModal, SalesPage, AdminUsersTab, AdminOverviewTab, Sidebar, NotificationsTab, RolePermissionsPage, ProfileTab, AuthHelpers, SuperAdminDashboard | ~12 avg | ~216 |
| C (1-9) | Remaining 40 files | ~4 avg | ~160 |

### Phase 5: Verification & Cleanup

1. Run `npm run build` — TypeScript strict mode + Vite production build must pass
2. Run `npm run format` — Prettier conformance
3. Search for any empty `style={{}}` or `style={{...s}}` left behind after removing properties
4. Verify no visual regressions (spot-check key flows)

---

## Conversion Rules

### DO convert to Tailwind:
- Static numeric padding/margin: `padding: 16` → `p-4`
- Static shorthand padding: `padding: '8px 12px'` → `px-3 py-2`
- Static fontSize: `fontSize: 13` → `text-[13px]`
- Static fontWeight: `fontWeight: 700` → `font-bold`
- Static textAlign/textTransform/letterSpacing
- Static display/overflow/position
- Conditional ternaries where BOTH sides are static values

### DO NOT convert (keep inline):
- Any value referencing `COLORS.*`, `C.*`, `colors.*` (dynamic theme)
- Hex-alpha computed values: `${COLORS.primary}20`
- CSS gradients, boxShadow, animation, backdropFilter, transform
- `accentColor` (no Tailwind equivalent)
- `gridTemplateColumns` computed from data
- Props-driven values (width, height, borderRadius from component props)
- Print-specific styles (PrintBarcodeModal, PrintPriceTagModal)
- SVG/chart coordinates
- `rv()` / `rg()` responsive helper return values

### Partial conversion:
When a `style={{...}}` has a mix of convertible and legitimate properties, extract only the convertible ones to `className` and keep the rest in `style`:

```tsx
// BEFORE
<div style={{ padding: '8px 12px', color: COLORS.text, border: `1px solid ${COLORS.border}` }}>

// AFTER
<div className="px-3 py-2" style={{ color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
```

If ALL properties in a `style={{}}` are converted, remove the `style` attribute entirely.

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Total `style={{` | 1,386 | ~1,136 |
| Convertible removed | — | ~250 |
| Remaining (legitimate) | — | ~1,136 |
| % inline styles eliminated | — | ~18% |

The remaining ~1,136 are all **legitimate** dynamic styles that cannot be expressed with Tailwind utilities.

---

## Execution Strategy

- **Phases 1A-1F** can be executed in parallel with scripted replacements (one agent per pattern group)
- **Phases 2A-2D** require manual per-file editing but can be parallelized by file batch
- **Phases 3-4** should be done file-by-file, largest first, with a build check after each batch
- **Phase 5** is a single verification pass at the end

Total estimated effort: **~400 individual style conversions across ~60 files**.
