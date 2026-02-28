# ShopChain Database Schema

PostgreSQL database schema for ShopChain — a multi-tenant inventory management and POS system.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend framework | **Laravel (PHP)** | Eloquent ORM, built-in auth scaffolding, queue system, migration tooling |
| Database engine | PostgreSQL | JSONB for flexible config, enum types, RLS for multi-tenancy, strong referential integrity |
| Multi-tenancy | Shared tables + `shop_id` FK | Standard SaaS pattern. Row-level security enforces isolation. Single schema, simple migrations |
| Org hierarchy | Flat: Shop → Branch[] | Branches are peers within a shop (no nesting). Types: retail, warehouse, distribution |
| Schema style | Normalized relational | ~60 tables, full FK integrity. JSONB only for truly flexible fields (plan config, audit snapshots) |
| Primary keys | UUID (`gen_random_uuid()`) | Avoids sequential ID leakage, safe for distributed systems. Eloquent models use the `HasUuids` trait |
| Timestamps | `timestamptz` | All timestamps in UTC with timezone awareness. All Eloquent model tables include `created_at` and `updated_at` per Laravel convention |
| Soft deletes | No | Hard delete with audit trail. Statuses (`active`/`inactive`/`suspended`) handle lifecycle |
| Enum strategy | PostgreSQL `CREATE TYPE` enums | Type-safe at DB level. Laravel migrations use raw SQL for enum changes (`ALTER TYPE ... ADD VALUE`). Each enum maps to a PHP backed enum (`enum Status: string`) |

## Enum Types

```sql
-- Identity & tenancy
CREATE TYPE user_status        AS ENUM ('active', 'inactive', 'deactivated', 'pending', 'suspended');
CREATE TYPE shop_status        AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE branch_type        AS ENUM ('retail', 'warehouse', 'distribution');
CREATE TYPE branch_status      AS ENUM ('active', 'inactive');
CREATE TYPE member_status      AS ENUM ('active', 'invited', 'suspended', 'removed');
CREATE TYPE category_status    AS ENUM ('active', 'inactive');
CREATE TYPE warehouse_status   AS ENUM ('active', 'inactive');
CREATE TYPE warehouse_type     AS ENUM ('main_storage', 'secondary', 'retail');

-- Shop roles (12 roles — matches demoData.ts ROLES runtime source of truth)
CREATE TYPE shop_role AS ENUM (
  'owner', 'general_manager', 'manager', 'bar_manager',
  'waiter', 'kitchen_staff', 'inventory_manager', 'inventory_officer',
  'salesperson', 'cashier', 'accountant', 'viewer'
);

-- Admin roles
CREATE TYPE admin_role AS ENUM (
  'super_admin', 'admin', 'billing_manager', 'support_agent', 'auditor'
);

-- Product & inventory
CREATE TYPE product_status     AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE batch_status       AS ENUM ('active', 'expired', 'depleted');
CREATE TYPE adjustment_type    AS ENUM ('damage', 'recount', 'expired', 'theft', 'return');
CREATE TYPE adjustment_status  AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE transfer_status    AS ENUM ('pending', 'in_transit', 'completed', 'cancelled');
CREATE TYPE unit_type          AS ENUM ('weight', 'volume', 'count', 'length');
CREATE TYPE goods_receipt_status AS ENUM ('draft', 'completed');
CREATE TYPE batch_condition    AS ENUM ('good', 'damaged', 'short_ship');

-- Suppliers & purchase orders
CREATE TYPE supplier_status    AS ENUM ('active', 'inactive');
CREATE TYPE po_status AS ENUM (
  'draft', 'pending', 'approved', 'shipped', 'partial', 'received', 'cancelled'
);
CREATE TYPE payment_terms      AS ENUM ('cod', 'net15', 'net30', 'net60');

-- Sales & POS
CREATE TYPE sale_status        AS ENUM ('completed', 'reversed', 'pending_reversal');
CREATE TYPE sale_source        AS ENUM ('pos', 'bar');
CREATE TYPE pay_method         AS ENUM ('cash', 'card', 'momo', 'split');
CREATE TYPE till_pay_method    AS ENUM ('cash', 'card', 'momo');
CREATE TYPE discount_type      AS ENUM ('percent', 'fixed');
CREATE TYPE customer_type      AS ENUM ('regular', 'wholesale', 'walk-in');

-- Kitchen
CREATE TYPE order_type         AS ENUM ('dine_in', 'takeaway');
CREATE TYPE kitchen_order_status AS ENUM (
  'pending', 'accepted', 'completed', 'served', 'rejected', 'cancelled', 'returned'
);
CREATE TYPE kitchen_item_status AS ENUM ('pending', 'served');

-- Billing
CREATE TYPE plan_lifecycle     AS ENUM ('draft', 'scheduled', 'active', 'retiring', 'retired');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'expired');
CREATE TYPE billing_status     AS ENUM ('paid', 'failed', 'refunded', 'pending');
CREATE TYPE pay_type           AS ENUM ('momo', 'card');
CREATE TYPE exemption_unit     AS ENUM ('months', 'years');

-- Admin & audit
CREATE TYPE admin_team_status  AS ENUM ('active', 'invited', 'suspended');
CREATE TYPE announcement_target   AS ENUM ('all', 'free', 'basic', 'max');
CREATE TYPE announcement_priority AS ENUM ('info', 'warning', 'critical');
CREATE TYPE announcement_status   AS ENUM ('active', 'draft');
CREATE TYPE audit_category     AS ENUM ('auth', 'financial', 'data', 'admin', 'system');
CREATE TYPE risk_level         AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE investigation_status  AS ENUM ('open', 'in_progress', 'escalated', 'closed');
CREATE TYPE anomaly_status     AS ENUM ('escalated', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE expense_category AS ENUM (
  'infrastructure', 'payment_fees', 'sms', 'staff',
  'marketing', 'software', 'office', 'compliance'
);

-- Notifications
CREATE TYPE notif_category AS ENUM (
  'stock_alert', 'order_update', 'sale_event',
  'approval_request', 'team_update', 'system', 'customer'
);
CREATE TYPE notif_priority     AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE notif_channel      AS ENUM ('in_app', 'push', 'email', 'sms');
CREATE TYPE notif_action       AS ENUM ('approved', 'rejected', 'acknowledged');
```

---

## Section 1: Core Tenant & Identity

### `users`

Global user accounts. One user can belong to multiple shops.

