# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShopChain is a multi-tenant SaaS platform for retail/wholesale/restaurant businesses in Ghana. It's a monorepo with three layers:

- **`packages/shopchain-core/`** — Shared Composer package (`ShopChain\Core\` namespace). Contains all Eloquent models, enums, migrations, seeders, traits, scopes, and casts. Auto-discovered via `CoreServiceProvider`.
- **`apps/api/`** — Laravel 12 REST API. Consumes the core package via path symlink. Handles auth (Passport), middleware, controllers, and routing.
- **`apps/web/`** — Nuxt 4 (Vue 3 + TypeScript) SPA. Communicates with the API over HTTP. Not yet connected (Phase 12).

## Commands

All API commands run from `apps/api/`. All web commands run from `apps/web/`.

### API (Laravel)

```bash
# Docker environment (PostgreSQL, Redis, Meilisearch, MinIO, Mailpit)
./vendor/bin/sail up -d
./vendor/bin/sail down

# Artisan via Sail
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan db:seed

# Tests (Pest)
composer test                                    # full suite
php artisan test                                 # full suite (alternative)
php artisan test tests/Feature/SomeTest.php      # single file
php artisan test --filter=test_name              # single test

# Code style (Pint)
./vendor/bin/pint                                # fix all
./vendor/bin/pint --test                         # check only (CI)

# Dev server (serve + queue listener)
composer dev
```

### Web (Nuxt)

```bash
npm install
npm run dev           # dev server on :3000
npm run build         # production build
npm run typecheck     # vue-tsc type checking
```

## Architecture

### Multi-Tenancy (3-layer isolation)

Shop-scoped routes use this middleware chain:
```
auth:api → active_user → set_shop → shop_member → [branch_access] → [enforce_plan:resource] → [feature:name]
```

`SetCurrentShop` middleware sets tenant context at three layers simultaneously:
1. **Laravel container** — `app('current_shop_id')` for application-level access
2. **PostgreSQL session variable** — `set_config('app.current_shop_id', ...)` for RLS policy enforcement
3. **Spatie Permission** — `setPermissionsTeamId($shop->id)` for team-scoped RBAC

The `BelongsToShop` trait applies a `ShopScope` global scope that auto-filters queries by `current_shop_id`. Database-level RLS policies on 23 tables provide a safety net.

### Models

All 51 domain models extend `BaseModel` (in core package) which uses `HasUuids` + `HasFactory`. The `User` model lives in `apps/api/app/Models/User.php` (extends Authenticatable, not BaseModel).

PostgreSQL enum types (48 total) are defined as PHP backed enums in `packages/shopchain-core/src/Enums/`. Custom casts (`PostgresArray`, `PostgresEnumArray`) handle array column serialization.

### Authentication

- **OAuth2 via Laravel Passport** — password grant for first-party SPA, scopes match plan features
- **2FA via laragear/two-factor** — TOTP with recovery codes; login returns temp token if 2FA enabled, then `/auth/two-factor/verify` issues real tokens
- **Admin auth** — separate guard (`admin`) with `admin_users` provider, enforced by `EnsureAdmin` middleware

### Plan Enforcement & Feature Flags

- `PlanEnforcementService::canAdd(shop, resourceKey, member)` checks plan limits. Non-decision-maker roles (cashier, salesperson) are never blocked.
- Laravel Pennant resolves 14 feature flags from shop's active plan JSONB. Route middleware: `feature:api-access`.

### Routing Convention

All API routes are under `/api/v1/`. Shop-scoped endpoints follow: `/api/v1/shops/{shop}/resource`.

### Database

Migrations live in two places:
- `packages/shopchain-core/database/migrations/` — 13 files for all 52 app tables + enum types + RLS policies (loaded by `CoreServiceProvider`)
- `apps/api/database/migrations/` — framework tables (users, sessions, cache, jobs) + published package migrations (Passport, Spatie Permission, Pennant, 2FA, activitylog)

### Currency

All monetary values are stored as `bigint` in pesewas (GHS minor units). Default currency configured in `config/shopchain.php`.

## Development Status

Phases 1 (Foundation), 2 (Core Business Modules), 3.1–3.5 (POS Sales, Reversals, Receipt Verification, Sales Analytics, Till Management), 4.1 (Kitchen Order System), 4.2 (Bar POS Extensions), 4.3 (Bar Held Orders), 5 (Customer Management), 6.1 (Team Management), 6.2 (Invitation Flow), 7 (Notifications & Real-Time), 8 (Subscriptions & Billing), and 9 (Admin Portal) are complete. Current work is Phase 10+. See `DEVELOPMENT-PLAN.md` for the full roadmap and `FUNCTIONAL-SPEC.md` for feature requirements. `DATABASE-SCHEMA.md` documents all 52 tables.
