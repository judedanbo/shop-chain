# Inline Style → Tailwind CSS Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate all 2,801 remaining inline `style={{}}` props across 87 files to Tailwind utility classes.

**Architecture:** Layer-by-layer migration — each task converts one category of CSS properties across ALL files, then commits. This ensures consistent conversions and enables mechanical find-and-replace. The design doc at `docs/plans/2026-02-25-inline-style-migration-design.md` contains the full mapping tables.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite 7

**Verification after every task:** `npm run typecheck && npm run build` — both must pass with zero errors.

---

### Task 1: Add `xl2` custom breakpoint

**Files:**
- Modify: `src/styles/globals.css`

**Step 1: Add breakpoint to @theme block**

In `src/styles/globals.css`, add inside the existing `@theme` block:

```css
--breakpoint-xl2: 1440px;
```

**Step 2: Verify**

```bash
npm run typecheck && npm run build
```

**Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "chore: add xl2 breakpoint (1440px) to Tailwind theme"
```

---

### Task 2: Migrate static layout — `src/components/`

Convert these properties to Tailwind classes in ALL files under `src/components/`:

- `padding: N` → `p-*` (see design doc mapping)
- `padding: 'Xpx Ypx'` → `px-* py-*`
- `margin*: N` → `m*-*`
- `margin: '0 0 Xpx'` → `mb-*`
- `gap: N` → `gap-*`
- `display: 'flex'` → `flex`, `display: 'grid'` → `grid`, etc.
- `flex: 1` → `flex-1`
- `justifyContent: X` → `justify-*`
- `alignItems: X` → `items-*`
- `width: '100%'` → `w-full`, `width: N` → `w-[Npx]`
- `height: N` → `h-[Npx]`
- `minWidth: N` → `min-w-[Npx]`, `maxWidth: N` → `max-w-[Npx]`
- `overflow: 'hidden'` → `overflow-hidden`, `overflow: 'auto'` → `overflow-auto`
- `position: 'relative'` → `relative`, etc.

**Rules:**
- Move static properties from `style={{}}` to `className`
- If all properties in a `style` prop are converted, remove the `style` prop entirely
- If only some are converted, keep the remaining dynamic ones in `style`
- Use `clsx` if the file already imports it; otherwise append to the className string
- Do NOT convert properties that use `rv()`, `rg()`, ternary expressions, or COLORS references

**Files:** `src/components/ui/`, `src/components/layout/`, `src/components/features/`, `src/components/modals/`, `src/components/ErrorBoundary.tsx`, `src/components/QrCode.tsx`

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: migrate static layout styles to Tailwind in src/components/`

---

### Task 3: Migrate static layout — `src/pages/` (batch 1: smaller files)

Same conversions as Task 2, targeting these files (≤25 style instances each):

- `src/pages/auth/` (all files)
- `src/pages/dashboard/` (all files)
- `src/pages/notifications/NotificationsPage.tsx`
- `src/pages/verify/SaleVerificationPage.tsx`
- `src/pages/warehouse/WarehousesPage.tsx`
- `src/pages/products/ProductsPage.tsx`
- `src/pages/suppliers/SuppliersPage.tsx`
- `src/pages/barPos/OrderPanel.tsx`
- `src/pages/barPos/ProductCatalog.tsx`

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: migrate static layout styles to Tailwind in pages (batch 1)`

---

### Task 4: Migrate static layout — `src/pages/` (batch 2: medium files)

Same conversions, targeting files with 25-60 style instances:

- `src/pages/products/AddProductPage.tsx`
- `src/pages/products/CategoriesPage.tsx`
- `src/pages/products/UnitsPage.tsx`
- `src/pages/products/ProductDetailPage.tsx`
- `src/pages/products/PriceMovementChart.tsx`
- `src/pages/inventory/AdjustmentsPage.tsx`
- `src/pages/inventory/TransfersPage.tsx`
- `src/pages/inventory/ReceiveOrdersPage.tsx`
- `src/pages/purchaseOrders/PurchaseOrdersPage.tsx`
- `src/pages/suppliers/SupplierDetailPage.tsx`
- `src/pages/customers/CustomersPage.tsx`
- `src/pages/sales/SalesPage.tsx`
- `src/pages/sales/SalesAnalysisPage.tsx`
- `src/pages/team/RolePermissionsPage.tsx`
- `src/pages/onboarding/ShopSelectScreen.tsx`

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: migrate static layout styles to Tailwind in pages (batch 2)`

---

### Task 5: Migrate static layout — `src/pages/` (batch 3: large files)