```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  phone             TEXT,
  password          TEXT NOT NULL,                  -- Laravel convention (not password_hash)
  avatar_url        TEXT,
  status            user_status NOT NULL DEFAULT 'pending',
  email_verified_at TIMESTAMPTZ,                    -- Laravel convention: NULL = unverified, timestamp = verified
  remember_token    VARCHAR(100),                   -- Laravel "Remember Me" token
  last_active_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status);
```

### `sessions`

Active login sessions for a user. Enables the "Active Sessions" management in Account > Security.

```sql
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  device      TEXT NOT NULL,               -- e.g. 'Chrome on Windows'
  ip_address  INET,
  location    TEXT,                         -- e.g. 'Accra, Ghana'
  is_current  BOOLEAN NOT NULL DEFAULT FALSE,
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_active ON sessions (user_id, last_active DESC);
```

### `shops`

Top-level tenant. All business data is scoped to a shop.

```sql
CREATE TABLE shops (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES users (id),
  name                TEXT NOT NULL,
  type                TEXT NOT NULL,                  -- e.g. 'retail', 'wholesale', 'pharmacy', 'restaurant'
  currency            TEXT NOT NULL DEFAULT 'GHS',    -- ISO 4217
  timezone            TEXT NOT NULL DEFAULT 'Africa/Accra',
  tax_rate            NUMERIC(5,2) NOT NULL DEFAULT 15,
  tax_label           TEXT NOT NULL DEFAULT 'VAT',
  receipt_footer      TEXT,                           -- custom receipt footer text
  low_stock_threshold INT NOT NULL DEFAULT 10,        -- global default reorder level
  logo_url            TEXT,
  phone               TEXT,
  email               TEXT,
  address             TEXT,
  region              TEXT,                           -- Ghana region
  status              shop_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shops_owner ON shops (owner_id);
CREATE INDEX idx_shops_status ON shops (status);
```

### `branches`

Locations within a shop. Flat list (no parent-child nesting).

```sql
CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        branch_type NOT NULL DEFAULT 'retail',
  manager_id  UUID REFERENCES users (id),
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  address     TEXT,
  phone       TEXT,
  status      branch_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shop_id, name)
);

CREATE INDEX idx_branches_shop ON branches (shop_id);
```

### `shop_members`

Junction: assigns a user to a shop with a role.

```sql
CREATE TABLE shop_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  shop_id   UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  role      shop_role NOT NULL DEFAULT 'viewer',
  status    member_status NOT NULL DEFAULT 'invited',
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, shop_id)
);

CREATE INDEX idx_shop_members_shop ON shop_members (shop_id);
CREATE INDEX idx_shop_members_user ON shop_members (user_id);
```

### `branch_members`

Further scopes a shop member to specific branches.

```sql
CREATE TABLE branch_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES shop_members (id) ON DELETE CASCADE,
  branch_id   UUID NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (member_id, branch_id)
);

CREATE INDEX idx_branch_members_branch ON branch_members (branch_id);
CREATE INDEX idx_branch_members_member ON branch_members (member_id);
```

### Relationships

```
users 1──∞ shop_members ∞──1 shops
                │
                ▼
         branch_members ∞──1 branches ∞──1 shops
```

- A user can be a member of many shops (different roles per shop).
- A shop member can be assigned to many branches within that shop.
- Each shop has one owner (`shops.owner_id`).
- Each branch can have one manager.

---

## Section 2: Products & Inventory

### `categories`

Product categories, shop-scoped.

```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT,
  color       TEXT,
  description TEXT,
  status      category_status NOT NULL DEFAULT 'active',
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shop_id, name)
);

CREATE INDEX idx_categories_shop ON categories (shop_id);
```

### `units_of_measure`

Measurement units, shop-scoped.

```sql
CREATE TABLE units_of_measure (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  type         unit_type NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shop_id, abbreviation)
);

CREATE INDEX idx_units_shop ON units_of_measure (shop_id);
```

### `products`

Core product catalog. Shop-scoped.

```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  sku             TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  barcode         TEXT,
  category_id     UUID REFERENCES categories (id) ON DELETE SET NULL,
  unit_id         UUID REFERENCES units_of_measure (id) ON DELETE SET NULL,
  price           NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost            NUMERIC(12,2) NOT NULL DEFAULT 0,
  reorder_level   INT NOT NULL DEFAULT 0,
  image_url       TEXT,
  expiry_date     DATE,                        -- standalone expiry for non-batch products; earliest batch expiry for batch-tracked products
  batch_tracking  BOOLEAN NOT NULL DEFAULT FALSE,
  skip_kitchen    BOOLEAN NOT NULL DEFAULT FALSE,
  status          product_status NOT NULL DEFAULT 'in_stock',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shop_id, sku)
);

CREATE INDEX idx_products_shop ON products (shop_id);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_barcode ON products (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_status ON products (shop_id, status);
```

### `warehouses`

Storage locations within a shop.

```sql
CREATE TABLE warehouses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        warehouse_type NOT NULL DEFAULT 'main_storage',
  manager_id  UUID REFERENCES users (id),
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  capacity    INT,
  zones       TEXT[],
  status      warehouse_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shop_id, name)
);

CREATE INDEX idx_warehouses_shop ON warehouses (shop_id);
```

### `product_locations`

Stock quantity per product per warehouse/branch. This is the inventory ledger.

```sql
CREATE TABLE product_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  warehouse_id    UUID REFERENCES warehouses (id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches (id) ON DELETE CASCADE,
  quantity        INT NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (product_id, warehouse_id, branch_id),
  CHECK (warehouse_id IS NOT NULL OR branch_id IS NOT NULL)
);

CREATE INDEX idx_product_locations_product ON product_locations (product_id);
CREATE INDEX idx_product_locations_warehouse ON product_locations (warehouse_id);
CREATE INDEX idx_product_locations_branch ON product_locations (branch_id);
```

### `batches`

Batch-tracked inventory. Links to a product and optionally to the PO that delivered it.

```sql
CREATE TABLE batches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  shop_id          UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  batch_number     TEXT NOT NULL,
  quantity         INT NOT NULL DEFAULT 0,
  initial_quantity INT NOT NULL,
  expiry_date      DATE,
  received_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  source_po_id     UUID REFERENCES purchase_orders (id) ON DELETE SET NULL,
  location         TEXT,
  status           batch_status NOT NULL DEFAULT 'active',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shop_id, batch_number)
);

CREATE INDEX idx_batches_product ON batches (product_id);
CREATE INDEX idx_batches_shop ON batches (shop_id);
CREATE INDEX idx_batches_expiry ON batches (expiry_date) WHERE status = 'active';
```

