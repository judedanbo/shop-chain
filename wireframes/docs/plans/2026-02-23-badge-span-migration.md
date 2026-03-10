# Badge Span Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace ~25 raw inline-styled badge spans with the existing `Badge` component across ~10 files.

**Architecture:** Pure migration — no component API changes. Each file is independently migratable. Replace raw `<span style={{...}}>` with `<Badge color="X">` where colors map cleanly. Leave custom-colored spans untouched.

**Tech Stack:** React 19, TypeScript (strict), existing Badge component at `src/components/ui/Badge.tsx`.

**Design doc:** `docs/plans/2026-02-23-badge-span-migration-design.md`

---

## Reference: Badge API

```tsx
<Badge color="primary|success|warning|danger|accent|orange|neutral" size="sm|md">
  {children}
</Badge>
```

- `sm` (default): padding 2px 8px, fontSize 11, borderRadius 6
- `md`: padding 4px 12px, fontSize 12, borderRadius 6
- Children can include icons/emojis alongside text

## Migration Rules

1. **Only replace spans whose colors match a Badge color** — see design doc mapping table
2. **Use `sm` size** unless the original padding is closer to `md` (4px 12px)
3. **Badge already renders `fontWeight: 600`** — don't worry about matching 700 exactly
4. **Badge adds `border: 1px solid`** — acceptable visual difference for wireframes
5. **If the span uses `textTransform`, conditional logic, or custom hex colors → skip it**
6. **If the file doesn't already import Badge, add it**

---

### Task 1: Migrate AdminFinancesTab.tsx

**Files:**
- Modify: `src/pages/admin/AdminFinancesTab.tsx`

**Migratable instances:**

1. **"Recurring" label (~line 395):** `background: C.primaryBg, color: C.primary` → `<Badge color="primary">Recurring</Badge>`

2. **Cash runway health (~line 516):** Conditional success/warning/danger. Replace with:
   ```tsx
   <Badge color={cashRunway >= 12 ? 'success' : cashRunway >= 6 ? 'warning' : 'danger'}>
     {cashRunway >= 12 ? 'Healthy' : cashRunway >= 6 ? 'Moderate' : 'Critical'}
   </Badge>
   ```
   (The original is a `<div>` — Badge renders as `<span>`, which is fine inline)

3. **Active/Paused status (~line 691):** Conditional success/neutral. Replace with:
   ```tsx
   <Badge color={sr.enabled ? 'success' : 'neutral'}>{sr.enabled ? 'Active' : 'Paused'}</Badge>
   ```