Same conversions, targeting the heaviest files (60+ style instances):

- `src/pages/pos/POSPage.tsx`
- `src/pages/barPos/BarPOSPage.tsx`
- `src/pages/barPos/TillOrdersDrawer.tsx`
- `src/pages/kitchen/KitchenDisplayPage.tsx`
- `src/pages/onboarding/CreateShopWizard.tsx`
- `src/pages/team/TeamPage.tsx`
- `src/pages/warehouse/WarehouseDetailPage.tsx`
- `src/pages/settings/AccountPage.tsx`
- `src/pages/settings/ShopSettingsPage.tsx`
- `src/pages/tillManagement/TillManagementPage.tsx`
- `src/pages/purchaseOrders/PODetailPage.tsx`
- `src/pages/admin/AdminLoginScreen.tsx`
- `src/pages/admin/AdminOverviewTab.tsx`
- `src/pages/admin/AdminShopsTab.tsx`
- `src/pages/admin/AdminSettingsTab.tsx`
- `src/pages/admin/AdminUsersTab.tsx`
- `src/pages/admin/AdminTeamTab.tsx`
- `src/pages/admin/AdminAnnouncementsTab.tsx`
- `src/pages/admin/AdminInvestorsTab.tsx`
- `src/pages/admin/AdminFinancesTab.tsx`
- `src/pages/admin/AdminAuditFraudTab.tsx`
- `src/pages/admin/AdminSubscriptionsTab.tsx`
- `src/pages/admin/SuperAdminDashboard.tsx`
- `src/App.tsx`

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: migrate static layout styles to Tailwind in pages (batch 3)`

---

### Task 6: Migrate typography styles (all files)

Convert across ALL `src/` files:

- `fontSize: 6` → `text-[6px]`, ..., `fontSize: 9` → `text-[9px]`
- `fontSize: 10` → `text-[10px]`
- `fontSize: 11` → `text-[11px]`
- `fontSize: 12` → `text-xs`
- `fontSize: 13` → `text-[13px]`
- `fontSize: 14` → `text-sm`
- `fontSize: 15` → `text-[15px]`
- `fontSize: 16` → `text-base`
- `fontSize: 17` → `text-[17px]`
- `fontSize: 18` → `text-lg`
- `fontSize: 19` → `text-[19px]`
- `fontSize: 20` → `text-xl`
- `fontSize: 22` → `text-[22px]`
- `fontSize: 24` → `text-2xl`
- `fontSize: 28` → `text-[28px]`
- `fontWeight: 500` → `font-medium`
- `fontWeight: 600` → `font-semibold`
- `fontWeight: 700` → `font-bold`
- `fontWeight: 800` → `font-extrabold`
- `fontWeight: 900` → `font-black`
- `textAlign: 'center'` → `text-center`
- `textAlign: 'right'` → `text-right`
- `textAlign: 'left'` → `text-left`
- `letterSpacing: N` → `tracking-[Npx]`
- `textTransform: 'uppercase'` → `uppercase`
- `textTransform: 'capitalize'` → `capitalize`
- `textTransform: 'none'` → `normal-case`

Only convert STATIC values. Skip `fontSize: rv(...)` or `fontSize: someVar ? X : Y`.

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: migrate typography inline styles to Tailwind classes`

---

### Task 7: Migrate borders and border-radius (all files)

Convert across ALL `src/` files:

- `borderRadius: 4` → `rounded`, `borderRadius: 6` → `rounded-[6px]`, `borderRadius: 8` → `rounded-lg`, `borderRadius: 10` → `rounded-[10px]`, `borderRadius: 12` → `rounded-xl`, `borderRadius: 14` → `rounded-[14px]`, `borderRadius: 16` → `rounded-2xl`, `borderRadius: 18` → `rounded-[18px]`, `borderRadius: 20` → `rounded-[20px]`, `borderRadius: '50%'` → `rounded-full`
- `borderCollapse: 'collapse'` → `border-collapse`
- Static borders like `borderBottom: 'none'` → `border-b-0`
- `borderTop: 'none'` → `border-t-0`

Note: borders with `${COLORS.border}` interpolation will be handled in the theme color task (Task 9). For now, only convert fully static border values.

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: migrate border and border-radius styles to Tailwind classes`

---

### Task 8: Replace rv()/rg() with Tailwind responsive prefixes

This is the most complex task. Replace all `rv()` and `rg()` calls with Tailwind responsive classes.

**Breakpoint mapping:**
- ShopChain `sm` → base (no prefix)
- ShopChain `md` → `sm:`
- ShopChain `lg` → `md:`
- ShopChain `xl` → `lg:`
- ShopChain `xl2` → `xl2:`

**Conversion approach for each rv() call:**
1. Read the breakpoint values object
2. The `sm` value becomes the base class (no prefix)
3. Each subsequent breakpoint value gets the mapped Tailwind prefix
4. Move from `style` to `className`

**Examples:**
```tsx
// padding: rv(bp, { sm: '12px 16px', lg: '14px 48px' })
// → className="px-4 py-3 md:px-12 md:py-3.5"