### `stock_adjustments`

Manual stock corrections with approval workflow.

```sql
CREATE TABLE stock_adjustments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  batch_id        UUID REFERENCES batches (id),          -- if batch-tracked, references specific batch
  warehouse_id    UUID REFERENCES warehouses (id),
  branch_id       UUID REFERENCES branches (id),
  type            adjustment_type NOT NULL,               -- damage, recount, expired, theft, return
  quantity_change  INT NOT NULL,            -- positive = add, negative = remove
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason          TEXT NOT NULL,
  notes           TEXT,
  status          adjustment_status NOT NULL DEFAULT 'pending',
  created_by      UUID NOT NULL REFERENCES users (id),
  approved_by     UUID REFERENCES users (id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at     TIMESTAMPTZ
);

CREATE INDEX idx_adjustments_shop ON stock_adjustments (shop_id);
CREATE INDEX idx_adjustments_product ON stock_adjustments (product_id);
CREATE INDEX idx_adjustments_status ON stock_adjustments (shop_id, status);
```

### `stock_transfers`

Move stock between warehouses/branches.

```sql
CREATE TABLE stock_transfers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  from_warehouse_id   UUID REFERENCES warehouses (id),
  to_warehouse_id     UUID REFERENCES warehouses (id),
  from_branch_id      UUID REFERENCES branches (id),
  to_branch_id        UUID REFERENCES branches (id),
  quantity            INT NOT NULL,
  status              transfer_status NOT NULL DEFAULT 'pending',
  created_by          UUID NOT NULL REFERENCES users (id),
  approved_by         UUID REFERENCES users (id),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  shipped_at          TIMESTAMPTZ,
  received_at         TIMESTAMPTZ,

  CHECK (from_warehouse_id IS NOT NULL OR from_branch_id IS NOT NULL),
  CHECK (to_warehouse_id IS NOT NULL OR to_branch_id IS NOT NULL)
);

CREATE INDEX idx_transfers_shop ON stock_transfers (shop_id);
CREATE INDEX idx_transfers_status ON stock_transfers (shop_id, status);
```

### `price_history`

Tracks product price changes over time. Displayed in Product Detail page as Price Movement Chart and Price Change History table.

```sql
CREATE TABLE price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  shop_id         UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  old_price       NUMERIC(12,2) NOT NULL,
  new_price       NUMERIC(12,2) NOT NULL,
  old_cost        NUMERIC(12,2) NOT NULL,
  new_cost        NUMERIC(12,2) NOT NULL,
  reason          TEXT,
  changed_by      UUID NOT NULL REFERENCES users (id),
  status          TEXT NOT NULL DEFAULT 'approved',   -- 'approved', 'pending'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_product ON price_history (product_id);
CREATE INDEX idx_price_history_shop ON price_history (shop_id);
CREATE INDEX idx_price_history_created ON price_history (product_id, created_at DESC);
```

### `goods_receipts`

Ad-hoc stock receiving records (not linked to a PO). Used by the Receive Orders page.

```sql
CREATE TABLE goods_receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  reference       TEXT NOT NULL,                      -- auto-generated: RCV-{YYYY}-{NNNN}
  warehouse_id    UUID NOT NULL REFERENCES warehouses (id),
  receipt_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  status          goods_receipt_status NOT NULL DEFAULT 'completed',
  created_by      UUID NOT NULL REFERENCES users (id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shop_id, reference)
);

CREATE INDEX idx_goods_receipts_shop ON goods_receipts (shop_id);
CREATE INDEX idx_goods_receipts_warehouse ON goods_receipts (warehouse_id);
```

### `goods_receipt_items`

Line items for a goods receipt.

```sql
CREATE TABLE goods_receipt_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id      UUID NOT NULL REFERENCES goods_receipts (id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products (id),
  quantity        INT NOT NULL,
  batch_number    TEXT,
  condition       batch_condition,                    -- good, damaged, short_ship
  expiry_date     DATE,
  notes           TEXT
);

CREATE INDEX idx_gr_items_receipt ON goods_receipt_items (receipt_id);
CREATE INDEX idx_gr_items_product ON goods_receipt_items (product_id);
```

---

## Section 3: Suppliers & Purchase Orders

### `suppliers`

Vendor/supplier records. Shop-scoped.

```sql
CREATE TABLE suppliers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  contact_name  TEXT,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  rating        NUMERIC(2,1) DEFAULT 0,     -- 0.0 to 5.0
  status        supplier_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shop_id, name)
);

CREATE INDEX idx_suppliers_shop ON suppliers (shop_id);
```

### `supplier_products`

Which suppliers can provide which products. Tracks per-supplier pricing and lead times.

```sql
CREATE TABLE supplier_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id   UUID NOT NULL REFERENCES suppliers (id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  unit_cost     NUMERIC(12,2),
  lead_time_days INT,
  is_preferred  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (supplier_id, product_id)
);

CREATE INDEX idx_supplier_products_product ON supplier_products (product_id);
CREATE INDEX idx_supplier_products_supplier ON supplier_products (supplier_id);
```

### `purchase_orders`

Purchase order header. Shop-scoped, linked to a supplier and destination warehouse.

```sql
CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  supplier_id     UUID NOT NULL REFERENCES suppliers (id),
  warehouse_id    UUID REFERENCES warehouses (id),
  status          po_status NOT NULL DEFAULT 'draft',
  payment_terms   payment_terms NOT NULL DEFAULT 'cod',
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES users (id),
  approved_by     UUID REFERENCES users (id),
  expected_date   DATE,
  received_date   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_po_shop ON purchase_orders (shop_id);
CREATE INDEX idx_po_supplier ON purchase_orders (supplier_id);
CREATE INDEX idx_po_status ON purchase_orders (shop_id, status);
```

### `po_items`

Line items on a purchase order.

```sql
CREATE TABLE po_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id             UUID NOT NULL REFERENCES purchase_orders (id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products (id),
  quantity_ordered  INT NOT NULL,
  quantity_received INT NOT NULL DEFAULT 0,
  unit_cost         NUMERIC(12,2) NOT NULL,
  unit_id           UUID REFERENCES units_of_measure (id),
  expiry_date       DATE,

  UNIQUE (po_id, product_id)
);

CREATE INDEX idx_po_items_po ON po_items (po_id);
CREATE INDEX idx_po_items_product ON po_items (product_id);
```

