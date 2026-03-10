# Component Extraction Design — Recommendation #8

**Date:** 2026-02-26
**Branch:** `refactor/hover-handlers-to-tailwind`
**Scope:** Top 3 largest page files (POSPage, TillManagementPage, AccountPage)

## Approach

- **Colocated sub-components**: new files live alongside parent in same directory
- **Props from parent**: parent keeps all state; sub-components are controlled/presentational
- **Barrel unchanged**: only main page exported through `index.ts`
- **Follows existing patterns**: matches `dashboard/` (KPICard, etc.) and `barPos/` (ProductCatalog, OrderPanel, etc.)

## POSPage.tsx (2602 → ~600 parent + 5 files)

| File | Content |
|------|---------|
| `POSReceipt.tsx` | Receipt screen: status banner, customer card, thermal receipt, action buttons |
| `POSCartPanel.tsx` | Cart panel: items list, discount section, payment method, pay button |
| `POSPaymentForm.tsx` | Single + split payment entry (nested in cart) |
| `POSSalesLog.tsx` | Sales log modal with KPIs and reversal history |
| `POSProductGrid.tsx` | Product catalog grid, search bar, category chips |

## TillManagementPage.tsx (1908 → ~400 parent + 6 files)

| File | Content |
|------|---------|
| `TillListPanel.tsx` | Till list with status cards |
| `TillOrderCard.tsx` | Individual order card with action buttons |
| `TillAddOrderForm.tsx` | New order form: type, table, product search, cart |
| `TillPaymentPanel.tsx` | Payment entry: method, amount, discount, confirmation |
| `TillReceiptPreview.tsx` | Thermal receipt modal for till close |
| `TillDetailPanel.tsx` | Right-side detail panel: header, actions, orders |

## AccountPage.tsx (1847 → ~200 parent + 5 files)

| File | Content |
|------|---------|
| `ProfileTab.tsx` | Avatar + profile form |
| `SubscriptionTab.tsx` | Plan card, payment methods, billing history, payment modal |
| `SecurityTab.tsx` | Password form, 2FA setup, active sessions |
| `UsageTab.tsx` | Usage metrics, role banners, upgrade nudge |
| `NotificationsTab.tsx` | Notification prefs + quiet hours |

PlanComparisonModal stays in parent (shared across tabs).

## Total: 16 new files, 3 refactored parents
