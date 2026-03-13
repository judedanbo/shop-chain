# ShopChain — Development Plan

**Date:** 2026-02-28
**Status:** Draft
**Source docs:** `FUNCTIONAL-SPEC.md`, `DATABASE-SCHEMA.md`, existing React prototype (migrated to Vue/Nuxt)

---

## Architecture Overview

Three-layer separation: a shared domain core, an API application, and a standalone web application that communicates with the API over HTTP:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Shared Domain Package                    │
│                      (shopchain/core)                           │
│                                                                 │
│  Eloquent Models · Service Classes · Events/Listeners           │
│  Policies · Enums · Form Requests · Value Objects · Traits      │
│  Database Migrations · Seeders · Factories                      │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────┐         ┌──────────────────────────────┐
│     API Application    │         │      Web Application         │
│    (shopchain-api)     │◄─HTTP── │     (shopchain-web)          │
│                        │         │                              │
│  Laravel 12            │         │  Nuxt 4 + Vue 3 + TypeScript │
│  Passport (OAuth2)     │         │  OAuth2 PKCE (token-based)   │
│  REST endpoints        │         │  Nuxt file-based routing     │
│  Mobile + external API │         │  Nuxt UI component library   │
│  Rate limiting         │         │  Pinia state management      │
│  API versioning        │         │  Reverb client (Echo)        │
│  Reverb broadcasting   │         │                              │
│  CORS (allow web app)  │         │                              │
└────────────────────────┘         └──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
│    (shared, 59 tables — 52 app + 7 framework, RLS enabled)      │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────┐  ┌───────────────┐  ┌──────────────────┐
│  S3-Compatible Store │  │  Redis Cache  │  │  Queue Worker    │
│  (images, exports)   │  │  (sessions,   │  │  (notifications, │
│                      │  │ cache, queue) │  │   exports, jobs) │
└──────────────────────┘  └───────────────┘  └──────────────────┘
```

> **Note:** The web application does NOT connect directly to PostgreSQL. All data access goes through the API. CORS must be configured on the API to allow requests from the web application's origin.

**Key decisions:**

| Decision           | Choice                                                      | Rationale                                                                             |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Separation model   | Shared Composer package + 2 apps                            | Independent deployment, no logic duplication                                          |
| Authentication     | Laravel Passport (OAuth2)                                   | Full OAuth2 for mobile + third-party; web SPA uses authorization code grant with PKCE |
| Database           | PostgreSQL (shared)                                         | Matches DATABASE-SCHEMA.md; JSONB, enums, RLS for multi-tenancy                       |
| Real-time          | Laravel Reverb                                              | First-party WebSocket server; kitchen display, notifications, POS sync                |
| File storage       | S3-compatible                                               | Product images, logos, CSV/PDF exports, receipts                                      |
| Queue              | Redis + Laravel Horizon                                     | Notifications, exports, report generation, batch operations                           |
| Cache              | Redis                                                       | Session storage, plan usage counters, rate limiting                                   |
| Search             | Laravel Scout + Meilisearch                                 | Product search, barcode lookup, customer search                                       |
| RBAC               | spatie/laravel-permission                                   | Team-scoped roles/permissions, multi-guard, wildcard support, 86M+ DLs                |
| DTOs & Resources   | spatie/laravel-data                                         | Single class = DTO + Form Request + API Resource + TS type generation                 |
| Status machines    | spatie/laravel-model-states                                 | Declarative state transitions for PO, sale, order, transfer lifecycles                |
| Audit logging      | spatie/laravel-activitylog                                  | Before/after snapshots, causer tracking, custom properties (IP, device)               |
| Feature flags      | laravel/pennant                                             | Plan-gated feature checks; replaces scattered conditionals                            |
| API filtering      | spatie/laravel-query-builder                                | Declarative filter/sort/include from URL params across all list endpoints             |
| File management    | spatie/laravel-medialibrary                                 | Model-associated uploads, S3, image conversions, signed URLs                          |
| Money handling     | elegantly/laravel-money                                     | brick/money Eloquent casting; GHS (pesewas), no float precision errors                |
| PDF generation     | spatie/laravel-pdf                                          | Chromium/Cloudflare rendering; Tailwind-compatible receipts & reports                 |
| 2FA                | laragear/two-factor                                         | TOTP with recovery codes, migrations, throttling (replaces pragmarx)                  |
| Billing            | devtobi/cashier-paystack                                    | Cashier-style Paystack subscriptions + unicodeveloper/laravel-paystack                |
| Barcode            | picqer/php-barcode-generator                                | SVG/PNG barcode generation; Code128, EAN-13, UPC-A; no GD required                    |
| QR codes           | simplesoftwareio/simple-qrcode                              | Receipt verification QR codes for public verify endpoint                              |
| Excel I/O          | maatwebsite/excel                                           | Chunked import/export, queued jobs, validation with skip-on-failure                   |
| Push notifications | kreait/laravel-firebase + laravel-notification-channels/fcm | FCM push via Laravel notification pipeline                                            |
| SMS (Ghana)        | samuelmwangiw/africastalking-laravel                        | Africa's Talking SMS/voice; laravel-notification-channels/twilio fallback             |
| TypeScript sync    | dedoc/scramble + openapi-typescript                         | Auto-generate OpenAPI spec from API; generate TS types from spec                      |
| Frontend framework | Nuxt 4 (Vue 3 + TypeScript)                                 | File-based routing, SSR/SPA, auto-imports, built-in data fetching                     |
| UI library         | Nuxt UI v4 (Reka UI + Tailwind CSS)                         | Official Nuxt component library; 125+ components, accessible, themeable, Nuxt UI Pro unified |
| State management   | Pinia                                                       | Official Vue state manager; modular stores, devtools, SSR support                     |
| CORS               | fruitcake/laravel-cors (or Laravel 11+ built-in)            | Required for standalone SPA to call API cross-origin                                  |
| Settings           | spatie/laravel-settings                                     | Typed settings groups with DB storage, casting, encryption                            |
| Backups            | spatie/laravel-backup                                       | Scheduled PostgreSQL + file backups to S3 with retention policies                     |
| Mobile API parity  | Full parity from day one                                    | Every web feature has a corresponding API endpoint                                    |

---

## Phase 1 — Foundation & Infrastructure

Establish the project structure, database, authentication, and multi-tenancy. Everything else builds on this.

### 1.1 Project Scaffolding

- [x] Initialize Laravel 12 monorepo workspace
- [x] Create `packages/shopchain-core/` as a local Composer package
  - [x] Set up `composer.json` with PSR-4 autoloading
  - [x] Configure package service provider for model/migration/config registration
- [ ] Create `apps/api/` — Laravel 12 API application *(partial — app bootstraps, middleware/rate-limiting/CORS incomplete)*
  - [x] Install Laravel Passport *(v13.6.0 — publishes migration tables: `oauth_auth_codes`, `oauth_access_tokens`, `oauth_refresh_tokens`, `oauth_clients`, `oauth_device_codes`)*
  - [x] Generate Passport encryption keys *(oauth-private.key, oauth-public.key)*
  - [x] Docker volume mount for `shopchain/core` symlink resolution *(compose.yaml: `../../packages:/var/packages`)*
  - [x] Run all migrations *(14 migrations: 3 framework, 1 Pennant, 5 Passport, 1 2FA, 3 activitylog, 1 permission)*
  - [x] Verify application bootstrap *(Laravel 12.54.1, PHP 8.5.3, all service providers load)*
  - [x] Verify all endpoints respond *(`/` → ShopChain v1.0.0, `/api/v1/health` → ok)*
  - [x] Verify test suite *(2/2 Pest tests pass)*
  - [ ] Configure API-only middleware stack (no sessions, no CSRF)
  - [x] API versioning via route prefix (`/api/v1/`)
  - [ ] Configure rate limiting (per-user, per-IP)
- [x] Create `apps/web/` — Nuxt 4 standalone application *(verified: typecheck passes, production build succeeds, dev server responds)*
  - [x] Initialize with manual scaffolding (Nuxt 4 app dir convention)
  - [x] Install core modules: `@nuxt/ui`, `@pinia/nuxt`, `@vueuse/nuxt`
  - [x] Install `laravel-echo` + `pusher-js` for Reverb WebSocket client
  - [x] Configure `nuxt.config.ts`: runtime config for API base URL, OAuth2 client ID, Reverb host
  - [ ] Set up OAuth2 PKCE auth plugin (authorization code grant, token storage, refresh)
  - [x] Set up file-based routing under `pages/`
  - [ ] Create route middleware: `auth`, `guest`, `shop`, `permission`
  - [ ] Create API plugin (`$fetch` wrapper with base URL, token injection, error interceptors)
- [ ] Configure CORS on API application to allow web app origin
- [x] Shared package dependencies (install in `packages/shopchain-core/`):
  - **Tier 1 — Architectural (all phases depend on these):** *(all installed and configured)*
    - [x] `spatie/laravel-data` v4.20.0 — unified DTOs, form requests, API resources, TS type source *(config published, structure caching includes core package)*
    - [x] `spatie/laravel-model-states` v2.13.1 — declarative status lifecycles for PO, sale, order, transfer, adjustment, goods receipt
    - [x] `spatie/laravel-query-builder` v6.4.4 — URL-driven filtering, sorting, includes for all list endpoints *(config published)*
    - [x] `spatie/laravel-activitylog` v4.12.1 — audit trail with before/after snapshots, causer, custom properties *(config published, migrations published)*
    - [x] `spatie/laravel-permission` v6.24.1 — team-scoped RBAC with multi-guard and wildcard permissions *(config: teams=true, team_foreign_key=shop_id, wildcard=true; migration published)*
    - [x] `laravel/pennant` v1.21.0 — feature flags for plan-gated features *(config published, migration published, 14 feature keys defined in AppServiceProvider)*
  - **Tier 2 — Domain features (installed per phase):**
    - [ ] `spatie/laravel-medialibrary` — file uploads with S3, image conversions (Phase 2.1+)
    - [ ] `spatie/laravel-pdf` — Chromium/Cloudflare PDF rendering for receipts & reports (Phase 3.1+)
    - [ ] `elegantly/laravel-money` — brick/money Eloquent casting for GHS monetary fields (Phase 2.2+)
    - [x] `laragear/two-factor` v4.0.0 — TOTP 2FA with recovery codes, migrations, throttling *(installed in apps/api, config: issuer=ShopChain, 8 recovery codes; migration published)*
    - [ ] `devtobi/cashier-paystack` — Cashier-style Paystack subscription management (Phase 8)
    - [ ] `unicodeveloper/laravel-paystack` — Paystack one-time charges and MoMo (Phase 8)
    - [ ] `maatwebsite/excel` — chunked import/export with queue support (Phase 2.2)
  - **Tier 3 — Utilities (installed as needed):**
    - [ ] `picqer/php-barcode-generator` — barcode SVG/PNG generation (Phase 2.2)
    - [ ] `simplesoftwareio/simple-qrcode` — receipt verification QR codes (Phase 3.3)
    - [ ] `dedoc/scramble` — auto-generate OpenAPI spec from API routes + Data classes (Phase 12.5)
    - [ ] `spatie/laravel-settings` — typed settings groups with DB storage (Phase 10.1)
    - [ ] `spatie/laravel-backup` — scheduled PostgreSQL + file backups to S3 (Phase 14.3)
    - [ ] `spatie/laravel-sluggable` — auto-slug generation for products, categories (Phase 2.2)
    - [ ] `kreait/laravel-firebase` + `laravel-notification-channels/fcm` — FCM push notifications (Phase 7.1)
    - [ ] `samuelmwangiw/africastalking-laravel` — Africa's Talking SMS for Ghana (Phase 7.1)
    - [ ] `laravel-notification-channels/twilio` — SMS fallback for international (Phase 7.1)
- [ ] Shared tooling: *(partially done)*
  - [x] PHPStan (level 8) for static analysis *(installed, needs phpstan.neon config)*
  - [x] Pint for code style *(installed, needs pint.json config)*
  - [x] Pest for testing *(installed and configured with Feature/Unit suites — 2/2 tests passing)*
  - [ ] GitHub Actions CI pipeline

### 1.2 Database Schema & Migrations ✅

Translate `DATABASE-SCHEMA.md` into Laravel migrations within the shared package.

- [x] Create all 52 application table migrations + framework/package tables with proper ordering (respecting FK dependencies) *(27 migrations total: 14 existing + 13 new in shopchain-core)*
  - [x] Framework tables (7): `users`, `sessions`, `cache`, `jobs`, `job_batches`, `failed_jobs`, `password_reset_tokens`
  - [x] Passport tables (5): `oauth_auth_codes`, `oauth_access_tokens`, `oauth_refresh_tokens`, `oauth_clients`, `oauth_device_codes` *(published to apps/api/database/migrations/)*
  - [x] Package-published tables (~8): `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions` (spatie/permission), `activity_log` (spatie/activitylog), `two_factor_authentications` (laragear/two-factor), `features` (laravel/pennant) *(all migrations published to apps/api/database/migrations/)*
  - [x] UUID compatibility: existing migrations modified (`users` table rewritten with UUID PK, Passport `foreignId→foreignUuid`, Spatie Permission `unsignedBigInteger→uuid` morph keys, `User` model uses `HasUuids` trait)
  - [x] Core package migrations (13 files in `packages/shopchain-core/database/migrations/`):
    - `_130000_create_enum_types` — 48 PostgreSQL `CREATE TYPE` enums with CASCADE cleanup for `migrate:fresh`
    - `_130001_create_tenant_tables` — shops, branches, shop_members, branch_members
    - `_130002_create_product_catalog_tables` — categories, units_of_measure, products, warehouses, product_locations
    - `_130003_create_supplier_tables` — suppliers, supplier_products, purchase_orders, po_items
    - `_130004_create_inventory_tables` — batches, stock_adjustments, stock_transfers, price_history, goods_receipts, goods_receipt_items
    - `_130005_create_sales_tables` — customers, tills, sales, sale_items, sale_payments
    - `_130006_create_kitchen_tables` — kitchen_orders, kitchen_order_items, held_orders, held_order_items, till_payments, pos_held_orders, pos_held_order_items
    - `_130007_create_billing_tables` — plans (TEXT PK), subscriptions, payment_methods, billing_records, billing_exemptions
    - `_130008_create_admin_tables` — admin_users, announcements
    - `_130009_create_audit_tables` — audit_events, investigations, investigation_events, investigation_notes, anomalies, anomaly_events, detection_rules
    - `_130010_create_platform_tables` — admin_expenses, admin_expense_attachments, milestones
    - `_130011_create_notification_tables` — notifications (with `notif_channel[]` array), notification_preferences
    - `_130012_create_rls_policies` — RLS on 23 shop-scoped tables
- [x] Define PostgreSQL enum types as Laravel enums (PHP 8.1 backed enums) *(48 enum files in `packages/shopchain-core/src/Enums/`)*
  - [x] `UserStatus`, `ShopStatus`, `BranchStatus`, `BranchType`, `MemberStatus`, `ShopRole`, `AdminRole`
  - [x] `ProductStatus`, `CategoryStatus`, `BatchStatus`, `BatchCondition`, `AdjustmentStatus`, `AdjustmentType`, `TransferStatus`, `UnitType`
  - [x] `WarehouseStatus`, `WarehouseType`
  - [x] `SupplierStatus`, `PoStatus`, `PaymentTerms`, `GoodsReceiptStatus`
  - [x] `SaleStatus`, `SaleSource`, `PayMethod`, `TillPayMethod`, `DiscountType`, `CustomerType`
  - [x] `OrderType`, `KitchenOrderStatus`, `KitchenItemStatus`
  - [x] `PlanLifecycle`, `SubscriptionStatus`, `BillingStatus`, `PayType`
  - [x] `AdminTeamStatus`, `AnnouncementTarget`, `AnnouncementPriority`, `AnnouncementStatus`
  - [x] `AuditCategory`, `RiskLevel`, `InvestigationStatus`, `AnomalyStatus`
  - [x] `NotifCategory`, `NotifPriority`, `NotifChannel`, `NotifAction`
  - [x] `ExemptionUnit`, `ExpenseCategory`
- [x] Create all indexes per DATABASE-SCHEMA.md *(partial indexes, composite indexes, DESC indexes)*
- [x] Create all unique constraints and CHECK constraints *(product_locations location check, stock_transfers source/dest checks)*
- [x] Set up Row-Level Security (RLS) policies for shop-scoped tables *(23 tables with tenant_isolation + tenant_insert policies)*
- [x] Create database seeders:
  - [x] `PlanSeeder` — Free (GH₵0), Basic (GH₵49), Max (GH₵149) plans with limits and features JSONB
  - [ ] `DemoSeeder` — Translation of `demoData.ts` for development/testing *(deferred to later phase)*
  - [x] `PermissionSeeder` — 48 permissions (36 shop + 12 admin), 12 shop roles with permission assignments (167 role-permission mappings)

### 1.3 Eloquent Models (Shared Package)

Create all 52 models with relationships, scopes, accessors, and casts. *(not started — 0/52 models, depends on 1.2)*

- [ ] **Core Tenant & Identity:**
  - [ ] `User` — relationships: shops (via shop_members), adminUser, paymentMethods, notifications *(basic stub exists in apps/api, needs full implementation in core package)*
  - [ ] `Shop` — relationships: owner, branches, members, products, categories, units, suppliers, etc.
  - [ ] `Branch` — relationships: shop, manager, members, tills, kitchenOrders
  - [ ] `ShopMember` — relationships: user, shop, branchMembers; accessor for permissions
  - [ ] `BranchMember` — relationships: member, branch

- [ ] **Products & Inventory:**
  - [ ] `Category`, `UnitOfMeasure`, `Product`, `Warehouse`, `ProductLocation`
  - [ ] `Batch`, `StockAdjustment`, `StockTransfer`
  - [ ] `PriceHistory` — tracks cost/selling price changes per product
  - [ ] `GoodsReceipt`, `GoodsReceiptItem` — ad-hoc goods receiving outside PO workflow

- [ ] **Suppliers & PO:**
  - [ ] `Supplier`, `SupplierProduct`, `PurchaseOrder`, `POItem`

- [ ] **Sales & POS:**
  - [ ] `Customer`, `Till`, `TillPayment`, `Sale`, `SaleItem`, `SalePayment`
  - [ ] `PosHeldOrder`, `PosHeldOrderItem` — retail POS held/parked carts

- [ ] **Kitchen:**
  - [ ] `KitchenOrder`, `KitchenOrderItem`, `HeldOrder`, `HeldOrderItem` — bar/kitchen held orders (distinct from retail POS held orders)

- [ ] **Billing:**
  - [ ] `Plan`, `Subscription`, `PaymentMethod`, `BillingRecord`
  - [ ] `BillingExemption` — admin-granted exemptions (extra resources beyond plan limits)

- [ ] **Admin & Audit:**
  - [ ] `AdminUser`, `Announcement`, `AuditEvent`, `Investigation`
  - [ ] `InvestigationEvent`, `InvestigationNote`, `Anomaly`, `AnomalyEvent`
  - [ ] `DetectionRule` — configurable anomaly detection rules
  - [ ] `AdminExpense`, `AdminExpenseAttachment` — platform operational expenses
  - [ ] `Milestone` — investor-facing platform milestones

- [ ] **Notifications:**
  - [ ] `Notification`
  - [ ] `NotificationPreference` — per-user per-category channel preferences

- [ ] **Framework:**
  - [ ] `Session` — database session storage (Laravel framework table)

- [ ] Global scopes:
  - [ ] `ShopScope` — auto-filters by `app.current_shop_id` for all shop-scoped models
- [ ] Traits:
  - [ ] `BelongsToShop` — common shop_id relationship + scope
  - [ ] `LogsActivity` (from `spatie/laravel-activitylog`) — replaces custom `HasAuditTrail`; auto-logs changes with before/after snapshots, causer, custom properties (IP, device, risk score)
  - [ ] `HasStates` (from `spatie/laravel-model-states`) — on PurchaseOrder, Sale, KitchenOrder, KitchenOrderItem, StockTransfer, StockAdjustment, GoodsReceipt for declarative status lifecycles
  - [ ] `HasRoles` (from `spatie/laravel-permission`) — on User/ShopMember with team scoping (team_id = shop_id)
  - [ ] `InteractsWithMedia` (from `spatie/laravel-medialibrary`) — on Product, Shop, User for image/file uploads
  - [ ] `HasUuid` — UUID primary key generation
- [ ] Data classes (from `spatie/laravel-data`) — one class per entity replaces separate Form Request + API Resource:
  - [ ] Each Data class handles validation (inferred from types + attributes), serialization, and TypeScript generation
  - [ ] Examples: `ProductData`, `SaleData`, `PurchaseOrderData`, `CustomerData`, `ShopData`, etc.

### 1.4 Authentication & Authorization

- [ ] **Passport setup (API app):** *(package installed v13.6.0, config published, scopes + lifetimes defined — grant flows not yet wired)*
  - [ ] Personal access tokens for mobile clients
  - [ ] Authorization code grant for third-party integrations (Max plan API access)
  - [ ] First-party SPA client for web app (authorization code grant with PKCE, no client secret)
  - [x] Token scopes matching plan features *(14 scopes defined in AppServiceProvider)*

- [ ] **Web app auth (Nuxt SPA via OAuth2 PKCE):** *(blocked — apps/web not created yet)*
  - [ ] Authorization code grant with PKCE (Proof Key for Code Exchange) — no client secret required
  - [ ] Nuxt auth plugin handles the OAuth2 flow: redirect to `/oauth/authorize`, exchange code for tokens
  - [ ] Access token stored in memory (not localStorage) for XSS protection; refresh token in secure httpOnly cookie via API proxy endpoint
  - [ ] Automatic token refresh via interceptor on 401 responses
  - [ ] Nuxt route middleware (`auth`) redirects unauthenticated users to login
  - [ ] Nuxt route middleware (`guest`) redirects authenticated users away from login/register

- [ ] **Multi-tenancy middleware:** *(not started)*
  - [ ] `SetCurrentShop` — resolves shop from route parameter or header, sets `app.current_shop_id` on DB connection
  - [ ] `EnsureShopMember` — verifies the authenticated user is a member of the requested shop
  - [ ] `EnsureBranchAccess` — verifies branch-level access where applicable

- [ ] **RBAC via `spatie/laravel-permission` (team-scoped):** *(package configured, implementation not started)*
  - [x] Enable `'teams' => true` in config with `team_foreign_key = shop_id` — roles are scoped per shop
  - [x] Wildcard support: `products.*` grants all product sub-permissions *(enable_wildcard_permission = true)*
  - [ ] 4-level permission system modeled via permission granularity:
    - `full` → assign all sub-permissions (e.g., `products.view`, `products.edit`, `products.delete`, `products.price`)
    - `partial` → subset of sub-permissions (e.g., `products.view`, `products.edit` only)
    - `view` → read-only sub-permission (e.g., `products.view` only)
    - `none` → no permissions assigned for that module
  - [ ] Policy classes delegate to permission checks:
    - `ProductPolicy`, `SalePolicy`, `PurchaseOrderPolicy`, `InventoryPolicy`
    - `TeamPolicy`, `SettingsPolicy`, `WarehousePolicy`, `SupplierPolicy`, `CategoryPolicy`, `UnitPolicy`
    - `DashboardPolicy`, `BarKitchenPolicy`
  - [ ] `AdminPolicy` — separate admin guard with 12 boolean admin permissions
  - [ ] `isDecisionMaker` helper for plan limit enforcement:
    - Decision makers: roles with `isDecisionMaker = true` (owner, general_manager, manager)
    - Only decision makers are blocked by plan limits; non-decision-makers (salesperson, cashier, etc.) are never blocked
    - `PlanEnforcementService::canAdd()` returns `true` immediately for non-decision-maker roles

- [ ] **Plan feature gating via `laravel/pennant`:** *(package installed, 14 feature keys defined with placeholder resolvers — needs wiring to Plan model)*
  - [x] Define all 14 plan feature keys as Pennant features resolved from shop's active subscription:
    - `pos`, `receipts`, `reports`, `barcode`, `purchaseOrders`, `stockTransfers`, `lowStockAlerts`, `twoFA`, `apiAccess`, `dataExport`, `customBranding`, `auditTrail`, `generalManager`, `support`
  - [ ] Usage: `Feature::for($shop)->active('api-access')` replaces scattered `if ($plan->features->apiAccess)` checks
  - [ ] Rich values supported: `Feature::for($shop)->value('support')` can return `'email'`, `'priority'`, or `false`
  - [ ] Route middleware: `EnsureFeatureActive` gates entire route groups behind plan features

- [x] **Admin authentication:** *(guards and providers configured)*
  - [x] Separate guard for admin portal *(admin guard + admin_users provider in config/auth.php)*
  - [ ] 2FA enforcement via `laragear/two-factor` *(package installed v4.0.0, config: issuer=ShopChain, 8 recovery codes — enforcement logic not yet wired)*

### 1.5 Multi-Tenancy Infrastructure *(not started — depends on 1.2–1.4)*

- [ ] Middleware stack for shop-scoped routes:
  ```
  auth → set-current-shop → ensure-shop-member → [ensure-branch-access]
  ```
- [ ] Database-level RLS policies applied via migration (matches DATABASE-SCHEMA.md §RLS)
- [ ] Application-level tenant scoping via Eloquent global scopes as a safety net
- [ ] Tenant resolution from:
  - [ ] Route parameter (`/api/v1/shops/{shop}/products`)
  - [ ] Request header (`X-Shop-Id`) for mobile convenience
- [ ] Plan enforcement service:
  - [ ] `PlanEnforcementService::canAdd(shop, resourceKey)` — mirrors the `canAdd()` logic from the shop Pinia store
  - [ ] `PlanEnforcementService::computeUsage(shop)` — live usage computation
  - [ ] Middleware `EnforcePlanLimits` for write operations

---

## Phase 2 — Core Business Modules

Build the domain logic and API endpoints for the primary business operations. Each module includes: service class, API controller, form requests, API resources, and tests.

### 2.1 Shop & Branch Management

- **Service:** `ShopService`
  - Create shop (with default branch, subscription assignment)
  - Update shop settings (name, address, tax config, receipt footer)
  - Shop logo upload via `spatie/laravel-medialibrary` (`shop-logos` collection on S3)
  - Delete shop (cascade, owner-only)
  - Branch CRUD within a shop
- **Endpoints:**
  - `GET/POST /shops`, `GET/PATCH/DELETE /shops/{shop}`
  - `GET/POST /shops/{shop}/branches`, `GET/PATCH/DELETE /shops/{shop}/branches/{branch}`
  - `GET /shops/{shop}/settings`, `PATCH /shops/{shop}/settings`
- **Business rules:**
  - Shop creation enforces plan limit (`canAdd('shops')`)
  - Branch creation enforces per-shop limit (`canAdd('branches')`)
  - Default branch auto-created with shop
  - Shop types: retail, wholesale, pharmacy, restaurant
  - 16 Ghana regions for address

### 2.2 Product Catalog

- **Service:** `ProductService`
  - Full CRUD with SKU uniqueness per shop
  - Barcode assignment, validation, and image generation via `picqer/php-barcode-generator` (Code128, EAN-13, UPC-A → SVG/PNG)
  - Stock status computation (`in_stock`, `low_stock`, `out_of_stock`)
  - Batch-tracked products with FEFO logic
  - Bulk import/export (CSV/Excel via `maatwebsite/excel` — chunked reads, queued jobs, validation with skip-on-failure)
  - Product search via Scout + Meilisearch
  - Auto-slug via `spatie/laravel-sluggable` (shop-scoped uniqueness)
- **Data class:** `ProductData` (from `spatie/laravel-data`) — single class handles validation, API serialization, and TypeScript type generation
- **Monetary fields** cast via `elegantly/laravel-money` (`MoneyCast::class.':GHS'`) on `cost_price`, `selling_price` — stores as bigint (pesewas), prevents float precision errors
- **Images:** Product images managed via `spatie/laravel-medialibrary` `product-images` collection on S3 with automatic thumbnail conversions
- **List endpoint filtering** via `spatie/laravel-query-builder`:
  - `?filter[status]=active&filter[category_id]=5&sort=-created_at&include=category,batches`
- **Endpoints:**
  - `GET/POST /shops/{shop}/products`, `GET/PATCH/DELETE /shops/{shop}/products/{product}`
  - `PATCH /shops/{shop}/products/{product}/price`
  - `GET/POST /shops/{shop}/products/{product}/batches`
  - `PATCH /shops/{shop}/products/{product}/batches/{batch}`
  - `POST /shops/{shop}/products/import`, `GET /shops/{shop}/products/export`
- **Business rules:**
  - Product creation enforces plan limit
  - Status auto-computed: `stock <= 0` → out_of_stock, `stock <= reorder` → low_stock
  - Barcode uniqueness per shop (partial index)
  - Price changes log to `price_history` table (old/new cost and selling price, changed_by, reason)
- **Price History:**
  - `PriceHistoryService` — auto-records every cost/selling price change
  - `GET /shops/{shop}/products/{product}/price-history` — paginated price change log

### 2.3 Categories & Units of Measure

- **Services:** `CategoryService`, `UnitService`
- **Endpoints:**
  - `GET/POST/PATCH/DELETE /shops/{shop}/categories/{category?}`
  - `GET/POST/PATCH/DELETE /shops/{shop}/units/{unit?}`
- **Business rules:**
  - Name uniqueness per shop (case-insensitive)
  - Category product count is computed (not stored)
  - Sort order for categories

### 2.4 Inventory Management

- **Service:** `InventoryService`
  - **Batch tracking (FEFO):**
    - Auto batch ID generation (`BT-NNN`)
    - Lot number generation (`LOT-YYYY-NNNN`)
    - Batch status computation (active/expired/depleted)
    - FEFO sorting for consumption
    - `updateProductFromBatches()` — recomputes stock, expiry, status
  - **Stock adjustments** (state machine via `spatie/laravel-model-states`):
    - States: `Pending`, `Approved`, `Rejected` — transitions enforce approval workflow
    - Transition class `ApproveAdjustment` fires `StockAdjusted` event and updates product stock
    - Quantity change (positive/negative)
  - **Stock transfers** (state machine via `spatie/laravel-model-states`):
    - States: `Pending`, `InTransit`, `Completed`, `Cancelled`
    - Transition class `CompleteTransfer` auto-updates source/destination stock
    - Create transfer between warehouses/branches
  - **Goods Receipts (ad-hoc receiving):**
    - `GoodsReceiptService` — receive goods outside of PO workflow
    - Receipt status lifecycle via state machine: `Draft → Completed → Cancelled`
    - Creates batches if product is batch-tracked
    - Updates product stock and product location quantities on completion
    - Receipt ID generation (`GR-YYYYMMDD-NNNN`)
    - Links items to supplier (optional)
- **Endpoints:**
  - `GET/POST /shops/{shop}/adjustments`, `POST /shops/{shop}/adjustments/{adj}/approve|reject`
  - `GET/POST /shops/{shop}/transfers`, `PATCH /shops/{shop}/transfers/{transfer}`
  - `GET/POST /shops/{shop}/goods-receipts`, `GET/PATCH /shops/{shop}/goods-receipts/{receipt}`
- **Events:**
  - `StockAdjusted` → update product stock, fire low-stock alert
  - `StockTransferred` → update locations, notifications
  - `LowStockDetected` → notification to relevant roles

### 2.5 Suppliers & Purchase Orders

- **Services:** `SupplierService`, `PurchaseOrderService`
- **Supplier endpoints:**
  - `GET/POST/PATCH/DELETE /shops/{shop}/suppliers/{supplier?}`
  - Supplier-product linking with unit costs and lead times
- **PO endpoints:**
  - `GET/POST /shops/{shop}/purchase-orders`
  - `GET/PATCH /shops/{shop}/purchase-orders/{po}`
  - `POST /shops/{shop}/purchase-orders/{po}/approve|receive|cancel`
- **PO lifecycle** (state machine via `spatie/laravel-model-states`):

  ```
  draft → pending → approved → shipped → partial → received
                                    └→ cancelled
  ```

  - 7 state classes: `Draft`, `Pending`, `Approved`, `Shipped`, `PartialReceived`, `Received`, `Cancelled`
  - Transition classes with side effects:
    - `ApprovePO` — fires `POApproved` event, notifies requester
    - `ReceivePO` — creates batches for batch-tracked products, updates stock quantities, tracks received vs ordered per line item
    - `CancelPO` — validates cancellable state, fires `POCancelled` event
  - `$po->status->canTransitionTo(Approved::class)` — guards UI and API
  - Cancel allowed from any pre-received status

- **Business rules:**
  - PO total = Σ(item.qty × item.unitCost)
  - Partial receive when receivedQty < orderedQty for any item
  - Supplier rating (1.0–5.0)
  - Plan limit enforcement for supplier count

### 2.6 Warehouse Management

- **Service:** `WarehouseService`
- **Endpoints:**
  - `GET/POST/PATCH /shops/{shop}/warehouses/{warehouse?}`
- **Business rules:**
  - Warehouse creation enforces plan limit
  - Zones as text array
  - Capacity tracking
  - Product location inventory (stock per product per warehouse/branch)

---

## Phase 3 — Sales & POS Engine

The transactional heart of the application. Requires careful attention to data integrity, stock management, and payment handling.

### 3.1 POS Core

- **Service:** `SaleService`
  - **Monetary fields** cast via `elegantly/laravel-money` — `subtotal`, `tax`, `discount_amount`, `total`, payment amounts all use `MoneyCast::class.':GHS'`
  - **Sale creation:**
    - Validate cart items (stock availability, pricing)
    - Apply discount (role-based limits per DISCOUNT_ROLE_LIMITS)
    - Calculate tax (read from `shops.tax_rate`, default 15% VAT for Ghana)
    - Decrement product stock (fix known gap #3)
    - Decrement batch quantities (FEFO order) for batch-tracked products
    - Generate receipt ID (`TXN-YYYYMMDD-NNNN`)
    - Generate verify token (12-char cryptographic)
    - Generate QR code for receipt verification via `simplesoftwareio/simple-qrcode` (encodes public `/verify/{token}` URL)
    - Record payment details per method
    - Update customer stats (totalSpent, visits, loyaltyPts)
    - Enforce plan transaction limit (checked via Pennant + `PlanEnforcementService`)
  - **Split payments:**
    - 2–4 payment entries
    - Sum must equal total (±0.01 tolerance)
    - Each split validated per payment method
  - **POS Held Orders (Retail):**
    - Uses `pos_held_orders` / `pos_held_order_items` tables (distinct from bar/kitchen held orders)
    - Park current cart + discount state
    - Recall to active cart
    - Discard with confirmation
- **Endpoints:**
  - `POST /shops/{shop}/sales` — create sale
  - `GET /shops/{shop}/sales` — list with filters (date range, status, cashier, branch)
  - `GET /shops/{shop}/sales/{sale}` — detail with items and payments
  - `POST/GET/DELETE /shops/{shop}/pos-held-orders`, `POST /shops/{shop}/pos-held-orders/{id}/recall`
- **Events:**
  - `SaleCompleted` → stock decrement, customer update, receipt generation, audit log
  - `DiscountApplied` → notification (high priority if ≥15%)

### 3.2 Sale Reversals

- **Reversal workflow:**
  - **Direct reversal** (owner/GM/manager — `pos_void: full`): immediate execution
  - **Request reversal** (salesperson — `pos_void: partial`): creates pending_reversal, notifies managers
  - **Approve/reject** (owner/GM/manager): processes or cancels the request
- **Reversal side effects (fix known gap #4):**
  - Restore product stock quantities
  - Restore batch quantities (reverse FEFO deductions)
  - Reverse customer stats (totalSpent, visits, loyaltyPts — clamped to 0)
  - Audit trail entry
- **Endpoints:**
  - `POST /shops/{shop}/sales/{sale}/reverse`
  - `POST /shops/{shop}/sales/{sale}/request-reversal`
  - `POST /shops/{shop}/sales/{sale}/approve-reversal`
  - `POST /shops/{shop}/sales/{sale}/reject-reversal`
- **Events:**
  - `ReversalRequested`, `ReversalApproved`, `ReversalRejected`, `ReversalExecuted`

### 3.3 Receipt Verification (Public)

- **Endpoint:** `GET /verify/{token}` — public, no auth
- Returns sale details for QR code verification
- Token lookup via indexed column

### 3.4 Sales Analytics

- **Service:** `SalesAnalyticsService`
  - Revenue by period (daily, weekly, monthly)
  - Top products by quantity and revenue
  - Sales by payment method
  - Sales by cashier
  - Sales by branch
  - Discount analysis
  - Feature-gated: `Feature::for($shop)->active('reports')` via Pennant (Free plan excluded)
- **Endpoints:**
  - `GET /shops/{shop}/sales/analytics` — with period and grouping params
  - Filtering via `spatie/laravel-query-builder`: `?filter[date_from]=...&filter[branch_id]=...&sort=-revenue`

### 3.5 Till Management

- **Service:** `TillService`
  - Open/close till sessions per branch
  - Track cash drawer (opening float, closing balance)
  - Associate sales with tills
- **Endpoints:**
  - `POST /shops/{shop}/branches/{branch}/tills/open`
  - `POST /shops/{shop}/tills/{till}/close`
  - `GET /shops/{shop}/tills` — active tills

---

## Phase 4 — Bar/Kitchen Operations

Real-time order flow between bar POS, kitchen display, and till management.

### 4.1 Kitchen Order System

- **Service:** `KitchenOrderService`
  - Place order from bar POS (linked to till and optional sale)
  - Order status lifecycle (state machine via `spatie/laravel-model-states`):
    ```
    pending → accepted → preparing → ready → served
                └→ rejected (with reason)
                              └→ returned (with reason)
                                        └→ cancelled (by authorized user)
    ```
  - Per-item status tracking via separate state machine (pending → preparing → ready → served → rejected)
  - Transition classes fire Reverb broadcast events for real-time kitchen display updates
  - Table number and order type (dine_in/takeaway)
- **Real-time broadcasting (Reverb):**
  - `KitchenOrderPlaced` → kitchen display updates
  - `KitchenOrderStatusChanged` → bar POS updates
  - `KitchenItemReady` → server notification
  - Channel: `private-shop.{shopId}.kitchen.{branchId}`
- **Endpoints:**
  - `POST /shops/{shop}/kitchen-orders`
  - `PATCH /shops/{shop}/kitchen-orders/{order}/status`
  - `PATCH /shops/{shop}/kitchen-orders/{order}/items/{item}/status`
  - `GET /shops/{shop}/branches/{branch}/kitchen-orders` — filtered by status

### 4.2 Bar POS Extensions

- Per-till ordering with separate kitchen/bar routing
- Products with `skip_kitchen = true` bypass kitchen queue
- Order grouping by table number

### 4.3 Bar Held Orders (Kitchen Context)

- Uses `held_orders` / `held_order_items` tables (distinct from retail POS `pos_held_orders`)
- Park in-progress bar orders per till
- Table assignment
- Label/note support
- Recall and resume workflow
- **Endpoints:**
  - `POST/GET/DELETE /shops/{shop}/held-orders`, `POST /shops/{shop}/held-orders/{id}/recall`

---

## Phase 5 — Customer Management

### 5.1 Customer CRM

- **Service:** `CustomerService`
  - CRUD with shop scoping
  - Customer types: regular, wholesale, walk-in
  - Loyalty points system (1 point per GH₵ 10 spent)
  - Purchase history aggregation (totalSpent, visits, lastVisit)
  - Customer search (name, phone, email)
- **Endpoints:**
  - `GET/POST/PATCH /shops/{shop}/customers/{customer?}`
  - `GET /shops/{shop}/customers/{customer}/purchases` — purchase history
- **Business rules:**
  - Points are incremental (added on sale, subtracted on reversal)
  - All decrements clamped to 0
  - Walk-in customers auto-created with minimal data
  - Phone search index for quick POS lookup

---

## Phase 6 — Team & Permissions

### 6.1 Team Management

- **Service:** `TeamService`
  - Invite member (email invitation flow)
  - Assign role per shop
  - Assign to branches within shop
  - Status management (active, invited, suspended, removed)
  - Role hierarchy enforcement (can't invite roles at/above own level)
- **Endpoints:**
  - `GET /shops/{shop}/team`
  - `POST /shops/{shop}/team/invite`
  - `PATCH /shops/{shop}/team/{member}/role`
  - `PATCH /shops/{shop}/team/{member}/status`
  - `PATCH /shops/{shop}/team/{member}/branches` — branch assignments
- **Business rules:**
  - Team count enforces plan limit
  - One role per user per shop
  - 12 shop roles with 36 permissions (4-level system: full/partial/view/none)
  - Roles: owner, general_manager, manager, bar_manager, waiter, kitchen_staff, inventory_manager, inventory_officer, salesperson, cashier, accountant, viewer
  - 13 permission modules: Products, POS, Purchase Orders, Inventory (adjustments), Inventory (transfers), Dashboard, Team, Settings, Suppliers, Categories, Units, Warehouses, Bar/Kitchen
  - Role hierarchy: owner > general_manager > manager > all others
  - General Manager role only available on Max plan

### 6.2 Invitation Flow

- Email invitation via Laravel notifications
- Invite link with signed URL
- Accept flow: existing user joins shop, new user registers then joins
- Invite expiry (configurable, default 7 days)

---

## Phase 7 — Notifications & Real-Time

### 7.1 Notification System

- **Service:** `NotificationService`
  - 7 notification categories: stock_alert, order_update, sale_event, approval_request, team_update, system, customer
  - 4 priority levels: low, medium, high, critical
  - 4 channels: in_app, push, email, sms
  - Role-based filtering (notifications targeted by role)
  - Actionable notifications (approve/reject/acknowledge)
  - User preferences (per-category channel config, quiet hours) stored in `notification_preferences` table
  - `NotificationPreference` model — per-user per-category channel toggles and quiet hours
- **Channels:**
  - **In-app:** Database-backed, Reverb broadcast for real-time delivery
  - **Push:** Firebase Cloud Messaging via `kreait/laravel-firebase` + `laravel-notification-channels/fcm` — integrates with Laravel notification pipeline (`toFcm()` method)
  - **Email:** Laravel mail (queued)
  - **SMS (primary):** Africa's Talking via `samuelmwangiw/africastalking-laravel` — Ghana-focused, covers MTN, Telecel, AirtelTigo networks
  - **SMS (fallback):** Twilio via `laravel-notification-channels/twilio` — international coverage
- **Endpoints:**
  - `GET /notifications` — filtered by role, category, read status
  - `PATCH /notifications/{id}/read`
  - `POST /notifications/mark-all-read`
  - `DELETE /notifications/{id}`
  - `POST /notifications/{id}/action` — approve/reject/acknowledge
  - `GET/PATCH /notifications/preferences`
- **Broadcasting channels (Reverb):**
  - `private-user.{userId}` — personal notifications
  - `private-shop.{shopId}.kitchen.{branchId}` — kitchen orders
  - `private-shop.{shopId}.pos` — POS events (sale completed, stock alerts)
  - `private-shop.{shopId}.inventory` — stock changes, transfer updates

### 7.2 Notification Triggers

| Event                      | Category         | Priority | Channels            | Target Roles                  |
| -------------------------- | ---------------- | -------- | ------------------- | ----------------------------- |
| Low stock alert            | stock_alert      | high     | in_app, push, email | owner, manager, inventory\_\* |
| Batch expiring soon        | stock_alert      | medium   | in_app              | owner, manager, inventory\_\* |
| Sale completed             | sale_event       | low      | in_app              | owner, manager                |
| Discount applied (≥15%)    | sale_event       | high     | in_app, push        | owner, manager                |
| Discount applied (<15%)    | sale_event       | medium   | in_app              | owner, manager                |
| Reversal requested         | approval_request | high     | in_app, push        | owner, manager, GM            |
| Reversal approved/rejected | sale_event       | medium   | in_app              | requester                     |
| PO status change           | order_update     | medium   | in_app              | po_create holders             |
| Adjustment pending         | approval_request | medium   | in_app              | adj_approve holders           |
| Team member joined         | team_update      | low      | in_app              | owner, manager                |
| Plan limit warning (≥80%)  | system           | high     | in_app, email       | owner                         |

---

## Phase 8 — Subscriptions & Billing

### 8.1 Plan System

- **Service:** `PlanService`
  - 3 default tiers: Free (GH₵0), Basic (GH₵49), Max (GH₵149)
  - Plan limits (8 resource keys): shops, branchesPerShop, teamPerShop, productsPerShop, monthlyTransactions, storageMB, suppliers, warehouses
  - Plan features (14 feature keys): pos, receipts, reports, barcode, purchaseOrders, stockTransfers, lowStockAlerts, twoFA, apiAccess, dataExport, customBranding, auditTrail, generalManager, support
  - Plan lifecycle: draft → scheduled → active → retiring → retired
  - Computed branch limit: `branchesPerShop × max(shopCount, 1)`

### 8.2 Subscription Management

- **Service:** `SubscriptionService`
  - One active subscription per shop (unique index)
  - Trial period: 14 days on Basic
  - Auto-renew with payment retry
  - Upgrade/downgrade with proration
  - Grace period for failed payments
  - Cancellation with end-of-period access
- **Endpoints:**
  - `GET /billing/plan` — current plan + usage
  - `POST /billing/upgrade` — plan change
  - `GET /billing/history`
  - `GET/POST/DELETE /billing/payment-methods/{method?}`

### 8.3 Payment Integration

- **Payment gateway:** Paystack (Ghana-focused, supports MoMo + card)
  - **Subscriptions:** `devtobi/cashier-paystack` — Cashier-style API for plan subscriptions (create, upgrade, downgrade, cancel, retry), webhook dispatching, payment method management
  - **One-time charges:** `unicodeveloper/laravel-paystack` — direct charge API for POS payments, MoMo channel support
  - Webhook handler for Paystack events (charge.success, subscription.disable, transfer.success, etc.)
  - Payment method tokenization via Cashier
- **Payment methods:**
  - Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Cash)
  - Card (Visa, Mastercard)

### 8.4 Usage Tracking

- **Service:** `UsageTrackingService`
  - Real-time counters cached in Redis:
    - `shop:{id}:products:count`
    - `shop:{id}:transactions:{month}:count`
    - `shop:{id}:team:count`
    - `shop:{id}:storage:bytes`
  - Cache invalidated on create/delete operations
  - Monthly transaction counter resets on billing cycle
  - Warning threshold: ≥80%, blocked: ≥100%
  - Decision maker vs non-decision maker enforcement (non-DMs never blocked)

### 8.5 Billing Exemptions

- **Service:** `BillingExemptionService`
  - Admin-granted resource exemptions that extend plan limits for specific shops
  - Each exemption: resource key, extra amount, unit (absolute/percentage), expiry date, reason
  - `PlanEnforcementService` incorporates active exemptions when computing effective limits
- **Model:** `BillingExemption` — shop_id, resource_key, extra_amount, exemption_unit, expires_at, granted_by, reason
- **Admin Endpoints:**
  - `GET/POST /admin/shops/{shop}/exemptions`
  - `PATCH/DELETE /admin/shops/{shop}/exemptions/{exemption}`

---

## Phase 9 — Admin Portal

Platform-level management for ShopChain staff. Separate route group with admin guard.

### 9.1 Admin Dashboard

- **Tabs (10):**
  1. **Overview** — Platform KPIs (total shops, users, MRR, active subscriptions)
  2. **Shops** — All shops with status, plan, owner, created date; suspend/unsuspend
  3. **Users** — All platform users with status management
  4. **Subscriptions** — MRR/ARPU metrics, plan breakdown, user subscription management
  5. **Finances** — Revenue, expenses, P&L, cash flow, projections (Ghana tax calculations)
  6. **Team** — Admin team CRUD (5 roles, 12 permissions)
  7. **Announcements** — Platform announcements to shop users (targeted by plan)
  8. **Investors** — Engagement metrics, growth analytics, cohort retention, investor deck with milestones (`milestones` table)
  9. **Audit/Fraud** — Audit log, investigations, anomaly detection, forensics sub-tab, detection rule CRUD (`detection_rules` table)
  10. **Settings** — Platform config (maintenance mode, registrations, trial, 2FA enforcement)

### 9.2 Admin Endpoints

All prefixed with `/api/v1/admin/`. Protected by admin guard + admin permission checks.

- **Users & Shops:** CRUD + status management + plan changes + billing exemptions (`billing_exemptions` CRUD)
- **Plans:** Full CRUD + lifecycle transitions + subscriber migration
- **Finances:** Dashboard, revenue, expenses CRUD (`admin_expenses` + `admin_expense_attachments`), cash flow, projections, P&L
- **Announcements:** CRUD + publish/unpublish
- **Investors:** Engagement metrics, cohort data, milestone CRUD (`milestones` table), investor deck generation
- **Audit:** Event listing with filters, investigation CRUD, anomaly management, detection rule CRUD (`detection_rules` table), forensics sub-tab
- **Team:** Admin member CRUD + role/status changes
- **Settings:** Platform configuration

### 9.3 Audit & Fraud Detection

- **Service:** `AuditService` (powered by `spatie/laravel-activitylog`)
  - Auto-log all significant actions via `LogsActivity` trait on models
  - Extends activitylog with custom properties: IP, device, session, risk score stored in `properties` JSON column
  - Before/after snapshots via `$activity->changes()` (built into activitylog)
  - Causer tracking automatic via `auth()->user()`
  - Categories: auth, financial, data, admin, system (logged via `->useLog('financial')` etc.)
- **Service:** `AnomalyDetectionService`
  - Configurable detection rules stored in `detection_rules` table (CRUD via admin endpoints)
  - Detection rule fields: name, description, category, conditions (JSONB), severity, is_active
  - Examples: unusual login patterns, high-value reversals, bulk deletions
  - Automatic investigation creation for high-severity anomalies
- **Forensics sub-tab:**
  - Deep-dive on individual shops with cross-referenced audit trail
  - Timeline reconstruction from audit events
- **Investigation workflow:**
  - open → in_progress → escalated → closed
  - Link audit events to investigations
  - Notes and findings tracking
  - Resolution recording

---

## Phase 10 — Settings & Account

### 10.1 Shop Settings

- **Settings storage** via `spatie/laravel-settings` — typed PHP setting classes with DB persistence:
  - `ShopProfileSettings` (group: `shop-profile`) — name, address, phone, email, tax_rate, receipt_footer
  - `ShopNotificationSettings` (group: `shop-notifications`) — per-category channel preferences, quiet hours
  - `ShopDiscountSettings` (group: `shop-discounts`) — role-based discount limits, max percentage
  - `PlatformSettings` (group: `platform`) — maintenance mode, registration toggle, trial days, 2FA enforcement
  - Settings classes injected directly into controllers/services: `public function __construct(ShopProfileSettings $settings)`
- **Tabs:**
  - Profile: name, address, phone, email, logo upload (via medialibrary), tax config
  - Branches: branch list, add/edit branch, operating hours, branch type
  - Notifications: per-category channel preferences
  - Security: 2FA settings, session management
  - Subscription: current plan, usage, upgrade
  - Usage: resource usage dashboard with progress bars
  - Integrations: API keys (Max plan), webhook configuration
  - Discount Settings: discount role limits, maximum discount percentage
  - Danger Zone: shop deletion (owner-only, requires confirmation)

### 10.2 User Account

- Profile editing (name, email, phone, avatar)
- Password change (requires current password)
- 2FA setup (TOTP with QR code, backup codes)
- Active sessions list with device/location/revoke
- Payment methods management
- Billing history

### 10.3 Two-Factor Authentication (via `laragear/two-factor`)

- TOTP-based (Google Authenticator, Authy compatible)
- QR code generation (built into package)
- Recovery codes (8 single-use codes, auto-generated)
- Attempt throttling (rate-limits 2FA verification attempts)
- Recovery flow with backup codes
- Admin can force 2FA platform-wide (via `PlatformSettings`)

---

## Phase 11 — Data Export & Reporting

### 11.1 Export System

- **Service:** `ExportService`
  - CSV export for: products, sales, customers, inventory, POs
  - PDF export via `spatie/laravel-pdf` (Chromium/Cloudflare renderer): receipts, sales reports, P&L statements — supports Tailwind CSS in templates
  - Excel export via `maatwebsite/excel`: bulk data (products, sales analytics) — chunked queued exports for large datasets
  - Exports processed via queue (non-blocking)
  - S3 storage with signed temporary URLs (via medialibrary or direct S3)
  - Plan-gated via Pennant: Free (none), Basic (CSV), Max (all formats)
- **Endpoints:**
  - `POST /shops/{shop}/exports` — create export job
  - `GET /shops/{shop}/exports/{export}` — check status / download

### 11.2 Dashboard Reporting

- **Service:** `DashboardService`
  - KPIs: revenue, sales count, average sale value, top products
  - Stock alerts: low stock, expiring batches
  - Recent activity feed
  - Period comparison (today vs yesterday, this week vs last week, etc.)

---

## Phase 12 — Frontend (Nuxt 4 + Vue 3)

Build the standalone Nuxt 4 web application that consumes the Laravel API over HTTP.

### 12.1 Application Foundation

- **`app.vue`** — root component with `<NuxtLayout>` and `<NuxtPage>`
- **`nuxt.config.ts`** — runtime config (API base URL, OAuth2 client ID, Reverb host), modules (`@nuxt/ui`, `@pinia/nuxt`, `@vueuse/nuxt`), TypeScript strict mode
- **Plugins:**
  - `plugins/api.ts` — `$fetch` wrapper with base URL from runtime config, automatic access token injection via `Authorization` header, 401 interceptor triggers token refresh
  - `plugins/echo.ts` — Laravel Echo + Pusher client configured for Reverb WebSocket server
- **Route middleware:**
  - `middleware/auth.ts` — redirects unauthenticated users to `/login`
  - `middleware/guest.ts` — redirects authenticated users to `/dashboard`
  - `middleware/shop.ts` — ensures a shop is selected; redirects to `/shops` if not
  - `middleware/permission.ts` — checks user's role permissions for the target page
- **Pinia stores:**
  - `stores/auth.ts` — user, tokens, login/logout, OAuth2 PKCE flow, token refresh
  - `stores/shop.ts` — active shop, branches, plan usage, `canAdd()`, `showLimitBlock()`
  - `stores/notification.ts` — notifications, unread count, mark-as-read
  - `stores/kitchen.ts` — tills, kitchen orders, held orders, payments (replaces `KitchenOrderContext`)
- **Composables:**
  - `composables/useBreakpoint.ts` — reactive breakpoint detection (sm/md/lg/xl/xl2)
  - `composables/useDebounce.ts` — debounced ref
  - `composables/usePagination.ts` — pagination state and helpers
  - `composables/useLocalStorage.ts` — reactive localStorage binding

### 12.2 Page Development Priority

Migrate pages in dependency order, matching the backend phase they depend on:

| Priority | Pages                                                  | Nuxt Route Path                                                       | Backend Phase          |
| -------- | ------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------- |
| 1        | Login, Register, Verify, Forgot, Reset                 | `pages/login.vue`, `pages/register.vue`, etc.                         | Phase 1 (Auth)         |
| 2        | ShopSelect, CreateShopWizard                           | `pages/shops/index.vue`, `pages/shops/create.vue`                     | Phase 2.1 (Shops)      |
| 3        | Dashboard                                              | `pages/dashboard.vue`                                                 | Phase 11.2 (Reporting) |
| 4        | Products, Categories, Units, AddProduct, ProductDetail | `pages/products/index.vue`, `pages/products/[id].vue`, etc.           | Phase 2.2–2.3          |
| 5        | POS, Sales, SalesAnalysis                              | `pages/pos.vue`, `pages/sales/index.vue`, etc.                        | Phase 3                |
| 6        | Inventory (Adjustments, Transfers, ReceiveOrders)      | `pages/inventory/adjustments.vue`, etc.                               | Phase 2.4              |
| 7        | Suppliers, SupplierDetail                              | `pages/suppliers/index.vue`, `pages/suppliers/[id].vue`               | Phase 2.5              |
| 8        | PurchaseOrders, PODetail                               | `pages/purchase-orders/index.vue`, `pages/purchase-orders/[id].vue`   | Phase 2.5              |
| 9        | Warehouses, WarehouseDetail                            | `pages/warehouses/index.vue`, `pages/warehouses/[id].vue`             | Phase 2.6              |
| 10       | Customers                                              | `pages/customers/index.vue`                                           | Phase 5                |
| 11       | Team, RolePermissions                                  | `pages/team/index.vue`, `pages/team/roles.vue`                        | Phase 6                |
| 12       | BarPOS, KitchenDisplay, TillManagement                 | `pages/bar-pos.vue`, `pages/kitchen.vue`, `pages/till-management.vue` | Phase 4                |
| 13       | Settings, Account                                      | `pages/settings.vue`, `pages/account.vue`                             | Phase 10               |
| 14       | Notifications                                          | `pages/notifications.vue`                                             | Phase 7                |
| 15       | Admin Portal (all tabs)                                | `pages/admin/index.vue` (tab-based)                                   | Phase 9                |
| 16       | SaleVerification (public)                              | `pages/verify/[token].vue`                                            | Phase 3.3              |

### 12.3 Context-to-Store Migration Map

| React Context         | Nuxt Replacement                        | Notes                                             |
| --------------------- | --------------------------------------- | ------------------------------------------------- |
| `ThemeContext`        | Nuxt color mode (`@nuxtjs/color-mode`)  | Theme persistence via cookie; Nuxt UI integration |
| `AuthContext`         | `stores/auth.ts` (Pinia)                | OAuth2 PKCE tokens; user/permissions from API     |
| `NavigationContext`   | Nuxt file-based routing (`useRouter()`) | URL-based navigation; no `PageId` string union    |
| `NotificationContext` | `stores/notification.ts` (Pinia)        | API-backed; real-time via Echo                    |
| `ShopContext`         | `stores/shop.ts` (Pinia)                | Plan usage computed server-side                   |
| `ToastContext`        | Nuxt UI `useToast()`                    | Built-in toast system with same type variants     |
| `KitchenOrderContext` | `stores/kitchen.ts` (Pinia)             | All till/order/kitchen state in one store         |
| `AppProviders`        | Nuxt plugins + Pinia stores             | No nested provider tree; auto-imported            |

### 12.4 Component Migration Strategy

- **Vue SFCs (`.vue`):** All components as Single-File Components with `<script setup lang="ts">`, `<template>`, and `<style scoped>`
- **Nuxt UI components:** Replace custom `components/ui/` primitives (Button, Input, Badge, Card, Modal, Select, etc.) with Nuxt UI v4 equivalents (`UButton`, `UInput`, `UBadge`, `UCard`, `UModal`, `USelect`, etc.) — Nuxt UI v4 is Reka UI-based with 125+ components; `U` prefix convention unchanged
- **Icons:** `lucide-vue-next` (drop-in replacement for `lucide-react`)
- **Conditional classes:** Vue's built-in `:class` binding replaces `clsx` — e.g., `:class="{ 'bg-primary': isActive, 'opacity-50': disabled }"`
- **Forms:** Nuxt UI form components with Zod validation schemas; replaces hand-written inline validation
- **Layouts:**
  - `layouts/default.vue` — main layout with sidebar, header, mobile nav (replaces `MainLayout.tsx`)
  - `layouts/auth.vue` — auth pages layout (login, register, etc.)
  - `layouts/admin.vue` — admin portal layout
- **Error handling:**
  - `error.vue` — global error page (replaces `ErrorBoundary`)
  - `app.vue` `onErrorCaptured` hook for logging
  - API plugin interceptor for HTTP error handling

### 12.5 TypeScript Types (via OpenAPI spec)

- Shared types between frontend and backend:
  - `dedoc/scramble` auto-generates OpenAPI 3.1 spec from API routes, Data classes, and Form Requests
  - `openapi-typescript` generates TypeScript type definitions from the OpenAPI spec
  - Pipeline: `php artisan scramble:export` → `openapi-typescript api.json -o types/api.d.ts`
  - Eliminates manual type drift between API responses and Vue TypeScript frontend
  - Add to CI pipeline: spec generation + type generation + `nuxi typecheck` to catch drift

### 12.6 Data Fetching Patterns

- **Server-side / initial load:** `useAsyncData` + `$fetch` for page-level data fetching with SSR support
- **Client-side mutations:** `$fetch` directly for POST/PATCH/DELETE operations with optimistic updates
- **Error handling:** API plugin interceptor catches 401 (refresh token), 403 (redirect or toast), 422 (validation errors), 5xx (error page)
- **Pagination:** `usePagination` composable wraps cursor/offset pagination from API
- **Caching:** Nuxt's built-in `useAsyncData` caching with key-based invalidation via `refreshNuxtData()`
- **Real-time updates:** Laravel Echo channel subscriptions in page `onMounted` hooks, updating Pinia stores on events

---

## Phase 13 — Mobile API Specifics

### 13.1 Mobile-Specific Considerations

- **API versioning:** `/api/v1/` prefix, version in header (`Accept: application/vnd.shopchain.v1+json`)
- **Pagination:** Cursor-based for infinite scroll (products, sales, notifications)
- **Image optimization:** Responsive image URLs with size parameters
- **Offline sync:**
  - Queue local sales when offline
  - Sync on reconnect with conflict resolution
  - Last-write-wins for inventory updates
- **Push notifications:** Firebase Cloud Messaging integration
  - Device token registration endpoint
  - Platform-specific payload formatting (iOS/Android)

### 13.2 Mobile-Specific Endpoints

- `POST /api/v1/devices` — register device for push notifications
- `DELETE /api/v1/devices/{token}` — unregister device
- `POST /api/v1/shops/{shop}/sales/sync` — bulk sync offline sales
- `GET /api/v1/shops/{shop}/products/sync` — delta sync (changed since timestamp)

---

## Phase 14 — Infrastructure & DevOps

### 14.1 Development Environment

**Laravel Sail** (Docker-based) with the following services:

```bash
# Initial project setup with Sail services
php artisan sail:install --with=pgsql,redis,meilisearch,minio,mailpit
```

| Service      | Image                            | Port(s)     | Purpose                                                              |
| ------------ | -------------------------------- | ----------- | -------------------------------------------------------------------- |
| `laravel`    | Sail PHP 8.3 (app container)     | 80          | API application, Artisan commands, queue workers                     |
| `pgsql`      | PostgreSQL 16                    | 5432        | Primary database (59 tables, RLS-enabled multi-tenancy)              |
| `redis`      | Redis 7                         | 6379        | Cache (sessions, plan usage counters, rate limiting), queue broker (Horizon), broadcasting backend |
| `meilisearch`| Meilisearch (latest)             | 7700        | Full-text search engine (Laravel Scout — products, barcodes, customers) |
| `minio`      | MinIO (S3-compatible)            | 9000 / 9001 | Local S3 storage (product images, logos, CSV/PDF exports, receipts, backups) |
| `mailpit`    | Mailpit                         | 1025 / 8025 | Email testing (SMTP capture + web UI for notification previews)      |

**Additional processes** (run alongside Sail, not separate containers):

| Process            | Command                        | Purpose                                                         |
| ------------------ | ------------------------------ | --------------------------------------------------------------- |
| Laravel Reverb     | `sail artisan reverb:start`    | WebSocket server (kitchen display, notifications, POS sync)     |
| Laravel Horizon    | `sail artisan horizon`         | Queue worker dashboard + supervisor (notifications, exports, batch jobs) |
| Nuxt 4 dev server  | `cd apps/web && npm run dev`   | Frontend dev server with HMR (runs outside Sail on host Node.js) |

**Key `.env` configuration for Sail:**

```env
# Database
DB_CONNECTION=pgsql
DB_HOST=pgsql
DB_PORT=5432
DB_DATABASE=shopchain