---

## Section 4: Sales & POS

### `customers`

Customer records. Shop-scoped.

```sql
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  type        customer_type NOT NULL DEFAULT 'regular',
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,    -- cumulative spend in GH₵
  visits      INT NOT NULL DEFAULT 0,               -- number of transactions
  last_visit  TIMESTAMPTZ,                          -- last purchase timestamp
  loyalty_pts INT NOT NULL DEFAULT 0,               -- 1 point per GH₵ 10 spent
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_shop ON customers (shop_id);
CREATE INDEX idx_customers_phone ON customers (shop_id, phone) WHERE phone IS NOT NULL;
```

### `tills`

POS till/register sessions. Branch-scoped.

```sql
CREATE TABLE tills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  opened_by       UUID NOT NULL REFERENCES users (id),
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at       TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  discount        NUMERIC(12,2),              -- discount amount applied at till level
  discount_type   discount_type,              -- 'percent' or 'fixed'
  discount_input  NUMERIC(12,2),              -- raw discount value entered
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tills_branch ON tills (branch_id);
CREATE INDEX idx_tills_active ON tills (shop_id, is_active) WHERE is_active = TRUE;
```

### `sales`

Sale transaction header.

```sql
CREATE TABLE sales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  branch_id           UUID NOT NULL REFERENCES branches (id),
  till_id             UUID REFERENCES tills (id),
  cashier_id          UUID NOT NULL REFERENCES users (id),
  customer_id         UUID REFERENCES customers (id),
  subtotal            NUMERIC(12,2) NOT NULL,
  tax                 NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_type       discount_type,
  discount_input      NUMERIC(12,2),              -- raw discount value entered by cashier
  total               NUMERIC(12,2) NOT NULL,
  status              sale_status NOT NULL DEFAULT 'completed',
  source              sale_source NOT NULL DEFAULT 'pos',
  verify_token        TEXT,
  reversed_at         TIMESTAMPTZ,
  reversed_by         UUID REFERENCES users (id),
  reversal_reason     TEXT,
  reversal_requested_by UUID REFERENCES users (id),
  reversal_requested_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_shop ON sales (shop_id);
CREATE INDEX idx_sales_branch ON sales (branch_id);
CREATE INDEX idx_sales_cashier ON sales (cashier_id);
CREATE INDEX idx_sales_customer ON sales (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_sales_created ON sales (shop_id, created_at DESC);
CREATE INDEX idx_sales_status ON sales (shop_id, status);
```

### `sale_items`

Line items for a sale. Links to batch for FEFO tracking.

```sql
CREATE TABLE sale_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products (id),
  quantity      INT NOT NULL,
  unit_price    NUMERIC(12,2) NOT NULL,
  discount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_type discount_type,
  line_total    NUMERIC(12,2) NOT NULL,
  batch_id      UUID REFERENCES batches (id)
);

CREATE INDEX idx_sale_items_sale ON sale_items (sale_id);
CREATE INDEX idx_sale_items_product ON sale_items (product_id);
```

### `sale_payments`

Payment splits for a sale. One sale can have multiple payments (split payment support).

```sql
CREATE TABLE sale_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
  method          pay_method NOT NULL,
  label           TEXT,                      -- human-readable label (e.g. 'Cash', 'MTN MoMo')
  amount          NUMERIC(12,2) NOT NULL,
  -- Cash fields
  amount_tendered NUMERIC(12,2),
  change_given    NUMERIC(12,2),
  -- Card fields
  card_type       TEXT,                     -- 'visa', 'mastercard'
  card_trans_no   TEXT,
  -- Mobile Money fields
  momo_provider   TEXT,                     -- 'MTN', 'Vodafone', 'AirtelTigo'
  momo_phone      TEXT,
  momo_ref        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_payments_sale ON sale_payments (sale_id);
```

---

## Section 5: Bar/Kitchen Operations

### `kitchen_orders`

Orders sent from bar POS to kitchen display.

```sql
CREATE TABLE kitchen_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id           UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  branch_id         UUID NOT NULL REFERENCES branches (id),
  till_id           UUID NOT NULL REFERENCES tills (id),
  sale_id           UUID REFERENCES sales (id),
  table_number      TEXT,
  order_type        order_type NOT NULL DEFAULT 'dine_in',
  status            kitchen_order_status NOT NULL DEFAULT 'pending',
  total             NUMERIC(12,2),                    -- order total amount
  bar_fulfilled     BOOLEAN NOT NULL DEFAULT FALSE,   -- true = auto-fulfilled at bar (skipKitchen items), excluded from Kitchen Display
  server_id         UUID REFERENCES users (id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at       TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  rejected_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  served_at         TIMESTAMPTZ,
  returned_at       TIMESTAMPTZ,
  return_reason     TEXT,
  cancelled_at      TIMESTAMPTZ,
  cancelled_by      UUID REFERENCES users (id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kitchen_orders_shop ON kitchen_orders (shop_id);
CREATE INDEX idx_kitchen_orders_branch ON kitchen_orders (branch_id);
CREATE INDEX idx_kitchen_orders_status ON kitchen_orders (shop_id, status);
CREATE INDEX idx_kitchen_orders_till ON kitchen_orders (till_id);
```

### `kitchen_order_items`

Individual items within a kitchen order.

```sql
CREATE TABLE kitchen_order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES kitchen_orders (id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products (id),
  quantity    INT NOT NULL,
  notes       TEXT,
  status      kitchen_item_status NOT NULL DEFAULT 'pending',
  served_at   TIMESTAMPTZ                   -- when this specific item was served
);

CREATE INDEX idx_kitchen_items_order ON kitchen_order_items (order_id);
```

### `held_orders`

Work-in-progress orders parked by a waiter/cashier.

```sql
CREATE TABLE held_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  till_id     UUID NOT NULL REFERENCES tills (id),
  table_number TEXT,
  order_type  order_type NOT NULL DEFAULT 'dine_in',
  label       TEXT,
  held_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_held_orders_till ON held_orders (till_id);
```

### `held_order_items`

Items within a held order.

```sql
CREATE TABLE held_order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  held_order_id   UUID NOT NULL REFERENCES held_orders (id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products (id),
  quantity        INT NOT NULL,
  notes           TEXT
);

CREATE INDEX idx_held_items_order ON held_order_items (held_order_id);
```

### `till_payments`

