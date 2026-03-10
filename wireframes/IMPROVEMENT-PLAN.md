# ShopChain Codebase Improvement Plan

## Post-Refactoring Quality & Completeness Improvements

**Project:** ShopChain Inventory Management System
**Current State:** 108 TypeScript files, Vite build passing, ~75-80% of original refactoring plan completed
**Goal:** Bring codebase to production-ready quality with full type safety, consistent patterns, and all planned components

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Phase 6: Critical Fixes](#phase-6-critical-fixes)
3. [Phase 7: Architecture & State Management](#phase-7-architecture--state-management)
4. [Phase 8: Missing Components from Original Plan](#phase-8-missing-components-from-original-plan)
5. [Phase 9: Export & Import Consistency](#phase-9-export--import-consistency)
6. [Phase 10: TypeScript Hardening](#phase-10-typescript-hardening)
7. [Phase 11: Component Quality & Decomposition](#phase-11-component-quality--decomposition)
8. [Phase 12: Style System & DX](#phase-12-style-system--dx)
9. [Phase 13: Tooling & CI](#phase-13-tooling--ci)
10. [Priority Matrix](#priority-matrix)
11. [Implementation Order](#implementation-order)

---

## Current State Assessment

### What's Working
- 108 source files across types, constants, context, hooks, utils, components, and pages
- Vite build succeeds (1784 modules, 18.77s)
- Dev server starts in ~286ms
- Lazy loading with React.lazy + Suspense for all pages
- Theme system with 6 themes via ThemeContext/useColors()
- Responsive system with useBreakpoint() + rv()/rg() utilities
- Role-based access control with 9 roles
- Plan/subscription tiers with usage limit enforcement

### Key Issues Found
- 407 lines of TypeScript errors from `npx tsc --noEmit` (build passes because esbuild ignores type errors)
- Duplicated auth/toast state between App.tsx and contexts
- 8+ `any` type assertions in App.tsx
- Inconsistent export patterns (default vs named)
- Pages receiving `bp` as prop instead of using `useBreakpoint()` internally
- Multiple components exceeding 500 lines
- Missing layout, form, and utility components from the original refactoring plan
- No ESLint configuration
- ErrorBoundary exists but is unused

---

## Phase 6: Critical Fixes

**Priority:** CRITICAL
**Duration:** 0.5 days
**Goal:** Fix issues that affect correctness and prevent proper type checking

### 6.1 Remove Duplicate Auth State from App.tsx

**Problem:** App.tsx defines its own `AuthScreen` type, `Shop`/`Branch`/`Toast` interfaces, and manages `authScreen`, `activeShop`, `activeBranch` state locally. Meanwhile, `AuthContext` already provides all of this via `useAuth()`. The App.tsx versions shadow the context, creating two sources of truth.

**Files to modify:**
- `src/App.tsx` — Remove local `AuthScreen` type, `Shop`/`Branch` interfaces, and `authScreen`/`activeShop`/`activeBranch` state. Import and use `useAuth()` instead.
- `src/context/AuthContext.tsx` — Ensure it exports `AuthScreen` type for external use.

**Changes:**
```
App.tsx (BEFORE):
  - Local interfaces: Shop, Branch, Toast, LimitBlockedMsg, AuthScreen
  - Local state: authScreen, activeShop, activeBranch (+ 18 others)

App.tsx (AFTER):
  - Import { useAuth, type AuthScreen } from '@/context'
  - Use: const { authScreen, setAuthScreen, activeShop, ... } = useAuth()
  - Remove: local Shop/Branch/AuthScreen definitions
  - Keep: LimitBlockedMsg (not in context), page-level state (products, etc.)
```

### 6.2 Remove Duplicate Toast State from App.tsx

**Problem:** App.tsx manages its own `toasts` state with `addToast`/`removeToast` functions, but `ToastContext` provides `useToast()` which does the same thing with a different interface (App.tsx uses `{title, message, type}`, ToastContext uses `{message, type}`).

**Files to modify:**
- `src/App.tsx` — Remove local toast state and functions. Use `useToast()` from context.
- `src/context/ToastContext.tsx` — If App.tsx needs a `title` field, add it to the Toast interface.
- `src/components/features/ToastNotification.tsx` — Update to use `useToast()` for toast data if not already.

**Changes:**
```
ToastContext Toast interface:
  BEFORE: { id, message, type }
  AFTER:  { id, title?, message, type }

App.tsx:
  BEFORE: const [toasts, setToasts] = useState<Toast[]>([])
          const addToast = useCallback(...)
          const removeToast = useCallback(...)
  AFTER:  const { toasts, toast, removeToast } = useToast()
```

### 6.3 Fix Type Mismatches in Demo Data

**Problem:** `demoData.ts` defines `INITIAL_CATEGORIES` and `INITIAL_UNITS` with field names that don't match the types in `product.types.ts`.

**Files to check and fix:**
- `src/constants/demoData.ts` — Ensure Category objects have `{ id, name, icon, color, productCount? }` and UnitOfMeasure objects have `{ id, name, abbr, type }`.
- `src/types/product.types.ts` — Verify field definitions match actual usage across all page components.

### 6.4 Fix `any` Type Assertions in App.tsx

**Problem:** At least 8 uses of `any` in App.tsx including `selectedSupplier: any`, `selectedPO: any`, `selectedWarehouse: any`, and cast expressions like `setActiveShop as any`.

**Files to modify:**
- `src/App.tsx` — Replace `any` with proper types from `@/types`:
  ```
  selectedSupplier: any       ->  Supplier | null
  selectedPO: any             ->  PurchaseOrder | null
  selectedWarehouse: any      ->  Warehouse | null
  (i: any)                    ->  (i: UsageItem)
  (shop: any)                 ->  (shop: Shop)
  setActiveShop as any        ->  proper typed setter
  (s: string) as AuthScreen   ->  already AuthScreen type
  ```

---

## Phase 7: Architecture & State Management

**Priority:** HIGH
**Duration:** 1-2 days
**Goal:** Properly distribute state management and reduce App.tsx complexity

### 7.1 Create ShopContext for Shop/Branch State

**Problem:** App.tsx manages shop-related state (activeShop, activeBranch) that should be in a dedicated context, as specified in the original refactoring plan.

**New file:** `src/context/ShopContext.tsx`
**Provides:**
- `activeShop` / `setActiveShop`
- `activeBranch` / `setActiveBranch`
- `currentUserRole` / `setCurrentUserRole`
- `liveUsage` computed value
- `planUsage` computed value
- `canAdd(key)` helper
- `showLimitBlock(label)` helper
- `isDecisionMaker` derived boolean

**Files to modify:**
- `src/context/AppProviders.tsx` — Add `ShopProvider` to provider tree
- `src/context/index.ts` — Export `ShopProvider`, `useShop`
- `src/App.tsx` — Remove shop/role/plan state, use `useShop()` instead

### 7.2 Create NavigationContext for Page Routing

**Problem:** App.tsx manages `page`, `selectedProduct`, `selectedSupplier`, `selectedPO`, `selectedWarehouse` state, and passes setters as props to every page.

**New file:** `src/context/NavigationContext.tsx`
**Provides:**
- `page` / `setPage`
- `selectedProduct` / `setSelectedProduct`
- `selectedSupplier` / `setSelectedSupplier`
- `selectedPO` / `setSelectedPO`
- `selectedWarehouse` / `setSelectedWarehouse`
- `goToProduct(product)` — sets product and navigates
- `goToSupplier(supplier)` — sets supplier and navigates
- `goBack()` — smart back navigation

**Benefit:** Pages can use `useNavigation()` instead of receiving 5+ props for navigation. Reduces prop drilling significantly.

### 7.3 Migrate Pages to Use Context Hooks Instead of Props

**Problem:** Currently 20+ pages receive `bp`, `setPage`, `products`, etc. as props. This creates tight coupling and verbose prop passing in App.tsx's `renderPage()` switch.

**Approach:**
- Pages should call `useBreakpoint()` internally instead of receiving `bp` prop
- Pages should call `useNavigation()` instead of receiving `setPage`, `setSelectedProduct`, etc.
- Pages should call `useShop()` for `canAdd`, `showLimitBlock`, `currentUserRole`
- Only truly page-specific data (like `products` array) should remain as props

**Files to modify (12+ pages receiving `bp` as prop):**
- `DashboardPage`, `ProductsPage`, `CategoriesPage`, `UnitsPage`, `AddProductPage`
- `ProductDetailPage`, `AdjustmentsPage`, `TransfersPage`, `SuppliersPage`
- `SupplierDetailPage`, `POSPage`, `CustomersPage`, `TeamPage`
- `RolePermissionsPage`, `ShopSettingsPage`, `AccountPage`

---

## Phase 8: Missing Components from Original Plan

**Priority:** HIGH
**Duration:** 2-3 days
**Goal:** Create all components specified in the refactoring plan that haven't been implemented

### 8.1 Layout Components (`src/components/layout/`)

The original plan specifies 5 layout components that are currently all inlined in App.tsx (~300 lines of JSX for sidebar, header, mobile nav).

| Component | Description | Lines to extract from App.tsx |
|-----------|-------------|-------------------------------|
| `Sidebar.tsx` | Collapsible navigation sidebar with role-based menu filtering | ~100 lines |
| `Header.tsx` | Top bar with search, notifications, profile dropdown | ~80 lines |
| `MobileNav.tsx` | Mobile hamburger menu overlay | ~30 lines |
| `PageHeader.tsx` | Reusable page title + breadcrumb + action buttons | New component |
| `MainLayout.tsx` | Composes Sidebar + Header + content area | ~50 lines |

**New files:**
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/components/layout/PageHeader.tsx`
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/index.ts`

**Impact:** This will reduce App.tsx from ~500 lines to ~150 lines (just the page routing switch and state wiring).

### 8.2 Form Components (`src/components/forms/`)

The original plan specifies 3 form components that would reduce duplication across pages.

| Component | Description | Currently duplicated in |
|-----------|-------------|------------------------|
| `ProductForm.tsx` | Add/Edit product form with category/unit pickers | `AddProductPage.tsx`, `SupplierDetailPage.tsx` |
| `SupplierForm.tsx` | Add/Edit supplier form | `AddSupplierModal.tsx`, `SuppliersPage.tsx` |
| `CustomerForm.tsx` | Add/Edit customer form | `CustomersPage.tsx` |

**New files:**
- `src/components/forms/ProductForm.tsx`
- `src/components/forms/SupplierForm.tsx`
- `src/components/forms/CustomerForm.tsx`
- `src/components/forms/index.ts`

### 8.3 Missing Feature Components

| Component | Description | Currently inlined in |
|-----------|-------------|---------------------|
| `RoleSwitcher.tsx` | Dev/demo role switcher dropdown | `App.tsx` (header area) |
| `BranchSelector.tsx` | Active branch selector in header | `App.tsx` (header area) |

**New files:**
- `src/components/features/RoleSwitcher.tsx`
- `src/components/features/BranchSelector.tsx`

### 8.4 Missing Modal Components

| Component | Description | Status |
|-----------|-------------|--------|
| `BaseModal.tsx` | Reusable modal wrapper (backdrop, close, animation) | Missing - all modals duplicate this logic |
| `UpgradeModal.tsx` | Plan upgrade prompt | Inlined in `App.tsx` |
| `ConfirmModal.tsx` | Generic confirmation dialog | Missing - inlined ad hoc in multiple pages |

**New files:**
- `src/components/modals/BaseModal.tsx`
- `src/components/modals/UpgradeModal.tsx`
- `src/components/modals/ConfirmModal.tsx`

### 8.5 Missing Utility Files

| File | Description | Status |
|------|-------------|--------|
| `src/utils/validators.ts` | Form validation helpers (`isValidEmail`, `isValidPhone`, `isRequired`) | Missing |
| `src/utils/cn.ts` | ClassName merge utility (for conditional style objects) | Missing |

### 8.6 Missing Dashboard Sub-components

The original plan specifies a `pages/dashboard/components/` directory:

| Component | Description |
|-----------|-------------|
| `KPICard.tsx` | Reusable KPI stat card with icon, trend, mini-chart |
| `LowStockAlerts.tsx` | Low stock product list with progress bars |
| `RecentActivity.tsx` | Activity feed with timeline |

---

## Phase 9: Export & Import Consistency

**Priority:** MEDIUM
**Duration:** 0.5 days
**Goal:** Standardize all module exports to follow one consistent pattern

### 9.1 Standardize Export Pattern

**Current state:**
- ~20 page files use `export default` (e.g., `DashboardPage`, `ProductsPage`)
- ~13 page files use named exports only (e.g., `export const POSPage`, `export function RolePermissionsPage`)
- App.tsx has two different lazy import patterns as a result

**Decision needed:** Pick ONE pattern and apply it everywhere.

**Recommended approach:** Named exports everywhere (aligns with the original refactoring plan and enables better tree shaking / IDE support).

```
BEFORE (mixed):
  export default function DashboardPage()  // some files
  export const POSPage = ()               // other files

AFTER (consistent named exports):
  export function DashboardPage()          // all files
```

**Files to modify:** All 20+ page files that currently use `export default`, plus App.tsx lazy imports.

**App.tsx lazy import pattern (after standardization):**
```typescript
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage }))
);
```

### 9.2 Standardize Modal Import Patterns

**Current state:** Some pages import modals via barrel (`@/components/modals`), others use direct paths (`@/components/modals/ScannerModal`).

**Fix:** All modal imports should go through the barrel `@/components/modals` index.

### 9.3 Standardize Barrel Index Exports

**Current state:** Some barrel files use `export { X } from './X'`, others use `export { default as X } from './X'`.

**Fix:** All barrel files should use the same pattern, matching the chosen export style.

---

## Phase 10: TypeScript Hardening

**Priority:** HIGH
**Duration:** 1-2 days
**Goal:** Zero `tsc --noEmit` errors, full strict mode compliance

### 10.1 Fix All 407 Lines of Type Errors

**Error categories and counts (approximate):**
| Category | Count | Fix Strategy |
|----------|-------|-------------|
| Unused imports (TS6133) | ~150 | Remove or use imports |
| Type mismatch on page props | ~80 | Align page prop types with App.tsx state types |
| `any` usage (TS7006, TS2345) | ~50 | Replace with proper types |
| Missing properties on objects | ~40 | Add missing fields to demo data or make optional |
| Implicit `any` parameters | ~30 | Add parameter types |
| Category/Unit field mismatches | ~20 | Align demoData with type definitions |
| Other type errors | ~37 | Case-by-case fixes |

### 10.2 Enable All Strict TypeScript Options

**File:** `tsconfig.json`

Ensure these are all enabled (some may already be):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 10.3 Add Missing Type Exports

**File:** `src/types/index.ts`

Ensure `pages.types.ts` exports are included:
```typescript
export * from './pages.types';
```

Also verify all types used across the codebase are properly exported:
- `PageId` — used in navigation
- `PageProps` — base page prop interface
- `AuthScreen` — from AuthContext
- `Breakpoint` — from breakpoints.ts
- `ToastType` — from ToastContext

### 10.4 Replace Magic Strings with Type-Safe Constants

**Problem:** Multiple hardcoded z-index values, color alpha values, and magic numbers scattered across components.

**New file:** `src/constants/zIndex.ts`
```typescript
export const Z_INDEX = {
  dropdown: 100,
  modal: 200,
  mobileBackdrop: 998,
  mobileSidebar: 999,
  toast: 1000,
} as const;
```

**New additions to constants:**
- Z-index scale
- Animation duration constants
- Common spacing/sizing tokens

---

## Phase 11: Component Quality & Decomposition

**Priority:** MEDIUM
**Duration:** 1-2 days
**Goal:** Break oversized components into manageable pieces

### 11.1 Split Large Page Components

| Component | Current Lines | Recommended Split |
|-----------|---------------|-------------------|
| `POSPage.tsx` | 1,136 | `POSPage` + `Cart.tsx` + `PaymentPanel.tsx` + `ProductGrid.tsx` |
| `AccountPage.tsx` | 984 | `AccountPage` + `ProfileTab.tsx` + `SubscriptionTab.tsx` + `SecurityTab.tsx` |
| `TeamPage.tsx` | 655 | `TeamPage` + `InviteMemberModal.tsx` + `EditMemberModal.tsx` |
| `SuperAdminDashboard.tsx` | 485 | `SuperAdminDashboard` + `AdminUsersPanel.tsx` + `AdminShopsPanel.tsx` + `AdminOverview.tsx` |
| `ShopSettingsPage.tsx` | 540 | `ShopSettingsPage` + `GeneralTab.tsx` + `BillingTab.tsx` + `IntegrationsTab.tsx` |
| `CreateShopWizard.tsx` | 500+ | `CreateShopWizard` + individual step components |
| `CustomersPage.tsx` | 600+ | `CustomersPage` + `CustomerDetailPanel.tsx` + `AddCustomerModal.tsx` |
| `ProductsPage.tsx` | 500+ | `ProductsPage` + `ProductTable.tsx` + `ProductFilters.tsx` |

### 11.2 Extract Inline Modals

**Problem:** `TeamPage.tsx` has `InviteMemberModal` and `EditMemberModal` defined inline. Other pages have similar patterns.

**Move to:** `src/components/modals/InviteMemberModal.tsx` and `EditMemberModal.tsx`

### 11.3 Integrate ErrorBoundary

**Problem:** `ErrorBoundary` component exists at `src/components/ErrorBoundary.tsx` but is never used.

**Files to modify:**
- `src/App.tsx` — Wrap the main layout with `<ErrorBoundary>`
- Each lazy-loaded page route could have its own `<ErrorBoundary>` for granular error isolation

### 11.4 Centralize Scattered Constants

**Problem:** Various constants are defined locally in page files instead of in the constants directory.

| Constant | Currently in | Should be in |
|----------|-------------|-------------|
| `DEMO_BARCODES` | Inline in page | `src/constants/demoData.ts` |
| `PERMISSION_LEVELS` | Inline in RolePermissionsPage | `src/constants/permissions.ts` |
| `ADMIN_THEMES` | Inline in SuperAdminDashboard | `src/constants/themes.ts` or `src/constants/adminThemes.ts` |
| `RECEIPT_TEMPLATES` | Inline in POSPage | `src/constants/demoData.ts` |

---

## Phase 12: Style System & DX

**Priority:** LOW-MEDIUM
**Duration:** 1-2 days
**Goal:** Reduce inline style duplication and improve developer experience

### 12.1 Create Shared Style Utilities

**Problem:** 1000+ inline `style={{...}}` objects across all pages, with many repeated patterns for common elements (table headers, list items, section titles, form labels, icon containers).

**New file:** `src/utils/styles.ts`
```typescript
// Reusable style factories
export const tableHeaderStyle = (colors: ThemeColors): CSSProperties => ({
  fontSize: 11,
  fontWeight: 700,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  padding: '12px 16px',
  borderBottom: `1px solid ${colors.border}`,
});

export const sectionTitleStyle = (colors: ThemeColors): CSSProperties => ({
  fontSize: 15,
  fontWeight: 700,
  color: colors.text,
  marginBottom: 12,
});

export const iconContainerStyle = (color: string, size: number = 40): CSSProperties => ({
  width: size,
  height: size,
  borderRadius: size * 0.25,
  background: `${color}18`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const formLabelStyle = (colors: ThemeColors): CSSProperties => ({
  fontSize: 11,
  fontWeight: 700,
  color: colors.textMuted,
  display: 'block',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});
```

### 12.2 Create a `cn()` Utility (Optional)

**File:** `src/utils/cn.ts`

A simple utility for merging style objects conditionally:
```typescript
export function mergeStyles(...styles: (CSSProperties | false | null | undefined)[]): CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}
```

### 12.3 Extract Repeated Inline Components

Several "micro-components" are duplicated across pages and should be extracted:

| Pattern | Occurrences | Proposed Component |
|---------|-------------|--------------------|
| Search input with icon | 10+ pages | Already have `Input` with `icon` prop - ensure all pages use it |
| Tab bar (horizontal tabs) | 5+ pages | `src/components/ui/TabBar.tsx` |
| Stat card (icon + label + value) | 4+ pages | `src/components/ui/StatCard.tsx` |
| Section header with action button | 8+ pages | Part of `PageHeader.tsx` |
| Toggle switch | 3+ pages | `src/components/ui/ToggleSwitch.tsx` |

---

## Phase 13: Tooling & CI

**Priority:** MEDIUM
**Duration:** 0.5 days
**Goal:** Set up development tooling for ongoing quality maintenance

### 13.1 ESLint Configuration

**Problem:** No ESLint configuration exists. The original plan specified one.

**New file:** `.eslintrc.cjs`
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

**Dependencies to install:**
```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh
```

### 13.2 Add npm Scripts

**File:** `package.json` — Add scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ --ext .ts,.tsx --fix",
    "preview": "vite preview"
  }
}
```

### 13.3 Bundle Analysis Setup

**Optional but recommended:**
```bash
npm install --save-dev rollup-plugin-visualizer
```

Add to `vite.config.ts` for build analysis.

---

## Priority Matrix

| Priority | Phase | Description | Effort | Impact |
|----------|-------|-------------|--------|--------|
| CRITICAL | 6 | Critical Fixes (duplicate state, type mismatches, `any` types) | 0.5 days | High - prevents bugs and confusion |
| HIGH | 7 | Architecture & State Management (contexts, reduce prop drilling) | 1-2 days | High - improves maintainability |
| HIGH | 8 | Missing Components from Plan (layout, forms, modals) | 2-3 days | High - completes the refactoring |
| HIGH | 10 | TypeScript Hardening (zero tsc errors) | 1-2 days | High - enables strict type checking |
| MEDIUM | 9 | Export & Import Consistency | 0.5 days | Medium - consistency and DX |
| MEDIUM | 11 | Component Decomposition (split large files) | 1-2 days | Medium - readability and reuse |
| MEDIUM | 13 | Tooling & CI (ESLint, scripts) | 0.5 days | Medium - ongoing quality |
| LOW-MED | 12 | Style System & DX (shared styles, micro-components) | 1-2 days | Medium - reduces duplication |

**Total estimated effort: 7-13 days**

---

## Implementation Order

### Sprint 1: Foundation Fixes (Days 1-2)
1. Phase 6.1 — Remove duplicate auth state from App.tsx
2. Phase 6.2 — Remove duplicate toast state from App.tsx
3. Phase 6.3 — Fix demo data type mismatches
4. Phase 6.4 — Eliminate all `any` types in App.tsx
5. Phase 9.1 — Standardize export pattern across all files
6. Phase 10.3 — Add missing type exports

### Sprint 2: Architecture (Days 3-5)
7. Phase 7.1 — Create ShopContext
8. Phase 7.2 — Create NavigationContext
9. Phase 7.3 — Migrate pages to use context hooks (remove `bp` prop)
10. Phase 8.1 — Extract layout components (Sidebar, Header, MainLayout)
11. Phase 8.4 — Create BaseModal, UpgradeModal, ConfirmModal

### Sprint 3: Completeness (Days 6-8)
12. Phase 8.2 — Create form components
13. Phase 8.3 — Create feature components (RoleSwitcher, BranchSelector)
14. Phase 8.5 — Create validators.ts utility
15. Phase 8.6 — Create dashboard sub-components
16. Phase 10.1 — Fix all TypeScript errors (iterate with `tsc --noEmit`)
17. Phase 10.2 — Enable all strict TypeScript options

### Sprint 4: Polish (Days 9-11)
18. Phase 11.1 — Split POSPage into sub-components
19. Phase 11.1 — Split AccountPage into tab components
20. Phase 11.1 — Split TeamPage (extract inline modals)
21. Phase 11.3 — Integrate ErrorBoundary
22. Phase 11.4 — Centralize scattered constants
23. Phase 12.1 — Create shared style utilities
24. Phase 12.3 — Extract TabBar, StatCard, ToggleSwitch components

### Sprint 5: Tooling (Day 12)
25. Phase 13.1 — ESLint configuration
26. Phase 13.2 — Add npm scripts
27. Phase 13.3 — Bundle analysis
28. Final `tsc --noEmit` verification (must be zero errors)
29. Final `vite build` verification

---

## Success Criteria

When all phases are complete:

- [ ] `npx tsc --noEmit` produces **zero errors**
- [ ] `npx vite build` succeeds
- [ ] No `any` types in production code (only in test/mock data if needed)
- [ ] All page components use hooks internally (`useBreakpoint()`, `useColors()`, `useNavigation()`)
- [ ] No page receives `bp` as a prop
- [ ] App.tsx is under 200 lines
- [ ] No component exceeds 400 lines
- [ ] All components from the original refactoring plan exist
- [ ] ESLint passes with zero errors
- [ ] ErrorBoundary wraps the application
- [ ] All exports follow the same pattern (named exports)
- [ ] All modal components use BaseModal as wrapper
- [ ] Bundle size is reasonable (check with visualizer)

---

## File Inventory: What Exists vs What's Missing

### Exists (108 files)
```
src/types/            9 files  - All type modules
src/constants/        5 files  - themes, plans, breakpoints, demoData, index
src/context/          5 files  - Theme, Toast, Auth, AppProviders, index
src/hooks/            5 files  - useBreakpoint, useDebounce, useLocalStorage, usePagination, index
src/utils/            6 files  - formatters, pagination, planUsage, responsive, typeGuards, index
src/components/ui/   12 files  - Badge, Button, Card, EmptyState, Input, MiniChart, Paginator, ProgressBar, Select, Skeleton, StatusBadge, index
src/components/modals/ 8 files - AddSupplier, BarcodeStripes, PrintBarcode, PrintPriceTag, PurchaseOrder, QuickAddCategory, QuickAddUnit, ReorderLevel, Scanner, index
src/components/features/ 4 files - ShopLogo, ThemePicker, ToastNotification, index
src/components/       2 files  - ErrorBoundary, index
src/pages/           52 files  - All page components + barrel indexes
```

### Missing (from original plan)
```
src/context/ShopContext.tsx              - Shop/branch state management
src/context/NavigationContext.tsx        - Page navigation state (new addition)
src/components/layout/Sidebar.tsx       - Sidebar navigation
src/components/layout/Header.tsx        - Top header bar
src/components/layout/MobileNav.tsx     - Mobile navigation overlay
src/components/layout/PageHeader.tsx    - Page title + breadcrumb
src/components/layout/MainLayout.tsx    - Main layout compositor
src/components/layout/index.ts          - Barrel export
src/components/forms/ProductForm.tsx    - Product add/edit form
src/components/forms/SupplierForm.tsx   - Supplier add/edit form
src/components/forms/CustomerForm.tsx   - Customer add/edit form
src/components/forms/index.ts           - Barrel export
src/components/features/RoleSwitcher.tsx   - Role switcher dropdown
src/components/features/BranchSelector.tsx - Branch selector dropdown
src/components/modals/BaseModal.tsx     - Reusable modal wrapper
src/components/modals/UpgradeModal.tsx  - Plan upgrade modal
src/components/modals/ConfirmModal.tsx  - Confirmation dialog
src/utils/validators.ts                - Form validation helpers
src/utils/cn.ts                        - Style merge utility
src/utils/styles.ts                    - Shared style factories
src/constants/zIndex.ts                - Z-index scale
src/constants/permissions.ts           - Permission level constants
src/pages/dashboard/components/KPICard.tsx       - KPI card
src/pages/dashboard/components/LowStockAlerts.tsx - Low stock list
src/pages/dashboard/components/RecentActivity.tsx - Activity feed
src/pages/pos/components/Cart.tsx          - POS cart
src/pages/pos/components/PaymentPanel.tsx  - POS payment
src/pages/pos/components/ProductGrid.tsx   - POS product grid
.eslintrc.cjs                          - ESLint configuration
```

**Total missing: ~30 files**
