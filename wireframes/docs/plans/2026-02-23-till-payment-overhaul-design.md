# Till Payment Overhaul — Design

**Date:** 2026-02-23
**Status:** Approved

## Goal

Redesign the Till Management payment flow to: remove per-order payments, support till-level multi-payment (like POS), gate till closing on unresolved orders, and require payment before closing.

## Changes

### 1. Remove per-order payment, add till-level payment

Remove "Pay" buttons from individual order cards. Keep a single "Payment" button in the till header that opens the payment panel showing the total outstanding amount (sum of served/completed order totals minus payments already collected).

The operator can make multiple payments against this total — e.g. cash first, then card for the rest. Each payment reduces the outstanding balance. `isBulkPayment` flag and `payingOrderId` state are removed. `recordBulkPayment` becomes the single payment recording mechanism creating one `TillPayment` per payment action.

Payment panel always shows:
- Total outstanding amount
- Payment method selector (Cash / Card / MoMo)
- Method-specific inputs
- "Process Payment" button
- After processing: success state with "Done" / "Pay More"

### 2. Close-till gating on unresolved orders

When "Close Till" is clicked, check for unresolved orders (status: `pending`, `accepted`, `completed`). If any exist:
- Show the confirmation modal with a warning listing unresolved orders grouped by status
- Disable the "Close Till" button
- Operator must serve, cancel, or reject all unresolved orders first

### 3. Close-till payment flow

1. Click "Close Till" -> check unresolved orders (block if any)
2. All orders resolved -> show payment panel pre-filled with outstanding balance
3. Outstanding balance is zero -> show panel with GH₵ 0.00 and "Proceed to Close" button
4. After payment (or proceed on zero) -> close till -> show receipt

New `isClosingTill` state flag tracks the close-till flow. When payment completes during this flow, auto-proceed to close till and show receipt.