Per-order payments within a till session. Distinct from `sale_payments` — till payments track individual order payments during an active till; `sale_payments` captures the final aggregated sale record after till close.

```sql
CREATE TABLE till_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  till_id         UUID NOT NULL REFERENCES tills (id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES kitchen_orders (id),
  amount          NUMERIC(12,2) NOT NULL,
  method          till_pay_method NOT NULL,           -- cash, card, momo
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Cash fields
  amount_tendered NUMERIC(12,2),
  change_given    NUMERIC(12,2),
  -- Card fields
  card_type       TEXT,                               -- 'Visa', 'Mastercard', etc.
  card_trans_no   TEXT,
  -- Mobile Money fields
  momo_provider   TEXT,                               -- 'MTN MoMo', 'TCash', 'ATCash', 'G-Money'
  momo_phone      TEXT,
  momo_trans_id   TEXT
);

CREATE INDEX idx_till_payments_till ON till_payments (till_id);
CREATE INDEX idx_till_payments_order ON till_payments (order_id);
```

### `pos_held_orders`

Retail POS held/parked cart state. Distinct from bar `held_orders` — these hold the cart + discount state for the retail POS register.

```sql
CREATE TABLE pos_held_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches (id),
  held_by         UUID NOT NULL REFERENCES users (id),
  discount_value  TEXT,                               -- raw discount value as entered
  discount_type   discount_type,                      -- 'percent' or 'fixed'
  held_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pos_held_shop ON pos_held_orders (shop_id);
CREATE INDEX idx_pos_held_branch ON pos_held_orders (branch_id);
```

### `pos_held_order_items`

Line items within a POS held order.

```sql
CREATE TABLE pos_held_order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  held_order_id   UUID NOT NULL REFERENCES pos_held_orders (id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products (id),
  quantity        INT NOT NULL
);

CREATE INDEX idx_pos_held_items_order ON pos_held_order_items (held_order_id);
```

---

## Section 6: Subscriptions & Billing

### `plans`

Platform subscription tiers managed by super-admin. Plan limits and features stored as JSONB since they are config blobs that evolve over time.