// gap: rv(bp, { sm: 12, lg: 16 })
// → className="gap-3 md:gap-4"

// flexDirection: rv(bp, { sm: 'column', lg: 'row' }) as CSSProperties['flexDirection']
// → className="flex-col md:flex-row"

// gridTemplateColumns: rg(bp, { sm: 1, md: 2, lg: 3, xl: 5 })
// → className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"

// gridTemplateColumns: rv(bp, { sm: '1fr', lg: '1fr 320px' }) as string
// → className="grid-cols-1 md:grid-cols-[1fr_320px]"

// fontSize: rv(bp, { sm: 17, md: 19, lg: 22 })
// → className="text-[17px] sm:text-[19px] md:text-[22px]"

// width: rv(bp, { sm: '100%', md: '94%', lg: '500px' })
// → className="w-full sm:w-[94%] md:w-[500px]"
```

**Important:**
- After converting all rv()/rg() calls in a file, check if `bp` (from `useBreakpoint()`) is still used elsewhere. If not, remove the `const bp = useBreakpoint()` declaration.
- If `rv` and `rg` imports are no longer used, remove them.
- Remove `as React.CSSProperties[...]` type casts that were needed for rv() return values.
- Some rv() calls return values used as React props (like `size` on Lucide icons): `size={rv(bp, { sm: 18, lg: 22 }) as number}` — these must stay as JS expressions but can be simplified to conditional: `size={bp === 'sm' ? 18 : 22}` or left as-is if Tailwind can't express them.

**Files:** All 87 files with inline styles. Focus on files that heavily use rv()/rg(): CreateShopWizard.tsx, SupplierDetailPage.tsx, ShopSelectScreen.tsx, POSPage.tsx, AdminSubscriptionsTab.tsx, etc.

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: replace rv()/rg() responsive helpers with Tailwind breakpoint prefixes`

---

### Task 9: Migrate hex-alpha colors to Tailwind opacity modifiers

Convert `${COLORS.xxx}HH` and `COLORS.xxx + 'HH'` patterns to Tailwind opacity modifier classes.

**Hex-alpha mapping (from design doc):**
- `08` → `/[0.03]`, `10` → `/[0.06]`, `12` → `/[0.07]`, `14` → `/[0.08]`, `15` → `/[0.08]`
- `18` → `/[0.09]`, `20` → `/[0.13]`, `25` → `/[0.15]`, `30` → `/[0.19]`
- `33` → `/[0.20]`, `35` → `/[0.21]`, `38` → `/[0.22]`, `40` → `/[0.25]`
- `50` → `/[0.31]`, `60` → `/[0.38]`, `80` → `/50`, `90` → `/[0.56]`

**Conversion examples:**
```tsx
// background: `${COLORS.primary}15`  →  className="bg-primary/[0.08]"
// background: COLORS.success + '18'  →  className="bg-success/[0.09]"
// border: `1px solid ${COLORS.primary}40`  →  className="border border-primary/[0.25]"
// color: `${COLORS.danger}80`  →  className="text-danger/50"
```

