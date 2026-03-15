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
- [x] Create `apps/api/` — Laravel 12 API application *(app bootstraps, middleware, rate-limiting all configured; CORS deferred to Phase 12)*
  - [x] Install Laravel Passport *(v13.6.0 — publishes migration tables: `oauth_auth_codes`, `oauth_access_tokens`, `oauth_refresh_tokens`, `oauth_clients`, `oauth_device_codes`)*
  - [x] Generate Passport encryption keys *(oauth-private.key, oauth-public.key)*
  - [x] Docker volume mount for `shopchain/core` symlink resolution *(compose.yaml: `../../packages:/var/packages`)*
  - [x] Run all migrations *(14 migrations: 3 framework, 1 Pennant, 5 Passport, 1 2FA, 3 activitylog, 1 permission)*
  - [x] Verify application bootstrap *(Laravel 12.54.1, PHP 8.5.3, all service providers load)*
  - [x] Verify all endpoints respond *(`/` → ShopChain v1.0.0, `/api/v1/health` → ok)*
  - [x] Verify test suite *(2/2 Pest tests pass)*
  - [x] Configure API-only middleware stack (no sessions, no CSRF) *(Laravel 12 `api` middleware group is stateless by default; `bootstrap/app.php` uses `withRouting(api: ...)`)*
  - [x] API versioning via route prefix (`/api/v1/`)
  - [x] Configure rate limiting (per-user, per-IP) *(auth: 5/min per IP, two-factor: 5/min per IP — defined in AppServiceProvider)*
- [x] Create `apps/web/` — Nuxt 4 standalone application *(verified: typecheck passes, production build succeeds, dev server responds)*
  - [x] Initialize with manual scaffolding (Nuxt 4 app dir convention)
  - [x] Install core modules: `@nuxt/ui`, `@pinia/nuxt`, `@vueuse/nuxt`
  - [x] Install `laravel-echo` + `pusher-js` for Reverb WebSocket client
  - [x] Configure `nuxt.config.ts`: runtime config for API base URL, OAuth2 client ID, Reverb host
  - [ ] Set up OAuth2 PKCE auth plugin (authorization code grant, token storage, refresh) *(deferred to Phase 12)*
  - [x] Set up file-based routing under `pages/`
  - [ ] Create route middleware: `auth`, `guest`, `shop`, `permission` *(deferred to Phase 12)*
  - [ ] Create API plugin (`$fetch` wrapper with base URL, token injection, error interceptors) *(deferred to Phase 12)*
- [ ] Configure CORS on API application to allow web app origin *(deferred to Phase 12 — needed when web app connects)*
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
  - [ ] GitHub Actions CI pipeline *(deferred to Phase 14)*

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

### 1.3 Eloquent Models (Shared Package) ✅ *(52 models complete — traits/data classes applied progressively in Phase 2+)*

Create all 52 models with relationships, scopes, accessors, and casts. *(complete — 52 models, traits, scopes, and casts in place)*

- [x] **Core Tenant & Identity:**
  - [x] `User` — relationships: shops (via shop_members), adminUser, paymentMethods, notifications *(in apps/api/app/Models/User.php with Passport, Spatie, and 2FA traits wired)*
  - [x] `Shop` — relationships: owner, branches, members, products, categories, units, suppliers, etc.
  - [x] `Branch` — relationships: shop, manager, members, tills, kitchenOrders
  - [x] `ShopMember` — relationships: user, shop, branchMembers; accessor for permissions
  - [x] `BranchMember` — relationships: member, branch

- [x] **Products & Inventory:**
  - [x] `Category`, `UnitOfMeasure`, `Product`, `Warehouse`, `ProductLocation`
  - [x] `Batch`, `StockAdjustment`, `StockTransfer`
  - [x] `PriceHistory` — tracks cost/selling price changes per product
  - [x] `GoodsReceipt`, `GoodsReceiptItem` — ad-hoc goods receiving outside PO workflow

- [x] **Suppliers & PO:**
  - [x] `Supplier`, `SupplierProduct`, `PurchaseOrder`, `POItem`

- [x] **Sales & POS:**
  - [x] `Customer`, `Till`, `TillPayment`, `Sale`, `SaleItem`, `SalePayment`
  - [x] `PosHeldOrder`, `PosHeldOrderItem` — retail POS held/parked carts

- [x] **Kitchen:**
  - [x] `KitchenOrder`, `KitchenOrderItem`, `HeldOrder`, `HeldOrderItem` — bar/kitchen held orders (distinct from retail POS held orders)

- [x] **Billing:**
  - [x] `Plan`, `Subscription`, `PaymentMethod`, `BillingRecord`
  - [x] `BillingExemption` — admin-granted exemptions (extra resources beyond plan limits)

- [x] **Admin & Audit:**
  - [x] `AdminUser`, `Announcement`, `AuditEvent`, `Investigation`
  - [x] `InvestigationEvent`, `InvestigationNote`, `Anomaly`, `AnomalyEvent`
  - [x] `DetectionRule` — configurable anomaly detection rules
  - [x] `AdminExpense`, `AdminExpenseAttachment` — platform operational expenses
  - [x] `Milestone` — investor-facing platform milestones

- [x] **Notifications:**
  - [x] `Notification`
  - [x] `NotificationPreference` — per-user per-category channel preferences

- [x] **Framework:**
  - [x] `Session` — database session storage (Laravel framework table)

- [x] Global scopes:
  - [x] `ShopScope` — auto-filters by `app.current_shop_id` for all shop-scoped models *(exists at `packages/shopchain-core/src/Scopes/ShopScope.php`)*
