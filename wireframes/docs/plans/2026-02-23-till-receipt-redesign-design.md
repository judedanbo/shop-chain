# Till Receipt Redesign

## Goal

Redesign the till close receipt in `TillManagementPage.tsx` to match the POS thermal receipt style, replacing the "Payment Details" section with "Order Details" showing line items per order.

## Current State

The `renderReceiptContent` function renders a monospace receipt with:
- Till info (name, operator, times)
- Order summary (counts only)
- Payment summary (grouped by method)
- Payment details (individual payment records with method/amount/timestamps)

## New Design

Adopt the POS thermal receipt visual style:
- White background, Courier New monospace font, torn paper edges, drop shadow
- Shop header from `activeShop`/`activeBranch` context
- Till info section
- Order summary counts
- **Order details**: each order listed with its line items (name, qty, price, amount), order type, and order total
- Payment summary (grouped by method, kept for reconciliation)
- Grand total
- Footer with "Powered by ShopChain"

## Sections Removed

- PAYMENT DETAILS (individual payment records per order)

## Data Sources

- `activeShop` / `activeBranch` from `useShop()` context for shop header
- `getOrdersForTill(tillId)` returns `KitchenOrder[]` with `items: KitchenOrderItem[]` (name, qty) and `orderType`, `total`
- `till.payments` grouped by method for payment summary
- `till.totalPaymentAmount` for grand total

## Approach

Inline rewrite of `renderReceiptContent` in `TillManagementPage.tsx`. No new components or files needed.