**Skip:** Lines 283, 295 (custom purple hex #8B5CF6, not a Badge color)

**Steps:**
1. Read file, find the 3 migratable spans
2. Replace each with `<Badge>`
3. Add `Badge` to imports from `@/components/ui` if not already imported
4. Run `npm run typecheck`
5. Commit: `git commit -m "refactor: migrate AdminFinancesTab badge spans to Badge component"`

---

### Task 2: Migrate AdminSubscriptionsTab.tsx

**Files:**
- Modify: `src/pages/admin/AdminSubscriptionsTab.tsx`

**Migratable instances:**

1. **"DEFAULT" label (~line 670):** `background: ${C.primary}25, color: C.primary` → `<Badge color="primary">DEFAULT</Badge>`

2. **"X at limit" (~line 714):** `background: ${C.danger}20, color: C.danger` → `<Badge color="danger">{pu.blocked.length} at limit</Badge>`

3. **"X near limit" (~line 715):** `background: ${C.warning}20, color: C.warning` → `<Badge color="warning">{pu.warnings.length} near limit</Badge>`

**Skip:** Lines 102, 111, 126, 140 (use dynamic custom colors from lifecycle/plan/status objects — not Badge colors)

**Steps:**
1. Read file, find 3 migratable spans
2. Replace with `<Badge>`
3. Add `Badge` import if needed
4. Run `npm run typecheck`
5. Commit: `git commit -m "refactor: migrate AdminSubscriptionsTab badge spans to Badge component"`

---

### Task 3: Migrate AdminUsersTab.tsx

**Files:**
- Modify: `src/pages/admin/AdminUsersTab.tsx`

**Migratable instances:**

1. **"DEFAULT" label (~line 205):** `background: ${C.primary}30, color: C.primary` → `<Badge color="primary">DEFAULT</Badge>`

**Skip:** Lines 33, 38, 48 (use dynamic status/plan objects with custom colors)

**Steps:**
1. Read file, find the span
2. Replace with `<Badge>`
3. Badge may already be imported (check)
4. Run `npm run typecheck`
5. Commit: `git commit -m "refactor: migrate AdminUsersTab DEFAULT badge to Badge component"`

---

### Task 4: Migrate AdminAuditFraudTab.tsx

**Files:**
- Modify: `src/pages/admin/AdminAuditFraudTab.tsx`

**Migratable instances:**

1. **Investigation IDs (~line 415):** `background: C.surfaceAlt, color: sec.color, border: 1px solid ${C.border}` → `<Badge color="neutral">{id}</Badge>`

**Skip:** Line 976 (FLAG_COLORS — custom hex)

**Steps:**
1. Read file, find the span
2. Replace with `<Badge>`
3. Add `Badge` import if needed
4. Run `npm run typecheck`
5. Commit: `git commit -m "refactor: migrate AdminAuditFraudTab investigation ID badge to Badge component"`

---

### Task 5: Migrate CustomersPage.tsx

**Files:**
- Modify: `src/pages/customers/CustomersPage.tsx`

**Migratable instances:**

1. **"Since..." label (~line 91):** `background: COLORS.surfaceAlt, color: COLORS.textDim` → `<Badge color="neutral">Since {c.createdAt}</Badge>`

2. **Loyalty points (~line 92):** `background: ${COLORS.warning}15, color: COLORS.warning` → `<Badge color="warning">⭐ {c.loyaltyPts} pts</Badge>`

**Skip:** Lines 90, 126, 224 (use `typeColors[c.type]` — custom dynamic colors)

**Steps:**
1. Read file, find 2 migratable spans
2. Replace with `<Badge>`
3. Badge may already be imported (check)
4. Run `npm run typecheck`
5. Commit: `git commit -m "refactor: migrate CustomersPage badge spans to Badge component"`

---

### Task 6: Migrate barPos files (OrderPanel, ProductCatalog, TillOrdersDrawer)

**Files:**
- Modify: `src/pages/barPos/OrderPanel.tsx`
- Modify: `src/pages/barPos/ProductCatalog.tsx`
- Modify: `src/pages/barPos/TillOrdersDrawer.tsx`

**Migratable instances:**

1. **OrderPanel "Serve from Bar" (~line 128):** `color: COLORS.accent, background: COLORS.accentBg` → `<Badge color="accent">Serve from Bar</Badge>`

2. **ProductCatalog "Bar" (~line 83):** `color: COLORS.accent, background: COLORS.accentBg` → `<Badge color="accent">Bar</Badge>`

3. **TillOrdersDrawer "Held" (~line 198):** `background: COLORS.warningBg, color: COLORS.warning` → `<Badge color="warning">Held</Badge>`

**Skip:** TillOrdersDrawer line 71 (dynamic `sc.bg`/`sc.text` from status object)

**Steps:**
1. Read all 3 files, find migratable spans
2. Replace with `<Badge>`
3. Add Badge imports where needed
4. Run `npm run typecheck`
5. Commit: `git commit -m "refactor: migrate barPos badge spans to Badge component"`

---

### Task 7: Migrate AuthHelpers.tsx

**Files:**
- Modify: `src/pages/auth/AuthHelpers.tsx`

**Migratable instances:**

1. **Password requirement indicators (~line 129):** Conditional success/neutral with transition.
   ```tsx
   <Badge color={c.met ? 'success' : 'neutral'}>
     {c.met ? '✓' : '○'} {c.label}
   </Badge>
   ```
   Note: The original has `transition: 'all 0.3s'` which Badge doesn't support. Acceptable loss for wireframes.

**Steps:**
1. Read file, find the password requirement spans
2. Replace with `<Badge>`
3. Add Badge import
4. Run `npm run typecheck`
5. Commit: `git commit -m "refactor: migrate AuthHelpers password badges to Badge component"`

---

### Task 8: Final verification

**Step 1:** Run `npm run typecheck` — expected: no errors
**Step 2:** Run `npm run build` — expected: successful build
**Step 3:** Commit any cleanup if needed