# Cache & Queue
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=redis

# Search
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://meilisearch:7700

# Storage (MinIO as S3)
FILESYSTEM_DISK=s3
AWS_ENDPOINT=http://minio:9000
AWS_USE_PATH_STYLE_ENDPOINT=true

# Mail
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025

# Broadcasting (Reverb)
BROADCAST_CONNECTION=reverb
REVERB_HOST=localhost
REVERB_PORT=8080

# CORS (allow Nuxt dev server)
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 14.2 Testing Strategy

- **Unit tests (backend):** Service classes, value objects, enums
- **Feature tests (backend):** API endpoints (full request/response cycle)
- **Integration tests (backend):** Multi-step workflows (PO → receive → stock update)
- **Unit tests (frontend):** Vitest + `@vue/test-utils` for Vue component and composable tests
- **E2E tests:** Playwright for critical user flows (replaces Laravel Dusk — runs against Nuxt app + API)
- **Test factories:** All 52 models with realistic fake data
- **CI pipeline:**
  - PHPStan static analysis
  - Pest test suite (backend)
  - Pint code style (backend)
  - `nuxi typecheck` (frontend TypeScript verification)
  - `php artisan scramble:export` + `openapi-typescript` (catch API/frontend type drift)
  - `nuxi build` (frontend build verification)
  - Vitest (frontend unit tests)
  - Playwright (E2E tests)