- Traits:
  - [x] `BelongsToShop` — common shop_id relationship + scope *(exists at `packages/shopchain-core/src/Traits/BelongsToShop.php`)*
  - [x] `HasShopRelationships` — shared shop relationship helpers *(exists at `packages/shopchain-core/src/Traits/HasShopRelationships.php`)*
  - [ ] `LogsActivity` (from `spatie/laravel-activitylog`) — replaces custom `HasAuditTrail`; auto-logs changes with before/after snapshots, causer, custom properties (IP, device, risk score) *(deferred — applied per-model as CRUD is built in Phase 2+)*
  - [ ] `HasStates` (from `spatie/laravel-model-states`) — on PurchaseOrder, Sale, KitchenOrder, KitchenOrderItem, StockTransfer, StockAdjustment, GoodsReceipt for declarative status lifecycles *(deferred — using simple enum validation with ValidationException pattern for now; `packages/shopchain-core/src/States/` is empty)*
  - [x] `HasRoles` (from `spatie/laravel-permission`) — on User/ShopMember with team scoping (team_id = shop_id) *(wired on User model in `apps/api/app/Models/User.php`)*
  - [ ] `InteractsWithMedia` (from `spatie/laravel-medialibrary`) — on Product, Shop, User for image/file uploads *(deferred — medialibrary not yet installed, Phase 2.1+)*
  - [x] `HasUuid` — UUID primary key generation *(covered by `BaseModel` using Laravel's `HasUuids` trait)*
- [x] Custom casts:
  - [x] `PostgresArray` — handles PostgreSQL array column casting *(exists at `packages/shopchain-core/src/Casts/PostgresArray.php`)*
  - [x] `PostgresEnumArray` — handles PostgreSQL enum array casting *(exists at `packages/shopchain-core/src/Casts/PostgresEnumArray.php`)*
- [ ] Data classes (from `spatie/laravel-data`) — *(deferred; Phase 2.1–2.3 use Form Requests + API Resources for consistency. Revisit when TypeScript generation matters in Phase 12.5. `packages/shopchain-core/src/Data/` stays empty.)*
  - [ ] Each Data class handles validation (inferred from types + attributes), serialization, and TypeScript generation
  - [ ] Examples: `ProductData`, `SaleData`, `PurchaseOrderData`, `CustomerData`, `ShopData`, etc.

### 1.4 Authentication & Authorization ✅ *(API auth complete — policies and web app auth deferred)*

- [x] **Passport setup (API app):** *(password grant enabled, password client config added, token issuance trait implemented)*
  - [ ] Personal access tokens for mobile clients *(deferred — mobile Phase 13)*
  - [ ] Authorization code grant for third-party integrations (Max plan API access) *(deferred — Phase 8)*
  - [x] First-party SPA client via password grant *(LoginController proxies credentials internally; `IssuesPassportTokens` trait handles token issuance/refresh)*
  - [x] Token scopes matching plan features *(14 scopes defined in AppServiceProvider)*
  - [x] Password grant enabled *(Passport::enablePasswordGrant() in AppServiceProvider)*
  - [x] Password client config *(config/passport.php: password_client.id/secret from env)*
  - [x] Rate limiting on auth endpoints *(auth: 5/min, two-factor: 5/min per IP)*

- [x] **API auth controllers & routes (14 endpoints):**
  - [x] `POST /auth/register` — register + shop + membership + default branch + role assignment in DB transaction → 201 + tokens
  - [x] `POST /auth/login` — credential validation with 2FA branching (cache-based temp token, 10-min TTL)
  - [x] `POST /auth/two-factor/verify` — pull from cache → validate TOTP → issue tokens (unauthenticated)
  - [x] `POST /auth/refresh` — proxy to Passport refresh_token grant
  - [x] `POST /auth/logout` — revoke access + refresh tokens, expire session
  - [x] `GET /auth/me` — user profile + shop memberships + 2FA status + admin status
  - [x] `POST /auth/two-factor/enable` — create TOTP auth → QR URI + secret + recovery codes
  - [x] `POST /auth/two-factor/confirm` — confirm with TOTP code → activates 2FA
  - [x] `DELETE /auth/two-factor` — disable 2FA (requires password)
  - [x] `GET /auth/two-factor/recovery-codes` — get current codes
  - [x] `POST /auth/two-factor/recovery-codes` — regenerate codes
  - [x] `POST /admin/auth/login` — admin login with admin status + 2FA verification
  - [x] `POST /admin/auth/two-factor/verify` — admin 2FA verify + admin check
  - [x] `POST /admin/auth/logout` — admin logout (auth:api + active_user + admin middleware)

- [x] **Middleware (5 aliases registered in bootstrap/app.php):**
  - [x] `EnsureActiveUser` — blocks non-active users (403), throttled `last_active_at` update (>5 min stale)
  - [x] `EnsureAdmin` — verifies `adminUser` relationship exists and is active
  - [x] `role` → Spatie RoleMiddleware
  - [x] `permission` → Spatie PermissionMiddleware
  - [x] `role_or_permission` → Spatie RoleOrPermissionMiddleware

- [x] **User model auth traits wired:**
  - [x] `HasApiTokens` (Passport) — `tokens()`, `createToken()`, `tokenCan()`
  - [x] `TwoFactorAuthentication` (Laragear) — `hasTwoFactorEnabled()`, `createTwoFactorAuth()`, `validateTwoFactorCode()`
  - [x] `HasRoles` (Spatie) — `assignRole()`, `hasRole()`, `hasPermissionTo()`
  - [x] `validateForPassportPasswordGrant()` — rejects non-active users at token issuance

- [x] **Form requests:** LoginRequest, RegisterRequest, TwoFactorVerifyRequest

- [ ] **Web app auth (Nuxt SPA via OAuth2 PKCE):** *(blocked — Nuxt auth plugin not yet built)*
  - [ ] Authorization code grant with PKCE (Proof Key for Code Exchange) — no client secret required
  - [ ] Nuxt auth plugin handles the OAuth2 flow: redirect to `/oauth/authorize`, exchange code for tokens
  - [ ] Access token stored in memory (not localStorage) for XSS protection; refresh token in secure httpOnly cookie via API proxy endpoint
  - [ ] Automatic token refresh via interceptor on 401 responses
  - [ ] Nuxt route middleware (`auth`) redirects unauthenticated users to login
  - [ ] Nuxt route middleware (`guest`) redirects authenticated users away from login/register

- [x] **Multi-tenancy middleware:** *(implemented in Phase 1.5)*
  - [x] `SetCurrentShop` — resolves shop from route parameter, sets `app.current_shop_id` on DB connection (container + PostgreSQL `set_config` + Spatie team scoping), Octane-safe cleanup
  - [x] `EnsureShopMember` — verifies the authenticated user is an active member of the requested shop, stores `ShopMember` on request attributes
  - [x] `EnsureBranchAccess` — verifies branch-level access; decision-makers (owner/GM/manager) bypass

- [ ] **RBAC via `spatie/laravel-permission` (team-scoped):** *(package configured, HasRoles trait wired, role assignment in register flow — policies not yet implemented)*
  - [x] Enable `'teams' => true` in config with `team_foreign_key = shop_id` — roles are scoped per shop
  - [x] Wildcard support: `products.*` grants all product sub-permissions *(enable_wildcard_permission = true)*
  - [x] Team-scoped role assignment in registration *(setPermissionsTeamId + assignRole('owner'))*
  - [ ] 4-level permission system modeled via permission granularity:
    - `full` → assign all sub-permissions (e.g., `products.view`, `products.edit`, `products.delete`, `products.price`)
    - `partial` → subset of sub-permissions (e.g., `products.view`, `products.edit` only)
    - `view` → read-only sub-permission (e.g., `products.view` only)
    - `none` → no permissions assigned for that module
  - [ ] Policy classes delegate to permission checks: *(13 of 15 done)*
    - [x] `ProductPolicy` *(products.view, products.edit, products.delete, products.price)*
    - [x] `CategoryPolicy` *(products.view, products.edit — no separate category permissions)*
    - [x] `UnitOfMeasurePolicy` *(products.view, products.edit — no separate unit permissions)*
    - [x] `WarehousePolicy` *(warehouses.view, warehouses.manage)*
    - [x] `StockAdjustmentPolicy` *(inventory.view, inventory.adjust, inventory.approve)*
    - [x] `StockTransferPolicy` *(inventory.view, inventory.transfer)*
    - [x] `GoodsReceiptPolicy` *(inventory.view, inventory.adjust)*
    - [x] `SupplierPolicy` *(suppliers.view, suppliers.edit, suppliers.delete)*
    - [x] `PurchaseOrderPolicy` *(purchase_orders.view, purchase_orders.create, purchase_orders.approve)*
    - [x] `SalePolicy` *(pos.access OR sales.view, pos.access for create)*
    - [x] `CustomerPolicy` *(customers.view, customers.edit, customers.delete)*
    - [x] `PosHeldOrderPolicy` *(pos.access)*
    - [x] `KitchenOrderPolicy` *(kitchen.view, kitchen.manage, pos.access)*
    - [ ] `TeamPolicy`, `SettingsPolicy`
    - [ ] `DashboardPolicy`
  - [ ] `AdminPolicy` — separate admin guard with 12 boolean admin permissions
  - [x] `isDecisionMaker` helper for plan limit enforcement: *(implemented in PlanEnforcementService + EnsureBranchAccess)*
    - Decision makers: roles with `isDecisionMaker = true` (owner, general_manager, manager)
    - Only decision makers are blocked by plan limits; non-decision-makers (salesperson, cashier, etc.) are never blocked
    - `PlanEnforcementService::canAdd()` returns `true` immediately for non-decision-maker roles

- [x] **Plan feature gating via `laravel/pennant`:** *(fully wired — resolvers read from `$shop->activePlan->features` with key mapping; `EnsureFeatureActive` middleware registered)*
  - [x] Define all 14 plan feature keys as Pennant features resolved from shop's active subscription:
    - `pos`, `receipts`, `reports`, `barcode`, `purchaseOrders`, `stockTransfers`, `lowStockAlerts`, `twoFA`, `apiAccess`, `dataExport`, `customBranding`, `auditTrail`, `generalManager`, `support`
  - [x] Usage: `Feature::for($shop)->active('api-access')` replaces scattered `if ($plan->features->apiAccess)` checks
  - [x] Rich values supported: `Feature::for($shop)->value('support')` can return `'email'`, `'priority'`, or `false`
  - [x] Route middleware: `EnsureFeatureActive` gates entire route groups behind plan features

- [x] **Admin authentication:** *(fully wired — guards, providers, controllers, routes, 2FA)*
  - [x] Separate guard for admin portal *(admin guard + admin_users provider in config/auth.php)*
  - [x] Admin auth controller with login/2FA verify/logout *(Admin\AuthController with EnsureAdmin middleware)*
  - [x] 2FA enforcement via `laragear/two-factor` *(cache-based 2FA flow with admin-prefixed tokens, last_login_at tracking)*

### 1.5 Multi-Tenancy Infrastructure ✅

- [x] Middleware stack for shop-scoped routes: *(5 middleware aliases registered in bootstrap/app.php: `set_shop`, `shop_member`, `branch_access`, `enforce_plan`, `feature`)*
  ```
  auth → active_user → set_shop → shop_member → [branch_access] → [enforce_plan:resource] → [feature:name]
  ```
- [x] Database-level RLS policies applied via migration (matches DATABASE-SCHEMA.md §RLS) *(done in Phase 1.2)*
- [x] Application-level tenant scoping via Eloquent global scopes as a safety net *(ShopScope + BelongsToShop trait from Phase 1.3)*
- [x] Tenant resolution from:
  - [x] Route parameter (`/api/v1/shops/{shop}/products`) *(route model binding resolves Shop instance)*
  - [ ] Request header (`X-Shop-Id`) for mobile convenience *(deferred to Phase 13)*
- [x] `SetCurrentShop` middleware — dual-layer tenant context: *(Laravel container `current_shop_id` + PostgreSQL `set_config('app.current_shop_id')` + Spatie `setPermissionsTeamId`; Octane-safe cleanup)*
- [x] `EnsureShopMember` middleware — verifies active shop membership via `withoutGlobalScopes()` query; stores `ShopMember` on request attributes
- [x] `EnsureBranchAccess` middleware — verifies branch assignment for non-decision-makers; owner/GM/manager bypass
- [x] `EnsureFeatureActive` middleware — parameterized Pennant feature flag check (`feature:api-access`)
- [x] Plan enforcement service:
  - [x] `PlanEnforcementService::canAdd(shop, resourceKey, member)` — non-decision-makers never blocked; checks plan limits vs live usage
  - [x] `PlanEnforcementService::computeUsage(shop)` — 8 resource counters (shops, branches, team, products, transactions, storage, suppliers, warehouses) with pct/warning/blocked
  - [x] Middleware `EnforcePlanLimits` — parameterized (`enforce_plan:productsPerShop`); delegates to `canAdd()`
- [x] Pennant feature resolvers wired to live plan data *(AppServiceProvider: key mapping from hyphenated Pennant names to camelCase plan JSONB keys; `support` returns rich values)*
- [x] `Shop` model — `activeSubscription()` HasOne, `billingExemptions()` HasMany, `activePlan` accessor (falls back to free plan)
- [x] Shop-scoped route group with `GET /api/v1/shops/{shop}/plan-usage` endpoint *(ShopController returns plan details + usage array + decision-maker status)*

---

## Phase 2 — Core Business Modules

Build the domain logic and API endpoints for the primary business operations. Each module includes: service class, API controller, form requests, API resources, and tests.

### 2.1 Shop & Branch Management ✅

- [x] **Service:** `ShopService` *(create with owner membership + default branch, update, updateSettings, delete, uploadLogo via direct S3, deleteLogo)*
- [x] **Service:** `BranchService` *(create, update, delete with default-branch guard)*
- [x] **Policies:** `ShopPolicy`, `BranchPolicy` *(registered in CoreServiceProvider)*
- [x] **Resources:** `ShopResource`, `BranchResource`, `ShopSettingsResource`
- [x] **Form Requests:** Shop (Create/Update/UpdateSettings/UploadLogo), Branch (Create/Update)
- [x] **Factories:** `ShopFactory`, `BranchFactory`, `ShopMemberFactory`
- [x] **Endpoints (10):**
  - `GET/POST /shops`, `GET/PATCH/DELETE /shops/{shop}`
  - `GET/POST /shops/{shop}/branches`, `GET/PATCH/DELETE /shops/{shop}/branches/{branch}`
  - `GET/PATCH /shops/{shop}/settings`, `POST/DELETE /shops/{shop}/logo`, `GET /shops/{shop}/plan-usage`
- [x] **Tests:** ShopCrudTest (12), ShopSettingsTest (5), BranchCrudTest (8) — 25 tests passing
- [x] **Business rules:** plan limit enforcement on shop + branch creation, default branch auto-created, logo upload via direct S3

### 2.2 Product Catalog ✅

- [x] **Service:** `ProductService` *(createProduct, updateProduct, deleteProduct with S3 image cleanup, updatePrice with PriceHistory recording, uploadImage, deleteImage — follows ShopService::uploadLogo() pattern)*
- [x] **Policy:** `ProductPolicy` *(viewAny/view → products.view, create/update → products.edit, delete → products.delete, updatePrice → products.price)*
- [x] **Resources:** `ProductResource` (with whenLoaded category/unit, whenCounted batches), `BatchResource`, `PriceHistoryResource`
- [x] **Form Requests:** Product (Create/Update/UpdatePrice/UploadImage), Batch (Create/Update) — shop-scoped uniqueness on SKU and batch_number
- [x] **Factories:** `ProductFactory` (states: lowStock, outOfStock, batchTracked), `BatchFactory` (states: expired, depleted, withExpiry)
- [x] **List endpoint filtering** via `spatie/laravel-query-builder` *(first usage — sets pattern for all future list endpoints)*:
  - `AllowedFilter::exact('status')` for PostgreSQL enum columns, `AllowedFilter::partial('name')` for text search
  - `?filter[status]=in_stock&filter[category_id]=...&sort=-price&include=category,unit`
- [x] **Endpoints (15):**
  - `GET/POST /shops/{shop}/products`, `GET/PUT|PATCH/DELETE /shops/{shop}/products/{product}`
  - `PATCH /shops/{shop}/products/{product}/price`
  - `GET /shops/{shop}/products/{product}/price-history`
  - `GET/POST /shops/{shop}/products/{product}/batches`
  - `PATCH /shops/{shop}/products/{product}/batches/{batch}` (scopeBindings)
  - [ ] `POST /shops/{shop}/products/import`, `GET /shops/{shop}/products/export` *(deferred to Phase 2.2b — requires maatwebsite/excel)*
- [x] **Tests:** ProductCrudTest (16), ProductPriceTest (4), BatchTest (5) — 25 tests passing
- [x] **Business rules:**
  - [x] Product creation enforces plan limit (`enforce_plan:productsPerShop` middleware)
  - [x] SKU uniqueness per shop (cross-shop allowed)
  - [x] Price changes log to `price_history` table (old/new price/cost, changed_by, reason)
  - [x] Batch FEFO ordering (expiry ASC NULLS LAST)
  - [x] initial_quantity auto-set on batch creation
  - [x] Permission-based access: viewer can view, manager can edit (not delete/price), owner has full access
- **Deferred items:**
  - [ ] Barcode image generation via `picqer/php-barcode-generator` *(API stores barcode string; generation is display concern)*
  - [ ] Product search via Scout + Meilisearch *(deferred to later phase)*
  - [ ] Bulk import/export via `maatwebsite/excel` *(deferred to Phase 2.2b or Phase 11)*
  - [ ] `spatie/laravel-medialibrary` for image management *(using direct S3 upload pattern instead)*
  - [ ] `elegantly/laravel-money` for monetary casting *(current decimal:2 casts work; DB uses NUMERIC(12,2))*
  - [ ] `spatie/laravel-sluggable` *(no slug column in products migration)*
  - [ ] `spatie/laravel-data` ProductData class *(using Form Requests + API Resources for consistency with Phase 2.1)*
  - [ ] Auto-computed stock status *(status set manually; auto-computation deferred to Phase 2.4 inventory integration)*

### 2.3 Categories & Units of Measure ✅

- [x] **Services:** `CategoryService` *(create, update, delete with products-exist guard)*, `UnitOfMeasureService` *(create, update, delete with products-exist guard)*
- [x] **Policies:** `CategoryPolicy`, `UnitOfMeasurePolicy` *(both use products.view/products.edit — no separate permissions)*
- [x] **Resources:** `CategoryResource` (with whenCounted products), `UnitOfMeasureResource` (with whenCounted products)
- [x] **Form Requests:** Category (Create/Update — name unique per shop), Unit (Create/Update — abbreviation unique per shop, UnitType enum validation)
- [x] **Factories:** `CategoryFactory` (state: inactive), `UnitOfMeasureFactory`
- [x] **Endpoints (10):**
  - `GET/POST /shops/{shop}/categories`, `GET/PUT|PATCH/DELETE /shops/{shop}/categories/{category}`
  - `GET/POST /shops/{shop}/units`, `GET/PUT|PATCH/DELETE /shops/{shop}/units/{unit}`
- [x] **Tests:** CategoryCrudTest (8), UnitCrudTest (7) — 15 tests passing
- [x] **Business rules:**
  - [x] Name uniqueness per shop (categories), abbreviation uniqueness per shop (units)
  - [x] Cannot delete category or unit that has associated products (ValidationException)
  - [x] Category product count computed via withCount (not stored)
  - [x] Categories ordered by sort_order then name; units ordered by name

### 2.4 Inventory Management ✅

- [x] **Services:** `StockAdjustmentService` *(create with Pending status, approve with ProductLocation update in transaction, reject with reason appended to notes)*, `StockTransferService` *(create with source stock validation, ship Pending→InTransit, complete InTransit→Completed with source decrement + dest increment in transaction, cancel non-completed)*, `GoodsReceiptService` *(create with auto-generated reference + items in transaction, complete with batch creation for batch-tracked products + ProductLocation updates)*
- [x] **Policies:** `StockAdjustmentPolicy` *(viewAny/view → inventory.view, create → inventory.adjust, approve/reject → inventory.approve)*, `StockTransferPolicy` *(viewAny/view → inventory.view, create/update → inventory.transfer)*, `GoodsReceiptPolicy` *(viewAny/view → inventory.view, create/update → inventory.adjust)*
- [x] **Resources:** `StockAdjustmentResource` (with whenLoaded product/warehouse/branch/creator/approver), `StockTransferResource` (with whenLoaded product/fromWarehouse/toWarehouse/fromBranch/toBranch/creator), `GoodsReceiptResource` (with whenLoaded warehouse/creator/items, whenCounted items), `GoodsReceiptItemResource`, `ProductLocationResource`
- [x] **Form Requests:** Adjustment (Create/Reject), Transfer (Create with after() source/dest validation, Update with action dispatch), GoodsReceipt (Create with items array, Update with optional complete action)
- [x] **Factories:** `StockAdjustmentFactory` (states: approved, rejected, damage, theft), `StockTransferFactory` (states: inTransit, completed, cancelled), `GoodsReceiptFactory` (state: completed)
- [x] **Endpoints (13):**
  - `GET/POST /shops/{shop}/adjustments`, `GET /shops/{shop}/adjustments/{adjustment}`
  - `POST /shops/{shop}/adjustments/{adjustment}/approve|reject`
  - `GET/POST /shops/{shop}/transfers`, `GET/PATCH /shops/{shop}/transfers/{transfer}`
  - `GET/POST /shops/{shop}/goods-receipts`, `GET/PATCH /shops/{shop}/goods-receipts/{receipt}`
  - Route model bindings: `{adjustment}` → StockAdjustment, `{transfer}` → StockTransfer, `{receipt}` → GoodsReceipt
- [x] **Tests:** StockAdjustmentTest (9), StockTransferTest (9), GoodsReceiptTest (8) — 26 tests passing
- [x] **Business rules:**
  - [x] Stock adjustments use explicit service methods with status checks (no state machine — 3 states too simple)
  - [x] Approve creates/updates ProductLocation via firstOrCreate + increment in DB transaction
  - [x] Reject appends rejection reason to notes field
  - [x] Transfer creation validates source ProductLocation has sufficient stock
  - [x] Transfer completion decrements source and increments/creates destination ProductLocation in transaction
  - [x] Cancel allowed from any status except Completed
  - [x] Goods receipt auto-generates sequential references (`GR-YYYYMMDD-NNNN`) per shop per day
  - [x] Completion creates Batch records for batch-tracked products with batch_number
  - [x] Completion updates/creates ProductLocation quantities per item
  - [x] QueryBuilder filtering on all list endpoints (status, product_id, type, warehouse_id, branch_id)
  - [x] Permission-based access: viewer can view only, inventory_officer can adjust/transfer but not approve, owner/manager have full access
- **Deferred items:**
  - [ ] `StockAdjusted`/`StockTransferred`/`LowStockDetected` events *(deferred to Phase 7 — no listeners exist yet)*
  - [ ] State machines via `spatie/laravel-model-states` *(not adopted — explicit service methods + status checks sufficient for all Phase 2 modules)*
  - [x] Batch tracking FEFO integration *(implemented in Phase 3.1 SaleService — consume oldest-expiry-first, mark Depleted when qty=0, link first batch to SaleItem.batch_id)*
  - [ ] Auto-computed product stock status from ProductLocation totals *(deferred)*

### 2.5 Suppliers & Purchase Orders ✅

- [x] **Services:** `SupplierService` *(create, update, delete with purchase-orders-exist guard, linkProduct via SupplierProduct::updateOrCreate, unlinkProduct)*, `PurchaseOrderService` *(createPO with items in transaction, submitPO Draft→Pending, approvePO Pending→Approved with approved_by, markShipped Approved→Shipped, receivePO Shipped|Partial→Partial|Received with ProductLocation updates + Batch creation, cancelPO with received/partial guard)*
- [x] **Policies:** `SupplierPolicy` *(viewAny/view → suppliers.view, create/update → suppliers.edit, delete → suppliers.delete)*, `PurchaseOrderPolicy` *(viewAny/view → purchase_orders.view, create/update → purchase_orders.create, approve → purchase_orders.approve)*
- [x] **Resources:** `SupplierResource` (with whenCounted products/purchaseOrders, whenLoaded products → SupplierProductResource), `SupplierProductResource` (id, name, sku + pivot data), `PurchaseOrderResource` (with whenLoaded supplier/warehouse/creator/approver/items, whenCounted items), `POItemResource` (with whenLoaded product/unit)
- [x] **Form Requests:** Supplier (Create/Update — name unique per shop, SupplierStatus enum), LinkSupplierProduct (product_id shop-scoped, unit_cost, lead_time_days, is_preferred), PurchaseOrder (Create with items array — supplier_id/warehouse_id shop-scoped, PaymentTerms enum), ReceivePurchaseOrder (items with po_item_id, quantity_received, batch_number)
- [x] **Factories:** `SupplierFactory` (state: inactive), `PurchaseOrderFactory` (states: pending, approved, shipped, partial, received, cancelled)
- [x] **Endpoints (16):**
  - `GET/POST /shops/{shop}/suppliers`, `GET/PUT|PATCH/DELETE /shops/{shop}/suppliers/{supplier}`
  - `GET/POST /shops/{shop}/suppliers/{supplier}/products`, `DELETE /shops/{shop}/suppliers/{supplier}/products/{product}`
  - `GET/POST /shops/{shop}/purchase-orders`, `GET /shops/{shop}/purchase-orders/{po}`
  - `POST /shops/{shop}/purchase-orders/{po}/submit|approve|ship|receive|cancel`
  - Route model binding: `{po}` → PurchaseOrder
  - Supplier creation enforces plan limit via `enforce_plan:suppliers` middleware
- [x] **Tests:** SupplierCrudTest (12), PurchaseOrderTest (16) — 28 tests passing
- [x] **Business rules:**
  - [x] No state machines — PO lifecycle managed via explicit service methods + status checks (consistent with Phases 2.1-2.4)
  - [x] No events — POApproved/POCancelled deferred to Phase 7
  - [x] Dedicated POST endpoints for each PO lifecycle transition (submit/approve/ship/receive/cancel) with per-action authorization
  - [x] Receive updates ProductLocation via firstOrCreate + increment (same pattern as GoodsReceiptService)
  - [x] Receive creates Batch records for batch-tracked products with source_po_id linkage
  - [x] Receive caps quantity_received at quantity_ordered per item; all items fully received → Received, else → Partial
  - [x] Cancel blocked for Received/Partial status (stock already updated)
  - [x] Supplier deletion blocked when purchase orders exist
  - [x] Plan limit enforcement for supplier count (free=5, basic=50, max=unlimited)
  - [x] Supplier-product linking via SupplierProduct model (UUID pivot table — uses model directly, not belongsToMany attach/sync)
  - [x] QueryBuilder filtering on list endpoints (status, supplier_id, warehouse_id, name partial)
  - [x] Permission-based access: viewer can view only, inventory_officer cannot approve POs, owner/manager have full access
- **Deferred items:**
  - [ ] `POApproved`/`POCancelled` events *(deferred to Phase 7 — no listeners exist yet)*
  - [ ] State machines via `spatie/laravel-model-states` *(7 states manageable with service methods + explicit checks)*
  - [ ] PO total computation Σ(item.qty × item.unitCost) *(no total column in migration; compute on read if needed)*

### 2.6 Warehouse Management ✅

- [x] **Service:** `WarehouseService` *(create, update, delete with stock-exists guard — rejects deletion if ProductLocations with quantity > 0 exist)*
- [x] **Policy:** `WarehousePolicy` *(viewAny/view → warehouses.view, create/update/delete → warehouses.manage)*
- [x] **Resource:** `WarehouseResource` (with whenCounted productLocations)
- [x] **Form Requests:** Warehouse (Create/Update — name unique per shop, WarehouseType/WarehouseStatus enum validation, zones array)
- [x] **Factory:** `WarehouseFactory` (states: inactive, secondary)
- [x] **Endpoints (5):**
  - `GET/POST /shops/{shop}/warehouses`, `GET/PUT|PATCH/DELETE /shops/{shop}/warehouses/{warehouse}`
  - Warehouse creation enforces plan limit via `enforce_plan:warehouses` middleware
- [x] **Tests:** WarehouseCrudTest (8) — 8 tests passing
- [x] **Business rules:**
  - [x] Warehouse creation enforces plan limit (free=0, basic=1, max=unlimited)
  - [x] Unique warehouse name per shop
  - [x] Cannot delete warehouse with stock (ProductLocations with quantity > 0)
  - [x] Zones as text array, capacity as integer
  - [x] Permission-based access: viewer can view only, manager/inventory_manager can manage

---

## Phase 3 — Sales & POS Engine

The transactional heart of the application. Requires careful attention to data integrity, stock management, and payment handling.

### 3.1 POS Core — Sales, Customers & Held Orders ✅

- [x] **Service:** `SaleService` *(createSale in DB::transaction — validates stock at branch, computes subtotal/tax/discount/total, validates payments, creates Sale + SaleItems + SalePayments, decrements ProductLocation stock, consumes batches FEFO, updates customer stats)*
  - [x] **Monetary fields** use `decimal:2` casts *(consistent with Phases 2.1-2.5; `elegantly/laravel-money` not adopted)*
  - [x] **Sale creation:**
    - [x] Validate cart items (ProductLocation stock at branch_id)
    - [x] Apply discount (percent or fixed, clamped to subtotal; discount accepted if user has `pos.discount` permission — no role-based limits yet)
    - [x] Calculate tax from `shops.tax_rate` (default 15% VAT for Ghana)
    - [x] Decrement ProductLocation stock per item at branch
    - [x] Decrement batch quantities FEFO for batch-tracked products (consume oldest-expiry-first, mark Depleted when qty reaches 0, link first batch to SaleItem.batch_id)
    - [x] Generate verify_token (Str::random(12)) *(no QR code generation — frontend concern)*
    - [x] Record payment details per method (cash with change, card with card_type, momo with provider/phone)
    - [x] Update customer stats (increment visits, total_spent, loyalty_pts=floor(total/10), set last_visit)
    - [x] Plan transaction limit enforced via `enforce_plan:monthlyTransactions` middleware
  - [x] **Split payments:**
    - [x] 2–4 payment entries (N separate SalePayment rows, not a parent Split row)
    - [x] Sum must equal total (±0.01 tolerance)
    - [x] Each split validated per payment method
    - [x] Plan feature check: `$shop->activePlan->features['pos']` must equal `'full_split'` (Max plan only)
  - [x] **POS Held Orders (Retail):**
    - [x] Uses `pos_held_orders` / `pos_held_order_items` tables (distinct from bar/kitchen held orders)
    - [x] Park current cart + discount state
    - [x] Recall to active cart (returns data then deletes)
    - [x] Discard (delete)
- [x] **Service:** `CustomerService` *(createCustomer with shop_id + default Regular type, updateCustomer, deleteCustomer with sales-exist guard)*
- [x] **Policies:** `SalePolicy` *(viewAny/view → pos.access OR sales.view, create → pos.access)*, `CustomerPolicy` *(viewAny/view → customers.view, create/update → customers.edit, delete → customers.delete)*, `PosHeldOrderPolicy` *(viewAny/view/create/delete → pos.access)*
- [x] **Resources:** `SaleResource` (with branch, cashier, customer, items, payments, items_count), `SaleItemResource` (with product id/name/sku), `SalePaymentResource`, `CustomerResource` (with sales_count), `PosHeldOrderResource` (with heldBy, items with product)
- [x] **Form Requests:** CreateSaleRequest (branch/till/customer shop-scoped, items array, payment_method enum, splits validation), CreateCustomerRequest/UpdateCustomerRequest (phone unique per shop), CreatePosHeldOrderRequest
- [x] **Factories:** `CustomerFactory` (states: wholesale, walkIn), `SaleFactory` (states: reversed, pendingReversal), `SalePaymentFactory` (states: card, momo), `PosHeldOrderFactory`
- [x] **Endpoints (14):**
  - `GET/POST /shops/{shop}/sales`, `GET /shops/{shop}/sales/{sale}`
  - `GET/POST/GET/PUT|PATCH/DELETE /shops/{shop}/customers` (apiResource)
  - `GET/POST /shops/{shop}/pos-held-orders`, `GET /shops/{shop}/pos-held-orders/{posHeldOrder}`
  - `POST /shops/{shop}/pos-held-orders/{posHeldOrder}/recall`, `DELETE /shops/{shop}/pos-held-orders/{posHeldOrder}`
- [x] **Tests:** SaleCrudTest (18), CustomerCrudTest (10), PosHeldOrderTest (8) — 36 tests passing
- [x] **Business rules:**
  - [x] `till_id` nullable — full till management deferred
  - [x] Stock must be at the branch to sell (ProductLocation where branch_id = sale.branch_id)
  - [x] Cash payment rejected when amount_tendered < total
  - [x] Split payments only on Max plan (pos feature = 'full_split')
  - [x] Customer deletion blocked when sales exist
  - [x] Phone uniqueness per shop for customers
  - [x] Loyalty points: floor(total / 10) — 1 point per GHS 10 spent
  - [x] No events — SaleCompleted/DiscountApplied deferred to Phase 7
  - [x] No role-based discount limits — DISCOUNT_ROLE_LIMITS config doesn't exist yet
  - [x] No QR code generation — API stores verify_token only; QR is frontend concern
- **Deferred items:**
  - [ ] `SaleCompleted`/`DiscountApplied` events *(deferred to Phase 7 — all side-effects handled inline in SaleService)*
  - [ ] Receipt ID generation (`TXN-YYYYMMDD-NNNN`) *(not in current migration schema)*
  - [ ] QR code generation via `simplesoftwareio/simple-qrcode` *(frontend concern)*
  - [ ] Role-based discount limits *(DISCOUNT_ROLE_LIMITS config doesn't exist yet)*
  - [ ] Customer purchase history endpoint *(deferred)*
  - [ ] Customer search via Scout + Meilisearch *(deferred)*

### 3.2 Sale Reversals ✅

- [x] **Reversal workflow:**
  - [x] **Direct reversal** (owner/GM/manager — `pos_void: full`): immediate execution
  - [x] **Request reversal** (salesperson — `pos_void: partial`): creates pending_reversal
  - [x] **Approve/reject** (owner/GM/manager): processes or cancels the request
- [x] **Reversal side effects:**
  - [x] Restore ProductLocation stock quantities
  - [x] Restore batch quantities (reverse FEFO deductions, reactivate depleted batches)
  - [x] Reverse customer stats (totalSpent, visits, loyaltyPts — clamped to 0)
- [x] **Service:** `SaleService` *(reverseSale, requestReversal, approveReversal, rejectReversal, executeReversal — all in DB::transaction)*
- [x] **Policy:** `SalePolicy` *(reverse → pos_void: full, requestReversal → pos_void: partial, approveReversal/rejectReversal → pos_void: full)*
- [x] **Form Requests:** `ReverseSaleRequest`, `RequestReversalRequest` *(reason required)*
- [x] **Endpoints (4):**
  - `POST /shops/{shop}/sales/{sale}/reverse`
  - `POST /shops/{shop}/sales/{sale}/request-reversal`
  - `POST /shops/{shop}/sales/{sale}/approve-reversal`
  - `POST /shops/{shop}/sales/{sale}/reject-reversal`
- [x] **Tests:** SaleReversalTest (14) — all passing
- **Deferred items:**
  - [ ] `ReversalRequested`/`ReversalApproved`/`ReversalRejected`/`ReversalExecuted` events *(deferred to Phase 7)*
  - [ ] Audit trail entry *(deferred to Phase 7 — spatie/laravel-activitylog)*

### 3.3 Receipt Verification (Public) ✅

- [x] **Migration:** Unique index on `sales.verify_token` for efficient lookups and data integrity
- [x] **Endpoint:** `GET /api/v1/verify/{token}` — public, no auth, rate-limited (30 req/min per IP via `throttle:receipt-verify`)
- [x] **Controller:** `SaleVerificationController` *(invokable, uses `Sale::withoutGlobalScopes()` for tenant-free lookup)*
- [x] **Resource:** `SaleVerificationResource` *(privacy-safe — no IDs, no internal fields exposed)*
  - [x] Customer name masking ("Kwame Boateng" → "Kwame B.", single names returned as-is, null → null)
  - [x] Payment method safe labels: Cash → "Cash", Card → "Card", Momo → "Mobile Money", multiple → "Split Payment"
  - [x] Discount/discount_type only included when discount > 0
  - [x] Reversal fields always present (null when not applicable)
  - [x] Items with product name, quantity, unit_price, line_total
- [x] **Tests:** SaleVerificationTest (11) — all passing
  - Valid token, reversed sale, pending-reversal sale, name masking, null customer, payment method labels, sensitive field exclusion, 404 for invalid token, no auth required, item details, name masking edge cases

### 3.4 Sales Analytics

- [x] **Service:** `SalesAnalyticsService` — single `getAnalytics(Shop, ?branchId)` method returning all dashboard data
  - [x] KPIs: today's revenue (+ % change vs yesterday), transactions, avg order value, items sold, discounts given (+ % of gross)
  - [x] Period comparison: today/yesterday/this_week/this_month with revenue, transactions, items_sold, discounts
  - [x] Charts: 7-day revenue trend, payment method breakdown, hourly distribution (6–22h with peak), top 10 products by quantity, customer mix (registered vs walk-in)
  - [x] Projections: daily average, weekly/monthly projections from MTD data
  - [x] Feature-gated: `feature:reports` middleware via Pennant; authorized via `reports.view` permission (SalePolicy::viewAnalytics)
- [x] **Endpoint:** `GET /shops/{shop}/sales/analytics` — optional `?branch_id=` filter, returns ~2KB JSON
- [x] **Controller:** `SalesAnalyticsController` — single-action invokable controller
- [x] **Policy:** `SalePolicy::viewAnalytics` — requires `reports.view` permission
- [x] **Tests:** SalesAnalyticsTest (17) — all passing
  - Data correctness (KPI values, zeros, branch filtering, % change, payment methods, hourly distribution, top products, customer mix, projections, reversed exclusion, discounts)
  - Authorization (owner 200, viewer 200, cashier 403)
  - Feature gate (reports inactive → 403)
  - Response structure validation

### 3.5 Till Management

- [x] **Migration:** `2026_03_15_000001_add_cash_tracking_to_tills_table` — adds `opening_float`, `closing_balance`, `closed_by` to existing `tills` table
- [x] **Model:** `Till` — added new fillable fields, casts (`opening_float`, `closing_balance` as `decimal:2`), and `closedBy()` relationship
- [x] **Factory:** `TillFactory` — default active state + `closed()` state
- [x] **Policy:** `TillPolicy` — `viewAny`/`view` require `pos.access` OR `sales.view`; `create`/`close` require `pos.access`. Registered in `CoreServiceProvider`.
- [x] **Service:** `TillService`
  - `openTill()` — creates till with shop, branch, name, opener, opening float
  - `closeTill()` — validates active, sets closing balance, closed_by, closed_at
  - `getTillSummary()` — aggregates completed sales by payment method; computes `expected_cash = opening_float + cash_tendered - change_given`, `variance = closing_balance - expected_cash`; excludes reversed sales
- [x] **Resource:** `TillResource` — id, shop_id, branch_id, name, is_active, opening_float, closing_balance, opened_at, closed_at, opened_by/closed_by (embedded), branch (whenLoaded), summary (via `additional`), sales_count (whenCounted)
- [x] **Form Requests:** `OpenTillRequest` (branch_id, name, opening_float), `CloseTillRequest` (closing_balance)
- [x] **Controller:** `TillController` — index (QueryBuilder: filter by branch_id, is_active; sort by opened_at, closed_at, name), show (with summary), open (201), close (200 with summary)
- [x] **Endpoints:**
  - `GET /shops/{shop}/tills` — list with filters
  - `POST /shops/{shop}/tills/open` — open new till
  - `GET /shops/{shop}/tills/{till}` — detail with summary
  - `POST /shops/{shop}/tills/{till}/close` — close with reconciliation
- [x] **Tests:** TillManagementTest (17) — all passing
  - Open till (5): with float, zero default, branch validation, multiple active, name required
  - Close till (5): with summary, already-closed rejection, closing_balance required, cash reconciliation, reversed sales excluded
  - List/view (3): filter by is_active, filter by branch_id, show with summary
  - Authorization (4): cashier open/close, viewer forbidden to open, viewer can list, accountant forbidden to open

---

## Phase 4 — Bar/Kitchen Operations

Real-time order flow between bar POS, kitchen display, and till management.

### 4.1 Kitchen Order System ✅

- [x] **Service:** `KitchenOrderService`
  - [x] `placeOrder(Shop, array, User)` — partitions items by `Product.skip_kitchen`: skip_kitchen items create a bar_fulfilled=true, status=Completed order; remaining items create a pending kitchen order. Computes total = Σ(product.price × quantity). Wrapped in `DB::transaction()`.
  - [x] Order status lifecycle (simple enum validation, no state machines — consistent with Phases 1–3):
    ```
    pending → accepted → completed → served
       ├→ rejected (with reason)           ├→ returned (with reason)
       └→ cancelled (with cancelled_by)
                └→ cancelled
    ```
  - [x] `acceptOrder`, `rejectOrder(reason)`, `completeOrder`, `serveOrder`, `returnOrder(reason)`, `cancelOrder(user)` — each validates current status, throws `ValidationException` on invalid transitions
  - [x] Per-item status: `serveItem(KitchenOrderItem)` — pending → served with served_at timestamp
  - [x] Table number and order type (dine_in/takeaway)
- [x] **Policy:** `KitchenOrderPolicy` *(kitchen.view, kitchen.manage, pos.access)*
  - viewAny/view → kitchen.view
  - create → kitchen.manage OR pos.access
  - updateStatus/serveItem → kitchen.manage
- [x] **Resources:** `KitchenOrderResource`, `KitchenOrderItemResource`
- [x] **Form Requests:** `PlaceKitchenOrderRequest`, `RejectKitchenOrderRequest`, `ReturnKitchenOrderRequest`
- [x] **Factory:** `KitchenOrderFactory` (8 states), `KitchenOrderItemFactory`
- [x] **Controller:** `KitchenOrderController` (10 actions: index, store, show, accept, reject, complete, serve, returnOrder, cancel, serveItem)
- [x] **Endpoints:**
  - `GET /shops/{shop}/kitchen-orders` — QueryBuilder with filters (branch_id, till_id, status, bar_fulfilled)
  - `POST /shops/{shop}/kitchen-orders` — place order (201)
  - `GET /shops/{shop}/kitchen-orders/{kitchenOrder}` — detail with items, server, till
  - `POST /shops/{shop}/kitchen-orders/{kitchenOrder}/accept`
  - `POST /shops/{shop}/kitchen-orders/{kitchenOrder}/reject`
  - `POST /shops/{shop}/kitchen-orders/{kitchenOrder}/complete`
  - `POST /shops/{shop}/kitchen-orders/{kitchenOrder}/serve`
  - `POST /shops/{shop}/kitchen-orders/{kitchenOrder}/return`
  - `POST /shops/{shop}/kitchen-orders/{kitchenOrder}/cancel`
  - `POST /shops/{shop}/kitchen-orders/{kitchenOrder}/items/{item}/serve` (scopeBindings)
- [x] **Tests:** KitchenOrderTest (22 tests)
  - Place order (5): with items, skip_kitchen split, till validation, branch validation, items required
  - Status transitions (8): accept, reject with reason, complete, serve, return with reason, cancel pending, cancel accepted, invalid transition
  - Per-item (2): serve item, already-served rejection
  - List/view (3): filter by status, filter by branch_id, show with items+server
  - Authorization (4): bar_manager place+manage, kitchen_staff manage, waiter place+view (no manage), viewer forbidden
- **Deferred items:**
  - [ ] Real-time broadcasting via Reverb (`KitchenOrderPlaced`, `KitchenOrderStatusChanged`, `KitchenItemReady`)
  - [ ] State machines via `spatie/laravel-model-states` (using simple enum validation for now)

### 4.2 Bar POS Extensions ✅

- [x] **Service:** `TillPaymentService`
  - [x] `recordPayment(Till, KitchenOrder, array)` — validates till is active, order belongs to till, order is payable (completed/served), calculates change for cash payments
- [x] **Enhanced `TillService.closeTill`:**
  - [x] Rejects close with unresolved orders (pending/accepted) — throws ValidationException
  - [x] Aggregates non-rejected/non-cancelled kitchen orders into a Sale with `source: 'bar'` via `DB::transaction()`
  - [x] Creates SaleItems from kitchen order items, SalePayments from TillPayments (TillPayMethod→PayMethod mapping)
  - [x] Links kitchen orders to aggregated sale via `sale_id`
  - [x] Applies till-level discount (percent or fixed) to aggregated sale total
- [x] **Enhanced `TillService.getTillSummary`:**
  - [x] Includes till payments (bar context) alongside retail sale payments in cash/card/momo reconciliation
  - [x] Added `kitchen_orders_count` and `till_payments_total` to summary output
  - [x] Filters retail sales by `source: 'pos'` to avoid double-counting after bar sale aggregation
- [x] **Policy:** `TillPolicy.recordPayment` *(pos.access)*
- [x] **Resource:** `TillPaymentResource`
- [x] **Factory:** `TillPaymentFactory` (cash default + card/momo states)
- [x] **Form Request:** `RecordTillPaymentRequest`
- [x] **Controller:** `TillPaymentController` (index, store)
- [x] **Endpoints:**
  - `GET /shops/{shop}/tills/{till}/payments` — QueryBuilder with filters (method, order_id)
  - `POST /shops/{shop}/tills/{till}/payments` — record payment (201)
- [x] Products with `skip_kitchen = true` bypass kitchen queue *(implemented in KitchenOrderService.placeOrder, Phase 4.1)*
- [x] Order grouping by table number *(added `table_number` partial filter to kitchen orders index)*
- [x] `KitchenOrderResource` — added `till_payments` field; `KitchenOrderController` — added `tillPayments` include
- [x] **Tests:** TillPaymentTest (18 tests)
  - Payment recording (7): cash/card/momo, change calculation, closed till rejection, pending order rejection, wrong till rejection
  - Payment listing (2): list payments, filter by method
  - Enhanced till close (5): sale aggregation, sale payments from till payments, kitchen order linking, unresolved order rejection, no sale for rejected/cancelled only
  - Table number filter (1): partial match filter
  - Authorization (3): bar_manager, waiter allowed; viewer forbidden

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

### 5.1 Customer CRM ✅ *(implemented in Phase 3.1)*

- [x] **Service:** `CustomerService` *(createCustomer, updateCustomer, deleteCustomer with sales-exist guard)*
- [x] **Policy:** `CustomerPolicy` *(customers.view, customers.edit, customers.delete)*
- [x] **Resource:** `CustomerResource` (with sales_count)
- [x] **Endpoints:** `GET/POST/GET/PUT|PATCH/DELETE /shops/{shop}/customers` (apiResource)
- [x] **Tests:** CustomerCrudTest (10 tests) — unique phone per shop, CRUD, role-based access, delete protection
- [x] **Business rules:**
  - [x] Customer types: regular, wholesale, walk-in
  - [x] Loyalty points: 1 point per GHS 10 spent (added on sale completion)
  - [x] Stats updated inline in SaleService (totalSpent, visits, lastVisit, loyaltyPts)
  - [x] Phone uniqueness per shop
  - [x] Cannot delete customer with existing sales
- **Deferred items:**
  - [ ] Purchase history endpoint (`GET /shops/{shop}/customers/{customer}/purchases`)
  - [ ] Customer search via Scout + Meilisearch
  - [ ] Walk-in customer auto-creation
  - [ ] Points subtracted on reversal (clamped to 0) — Phase 3.2

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
- **Test factories:** All 52 models with realistic fake data *(11 of 52 done: Shop, Branch, ShopMember, Product, Category, UnitOfMeasure, Batch, Warehouse, StockAdjustment, StockTransfer, GoodsReceipt — built progressively per phase)*
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
  ├─ 4.1 Kitchen Orders ✅                           │
  ├─ 4.2 Bar POS ✅                                  │
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
| Authentication                                     | 14        |
| Account & Profile                                  | 6         |
| Shops & Branches                                   | 10        |
| Products, Batches & Price History                  | 14        |
| Categories & Units                                 | 8         |
| Sales & POS (incl. POS Held Orders)                | 16        |
| Purchase Orders                                    | 7         |
| Inventory (adjustments, transfers, goods receipts) | 12        |
| Suppliers, Customers, Warehouses, Team             | 14        |
| Bar/Kitchen (orders, payments, bar held orders)    | 12 + held |
| Notifications & Preferences                        | 9         |
| Billing, Subscriptions & Exemptions                | 10        |
| Admin (all groups incl. investors, forensics)      | ~50       |
| Mobile-specific                                    | 4         |
| **Total**                                          | **~182**  |