**Important edge cases:**
- When hex alpha is used in `border` shorthand with width: split into `border` + `border-color/opacity` classes
- When hex alpha is in a ternary: `isActive ? COLORS.primary + '20' : 'transparent'` — use `clsx`: `clsx(isActive && 'bg-primary/[0.13]')`
- When the same color is used with different alpha in different states: use both classes with appropriate conditions
- Some hex alphas are on `boxShadow` — these MUST stay inline (Tailwind can't express shadow colors with opacity easily)

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: migrate hex-alpha colors to Tailwind opacity modifiers`

---

### Task 10: Migrate theme color references to Tailwind classes

Convert direct COLORS/C references to Tailwind semantic classes:

**Background colors:**
- `background: COLORS.surface` → `bg-surface`
- `background: COLORS.surfaceAlt` → `bg-surface-alt`
- `background: COLORS.bg` → `bg-bg`
- `background: COLORS.primaryBg` → `bg-primary-bg`
- `background: COLORS.successBg` → `bg-success-bg`
- `background: COLORS.dangerBg` → `bg-danger-bg`
- `background: COLORS.warningBg` → `bg-warning-bg`
- `background: COLORS.accentBg` → `bg-accent-bg`
- `background: COLORS.orangeBg` → `bg-orange-bg`
- `background: COLORS.primary` → `bg-primary`
- `background: 'rgba(0,0,0,0.5)'` → `bg-black/50`
- `background: 'transparent'` → `bg-transparent`

**Text colors:**
- `color: COLORS.text` → `text-text`
- `color: COLORS.textMuted` → `text-text-muted`
- `color: COLORS.textDim` → `text-text-dim`
- `color: COLORS.primary` → `text-primary`
- `color: COLORS.primaryLight` → `text-primary-light`
- `color: COLORS.success` → `text-success`
- `color: COLORS.warning` → `text-warning`
- `color: COLORS.danger` → `text-danger`
- `color: COLORS.accent` → `text-accent`
- `color: COLORS.orange` → `text-orange`
- `color: '#fff'` or `color: '#ffffff'` → `text-white`

**Border colors:**
- `borderColor: COLORS.border` → `border-border`
- `borderColor: COLORS.primary` → `border-primary`
- Border shorthand `border: \`1.5px solid ${COLORS.border}\`` → `border-[1.5px] border-border`

**Important:**
- Only convert STATIC color references. Skip ternaries like `color: isActive ? COLORS.primary : COLORS.textDim`
- For ternaries where one branch is a theme color: use `clsx` with conditional Tailwind classes
- If COLORS/C is no longer used after all conversions in a file, remove the `useColors()` call and import

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: migrate theme color inline styles to Tailwind semantic classes`

---

### Task 11: Migrate remaining static props

Convert any remaining convertible inline styles:

- `cursor: 'pointer'` → `cursor-pointer`
- `cursor: 'not-allowed'` → `cursor-not-allowed`
- `cursor: 'default'` → `cursor-default`
- `opacity: 0.5` → `opacity-50`, `opacity: 0.6` → `opacity-60`, etc.
- `transition: 'all 0.15s'` → `transition-all duration-150`
- `transition: 'background 0.15s'` → `transition-[background] duration-150`
- `transition: 'all .2s'` → `transition-all duration-200`
- `whiteSpace: 'nowrap'` → `whitespace-nowrap`
- `whiteSpace: 'pre-wrap'` → `whitespace-pre-wrap`
- `verticalAlign: 'middle'` → `align-middle`
- `verticalAlign: 'top'` → `align-top`
- `verticalAlign: -2` → `align-[-2px]`
- `resize: 'vertical'` → `resize-y`
- `resize: 'none'` → `resize-none`
- `listStyle: 'none'` → `list-none`
- `outline: 'none'` → `outline-none`
- `textDecoration: 'none'` → `no-underline`
- `textDecoration: 'line-through'` → `line-through`
- `wordBreak: 'break-all'` → `break-all`
- `objectFit: 'cover'` → `object-cover`
- `pointerEvents: 'none'` → `pointer-events-none`
- `userSelect: 'none'` → `select-none`
- `backdropFilter: 'blur(Xpx)'` → `backdrop-blur-[Xpx]`

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: migrate remaining static props to Tailwind classes`

---

### Task 12: Cleanup — remove empty styles and unused imports

Across ALL files:

1. Remove empty `style={{}}` props (left over from moving all properties to className)
2. Remove empty `style={{ }}` (with spaces)
3. Remove `style` props that only contain `...style` spread (keep if the component accepts a `style` prop from parent)
4. Check each file: if `COLORS` / `C` / `useColors()` is no longer referenced, remove the import
5. Check each file: if `rv` / `rg` is no longer referenced, remove the import
6. Check each file: if `useBreakpoint` / `bp` is no longer referenced, remove the import
7. Check each file: if `isMobile` / `isDesktop` helpers are no longer used, remove them
8. Remove any unused `as React.CSSProperties[...]` type casts

**Verify:** `npm run typecheck && npm run build`

**Commit:** `refactor: remove empty style props and unused imports after Tailwind migration`

---

### Task 13: Format and final verification

**Step 1: Run prettier**
```bash
npm run format
```

**Step 2: Full verification**
```bash
npm run format:check && npm run typecheck && npm run build
```

**Step 3: Count remaining inline styles**
Search for `style={{` across `src/` and report the count. These should only be truly dynamic values that cannot be expressed in Tailwind.

**Step 4: Commit**
```bash
git commit -m "chore: format after Tailwind migration and verify final state"
```
