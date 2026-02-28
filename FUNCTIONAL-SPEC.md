# ShopChain Functional Specification Document

**Version:** 1.2
**Date:** 2026-02-28
**Status:** Draft
**Audience:** Developers, QA, Product

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Data Models & Relationships](#3-data-models--relationships)
4. [User Roles & RBAC](#4-user-roles--rbac)
5. [Subscription Plans & Enforcement](#5-subscription-plans--enforcement)
6. [Authentication & Onboarding Flow](#6-authentication--onboarding-flow)
7. [Screen-by-Screen Specification](#7-screen-by-screen-specification)
8. [POS Business Logic](#8-pos-business-logic)
9. [Inventory Business Logic](#9-inventory-business-logic)
10. [Purchase Order Workflow](#10-purchase-order-workflow)
11. [Notification System](#11-notification-system)
12. [Admin Portal](#12-admin-portal)
13. [API Endpoints (Planned)](#13-api-endpoints-planned)
14. [Form Validation Rules](#14-form-validation-rules)
15. [Error Handling](#15-error-handling)
16. [Responsive Behavior](#16-responsive-behavior)
17. [Theme System](#17-theme-system)
18. [Known Gaps & Future Work](#18-known-gaps--future-work)

---

## 1. Product Overview

**ShopChain** is a multi-tenant, web-based inventory management and point-of-sale (POS) platform targeting small and medium businesses in Ghana. It serves two user populations:

- **Shop operators** (business owners and staff) managing day-to-day inventory, sales, purchases, customers, and teams.
- **Platform admins** (ShopChain company staff) managing all tenants, subscriptions, finances, and platform health.

### 1.1 Core Capabilities

| Module | Summary |
|---|---|
| **Dashboard** | Real-time KPIs, stock alerts, expiry tracking, recent activity |
| **Products** | Full product catalog with categories, units, batch/lot tracking |
| **POS** | Register with cart, discounts, multi-payment (cash/card/MoMo/split), receipts |
| **Sales** | Transaction history, reversal workflow, analytics |
| **Purchase Orders** | PO lifecycle from draft to received, with goods receiving |
| **Inventory** | Adjustments, transfers, batch tracking (FEFO), receive orders |
| **Suppliers** | Supplier directory linked to products and POs |
| **Customers** | CRM with purchase history and loyalty points |
| **Warehouses** | Multi-location inventory with zones and capacity |
| **Team** | Staff management with granular RBAC (12 roles, 36 permissions) |
| **Bar & Restaurant** | Bar/restaurant POS with kitchen display, till management, and order lifecycle |
| **Settings** | Shop config, branches, billing, integrations |
| **Account** | Personal user profile, active sessions, payment methods, billing history |
| **Notifications** | Role-filtered alerts across 7 categories |
| **Admin Portal** | Platform-level management (10 tabs) for ShopChain staff |

### 1.2 Currency & Locale

- Default currency: **GH₵** (Ghana Cedi). Formatted by `formatCurrency()` as `GH₵ 1,234.56`.
- Default tax rate: **Inconsistent across the codebase (known gap).**
  - POS register: hardcoded at **12.5%**, labeled "NHIL/VAT (12.5%)" on receipts. This does not correspond to a standard Ghana tax composite.
  - Shop creation wizard and Shop Settings: both default the configurable `taxRate` field to **15%** (matching Ghana's standard VAT rate).
  - The POS does not yet read from the shop's `taxRate` setting — this should be wired up to fetch the shop's configured tax rate via the API.
  - Admin Finances uses separate Ghana corporate tax rates (`GH_TAX`): Corporate 25%, NHIL 2.5%, GETFund 2.5%, COVID levy 1%, VAT 15%. These apply to ShopChain's own financials, not to shop-level sales tax.
- Locale: Ghana (16 regions for address selection: Greater Accra, Ashanti, Western, Eastern, Central, Northern, Volta, Bono, Upper East, Upper West, Ahafo, Bono East, North East, Oti, Savannah, Western North).
- Phone validation: regex pattern `^[\d\s+()-]{7,20}$` — accepts 7-20 characters of digits, spaces, `+`, `()`, and `-`. The validator does **not** enforce a `+233` country prefix; that prefix appears only in demo seed data.

---

## 2. Tech Stack & Architecture

### 2.1 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 + Vue 3 + TypeScript |
| Build | Nuxt (Vite-based, built-in) |
| Icons | lucide-vue-next |
| Routing | Nuxt file-based routing (`pages/` directory) |
| State | Pinia stores |
| Styling | Tailwind CSS + Nuxt UI component library (Radix Vue-based) |
| Conditional Classes | Vue built-in `:class` binding (object/array syntax) |
| Validation | Zod schemas with Nuxt UI form integration |
| Real-time | laravel-echo + pusher-js (Reverb WebSocket client) |

### 2.2 Architecture Patterns

- **Code splitting**: Nuxt auto-splits by route; each `pages/*.vue` file becomes a lazy-loaded chunk automatically.
- **State management**: Pinia stores for shared state (`auth`, `shop`, `notification`, `kitchen`). Composables for reusable reactive logic.
- **Routing**: Nuxt file-based routing — `pages/` directory structure defines routes automatically. Dynamic segments use `[param]` syntax (e.g., `pages/products/[id].vue`).
- **Path aliases**: `~/` resolves to the project root. Nuxt auto-imports components, composables, and utilities — no manual import statements required.
- **Build optimization**: Nuxt handles chunk splitting, tree-shaking, and asset optimization automatically via its Vite-based build pipeline.
- **TypeScript strict mode**: `nuxt.config.ts` enables strict TypeScript via `typescript.strict: true`. Combined with `nuxi typecheck` in CI for compile-time verification.

### 2.3 Project Structure

```
apps/web/                  # Nuxt 3 application root
├── app.vue                # Root component (<NuxtLayout> + <NuxtPage>)
├── nuxt.config.ts         # Nuxt configuration (modules, runtime config, TypeScript)
├── error.vue              # Global error page (replaces ErrorBoundary)
├── assets/
│   └── css/main.css       # Global resets, Tailwind @theme bridge, animations
├── types/                 # TypeScript interfaces (auto-generated from OpenAPI + manual)
│   └── api.d.ts           # Generated from OpenAPI spec via openapi-typescript
├── stores/                # Pinia stores
│   ├── auth.ts            # User, tokens, OAuth2 PKCE, login/logout
│   ├── shop.ts            # Active shop, branches, plan usage, canAdd()
│   ├── notification.ts    # Notifications, unread count, mark-as-read
│   └── kitchen.ts         # Tills, kitchen orders, held orders, payments
├── composables/           # Reusable reactive logic
│   ├── useBreakpoint.ts   # Reactive breakpoint detection
│   ├── useDebounce.ts     # Debounced ref
│   ├── usePagination.ts   # Pagination state and helpers
│   └── useLocalStorage.ts # Reactive localStorage binding
├── utils/                 # Pure utility functions
│   ├── formatters.ts      # Currency, date, number formatters
│   ├── batchUtils.ts      # Batch/lot helper functions
│   ├── planUsage.ts       # Plan usage computation
│   ├── validators.ts      # Zod schemas for form validation
│   └── responsive.ts      # Breakpoint helper functions
├── plugins/               # Nuxt plugins (auto-registered)
│   ├── api.ts             # $fetch wrapper with auth token injection
│   └── echo.ts            # Laravel Echo + Pusher client for Reverb
├── middleware/             # Route middleware
│   ├── auth.ts            # Redirect unauthenticated → /login
│   ├── guest.ts           # Redirect authenticated → /dashboard
│   ├── shop.ts            # Ensure shop selected → /shops
│   └── permission.ts      # Check role permissions for target page
├── layouts/               # Nuxt layouts
│   ├── default.vue        # Main layout (sidebar, header, mobile nav)
│   ├── auth.vue           # Auth pages layout (login, register, etc.)
│   └── admin.vue          # Admin portal layout
├── components/            # Auto-imported Vue components
│   ├── layout/            # Sidebar, Header, MobileNav
│   ├── modals/            # PurchaseOrderModal, ConfirmModal, etc.
│   └── features/          # PlanUsageBanner, RoleSwitcher, ThemePicker
└── pages/                 # File-based routing
    ├── login.vue           # Login
    ├── register.vue        # Register
    ├── forgot-password.vue # Forgot password
    ├── reset-password.vue  # Reset password
    ├── verify/[token].vue  # Email verification (public)
    ├── shops/
    │   ├── index.vue       # Shop selection
    │   └── create.vue      # Create shop wizard
    ├── dashboard.vue       # Dashboard
    ├── products/
    │   ├── index.vue       # Product list
    │   ├── [id].vue        # Product detail
    │   ├── add.vue         # Add product
    │   ├── categories.vue  # Categories management
    │   └── units.vue       # Units of measure
    ├── inventory/
    │   ├── adjustments.vue # Stock adjustments
    │   ├── transfers.vue   # Stock transfers
    │   └── receive.vue     # Receive orders
    ├── pos.vue             # POS register
    ├── bar-pos.vue         # Bar POS
    ├── kitchen.vue         # Kitchen display
    ├── till-management.vue # Till management
    ├── sales/
    │   ├── index.vue       # Sales history
    │   └── analysis.vue    # Sales analysis
    ├── purchase-orders/
    │   ├── index.vue       # PO list
    │   └── [id].vue        # PO detail
    ├── suppliers/
    │   ├── index.vue       # Supplier list
    │   └── [id].vue        # Supplier detail
    ├── customers/
    │   └── index.vue       # Customer list
    ├── warehouses/
    │   ├── index.vue       # Warehouse list
    │   └── [id].vue        # Warehouse detail
    ├── team/
    │   ├── index.vue       # Team members
    │   └── roles.vue       # Role permissions
    ├── settings.vue        # Shop settings
    ├── account.vue         # User account
    ├── notifications.vue   # Notifications
    └── admin/
        └── index.vue       # Admin portal (tab-based)
```

---

## 3. Data Models & Relationships

### 3.1 Entity Relationship Diagram (Conceptual)

```
Shop (1) ─────── (N) Branch
  │                    │
  │                    └── type: retail | warehouse | distribution
  │                    └── isDefault: boolean
  ├──── (1) ShopSettings        (optional config object)
  │
  ├──── (N) Product
  │         │
  │         ├── (N) Batch                (optional, when batchTracking=true)
  │         ├── ··· Category             (loose string match on Category.name)
  │         ├── ··· UnitOfMeasure        (loose string match on UnitOfMeasure.abbreviation)
  │         └── ··· Supplier             (loose string match on Supplier.name, optional)
  │
  ├──── (N) PurchaseOrder
  │         │
  │         ├── (1) Supplier             (FK: supplierId → Supplier.id)
  │         └── (N) PurchaseOrderItem ── ··· Product (loose: productId matches Product.id)
  │
  ├──── (N) SaleRecord
  │         │
  │         ├── (N) SaleItem             (embedded, product ref by id)
  │         ├── (0..1) Customer          (nullable: customerId)
  │         └── (0..N) SaleSplit         (embedded, only if paymentMethod='split')
  │
  ├──── (N) StockAdjustment ── ··· Product (loose: product name string)
  ├──── (N) StockTransfer   ── ··· Product (loose: product name string)
  ├──── (N) Customer
  ├──── (N) Supplier
  ├──── (N) Warehouse
  │         └── (N) zones (string[])
  ├──── (N) Notification (AppNotification)
  │
  └──── (N) User / TeamMember
            │
            ├── (1) Role ── (N) Permissions
            ├── (N) Branch (assignment via branchIds[])
            ├── (N) Session
            ├── (N) PaymentMethod
            └── (N) PaymentRecord
```

> **Note on relationship notation:** `(1)` and `(N)` denote formal foreign key relationships. `···` denotes a **loose string match** — the field holds a plain string that matches another entity's field by convention, with no referential integrity constraint enforced in the current type system.

### 3.2 Product

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | SKU code, e.g. `SKU-001`. Must be unique within shop. |
| `name` | `string` | Yes | Display name |
| `category` | `string` | Yes | Category name. Matches `Category.name` by convention (loose string, no FK constraint). |
| `price` | `number` | Yes | Selling price in GH₵. Must be > 0. |
| `cost` | `number` | Yes | Cost/purchase price in GH₵. Must be >= 0. |
| `stock` | `number` | Yes | Current quantity on hand. Derived from batches if batch-tracked. |
| `reorder` | `number` | Yes | Low stock threshold. When `stock <= reorder`, status becomes `low_stock`. |
| `unit` | `string` | Yes | Unit of measure abbreviation (e.g. `kg`, `bottles`). Matches `UnitOfMeasure.abbreviation` by convention (loose string, no FK constraint). |
| `status` | `ProductStatus` | Computed | `in_stock`, `low_stock`, or `out_of_stock` |
| `location` | `string` | Yes | Primary warehouse/location name |
| `image` | `string` | Yes | Emoji or image URL |
| `barcode` | `string` | No | EAN/UPC barcode. Must be unique if provided. |
| `supplier` | `string` | No | Supplier name |
| `description` | `string` | No | Product description |
| `lastUpdated` | `string` | No | ISO date of last modification. Optional (`lastUpdated?: string`). |
| `expiryDate` | `string` | No | Earliest batch expiry date (ISO). Auto-derived if batch-tracked. |
| `batchTracking` | `boolean` | No | Whether lot/batch tracking is enabled |
| `batches` | `Batch[]` | No | Array of batch records (only if `batchTracking=true`) |
| `skipKitchen` | `boolean` | No | When `true`, item bypasses the Kitchen Display and is fulfilled directly at the bar (auto-completed order). Used by the Bar POS subsystem. |

**Status computation rules:**
- `stock <= 0` → `out_of_stock`
- `stock > 0 && stock <= reorder` → `low_stock`
- `stock > reorder` → `in_stock`

### 3.3 Batch (Lot)

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | Auto-generated: `BT-NNN` |
| `batchNumber` | `string` | Auto | Lot number: `LOT-YYYY-NNNN` |
| `productId` | `string` | Yes | FK to Product.id |
| `quantity` | `number` | Yes | Current remaining quantity |
| `initialQuantity` | `number` | Yes | Quantity when first received |
| `expiryDate` | `string` | No | ISO date. Optional for non-perishables. |
| `receivedDate` | `string` | Yes | ISO date when batch was received |
| `sourcePoId` | `string` | No | FK to PurchaseOrder.id |
| `location` | `string` | Yes | Warehouse/location name |
| `status` | `BatchStatus` | Computed | `active`, `expired`, or `depleted` |
| `notes` | `string` | No | Free-text notes |

**Batch status computation:**
- `quantity <= 0` → `depleted`
- `expiryDate` exists and is in the past → `expired`
- Otherwise → `active`

### 3.4 Category

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | `cat-NNN` |
| `name` | `string` | Yes | Unique category name |
| `icon` | `string` | Yes | Emoji |
| `color` | `string` | Yes | Hex color code |
| `description` | `string` | Yes | Category description |
| `status` | `string` | Yes | `active` or `inactive` |
| `productCount` | `number` | Computed | Number of products in this category |

### 3.5 Unit of Measure

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | `uom-NNN` |
| `name` | `string` | Yes | Full name (e.g. `Kilograms`) |
| `abbreviation` | `string` | Yes | Short form (e.g. `kg`). Must be unique. |
| `type` | `string` | Yes | `Weight`, `Volume`, `Length`, or `Count` |
| `description` | `string` | Yes | Description |
| `status` | `string` | Yes | `active` or `inactive` |

### 3.6 Supplier

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `number` | Auto | Sequential integer |
| `name` | `string` | Yes | Company name |
| `contact` | `string` | Yes | Contact person name |
| `phone` | `string` | Yes | Phone number |
| `email` | `string` | Yes | Email address |
| `location` | `string` | Yes | City/region |
| `products` | `number` | Yes | Number of products from this supplier. Currently a static value set in seed data — not computed at runtime from the product list. Should be derived dynamically when a backend is implemented. |
| `rating` | `number` | Yes | 1.0 to 5.0 |
| `status` | `string` | Yes | `active` or `inactive` |

### 3.7 Customer

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | `CUS-NNN` |
| `name` | `string` | Yes | Customer name |
| `phone` | `string` | Yes | Phone number |
| `email` | `string` | Yes | Email address. Required in the type definition (`email: string`, not optional). Use empty string `''` when not provided. |
| `type` | `'regular' \| 'wholesale' \| 'walk-in'` | Yes | Customer type |
| `totalSpent` | `number` | Computed | Cumulative spend in GH₵ |
| `visits` | `number` | Computed | Number of transactions |
| `lastVisit` | `string \| null` | Computed | ISO date of last purchase, or `null` if no purchases yet |
| `notes` | `string` | No | Free-text notes |
| `createdAt` | `string` | Auto | ISO date |
| `loyaltyPts` | `number` | Computed | 1 point per GH₵ 10 spent (`floor(totalSpent / 10)`) |

**Loyalty points rule:** `loyaltyPts = floor(totalSpent / 10)`. Points are incremented on sale completion and decremented on sale reversal.

### 3.8 Purchase Order

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | `PO-NNNN` |
| `supplierId` | `number` | Yes | FK to Supplier.id |
| `supplierName` | `string` | Denormalized | Supplier display name |
| `status` | `POStatus` | Yes | See workflow in Section 10 |
| `createdDate` | `string` | Auto | ISO date |
| `expectedDate` | `string \| null` | Yes | Expected delivery date. Required field that accepts `null` (not optional — the key always exists on the object). |
| `receivedDate` | `string \| null` | Yes | Actual receipt date. Required field that accepts `null`. Set when goods are received. |
| `location` | `string` | Yes | Destination warehouse name |
| `paymentTerms` | `PaymentTerms` | Yes | `cod`, `net15`, `net30`, or `net60` (4 values — see §10.4) |
| `notes` | `string` | Yes | Free-text. Required field (`notes: string`, not optional). Use empty string `''` when no notes. |
| `createdBy` | `string` | Auto | Staff name |
| `items` | `PurchaseOrderItem[]` | Yes | At least 1 line item required |

**PurchaseOrderItem:**

| Field | Type | Description |
|---|---|---|
| `productId` | `string` | FK to Product.id |
| `name` | `string` | Product name (denormalized) |
| `qty` | `number` | Ordered quantity |
| `unitCost` | `number` | Cost per unit |
| `receivedQty` | `number` | Quantity actually received |
| `image` | `string` | Product emoji |
| `unit` | `string` | Unit abbreviation |
| `expiryDate` | `string` | Optional batch expiry |

**PO total calculation:** `sum(item.qty * item.unitCost)` for all line items.

### 3.9 Sale Record

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | `TXN-YYYYMMDD-NNNN` |
| `date` | `string` | Auto | ISO timestamp |
| `items` | `SaleItem[]` | Yes | Line items |
| `itemCount` | `number` | Computed | `sum(item.qty)` |
| `subtotal` | `number` | Computed | `sum(item.price * item.qty)` |
| `tax` | `number` | Computed | `subtotal * taxRate`. See Section 1.2 for the known tax rate inconsistency (POS uses 12.5%, shop settings default to 15%). |
| `discount` | `number` | Computed | Amount discounted (clamped by role limit) |
| `discountType` | `string` | No | `percent` or `fixed` |
| `discountInput` | `number` | No | Raw discount value entered |
| `total` | `number` | Computed | `subtotal + tax - discount` |
| `paymentMethod` | `string` | Yes | `cash`, `card`, `momo`, or `split` |
| `payLabel` | `string` | Yes | Human-readable payment label |
| `cashier` | `string` | Yes | Staff name |
| `customerId` | `string \| null` | Yes | FK to Customer.id. Required field that accepts `null` for walk-in customers. |
| `customerName` | `string` | Yes | Customer name or `Walk-in` |
| `customerPhone` | `string \| null` | Yes | Customer phone. Required field that accepts `null` for walk-in customers. |
| `amountTendered` | `number` | Cash only | Amount given by customer |
| `change` | `number` | Cash only | `amountTendered - total` |
| `cardType` | `string` | Card only | `Visa`, `Mastercard`, etc. |
| `cardTransNo` | `string` | Card only | Transaction reference |
| `momoProvider` | `string` | MoMo only | `mtn`, `tcash`, `atcash`, `gmoney` |
| `momoPhone` | `string` | MoMo only | Payer phone number |
| `momoRef` | `string` | MoMo only | Transaction reference |
| `splits` | `SaleSplit[]` | Split only | Payment method breakdown |
| `verifyToken` | `string` | No | 12-char cryptographic token for receipt verification. Optional in the type (`verifyToken?: string`), but generated for every sale in practice. |
| `source` | `'pos' \| 'bar'` | No | Distinguishes retail POS sales (`'pos'`) from bar/restaurant till-close sales (`'bar'`). Bar sales are created by `closeTill()` in the kitchen Pinia store. |
| `status` | `SaleStatus` | No | `completed`, `reversed`, or `pending_reversal`. Optional in the type (`status?: SaleStatus`), but set for every sale in practice. |
| `reversedAt` | `string` | Reversal only | ISO timestamp |
| `reversedBy` | `string` | Reversal only | Role that approved reversal |
| `reversalReason` | `string` | Reversal only | Required free-text reason |
| `reversalRequestedBy` | `string` | Pending only | Role that requested reversal |
| `reversalRequestedAt` | `string` | Pending only | ISO timestamp |

### 3.10 Warehouse

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | `WH-NNN` |
| `name` | `string` | Yes | Warehouse name |
| `type` | `string` | Yes | `Main Storage`, `Secondary`, or `Retail` |
| `address` | `string` | Yes | Physical address |
| `manager` | `string` | Yes | Manager name |
| `phone` | `string` | Yes | Contact phone |
| `email` | `string` | Yes | Contact email |
| `capacity` | `number` | Yes | Total capacity in units |
| `zones` | `string[]` | Yes | Named zones within the warehouse |

### 3.11 Stock Adjustment

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | `ADJ-NNN` |
| `product` | `string` | Yes | Product name |
| `type` | `string` | Yes | `Damage`, `Recount`, `Expired`, `Theft`, or `Return` |
| `qty` | `number` | Yes | Positive = addition, negative = reduction |
| `date` | `string` | Auto | ISO date |
| `by` | `string` | Auto | Staff name |
| `reason` | `string` | Yes | Free-text reason |
| `status` | `string` | Yes | `approved`, `pending`, or `rejected` |

### 3.12 Stock Transfer

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | `TRF-NNN` |
| `product` | `string` | Yes | Product name |
| `qty` | `number` | Yes | Quantity transferred |
| `from` | `string` | Yes | Source location name |
| `to` | `string` | Yes | Destination location name |
| `date` | `string` | Auto | ISO date |
| `status` | `string` | Yes | `in_transit`, `completed`, or `cancelled` |
| `by` | `string` | Auto | Staff name |

### 3.13 Shop

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | Unique shop ID |
| `name` | `string` | Yes | Business name |
| `logo` | `string` | No | Emoji or image URL |
| `address` | `string` | Yes | Business address |
| `phone` | `string` | Yes | Business phone |
| `email` | `string` | Yes | Business email |
| `status` | `ShopStatus` | Yes | `active`, `suspended`, or `pending` |
| `plan` | `PlanId` | Yes | `free`, `basic`, or `max` |
| `ownerId` | `string` | Yes | FK to User.id |
| `createdAt` | `string` | Auto | ISO date |
| `settings` | `ShopSettings` | No | Shop configuration object |

### 3.14 Notification

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | Unique ID |
| `title` | `string` | Yes | Notification title |
| `message` | `string` | Yes | Notification body |
| `category` | `NotificationCategory` | Yes | See Section 11 |
| `priority` | `NotificationPriority` | Yes | `low`, `medium`, `high`, `critical` |
| `channels` | `NotificationChannel[]` | Yes | `in_app`, `push`, `email`, `sms` |
| `target` | `NotificationTarget` | Yes | `{ type: NotificationTargetType, roles?: string[], userId?: string }` |
| `read` | `boolean` | Yes | Read state |
| `createdAt` | `string` | Auto | ISO timestamp |
| `actionUrl` | `string` | No | Route path for deep-link navigation (e.g., `/products/SKU-001`) |
| `actionData` | `Record<string, string>` | No | Arbitrary key-value data passed to the action target |
| `actor` | `string` | No | Name of the user/system that triggered the notification |
| `actorRole` | `string` | No | Role of the triggering user |
| `requiresAction` | `boolean` | No | Whether user must act |
| `actionTaken` | `string` | No | `approved`, `rejected`, or `acknowledged` |

### 3.15 Branch

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Auto | Unique branch ID |
| `shopId` | `string` | Yes | FK to Shop.id |
| `name` | `string` | Yes | Branch display name |
| `type` | `'retail' \| 'warehouse' \| 'distribution'` | Yes | Branch type |
| `address` | `string` | Yes | Physical address |
| `phone` | `string` | No | Contact phone (`phone?: string`) |
| `managerId` | `string` | No | FK to User.id (`managerId?: string`) |
| `isDefault` | `boolean` | Yes | Whether this is the shop's default branch |

### 3.16 ShopSettings

| Field | Type | Required | Description |
|---|---|---|---|
| `currency` | `string` | Yes | Currency code (e.g. `GHS`) |
| `timezone` | `string` | Yes | Timezone identifier |
| `taxRate` | `number` | Yes | Tax rate as a percentage (e.g. `15` for 15%). See Section 1.2 for known inconsistency with POS hardcoded rate. |
| `receiptFooter` | `string` | No | Custom text printed at the bottom of receipts (`receiptFooter?: string`) |
| `lowStockThreshold` | `number` | Yes | Global default reorder level |

### 3.17 User

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique user ID |
| `name` | `string` | Yes | Full name |
| `email` | `string` | Yes | Email address |
| `phone` | `string` | No | Phone number (`phone?: string`) |
| `role` | `UserRole` | Yes | See note below on type mismatch |
| `status` | `UserStatus` | Yes | `active`, `inactive`, `suspended`, `pending`, or `deactivated` |
| `avatar` | `string` | No | Avatar URL or initials (`avatar?: string`) |
| `joinedAt` | `string` | Yes | ISO date of registration |
| `lastActive` | `string` | No | ISO timestamp of last activity (`lastActive?: string`) |

**TeamMember** extends `User` with:

| Field | Type | Required | Description |
|---|---|---|---|
| `shopId` | `string` | Yes | FK to Shop.id |
| `branchIds` | `string[]` | Yes | Array of Branch IDs this member is assigned to |
| `permissions` | `string[]` | Yes | Array of granted permission keys |

> **Codebase bug — `UserRole` type is partially out of sync:** The `UserRole` type in `user.types.ts` defines 9 values: `'owner' | 'general_manager' | 'manager' | 'bar_manager' | 'waiter' | 'kitchen_staff' | 'cashier' | 'inventory_clerk' | 'viewer'`. However, `demoData.ts` uses 12 role strings throughout `ROLES`, `DEFAULT_PERMISSIONS`, and `DISCOUNT_ROLE_LIMITS`: `owner`, `general_manager`, `manager`, `bar_manager`, `waiter`, `kitchen_staff`, `inventory_manager`, `inventory_officer`, `salesperson`, `cashier`, `accountant`, `viewer`. The type is still missing `inventory_manager`, `inventory_officer`, `salesperson`, and `accountant`, and includes `inventory_clerk` which no other file in the codebase uses. The `demoData.ts` roles remain the source of truth for runtime behavior.

### 3.18 Session

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Session ID |
| `device` | `string` | Yes | Device/browser description (e.g. `Chrome on Windows`) |
| `location` | `string` | Yes | Geographic location (e.g. `Accra, Ghana`) |
| `lastActive` | `string` | Yes | Human-readable last active time (e.g. `Now`, `2 hours ago`) |
| `current` | `boolean` | Yes | Whether this is the current active session |

### 3.19 PaymentMethod

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique payment method ID |
| `type` | `string` | Yes | `momo` or `card` |
| `provider` | `string` | Yes | Provider name (e.g. `MTN MoMo`, `Visa`) |
| `last4` | `string` | Yes | Last 4 digits of account/card number |
| `name` | `string` | Yes | Account holder name |
| `isDefault` | `boolean` | Yes | Whether this is the default payment method |
| `added` | `string` | Yes | ISO date when added |
| `status` | `string` | Yes | `active` or `expired` |
| `expiry` | `string` | No | Card expiry date (e.g. `09/27`). Only for `type: 'card'`. (`expiry?: string`) |

### 3.20 PaymentRecord

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Transaction ID |
| `date` | `string` | Yes | ISO date |
| `amount` | `number` | Yes | Payment amount in GH₵ |
| `plan` | `string` | Yes | Plan name at time of payment (e.g. `Max`, `Basic`, `Basic → Max`) |
| `method` | `string` | Yes | Human-readable payment method (e.g. `MTN MoMo •2222`) |
| `status` | `string` | Yes | `paid`, `failed`, or `refunded` |
| `txRef` | `string` | Yes | Transaction reference code |
| `note` | `string` | No | Optional note (e.g. `Billing error — refunded`) (`note?: string`) |

### 3.21 SaleItem

Embedded within `SaleRecord.items[]`:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Product SKU (references Product.id) |
| `name` | `string` | Yes | Product name at time of sale |
| `qty` | `number` | Yes | Quantity sold |
| `price` | `number` | Yes | Selling price per unit at time of sale |

### 3.22 SaleSplit

Embedded within `SaleRecord.splits[]` (only when `paymentMethod === 'split'`):

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | `string` | Yes | Payment method for this split: `cash`, `card`, or `momo` |
| `label` | `string` | Yes | Human-readable label (e.g. `Cash`, `MTN MoMo`) |
| `amount` | `number` | Yes | Amount for this split in GH₵ |
| `detail` | `string` | No | Human-readable detail (e.g. `Tendered: GH₵ 300.00`) (`detail?: string`) |

### 3.23 KitchenOrder

Defined in `types/kitchen.types.ts`. Represents an order sent from the Bar POS to the kitchen.

**KitchenOrderStatus:** `'pending' | 'accepted' | 'rejected' | 'completed' | 'served' | 'returned' | 'cancelled'`

**OrderType:** `'dine_in' | 'takeaway'`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique order ID |
| `tillName` | `string` | Yes | Name of the till that placed the order |
| `tillId` | `string` | Yes | FK to Till.id |
| `table` | `string` | No | Table assignment (e.g. `"Table 5"`) |
| `orderType` | `OrderType` | Yes | `'dine_in'` or `'takeaway'` |
| `items` | `KitchenOrderItem[]` | Yes | Line items |
| `status` | `KitchenOrderStatus` | Yes | Current order status |
| `createdAt` | `string` | Yes | ISO timestamp |
| `acceptedAt` | `string` | No | When kitchen accepted |
| `completedAt` | `string` | No | When kitchen marked ready |
| `rejectedAt` | `string` | No | When kitchen rejected |
| `rejectionReason` | `string` | No | Reason for rejection |
| `serverName` | `string` | No | Name of the waiter/server |
| `total` | `number` | No | Order total amount |
| `barFulfilled` | `boolean` | No | If `true`, order was auto-fulfilled at bar (items with `skipKitchen: true`); excluded from Kitchen Display |
| `servedAt` | `string` | No | When order was served to customer |
| `returnedAt` | `string` | No | When order was returned |
| `returnReason` | `string` | No | Reason for return |
| `cancelledAt` | `string` | No | When order was cancelled |
| `cancelledBy` | `string` | No | Who cancelled the order |

### 3.24 KitchenOrderItem

| Field | Type | Required | Description |
|---|---|---|---|
| `productId` | `string` | Yes | FK to Product.id |
| `name` | `string` | Yes | Product name |
| `qty` | `number` | Yes | Quantity ordered |
| `notes` | `string` | No | Special preparation notes |
| `itemStatus` | `'pending' \| 'served'` | No | Per-item serving status |
| `servedAt` | `string` | No | When this specific item was served |

### 3.25 HeldOrder (Bar)

Represents a bar order put on hold (distinct from the POS held orders in §8.6).

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique held order ID |
| `tillId` | `string` | Yes | FK to Till.id |
| `items` | `HeldOrderItem[]` | Yes | Cart items at time of hold |
| `table` | `string` | Yes | Table assignment |
| `orderType` | `OrderType` | Yes | `'dine_in'` or `'takeaway'` |
| `heldAt` | `string` | Yes | ISO timestamp when held |
| `label` | `string` | No | Optional label for the held order |

**HeldOrderItem** extends the `Product` interface with:

| Field | Type | Required | Description |
|---|---|---|---|
| `qty` | `number` | Yes | Quantity in cart |
| `notes` | `string` | No | Item-specific notes |

### 3.26 Till

Represents a bar/restaurant till session (open/close lifecycle).

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique till ID |
| `name` | `string` | Yes | Till display name |
| `openedAt` | `string` | Yes | ISO timestamp when till was opened |
| `openedBy` | `string` | Yes | Staff name who opened the till |
| `isActive` | `boolean` | Yes | Whether the till is currently open |
| `orderCount` | `number` | Yes | Number of orders placed on this till |
| `totalPayments` | `number` | Yes | Total number of payments processed |
| `totalPaymentAmount` | `number` | Yes | Running sum of all payment amounts |
| `payments` | `TillPayment[]` | Yes | Individual payment records |
| `closedAt` | `string` | No | ISO timestamp when till was closed |
| `discount` | `number` | No | Discount amount applied at till level |
| `discountType` | `'percent' \| 'fixed'` | No | Discount type |
| `discountInput` | `number` | No | Raw discount value entered |

### 3.27 TillPayment

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique payment ID |
| `orderId` | `string` | Yes | FK to KitchenOrder.id |
| `amount` | `number` | Yes | Payment amount |
| `method` | `TillPaymentMethod` | Yes | `'cash'`, `'card'`, or `'momo'` |
| `paidAt` | `string` | Yes | ISO timestamp |
| `amountTendered` | `number` | Cash only | Amount given by customer |
| `change` | `number` | Cash only | Change returned |
| `cardType` | `string` | Card only | Card type (Visa, Mastercard, etc.) |
| `cardTransNo` | `string` | Card only | Transaction reference |
| `momoProvider` | `string` | MoMo only | Mobile money provider |
| `momoPhone` | `string` | MoMo only | Payer phone number |
| `momoTransId` | `string` | MoMo only | Transaction reference |

**TillPaymentMethod:** `'cash' | 'card' | 'momo'`

### 3.28 Kitchen Order Store

The kitchen order Pinia store (`stores/kitchen.ts`) manages the entire bar/restaurant POS subsystem. It handles tills, kitchen orders, held orders, and till payments. It integrates till-close sales into the main sales history via the shop store.

**Key operations exposed via `useKitchenStore()`:**

| Category | Functions |
|---|---|
| **Tills** | `openTill(name, openedBy)`, `closeTill(id)`, `recordPayment()`, `recordBulkPayment()`, `recordTillPayment()` |
| **Orders** | `placeOrder()`, `acceptOrder(id)`, `rejectOrder(id, reason)`, `completeOrder(id)`, `serveOrder(id)`, `returnOrder(id, reason)`, `cancelOrder(id, cancelledBy)`, `serveOrderItem(orderId, productId)` |
| **Held orders** | `holdOrder()`, `resumeOrder(id)`, `discardHeldOrder(id)` |
| **Queries** | `getOrdersForTill(tillId)`, `getPendingOrders()`, `getActiveOrders()`, `getHeldOrdersForTill(tillId)`, `getKitchenNotificationsForTill(tillId)` |
| **Notifications** | `unseenUpdates` (per-till counts), `markOrdersSeen(tillId)` |

**`closeTill` behavior:** Aggregates all non-rejected/non-cancelled orders from the till into a single `SaleRecord` with `source: 'bar'`, infers payment method from till payments, then calls `onTillClose(saleRecord)` and marks the till inactive.

**`placeOrder` with `skipKitchen` split:** When placing an order, items with `skipKitchen: true` are split into a separate bar-fulfilled auto-completed order (not shown in Kitchen Display); remaining items go as a `pending` kitchen order.

---

## 4. User Roles & RBAC

### 4.1 Shop-Level Roles (12 roles)

| Role | Label | Max Discount | Description |
|---|---|---|---|
| `owner` | Owner | 100% | Full access including billing, shop deletion, and team management |
| `general_manager` | General Manager | 100% | Full operational access across all branches (Max plan only) |
| `manager` | Manager | 25% | All operations except billing and shop deletion |
| `bar_manager` | Bar Manager | 25% | Full bar/kitchen operations, discounts, and analysis |
| `waiter` | Waiter | 5% | Bar POS, till management, serve/cancel orders |
| `kitchen_staff` | Kitchen Staff | 0% | Kitchen Display only — accept, reject, complete orders |
| `inventory_manager` | Inventory Manager | 0% | Full inventory control |
| `inventory_officer` | Inventory Officer | 0% | Day-to-day stock operations |
| `salesperson` | Salesperson | 10% | POS access and customer-facing operations |
| `cashier` | Cashier | 0% | POS register only, no discounts |
| `accountant` | Accountant | 0% | Financial oversight, read-only |
| `viewer` | Viewer | 0% | Read-only access across all modules |

### 4.2 Permission Matrix (36 permissions across 13 modules)

Permissions use a 4-level system: `full`, `partial`, `view`, `none`.

| Permission Key | Label | owner | gen_mgr | manager | bar_mgr | waiter | kitchen | inv_mgr | inv_off | sales | cashier | acct | viewer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Dashboard** |
| `dash_view` | View analytics | full | full | full | partial | none | none | partial | partial | none | none | full | view |
| `dash_export` | Export reports | full | full | full | none | none | none | partial | none | none | none | full | none |
| **Products** |
| `prod_view` | View products | full | full | full | view | view | none | full | partial | view | view | view | view |
| `prod_edit` | Add / edit | full | full | full | none | none | none | full | partial | none | none | none | none |
| `prod_delete` | Delete | full | full | full | none | none | none | full | none | none | none | none | none |
| `prod_price` | Manage pricing | full | full | full | none | none | none | full | none | none | none | none | none |
| **Categories** |
| `cat_view` | View | full | full | full | none | none | none | full | view | none | none | view | view |
| `cat_edit` | Add / edit / delete | full | full | full | none | none | none | full | none | none | none | none | none |
| **Units of Measure** |
| `uom_view` | View | full | full | full | none | none | none | full | view | none | none | view | view |
| `uom_edit` | Add / edit / delete | full | full | full | none | none | none | full | none | none | none | none | none |
| **Point of Sale** |
| `pos_sales` | Process sales | full | full | full | none | none | none | none | none | full | partial | none | view |
| `pos_discount` | Apply discounts | full | full | full | none | none | none | none | none | full | none | none | none |
| `pos_void` | Void transactions | full | full | full | none | none | none | none | none | partial | none | none | none |
| `pos_receipts` | View all receipts | full | full | full | none | none | none | none | none | partial | none | full | view |
| **Bar & Kitchen** |
| `bar_access` | Bar POS access | full | full | full | full | full | none | none | none | full | none | none | none |
| `bar_discount` | Bar discounts | full | full | full | full | partial | none | none | none | partial | none | none | none |
| `kitchen_access` | Kitchen Display | full | full | full | full | view | full | none | none | full | none | none | none |
| `bar_analysis` | Bar/Kitchen analytics | full | full | full | full | none | none | none | none | none | none | full | none |
| **Purchase Orders** |
| `po_view` | View POs | full | full | full | none | none | none | full | view | none | none | view | view |
| `po_create` | Create / edit | full | full | full | none | none | none | full | none | none | none | none | none |
| `po_approve` | Approve / receive | full | full | full | none | none | none | full | none | none | none | none | none |
| **Suppliers** |
| `sup_view` | View suppliers | full | full | full | none | none | none | full | view | none | none | view | view |
| `sup_edit` | Add / edit / delete | full | full | full | none | none | none | full | none | none | none | none | none |
| **Warehouses** |
| `wh_view` | View warehouses | full | full | full | none | none | none | full | view | none | none | view | view |
| `wh_manage` | Manage locations | full | full | full | none | none | none | full | none | none | none | none | none |
| **Adjustments** |
| `adj_view` | View | full | full | full | none | none | none | full | full | none | none | view | view |
| `adj_create` | Create | full | full | full | none | none | none | full | full | none | none | none | none |
| `adj_approve` | Approve | full | full | full | none | none | none | full | none | none | none | none | none |
| **Transfers** |
| `xfer_view` | View | full | full | full | none | none | none | full | full | none | none | view | view |
| `xfer_create` | Create | full | full | full | none | none | none | full | full | none | none | none | none |
| **Team** |
| `team_view` | View members | full | full | full | none | none | none | none | none | none | none | none | view |
| `team_invite` | Invite / remove | full | full | partial | none | none | none | none | none | none | none | none | none |
| `team_roles` | Change roles | full | full | none | none | none | none | none | none | none | none | none | none |
| **Settings** |
| `set_shop` | Shop settings | full | full | partial | none | none | none | none | none | none | none | none | view |
| `set_billing` | Billing | full | none | none | none | none | none | none | none | none | none | none | none |
| `set_delete` | Delete shop | full | none | none | none | none | none | none | none | none | none | none | none |

### 4.3 Permission Level Semantics

- **`full`**: Unrestricted access to the action.
- **`partial`**: Limited access. The exact meaning is context-specific per permission key:

  | Permission | Role(s) | `partial` means |
  |---|---|---|
  | `dash_view` | inventory_manager, inventory_officer | Can view dashboard but only inventory-related KPIs and stock alerts — not financial metrics (revenue, sales totals). Exact filtering is not yet enforced in the current UI; both `partial` and `full` render the same dashboard. This is a **planned distinction** for when the backend is implemented. |
  | `dash_export` | inventory_manager | Can export inventory-related reports only, not financial reports. Same caveat as above — not yet enforced. |
  | `prod_view` | inventory_officer | Can view product list and basic details but not pricing information (cost, margin). Not yet enforced in UI — currently renders identically to `full`. |
  | `prod_edit` | inventory_officer | Can edit stock-related fields (quantity, reorder level, location) but not pricing or supplier fields. Not yet enforced in UI. |
  | `pos_sales` | cashier | Can process sales but cannot apply discounts (`pos_discount: none`) and cannot void transactions (`pos_void: none`). |
  | `pos_void` | salesperson | Can *request* a reversal but not execute it directly. Creates a `pending_reversal` status. A user with `pos_void: full` (owner/manager/general_manager) must approve or reject. |
  | `pos_receipts` | salesperson | Can view only their own transaction receipts, not all receipts. Not yet enforced in UI — currently shows all receipts regardless. |
  | `team_invite` | manager | Can invite new team members but cannot invite roles at or above their own level. The implicit hierarchy (highest to lowest): `owner` > `general_manager` > `manager` > all others. A manager cannot invite owners or general managers. No explicit hierarchy definition exists in the codebase — this is enforced by convention. |
  | `set_shop` | manager | Can edit general shop settings (name, address, phone, receipt footer, low stock threshold) but cannot access Billing tab (`set_billing: none`) or Danger Zone (`set_delete: none`). |

- **`view`**: Read-only access. Can see data but cannot create, edit, or delete.
- **`none`**: No access. Navigation item is hidden; direct access is blocked.

### 4.4 Navigation Gating

Each sidebar navigation item maps to a permission key via `NAV_PERM_MAP`:

```
dashboard → dash_view      purchaseOrders → po_view
products → prod_view       receiveOrders → po_view
categories → cat_view      warehouses → wh_view
units → uom_view           adjustments → adj_view
pos → pos_sales            transfers → xfer_view
barPos → bar_access        suppliers → sup_view
kitchen → kitchen_access   team → team_view
tillManagement → bar_access  settings → set_shop
sales → pos_receipts       salesAnalysis → bar_analysis
```

If a user's role has `none` for the mapped permission, the nav item is hidden and the page is inaccessible.

**Ungated pages:** The following pages are **not** in `NAV_PERM_MAP` and are therefore accessible to all authenticated roles regardless of permissions:
- `customers` — visible to all roles including cashier and viewer.
- `account` — personal user account settings, always accessible.

### 4.5 Decision Maker Concept

`isDecisionMaker` is `true` for: `owner`, `manager`, `general_manager`. Used to determine:
- Who sees the "Upgrade Plan" button vs. "Contact your shop owner" message when limits are reached.
- Who can directly reverse sales vs. request reversal.

**Critical behavioral detail — `canAdd()` bypass:** The `canAdd(key)` function in the shop Pinia store has this logic:

```
if (!isDecisionMaker) return true;   // <-- non-decision-makers are NEVER blocked
const item = planUsage.items.find(i => i.key === key);
if (!item || item.unlimited) return true;
return item.used < item.max;
```

Non-decision-maker roles (bar_manager, waiter, kitchen_staff, inventory_manager, inventory_officer, salesperson, cashier, accountant, viewer) are **never blocked** by plan limits — `canAdd()` always returns `true` for them. Only decision makers (owner, manager, general_manager) see the limit enforcement. The rationale is that lower roles should not be responsible for plan upgrades, but the consequence is that a cashier can continue processing sales past the monthly transaction limit while the owner cannot. The `showLimitBlock()` modal still shows the appropriate message per role type, but the actual blocking only applies to decision makers.

### 4.6 Admin-Level Roles (5 roles)

For the ShopChain platform admin portal only. Defined in `adminData.ts` as `ADMIN_ROLES`.

| Role | Label | Description |
|---|---|---|
| `super_admin` | Super Admin | Full unrestricted access to all systems |
| `admin` | Admin | Full access except Super Admin management and system config |
| `billing_manager` | Billing Manager | Financial operations, subscriptions, and plan management |
| `support_agent` | Support Agent | User support, account management, and announcements |
| `auditor` | Auditor | Read-only access across all sections for compliance and oversight |

### 4.7 Admin Permission Matrix (12 permissions)

Admin permissions are boolean (`true`/`false`), not the 4-level system used for shop roles.

| Permission | Label | super_admin | admin | billing_mgr | support | auditor |
|---|---|---|---|---|---|---|
| `manageAdmins` | Manage Admins | Yes | Yes | No | No | No |
| `createSuperAdmin` | Create Super Admins | Yes | No | No | No | No |
| `manageUsers` | Manage Users | Yes | Yes | No | Yes | No |
| `manageShops` | Manage Shops | Yes | Yes | No | Yes | No |
| `managePlans` | Manage Plans | Yes | Yes | Yes | No | No |
| `deletePlans` | Delete Plans | Yes | No | No | No | No |
| `manageBilling` | Manage Billing | Yes | Yes | Yes | No | No |
| `viewPayments` | View Payments | Yes | Yes | Yes | No | Yes |
| `grantExemptions` | Grant Exemptions | Yes | Yes | Yes | Yes | No |
| `manageAnnouncements` | Manage Announcements | Yes | Yes | No | Yes | No |
| `viewAuditLog` | View Audit Log | Yes | Yes | No | No | Yes |
| `systemSettings` | System Settings | Yes | No | No | No | No |

---

## 5. Subscription Plans & Enforcement

### 5.1 Plan Tiers

| | Free | Basic | Max |
|---|---|---|---|
| **Price** | GH₵ 0/mo | GH₵ 49/mo | GH₵ 149/mo |
| **Shops** | 1 | 3 | Unlimited |
| **Branches / Shop** | 0 | 3 | Unlimited |
| **Team / Shop** | 3 | 15 | Unlimited |
| **Products / Shop** | 50 | 500 | Unlimited |
| **Monthly Transactions** | 200 | 5,000 | Unlimited |
| **Storage** | 100 MB | 2 GB | 20 GB |
| **Suppliers** | 5 | 50 | Unlimited |
| **Warehouses** | 0 | 1 | Unlimited |

(`-1` in the system represents "Unlimited")

### 5.2 Feature Gating by Plan

| Feature | Free | Basic | Max |
|---|---|---|---|
| POS | Basic | Full | Full + Split payments |
| Receipts | Name only | Logo + footer | Full thermal |
| Reports | Basic | Advanced CSV | All formats |
| Barcodes | No | Yes | Yes |
| Purchase Orders | View only | Full | Full + Auto-reorder |
| Stock Transfers | No | Between branches | Full |
| Low Stock Alerts | No | Email | All channels |
| 2FA | No | Yes | Yes |
| API Access | No | No | Yes |
| Data Export | No | CSV | All formats |
| Custom Branding | No | No | Yes |
| Audit Trail | None | 30 days | 365 days |
| General Manager Role | No | No | Yes |
| Support | Community | Email (48h SLA) | WhatsApp (4h SLA) |

### 5.3 Limit Enforcement Logic

The `computePlanUsage()` function (`utils/planUsage.ts`) compares current usage against plan limits:

```
for each limit key:
  unlimited = (max === -1)
  pct = unlimited ? 0
      : max > 0   ? Math.round((used / max) * 100)
      :              0                              // max === 0 edge case
  warning = !unlimited AND pct >= 80 AND pct < 100
  blocked  = !unlimited AND pct >= 100
```

> **Rounding note:** `Math.round()` means 79.5% usage rounds to 80% and triggers a warning.

> **Zero-cap edge case:** Free plan has `warehouses: 0` and `branchesPerShop: 0`. When `max === 0`, `pct` evaluates to `0` (avoiding division by zero), so `blocked` is `false`. However, `canAdd()` still correctly blocks via its own `used < max` check (see below).

**Computed limits — branches:**
The branches max is **not** the flat `branchesPerShop` value from the plan. It is computed as:
```
branches.max = branchesPerShop === -1
  ? -1
  : branchesPerShop × max(shops, 1)
```
For example, a Basic plan user with 2 shops gets a branches cap of `3 × 2 = 6`, not just `3`.

**Return value — `worstPct`:**
`computePlanUsage()` also returns `worstPct = Math.max(...items.filter(i => !i.unlimited).map(i => i.pct), 0)` — the highest usage percentage across all non-unlimited resources. This drives `PlanUsageBanner` severity.

**`canAdd(key)` — direct value check (not the `blocked` boolean):**
```typescript
const canAdd = (key: string) => {
  if (!isDecisionMaker) return true;           // non-decision-makers never blocked
  const item = planUsage.items.find(i => i.key === key);
  if (!item || item.unlimited) return true;
  return item.used < item.max;                 // direct comparison, not item.blocked
};
```

**`showLimitBlock(resourceLabel)` — upgrade suggestion:**
When `canAdd()` returns `false`, `showLimitBlock()` is called. It uses `PLAN_ORDER = ['free', 'basic', 'max']` to find the next tier up:
```
nextPlan = PLAN_ORDER[currentIndex + 1]   // or null if already on Max
```
- **Decision makers** see: _"Your {plan} plan allows a maximum. Upgrade to {nextPlan} for higher limits."_ with an "Upgrade Plan" button.
- **Non-decision makers** see: _"The {plan} plan limit for {resource} has been reached. Please contact the shop owner."_

**`PlanUsageBanner`:**
Appears in the header when any resource is at `warning` or `blocked` level.

### 5.4 Trial Period

`TRIAL_DAYS = 14` is defined in `utils/constants/plans.ts`.

> **⚠ Placeholder only:** Trial days remaining must be computed server-side from the subscription's `trial_ends_at` timestamp and returned via the API. The shop Pinia store will expose this as a reactive computed property. A production implementation must add: trial start date tracking, countdown computation, expiry enforcement, and downgrade-to-Free on expiry.

### 5.5 Admin Plan Management

The admin portal provides full plan CRUD and lifecycle management via the Admin Subscriptions tab (`pages/admin/index.vue`, subscriptions tab). This screen is accessible to admin roles with the `managePlans` permission (Super Admin, Admin, Billing Manager).

#### 5.5.1 Subscriptions Sub-tabs

| Sub-tab | Purpose |
|---|---|
| **Overview** | KPI cards (MRR, ARPU, Active Subscribers), plan breakdown table (users/revenue/% per plan), payment exemptions list |
| **Plans** | Full plan CRUD: create, edit limits, manage lifecycle, retire/migrate |
| **User Subs** | Per-user subscription detail: current plan, payment methods, payment history, resource usage, plan change, billing exemption grants |
| **Usage** | Per-user resource usage dashboard with color-coded progress bars (6 tracked keys: shops, branches, team, products, transactions, storage) |

#### 5.5.2 Plan Lifecycle

Plans follow a five-stage lifecycle (`PlanLifecycle` type in `admin.types.ts`):

```
draft  →  scheduled  →  active  →  retiring  →  retired
                ↑                        │
                └────────────────────────┘  (reactivate as draft, if 0 subscribers)
```

| Stage | Visibility | New Signups | Description |
|---|---|---|---|
| `draft` | Hidden from users | No | Plan is being configured, not visible |
| `scheduled` | Hidden from users | No | Activation date set via `availableFrom`; "Activate Now" button available; days-until-live countdown shown |
| `active` | Visible | Yes | Available for new signups |
| `retiring` | Visible to existing | No after `retireAt` date | Retirement schedule active; existing subscribers handled via grandfather or migrate |
| `retired` | Hidden | No | Fully retired; reactivate as Draft possible if 0 subscribers remain |

#### 5.5.3 Create New Plan

**Modal fields:**
| Field | Type | Notes |
|---|---|---|
| Plan Name | Text input | Required; auto-generates `id` from lowercase + underscores |
| Monthly Price | Number (GH₵) | Min 0 |
| Brand Color | Color picker | 9 preset options |
| Plan Icon | Emoji picker | 4 groups (Plans & Tiers, Business, Tech & Tools, Nature & Objects), 40 total icons |
| Initial Status | Toggle | `draft` (default) or `active` |

**Defaults for new plans:**
```
limits:   { shops: 1, branchesPerShop: 1, teamPerShop: 5, productsPerShop: 100,
            monthlyTransactions: 500, storageMB: 512, suppliers: 10, warehouses: 1 }
features: { pos: 'basic', receipts: 'name_only', reports: 'basic', barcode: false,
            purchaseOrders: 'view', stockTransfers: false, lowStockAlerts: false,
            twoFA: false, apiAccess: false, dataExport: false, customBranding: false,
            auditTrail: 0, generalManager: false, support: 'email_48h' }
```

#### 5.5.4 Edit Plan

The inline plan editor allows:
- **View/edit plan limits**: Each limit has ±buttons and an "Unlimited" checkbox (sets value to `-1`).
- **Lifecycle state transitions**: Interactive lifecycle pills (draft/scheduled/active/retiring/retired). Switching to `active` clears scheduling/retirement fields. Switching to `draft` clears scheduling fields.
- **Name and price**: Displayed read-only in editor (set at creation time).

#### 5.5.5 Plan Retirement Flow

When lifecycle is set to `retiring`:

| Field | Description |
|---|---|
| `retireAt` | Date to stop new signups |
| `migrateAt` | Date to migrate existing subscribers (disabled if grandfathered) |
| Existing Subscribers | Two mutually exclusive options: **Grandfather** (keep on retiring plan indefinitely) or **Migrate** (move to fallback plan on migration date) |
| Fallback Plan | Selector showing only `active` or `retiring` plans (excluding the current plan); required if migrating |

**Retirement timeline visualization:** A visual timeline showing `Now → Retire Date → Migrate Date` (migrate dot hidden if grandfathered).

**Protections:**
- Cannot set lifecycle to `retired` if the plan has subscribers and neither grandfathering nor a fallback plan is configured.
- Cannot migrate subscribers to the same plan being retired.
- The Free plan is protected: lifecycle management UI is hidden (`isProtected = true`).
- Retired plans with 0 subscribers show a "Reactivate as Draft" button.
- "Cancel Retirement" button resets lifecycle to `active` and clears all retirement fields.

#### 5.5.6 User Subscription Management (User Subs tab)

**User list view:**
- Searchable by name or email.
- Each row shows avatar, name, email, plan badge, status badge.
- Click to open detail view.

**User detail view:**
- Current plan and price display.
- **Payment Methods**: List with provider, last 4 digits, default badge, status (active/expired).
- **Payment History**: Table with date, amount, method, status (paid/failed/refunded), transaction reference.
- **Resource Usage**: Per-resource progress bars with color-coded thresholds (green < 60%, yellow 60–84%, red ≥ 85%) and "at limit" / "near limit" badges.
- **Actions**: Plan change dropdown (all plans in `PLAN_ORDER`), "Grant Exemption" button.

**Billing Exemption modal:**
| Field | Type | Notes |
|---|---|---|
| Period | Number + unit (months/years) | Duration of exemption |
| Unlimited | Checkbox | No expiry |
| Reason | Textarea | Required justification |

#### 5.5.7 Overview Metrics

| Metric | Computation |
|---|---|
| **MRR** | `Σ (plan.price)` for all users |
| **ARPU** | `MRR / activeSubscribers` (subscribers on paid plans with active status) |
| **Active Subscribers** | Count of users where `plan ≠ 'free'` AND `status === 'active'` |
| **Plan Breakdown** | Per-plan: user count, revenue, % of total MRR |

#### 5.5.8 Admin Plan Permissions

| Permission | Super Admin | Admin | Billing Mgr | Support | Auditor |
|---|---|---|---|---|---|
| `managePlans` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `deletePlans` | ✅ | ❌ | ❌ | ❌ | ❌ |

> **Note:** `deletePlans` maps to the ability to permanently retire plans. Only Super Admin has this permission.

> **Implementation note:** All plan management is local Pinia state in the current demo. A production build requires backend APIs for plan CRUD, lifecycle transitions, subscriber migration jobs, and exemption tracking.

---

## 6. Authentication & Onboarding Flow

### 6.0 Shared Auth Layout

All pre-auth screens (Login, Register, Verify, Forgot, Reset) use the Nuxt `auth` layout (`layouts/auth.vue`). This provides:
- Centered card container with max width.
- Background styling with ambient colour blobs.
- Responsive sizing via breakpoint prop.

The `AuthBranding` helper renders the ShopChain logo (gradient `Store` icon) + tagline _"Inventory & POS for African Businesses"_ at the top of each auth card.

### 6.1 Auth State Machine

```
AuthScreen = 'login' | 'register' | 'verify' | 'forgot' | 'reset'
           | 'shopSelect' | 'createShop' | 'authenticated'
           | 'adminLogin' | 'adminDashboard'

                    ┌─────────┐
                    │  login   │ ◄──── default entry
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     ┌─────────┐  ┌──────────┐   ┌───────────┐
     │register │  │  forgot   │   │adminLogin │
     └────┬────┘  └────┬─────┘   └─────┬─────┘
          ▼            ▼               ▼
     ┌─────────┐  ┌──────────┐   ┌────────────────┐
     │ verify  │  │  reset   │   │adminDashboard  │
     └────┬────┘  └────┬─────┘   └────────────────┘
          ▼            │
     ┌──────────┐      │
     │shopSelect│      │
     └────┬─────┘      │
          │            │
    ┌─────┼──────┐     │
    ▼            ▼     │
┌──────────┐ ┌──────────────┐
│createShop│ │authenticated │
└────┬─────┘ └──────────────┘
     │              ▲
     ▼              │
┌──────────────┐    │
│authenticated │    │
└──────────────┘    │
                    │
     reset ─────────┘  (reset → login, NOT shopSelect)
```

> **Key transition correction:** `reset` navigates to `login` on success (not `shopSelect`). The `reset → login` transition uses a 3-second delay with a "Redirecting to sign in..." message.

### 6.2 Login Screen

**Purpose:** User authentication entry point.

**Fields:**
| Field | Validation | Notes |
|---|---|---|
| Email | Required (truthy check only) | `AuthInput` with `Mail` icon; no email format validation in demo |
| Password | Required (truthy check only) | `AuthInput` with `Lock` icon; eye toggle for show/hide; no min-length check in demo |
| Remember me | Checkbox, optional | Custom styled checkbox |

> **Note:** The spec validators (`isRequired`, `isEmail`, `minLength`) from `validators.ts` are **not used** on this screen. Validation is a simple `if (!email || !password)` truthy check.

**Button state:** Sign In button is `disabled` until both email and password are non-empty.

**Behavior:**
- Submit triggers 1.5s simulated loading delay (demo mode).
- Any non-empty credentials succeed (no real validation in demo).
- "Forgot password?" link → navigates to `forgot` screen.
- "Admin Portal" link (with `Shield` icon) → switches to `adminLogin` screen.
- "Create account" link → navigates to `register` screen.
- Social login buttons (Google, Apple) are visual placeholders only.
- After login → `onLogin()` → `setUser(userData)` → navigate to `shopSelect`.

**Error display:** Inline alert with `dangerBg` background and `AlertTriangle` icon. Message: "Please fill in all fields."

### 6.3 Register Screen

**Fields:**
| Field | Validation | Notes |
|---|---|---|
| First Name | Required (`!form.firstName.trim()`) | `AuthInput` with `User` icon |
| Last Name | Required (`!form.lastName.trim()`) | `AuthInput` (no icon) |
| Email | Required + inline regex `!/\S+@\S+\.\S+/` | `AuthInput` with `Mail` icon |
| Phone | Required (`!form.phone.trim()`) | `AuthInput` with `Phone` icon; no regex pattern validation in demo |
| Password | Required + `length < 8` check | `AuthInput` with `Lock` icon; eye toggle |
| Confirm Password | Required + must match password | `AuthInput` with `Lock` icon; eye toggle |
| Terms & Conditions | Required checkbox | "I agree to the Terms of Service and Privacy Policy"; validation: `if (!agreedTerms) e.terms = 'You must agree to the terms'` |

> **Note:** Phone validation is a simple truthy check, not the `isPhone` regex from `validators.ts`. Email validation uses an inline regex (`/\S+@\S+\.\S+/`) which is simpler than the `isEmail` validator.

**Password Strength indicator:**
The `PasswordStrength` component displays below the password field with:
- 5-segment colour bar (red → orange → yellow → green → emerald).
- Labels: Very Weak, Weak, Fair, Strong, Very Strong.
- 5 check pills: "8+ characters", "Uppercase letter", "Lowercase letter", "Number", "Special character".

**Behavior:** On success → 1.5s loading delay → navigate to `verify` screen.

**Error display:** Per-field inline errors with `AlertTriangle` icon.

### 6.4 Email Verification Screen

**Purpose:** OTP entry to verify email ownership.

**UI:** Displays an email icon, "Check your email" heading, masked email (e.g., `k•••@example.com`).

**OTP Input:** 6-digit `OtpInput` component — individual digit boxes, auto-advance on entry, backspace goes to previous, supports paste of full code.

**Behavior:**
- "Verify Email" button disabled until all 6 digits entered.
- On submit → 1.2s verification delay.
- Success state: "Email Verified!" animation with `CheckCircle` icon + spinner, then 2s redirect delay → `onVerified()` → `shopSelect`.
- **Resend cooldown:** 60-second countdown timer before "Resend code" link becomes active. On resend, timer resets to 60s and OTP is cleared.
- **Change email:** "Change email address" link → navigates back to `register`.

**Error display:** Centered inline error: "Please enter the full 6-digit code."

### 6.5 Forgot Password Screen

**Fields:** Email (required, truthy check; no format validation in demo).

**Behavior:**
1. On submit → 1.5s loading delay.
2. Shows **success view** (does NOT auto-navigate) with:
   - "Check your inbox" heading.
   - The submitted email address displayed.
   - Info note: _"If you don't see it, check your spam folder. The link expires in **15 minutes**."_
   - **"Open Reset Page"** button → navigates to `reset` (user must explicitly click).
   - **"Resend Email"** button → returns to the email input form.
3. "Back to sign in" link → navigates to `login`.

### 6.6 Reset Password Screen

**Fields:**
| Field | Validation | Notes |
|---|---|---|
| New Password | Required + `length < 8` check | `AuthInput` with `Lock` icon; eye toggle |
| Confirm New Password | Required + must match | `AuthInput` with `Lock` icon; eye toggle |

**Password Strength indicator:** Same `PasswordStrength` component as Register (5-segment bar + 5 check pills).

**Passwords match indicator:** When both fields are non-empty and equal, a green `CheckCircle` + "Passwords match" message appears.

**Behavior:**
1. On submit → validates both fields → 1.5s loading delay.
2. Success state: "Password Updated!" animation with `CheckCircle` icon + spinner + "Redirecting to sign in..."
3. 3-second delay → `setAuthScreen('login')`.
4. "Back to sign in" link available throughout.

**Error display:** Inline alert with `AlertTriangle` icon. Messages: "Please fill in both fields", "Password must be at least 8 characters", "Passwords do not match."

### 6.7 Shop Select Screen

**Purpose:** Multi-shop selector. User chooses which shop (or branch) to enter.

**Layout:** Full-page (not inside `AuthLayout`). Has its own header bar with ShopChain logo, user avatar + name, and **"Log out" button** that calls `logout()` → resets to `login`.

**Shop cards — each card displays:**
| Element | Description |
|---|---|
| Shop logo | `ShopLogo` component (emoji or uploaded image) with shop colour accent |
| Shop name | Bold text, truncated on overflow |
| "HQ" badge | Shown if the shop has branches |
| City + Type | e.g., "Accra · Retail Store" |
| Role badge | User's role in this shop (e.g., "👑 Owner", "🔹 Manager") with colour-coded pill |
| Team count | Member count with `Users` icon |
| Products | Numeric count (monospace) |
| Revenue | GH₵ amount (green, monospace) |
| Branch count | Shown if branches exist |
| Branch toggle | "Show N Branches" / "Hide N Branches" expandable button |

> **Note:** No plan badge is shown on shop cards (the previous spec incorrectly stated one was present).

**Branch expansion:**
- Clicking the branch toggle expands a tree-connector UI showing each branch with: name, city, status badge (Active/Paused), product count, and revenue.
- **Direct branch entry:** Clicking a specific branch calls `onSelectShop({ ...shop, activeBranch: branch })`, setting both the shop AND the selected branch as the active context before navigating to `authenticated`.

**Other behavior:**
- "Create a New Shop" dashed card → navigate to `createShop`.
- Selecting a shop (clicking the main card area) → `selectShop(shop)` → sets `activeShop` + `activeBranch` → navigate to `authenticated`.
- Footer with copyright, Terms, Privacy, and Help links.

### 6.8 Create Shop Wizard (4 Steps)

**Wizard chrome:** Top bar with "Create Your Shop" title, step counter ("Step N of 4"), Back (←) button, Cancel link. Below that, a **progress stepper** with 4 step icons (Store, MapPin, Settings, Zap) and connecting lines.

**Proceed gate:** Each step has a `canProceed()` function that must return `true` to enable the Next/Launch button:
- Step 1: `name` (trimmed) AND `type` AND `region` required
- Step 2: `phone` (trimmed) AND `email` (trimmed) required
- Step 3: Always proceeds (no required fields)
- Step 4: Always proceeds (review only)

**Step 1 — Business Info:**
| Field | Validation | Notes |
|---|---|---|
| Shop / Business Name | Required | `AuthInput` with `Store` icon |
| Business Type | Required, card-select | 7 options: Retail Store (🏪), Wholesale (🏭), Supermarket (🛒), Pharmacy (💊), Restaurant/Bar (🍽️), General Trading (📦), Other (🏢). Each card shows icon + label + description. |
| Description | Optional | Text input |
| Country | Pre-filled, read-only | 🇬🇭 Ghana (with `Globe` icon) |
| Region | Required, select | 16 Ghana regions dropdown |
| City / Town | Optional | Text input |

> **Note:** Country, Region, and City are rendered in Step 1 (Business Info), not Step 2. Region is a `canProceed` gate for Step 1.

**Step 2 — Contact & Location:**
| Field | Validation | Notes |
|---|---|---|
| Business Phone | Required | `AuthInput` with `Phone` icon; placeholder "+233 24 000 0000" |
| Business Email | Required | `AuthInput` with `Mail` icon |
| Physical Address | Optional | `AuthInput` with `MapPin` icon |
| GPS / Digital Address | Optional | Text input with "Locate" button (browser geolocation placeholder) |
| Operating Hours | Card-select | 4 presets: **Standard** (Mon–Fri, 8am–6pm), **Extended** (Mon–Sat, 7am–9pm), **24/7** (Open round the clock), **Custom** (Set your own schedule). No "Weekend Only" option exists. |

> **Note:** Email is **required** in Step 2 (contrary to earlier spec version). Operating Hours is rendered in Step 2, not Step 3.

**Step 3 — Preferences:**
| Field | Validation | Notes |
|---|---|---|
| Shop Logo | Optional, emoji picker | 16 emoji options (🏪 🛒 🏬 🏭 💊 🍽️ 📦 🧴 ☕ 🥘 🧊 🍞 🔧 🌿 💻 👗) |
| Receipt Logo | Optional, file upload | Accepts PNG/JPG/WEBP, max 2 MB, recommended 400×400. Preview shown if uploaded. |
| Currency | Pre-filled, read-only | 🇬🇭 Ghanaian Cedi (GH₵) |
| Enable Tax | Toggle | Default: on |
| Tax Rate | Numeric | Default: **15** (not 12.5); shown only when tax enabled |
| Inventory Costing Method | Radio-card select | 3 options: **FIFO** (📤, default), **LIFO** (📥), **Weighted Average** (⚖️). Each shows icon + label + description. |

> **Note:** Logo selection and receipt logo upload are in Step 3 (Preferences), not Step 1.

**Step 4 — Review & Launch:**
- Full summary of all entered data grouped by step.
- Shop logo preview at top.
- "Launch Shop" button → 2s launching delay → success animation ("🎉 You're all set!") → 2.5s redirect delay → `onComplete(shop)` → navigate to `authenticated`.
- Progress stepper shows all 4 steps with completed/active/upcoming states.

### 6.9 Admin Login Screen

**Purpose:** Separate authentication for platform administrators.

**Access:** Via "Admin Portal" link on the user login screen.

**Fields:**
| Field | Pre-filled (demo) | Notes |
|---|---|---|
| Admin Email | `admin@shopchain.com` | `defaultValue`, not controlled state |
| Password | `admin123` | `defaultValue`, type=password |
| 2FA Code | `1` `2` `3` `4` `5` `6` | 6 individual digit inputs, each `defaultValue` pre-filled |

**Behavior:**
- "Access Admin Portal" button → directly sets `authScreen('adminDashboard')` with **no validation at all** (pure demo).
- "← Back to User Login" link → navigates to `login`.
- Visual styling uses danger/red gradient (distinct from user-facing blue theme).

> **⚠ Demo only:** All fields use `defaultValue` (uncontrolled inputs). No form submission, no credential checking. Production requires real admin auth with 2FA verification.

---

## 7. Screen-by-Screen Specification

### 7.1 Dashboard (`dashboard`)

**Purpose:** Overview of business health at a glance.

**Access:** `dash_view` permission required.

**Components:**

1. **KPI Cards (6):** Responsive grid (1-col mobile → 6-col xl). Each card includes a mini area-sparkline chart (120 × 40 px, 6 data-points) and a trend indicator (up/down arrow with delta text vs. previous week).

   | # | Title | Value | Notes |
   |---|---|---|---|
   | 1 | Total Products | Product count | Trend: e.g. "+3" |
   | 2 | Total Stock Units | Sum of all stock quantities | |
   | 3 | Inventory Value | GH₵ total (stock × cost) | |
   | 4 | Low / Out of Stock | Two numbers separated by "/" | e.g. "3 / 1" |
   | 5 | Expiring / Expired | Two numbers separated by "/" | e.g. "2 / 0" |
   | 6 | Today's Sales | GH₵ revenue | 7-day sparkline; % change vs. yesterday; clickable → navigates to `salesAnalysis`; "View Sales Analysis →" text link at bottom |

2. **Alert Cards (3-column grid):**
   - **Low Stock Alerts:** Products where `stock <= reorder`. Shows product name, current stock, reorder level, and "Reorder" action button.
   - **Expiry Alerts:** Products expiring within 30 days, grouped by urgency (red = expired, amber = expiring within 7 days, yellow = expiring within 30 days).
   - **Recent Activity:** Last actions (sales, adjustments, POs received).

3. **Stock by Category:** Card with category breakdown rows showing category name, stock count, and percentage progress bar. "Export" button (secondary) in section header.

**Actions:**
- Click "Reorder" on low stock item → navigates to `purchaseOrders` with supplier pre-selected.
- Click Today's Sales card → navigates to `salesAnalysis`.
- "Export" button on Stock by Category → placeholder for CSV/PDF export.

---

### 7.2 Products (`products`)

**Purpose:** Product catalog management.

**Access:** `prod_view` permission required.

**Features:**
- **Search:** Filters by product name or SKU.
- **Status filter:** `All Status`, `In Stock`, `Low Stock`, `Out of Stock`.
- **Expiry filter:** `All Expiry`, `Expired`, `Expiring Soon`, `Fresh`, `No Expiry`.
- **Barcode scan:** Opens `ScannerModal` for barcode lookup (requires `barcode` plan feature).
- **Import / Export buttons:** Two secondary-variant buttons (Upload icon / Download icon) in the toolbar.
- **Product list:** Responsive — cards on mobile, table on desktop.

**Mobile card shows:** Product emoji/image, name, SKU, status badge, expiry badge + label (if expiryDate exists), price (GH₵), stock qty + unit, location badge.

**Desktop table columns:** Image + Name, SKU, Category (badge), Price, Stock + Unit, Reorder Point, Expiry (date + batch number if batch-tracked), Location (badge), Status badge, Actions.

**Batch tracking indicator:** For batch-tracked products, the Stock column shows "X batch(es)" count; the Expiry column shows the earliest batch expiry date and batch number.

**Actions:**
- Click product row/card → navigate to `productDetail`.
- Eye icon → navigate to `productDetail`.
- Edit icon → navigate to `editProduct`.
- "Add Product" button (requires `prod_edit`) → navigate to `addProduct`. Blocked by `canAdd('products')`.
- "Scan Barcode" button → opens `ScannerModal`.
- Pagination: Configurable items per page.

---

### 7.3 Add / Edit Product (`addProduct` / `editProduct`)

**Purpose:** Create or modify a product record.

**Access:** `prod_edit` permission required.

**Layout:** Two-column on desktop — main form on left, sidebar on right.

**Main form — Basic Information:**
| Field | Validation | Notes |
|---|---|---|
| Product Name | Required | |
| SKU | Required, unique | Auto-generated suggestion, manual override allowed |
| Barcode | Optional | Free-text |
| Category | Required, select | "Add new category" link opens `QuickAddCategoryModal` |
| Unit of Measure | Required, select | "Add new unit" link opens inline `QuickAddUnitModal` (Name, Abbreviation, Type, Description; validates duplicate abbreviation) |
| Description | Optional | Textarea |

**Main form — Pricing & Cost:**
| Field | Validation | Notes |
|---|---|---|
| Cost Price (GH₵) | Required, number | |
| Selling Price (GH₵) | Required, number | |
| Margin | Read-only | Auto-calculated badge: `((1 - cost / price) * 100).toFixed(1)%` — displayed in green |

**Main form — Inventory Settings:**
| Field | Validation | Notes |
|---|---|---|
| Opening Stock | Optional, number | Label is "Opening Stock" (not "Initial Stock") |
| Reorder Point | Required, number | |
| Storage Location | Optional, select | From warehouse list |
| Expiry Date | Optional, date | Helper text: "Leave blank for non-perishable items" |

**Right sidebar:**
| Field | Validation | Notes |
|---|---|---|
| Product Image | Optional | Drag-and-drop / click-to-upload area (180 px tall, dashed border). Accepts PNG, JPG up to 5 MB. Shows Camera icon + "Click or drag to upload". In edit mode shows the product's current image/emoji. |
| Supplier | Optional, select | From supplier list |
| Tags | Optional | Text input with placeholder "Add tags…". Pre-populated badge examples: `popular`, `imported`, `perishable` |

**SKU uniqueness:** On blur, checks if SKU already exists in the product list. Shows inline error "SKU already exists" if duplicate.

**Edit mode:** Pre-fills all fields with existing product data. SKU field is read-only in edit mode.

---

### 7.4 Product Detail (`productDetail`)

**Purpose:** Full product information, batch history, and pricing management.

**Access:** `prod_view` permission required. Price editing requires `prod_price`.

**Sections:**

1. **Product header:** Name, image, SKU, category, supplier, status badge. "Edit Product" and "Delete Product" buttons.

2. **KPI Stat Cards (6):**

   | # | Title | Value |
   |---|---|---|
   | 1 | Selling Price | Current selling price (GH₵) |
   | 2 | Cost Price | Current cost price (GH₵) |
   | 3 | Margin | Profit margin percentage |
   | 4 | Current Stock | Qty + unit |
   | 5 | Reorder Point | Reorder level (clickable → opens `ReorderLevelModal`) |
   | 6 | Expiry | Expiry status with dynamic color (expired = red, expiring soon = amber, fresh = green) |

3. **Price Movement Chart:** Line/area chart (`PriceMovementChart` component) showing 6-month historical selling and cost prices. Period filters: 3M, 6M (default), 1Y, All.

4. **Price Change History (table):** Log of past price changes showing:
   - Date and who made the change
   - Old → New selling price with % change
   - Old → New cost price
   - New margin percentage
   - Reason for change
   - Status (e.g. "approved")

5. **Stock Movement History:** Recent stock movements showing: movement type (Sale, Transfer In, Adjustment, Purchase), quantity changed (+/-), date, running balance. Last 5 movements displayed.

6. **Batch List:** (if `batchTracking=true`)
   - Table of all batches sorted by FEFO.
   - Columns: Batch # + ID, Qty (current / initial + unit), Expiry (date + status label), Status badge (active / expired / depleted), Location, Source PO, Received date.
   - Footer: Total quantity, counts of active / expired / depleted batches, total batch count.

7. **Quick Actions (8):**

   | # | Action | Icon |
   |---|---|---|
   | 1 | Change Price | DollarSign |
   | 2 | Change Reorder Level | Layers |
   | 3 | Print Price Tag | Tag |
   | 4 | Print Barcode | QrCode |
   | 5 | Create Purchase Order | Truck |
   | 6 | Add Batch | Package |
   | 7 | New Adjustment | ClipboardList |
   | 8 | Transfer Stock | ArrowRightLeft |

8. **Add Batch Modal:** Inline modal (not a separate component) for manually adding a new batch. Includes a success overlay on submission.

**Actions:**
- "Edit Product" → navigate to `editProduct`.
- "Delete Product" (requires `prod_delete`) → confirmation modal.
- Click Reorder Point KPI → opens `ReorderLevelModal`.
- Quick Actions → each opens the appropriate workflow or modal.

---

### 7.5 Categories (`categories`)

**Purpose:** Manage product categories.

**Access:** `cat_view` to view, `cat_edit` to modify.

**Stat Cards (4):**
| # | Title | Value |
|---|---|---|
| 1 | Total Categories | Count of all categories |
| 2 | Active | Count of active categories |
| 3 | Inactive | Count of inactive categories |
| 4 | Uncategorised | Count of products with no category assigned |

**Search:** Filters by category name or description.

**Status filter:** Button pills — `All`, `Active`, `Inactive`.

**List:** Card layout with color-stripe header per category. Each card shows: emoji icon, name, description, status badge, product count, stock value (GH₵, formatted with "k" suffix for thousands). Cards include "View Products" button and status toggle.

**Add/Edit form fields:**
| Field | Validation |
|---|---|
| Name | Required, unique (duplicate name check) |
| Icon | Required — emoji picker with **30** emoji options |
| Color | Required — **16** color swatches |
| Description | Required, textarea |
| Status | Active / Inactive toggle buttons |

**Form preview:** Live preview section showing the selected emoji + color + name + description + status badge.

**Actions:**
- Add category → opens form/modal.
- Edit category → same form pre-filled.
- Toggle status → `active` ↔ `inactive`.
- Delete → **only if no products are assigned** (otherwise shows modal with warning explaining products must be reassigned first).
- "View Products" → navigates to products page.

**Pagination:** 8 items per page.

---

### 7.6 Units of Measure (`units`)

**Purpose:** Manage measurement units.

**Access:** `uom_view` to view, `uom_edit` to modify.

**Stat Cards (4):**
| # | Title | Value |
|---|---|---|
| 1 | Total Units | Count of all units |
| 2 | Active | Count of active units |
| 3 | Inactive | Count of inactive units |
| 4 | Types | "X / 4" — how many of the 4 measurement types have at least one unit |

**Search:** Filters by unit name or abbreviation.

**Filters:**
- **Status filter:** Button pills — `All`, `Active`, `Inactive`.
- **Type filter:** Toggleable buttons with emoji icons — ⚖️ Weight, 🧪 Volume, 📏 Length, 🔢 Count.

**List:** Desktop = table (columns: Name, Abbreviation, Type badge, Product count, Status, Actions); Mobile = card layout. Abbreviation shown in monospace with primary-colored background highlight.

**Add/Edit form fields:**
| Field | Validation |
|---|---|
| Name | Required |
| Abbreviation | Required, unique across all units (checked on change, shows "Already exists" inline) |
| Type | Required — 4-button selector: `Weight`, `Volume`, `Length`, `Count` |
| Description | Required, textarea |
| Status | Active / Inactive toggle buttons |

**Delete protection:** Delete button is **only shown when no products use the unit** (product count = 0). Units with assigned products cannot be deleted.

---

### 7.7 Point of Sale (`pos`)

**Purpose:** Register interface for processing sales.

**Access:** `pos_sales` permission required.

**Layout:** Two-panel layout:
- **Left panel:** Product catalog (grid of cards with image, name, price, stock).
- **Right panel:** Cart with line items, totals, and checkout controls.

**Detailed behavior:** See Section 8 (POS Business Logic).

---

### 7.8 Sales History (`sales`)

**Purpose:** View and manage past transactions.

**Access:** `pos_receipts` permission required.

**KPI Cards (4):**
| # | Title | Value |
|---|---|---|
| 1 | Total Revenue | Sum of all active (non-reversed) sale totals (GH₵) |
| 2 | Total Sales | Count of completed sales |
| 3 | Avg Order Value | Revenue / sales count |
| 4 | Reversed | Count of reversed sales |

**Filters:**
- **Search:** By receipt number (Transaction ID) or customer name. *(Note: does NOT search by cashier name.)*
- **Status filter:** `All`, `Completed`, `Reversed`, `Pending` (with badge showing count of pending).
- **Payment method filter:** `All`, `Cash`, `Card`, `MoMo`, `Split`.
- **Date range filter:** `All Time`, `Today`, `This Week`, `This Month`.
- "Clear all filters" button and results count displayed.

**Pending Reversals Banner:** Collapsible banner shown only if the user has `pos_void: full` access and there are pending reversals.

**Each sale row shows (desktop table):** Receipt #, Date/Time, Customer, Items count, Payment method, Status badge, Total, Actions.

**Mobile view:** Card layout with expandable details.

**Expand row shows:**
- **Items:** Product name, Qty, Price, Amount per line.
- **Financials:** Subtotal, Tax, Discount (with % if percentage type), Total.
- **Payment details:** Method-specific (Cash: amount tendered + change; Card: type + transaction number; MoMo: provider + phone + reference; Split: individual payment breakdowns).
- **Reversal info (if applicable):** Reason, reversed/requested by, timestamp.
- Cashier name, Customer ID.

**Reversal flow:**
- **Direct reversal** (owner/manager with `pos_void: full`): Click "Reverse" → modal with reason textarea → confirm → sale status changes to `reversed` immediately.
- **Request reversal** (salesperson with `pos_void: partial`): Click "Request Reversal" → enter reason → sale status changes to `pending_reversal` → notification sent to managers.
- **Approve/Reject** (manager/owner on pending_reversal): "Approve" changes to `reversed`; "Reject" changes back to `completed`. Both generate notifications.

**Pagination:** 10 items per page (desktop), 8 per page (mobile).

---

### 7.9 Sales Analysis (`salesAnalysis`)

**Purpose:** Sales analytics dashboard.

**Access:** `bar_analysis` permission required (mapped via `NAV_PERM_MAP`).

**KPI Cards (4):**
| # | Title | Value | Sub-detail |
|---|---|---|---|
| 1 | Today's Revenue | GH₵ amount | % change vs. yesterday |
| 2 | Transactions | Count | Yesterday comparison |
| 3 | Avg Order Value | GH₵ amount | Items sold today |
| 4 | Discounts Given | GH₵ amount | % of gross |

**Period Comparison Section:** Side-by-side cards for Today, Yesterday, This Week, This Month — each showing revenue, transaction count, items sold, and discounts.

**Charts:**

1. **7-Day Revenue (bar chart):** Daily revenue for the last 7 days with individual bar heights.
2. **Payment Methods (today):** Progress-bar visualization showing payment method breakdown with percentage indicators (not a pie/donut chart).
3. **Hourly Distribution (bar chart):** 16 bars covering 6 AM – 10 PM. Peak hour highlighted with revenue amount.
4. **Top Products (today):** Ranked list visualization with product names, quantities, and revenue.
5. **Customer Mix (today):** Stacked ratio bar showing registered vs. walk-in customer split with percentages.

**Projections & Run Rate Section:**
- Daily Average (this month)
- Weekly Projection
- Monthly Projection
- Week Daily Average

---

### 7.10 Purchase Orders (`purchaseOrders`)

**Purpose:** Manage purchase orders to suppliers.

**Access:** `po_view` to view, `po_create` to create, `po_approve` to approve/receive.

**KPI Cards (4):**
| # | Title | Value |
|---|---|---|
| 1 | Total POs | Count of all purchase orders |
| 2 | Pending Value | GH₵ value of pending + approved POs |
| 3 | Awaiting Delivery | Count of approved + shipped POs |
| 4 | Received This Month | Count of POs received in the current month |

**List features:**
- **Status tabs:** All, Draft, Pending, Approved, Shipped, Partial, Received, Cancelled — each with badge count.
- **Search:** By PO ID or supplier name.
- **Export button:** Download icon in toolbar.
- **Desktop table columns:** PO # (monospace), Supplier, Items count, Total Value (GH₵), Created date, Expected date, Location (badge), Status badge, View action.
- **Mobile view:** Card layout with same information.

**Create PO:** Opens `PurchaseOrderModal` (3-step wizard):
1. **Select Supplier** — search and pick from supplier list.
2. **Add Products** — search products, set qty and unit cost per line item.
3. **Delivery Details** — location (warehouse), payment terms, expected date, notes.

**Pagination:** 10 items per page (desktop), 8 per page (mobile).

See Section 10 for PO workflow details.

---

### 7.11 PO Detail (`poDetail`)

**Purpose:** View and manage a specific purchase order.

**Layout:** Two-column on desktop — main content left, sidebar right.

**KPI Cards (5):**
| # | Title | Value |
|---|---|---|
| 1 | Order Value | Total PO amount (GH₵) |
| 2 | Line Items | Count of items |
| 3 | Total Units | Total quantity ordered |
| 4 | Received Value | GH₵ value of received items |
| 5 | Outstanding | Remaining unfulfilled amount (GH₵) |

**Main content:**
- **PO header:** ID, status badge, supplier name, dates, location, payment terms, created by. Action buttons in header (Preview & Print, Receive Goods, Approve, Cancel — conditional on status).
- **Line items table:** Product, Unit Cost, Ordered qty, Received qty (with progress bar), Line Total, Status.
- **Notes section.**

**Right sidebar:**
- **Supplier card:** Company, Contact, Phone, Email, Location.
- **Delivery Details card:** Location, Expected Date, Received Date, Payment Terms, Created By.
- **Order Timeline:** Visual vertical timeline showing stages — Created → Pending Approval → Approved → Shipped → Received (or Cancelled). Each step has a completion indicator, icon, and date.
- **Quick Actions (5):**
  1. Preview & Print PO
  2. Receive Goods (conditional on status)
  3. Duplicate PO
  4. Email to Supplier
  5. Export PDF

**Print Preview Modal:** Professional printable document with:
- Company header ("ShopChain"), PO number and date, supplier address block.
- Line items table: #, Product, SKU, Unit, Qty, Unit Cost, Total.
- Subtotal, Tax, Grand Total calculation.
- Terms & Conditions section.
- Authorized Signatures section (blank lines for Prepared By and Approved By).
- Notes section.
- "Sending to Printer" confirmation overlay with print button.

**Receive Goods Modal:** Comprehensive receiving with:
- **Summary banners:** Ordered, Previously Received, Receiving Now.
- **Per-item controls:** Receiving Qty (min/max constrained), Batch #, Condition dropdown, Expiry Date.
- **Batch split mode:** Toggle between "Single" and "Split Batches" per item. In split mode:
  - Sub-table rows for each batch: Batch Number, Quantity, Expiry Date, Condition (Good / Damaged / Short Ship), Notes, Delete button.
  - "Add Batch" button to add more batch rows.
  - Allocation tracking: "X / Y allocated" indicator.
- **Quick fill buttons:** "Fill All Remaining", "Clear All".
- **Receiving Notes:** Textarea for condition notes and discrepancies.
- **Footer:** Total units and value being received.

**Status actions (based on current status):**
- `draft` → "Submit for Approval" (changes to `pending`)
- `pending` → "Approve" (changes to `approved`) or "Reject" (changes to `cancelled`)
- `approved` → "Mark as Shipped" (changes to `shipped`)
- `shipped` → "Receive Goods" (enter received quantities → `received` or `partial`)
- `partial` → "Receive Remaining"
- Any non-received → "Cancel" (changes to `cancelled`)

---

### 7.12 Receive Orders (`receiveOrders`)

**Purpose:** Ad-hoc stock receiving (not linked to a PO).

**Access:** `po_view` permission required.

**KPI Cards (4):**
| # | Title | Value |
|---|---|---|
| 1 | Total Receipts | Count of all receive orders |
| 2 | This Month | Receipts created in current month |
| 3 | Units Received | Total quantity received across all orders |
| 4 | Avg Items / Receipt | Average item count per receipt |

**List features:**
- Past receive orders with: reference, date, warehouse, item count, total qty, status.
- **Status filter dropdown:** `All Status`, `Completed`, `Draft`.

**"Receive New Stock" form:**

| Field | Notes |
|---|---|
| Reference # | **Auto-generated** (`RCV-{YYYY}-{NNNN}`), read-only |
| Warehouse | Required dropdown |
| Date | Date picker |
| Notes | Optional text |

**Add products:** Dropdown to select products. Per-item row shows:
- Product name + unit.
- **Quantity** (single mode) or total (multiple mode).
- **Batch #** (with auto-generate option).
- **Condition dropdown:** `Good`, `Damaged`, `Short Ship`.
- **Expiry Date:** Date picker.
- **Batch Mode toggle:** `Single` or `Split Batches`. In split-batch mode, sub-rows appear for each batch with individual Batch Number, Quantity, Expiry Date, Condition, and Notes fields.
- Delete button.

**On confirmation:**
- Creates new batches via `createBatch()` for each received item.
- Updates product stock, expiry date, and status via `updateProductFromBatches()`.

---

### 7.13 Adjustments (`adjustments`)

**Purpose:** Record stock adjustments (damage, recount, expiry, theft, return).

**Access:** `adj_view` to view, `adj_create` to create, `adj_approve` to approve.

**Expired Items Alert Banner:** If any products or batches are expired, a danger-colored banner appears at the top: "{count} item(s) expired — consider creating stock adjustments". Lists each expired item with its expiry label. Uses AlertTriangle icon.

**List:** Shows all adjustments with: ID, product, type, qty (+/-), date, staff, reason, status badge.

**Create adjustment:**
| Field | Validation |
|---|---|
| Product | Required, select from product list |
| Type | Required: `Damage`, `Recount`, `Expired`, `Theft/Shrinkage`, `Return` |
| Quantity | Required, integer (±). Placeholder: "±0" |
| Date | Date picker, default: today |
| Batch | Required **if product is batch-tracked** — dropdown showing active/expired batches. Format: `{batchNumber} — {quantity} {unit} — Exp: {date}` |
| Reason / Notes | Required, textarea. Placeholder: "Provide a reason for this adjustment…" |

**Batch selection:** Only appears when the selected product has batch tracking enabled (`isBatchTracked(product)`). Filters to show only active or expired batches.

**Approval:** Adjustments created by non-managers start as `pending`. Managers/owners can approve or reject.

---

### 7.14 Transfers (`transfers`)

**Purpose:** Move stock between locations.

**Access:** `xfer_view` to view, `xfer_create` to create.

**Stat Cards (3):**
| # | Title | Value | Color |
|---|---|---|---|
| 1 | In Transit | Count of `in_transit` transfers | primary |
| 2 | Completed | Count of `completed` transfers | success |
| 3 | Total Units Moved | Sum of all transfer quantities | — |

**List:** Shows all transfers with: ID, product, qty, from, to, date, status badge.

**Status filter:** `All Status`, `In Transit`, `Completed`, `Pending`.

**Create transfer:**
| Field | Validation |
|---|---|
| Product | Required, select — shows "{name} ({stock} avail.)" |
| From Location | Required, select (Warehouse A, Warehouse B, Store Front) |
| To Location | Required, select (must differ from From — validation alert if same) |
| Quantity | Required, > 0, <= source stock |
| Notes | Optional, textarea. Placeholder: "Transfer notes…" |

**Status flow:** `pending` → `in_transit` → `completed` or `cancelled`. *(Note: `pending` is a valid status — the spec previously omitted it.)*

---

### 7.15 Warehouses (`warehouses`)

**Purpose:** Manage warehouse locations.

**Access:** `wh_view` to view, `wh_manage` to manage.

**KPI Cards (4):**
| # | Title | Value |
|---|---|---|
| 1 | Locations | Total number of warehouses |
| 2 | Total Capacity | Combined capacity in units across all warehouses |
| 3 | Current Utilization | Percentage (color-coded: warning if >85%, primary if >60%, success otherwise) |
| 4 | Units in Stock | Total units stored across all locations |

**Search:** Filters across warehouse name, manager name, and address. Placeholder: "Search locations…".

**Type filter:** Dropdown filtering by warehouse type (e.g. Retail, Main Storage). Default: all types.

**Warehouse cards show:**
- **Header:** Name, type badge, gradient icon background by type, utilization percentage badge (color-coded).
- **Capacity bar:** Visual progress bar showing current vs. available units ("X / Y units") with available count. Color-coded by utilization.
- **Info grid (4 items):** SKUs (product count at location), Stock Value (GH₵), Manager (name), Low Stock (count, with warning icon if > 0).
- **Zones:** Displayed as badges.
- **Address:** MapPin icon + address text.

**Actions:**
- Click warehouse → navigate to `warehouseDetail`.
- "Add Warehouse" (requires `wh_manage`) → blocked by `canAdd('warehouses')`.

---

### 7.16 Warehouse Detail (`warehouseDetail`)

**Purpose:** View warehouse details and its inventory.

**Layout:** Two-column on desktop — main content left, sidebar right.

**Header:** Back button, warehouse name, type badge, address. "Edit" and "New Transfer" buttons.

**KPI Cards (5):**
| # | Title | Value |
|---|---|---|
| 1 | SKUs Stored | Number of products at this warehouse |
| 2 | Total Units | Total unit count |
| 3 | Utilization | Percentage (color-coded: warning >85%, success otherwise) |
| 4 | Stock Value (Cost) | Total value (GH₵) |
| 5 | Low / Out of Stock | Count of products needing attention (color-coded) |

**Main content:**
- **Capacity Overview:** Visual bar + zone breakdown showing unit distribution per zone.
- **Products Section:** Table/list of all products at this warehouse. Columns: Product, SKU, Category, Stock, Reorder Point, Cost Value, Status.

**Right sidebar (4 cards):**
1. **Location Manager:** Contact details — manager name, phone, email, address.
2. **Needs Attention:** Low/out-of-stock products (up to 5) with stock levels and reorder points.
3. **Recent Transfers:** Last 5 transfers in/out with direction indicator, product, qty, date.
4. **Zones:** All warehouse zones listed with "Active" status badges.

**Quick Actions (4):**
1. Create Transfer
2. Stock Adjustment
3. Print Location Report
4. Export Inventory

---

### 7.17 Suppliers (`suppliers`)

**Purpose:** Manage supplier directory.

**Access:** `sup_view` to view, `sup_edit` to modify.

**KPI Cards (4):**
| # | Title | Value |
|---|---|---|
| 1 | Total Suppliers | Total count |
| 2 | Active | Count of active suppliers |
| 3 | Total Products Supplied | Sum of products across all suppliers |
| 4 | Avg. Rating | Average star rating (1 decimal place) |

**Search:** By supplier name or contact person name.

**Status filter:** Dropdown — `All Status`, `Active`, `Inactive`.

**Supplier cards show:**
- **Header:** Building icon with colored background, supplier name (clickable), contact person, location, star rating.
- **Contact info:** Phone, Email.
- **Product summary strip (3 mini cards):** In Catalog (product count), Stock Value (GH₵), Low/Out (count, with warning background if > 0).
- **Footer:** Status badge (Active/Inactive), "Products" button, Eye icon → navigate to `supplierDetail`.

**Add supplier:** Opens `AddSupplierModal`:
| Field | Validation |
|---|---|
| Name | Required |
| Contact Person | Required |
| Phone | Required, valid phone |
| Email | Required, valid email |
| Location | Required |

**Export button** in toolbar.

**Actions:**
- Click supplier card/name → navigate to `supplierDetail`.
- "Add Supplier" → blocked by `canAdd('suppliers')`.

**Pagination:** 8 items per page.

---

### 7.18 Supplier Detail (`supplierDetail`)

**Purpose:** View supplier info and linked products/POs.

**Layout:** Two-column on desktop — main content left, sidebar right.

**KPI Cards (5):**
| # | Title | Value |
|---|---|---|
| 1 | Products in Catalog | Count of supplier's products |
| 2 | Stock Value (Cost) | Total cost value (GH₵) |
| 3 | Retail Value | Total retail value (GH₵) |
| 4 | Avg. Margin | Margin percentage |
| 5 | Low / Out of Stock | Count (color-coded warning) |

**Main content:**
- **Add Product Form:** "Add Product from {Supplier Name}" — comprehensive inline form with: Product Name (required), Category (dropdown + "Add new category" link), Barcode (with scanner button), Cost Price (required), Selling Price (required), Opening Stock, Reorder Point, Unit of Measure (+ "Add new unit" link), Storage Location, Margin Preview (auto-calculated), auto-linked supplier indicator. Success overlay on submission.
- **Products Table:** List of supplier's linked products (desktop table / mobile cards).
- **Purchase order history:** POs for this supplier.

**Right sidebar (5 cards):**
1. **Contact Information:** Contact person, Phone, Email, Location.
2. **Supplier Performance:** Rating, On-Time Delivery, Quality Score, Response Time — each with progress bars.
3. **Needs Reorder:** Low/out-of-stock products with alerts.
4. **Recent Purchase Orders.**
5. **Quick Actions (7):**
   - Add New Product
   - Create Purchase Order
   - Change Reorder Level
   - Print Price Tags
   - Print Barcodes
   - Export Product List
   - Contact Supplier

---

### 7.19 Customers (`customers`)

**Purpose:** Customer relationship management.

**Access:** All authenticated users can view (no specific permission key gates this page in `NAV_PERM_MAP`).

**KPI Cards (4):**
| # | Title | Icon | Value |
|---|---|---|---|
| 1 | Total Customers | Users | Total count |
| 2 | Regular | User | Count of regular customers |
| 3 | Wholesale | Building2 | Count of wholesale customers |
| 4 | Total Revenue | — | GH₵ sum of all customers' `totalSpent` |

**Search:** By customer name or phone.
**Type filter:** All, Regular, Wholesale, Walk-in.

**Customer row shows:** Avatar, Name + email/ID, Phone, Type badge, Total Spent (GH₵), Visit count, ChevronRight indicator.

**Add customer modal:**
| Field | Validation |
|---|---|
| Name | Required |
| Phone | Required |
| Email | Optional |
| Type | Required: regular, wholesale, walk-in |
| Notes | Optional |

**Customer detail view:**
- Customer info header.
- **"Edit" button** (ghost variant) and **"New Sale" button** (primary variant, ShoppingCart icon → navigates to `pos`).
- Purchase history: Filtered sales for this `customerId`.
- Total spent, visit count, loyalty points.
- Edit customer info.

---

### 7.20 Team (`team`)

**Purpose:** Manage shop staff and role assignments.

**Access:** `team_view` to view, `team_invite` to invite, `team_roles` to change roles.

**Stat Cards (4):**
| # | Title | Value |
|---|---|---|
| 1 | Total Members | Total count |
| 2 | Active | Count of active members |
| 3 | Pending Invites | Count of pending invites |
| 4 | Roles in Use | "X / {ROLES.length}" |

**Filters:**
- **Status filter buttons:** `All`, `Active`, `Pending`, `Deactivated`.
- **Role filter dropdown:** `All Roles` + individual role options with icons.
- **Search:** By name, email, or phone.

**List:** Team members with: avatar, name, email, phone, role badge, status badge, last active.

**Invite Member Modal (`InviteMemberModal`):**
- **Two tabs:** Email (Mail icon) and SMS (Phone icon) — user toggles to choose invitation method.
- **Fields:**
  | Field | Validation |
  |---|---|
  | Full Name | Required |
  | Email or Phone | At least one required (depends on selected tab) |
  | Role | Required, select from available roles |
- **"Or share an invite link"** — Copy Link button (Copy icon). Shows "Copied!" confirmation with checkmark when clicked.
- Plan limits enforced: `canAdd('team')` must return true.

**Edit Member Modal (`EditMemberModal`):**
- Member profile display: avatar, name, email, phone, join date.
- **Account Status:** Active / Deactivated selector (conditionally hidden if member is Owner).
- **Role selector:** All available roles.
- **Remove confirmation dialog** for removing a member.
- Save / Cancel buttons.

**Actions:**
- Click member → opens Edit modal.
- "Invite" button → opens Invite modal.
- "Permissions" button (conditional on `canManagePerms`) → navigate to `permissions`.

---

### 7.21 Role Permissions (`permissions`)

**Purpose:** **Editable** permission matrix for customizing role access at the shop level.

**Access:** `team_view` permission required.

**Display:** Matrix grid with:
- Columns: All 12 roles.
- Rows: All 36 permissions grouped by module (13 module groups).
- Cells: Color-coded badge showing permission level:
  - ✓ Full (green)
  - ◐ Partial (orange)
  - 👁 View (blue)
  - ✕ None (gray)

**Legend:** Displayed above the matrix showing all 4 permission levels with icons and colors.

**Interactivity:** Clicking a cell **cycles through permission levels** in order: Full → Partial → View → None (repeating). Modified cells are highlighted in blue. The Owner column is **locked** — always "full" and cannot be edited.

**Action buttons:**
- **Reset:** Reverts all changes to defaults. Disabled when no modifications exist.
- **Save:** Saves changes. Shows loading state, then success state. Disabled when no modifications or during save. Button label shows count of modified permissions (e.g. "Save (3 changes)").

---

### 7.22 Notifications (`notifications`)

**Purpose:** In-app notification inbox with preference management.

**Sections:**

1. **Filter tabs:** `All`, `Unread`, `Read`. *(Note: there is no "Requires Action" tab — the third tab is "Read".)*

2. **Expandable filters panel:**
   - **Category filter:** All, Stock, Orders, Sales, Approvals, Team, System, Customers.
   - **Priority filter:** `All`, `Critical`, `High`, `Medium`, `Low`.
   - Clear all filters button and results count.

3. **Notification list:** Date-grouped — **Today**, **Yesterday**, **This Week**, **Older**. Each notification shows: icon, title, message, time ago, priority badge (high/critical shown prominently), "Action needed" badge (for notifications requiring action), actor name + role, channels (in-app, push, email, SMS). Per-notification actions: Delete, Mark as read.

4. **Bulk actions:** "Mark all as read" button (shown when unread count > 0).

**Pagination:** 15 items per page.

**Actions:**
- Mark as read (individual or bulk "Mark all as read").
- Delete individual notifications.
- Take action (approve/reject) on actionable notifications.
- Click notification → navigates to `actionUrl` if set.

---

### 7.23 Shop Settings (`settings`)

**Purpose:** Configure shop-level settings.

**Access:** `set_shop` permission required.

**Tabs (6):**

**1. General:**
- Shop name, address, phone, email (editable).
- Logo upload.
- Currency display, timezone.
- Tax rate configuration.
- Receipt footer text.
- Low stock threshold (global default).
- **Enable barcode scanner** toggle.
- **Receipt Logo upload:** File upload (PNG, JPG, WebP; max 2 MB). Shows preview, Replace and Remove buttons, file info (name + size).
- **Geolocation map:** "Locate My Shop" button with GPS. Shows accuracy circle and center pin on SVG map. Displays coordinates (lat/lng). "Copy Coordinates" and "Open in Google Maps" buttons.
- **Operating Hours editor:**
  - Three preset modes: `Standard` (Mon–Fri 8 AM–6 PM, Sat 9 AM–2 PM), `Custom` (per-day), `24/7`.
  - Quick-action buttons: "All Open 8–6", "Weekdays Only", "All Closed".
  - Per-day custom editor with toggle switches and time inputs (from/to) for each day of the week.
- **Discount settings:**
  - Toggle to enable/disable discounts.
  - Discount type selector: Percentage, Fixed Amount, or Both.
  - Maximum discount caps: max percentage and max amount.
  - Role-based discount limits (percentage limit per role).

**2. Notifications:**
- Per-category notification preferences — all 7 notification types with enable/disable toggles.
- Channel selection per category: in-app, push, email, SMS.
- Quiet Hours configuration: enable/disable with from/to time inputs.

**3. Branches:**
- List existing branches.
- Add branch: name, type (retail/warehouse/distribution), address, phone, manager.
- Branch limits enforced by plan.

**4. Billing:** (requires `set_billing`)
- **Redirect message:** "Manage your subscription billing, invoices, and payment history from the Account page" — links to Account page Subscription tab.

**5. Integrations:**
- **MTN MoMo** (mobile money) — shown as connected.
- **QuickBooks** (accounting sync) — not connected.
- **Shopify** (e-commerce sync) — not connected.
- **WhatsApp** (customer notifications) — not connected.

**6. Danger Zone:** (requires `set_delete`)
- **"Archive Shop"** button to temporarily disable shop (data is preserved).
- **"Delete Shop"** with confirmation.

---

### 7.24 Account (`account`)

**Purpose:** Personal user account settings and subscription management.

**Trial Banner:** If on trial, shows trial progress bar: "Day X of 30 — Max Trial", days-left counter, and "Upgrade Now" button.

**Tabs (5):**

**1. Profile:**
- Personal information: First Name, Last Name, Email, Phone, Company, City.
- Avatar display with "Change" button.
- Account info section: Account ID, Member Since, Current Plan.
- "Save Changes" button with loading and success states.

**2. Subscription:**
- **Renewal notification banner:** Shown 14 days before renewal, color-coded by urgency.
- Current plan card with renewal date and pricing.
- **"Change Plan" button** → opens Plan Comparison modal (see below).
- Payment schedule options: Auto-Pay vs. Pay Manually.
- **Payment methods list:** Primary/Backup/status badges. "Add Method" button with modal. Edit and Remove actions per method. Role assignment controls.
- **Billing history table:** Date, Amount, Plan, Method, Status, Transaction reference.

**3. Security:**
- **Change Password:** Current password, new password, confirm. `PasswordStrength` component shown.
- **Two-Factor Authentication (2FA):** Toggle to enable/disable. QR code display for authenticator app (Google Authenticator / Authy). Manual key display for manual entry. "Download Backup Codes" button.
- **Active Sessions:** List of current sessions (device, location, last active). "Revoke" button per non-current session. "Log Out All Other Sessions" button.

**4. Usage:**
- Usage & Limits display with plan name and pricing.
- Role context banner (for non-decision-makers: explains they cannot change the plan).
- Alert banners for limits reached or approaching.
- **Usage bars for:** Shops, Branches, Team Members, Products, Monthly Transactions, Suppliers, Warehouses, Storage.
- "Upgrade" button (for decision-makers when not on Max plan).
- Crown icon nudge for non-decision-makers.

**5. Notifications:**
- Preference grid: 8 notification types × 3 channels (App, Email, SMS).
- Toggle switches for each channel per notification type.
- Quiet Hours configuration: enable/disable with from/to times.

**Plan Comparison Modal:**
- Shows all 3 plans (Free, Basic, Max) as cards with pricing and features.
- "Recommended" badge on Basic plan.
- Detailed comparison table with all features.
- Upgrade / Downgrade buttons.

---

### 7.25 Sale Verification (`/#/verify/:token`)

**Purpose:** Public page for customers to verify receipt authenticity.

**Access:** No authentication required. Standalone page.

**Loading state:** Spinner with "Verifying receipt…" message while the lookup runs.

**Behavior:**
1. Extracts `token` from URL hash.
2. Searches `INITIAL_SALES` and runtime sales for matching `verifyToken`.
3. Displays result:

   - **Verified (green ✓):** Sale found and `status === 'completed'`.
     - **Transaction info:** Receipt # (monospace), Date & Time (formatted with weekday), Customer (masked), Payment method (safe label: Cash, Card, Mobile Money, Split Payment), Served by (cashier name).
     - **Items detail:** Cards showing item name (truncated with ellipsis if long), Qty × unit price, line total. Item count badge in header.
     - **Summary section:** Subtotal, Discount (conditional, shows type if percentage), Tax (NHIL/VAT), Total.

   - **Reversed (red ✕):** Sale found and `status === 'reversed'`. Shows reversal reason and reversal timestamp.

   - **Pending Review (orange ⚠):** Sale found and `status === 'pending_reversal'`. Shows reversal reason and request timestamp.

   - **Not Found:** Error card with icon, "Receipt Not Found" message, attempted verification code, and contact message.

**Branding footer:** "Powered by ShopChain™" + "Receipt verification service" — shown on all states with reduced opacity.

**Privacy:** No card numbers, MoMo phone numbers, or full customer details are shown. Customer name is masked: "Kwame B." not "Kwame Boateng." Payment details use generic safe labels only.

---

### 7.26 Bar POS (`barPos`)

**Purpose:** Restaurant/bar-oriented point-of-sale interface with multi-till support, kitchen order management, and held orders.

**Access:** `bar_access` permission required.

**Layout:** Two-panel layout similar to retail POS:
- **Left panel:** Product catalog grid with search and category filtering (only in-stock products shown).
- **Right panel:** Order panel with cart items, table assignment, order type selection, and send-to-kitchen controls.

**Multi-Till System:**
- Till tabs at the top allow switching between active tills (filtered to today only).
- Each till maintains its own cart state (`tillCarts: Record<string, TillCart>`).
- "Open New Till" button creates a new till via `openTill(name, openedBy)`.
- When no active tills exist, an empty state prompts the user to open one.

**Per-Till Cart Features:**
| Feature | Details |
|---|---|
| Add to cart | Click product → adds to active till's cart (qty limited by stock) |
| Order type | Toggle: `dine_in` / `takeaway` (with UtensilsCrossed / ShoppingBag icons) |
| Table assignment | Text input for table name (e.g. "Table 5") |
| Item notes | Per-item notes for special instructions |
| Qty controls | Increment/decrement with stock ceiling |

**Send to Kitchen (`skipKitchen` split):**
When the "Send to Kitchen" button is clicked:
1. Items with `product.skipKitchen === true` are split into a separate bar-fulfilled order (auto-completed, not shown in Kitchen Display).
2. Remaining items are sent as a `pending` kitchen order via `placeOrder()`.
3. Cart is cleared after sending.

**Top Bar Actions:**
- **Held Orders** button (with count badge) → opens held orders drawer for the active till.
- **Orders** button (with unseen count badge) → opens `TillOrdersDrawer` showing all orders for the active till.
- **Close Till** button → confirmation modal → closes the till (requires all orders resolved).
- **Till Management** → navigates to `tillManagement` page.
- **Analysis** → navigates to `salesAnalysis` page.

**Held Orders:**
- "Hold" saves the current cart state (items, table, order type) to a held order list.
- "Resume" restores a held order to the active cart.
- "Discard" removes a held order (with confirmation).

**Responsive:** Mobile uses toggled `catalog` / `cart` views (similar to retail POS).

---

### 7.27 Kitchen Display (`kitchen`)

**Purpose:** Kitchen order management screen where kitchen staff can view, accept, reject, and complete incoming orders.

**Access:** `kitchen_access` permission required.

**Daily Scope:** Shows only today's orders. Bar-fulfilled orders (`barFulfilled: true`) are excluded.

**Filter Tabs:** `All | Pending | Preparing (accepted) | Ready (completed) | Rejected | Served | Returned | Cancelled` — each tab shows a count badge.

**Priority Sorting:**
1. `pending` orders (oldest first — urgent items surface to top).
2. `accepted` orders (oldest first).
3. `completed`, `served`, `returned`, `rejected`, `cancelled` (newest first for terminal states).

**Urgency Visual Cues:**
- Orders pending ≥ 10 minutes: red border (urgent).
- Orders pending 5–9 minutes: amber/warning border.
- Pending count badge uses `kitchenPulse` animation.

**Order Cards Display:**
| Element | Details |
|---|---|
| Order ID | Shortened order identifier |
| Till name | Which till placed the order |
| Server name | Waiter who placed the order |
| Status badge | Color-coded status indicator |
| Time ago | Live-updating elapsed time (refreshed every 30 seconds) |
| Order type | Dine-in (UtensilsCrossed) or Takeaway (ShoppingBag) icon |
| Table | Table assignment (if dine-in) |
| Items | Product names with quantities (no prices shown); notes in italic |
| Rejection reason | Shown on rejected orders |
| Timestamps | Completion, served, return timestamps as applicable |

**Actions:**
| Status | Available Actions |
|---|---|
| `pending` | Accept, Reject |
| `accepted` | "Ready for Pickup" (marks as `completed`) |

**Reject Modal:** Quick reason chips (`Out of stock`, `Item unavailable today`, `Kitchen at capacity`, `Ingredient shortage`) plus free-text textarea.

---

### 7.28 Till Management (`tillManagement`)

**Purpose:** Comprehensive till management system for bar/restaurant operations — order tracking, payments, till close, and receipts.

**Access:** `bar_access` permission required. Back navigation → `barPos`.

**Layout:** Split-panel:
- **Left panel (`TillListPanel`):** List of all today's tills with active/closed status, order counts, and unseen kitchen notification badges.
- **Right panel (`TillDetailPanel`):** Orders table, add-order panel, payment panel, kitchen notifications, and receipt preview.

**Mobile:** Toggle between `list` and `detail` views.

**Till Detail — Order Management:**
- All orders for the selected till sorted in reverse chronological order.
- Status-based color coding per order card.
- Distinguishes payable orders (`served`/`completed`, not yet paid) from unresolved orders (`pending`/`accepted`/`completed`).
- Outstanding balance: `totalOrderAmount - totalPaymentAmount`.

**Add Order Flow:**
- Product search, quantity management, table/order-type selection.
- Same `skipKitchen` split logic as Bar POS.
- Creates orders via `placeOrder()`.

**Payment Flow (per-till via `recordTillPayment`):**
| Payment Method | Fields |
|---|---|
| Cash | Amount tendered, change calculated |
| Card | Card type (Visa/Mastercard/Amex/UnionPay), transaction number |
| MoMo | Provider (MTN MoMo/TCash/ATCash/G-Money), phone, transaction ID |

**Discount System:**
- Respects `DISCOUNT_ROLE_LIMITS[currentRole]` — percent or fixed.
- Clamped to role maximum; `discountExceedsLimit` warning shown in UI.
- Applied at till level before payment.

**Return Order Modal:**
- Quick reason chips: `Wrong order`, `Customer complaint`, `Food quality issue`, `Customer left`.
- Free-text textarea.

**Kitchen Notifications Panel:**
- Per-till notifications for order status changes (accepted, rejected, completed, returned).
- Unread count badge.

**Close Till Flow:**
1. Check for unresolved orders (pending/accepted/completed) → block close if any exist.
2. If outstanding balance remains, trigger payment panel for final collection.
3. On close: `closeTill()` aggregates all non-rejected/non-cancelled orders into a single `SaleRecord` with `source: 'bar'`, then fires `onTillClose(saleRecord)`.
4. `TillReceiptPreview` modal shown with till summary receipt.
5. Receipt supports Print / Email / SMS actions.

**Sub-Components:**
| Component | Purpose |
|---|---|
| `TillListPanel` | Left column: list of today's tills with status indicators |
| `TillDetailPanel` | Right column: orders, add-order, payments, notifications |
| `TillAddOrderForm` | Inline product search and order creation form |
| `TillOrderCard` | Individual order card with status actions |
| `TillPaymentPanel` | Payment method selection and processing |
| `TillReceiptPreview` | Modal receipt displayed after till close |

---

## 8. POS Business Logic

### 8.1 Product Catalog Display

Products are shown in a grid. Filters:
- Only products with `stock > 0` are shown.
- **Category dropdown** filters by category (`"All"` + dynamic category list from products).
- Search matches on product **name**, product **ID**, or **barcode** (not SKU).
- **Reorder indicator:** Products with `stock < (product.reorder || 30)` show a ⚠ warning icon with stock count.

### 8.2 Cart Operations

| Action | Behavior |
|---|---|
| Add product | If already in cart: increment qty only if `existing.qty < product.stock`. Otherwise: add with qty=1. |
| Increment qty | `newQty = qty + delta`. If `newQty > product.stock` or `newQty < 1`: **silently rejected** (item unchanged, no toast/warning). |
| Decrement qty | `newQty = qty + delta`. If `newQty < 1`: item unchanged. |
| Remove from cart | Removes the line item by ID. No confirmation dialog. |
| New Sale (reset) | `resetAll()` clears **cart, payment method, amount tendered, card fields, MoMo fields, discount value/type, splits, and customer** — all state at once. |

### 8.3 Customer Assignment

**Default:** `posCustomer` state starts as `null` → sale defaults to "Walk-in".

**Customer selection methods:**

1. **Search & Select modal:**
   - Opens via "Assign Customer" button.
   - Search filters by customer name (case-insensitive).
   - Each row shows: name, phone, type, loyalty points.
   - **Loyalty indicator:** Customers with > 100 loyalty points display a ⭐ star icon.
   - Click to assign.

2. **Quick Add Customer modal:**
   - Fields: Customer Name (required), Phone (required).
   - Auto-generates ID: `CUS-{padded sequence}`.
   - Sets type to `"walk-in"`, loyalty points to 0.
   - Customer is immediately assigned to the current sale.

3. **Post-payment customer reassignment** (on receipt screen):
   - User can change or unassign the customer **after** the sale is completed.
   - When switching customer:
     - Old customer stats reversed: `totalSpent -= sale.total`, `visits -= 1`, `loyaltyPts -= Math.floor(sale.total / 10)` — all clamped to `Math.max(0, …)`.
     - New customer stats applied: `totalSpent += sale.total`, `visits += 1`, `loyaltyPts += Math.floor(sale.total / 10)`, `lastVisit = today (ISO)`.
   - Can unassign to "Walk-in" via × button (old customer stats reversed, no new customer applied).
   - Latest `SaleRecord` in `salesHistory` is updated with new customer ID/name.

**Customer stats updated on sale completion:**
- `totalSpent` += sale total
- `visits` += 1
- `lastVisit` = today's date (YYYY-MM-DD)
- `loyaltyPts` += `Math.floor(total / 10)` (1 point per GH₵ 10 spent)

### 8.4 Discount Application

```
roleMaxDiscount = DISCOUNT_ROLE_LIMITS[currentRole] ?? 0

if discountType === 'percent':
  effectivePercent = min(enteredPercent, roleMaxDiscount)
  discountAmount = subtotal * (effectivePercent / 100)

if discountType === 'fixed':
  effectivePercent = (rawDiscountVal / subtotal) * 100
  discountAmount = min(rawDiscountVal, subtotal * (roleMaxDiscount / 100))
  discountAmount = min(discountAmount, subtotal)          // safety: never exceed subtotal
```

- If entered percent exceeds role limit, a **visible warning** is shown: *"Exceeds your role limit (X%) — clamped"*. The discount is clamped but the sale is not blocked.
- For fixed discounts, clamping happens without a visible warning. An extra safety guard ensures `discount ≤ subtotal`.
- A notification is dispatched when any discount is applied: `discountApplied(cashierName, currentRole, effectivePercent, discountAmount, receiptNo)`.
  - For fixed discounts, `effectivePercent = Math.round((discount / subtotal) * 100)`.
- Discounts where `effectivePercent >= 15` trigger a `high` priority notification (with push channel); below 15% triggers `medium` priority (in-app only).

### 8.5 Tax Calculation

```
taxRate = 0.125  (12.5% — labeled "NHIL/VAT" on receipt)
tax = subtotal * taxRate
```

Tax is calculated on the subtotal (before discount). The formula is:
```
total = subtotal + tax - discount
```

### 8.6 Held Orders

**`HeldOrder` interface:**
```
{ id: number,       // Date.now()
  items: CartItem[],
  time: string,      // toLocaleTimeString()
  discountValue: string,
  discountType: 'percent' | 'fixed' }
```

- "Hold" saves the current cart state **and discount state** (value + type) to a list of held orders. Clears cart and discount fields.
- Held orders persist in component state only (lost on page navigation or refresh).
- "Recall" restores a held order's items **and discount value/type** to the active cart. Removes from held list.
- Multiple held orders can exist simultaneously (unlimited).
- Each held order shows: item count, total, hold time.
- **Discard** requires confirmation dialog: *"Discard held order with X item(s)? This cannot be undone."*

### 8.7 Payment Processing

**Cash:**
| Field | Validation |
|---|---|
| Amount Tendered | Required, >= total |

`change = amountTendered - total`

**Quick-tender buttons (up to 4):**
```
values = [
  Math.ceil(total),               // exact to nearest cedis
  Math.ceil(total / 10) * 10,     // round to nearest 10
  Math.ceil(total / 50) * 50,     // round to nearest 50
  Math.ceil(total / 100) * 100,   // round to nearest 100
].filter(v => v >= total)
 .slice(0, 4)
```

**Card:**
| Field | Validation |
|---|---|
| Card Type | Required: `VISA`, `Mastercard`, `Amex`, `UnionPay` |
| Transaction Number | Required, any text |

**Mobile Money (MoMo):**
| Field | Validation |
|---|---|
| Provider | Required: `MTN MoMo`, `TCash`, `ATCash`, `G-Money` |
| Phone Number | Required (whitespace-only is invalid) |
| Reference | Required (whitespace-only is invalid) |

**Split Payment:** (Max plan only, `pos: 'full_split'`)
- Two or more payment entries (max 4), each with its own method and amount.
- Split amounts must sum exactly to total (tolerance: `Math.abs(remaining) < 0.01`).
- Each split entry has its own validation per payment method.
- Remaining amount displayed with visual indicator.

### 8.8 Sale Completion Sequence

1. Validate `canAdd('transactions')` — block if monthly limit reached (calls `showLimitBlock()`).
2. Receipt ID and verify token are **pre-generated** on component mount (not generated at sale time).
   - Receipt ID format: `TXN-YYYYMMDD-NNNN` where `NNNN` is a **random** 4-digit number (`Math.floor(Math.random() * 9999)`, zero-padded) — not a sequential counter.
3. Verify token: 12-character alphanumeric string.
   ```
   VERIFY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
   arr = new Uint8Array(12)
   crypto.getRandomValues(arr)
   token = Array.from(arr, b => VERIFY_CHARS[b % VERIFY_CHARS.length]).join('')
   ```
4. Build `SaleRecord` object with all payment details, items, customer, cashier, and verify token.
5. Prepend to `salesHistory` state array.
6. Register in `verifyStore` via `addVerifiableSale(sale)` for public receipt verification.
7. If discount > 0: dispatch `discountApplied` notification.
8. Update customer if linked:
   - `totalSpent` += sale total
   - `visits` += 1
   - `lastVisit` = today (ISO)
   - `loyaltyPts` += `Math.floor(total / 10)` — **incremental**, not recalculated from totalSpent.
9. Display receipt screen with:
   - QR code linking to `/#/verify/{token}`
   - Full transaction details
   - Print button (browser print dialog)
   - Customer assignment/change controls (see §8.3)
10. On "New Sale": call `resetAll()` to clear all state, then **regenerate** receipt ID and verify token for the next sale.

### 8.9 Receipt Contents

Thermal-style receipt (monospace font, max width constrained). Font specs: shop name 18 px / weight 900 / letter-spacing 2; most text 10 px; total 14 px / weight 900.

| Section | Details |
|---|---|
| Header | Shop name (uppercase), branch name + city (if branch exists), phone |
| Transaction | Receipt number, date/time (DD MMM YYYY HH:MM:SS), cashier name |
| Customer | Customer name + phone (if assigned), or "+ Assign Customer" link (interactive — opens customer search on receipt screen) |
| Items | Column headers: Item \| Qty \| Price \| Amount. Each line: name (ellipsized), qty, unit price, line total |
| Subtotal | Sum of line totals (with item count) |
| Tax | NHIL/VAT (12.5%) — labeled "NHIL/VAT (12.5%)" |
| Discount | Discount amount and type label (if applied) |
| Total | Final total (bold, large) |
| Payment (cash) | Method label, amount tendered, change (if > 0) |
| Payment (card) | Card type, transaction number |
| Payment (MoMo) | Provider label, phone, reference number |
| Payment (split) | Each split entry: method label, amount, method-specific detail |
| Loyalty | Points Earned: `+{Math.floor(total / 10)}`, New Balance: `{loyaltyPts + earned} pts` — shown only if customer assigned |
| QR Code | 80 × 80 px QR linking to `{origin}/#/verify/{token}`. Caption: "Scan to verify · {receiptNo}" |
| Footer | "Thank you! Please visit again." |

### 8.10 Sale Reversal Rules

| Role | `pos_void` Level | Behavior |
|---|---|---|
| Owner | `full` | Direct reversal — immediate |
| General Manager | `full` | Direct reversal — immediate |
| Manager | `full` | Direct reversal — immediate |
| Salesperson | `partial` | Request reversal — creates `pending_reversal`, notifies managers |
| Cashier | `none` | Cannot reverse |
| All others | `none` | Cannot reverse |

**Direct reversal flow (`canApproveReversal = true`):**
1. Click "Reverse" → modal opens with sale details.
2. Enter reason (required text).
3. Confirm → `executeReversal()` runs immediately.

**Request reversal flow (`canInitiateReversal = true` but `canApproveReversal = false`):**
1. Click "Request Reversal" → modal with reason.
2. Confirm → sale status → `pending_reversal`, sets `reversalReason`, `reversalRequestedBy`, `reversalRequestedAt`.
3. `reversalRequested()` notification dispatched to managers/owners.

**Approve pending reversal (manager/owner):**
- Click "Approve" on a pending reversal → calls `executeReversal(saleId, reason, approverRole)`.
- `reversalApproved()` notification dispatched.

**Reject pending reversal (manager/owner):**
- Click "Reject" → sale status returns to `'completed'`.
- All reversal fields cleared (`reversalReason`, `reversalRequestedBy`, `reversalRequestedAt`).
- `reversalRejected()` notification dispatched.

**Reversal side effects (on `executeReversal`):**
- Sale status → `reversed`, `reversedAt` set, `reversedBy` set.
- Customer `totalSpent` decremented: `Math.max(0, totalSpent - sale.total)`
- Customer `visits` decremented: `Math.max(0, visits - 1)`
- Customer `loyaltyPts` decremented: `Math.max(0, loyaltyPts - Math.floor(sale.total / 10))` — **subtraction**, not recalculated from totalSpent. All decrements clamped to `Math.max(0, …)` to prevent negative values.
- Notification dispatched (`reversalDirect` or `reversalApproved`)

**Note (known gap):** Product stock is NOT currently restored on reversal. This should be implemented when the backend is built.

---

## 9. Inventory Business Logic

### 9.1 Batch Tracking (FEFO)

**FEFO = First Expiry, First Out.** Batches with the nearest expiry date are consumed first.

**Batch utility functions** (`utils/batchUtils.ts`):

| Function | Purpose |
|---|---|
| `generateBatchId()` | Returns `BT-{counter}` (3-digit padded). Global counter starts at 100, incremented per call. |
| `computeBatchStatus(batch)` | `qty <= 0 → 'depleted'`; expired date → `'expired'`; else `'active'` |
| `computeStockFromBatches(batches)` | `batches.reduce((sum, b) => sum + b.quantity, 0)` — sums **all** batches (including expired/depleted) |
| `computeEarliestExpiry(batches)` | Filters to `quantity > 0 && expiryDate exists`, sorts ascending, returns first (or `undefined`) |
| `sortBatchesFEFO(batches)` | See sort rules below |
| `updateProductFromBatches(product)` | Recomputes stock, expiry, status, batch statuses (see below) |
| `isBatchTracked(product)` | `batchTracking === true && Array.isArray(batches) && batches.length > 0` |
| `createBatch(productId, input, receivedDate)` | Creates `Batch` with auto-ID, `initialQuantity = quantity`, default location `'Main Store'`, then recomputes status |
| `generateLotNumber(index)` | Returns `LOT-{YEAR}-{INDEX}` (index padded to 4 digits) |

**Batch sorting (`sortBatchesFEFO`):**
1. **Primary sort — 3-tier status order:** `active` (0) → `expired` (1) → `depleted` (2).
2. **Secondary sort — within same status tier:** by `expiryDate` ascending (soonest first).
3. **Tertiary:** Batches WITH an expiry date sort before batches WITHOUT an expiry date (within same status tier).

```
statusOrder = { active: 0, expired: 1, depleted: 2 }
sort by statusOrder[a.status] - statusOrder[b.status]
then by a.expiryDate vs b.expiryDate ascending
then: has-expiry before no-expiry
```

**Product stock from batches (`updateProductFromBatches`):**
```
1. Recompute each batch.status via computeBatchStatus()
2. stock = sum of ALL batch quantities (including expired/depleted)
3. expiryDate = earliest expiry among batches where quantity > 0 AND expiryDate exists
   (Note: filters by quantity > 0, NOT by status === 'active' — an expired batch
    with remaining stock IS included in this computation)
4. status:
   if stock <= 0            → 'out_of_stock'
   else if stock <= reorder → 'low_stock'
   else                     → 'in_stock'
5. Returns: { stock, expiryDate, status, batches: updatedBatches, batchTracking: true }
```

**`createBatch()` parameters:**
```
input: {
  batchNumber: string,      // user-provided or auto-generated via generateLotNumber()
  quantity: number,          // units received
  expiryDate?: string,       // optional ISO date
  condition?: string,        // e.g. 'good', 'damaged', 'short_ship'
  notes?: string,
  sourcePoId?: string,       // PO reference (only set when receiving on a PO)
  location?: string,         // defaults to 'Main Store'
}
```

### 9.2 Expiry Classification

**Days calculation** (`getDaysUntilExpiry` in `utils/formatters.ts`):
```
today.setHours(0, 0, 0, 0)
expiry = new Date(expiryDate + 'T00:00:00')
days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
```

**Status classification** (`getExpiryStatus`):

| Status | Condition |
|---|---|
| `expired` | `days < 0` |
| `expiring_soon` | `0 ≤ days ≤ 30` |
| `fresh` | `days > 30` |
| `no_expiry` | `expiryDate` is null/undefined |

**Display labels** (`getExpiryLabel`):

| Condition | Label | Color |
|---|---|---|
| No date | `"No expiry"` | gray |
| `days < 0` | `"Expired {abs(days)} day(s) ago"` | red |
| `days === 0` | `"Expires today"` | amber |
| `days === 1` | `"Expires tomorrow"` | amber |
| `2 ≤ days ≤ 30` | `"Expires in {days} day(s)"` | amber |
| `31 ≤ days ≤ 90` | `"Expires in {floor(days/7)} weeks"` | green |
| `days > 90` | `"Expires in {floor(days/30)} months"` | green |

### 9.3 Goods Receiving Flow

When receiving stock (via `ReceiveOrdersPage` or `PODetailPage`):

**Path A — Batch-tracked products** (batchNumber provided OR `product.batchTracking === true`):

1. User selects products and enters received quantities.
2. User provides per-item details:
   - Batch number (auto-generated via `generateLotNumber()` if blank: `LOT-YYYY-NNNN`)
   - Quantity
   - Expiry date (optional)
   - Condition: `good` | `damaged` | `short_ship` (optional)
   - Notes (optional)
3. **Single batch mode:** One batch created per item via `createBatch()`.
4. **Split batch mode:** Multiple sub-rows per item, each creating an individual batch. Only rows with `quantity > 0` are processed.
5. New batches are appended to `product.batches`.
6. System calls `updateProductFromBatches()` which recomputes stock, expiry, status, and batch statuses.
7. Product record is updated in state.

**Path B — Non-batch-tracked products:**

1. Direct stock increase: `product.stock += quantity`.
2. Expiry date updated **only if** the new date is earlier than the existing product expiry.
3. Product status recalculated based on new stock vs. reorder level.
4. No batch record is created.

**Note:** On `ReceiveOrdersPage`, `sourcePoId` is **NOT** set (no PO linkage). When receiving on `PODetailPage`, `sourcePoId` is set to the PO ID.

### 9.4 Stock Adjustment Processing

1. User creates adjustment with product, type, qty, date, batch (if batch-tracked), and reason.
2. Adjustment types: `damage`, `recount`, `expired`, `theft`, `return`.

**Known gap — Approval workflow:** The spec intended the following flow, but it is **not fully wired in the UI**:
- If user is manager/owner: status = `approved`, stock updated immediately.
- If user is lower role: status = `pending`, requires manager/owner approval.
- On approval: stock adjusted. On rejection: no change.

The status field types exist (`'approved' | 'pending' | 'rejected'`) but the conditional approval/pending flow is not implemented in the current frontend. Adjustments are created but the approval gate is a placeholder.

### 9.5 Stock Transfer Processing

1. User creates transfer with product, qty, source, destination, and notes.
2. Validation: qty must be > 0 and <= available stock at source. Source and destination must differ (inline alert if same).
3. Transfer starts as **`pending`** (not `in_transit`).
4. Status flow: `pending` → `in_transit` → `completed` or `cancelled`.
5. On completion: stock is moved from source to destination.
6. On cancellation: no stock change (stock remains at source).

### 9.6 Known Gaps — Inventory

| Gap | Description |
|---|---|
| **POS stock deduction** | The POS page does **not** reduce product stock on sale completion. Stock quantities remain unchanged after a sale. Must be implemented in the backend. |
| **FEFO batch consumption** | No batch-specific allocation or consumption during POS sales. When a batch-tracked product is sold, no individual batch quantity is decremented. |
| **Stock restoration on reversal** | Product stock is not restored when a sale is reversed (documented in §8.10). |
| **Adjustment approval workflow** | Pending/approve/reject flow is not wired in the UI (documented in §9.4). |

---

## 10. Purchase Order Workflow

### 10.1 Status Lifecycle

```
                                    ┌──► received (all items fully received)
                                    │
draft ──► pending ──► approved ─────┼──► partial ──► received (remaining items received)
  │          │           │          │
  │          │           │          └──► (shipped)* ──► received / partial
  │          │           │
  └──────────┴───────────────────────────► cancelled
```

*`shipped` is a valid status in the type system and appears in the timeline visualization, but there is **no UI action** to transition a PO to `shipped`. See §10.4 Known Gaps.*

**Key:** Receiving goods is available from `approved`, `shipped`, and `partial` statuses — `shipped` is **not** a mandatory step before receiving.

### 10.2 Status Transitions & Required Permissions

**Implemented transitions (buttons exist in UI):**

| From | To | Action | UI Button | Permission |
|---|---|---|---|---|
| `pending` | `approved` | Approve | "Approve" (success variant) | `po_approve` |
| `approved` | `received` | Receive All | "Receive Goods" | `po_approve` |
| `approved` | `partial` | Receive Some | "Receive Goods" | `po_approve` |
| `shipped` | `received` | Receive All | "Receive Goods" | `po_approve` |
| `shipped` | `partial` | Receive Some | "Receive Goods" | `po_approve` |
| `partial` | `received` | Receive Remaining | "Receive Goods" | `po_approve` |
| `draft` | `cancelled` | Cancel | "Cancel" (danger variant) | — |
| `pending` | `cancelled` | Reject / Cancel | "Cancel" (danger variant) | — |

**Button availability rules (from code):**
```
canReceive = ["approved", "shipped", "partial"].includes(po.status)
canApprove = po.status === "pending"
canCancel  = ["draft", "pending"].includes(po.status)
```

### 10.3 Goods Receiving on PO

When receiving goods on a PO:

1. User enters `receivingQty` for each line item. Pre-filled as `item.qty - (item.receivedQty || 0)`.
2. Validation: `0 ≤ receivingQty ≤ (item.qty - previouslyReceivedQty)`. Confirm button disabled if all items have 0 receiving qty.
3. For each item, `newReceivedQty = previousReceivedQty + receivingQty`.
4. Status determination: if **all** items have `receivedQty >= qty` → `received`; else → `partial`. `receivedDate` set to today (ISO).

**Path A — Batch-tracked products** (batch number provided OR `product.batchTracking === true`):

5a. **Single batch mode:** Creates one batch via `createBatch()` with:
   - `sourcePoId = po.id`
   - `location = po.location`
   - `batchNumber`: user-provided or auto-generated via `generateLotNumber()`
   - `quantity = receivingQty`
   - `expiryDate`, `condition` (`good` | `damaged` | `short_ship`), `notes`
6a. **Multiple batch mode:** Each sub-row creates an individual batch (same parameters). Only rows with `quantity > 0` are processed.
7a. New batches appended to `product.batches`. Calls `updateProductFromBatches()` to recompute stock/expiry/status.

**Path B — Non-batch-tracked products:**

5b. Direct stock increase: `product.stock += receivingQty`.
6b. Status recalculated: `stock <= 0 → 'out_of_stock'`, `stock <= reorder → 'low_stock'`, else `'in_stock'`.
7b. Expiry date updated **only if** incoming date is earlier than current product expiry.

**Both paths:** Product `lastUpdated` set to today.

### 10.4 Payment Terms

The `paymentTerms` field on a PO uses the following enum (`PaymentTerms` type in `order.types.ts`):

| Value | Display Label |
|---|---|
| `cod` | Cash on Delivery |
| `net15` | Net 15 Days |
| `net30` | Net 30 Days |
| `net60` | Net 60 Days |

### 10.5 Known Gaps — Purchase Orders

| Gap | Description |
|---|---|
| **`draft → pending` transition** | No "Submit for Approval" button exists. For `draft` POs, only Cancel is available. The `draft → pending` transition is not implemented in the UI. |
| **`approved → shipped` transition** | No "Mark as Shipped" button exists. The `shipped` status is valid in the type system and appears in the timeline, but there is no UI action to set it. Goods can be received directly from `approved`. |
| **Cancel from approved/shipped/partial** | Cancel is only available from `draft` and `pending` (`canCancel = ["draft", "pending"]`). POs that are `approved`, `shipped`, or `partial` cannot be cancelled through the UI. |

---

## 11. Notification System

### 11.1 Type System

**Priority levels** — `NotificationPriority = 'low' | 'medium' | 'high' | 'critical'`

**Channels** — `NotificationChannel = 'in_app' | 'push' | 'email' | 'sms'`

**Target types** — `NotificationTargetType = 'role' | 'individual' | 'role_and_individual'`

### 11.2 Notification Categories

| Category | Description | Default Channels | Default Enabled |
|---|---|---|---|
| `stock_alert` | Low stock, out of stock, expiry warnings | in_app, push | true |
| `order_update` | PO status changes, delivery updates | in_app | true |
| `sale_event` | Large sales, discounts applied, reversals | in_app | true |
| `approval_request` | Reversal requests requiring manager action | in_app, push | true |
| `team_update` | New member joined, role changes | in_app | true |
| `system` | Platform updates, plan limits, maintenance | in_app, email | true |
| `customer` | New customer registered, loyalty milestones | in_app | true |

### 11.3 AppNotification Data Model

Each notification is stored as an `AppNotification` with 15 fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Auto-generated: `NTF-{Date.now()}-{random 0-9999}` |
| `title` | `string` | Yes | Short headline displayed in notification list |
| `message` | `string` | Yes | Full notification body |
| `category` | `NotificationCategory` | Yes | One of 7 categories (§11.2) |
| `priority` | `NotificationPriority` | Yes | `'low'` \| `'medium'` \| `'high'` \| `'critical'` |
| `channels` | `NotificationChannel[]` | Yes | Delivery channels for this notification |
| `target` | `NotificationTarget` | Yes | `{ type, roles?, userId? }` — determines visibility |
| `read` | `boolean` | Yes | Initially `false`, set by `markAsRead` |
| `createdAt` | `string` | Yes | ISO 8601 timestamp, set on creation |
| `actionUrl` | `string` | No | Route path to navigate to when notification is clicked |
| `actionData` | `Record<string, string>` | No | Context data (e.g., `{ saleId: "TXN-..." }`) |
| `actor` | `string` | No | Name of user who triggered the event |
| `actorRole` | `string` | No | Role of triggering user |
| `requiresAction` | `boolean` | No | If `true`, notification needs approval/acknowledgement |
| `actionTaken` | `'approved' \| 'rejected' \| 'acknowledged'` | No | Set when action is taken on the notification |

### 11.4 Automatic Notification Triggers (Dispatch Functions)

Five dispatch helper functions are provided via `useNotifications().dispatch`:

#### `discountApplied(actor, actorRole, percent, amount, saleId)`
| Field | Value |
|---|---|
| **Title** | `Discount Applied — {percent}%` |
| **Category** | `sale_event` |
| **Priority** | `'medium'` (or `'high'` if `percent >= 15`) |
| **Channels** | `['in_app']` (or `['in_app', 'push']` if `percent >= 15`) |
| **Target** | `{ type: 'role', roles: ['owner', 'general_manager', 'manager'] }` |
| **Action** | `actionUrl: 'sales'`, `actionData: { saleId }` |

#### `reversalRequested(actor, actorRole, saleId, total, reason)`
| Field | Value |
|---|---|
| **Title** | `Reversal Approval Needed` |
| **Category** | `approval_request` |
| **Priority** | `'high'` |
| **Channels** | `['in_app', 'push']` |
| **Target** | `{ type: 'role', roles: ['owner', 'general_manager', 'manager'] }` |
| **Action** | `actionUrl: 'sales'`, `actionData: { saleId }`, `requiresAction: true` |

#### `reversalApproved(actor, actorRole, saleId, requestedBy)`
| Field | Value |
|---|---|
| **Title** | `Reversal Approved` |
| **Category** | `sale_event` |
| **Priority** | `'medium'` |
| **Channels** | `['in_app']` |
| **Target** | `{ type: 'role_and_individual', roles: ['owner', 'general_manager'], userId: requestedBy }` |
| **Action** | `actionUrl: 'sales'`, `actionData: { saleId }` |

#### `reversalRejected(actor, actorRole, saleId, requestedBy)`
| Field | Value |
|---|---|
| **Title** | `Reversal Rejected` |
| **Category** | `sale_event` |
| **Priority** | `'medium'` |
| **Channels** | `['in_app']` |
| **Target** | `{ type: 'role_and_individual', roles: ['owner', 'general_manager'], userId: requestedBy }` |
| **Action** | `actionUrl: 'sales'`, `actionData: { saleId }` |

#### `reversalDirect(actor, actorRole, saleId, total, reason)`
| Field | Value |
|---|---|
| **Title** | `Sale Reversed` |
| **Category** | `sale_event` |
| **Priority** | `'high'` |
| **Channels** | `['in_app', 'push']` |
| **Target** | `{ type: 'role', roles: ['owner', 'general_manager', 'manager'] }` |
| **Action** | `actionUrl: 'sales'`, `actionData: { saleId }` |

### 11.5 Management Functions

The `useNotifications()` hook exposes the following state and operations:

| Function / Property | Signature | Description |
|---|---|---|
| `notifications` | `AppNotification[]` | Role-filtered list of notifications visible to current user |
| `unreadCount` | `number` | Count of `read === false` in filtered list |
| `addNotification` | `(n: Omit<AppNotification, 'id' \| 'createdAt' \| 'read'>) → void` | Creates notification with auto-generated ID and timestamp, `read = false` |
| `markAsRead` | `(id: string) → void` | Sets `read: true` for the specified notification |
| `markAllRead` | `() → void` | Sets `read: true` for ALL notifications |
| `deleteNotification` | `(id: string) → void` | Removes notification from state entirely |
| `preferences` | `NotificationPreferences` | Current user preference object |
| `updatePreferences` | `(prefs: Partial<NotificationPreferences>) → void` | Shallow-merge update to preferences |
| `updateCategoryPref` | `(category, enabled, channels) → void` | Update a single category's `enabled` flag and `channels` array |
| `dispatch` | `{ discountApplied, reversalRequested, reversalApproved, reversalRejected, reversalDirect }` | Pre-built dispatch helpers (§11.4) |

### 11.6 Role-Based Filtering

Notifications are filtered by the `target` field against `currentRole`:
- `type: 'role'` → shown only to users whose role is in `target.roles[]`.
- `type: 'individual'` → **demo-simplified**: shown to ALL users regardless of `target.userId`. In production, this would filter by the authenticated user's ID.
- `type: 'role_and_individual'` → shown if role matches OR user matches. **Demo**: always returns `true` for the individual check.

> **Known gap**: Individual-targeted notifications (e.g., "your reversal was approved") are visible to everyone in the demo. A backend `userId` check is needed for production.

### 11.7 Notification Preferences

Users can configure per-category preferences. Each category has an **`enabled`** toggle and a **`channels`** array:

```
NotificationCategoryPref = { enabled: boolean; channels: NotificationChannel[] }

NotificationPreferences = {
  categories: Record<NotificationCategory, NotificationCategoryPref>,
  quietHoursEnabled: boolean,   // default: false
  quietHoursStart: string,      // default: '22:00'
  quietHoursEnd: string,        // default: '07:00'
}
```

**Default preference values:**
| Category | Enabled | Channels |
|---|---|---|
| `stock_alert` | `true` | `['in_app', 'push']` |
| `order_update` | `true` | `['in_app']` |
| `sale_event` | `true` | `['in_app']` |
| `approval_request` | `true` | `['in_app', 'push']` |
| `team_update` | `true` | `['in_app']` |
| `system` | `true` | `['in_app', 'email']` |
| `customer` | `true` | `['in_app']` |

### 11.8 Quiet Hours

Configurable per-user:
- `quietHoursStart` (default: `22:00`)
- `quietHoursEnd` (default: `07:00`)
- `quietHoursEnabled` — **default: `false`** (disabled by default)

> **Known gap**: Quiet hours infrastructure (preferences, UI toggle) exists, but suppression logic is **not enforced**. All notifications are delivered regardless of quiet hours settings. The `quietHoursEnabled`, `quietHoursStart`, and `quietHoursEnd` fields are stored in preferences but never consulted during dispatch.

### 11.9 Known Gaps

| Gap | Detail |
|---|---|
| **Quiet hours suppression** | Preferences are stored but never enforced. All channels deliver at all times. |
| **Individual targeting** | Demo mode shows all `individual`-type notifications to every user. No `userId` filtering is implemented. |
| **Channel delivery** | Only `in_app` channel is actually implemented. `push`, `email`, and `sms` channels are stored in preferences and notification objects but have no delivery mechanism. |
| **`critical` priority** | Defined in the type system (`NotificationPriority`) but not used by any dispatch function. No special handling for critical-priority notifications. |
| **Notification persistence** | All notifications are held in Pinia store state only. They reset on page refresh. |

---

## 12. Admin Portal

### 12.1 Admin Authentication

- **Demo-only implementation** — hardcoded credentials, no real authentication.
- Pre-filled login form: email `admin@shopchain.com`, password `admin123`.
- 6-digit 2FA code input (6 individual single-digit boxes). **Not validated** — any 6-digit code is accepted (defaults to `123456`).
- Separate auth flow from shop user login. `AuthScreen` type includes `'adminLogin'` and `'adminDashboard'` states.
- Accessed via "Admin Portal" link at the bottom of the login screen.
- "← Back to User Login" link returns to the shop login screen.

### 12.2 Admin Dashboard Layout

- **Sidebar** (220px desktop / 240px mobile overlay) — brand header ("ShopChain Admin Portal" with shield icon), 10 navigation items, theme toggle (Dark/Light pills), "Exit Admin" button.
- **Header** (56px height) — page title, mobile hamburger menu toggle.
- **Content area** — lazy-loaded tab components with loading spinner fallback.
- **Admin theme system** — `ADMIN_THEMES` object with dark and light color maps (11 tokens each: `bg`, `surface`, `surfaceAlt`, `border`, `text`, `textMuted`, `primary`, `success`, `danger`, `adminAccent`, plus card/hover variants).
- **Responsive**: Desktop shows permanent sidebar; mobile shows overlay sidebar with backdrop.

### 12.3 Admin Dashboard Tabs (10 Tabs)

#### Overview

**6 KPI cards:**
| KPI | Source |
|---|---|
| Total Users | Count of `ADMIN_DEMO_USERS` |
| Active Users | Filtered by `status === 'active'`, shows percentage |
| Total Shops | Count of `ADMIN_DEMO_SHOPS` |
| Active Shops | Filtered by `status === 'active'`, shows percentage |
| MRR | Sum of `PLAN_TIERS[user.plan].price` for active users |
| New Signups | Users with `joined >= '2026-02-01'` |

**Sections:**
- **Plan Distribution** — cards showing user count and percentage per plan tier (Free / Basic / Max).
- **Revenue Breakdown** — horizontal bar chart showing MRR split by plan tier with percentages.
- **User Growth Chart** — 12-month SVG line chart with gradient fill (from `INV_USER_GROWTH`).
- **Revenue Trend Chart** — 12-month SVG line chart with gradient fill (from `FIN_REVENUE`).
- **Recent Activity Feed** — last 8 audit log entries with risk-level badges and timestamps.

#### Users

- **List view**: Search box (by name/email), status filter dropdown (`all` | `active` | `deactivated` | `pending`), user rows with avatar, name, email, plan badge, status badge.
- **Detail view**:
  - Header: avatar, name, email, plan badge, status badge.
  - Info grid: Phone, City, Joined, Last Active.
  - Subscription section: current plan display.
  - Payment Methods table: Type (MoMo/Card), Provider, Last 4, Default indicator, Status badge.
  - Payment History table: Date, Amount, Plan, Method, Status, Transaction Ref, Notes.
  - Usage Stats: 6 progress bars (Products, Transactions, Storage MB, Team, Shops, Branches) — color-coded: red ≥85%, orange ≥60%, green <60%.
  - Action: Toggle user status (Deactivate / Reactivate).

#### Shops

- **List view**: Search by shop name/owner, status filter (`all` | `active` | `suspended`), 2-column card grid showing icon, name, owner, type, plan badge, status badge, branch/team counts.
- **Detail view**:
  - Header: icon, name, type.
  - Owner info card: name, email, phone (linked from user data).
  - Info grid: Created, Plan, Branches, Team.
  - Action buttons: "Suspend Shop" (for active) / "Reactivate Shop" (for suspended).

#### Subscriptions (4 sub-tabs)

| Sub-tab | Features |
|---|---|
| **Overview** | KPI cards (MRR, ARPU, Active Subscribers), Plan Breakdown table (Plan \| Users \| Revenue \| % of Total), Payment Exemptions section |
| **Plans** | Active plan cards with user count and MRR. Inline plan editor: limits grid with ±/unlimited controls (Shops, Branches/Shop, Team/Shop, Products/Shop, Monthly Transactions, Storage MB, Suppliers, Warehouses). Lifecycle management buttons (`draft` → `scheduled` → `active` → `retiring` → `retired`) with date pickers for scheduled/retiring states, grandfather/migrate choice, migration target plan selector. New Plan modal (name, price, color, icon from 40-emoji picker, initial status). |
| **User Subs** | User search/list, selected user shows: current plan, payment methods, payment history, 6 resource usage bars. Plan upgrade dropdown. "Grant Exemption" button → modal form (period, unit, unlimited toggle, reason). |
| **Usage** | Grid showing all users with 6 usage metric progress bars per user. |

See §5.5 for full subscription plan details.

#### Finances (6 sub-tabs)

| Sub-tab | Features |
|---|---|
| **Dashboard** | KPI cards (Total Revenue, Total Expenses, Net Income, Runway in months) with MoM growth stats. Revenue vs Expenses bar chart. Monthly Summary table (Month, Revenue, Expenses, Net, Margin). |
| **Revenue** | Revenue by plan cards. Payment method breakdown (MoMo/Card fees). Transaction Ledger table (Month, Subscriptions, Signups, Failed, Refunds). |
| **Expenses** | 8 category summary cards (`infrastructure`, `paymentFees`, `sms`, `staff`, `marketing`, `software`, `office`, `compliance`). Expense Items table (Date, Category, Description, Vendor, Amount, Recurring badge, Ref, Delete). Add/Edit Expense modal (Category dropdown, Date, Amount, Description, Vendor, Reference, Recurring checkbox). |
| **Cash Flow** | Operating/Investing/Financing cash flow statements. Cash Flow Waterfall visualization. Cash Runway meter. |
| **Projections** | Adjustable parameters (growth rate, churn rate, expense growth sliders). KPI cards (Current MRR, Projected MRR 12mo, Projected Annual Revenue, Projected Runway). MRR Growth Trajectory bar chart. |
| **Reports** | Available Report Types cards. Scheduled Reports table (Report, Frequency, Recipient, Next Run, Enabled). P&L Statement with line items: Revenue (Subscription Revenue, Failed Transactions, Refunds), Cost of Operations (8 expense categories), Taxes (Corporate 25%, NHIL 2.5%, GETFund 2.5%, COVID Levy 1%, VAT 15%) with Startup Rebate toggle. |

#### Investors (4 sub-tabs)

| Sub-tab | Features |
|---|---|
| **Metrics** | KPI cards (DAU, WAU, MAU, DAU/MAU Ratio %). Engagement Trend chart (12-month). Conversion Funnel (Visits → Signups → Activated → Paid with conversion rates). |
| **Growth** | 6 KPI cards (Total Users, Active Users, New This Month, Churned, Monthly Churn Rate %, Net Growth). Growth Trajectory chart. Cohort Retention table (12-month grid with color-coded retention %). Churn Analysis. |
| **Users & Shops** | User Statistics card with plan distribution bar (Free/Basic/Max). Shop Statistics card with type distribution bar (Retail/Wholesale/Restaurant/Pharmacy/Other). Platform Depth metrics. MiniChart SVG components for growth trends. |
| **Deck** | Company snapshot card. Key Metrics Summary table (12 rows: DAU, MRR, ARPU, Total Users, Total Shops, etc.). Milestones Timeline with add/edit modal (Icon from 8-emoji grid, Date, Title, Description). |

#### Announcements

- **List view**: All announcements with priority-colored bell icon, title, priority badge, status badge (`active` | `draft`), body text, target label, created date.
- **Actions per announcement**: Edit, Publish/Unpublish (toggle status), Delete.
- **Create/Edit modal**: Title (text), Body (textarea), Target (dropdown: All Users / Free / Basic / Max), Priority (dropdown: Info / Warning / Critical).
- **Target type**: `AnnouncementTarget = 'all' | 'free' | 'basic' | 'max'`
- **Priority type**: `AnnouncementPriority = 'info' | 'warning' | 'critical'`
- **Status type**: `AnnouncementStatus = 'active' | 'draft'`

#### Audit & Fraud (5 sub-tabs)

| Sub-tab | Features |
|---|---|
| **Activity Log** | Search box, Category dropdown (`auth` \| `financial` \| `data` \| `admin` \| `system`), Risk Level dropdown, Period pills (24h/7d/30d/90d). Expandable event cards: icon, action, actor, target, timestamp, location, risk badge. Expanded detail: IP, Device, Session ID, Location, Before/After JSON, Risk Score bar, "Flag for Investigation" and "Copy Event ID" actions. |
| **Investigations** | KPI cards (Open, In Progress, Escalated, Closed). Create Case modal (Title, Description, Priority dropdown, Assignee dropdown). Cases table with clickable rows. Case Detail: status dropdown, priority badge, assignee, description, Linked Events, Linked Users, Investigation Notes timeline, Findings textarea, Resolution buttons (No Fraud Found / Fraud Confirmed / Inconclusive). |
| **Anomalies** | Severity KPI cards (Critical, High, Medium, Low counts). Detection Rules cards: rule name, severity badge, description, enable/disable toggle, threshold, trigger count. Recent Anomalies feed: severity badge, rule, timestamp, entity, summary, status badge, actions (Dismiss / Create Case / View Linked Case). |
| **Forensics** | KPI cards (Total Users, Flagged Users, High+ Risk, No 2FA). Filter buttons (all/frontend/admin/flagged), sort buttons (Default/Risk↓/Risk↑), search. User list: avatar, name, email, plan badge, status badge, risk score bar, behavioral flags. User Detail: login history table (Timestamp, IP, Device, Location, Status), Activity Heatmap (24h × 7d grid), Linked Investigations, Risk Breakdown (Auth/Financial/Behavioral/Data Access percentage bars). |
| **Reports** | Case selector dropdown. Report Preview: case summary, priority, assignee, impact, evidence items count, persons of interest count, resolution, findings, investigation timeline. Export buttons (PDF, CSV). |

#### Admin Team

**4 KPI cards**: Total Admins, Active, Invited, Suspended.

**Member list**: Search box, role filter. Table columns: Member (name + email with avatar), Role (badge with icon), Status (Active/Invited/Suspended), 2FA (checkmark/✕), Last Login.

**Member detail view**:
- Header: avatar, name, email, phone, role badge, status badge.
- **Role Assignment**: grid of 5 role tiles with icons and descriptions. Disabled if editing self or last Super Admin.
- **Permission Matrix**: 12 permission rows showing Grant/Deny per role.
- Recent Activity: 3 recent actions with timestamps.
- Action buttons: Save Changes, Suspend/Reactivate, Remove (disabled for protected users — self and last Super Admin).

**Invite Admin modal**: Name, Email, Phone, Role dropdown (Super Admin option disabled), Welcome Message textarea.

**Mock team**: 7 admin members (not 5) — see §12.6 for data.

#### Settings

- **Admin Profile**: displays current admin (Jude Appiah, Super Admin, email).
- **Appearance**: Theme toggle buttons (Dark / Light) with sun/moon icons.
- **Platform Settings**: 5 toggle switches with icons and descriptions:
  - Maintenance Mode
  - Open Registrations
  - Free Trial
  - Force 2FA
  - Email Notifications
- **Danger Zone**: 2 red action buttons — "Clear All Cache", "Reset Platform Settings".

### 12.4 Admin Role System

**5 admin roles** with 12 permissions each (`AdminRoleId` type):

| Role | Label | Icon | Color | Description |
|---|---|---|---|---|
| `super_admin` | Super Admin | 👑 | #F59E0B (Amber) | Full unrestricted access to all systems |
| `admin` | Admin | 🛡️ | #8B5CF6 (Purple) | Full access except Super Admin management and system config |
| `billing_manager` | Billing Manager | 💰 | #059669 (Green) | Financial operations, subscriptions, and plan management |
| `support_agent` | Support Agent | 🎧 | #3B82F6 (Blue) | User support, account management, and announcements |
| `auditor` | Auditor | 🔍 | #6B7280 (Gray) | Read-only access for compliance and oversight |

**Permission matrix** (12 permissions):

| Permission | Super Admin | Admin | Billing Mgr | Support Agent | Auditor |
|---|---|---|---|---|---|
| Manage Admins | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Super Admins | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Shops | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage Plans | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Plans | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Billing | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Payments | ✅ | ✅ | ✅ | ❌ | ✅ |
| Grant Exemptions | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Announcements | ✅ | ✅ | ❌ | ✅ | ❌ |
| View Audit Log | ✅ | ✅ | ❌ | ❌ | ✅ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

### 12.5 Admin Data Models

**AdminUserRecord:**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | User ID |
| `name` | `string` | Full name |
| `email` | `string` | Email |
| `phone` | `string` | Phone |
| `status` | `AdminUserStatus` | `'active'` \| `'deactivated'` \| `'pending'` \| `'suspended'` |
| `plan` | `PlanId` | Current subscription plan |
| `shops` | `number` | Number of shops owned |
| `branches` | `number` | Total branches across shops |
| `joined` | `string` | Registration date |
| `lastActive` | `string` | Last activity timestamp |
| `avatar` | `string` | Initials |

**AdminShopRecord:**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Shop ID |
| `name` | `string` | Shop name |
| `type` | `string` | Business type |
| `owner` | `string` | Owner name |
| `ownerEmail` | `string` | Owner email |
| `plan` | `PlanId` | Shop's plan |
| `branches` | `number` | Branch count |
| `team` | `number` | Team member count |
| `status` | `AdminShopStatus` | `'active'` \| `'suspended'` |
| `created` | `string` | Creation date |
| `icon` | `string` | Shop emoji |

**AdminTeamMember:**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Admin member ID |
| `name` | `string` | Full name |
| `email` | `string` | Email |
| `phone` | `string` | Phone |
| `role` | `AdminRoleId` | One of 5 admin roles |
| `status` | `AdminTeamStatus` | `'active'` \| `'invited'` \| `'suspended'` |
| `twoFA` | `boolean` | Whether 2FA is enabled |
| `lastLogin` | `string \| null` | Last login timestamp |
| `avatar` | `string` | Initials |
| `joined` | `string` | (optional) Join date |
| `createdBy` | `string` | (optional) Who created this member |
| `createdAt` | `string` | (optional) Creation timestamp |

**AdminPlan (extends PlanTier):**
| Field | Type | Description |
|---|---|---|
| `lifecycle` | `PlanLifecycle` | `'draft'` \| `'scheduled'` \| `'active'` \| `'retiring'` \| `'retired'` |
| `availableFrom` | `string \| null` | Date plan becomes available (for `scheduled`) |
| `retireAt` | `string \| null` | Date to stop new signups (for `retiring`) |
| `migrateAt` | `string \| null` | Date to migrate existing subscribers |
| `fallbackPlanId` | `PlanId \| null` | Target plan for migration |
| `grandfathered` | `boolean` | Whether existing subscribers are grandfathered |

**AdminAnnouncement:**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Announcement ID |
| `title` | `string` | Title |
| `body` | `string` | Body text |
| `target` | `AnnouncementTarget` | `'all'` \| `'free'` \| `'basic'` \| `'max'` |
| `priority` | `AnnouncementPriority` | `'info'` \| `'warning'` \| `'critical'` |
| `status` | `AnnouncementStatus` | `'active'` \| `'draft'` |
| `created` | `string` | Creation date |

**AuditEvent:**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Event ID |
| `ts` | `string` | Timestamp |
| `actor` | `string` | Who performed the action |
| `actorId` | `string \| null` | Actor's user ID |
| `role` | `string \| null` | Actor's role |
| `cat` | `AuditCategory` | `'auth'` \| `'financial'` \| `'data'` \| `'admin'` \| `'system'` |
| `action` | `string` | Action description |
| `target` | `string` | Target entity |
| `ip` | `string` | IP address |
| `device` | `string` | Device info |
| `session` | `string \| null` | Session ID |
| `location` | `string` | Geographic location |
| `risk` | `number` | Risk score (0–100) |
| `before` | `Record<string, unknown> \| null` | State before change |
| `after` | `Record<string, unknown> \| null` | State after change |
| `note` | `string` | Additional notes |

**ExpenseItem:**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Expense ID |
| `date` | `string` | Expense date |
| `category` | `ExpenseCategory` | One of 8 categories |
| `desc` | `string` | Description |
| `amount` | `number` | Amount in GH₵ |
| `vendor` | `string` | Vendor name |
| `recurring` | `boolean` | Whether recurring |
| `ref` | `string` | Reference number |
| `attachments` | `ExpenseAttachment[]` | File attachments |

**Investigation:**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Case ID |
| `title` | `string` | Case title |
| `status` | `InvestigationStatus` | `'open'` \| `'in_progress'` \| `'escalated'` \| `'closed'` |
| `priority` | `RiskLevel` | `'low'` \| `'medium'` \| `'high'` \| `'critical'` |
| `assignee` | `string` | Assigned admin |
| `created` | `string` | Creation date |
| `updated` | `string` | Last update |
| `desc` | `string` | Description |
| `linkedEvents` | `string[]` | Linked audit event IDs |
| `linkedUsers` | `string[]` | Linked user IDs |
| `impact` | `string` | Impact assessment |
| `notes` | `InvestigationNote[]` | Investigation notes (id, author, time, text) |
| `findings` | `string` | Investigation findings |
| `resolution` | `string \| null` | Resolution outcome |

**Anomaly:**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Anomaly ID |
| `rule` | `string` | Detection rule that triggered |
| `severity` | `RiskLevel` | Severity level |
| `entity` | `string` | Affected entity |
| `ts` | `string` | Timestamp |
| `summary` | `string` | Summary text |
| `status` | `AnomalyStatus` | `'escalated'` \| `'reviewing'` \| `'resolved'` \| `'dismissed'` |
| `linkedCase` | `string \| null` | Linked investigation case ID |
| `events` | `string[]` | Related audit event IDs |

**DetectionRule:**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Rule ID |
| `name` | `string` | Rule name |
| `desc` | `string` | Rule description |
| `threshold` | `string` | Threshold condition |
| `severity` | `RiskLevel` | Alert severity |
| `enabled` | `boolean` | Whether rule is active |
| `triggers` | `number` | Number of times triggered |

**GhTaxRates:**
| Field | Type | Value |
|---|---|---|
| `corporateRate` | `number` | 0.25 (25%) |
| `startupRebate` | `number` | 0.10 (10%) |
| `nhil` | `number` | 0.025 (2.5%) |
| `getfl` | `number` | 0.025 (2.5%) |
| `covidLevy` | `number` | 0.01 (1%) |
| `vat` | `number` | 0.15 (15%) |

### 12.6 Mock Admin Team Data

7 admin team members in `MOCK_ADMIN_TEAM`:

| ID | Name | Role | Status | 2FA | Last Login |
|---|---|---|---|---|---|
| adm1 | Jude Appiah | super_admin | active | ✅ | 2026-02-12 10:30 |
| adm2 | Kwame Asante | admin | active | ✅ | 2026-02-12 08:45 |
| adm3 | Efua Mensah | billing_manager | active | ❌ | 2026-02-11 16:20 |
| adm4 | Yaw Boakye | support_agent | active | ✅ | 2026-02-12 09:15 |
| adm5 | Ama Darko | support_agent | suspended | ❌ | 2026-01-28 11:00 |
| adm6 | Kofi Tetteh | auditor | active | ✅ | 2026-02-10 14:30 |
| adm7 | Abena Osei | billing_manager | invited | ❌ | — |

### 12.7 Known Gaps

| Gap | Detail |
|---|---|
| **Permission enforcement** | Admin roles and permissions are defined but **not enforced** in the UI. All admin users see all 10 tabs and can perform all actions regardless of their assigned role. |
| **Demo-only authentication** | Hardcoded credentials (`admin@shopchain.com` / `admin123`). 2FA is UI-only and accepts any input. No real password hashing, session management, or token-based auth. |
| **No data persistence** | All admin data comes from mock constants (`ADMIN_DEMO_USERS`, `ADMIN_DEMO_SHOPS`, `MOCK_ADMIN_TEAM`, etc.). State changes (user status toggles, plan edits, announcements) are held in Pinia store state and reset on page refresh. |
| **No backend API** | No admin API endpoints exist. All operations are client-side simulations. |
| **Expense attachments** | `ExpenseAttachment` interface exists in types but attachment upload/view is not implemented in the UI. |
| **PDF/CSV export** | Export buttons exist in Audit Reports tab but no actual file generation is implemented. |

---

## 13. API Endpoints (Planned)

The current implementation is a client-side SPA with no backend. The following API endpoints are needed for a production build. All endpoints return JSON and use standard HTTP status codes.

> **Permission key reference**: Auth columns reference the 33 permission keys defined in `DEFAULT_PERMISSIONS` (see §6). The codebase uses a flat key model (e.g., `pos_void`) — colon-separated sub-permissions (e.g., `pos_void:full`) are proposed enhancements for the API layer and do not exist in the current permission system.

### 13.1 Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create account | Public |
| `POST` | `/api/auth/login` | Login (returns JWT) | Public |
| `POST` | `/api/auth/verify-email` | Verify email with OTP | Public |
| `POST` | `/api/auth/forgot-password` | Send reset email | Public |
| `POST` | `/api/auth/reset-password` | Reset password with token | Public |
| `POST` | `/api/auth/logout` | Invalidate session | Auth |
| `GET` | `/api/auth/sessions` | List active sessions | Auth |
| `DELETE` | `/api/auth/sessions/:id` | End a session | Auth |
| `POST` | `/api/auth/admin/login` | Admin login with 2FA | Public |

### 13.2 Account & Profile

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/account/profile` | Get current user profile | Auth |
| `PATCH` | `/api/account/profile` | Update profile (name, email, phone, avatar) | Auth |
| `POST` | `/api/account/change-password` | Change password (requires current password) | Auth |
| `POST` | `/api/account/2fa/enable` | Enable two-factor authentication | Auth |
| `DELETE` | `/api/account/2fa/disable` | Disable two-factor authentication | Auth |
| `GET` | `/api/account/usage` | Get personal usage stats | Auth |

### 13.3 Shops & Branches

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/shops` | List user's shops | Auth |
| `POST` | `/api/shops` | Create a shop | Auth |
| `GET` | `/api/shops/:id` | Get shop details | Auth + member |
| `PATCH` | `/api/shops/:id` | Update shop settings | Auth + `set_shop` |
| `DELETE` | `/api/shops/:id` | Delete shop | Auth + `set_delete` |
| `GET` | `/api/shops/:id/branches` | List branches | Auth + member |
| `POST` | `/api/shops/:id/branches` | Create branch | Auth + `set_shop` |
| `GET` | `/api/shops/:id/branches/:branchId` | Get branch detail | Auth + member |
| `PATCH` | `/api/shops/:id/branches/:branchId` | Update branch | Auth + `set_shop` |
| `DELETE` | `/api/shops/:id/branches/:branchId` | Delete branch | Auth + `set_shop` |

### 13.4 Products & Batches

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/shops/:shopId/products` | List products (with filters) | Auth + `prod_view` |
| `POST` | `/api/shops/:shopId/products` | Create product | Auth + `prod_edit` |
| `GET` | `/api/shops/:shopId/products/:id` | Get product detail | Auth + `prod_view` |
| `PATCH` | `/api/shops/:shopId/products/:id` | Update product | Auth + `prod_edit` |
| `DELETE` | `/api/shops/:shopId/products/:id` | Delete product | Auth + `prod_delete` |
| `PATCH` | `/api/shops/:shopId/products/:id/price` | Update price | Auth + `prod_price` |
| `GET` | `/api/shops/:shopId/products/:id/batches` | List batches (FEFO sorted) | Auth + `prod_view` |
| `POST` | `/api/shops/:shopId/products/:id/batches` | Create batch (auto-generates batch ID, computes status) | Auth + `prod_edit` |
| `PATCH` | `/api/shops/:shopId/products/:id/batches/:batchId` | Update batch (quantity, expiry, location) | Auth + `prod_edit` |
| `POST` | `/api/shops/:shopId/products/import` | Bulk import products (CSV/Excel) | Auth + `prod_edit` |
| `GET` | `/api/shops/:shopId/products/export` | Export products (CSV/Excel) | Auth + `prod_view` |

### 13.5 Categories & Units

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/shops/:shopId/categories` | List categories | Auth + `cat_view` |
| `POST` | `/api/shops/:shopId/categories` | Create category | Auth + `cat_edit` |
| `PATCH` | `/api/shops/:shopId/categories/:id` | Update category | Auth + `cat_edit` |
| `DELETE` | `/api/shops/:shopId/categories/:id` | Delete category | Auth + `cat_edit` |
| `GET` | `/api/shops/:shopId/units` | List units | Auth + `uom_view` |
| `POST` | `/api/shops/:shopId/units` | Create unit | Auth + `uom_edit` |
| `PATCH` | `/api/shops/:shopId/units/:id` | Update unit | Auth + `uom_edit` |
| `DELETE` | `/api/shops/:shopId/units/:id` | Delete unit | Auth + `uom_edit` |

### 13.6 Sales & POS

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/shops/:shopId/sales` | Create sale | Auth + `pos_sales` |
| `GET` | `/api/shops/:shopId/sales` | List sales (with filters) | Auth + `pos_receipts` |
| `GET` | `/api/shops/:shopId/sales/:id` | Get sale detail | Auth + `pos_receipts` |
| `POST` | `/api/shops/:shopId/sales/:id/reverse` | Direct reversal | Auth + `pos_void` |
| `POST` | `/api/shops/:shopId/sales/:id/request-reversal` | Request reversal | Auth + `pos_void` |
| `POST` | `/api/shops/:shopId/sales/:id/approve-reversal` | Approve reversal | Auth + `pos_void` |
| `POST` | `/api/shops/:shopId/sales/:id/reject-reversal` | Reject reversal | Auth + `pos_void` |
| `GET` | `/api/shops/:shopId/sales/analytics` | Sales analytics | Auth + `dash_view` |
| `GET` | `/api/verify/:token` | Public receipt verification | Public |

> **Note**: The codebase has a single `pos_void` permission key. The API layer may split this into `pos_void:full` (direct reversal, approve/reject) and `pos_void:partial` (request reversal only) for finer-grained control. This split does not exist in the current `DEFAULT_PERMISSIONS`.

#### Held / Parked Sales

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/shops/:shopId/sales/hold` | Park current cart (items, discount state) | Auth + `pos_sales` |
| `GET` | `/api/shops/:shopId/sales/held` | List held orders for current session | Auth + `pos_sales` |
| `POST` | `/api/shops/:shopId/sales/held/:id/recall` | Recall held order back to cart | Auth + `pos_sales` |
| `DELETE` | `/api/shops/:shopId/sales/held/:id` | Discard a held order | Auth + `pos_sales` |

### 13.7 Purchase Orders

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/shops/:shopId/purchase-orders` | List POs | Auth + `po_view` |
| `POST` | `/api/shops/:shopId/purchase-orders` | Create PO | Auth + `po_create` |
| `GET` | `/api/shops/:shopId/purchase-orders/:id` | Get PO detail | Auth + `po_view` |
| `PATCH` | `/api/shops/:shopId/purchase-orders/:id` | Update PO | Auth + `po_create` |
| `POST` | `/api/shops/:shopId/purchase-orders/:id/approve` | Approve PO | Auth + `po_approve` |
| `POST` | `/api/shops/:shopId/purchase-orders/:id/receive` | Receive goods | Auth + `po_approve` |
| `POST` | `/api/shops/:shopId/purchase-orders/:id/cancel` | Cancel PO | Auth + `po_create` |

### 13.8 Inventory Operations

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/shops/:shopId/inventory/receive` | Ad-hoc stock receiving | Auth + `po_approve` |
| `GET` | `/api/shops/:shopId/adjustments` | List adjustments | Auth + `adj_view` |
| `POST` | `/api/shops/:shopId/adjustments` | Create adjustment | Auth + `adj_create` |
| `POST` | `/api/shops/:shopId/adjustments/:id/approve` | Approve adjustment | Auth + `adj_approve` |
| `POST` | `/api/shops/:shopId/adjustments/:id/reject` | Reject adjustment | Auth + `adj_approve` |
| `GET` | `/api/shops/:shopId/transfers` | List transfers | Auth + `xfer_view` |
| `POST` | `/api/shops/:shopId/transfers` | Create transfer | Auth + `xfer_create` |
| `PATCH` | `/api/shops/:shopId/transfers/:id` | Update transfer status | Auth + `xfer_create` |

### 13.9 Suppliers, Customers, Warehouses, Team

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/shops/:shopId/suppliers` | List suppliers | Auth + `sup_view` |
| `POST` | `/api/shops/:shopId/suppliers` | Create supplier | Auth + `sup_edit` |
| `PATCH` | `/api/shops/:shopId/suppliers/:id` | Update supplier | Auth + `sup_edit` |
| `DELETE` | `/api/shops/:shopId/suppliers/:id` | Delete supplier | Auth + `sup_edit` |
| `GET` | `/api/shops/:shopId/customers` | List customers | Auth |
| `POST` | `/api/shops/:shopId/customers` | Create customer | Auth |
| `PATCH` | `/api/shops/:shopId/customers/:id` | Update customer | Auth |
| `GET` | `/api/shops/:shopId/warehouses` | List warehouses | Auth + `wh_view` |
| `POST` | `/api/shops/:shopId/warehouses` | Create warehouse | Auth + `wh_manage` |
| `PATCH` | `/api/shops/:shopId/warehouses/:id` | Update warehouse | Auth + `wh_manage` |
| `GET` | `/api/shops/:shopId/team` | List team members | Auth + `team_view` |
| `POST` | `/api/shops/:shopId/team/invite` | Invite member | Auth + `team_invite` |
| `PATCH` | `/api/shops/:shopId/team/:id/role` | Change role | Auth + `team_roles` |
| `PATCH` | `/api/shops/:shopId/team/:id/status` | Activate/deactivate | Auth + `team_invite` |

### 13.10 Notifications

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/notifications` | List notifications (filtered by role) | Auth |
| `PATCH` | `/api/notifications/:id/read` | Mark as read | Auth |
| `POST` | `/api/notifications/mark-all-read` | Mark all notifications as read | Auth |
| `DELETE` | `/api/notifications/:id` | Delete a single notification | Auth |
| `POST` | `/api/notifications/:id/action` | Take action (approve/reject/acknowledge) | Auth |
| `GET` | `/api/notifications/preferences` | Get notification preferences | Auth |
| `PATCH` | `/api/notifications/preferences` | Update preferences | Auth |

### 13.11 Billing & Subscriptions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/billing/plan` | Get current plan & usage | Auth |
| `POST` | `/api/billing/upgrade` | Upgrade/downgrade plan | Auth + `set_billing` |
| `GET` | `/api/billing/history` | Payment history | Auth |
| `GET` | `/api/billing/payment-methods` | List payment methods | Auth |
| `POST` | `/api/billing/payment-methods` | Add payment method | Auth |
| `DELETE` | `/api/billing/payment-methods/:id` | Remove payment method | Auth |

### 13.12 Admin Endpoints

#### Users & Shops

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/users` | List all platform users | Admin + `manageUsers` |
| `GET` | `/api/admin/users/:id` | User detail | Admin + `manageUsers` |
| `PATCH` | `/api/admin/users/:id/status` | Change user status (activate/deactivate/suspend) | Admin + `manageUsers` |
| `PATCH` | `/api/admin/users/:id/plan` | Change user plan | Admin + `managePlans` |
| `GET` | `/api/admin/users/:id/subscription` | User subscription detail (plan, payments, usage) | Admin + `manageUsers` |
| `GET` | `/api/admin/users/:id/usage` | Per-user resource usage breakdown | Admin + `manageUsers` |
| `POST` | `/api/admin/users/:id/exemption` | Grant billing exemption (period, reason) | Admin + `grantExemptions` |
| `GET` | `/api/admin/shops` | List all shops | Admin + `manageShops` |
| `GET` | `/api/admin/shops/:id` | Shop detail | Admin + `manageShops` |
| `PATCH` | `/api/admin/shops/:id/status` | Suspend/unsuspend shop | Admin + `manageShops` |

#### Plan & Subscription Management

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/plans` | List all plans (all lifecycle states) | Admin + `managePlans` |
| `POST` | `/api/admin/plans` | Create new plan (draft or active) | Admin + `managePlans` |
| `GET` | `/api/admin/plans/:id` | Plan detail including limits & features | Admin + `managePlans` |
| `PATCH` | `/api/admin/plans/:id` | Update plan (limits, features, name, price) | Admin + `managePlans` |
| `PATCH` | `/api/admin/plans/:id/lifecycle` | Transition lifecycle state (with retirement/migration config) | Admin + `managePlans` |
| `DELETE` | `/api/admin/plans/:id` | Delete/permanently retire a plan | Admin + `deletePlans` |
| `GET` | `/api/admin/plans/:id/subscribers` | List subscribers on a specific plan | Admin + `managePlans` |
| `POST` | `/api/admin/plans/:id/migrate` | Trigger subscriber migration to fallback plan | Admin + `managePlans` |
| `GET` | `/api/admin/subscriptions/metrics` | MRR, ARPU, active subscriber count, plan breakdown | Admin + `managePlans` |

#### Finances

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/finances/dashboard` | Revenue, expenses, net income, runway KPIs | Admin + `manageBilling` |
| `GET` | `/api/admin/finances/revenue` | Revenue breakdown by plan, payment method fees | Admin + `manageBilling` |
| `GET` | `/api/admin/finances/expenses` | List expense items with category summary | Admin + `manageBilling` |
| `POST` | `/api/admin/finances/expenses` | Create expense item | Admin + `manageBilling` |
| `PATCH` | `/api/admin/finances/expenses/:id` | Update expense item | Admin + `manageBilling` |
| `DELETE` | `/api/admin/finances/expenses/:id` | Delete expense item | Admin + `manageBilling` |
| `GET` | `/api/admin/finances/cash-flow` | Cash flow statement (operating/investing/financing) | Admin + `manageBilling` |
| `GET` | `/api/admin/finances/projections` | MRR projections with growth/churn parameters | Admin + `manageBilling` |
| `GET` | `/api/admin/finances/reports/pnl` | P&L report with Ghana tax calculations | Admin + `manageBilling` |

#### Announcements

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/announcements` | List announcements | Admin + `manageAnnouncements` |
| `POST` | `/api/admin/announcements` | Create announcement | Admin + `manageAnnouncements` |
| `PATCH` | `/api/admin/announcements/:id` | Update announcement (title, body, target, priority, status) | Admin + `manageAnnouncements` |
| `DELETE` | `/api/admin/announcements/:id` | Delete announcement | Admin + `manageAnnouncements` |
| `PATCH` | `/api/admin/announcements/:id/status` | Toggle publish/unpublish (active ↔ draft) | Admin + `manageAnnouncements` |

#### Audit & Fraud

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/audit-log` | List audit events (filterable by category, risk, period) | Admin + `viewAuditLog` |
| `GET` | `/api/admin/audit-log/:id` | Audit event detail (before/after, IP, device, session) | Admin + `viewAuditLog` |
| `GET` | `/api/admin/investigations` | List investigation cases | Admin + `viewAuditLog` |
| `POST` | `/api/admin/investigations` | Create investigation case | Admin + `viewAuditLog` |
| `PATCH` | `/api/admin/investigations/:id` | Update case (status, priority, assignee, findings) | Admin + `viewAuditLog` |
| `POST` | `/api/admin/investigations/:id/notes` | Add investigation note | Admin + `viewAuditLog` |
| `POST` | `/api/admin/investigations/:id/resolve` | Resolve case (no fraud / fraud confirmed / inconclusive) | Admin + `viewAuditLog` |
| `GET` | `/api/admin/anomalies` | List detected anomalies | Admin + `viewAuditLog` |
| `PATCH` | `/api/admin/anomalies/:id/status` | Update anomaly status (dismiss, escalate) | Admin + `viewAuditLog` |
| `GET` | `/api/admin/detection-rules` | List detection rules | Admin + `viewAuditLog` |
| `PATCH` | `/api/admin/detection-rules/:id` | Update rule (enable/disable, threshold) | Admin + `systemSettings` |
| `GET` | `/api/admin/forensics/users` | List users with risk scores and behavioral flags | Admin + `viewAuditLog` |
| `GET` | `/api/admin/forensics/users/:id` | User forensic detail (login history, activity heatmap, risk breakdown) | Admin + `viewAuditLog` |

#### Admin Team

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/team` | List admin team members | Admin + `manageAdmins` |
| `POST` | `/api/admin/team/invite` | Invite admin member (name, email, phone, role, message) | Admin + `manageAdmins` |
| `PATCH` | `/api/admin/team/:id/role` | Change admin member role | Admin + `manageAdmins` |
| `PATCH` | `/api/admin/team/:id/status` | Suspend/reactivate admin member | Admin + `manageAdmins` |
| `DELETE` | `/api/admin/team/:id` | Remove admin member | Admin + `manageAdmins` |

#### Platform Settings

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/settings` | Get platform settings (maintenance mode, registrations, free trial, force 2FA, email notifications) | Admin + `systemSettings` |
| `PATCH` | `/api/admin/settings` | Update platform settings | Admin + `systemSettings` |

---

## 14. Form Validation Rules

### 14.1 Validator Library (`utils/validators.ts`)

All validation functions return `null` for valid input or an error string for invalid. The `validate()` composer runs validators in order and returns the first non-null error.

| Validator | Signature | Rule | Error Message | Skip-if-empty |
|---|---|---|---|---|
| `isRequired(v)` | `(v: string)` | `v.trim()` is truthy | "This field is required" | No — this IS the emptiness check |
| `isEmail(v)` | `(v: string)` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | "Invalid email address" | Yes — returns `null` if empty |
| `isPhone(v)` | `(v: string)` | `/^[\d\s+()-]{7,20}$/` | "Invalid phone number" | Yes — returns `null` if empty |
| `minLength(n)(v)` | `(min: number) → (v: string)` | `v.trim().length >= min` | "Must be at least {n} characters" | Yes — returns `null` if empty |
| `maxLength(n)(v)` | `(max: number) → (v: string)` | `v.length <= max` | "Must be at most {n} characters" | No |
| `isPositiveNumber(v)` | `(v: string \| number)` | `!isNaN(num) && num > 0` | "Must be a number" (NaN) or "Must be greater than 0" | No |
| `isNonNegative(v)` | `(v: string \| number)` | `!isNaN(num) && num >= 0` | "Must be a number" (NaN) or "Must be 0 or greater" | No |
| `validate(v, ...fns)` | `(v: string, ...validators)` | Runs validators in sequence | Returns first non-null error | N/A |

**Skip-if-empty pattern**: `isEmail`, `isPhone`, and `minLength` return `null` (pass) when the input is empty. This means they must be composed with `isRequired` to enforce mandatory + format: e.g., `validate(value, isRequired, isEmail)`.

> **Known gap**: The validator library is defined and exported but **not imported or used by any form component**. All forms implement inline custom validation logic instead. The utility exists for future refactoring but is currently dead code.

### 14.2 Form-Specific Validation Summary

All forms use **inline custom validation** (not the `validators.ts` utility). The "Validation Approach" column indicates the actual implementation method.

| Form | Field | Actual Rules | Validation Approach |
|---|---|---|---|
| **Login** | Email | required (non-empty check only — **no format validation**) | Inline: `!email \|\| !password` |
| | Password | required (non-empty check only — **no minLength**) | |
| **Register** | First Name | required (trimmed) | Inline custom `validate()` function |
| | Last Name | required (trimmed) | |
| | Email | required + regex `/\S+@\S+\.\S+/` | |
| | Phone | required (trimmed) | |
| | Password | required + `length >= 8` | |
| | Confirm Password | required + must match password | |
| | Terms Agreement | must be checked (`!agreedTerms` → error) | |
| **Reset Password** | Password | required + minLength(8) | Inline |
| | Confirm | required + must match | |
| **Add Product** | *(all fields)* | **Not implemented** — UI labels marked `*` but no runtime validation handlers | **Known gap** |
| **Add Category** | Name | required + unique (case-insensitive duplicate check) | Inline: `isValid = name.trim() && desc.trim() && !isDuplicate` |
| | Icon | has default (auto-selected emoji) — not explicitly validated | |
| | Color | has default (auto-selected color) — not explicitly validated | |
| | Description | required (trimmed) | |
| **Add Unit** | Name | required + unique (name OR abbreviation duplicate check) | Inline: `isValid = name.trim() && abbreviation.trim() && description.trim() && !isDuplicate` |
| | Abbreviation | required + unique (checked together with name) | |
| | Type | required (dropdown selection) | |
| | Description | required (trimmed) | |
| **Add Supplier** | *(3-step wizard)* | Only Step 1 validated | Inline: `isStep1Valid = form.name.trim() && form.contact.trim() && ...` |
| | Step 1: Name | required + unique (name or email duplicate check) | |
| | Step 1: Contact | required (trimmed) | |
| | Step 1: Phone | required (trimmed — **no format validation**) | |
| | Step 1: Email | required (trimmed — **no format validation**) | |
| | Step 1: Location | required | |
| | Steps 2–3 | No validation — user can proceed without filling | |
| **Add Customer** | Name | required (trimmed) | Inline: `!custForm.name.trim() \|\| !custForm.phone.trim()` |
| | Phone | required (trimmed — **no format validation**) | |
| **Team Invite** | Name | required (trimmed) | Inline: `canSend = form.name.trim() && form.role && (tab === "email" ? form.email.trim() : form.phone.trim())` |
| | Email | required **when Email tab is selected** | |
| | Phone | required **when SMS tab is selected** | |
| | Role | required (dropdown selection) | |
| **PO Creation** | *(3-step modal)* | | Inline per-step validation |
| | Step 1: Supplier | required (selection from list) | |
| | Step 2: Line Items | at least 1 item, each with `qty > 0` and `unitCost > 0` | |
| | Step 3: Location | required (warehouse/store selection) | |
| | Step 3: Expected Date | required (non-empty) | |
| | Step 3: Notes | optional | |
| **Sale Reversal** | Reason | required (`reversalReason.trim()` must be non-empty) | Inline |
| **Stock Adjustment** | *(all fields)* | **Not implemented** — UI labels marked `*` but no runtime validation handlers. Integer requirement for quantity is not enforced. | **Known gap** |
| **Stock Transfer** | Product | required | Inline: `sameLocation` check + disabled button |
| | From | required | |
| | To | required + must differ from From (enforced via disabled button + error message) | |
| | Quantity | required (**"<= source stock" is NOT enforced** — available qty shown for reference only) | |
| **Shop Wizard** | *(4 steps, not 3)* | | Inline: `canProceed()` per step |
| | Step 1: Name | required (trimmed) | |
| | Step 1: Type | required (dropdown) | |
| | Step 1: Region | required (dropdown) | |
| | Step 2: Phone | required (trimmed) | |
| | Step 2: Email | required (trimmed) | |
| | Steps 3–4 | **No validation** (`canProceed` returns `true`) — Tax Rate is NOT validated | |

### 14.3 Known Gaps

| Gap | Detail |
|---|---|
| **Validator utility unused** | `validators.ts` exports 8 functions but no form component imports them. All validation is inline. |
| **Add Product — no validation** | Form renders required field markers but has no runtime validation logic. All fields accept any input. |
| **Stock Adjustment — no validation** | Form renders required field markers but has no runtime validation logic. Integer requirement not enforced. |
| **Login — no format checks** | Email format and password minimum length are not validated — only emptiness is checked. |
| **Phone format — rarely checked** | Only the validator utility has phone regex; actual forms (Supplier, Customer, Team, Wizard) just check non-empty. |
| **Stock transfer quantity** | "<= available stock" constraint is displayed as a hint but not enforced in UI. |
| **Shop Wizard Step 3** | Tax Rate shown but `canProceed()` returns `true` unconditionally — no numeric validation. |

---

## 15. Error Handling

### 15.1 Global Error Handling

Nuxt provides a multi-layered error handling strategy:

- **`error.vue`** — global error page rendered for unhandled errors and `createError()` calls:
  - Heading: "Something went wrong" (or HTTP status-specific message).
  - Error message: `error.message || 'An unexpected error occurred'`.
  - Button: "Go Home" → `clearError({ redirect: '/' })`.
  - Receives error via `useError()` composable.
- **`app.vue` `onErrorCaptured`** — Vue lifecycle hook for logging unhandled component errors to console or error reporting service.
- **API plugin interceptor** — catches HTTP errors (401, 403, 422, 5xx) from API calls and handles them appropriately (token refresh, toast, validation display, or error page).

### 15.2 Toast Notifications

All user-facing action feedback uses the Nuxt UI toast system (`useToast()` composable).

**Toast types:**

| Type | Color Source | Icon | Usage Examples |
|---|---|---|---|
| `success` | `colors.success` (Green) | CheckCircle | "Product saved", "Sale completed", "PO approved" |
| `error` | `colors.danger` (Red) | AlertTriangle | "Failed to save", "Operation failed" |
| `warning` | `colors.warning` (Amber) | AlertTriangle | "Stock running low", "Approaching plan limit" |
| `info` | `colors.accent` (Theme accent) | Info | "Feature available on Basic plan" |
| `deny` | `colors.danger` (Red) | Ban | "Access denied — insufficient permissions" |

**Toast interface:**
```
{ id: number, title?: string, message: string, type: ToastType }
```

**Behavior:**
- **Position**: fixed top-right (`top: 16px, right: 16px`), zIndex `10000`.
- **Auto-dismiss**: 4000ms default, configurable per toast via `duration` parameter.
- **Stack**: vertical with 8px gap. **No maximum limit** — all toasts display simultaneously.
- **Max width**: 360px per toast.
- **Close button**: X icon (`textDim` color, 14px) in top-right of each toast.
- **Animation**: entry `modalIn 0.2s ease`; removal is instant (no exit animation).
- **Styling**: 12px 16px padding, 12px borderRadius, 1px border, `box-shadow: 0 8px 24px rgba(0,0,0,0.15)`.

### 15.3 Inline Form Errors

Implemented via the Nuxt UI `UFormGroup` component with error slot, or custom `AuthInput` component:

- **Error text**: displayed below the field at fontSize 11px in `danger` color.
- **Error icon**: `AlertTriangle` (11px) accompanies the error text.
- **Border change**: input border turns `danger` color (1.5px solid) when error is present.
- **Show timing**: errors are set **on submit attempt** (not on blur). Auth forms set error in `handleLogin` / `handleSubmit`.
- **Clear behavior**: **manual** — the caller clears the error on input change (e.g., `onChange={e => { setValue(e.target.value); setError(''); }}`), not automatic.

### 15.4 Empty States

`EmptyState` component (`components/ui/EmptyState.vue`) used on list pages when no data exists or no data matches current search/filter criteria.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `icon` | `LucideIcon` | Yes | Icon displayed in a 64×64px box with `surfaceAlt` background |
| `title` | `string` | Yes | Main text (16px, bold) |
| `description` | `string` | No | Subtitle (13px, muted, max-width 400px) |
| `action` | slot | No | Action button/element below description (Vue slot) |

**Styling**: centered flex column, 60px 20px padding, icon in 16px borderRadius box at 28px size.

### 15.5 Loading States

Three loading implementations:

**PageLoader** (Nuxt built-in `<NuxtLoadingIndicator>` or custom loading component):
- 32×32px circular spinner with 3px border.
- Border top color: `colors.primary` (animated).
- Animation: `spin 0.8s linear infinite`.
- Used as loading indicator during page navigation (Nuxt handles lazy-loading automatically).
- Centered with `minHeight: 200px`.

**Skeleton** (`components/ui/Skeleton.vue`):
- Configurable props: `width` (default `'100%'`), `height` (default `20`), `borderRadius` (default `8`).
- Background: `colors.surfaceAlt`.
- Animation: `pulse 1.5s ease-in-out infinite`.
- Used for loading table rows, product cards, etc.

**Button loading** (Nuxt UI `UButton` with `loading` prop):
- When `loading={true}`: spinner replaces the icon, button becomes `disabled`, opacity drops to `0.5`, cursor `not-allowed`.
- Spinner size: 14px for `sm` buttons, 16px for `md`/`lg`.
- Animation: `spin 0.8s linear infinite`.

**AuthButton loading** (auth page submit button):
- Separate implementation: 18px white spinner (`rgba(255,255,255,0.3)` border, `#fff` top border).
- Replaces button children entirely when loading.

**Animation Keyframes** (defined in `globals.css`):

| Keyframe | Duration | Usage |
|---|---|---|
| `modalIn` | 0.2s ease | Modal entry (scale + translateY) |
| `slideIn` | — | Sidebar slide from left |
| `spin` | 0.8s linear infinite | Spinners (page loader, button, skeleton) |
| `pulse` | 1.5s ease-in-out infinite | Skeleton loading shimmer |
| `kitchenPulse` | — | Kitchen Display pending count badge pulse |
| `fadeIn` | — | Fade-in with slight translateY for content appearance |

### 15.6 Permission Denied

Access control uses a **prevention-first** approach:
- **Nav hiding**: sidebar items are hidden for pages the user lacks permission for (primary mechanism).
- **Button disabling/blocking**: actions requiring permissions are silently blocked or buttons are hidden when `canAccess(permKey)` returns `false`.
- **`deny` toast type**: exists in the toast system for explicit denial messages.

> **Known gap**: There is no dedicated "permission denied" page or automatic redirect-to-dashboard on unauthorized access. The system relies on hiding UI elements rather than catching unauthorized navigation.

### 15.7 Plan Limit Reached

When `canAdd()` returns `false`:
- `LimitBlockedModal` (`components/modals/LimitBlockedModal.vue`) appears as a modal overlay with:
  - **Lock icon** (22px, danger color) at the top.
  - **Title**: resource-specific (e.g., "Products Limit Reached").
  - **Description**: role-aware message — "Your {plan} plan allows a maximum" for decision makers; "The {plan} plan limit has been reached. Please contact the shop owner." for non-decision makers.
  - **"Close" button**: dismisses the modal.
  - **"Upgrade Now" button**: shown only for decision makers (owners/managers) → opens `UpgradeModal`.

> **Note**: The modal does not display exact current usage vs. maximum counts — it provides a general limit-reached message with a plan upgrade CTA.

---

## 16. Responsive Behavior

### 16.1 Breakpoints

Defined in `utils/constants/breakpoints.ts`:

```ts
export const BREAKPOINTS = { sm: 0, md: 640, lg: 768, xl: 1024, xl2: 1440 } as const;
export type Breakpoint = keyof typeof BREAKPOINTS; // 'sm' | 'md' | 'lg' | 'xl' | 'xl2'
export const BREAKPOINT_ORDER: Breakpoint[] = ['sm', 'md', 'lg', 'xl', 'xl2'];
```

| Name | Min-width | Effective Range | Description |
|---|---|---|---|
| `sm` | 0 | 0–639px | Mobile phones |
| `md` | 640 | 640–767px | Large phones, small tablets |
| `lg` | 768 | 768–1023px | Tablets, small laptops |
| `xl` | 1024 | 1024–1439px | Laptops, desktops |
| `xl2` | 1440 | 1440px+ | Large desktops |

Resolution is performed by `getBreakpoint(width)` in `composables/useBreakpoint.ts`: compares `window.innerWidth` against `BREAKPOINTS.md`, `.lg`, `.xl`, `.xl2` thresholds in ascending order.

### 16.2 Breakpoint Helpers

Defined in `utils/responsive.ts`:

| Helper | Logic | Returns `true` for |
|---|---|---|
| `isMobile(bp)` | `bp === 'sm'` | `sm` only |
| `isTablet(bp)` | `bp === 'md' \|\| bp === 'lg'` | `md`, `lg` |
| `isSmall(bp)` | `bp === 'sm' \|\| bp === 'md'` | `sm`, `md` |
| `isCompact(bp)` | `bp === 'sm' \|\| bp === 'md' \|\| bp === 'lg'` | `sm`, `md`, `lg` |
| `isDesktop(bp)` | `bp === 'xl' \|\| bp === 'xl2'` | `xl`, `xl2` |

> **Note:** `isMobile` checks `sm` only — not `sm + md`. Components that need "small-screen" behavior typically use `isSmall` (sm + md) instead.

### 16.3 Layout Adaptations

#### 16.3.1 Sidebar (`components/layout/Sidebar.vue`)

| Condition | Behavior |
|---|---|
| `isMobile(bp)` (sm only) | Hidden by default; opens as 260px-wide overlay drawer via hamburger button; translates off-screen when closed |
| Tablet / small desktop (md–xl) | Collapsed: 72px width, icons only, expand on hover/click via collapse toggle button |
| Large desktop (xl2) | Expanded: 240px width, full labels |

Collapse toggle button (chevron icon) toggles between 72px and 240px. State stored in component `ref()`, not persisted.

#### 16.3.2 MobileNav (`components/layout/MobileNav.vue`)

| Property | Value |
|---|---|
| Renders when | `isMobile(bp)` — `sm` only (not sm + md) |
| Height | 60px fixed bottom bar |
| Padding | Includes `env(safe-area-inset-bottom)` for notched devices |
| Tabs | 5: Dashboard, POS, Products, Purchase Orders, More |
| Active indicator | 4px dot below active icon |

#### 16.3.3 Header (`components/layout/Header.vue`)

| Condition | Behavior |
|---|---|
| `isMobile(bp)` (sm) | Hamburger menu button visible; some controls hidden |
| Desktop (md+) | Full width with all controls (search, notifications, profile) |

#### 16.3.4 Modals

Modals use inline styles:

```
width: '100%', maxWidth: 420px
```

Outer container has 16px horizontal padding. Not 96%/480-640px as previously documented.

#### 16.3.5 POS Layout (`pages/pos.vue`)

| Condition | Layout |
|---|---|
| Mobile (`isSmall`) | Product grid fills screen; cart accessed via floating action button (FAB) that opens a full-screen checkout overlay |
| Desktop (lg+) | Side-by-side: product grid left, cart panel right |

Cart panel widths (responsive via `rv()`):

| Breakpoint | Cart Width |
|---|---|
| `lg` | 320px |
| `xl` | 360px |
| `xl2` | 400px |

Product grid columns (via `rg()`):

| Breakpoint | Columns |
|---|---|
| `sm` | 3 |
| `lg` | 3 |
| `xl` | 4 |
| `xl2` | 5 |

### 16.4 Responsive Utilities

#### `rv<T>(bp, vals)` — Responsive Value

```ts
type ResponsiveValues<T> = Partial<Record<Breakpoint, T>>;
function rv<T>(bp: Breakpoint, vals: ResponsiveValues<T>): T
```

Returns the value for the current breakpoint using **fallback walk-back** logic:
1. Look up `vals[bp]` — if defined, return it.
2. Otherwise walk backwards through `['sm', 'md', 'lg', 'xl', 'xl2']` from the current index until a defined value is found.
3. If nothing found, returns `vals.sm` (cast to `T` — will be `undefined` if `sm` not provided).

This means callers only need to define values at breakpoints where behavior changes; intermediate breakpoints inherit from the nearest smaller defined value.

#### `rg(bp, vals)` — Responsive Grid

```ts
function rg(bp: Breakpoint, vals: ResponsiveValues<number>): string
```

Wraps `rv()` to return CSS `repeat(N, 1fr)` for grid `gridTemplateColumns`.

#### `useBreakpoint()` — Breakpoint Hook

```ts
function useBreakpoint(): Breakpoint
```

| Behavior | Detail |
|---|---|
| Listener | `window.addEventListener('resize', onResize)` — fires on every resize event |
| Debouncing | **None** — no debounce or throttle applied |
| State update | Only calls `setBp` when the resolved breakpoint actually changes (prev !== next), avoiding unnecessary re-renders |
| SSR default | Returns `'xl'` when `typeof window === 'undefined'` |
| Cleanup | Removes listener on unmount |

### 16.5 Known Gaps

| # | Gap | Detail |
|---|---|---|
| 1 | No resize debounce | `useBreakpoint` fires on every resize event; no `requestAnimationFrame` or debounce wrapper |
| 2 | Sidebar collapse not persisted | Collapse/expand state is local `ref()`; resets on page reload |
| 3 | MobileNav sm-only | Bottom nav only renders on `sm`; `md` users (640-767px) see neither MobileNav nor full sidebar |
| 4 | `rv()` silent undefined | If `sm` key is not provided and walk-back finds nothing, returns `undefined` cast as `T` with no warning |

---

## 17. Theme System

### 17.1 Available Themes

Defined in `utils/constants/themes.ts`. Exported as `THEMES: Record<ThemeId, ThemeColors>`.

| ID | Name | Dark? | Icon | Primary | Preview (3-color tuple) |
|---|---|---|---|---|---|
| `midnight` | Midnight | Yes | `Moon` | #6C5CE7 | `['#0F1117', '#6C5CE7', '#00D2D3']` |
| `light` | Light | No | `Sun` | #6C5CE7 | `['#F5F7FA', '#6C5CE7', '#00B894']` |
| `ocean` | Ocean | Yes | `Globe` | #2E86DE | `['#0A1628', '#2E86DE', '#54E0C7']` |
| `forest` | Forest | Yes | `Package` | #27AE60 | `['#0D1A14', '#27AE60', '#F1C40F']` |
| `sunset` | Sunset | Yes | `Sun` | #E84393 | `['#1A1018', '#E84393', '#FD9644']` |
| `lavender` | Lavender | No | `Palette` | #7C5CFC | `['#F3F0FF', '#7C5CFC', '#C084FC']` |

Default theme: `midnight`. Exported as `DEFAULT_THEME = 'midnight'`.

Additional constants export: `THEME_IDS: ThemeId[]` — array of all 6 theme IDs.

### 17.2 Type System

Defined in `types/theme.types.ts`:

```ts
type ThemeId = 'midnight' | 'light' | 'ocean' | 'forest' | 'sunset' | 'lavender';

interface ThemeColors {
  // Metadata (5 fields)
  id: string;
  name: string;
  icon: LucideIcon;
  isDark: boolean;
  preview: [string, string, string];

  // Color tokens (22 fields) — see §17.3
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderLight: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  accent: string;
  accentBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  orange: string;
  orangeBg: string;
}

type ThemesMap = Record<ThemeId, ThemeColors>;
```

Total properties per theme: **27** (5 metadata + 22 color tokens).

### 17.3 Color Tokens (22 per theme)

| # | Token | Purpose |
|---|---|---|
| 1 | `bg` | Page background |
| 2 | `surface` | Card/panel background |
| 3 | `surfaceAlt` | Alternative surface (e.g., hover states) |
| 4 | `border` | Primary border color |
| 5 | `borderLight` | Subtle border color |
| 6 | `text` | Primary text |
| 7 | `textMuted` | Secondary text |
| 8 | `textDim` | Tertiary/disabled text |
| 9 | `primary` | Primary brand color |
| 10 | `primaryLight` | Lighter primary variant |
| 11 | `primaryDark` | Darker primary variant |
| 12 | `primaryBg` | Primary background tint (rgba) |
| 13 | `accent` | Accent color |
| 14 | `accentBg` | Accent background tint (rgba) |
| 15 | `success` | Success color (green) |
| 16 | `successBg` | Success background (rgba) |
| 17 | `warning` | Warning color (amber) |
| 18 | `warningBg` | Warning background (rgba) |
| 19 | `danger` | Danger/error color (red) |
| 20 | `dangerBg` | Danger background (rgba) |
| 21 | `orange` | Orange accent |
| 22 | `orangeBg` | Orange background (rgba) |

> **Note:** Solid tokens use hex values (e.g., `#6C5CE7`). Background tint tokens (`*Bg`) use `rgba()` with low alpha (0.07–0.12) for translucent overlays.

### 17.4 Color Application Strategy

Theme colors are bridged from JavaScript to CSS via **CSS custom properties**, enabling **Tailwind CSS v4 semantic utility classes** as the primary styling mechanism. Residual inline `style` is used only for dynamic/computed values.

**How the bridge works:**

1. The theme composable calls `syncCssVars(colors)` on every theme change, which writes 22 `--sc-*` CSS custom properties to `document.documentElement.style` (e.g., `--sc-primary`, `--sc-surface`, `--sc-text`).
2. `globals.css` contains a `@theme` block that maps each `--sc-*` variable to a Tailwind `--color-*` token (e.g., `--color-primary: var(--sc-primary)`).
3. This enables Tailwind semantic classes like `bg-surface`, `text-primary`, `border-border`, `text-text-muted`, `bg-danger-bg`, etc.

**Pattern (primary — Tailwind classes):**

```vue
<div class="bg-surface text-text border border-border rounded-lg p-4">…</div>
```

**Pattern (residual inline style — for dynamic/computed values only):**

```vue
<!-- Computed hex alpha, gradients, responsive helpers, dynamic conditionals -->
<div :style="{ background: `${colors.primary}15`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }">…</div>
```

**`main.css` (`assets/css/main.css`) contains:**
- Font import (DM Sans 400/500/600/700/800 from Google Fonts)
- `@import 'tailwindcss'` — Tailwind CSS v4 entry point
- `@theme` block with:
  - 22 color token mappings (`--color-bg` through `--color-orange-bg`) bridging `--sc-*` to Tailwind
  - `--color-tab-active` for active tab indicator
  - `--breakpoint-xl2: 1440px` custom breakpoint
  - Z-index scale tokens (14 levels from `--z-pos-float-bar: 799` to `--z-toast: 10000`)
- `@utility form-label` — custom utility class (10px, bold, uppercase, dim color, 1px letter-spacing)
- `@layer base` — global resets, scrollbar styling, number input spinner hide, focus-visible outline
- Animation keyframes: `modalIn`, `slideIn`, `spin`, `pulse`, `kitchenPulse`, `fadeIn`

### 17.5 Theme Composables

Theme management uses the Nuxt color mode module (`@nuxtjs/color-mode`) integrated with Nuxt UI's theming system.

#### Configuration

Theme configuration is set in `nuxt.config.ts` via the `colorMode` module option and Nuxt UI's `ui` configuration. Themes are defined as Tailwind CSS theme presets.

#### `useColorMode()`

Nuxt's built-in `useColorMode()` composable provides:

```ts
const colorMode = useColorMode()
colorMode.preference  // 'midnight' | 'light' | 'ocean' | 'forest' | 'sunset' | 'lavender'
colorMode.value       // resolved mode
```

Automatically persists preference via cookie (SSR-compatible, no FOUC).

#### `useTheme()` (custom composable)

```ts
function useTheme(): {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  colors: ComputedRef<ThemeColors>;
  themes: typeof THEMES;
  isDark: ComputedRef<boolean>;
}
```

Wraps `useColorMode()` and provides computed theme colors for the active theme. The `setTheme` function updates `colorMode.preference` and syncs CSS variables.

#### `useColors()`

```ts
function useColors(): ComputedRef<ThemeColors>
```

Shortcut composable — returns only the computed `ThemeColors` for the current theme. Used by UI components that need direct access to color tokens.

### 17.6 Theme Persistence

- Stored via cookie (SSR-compatible, avoids flash of unstyled content).
- Default: `'midnight'` (used when no cookie value exists).
- On `setTheme(id)`: updates `colorMode.preference` which persists to cookie and syncs CSS variables.
- On initial load: reads from cookie; falls back to `DEFAULT_THEME` if missing/invalid.

### 17.7 ThemePicker Component

File: `components/features/ThemePicker.vue`. Rendered in the Header.

| Feature | Detail |
|---|---|
| Layout | Dropdown menu triggered by a button in the header |
| Each row | Theme icon (LucideIcon), theme name, "Dark" or "Light" label, 3-color preview circles |
| Active theme | Checkmark indicator on the currently selected theme |
| Collapsed mode | Shows only preview color circles (no text labels) |
| On selection | Calls `setTheme(id)` → updates context state + localStorage |

### 17.8 Admin Theme

The admin portal (`pages/admin/index.vue`) uses a **completely separate** theme system via the `ADMIN_THEMES` constant. It is NOT connected to the main color mode but uses `syncAdminCssVars()` to write the same `--sc-*` CSS variables, enabling Tailwind semantic classes in the admin portal.

```ts
type AdminThemeId = 'dark' | 'light';
const ADMIN_THEMES: Record<AdminThemeId, AdminThemeColors> = { dark: { … }, light: { … } };
```

#### Comparison with main themes

| Aspect | Main Themes | Admin Themes |
|---|---|---|
| Count | 6 themes | 2 (dark, light) |
| Type | `ThemeColors` interface | `AdminThemeColors` interface (extends ThemeColors with `adminAccent`) |
| Color tokens | 22 | 22 + `adminAccent` |
| Unique token | — | `adminAccent` (#6366F1) |
| Primary color | Varies per theme | #6366F1 (Indigo) for both |
| Background format | `rgba()` for `*Bg` tokens | Hex with alpha suffix (e.g., `#6366F115`) for `*Bg` tokens |
| State management | Nuxt color mode (cookie) | Local `ref()` in admin page |
| Toggle location | `ThemePicker` in header | Admin settings tab |
| Persistence | Cookie (SSR-compatible) | Not persisted (resets to dark on reload) |

#### Admin dark theme tokens

| Token | Value |
|---|---|
| `bg` | #0A0F1C |
| `surface` | #111827 |
| `surfaceAlt` | #1A2236 |
| `border` | #1F2B45 |
| `text` | #F1F5F9 |
| `textMuted` | #94A3B8 |
| `textDim` | #64748B |
| `primary` | #6366F1 |
| `primaryBg` | #6366F115 |
| `primaryDark` | #4F46E5 |
| `success` | #10B981 |
| `successBg` | #10B98115 |
| `warning` | #F59E0B |
| `warningBg` | #F59E0B15 |
| `danger` | #EF4444 |
| `dangerBg` | #EF444415 |
| `accent` | #06B6D4 |
| `adminAccent` | #6366F1 |

### 17.9 Known Gaps

| # | Gap | Detail |
|---|---|---|
| 1 | No `prefers-color-scheme` detection | Theme does not auto-match OS dark/light preference; always defaults to `midnight`. Nuxt color mode supports this — needs configuration. |
| 2 | Admin themes separate | `ADMIN_THEMES` uses its own `AdminThemeColors` interface (extends `ThemeColors` with `adminAccent`); not connected to main color mode |
| 3 | Admin theme not persisted | Admin dark/light selection resets to dark on page reload |
| 4 | Admin/main themes diverged | Admin themes have their own `AdminThemeColors` interface; shared via `syncAdminCssVars()` but not guaranteed to stay aligned with main themes |

---

## 18. Known Gaps & Future Work

This section is a **consolidated master list** of gaps identified across the entire codebase. Some items are also noted in individual section Known Gaps tables (§9.6, §10.5, §11.9, §12.7, §14.3, §16.5, §17.9) with additional section-specific detail. This master list provides a single reference for production planning.

### 18.1 Critical (Backend Required)

| # | Gap | Description | Also in |
|---|---|---|---|
| 1 | No backend API | All data is in-memory demo data (Pinia store state + constants). Resets on page reload. Backend required for persistence. | §12.7 |
| 2 | No real authentication | Any non-empty credentials succeed in demo mode. Admin login uses hardcoded `admin@shopchain.com` / `admin123`. Real auth with OAuth2 PKCE needed. | §12.7 |
| 3 | Stock not decremented on sale | POS does not reduce `product.stock` on sale completion. Stock quantities remain unchanged after a sale. Must be implemented server-side. | §9.6 |
| 4 | Stock not restored on reversal | `executeReversal()` only updates the sale record status to `'reversed'` — product stock is not restored. | §9.6 |
| 5 | No real payment processing | Payment method UI (cash, card, MoMo, split) collects data but performs no actual transaction. No payment gateway integration. | — |
| 6 | Social login not implemented | Google/Apple social login buttons render but have no click handler. Purely visual placeholders. | — |
| 7 | Export not functional | Export PDF/CSV buttons exist (e.g., in Admin Audit tab) but have no click handlers. No file generation or download mechanism. | §12.7 |

### 18.2 Important (Feature Completeness)

| # | Gap | Description | Also in |
|---|---|---|---|
| 8 | Tax rate hardcoded + mismatched | POS hardcodes `const taxRate = 0.125` (12.5%) and displays "NHIL/VAT (12.5%)" on receipts. `ShopSettingsPage` form defaults `taxRate: '15'` (15%). The two values don't match, and POS never reads from shop settings. | — |
| 9 | Branch state not synced | Creating branches in shop settings updates local store state, but save does not push branches to the API. | — |
| 10 | Trial period not enforced | Trial days must be computed server-side from subscription `trial_ends_at`. No trial start date tracking, countdown, or expiry enforcement implemented yet. | — |
| 11 | Admin plan management is local state | Plan CRUD/lifecycle in admin subscriptions tab uses local Pinia state. No backend persistence, migration jobs, or exemption tracking. | — |
| 12 | Usage metrics partially live | Only `products` and `team` counts are computed live from store. Others (`transactions`, `storageMB`, `suppliers`, `warehouses`) use static demo constants. | — |
| 12a | `UserRole` type partially out of sync | The `UserRole` type in `user.types.ts` has 9 values. `demoData.ts` ROLES/DEFAULT_PERMISSIONS use 12 role strings. Missing from type: `inventory_manager`, `inventory_officer`, `salesperson`, `accountant`. Type includes `inventory_clerk` which no other file uses. | §3.17 |
| 12b | Bar/Kitchen subsystem is demo-only | The entire bar/restaurant POS subsystem (kitchen Pinia store, tills, kitchen orders) is in-memory state. No backend persistence. All data resets on page refresh. | — |
| 12c | Bar POS stock not decremented | Similar to retail POS (gap #3): Bar POS does not reduce product stock when orders are placed or till is closed. | §9.6 |
| 13 | `addProduct` form wiring | Form inputs need proper `v-model` binding with Zod validation. Form values must be reactive and submittable. | §14.3 |
| 14 | Audit trail not implemented | Defined in plan features but no shop-level audit trail exists. Admin-level audit exists (`AdminAuditFraudTab`) but not for individual shops. | — |
| 15 | API access feature | Defined in plan comparison table ("API Access") but no API key management or developer portal exists. | — |
| 16 | Custom branding — partially implemented | Receipt logo **file upload UI exists** in `ShopSettingsPage` (converts to DataURL via `<input type="file">`), but the uploaded logo is not persisted and does not render on POS receipts. Shop icon uses emoji picker only. | — |
| 17 | Auto-reorder | Max plan feature for POs but not implemented. No automatic PO generation based on reorder points. | — |
| 18 | 2FA for shop users — UI stub only | Account page has a 2FA toggle with placeholder QR code, but enabling just sets local state. No actual TOTP/authenticator validation. Admin login also has non-validated 2FA (any 6-digit code accepted). | — |
| 19 | Data export formats | "CSV" and "All formats" defined in plan features. No actual export generation implemented anywhere. | — |
| 20 | Admin permission enforcement | 5 admin roles × 12 permissions are defined (`ADMIN_ROLES`) but **not enforced** in the UI. All admin users see all 10 tabs and can perform all actions regardless of assigned role. | §12.7 |
| 21 | `draft → pending` PO transition | No "Submit for Approval" button exists for draft POs. Only Cancel is available from `draft` status. The `draft → pending` transition is not implemented. | §10.5 |
| 22 | Global error handling | Nuxt provides `error.vue` for global error handling — must be implemented with proper error reporting integration. | §15.1 |
| 23 | Validation consolidation | Inline validation should be migrated to Zod schemas for consistency with Nuxt UI form integration. | §14.3 |

### 18.3 Enhancements (Nice to Have)

| # | Gap | Description |
|---|---|---|
| 24 | Offline support | No Service Worker, no offline-first architecture. POS would break entirely offline. Needs sync-when-online capability. |
| 25 | Barcode scanner integration | `ScannerModal` has 8 hardcoded `DEMO_BARCODES` and simulates detection with a `setTimeout` (3.5–5.5s random delay). No `navigator.mediaDevices.getUserMedia()` or WebRTC — purely visual simulation. |
| 26 | Receipt printer integration | Print button shows `toast.success('Receipt sent to printer')` only. No `window.print()` call, no browser print dialog, no thermal printer communication. |
| 27 | Real-time notifications | All notifications are in-memory Pinia state with hardcoded initial data. Only `in_app` channel is implemented. Laravel Echo/Reverb integration needed for WebSocket push. Resets on page refresh. |
| 28 | Multi-language support | All UI text is hardcoded in English. No i18n library or translation system. No language switching mechanism. |
| 29 | Image upload for shop icon | Shop icon selector uses emoji picker only. Real image upload with cloud storage needed. (Note: Receipt logo file upload **does** exist but is not persisted — see gap #16.) |

---

---

## Changelog

### v1.1 — 2026-02-27

- **§2.1** Updated styling from "Inline CSS-in-JS" to Tailwind CSS v4 with CSS variable bridge; added `clsx` dependency.
- **§2.3** Added `barPos/`, `kitchen/`, `tillManagement/` page directories; added `KitchenOrderContext`; added `adminThemes.ts`, `zIndex.ts` constants; updated types count from 13 to 14 (added `kitchen.types.ts`).
- **§3.2** Added `skipKitchen?: boolean` field to Product.
- **§3.9** Added `source?: 'pos' | 'bar'` field to SaleRecord.
- **§3.17** Updated UserRole bug note — type now has 9 values (added `bar_manager`, `waiter`, `kitchen_staff`); remaining mismatch is `inventory_manager`, `inventory_officer`, `salesperson`, `accountant` in demoData but not in type.
- **§3.23–3.28** Added new data models: KitchenOrder, KitchenOrderItem, HeldOrder (Bar), Till, TillPayment, KitchenOrderContext.
- **§4.1** Added 3 new roles: `bar_manager` (25% discount), `waiter` (5%), `kitchen_staff` (0%). Role count updated from 9 to 12.
- **§4.2** Added "Bar & Kitchen" module with 4 new permissions (`bar_access`, `bar_discount`, `kitchen_access`, `bar_analysis`). Added columns for 3 new roles. Permission count updated from 32 to 36, module count from 12 to 13.
- **§4.4** Added `barPos → bar_access`, `kitchen → kitchen_access`, `tillManagement → bar_access`, `salesAnalysis → bar_analysis` to NAV_PERM_MAP.
- **§7.9** Fixed access permission from `dash_view` to `bar_analysis`.
- **§7.26–7.28** Added new screen specifications: Bar POS, Kitchen Display, Till Management.
- **§10.4** Corrected PaymentTerms enum to 4 values (removed `net7` and `advance`).
- **§15.5** Added animation keyframes table including `kitchenPulse` and `fadeIn`.
- **§17.4** Rewrote color application strategy to reflect Tailwind CSS variable bridge pattern (was incorrectly documented as "inline CSS-in-JS, zero CSS custom properties").
- **§17.5** Updated `useTheme()` return type to include `themes` and `isDark`.
- **§17.8** Updated admin theme description — now uses typed `AdminThemeColors` interface and `syncAdminCssVars()`.
- **§18** Added gaps: UserRole partial sync (12a), bar/kitchen demo-only (12b), bar POS stock not decremented (12c).

### v1.2 — 2026-02-28

Architecture migration from React + Inertia.js to standalone Nuxt 3 + Vue 3 application consuming the Laravel API over HTTP.

- **§2.1** Replaced entire tech stack table: Nuxt 3, Vue 3, lucide-vue-next, Nuxt file-based routing, Pinia, Nuxt UI, Vue class binding, Zod validation, laravel-echo.
- **§2.2** Replaced all architecture patterns: Nuxt auto code-splitting, Pinia stores, file-based routing, `~/` auto-imports, Nuxt build optimization, strict TypeScript.
- **§2.3** Replaced project structure with Nuxt 3 directory layout: `pages/`, `components/`, `composables/`, `stores/`, `middleware/`, `plugins/`, `layouts/`, `utils/`, `types/`.
- **§3.28** Renamed "KitchenOrderContext" to "Kitchen Order Store" (Pinia store).
- **§5.4** Updated trial period note: server-side computation via API.
- **§6.0** Auth layout now uses Nuxt `layouts/auth.vue`.
- **§15.1** Replaced React ErrorBoundary with Nuxt error handling (`error.vue`, `onErrorCaptured`, API interceptor).
- **§15.2** Toast system now uses Nuxt UI `useToast()`.
- **§15.4–15.5** Updated component file references from `.tsx` to `.vue`; updated loading patterns for Nuxt.
- **§16.3** Updated all layout component file references to `.vue`.
- **§17.4** Updated code examples from JSX (`className`) to Vue template syntax (`:class`).
- **§17.5** Replaced ThemeContext provider tree with Nuxt color mode composables.
- **§17.6** Theme persistence changed from localStorage to cookie (SSR-compatible).
- **§17.8** Updated admin theme state management from `useState` to `ref()`.
- **§17.9** Removed cross-tab sync gap (cookies sync automatically); updated remaining gaps.
- **§18** Updated all React/Context/useState references to Pinia/store/ref() equivalents throughout known gaps.
- **Global** Replaced all `src/` path prefixes with Nuxt-relative paths. Replaced `PageId` with route path strings. Removed all `.tsx` file extensions in favor of `.vue`.

*End of Functional Specification Document*