### 14.3 Deployment

- **API app:** Containerized (Docker), deployed to cloud VPS or managed platform
- **Web app:** Nuxt 4 deployed as Node.js SSR server (containerized) or pre-rendered static site (CDN)
- **Database:** Managed PostgreSQL (e.g., Supabase, AWS RDS, DigitalOcean)
- **Cache/Queue:** Managed Redis (e.g., Upstash, AWS ElastiCache)
- **Storage:** S3 or compatible (DigitalOcean Spaces, Cloudflare R2)
- **WebSockets:** Laravel Reverb on separate process/container
- **Search:** Managed Meilisearch or Meilisearch Cloud
- **Backups:** `spatie/laravel-backup` — scheduled daily via `backup:run`, PostgreSQL pg_dump + file system, stored to S3 with retention policies (7 daily, 4 weekly, 6 monthly), health monitoring via `backup:monitor`
- **Monitoring:** Laravel Telescope (dev), Sentry (production errors), Horizon (queue monitoring)

### 14.4 Security Checklist

- [ ] CORS configuration (API app — restrict to web app origin, no wildcards in production)
- [ ] Rate limiting on all endpoints
- [ ] Input validation via Form Requests on every endpoint
- [ ] SQL injection prevention (Eloquent parameterized queries)
- [ ] XSS prevention (Vue auto-escapes templates, API returns JSON; avoid `v-html` with user content)
- [ ] Token storage security (access token in memory, refresh token in httpOnly cookie via API proxy)
- [ ] File upload validation (type, size, malware scanning)
- [ ] Sensitive data encryption at rest (payment tokens, 2FA secrets)
- [ ] Audit logging for all sensitive operations
- [ ] RLS enforcement at database level
- [ ] Passport token expiry and refresh rotation
- [ ] Admin 2FA enforcement
- [ ] Secure headers (HSTS, CSP, X-Frame-Options)

