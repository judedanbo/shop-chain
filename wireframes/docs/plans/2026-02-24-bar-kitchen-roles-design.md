# Bar & Kitchen Roles Design

**Date:** 2026-02-24
**Status:** Approved
**Approach:** Add 3 new roles (Bar Manager, Waiter, Kitchen Staff) with a dedicated Bar & Kitchen permission module

## Requirements Summary

1. Add Bar Manager role — full bar/kitchen operations, 25% discount limit, analysis access
2. Add Waiter role — Bar POS, till management, serve/cancel orders, 5% discount limit
3. Add Kitchen Staff role — Kitchen Display only (accept, reject, complete orders)
4. New "Bar & Kitchen" permission module with fine-grained keys
5. Update navigation gating to use new permission keys

## Section 1: New Roles

| Role | ID | Icon | Color | Description |
|------|----|------|-------|-------------|
| Bar Manager | `bar_manager` | `🍸` | `#D946EF` | Full bar/kitchen operations, discounts, analysis |
| Waiter | `waiter` | `🍽️` | `#F472B6` | Bar POS, till mgmt, serve/cancel, small discounts |
| Kitchen Staff | `kitchen_staff` | `👨‍🍳` | `#FB923C` | Kitchen Display only |

## Section 2: New Permission Module

Add to `PERM_MODULES`:

```typescript
{ module: 'Bar & Kitchen', perms: [
  { key: 'bar_access', label: 'Bar & Restaurant POS' },
  { key: 'bar_discount', label: 'Apply bar discounts' },
  { key: 'kitchen_access', label: 'Kitchen Display' },
  { key: 'bar_analysis', label: 'Sales & Kitchen Analysis' },
]}
```

## Section 3: Permission Matrix — New Roles

| Permission | Bar Manager | Waiter | Kitchen Staff |
|------------|-------------|--------|---------------|
| dash_view | partial | none | none |
| dash_export | none | none | none |
| prod_view | view | view | none |
| prod_edit – prod_price | none | none | none |
| cat_view, uom_view | none | none | none |
| bar_access | full | full | none |
| bar_discount | full | partial | none |
| kitchen_access | full | view | full |
| bar_analysis | full | none | none |
| pos_sales – pos_receipts | none | none | none |
| po_* | none | none | none |
| sup_*, wh_*, adj_*, xfer_* | none | none | none |
| team_*, set_* | none | none | none |

## Section 4: Permission Matrix — Existing Roles Update

Add new keys to all existing roles:

| Permission | owner | general_manager | manager | inv_mgr | inv_off | salesperson | cashier | accountant | viewer |
|------------|-------|-----------------|---------|---------|---------|-------------|---------|------------|--------|
| bar_access | full | full | full | none | none | full | none | none | none |
| bar_discount | full | full | full | none | none | partial | none | none | none |
| kitchen_access | full | full | full | none | none | full | none | none | none |
| bar_analysis | full | full | full | none | none | none | none | full | view |

## Section 5: Navigation Gating Changes

Update `NAV_PERM_MAP`:
- `barPos`: `pos_sales` → `bar_access`
- `kitchen`: `pos_sales` → `kitchen_access`
- `tillManagement`: `pos_sales` → `bar_access`
- Add `salesAnalysis`: `bar_analysis`

## Section 6: Discount Limits

Add to `DISCOUNT_ROLE_LIMITS`:
- `bar_manager`: 25
- `waiter`: 5
- `kitchen_staff`: 0

## Section 7: Files Affected

- `src/types/user.types.ts` — add `bar_manager`, `waiter`, `kitchen_staff` to UserRole
- `src/constants/demoData.ts` — ROLES array, DEFAULT_PERMISSIONS, NAV_PERM_MAP, DISCOUNT_ROLE_LIMITS, PERM_MODULES
- No context/component changes needed — system is generic