```sql
CREATE TABLE plans (
  id              TEXT PRIMARY KEY,           -- 'free', 'basic', 'max'
  name            TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  icon            TEXT,
  color           TEXT,
  badge           TEXT,
  limits          JSONB NOT NULL DEFAULT '{}',  -- { shops, branchesPerShop, teamPerShop, ... }
  features        JSONB NOT NULL DEFAULT '{}',  -- { pos, receipts, reports, barcode, ... }
  lifecycle       plan_lifecycle NOT NULL DEFAULT 'draft',
  available_from  TIMESTAMPTZ,
  retire_at       TIMESTAMPTZ,
  migrate_at      TIMESTAMPTZ,
  fallback_id     TEXT REFERENCES plans (id),
  grandfathered   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `subscriptions`

Links a shop to a plan. Tracks lifecycle dates.

```sql
CREATE TABLE subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  plan_id       TEXT NOT NULL REFERENCES plans (id),
  status        subscription_status NOT NULL DEFAULT 'active',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ,
  auto_renew    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_shop ON subscriptions (shop_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE UNIQUE INDEX idx_subscriptions_active ON subscriptions (shop_id)
  WHERE status = 'active';   -- enforce only one active subscription per shop
```

### `payment_methods`

Saved payment methods for subscription billing.

```sql
CREATE TABLE payment_methods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type          pay_type NOT NULL,
  provider      TEXT NOT NULL,               -- 'MTN MoMo', 'Visa', 'Mastercard', etc.
  last4         TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  expiry        TEXT,                        -- 'MM/YY' for cards
  status        TEXT NOT NULL DEFAULT 'active',
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_methods_user ON payment_methods (user_id);
```

### `billing_records`

Payment history for subscription charges.

```sql
CREATE TABLE billing_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions (id),
  amount          NUMERIC(10,2) NOT NULL,
  method_id       UUID REFERENCES payment_methods (id),
  status          billing_status NOT NULL DEFAULT 'pending',
  tx_ref          TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_shop ON billing_records (shop_id);
CREATE INDEX idx_billing_status ON billing_records (status);
CREATE INDEX idx_billing_created ON billing_records (shop_id, created_at DESC);
```

### `billing_exemptions`

Billing exemptions granted by admins to specific shops. Tracked via Admin > Subscriptions > User Subs > "Grant Exemption".

```sql
CREATE TABLE billing_exemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
  granted_by  UUID NOT NULL REFERENCES users (id),   -- admin who granted
  period      INT,                                    -- duration value (null if unlimited)
  unit        exemption_unit,                         -- 'months' or 'years' (null if unlimited)
  unlimited   BOOLEAN NOT NULL DEFAULT FALSE,
  reason      TEXT NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ,                            -- computed from period+unit; null if unlimited
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exemptions_shop ON billing_exemptions (shop_id);
CREATE INDEX idx_exemptions_active ON billing_exemptions (shop_id, expires_at)
  WHERE expires_at IS NULL OR expires_at > now();
```

---

## Section 7: Admin Portal & Audit

### `admin_users`

Admin portal access. Links a user to admin-level roles.

```sql
CREATE TABLE admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  role            admin_role NOT NULL,
  status          admin_team_status NOT NULL DEFAULT 'invited',
  two_fa_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID REFERENCES users (id),
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_users_role ON admin_users (role);
```

### `announcements`

Platform-wide announcements from admin to shop users.

```sql
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  target      announcement_target NOT NULL DEFAULT 'all',
  priority    announcement_priority NOT NULL DEFAULT 'info',
  status      announcement_status NOT NULL DEFAULT 'draft',
  created_by  UUID NOT NULL REFERENCES users (id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_status ON announcements (status);
CREATE INDEX idx_announcements_target ON announcements (target);
```

### `audit_events`

Immutable audit log. `shop_id` is nullable for platform-level events.

```sql
CREATE TABLE audit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID REFERENCES shops (id) ON DELETE SET NULL,
  actor_id    UUID REFERENCES users (id),
  actor_role  TEXT,
  category    audit_category NOT NULL,
  action      TEXT NOT NULL,
  target      TEXT NOT NULL,
  ip_address  INET,
  device      TEXT,
  session_id  TEXT,
  location    TEXT,
  risk_score  SMALLINT NOT NULL DEFAULT 0,  -- 0-100
  before_data JSONB,                        -- snapshot before change
  after_data  JSONB,                        -- snapshot after change
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_shop ON audit_events (shop_id);
CREATE INDEX idx_audit_actor ON audit_events (actor_id);
CREATE INDEX idx_audit_category ON audit_events (category);
CREATE INDEX idx_audit_created ON audit_events (created_at DESC);
CREATE INDEX idx_audit_risk ON audit_events (risk_score DESC)
  WHERE risk_score >= 50;
```

### `investigations`

Fraud/security investigation cases.

```sql
CREATE TABLE investigations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  status      investigation_status NOT NULL DEFAULT 'open',
  priority    risk_level NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES users (id),
  description TEXT,
  impact      TEXT,
  findings    TEXT,
  resolution  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investigations_status ON investigations (status);
CREATE INDEX idx_investigations_assignee ON investigations (assignee_id);
```

### `investigation_events`

Links audit events to investigations.

```sql
CREATE TABLE investigation_events (
  investigation_id UUID NOT NULL REFERENCES investigations (id) ON DELETE CASCADE,
  audit_event_id   UUID NOT NULL REFERENCES audit_events (id) ON DELETE CASCADE,
  PRIMARY KEY (investigation_id, audit_event_id)
);
```

### `investigation_notes`

Discussion notes on investigations.

```sql
CREATE TABLE investigation_notes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id  UUID NOT NULL REFERENCES investigations (id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES users (id),
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_notes_investigation ON investigation_notes (investigation_id);
```

### `anomalies`

Automated anomaly detection results.

```sql
CREATE TABLE anomalies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule              TEXT NOT NULL,
  severity          risk_level NOT NULL,
  entity            TEXT NOT NULL,
  summary           TEXT NOT NULL,
  status            anomaly_status NOT NULL DEFAULT 'reviewing',
  investigation_id  UUID REFERENCES investigations (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_anomalies_status ON anomalies (status);
CREATE INDEX idx_anomalies_severity ON anomalies (severity);
CREATE INDEX idx_anomalies_investigation ON anomalies (investigation_id)
  WHERE investigation_id IS NOT NULL;
```

### `anomaly_events`

Links anomalies to the audit events that triggered them.

```sql
CREATE TABLE anomaly_events (
  anomaly_id     UUID NOT NULL REFERENCES anomalies (id) ON DELETE CASCADE,
  audit_event_id UUID NOT NULL REFERENCES audit_events (id) ON DELETE CASCADE,
  PRIMARY KEY (anomaly_id, audit_event_id)
);
```

### `detection_rules`

Anomaly detection rule definitions. Managed in Admin > Audit & Fraud > Anomalies.

```sql
CREATE TABLE detection_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  threshold   TEXT NOT NULL,                 -- threshold condition description
  severity    risk_level NOT NULL DEFAULT 'medium',
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  triggers    INT NOT NULL DEFAULT 0,        -- number of times triggered
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `admin_expenses`

Platform-level expense tracking for ShopChain's own operational costs. Managed in Admin > Finances > Expenses.

```sql
CREATE TABLE admin_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  category    expense_category NOT NULL,
  description TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  vendor      TEXT NOT NULL,
  recurring   BOOLEAN NOT NULL DEFAULT FALSE,
  reference   TEXT,
  created_by  UUID NOT NULL REFERENCES users (id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_expenses_category ON admin_expenses (category);
CREATE INDEX idx_admin_expenses_date ON admin_expenses (date DESC);
```

### `admin_expense_attachments`

File attachments for admin expenses.

```sql
CREATE TABLE admin_expense_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID NOT NULL REFERENCES admin_expenses (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,                 -- MIME type
  size        TEXT NOT NULL,                 -- human-readable size
  url         TEXT NOT NULL,                 -- storage URL
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_attachments_expense ON admin_expense_attachments (expense_id);
```

### `milestones`

Company milestones for the investor Deck tab. Managed in Admin > Investors > Deck.

```sql
CREATE TABLE milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,                           -- emoji icon
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_date ON milestones (date DESC);
```

---

## Section 8: Notifications

### `notifications`

User-facing notifications across all channels.

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID REFERENCES shops (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  category        notif_category NOT NULL,
  priority        notif_priority NOT NULL DEFAULT 'medium',
  channels        notif_channel[] NOT NULL DEFAULT '{in_app}',
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  action_url      TEXT,
  action_data     JSONB,
  actor_id        UUID REFERENCES users (id),
  actor_role      TEXT,
  requires_action BOOLEAN NOT NULL DEFAULT FALSE,
  action_taken    notif_action,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_shop ON notifications (shop_id);
CREATE INDEX idx_notifications_unread ON notifications (user_id, is_read)
  WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications (user_id, created_at DESC);
```

### `notification_preferences`

Per-user notification preferences. Controls which categories and channels are enabled, plus quiet hours.

```sql
CREATE TABLE notification_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  categories          JSONB NOT NULL DEFAULT '{}',    -- { "stock_alert": { "enabled": true, "channels": ["in_app","push"] }, ... }
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start   TIME NOT NULL DEFAULT '22:00',
  quiet_hours_end     TIME NOT NULL DEFAULT '07:00',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_prefs_user ON notification_preferences (user_id);
```

---

## Section 9: Laravel Framework Tables

These tables are required by Laravel's built-in services (auth, queues, cache, etc.) and are generated via `php artisan` commands. They are listed here for completeness.

### `password_reset_tokens`

Laravel's built-in password reset flow. Created by `php artisan make:auth` / `php artisan migrate`.

```sql
CREATE TABLE password_reset_tokens (
  email       TEXT NOT NULL PRIMARY KEY,
  token       TEXT NOT NULL,
  created_at  TIMESTAMPTZ
);
```

### `personal_access_tokens`

Laravel Sanctum API token authentication. Created by `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`.

```sql
CREATE TABLE personal_access_tokens (
  id              BIGSERIAL PRIMARY KEY,
  tokenable_type  TEXT NOT NULL,
  tokenable_id    UUID NOT NULL,
  name            TEXT NOT NULL,
  token           VARCHAR(64) NOT NULL UNIQUE,
  abilities       TEXT,                           -- JSON array of token abilities
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pat_tokenable ON personal_access_tokens (tokenable_type, tokenable_id);
```

### `jobs`

Laravel queue worker jobs table. Created by `php artisan queue:table`.

```sql
CREATE TABLE jobs (
  id            BIGSERIAL PRIMARY KEY,
  queue         TEXT NOT NULL,
  payload       TEXT NOT NULL,                    -- serialized job data
  attempts      SMALLINT NOT NULL DEFAULT 0,
  reserved_at   INT,                              -- Unix timestamp
  available_at  INT NOT NULL,                     -- Unix timestamp
  created_at    INT NOT NULL                      -- Unix timestamp
);

CREATE INDEX idx_jobs_queue ON jobs (queue);
```

### `job_batches`

Laravel job batching support. Created by `php artisan queue:batches-table`.

```sql
CREATE TABLE job_batches (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  total_jobs      INT NOT NULL DEFAULT 0,
  pending_jobs    INT NOT NULL DEFAULT 0,
  failed_jobs     INT NOT NULL DEFAULT 0,
  failed_job_ids  TEXT NOT NULL DEFAULT '',        -- comma-separated list
  options         TEXT,                            -- serialized batch options
  cancelled_at    INT,                             -- Unix timestamp
  created_at      INT NOT NULL,                    -- Unix timestamp
  finished_at     INT                              -- Unix timestamp
);
```

### `failed_jobs`

Laravel failed queue job log. Created by `php artisan queue:failed-table`.

```sql
CREATE TABLE failed_jobs (
  id          BIGSERIAL PRIMARY KEY,
  uuid        UUID NOT NULL UNIQUE,
  connection  TEXT NOT NULL,
  queue       TEXT NOT NULL,
  payload     TEXT NOT NULL,
  exception   TEXT NOT NULL,
  failed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `cache`

Laravel database cache driver. Created by `php artisan cache:table`.

```sql
CREATE TABLE cache (
  key         TEXT NOT NULL PRIMARY KEY,
  value       TEXT NOT NULL,
  expiration  INT NOT NULL
);
```

### `cache_locks`

Atomic lock support for the database cache driver.

```sql
CREATE TABLE cache_locks (
  key         TEXT NOT NULL PRIMARY KEY,
  owner       TEXT NOT NULL,
  expiration  INT NOT NULL
);
```

---

## Row-Level Security (RLS)

Enable RLS on all shop-scoped tables to enforce multi-tenant isolation at the database level.

```sql
-- Example: products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_tenant_isolation ON products
  USING (shop_id = current_setting('app.current_shop_id')::UUID);

CREATE POLICY products_tenant_insert ON products
  FOR INSERT
  WITH CHECK (shop_id = current_setting('app.current_shop_id')::UUID);
```

Apply the same pattern to all tables with `shop_id`:
- `branches`, `shop_members`, `categories`, `units_of_measure`, `products`, `warehouses`
- `product_locations`, `batches`, `stock_adjustments`, `stock_transfers`
- `price_history`, `goods_receipts`, `goods_receipt_items`
- `suppliers`, `supplier_products`, `purchase_orders`, `po_items`
- `customers`, `tills`, `sales`, `sale_items`, `sale_payments`
- `kitchen_orders`, `kitchen_order_items`, `held_orders`, `held_order_items`
- `till_payments` (via till → shop), `pos_held_orders`
- `subscriptions`, `billing_records`, `billing_exemptions`, `notifications`

The application sets `app.current_shop_id` on each database connection/transaction.

---

## Entity-Relationship Summary

```
                            ┌──────────┐
                            │  users   │
                            └────┬─────┘
              ┌──────────────────┼───────────────────┐
              ▼                  ▼                    ▼
       ┌────────────┐    ┌──────────┐    ┌──────────────────┐
       │admin_users │    │sessions  │    │payment_methods   │
       └────────────┘    └──────────┘    └──────────────────┘
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                  ┌──────────┐  ┌────────────────────┐
                  │shop_     │  │notification_       │
                  │members   │  │preferences         │
                  └─────┬────┘  └────────────────────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌────────────┐
    │  shops   │ │ branches │ │branch_members│
    └────┬─────┘ └────┬─────┘ └────────────┘
         │            │
   ┌─────┼─────────┬──┼──────────┬───────────┐
   ▼     ▼         ▼  ▼          ▼           ▼
┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐
│products│ │suppliers │ │warehouses│ │customers │ │  tills    │
└───┬────┘ └────┬─────┘ └──────────┘ └──────────┘ └─────┬─────┘
    │           │                                        │
    │     ┌─────┴──────┐                    ┌────────────┼────────────┐
    │     ▼            ▼                    ▼            ▼            ▼
    │ ┌────────────┐ ┌────────────┐   ┌────────┐ ┌──────────┐ ┌──────────┐
    │ │supplier_   │ │purchase_   │   │ sales  │ │kitchen_  │ │held_     │
    │ │products    │ │orders      │   └───┬────┘ │orders    │ │orders    │
    │ └────────────┘ └─────┬──────┘       │      └────┬─────┘ └────┬─────┘
    │                      ▼              │           ▼            ▼
    │               ┌──────────┐    ┌─────┴────┐ ┌──────────┐ ┌──────────┐
    │               │ po_items │    │sale_items│ │kitchen_  │ │held_order│
    │               └──────────┘    │sale_     │ │order_    │ │_items    │
    │                               │payments  │ │items     │ └──────────┘
    │                               └──────────┘ └──────────┘
    │
    ├──▶ batches
    ├──▶ product_locations
    ├──▶ price_history
    ├──▶ stock_adjustments
    ├──▶ stock_transfers
    ├──▶ goods_receipts ──▶ goods_receipt_items
    └──▶ categories, units_of_measure

    tills ──▶ till_payments
    shops ──▶ pos_held_orders ──▶ pos_held_order_items

         ┌───────────┐    ┌──────────────┐    ┌────────────┐
         │   plans   │───▶│subscriptions │───▶│billing_    │
         └───────────┘    └──────────────┘    │records     │
                                               └────────────┘
                                               billing_exemptions

    ┌──────────────┐    ┌───────────────┐    ┌─────────────┐
    │audit_events  │◀───│investigation_ │───▶│investigations│
    └──────┬───────┘    │events         │    └──────┬──────┘
           │            └───────────────┘           │
           │                                        ▼
           ▼                                 ┌──────────────┐
    ┌──────────────┐                         │investigation_│
    │anomaly_events│                         │notes         │
    └──────┬───────┘                         └──────────────┘
           ▼
    ┌──────────────┐    ┌──────────────┐    ┌────────────────┐
    │  anomalies   │    │announcements │    │detection_rules │
    └──────────────┘    └──────────────┘    └────────────────┘

    ┌──────────────┐    ┌───────────────────────┐
    │notifications │    │notification_preferences│
    └──────────────┘    └───────────────────────┘

    ┌──────────────────┐    ┌─────────────────────────────┐
    │admin_expenses    │───▶│admin_expense_attachments     │
    └──────────────────┘    └─────────────────────────────┘

    ┌──────────────┐
    │  milestones  │
    └──────────────┘

    ── Laravel Framework ──────────────────────────────────
    ┌─────────────────────┐    ┌──────────────┐
    │password_reset_tokens│    │  failed_jobs  │
    └─────────────────────┘    └──────────────┘
    ┌─────────────────────────┐ ┌─────────┐ ┌─────────────┐
    │personal_access_tokens   │ │  jobs   │ │ job_batches │
    └─────────────────────────┘ └─────────┘ └─────────────┘
    ┌──────────┐    ┌──────────────┐
    │  cache   │    │ cache_locks  │
    └──────────┘    └──────────────┘
```

---

## Table Summary

| # | Table | Scope | Description |
|---|---|---|---|
| 1 | `users` | Global | User accounts |
| 2 | `sessions` | User | Active login sessions |
| 3 | `shops` | Global | Tenant organizations |
| 4 | `branches` | Shop | Locations within a shop |
| 5 | `shop_members` | Shop | User-to-shop role assignments |
| 6 | `branch_members` | Shop | Member-to-branch assignments |
| 7 | `categories` | Shop | Product categories |
| 8 | `units_of_measure` | Shop | Measurement units |
| 9 | `products` | Shop | Product catalog |
| 10 | `warehouses` | Shop | Storage locations |
| 11 | `product_locations` | Shop | Stock per product per location |
| 12 | `batches` | Shop | Batch-tracked inventory |
| 13 | `stock_adjustments` | Shop | Manual stock corrections |
| 14 | `stock_transfers` | Shop | Inter-location stock moves |
| 15 | `price_history` | Shop | Product price change log |
| 16 | `goods_receipts` | Shop | Ad-hoc stock receiving headers |
| 17 | `goods_receipt_items` | Shop | Ad-hoc stock receiving line items |
| 18 | `suppliers` | Shop | Vendor records |
| 19 | `supplier_products` | Shop | Supplier-product pricing |
| 20 | `purchase_orders` | Shop | PO headers |
| 21 | `po_items` | Shop | PO line items |
| 22 | `customers` | Shop | Customer records |
| 23 | `tills` | Branch | POS register sessions |
| 24 | `sales` | Shop | Sale transactions |
| 25 | `sale_items` | Shop | Sale line items |
| 26 | `sale_payments` | Shop | Payment splits per sale |
| 27 | `kitchen_orders` | Branch | Kitchen display orders |
| 28 | `kitchen_order_items` | Branch | Kitchen order line items |
| 29 | `held_orders` | Branch | Bar/kitchen parked orders |
| 30 | `held_order_items` | Branch | Bar held order line items |
| 31 | `till_payments` | Branch | Per-order payments within a till |
| 32 | `pos_held_orders` | Branch | Retail POS parked cart state |
| 33 | `pos_held_order_items` | Branch | POS held order line items |
| 34 | `plans` | Platform | Subscription tier definitions |
| 35 | `subscriptions` | Shop | Shop plan assignments |
| 36 | `payment_methods` | User | Saved billing methods |
| 37 | `billing_records` | Shop | Subscription payment history |
| 38 | `billing_exemptions` | Shop | Admin-granted billing exemptions |
| 39 | `admin_users` | Platform | Admin portal access |
| 40 | `announcements` | Platform | Platform announcements |
| 41 | `audit_events` | Platform/Shop | Immutable audit log |
| 42 | `investigations` | Platform | Fraud investigation cases |
| 43 | `investigation_events` | Platform | Audit events linked to cases |
| 44 | `investigation_notes` | Platform | Case discussion notes |
| 45 | `anomalies` | Platform | Detected anomalies |
| 46 | `anomaly_events` | Platform | Anomaly trigger events |
| 47 | `detection_rules` | Platform | Anomaly detection rule definitions |
| 48 | `admin_expenses` | Platform | Platform operational expenses |
| 49 | `admin_expense_attachments` | Platform | Expense file attachments |
| 50 | `milestones` | Platform | Company milestone timeline |
| 51 | `notifications` | User/Shop | User notifications |
| 52 | `notification_preferences` | User | Per-user notification settings |
| | **Laravel Framework** | | |
| 53 | `password_reset_tokens` | Framework | Password reset flow tokens |
| 54 | `personal_access_tokens` | Framework | Sanctum API token auth |
| 55 | `jobs` | Framework | Queue worker jobs |
| 56 | `job_batches` | Framework | Queue job batch tracking |
| 57 | `failed_jobs` | Framework | Failed queue job log |
| 58 | `cache` | Framework | Database cache driver |
| 59 | `cache_locks` | Framework | Atomic cache lock support |

**Total: 59 tables** (52 application + 7 Laravel framework)

---

## Key Constraints Summary

| Constraint | Tables | Purpose |
|---|---|---|
| `UNIQUE (shop_id, name)` | branches, categories, warehouses, suppliers | No duplicate names within a shop |
| `UNIQUE (shop_id, sku)` | products | Unique SKU per shop |
| `UNIQUE (shop_id, abbreviation)` | units_of_measure | Unique unit codes per shop |
| `UNIQUE (shop_id, reference)` | goods_receipts | Unique receipt reference per shop |
| `UNIQUE (user_id, shop_id)` | shop_members | One role per user per shop |
| `UNIQUE (member_id, branch_id)` | branch_members | No duplicate branch assignments |
| `UNIQUE (supplier_id, product_id)` | supplier_products | One entry per supplier-product pair |
| `UNIQUE (po_id, product_id)` | po_items | One line per product per PO |
| `UNIQUE (shop_id, batch_number)` | batches | Unique batch numbers per shop |
| `UNIQUE (user_id)` | admin_users, notification_preferences | One admin record / preference set per user |
| Active subscription unique index | subscriptions | Only one active subscription per shop |
| `CHECK` on product_locations | product_locations | At least one location specified |
| `CHECK` on stock_transfers | stock_transfers | Source and destination required |
| `UNIQUE (token)` | personal_access_tokens | Unique Sanctum API tokens |
| `UNIQUE (uuid)` | failed_jobs | Unique failed job identifiers |
| `ON DELETE CASCADE` | All child tables | Cascading cleanup on parent deletion |