---

## Phase Summary & Dependencies

```
Phase 1: Foundation ──────────────────────────────┐
  ├─ 1.1 Scaffolding                               │
  ├─ 1.2 Database                                   │
  ├─ 1.3 Models                                     │
  ├─ 1.4 Auth                                       │
  └─ 1.5 Multi-tenancy                              │
                                                     │
Phase 2: Core Business ──── depends on Phase 1 ─────┤
  ├─ 2.1 Shops & Branches                           │
  ├─ 2.2 Products                                    │
  ├─ 2.3 Categories & Units                          │
  ├─ 2.4 Inventory                                   │
  ├─ 2.5 Suppliers & POs                             │
  └─ 2.6 Warehouses                                  │
                                                     │
Phase 3: Sales & POS ──── depends on Phase 2 ───────┤
  ├─ 3.1 POS Core                                   │
  ├─ 3.2 Reversals                                   │
  ├─ 3.3 Verification                                │
  ├─ 3.4 Analytics                                   │
  └─ 3.5 Tills                                       │
                                                     │
Phase 4: Kitchen ──── depends on Phase 3 ───────────┤
  ├─ 4.1 Kitchen Orders                              │
  ├─ 4.2 Bar POS                                     │
  └─ 4.3 Held Orders                                 │
                                                     │
Phase 5: Customers ──── depends on Phase 3 ─────────┤ (can parallel with 4)
                                                     │
Phase 6: Team ──── depends on Phase 1 ──────────────┤ (can parallel with 2-5)
                                                     │
Phase 7: Notifications ──── depends on Phase 1 ─────┤ (can parallel, needed by 3+)
  (wire up event listeners progressively)            │
                                                     │
Phase 8: Billing ──── depends on Phase 1 ───────────┤ (can parallel with 2-5)
                                                     │
Phase 9: Admin ──── depends on Phase 1-8 ───────────┤
                                                     │
Phase 10: Settings ──── depends on Phase 1 ─────────┤ (can parallel)
                                                     │
Phase 11: Exports ──── depends on Phase 2-3 ────────┤
                                                     │
Phase 12: Frontend (Nuxt 4 + Vue 3) ── progressive ──┤
  (pages built as their backend phase completes)     │
                                                     │
Phase 13: Mobile API ──── inherits from Phase 2-9 ──┤
  (API endpoints built alongside each phase)         │
                                                     │
Phase 14: Infrastructure ──── Phase 1 + ongoing ─────┘
```

**Parallelizable work streams:**

- Phases 6, 7, 8, 10 can all start after Phase 1 is complete
- Phase 12 (Nuxt frontend) progresses incrementally as each backend phase completes
- Phase 13 (mobile API) is built alongside each phase (not a separate effort)
- Phase 14 (infra) starts at Phase 1 and evolves throughout

---

## Key Technical Risks

| Risk                              | Mitigation                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| RLS + Eloquent complexity         | Test tenant isolation thoroughly; global scopes as safety net alongside RLS                 |
| Stock integrity under concurrency | Database-level locks (`SELECT FOR UPDATE`) on stock mutation; queue serialization per shop  |
| Split payment validation          | Database transaction wrapping entire sale; all-or-nothing commit                            |
| Batch FEFO under concurrent sales | Lock product batches during sale processing; queue POS operations per branch                |
| Offline mobile sync conflicts     | Last-write-wins with server timestamp; conflict log for manual resolution                   |
| Plan enforcement race conditions  | Redis atomic counters for usage; check-and-increment in single operation                    |
| Large export files                | Queue-based generation; S3 streaming; signed URL expiry                                     |
| CORS misconfiguration             | Strict origin allowlist; no wildcards in production; test preflight requests in CI          |
| OAuth2 token security in SPA      | Access token in memory only (not localStorage); refresh via httpOnly cookie proxy endpoint  |
| SSR data fetching complexity      | Use `useAsyncData` with proper key management; avoid waterfall fetches; test SSR mode in CI |
| Kitchen real-time reliability     | Reverb with automatic reconnect; fallback polling; optimistic UI updates                    |

---

## Appendix: Endpoint Count Summary

| Module                                             | Endpoints |
| -------------------------------------------------- | --------- |
| Authentication                                     | 9         |
| Account & Profile                                  | 6         |
| Shops & Branches                                   | 10        |
| Products, Batches & Price History                  | 14        |
| Categories & Units                                 | 8         |
| Sales & POS (incl. POS Held Orders)                | 16        |
| Purchase Orders                                    | 7         |
| Inventory (adjustments, transfers, goods receipts) | 12        |
| Suppliers, Customers, Warehouses, Team             | 14        |
| Bar/Kitchen (orders, bar held orders)              | 8         |
| Notifications & Preferences                        | 9         |
| Billing, Subscriptions & Exemptions                | 10        |
| Admin (all groups incl. investors, forensics)      | ~50       |
| Mobile-specific                                    | 4         |
| **Total**                                          | **~177**  |
