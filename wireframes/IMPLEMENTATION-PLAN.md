# ShopChain — Missing Features Implementation Plan

> Implements all features from the original wireframe (`shopchain-inventory final.jsx`) that are missing or incomplete in the current modularized TypeScript codebase.

---

## Context

The original monolithic wireframe (18,597 lines) defines a comprehensive inventory management SaaS platform. The current TypeScript implementation covers ~88% of the wireframe — all user-facing features are nearly complete, but the **Admin Portal** (SuperAdminDashboard) is only ~20% implemented (basic scaffolding for 5 of 10 tabs, none fully matching the wireframe). Additionally, the **Shop Settings** page is missing geolocation, receipt logo upload, and an advanced hours editor.

This plan addresses every gap identified in `WIREFRAME-ANALYSIS.md`.

---

## Architecture Decisions

### 1. Decompose SuperAdminDashboard into sub-components
The current admin is a single 476-line file. The wireframe equivalent is ~5,000+ lines. To keep files manageable (<500 lines each):

```
src/pages/admin/
├── SuperAdminDashboard.tsx          ← Orchestrator (nav, sidebar, tab routing)
├── AdminOverviewTab.tsx             ← KPI cards, charts, recent activity
├── AdminUsersTab.tsx                ← User list + detail view (exists inline, extract)
├── AdminShopsTab.tsx                ← Shop list + detail view (exists inline, extract)
├── AdminSubscriptionsTab.tsx        ← 4 sub-tabs: overview, plans, userSubs, usage
├── AdminFinancesTab.tsx             ← 6 sub-tabs: dashboard, revenue, expenses, cashflow, projections, reports
├── AdminInvestorsTab.tsx            ← 4 sub-tabs: metrics, growth, usersShops, deck
├── AdminAnnouncementsTab.tsx        ← Announcement list + create/edit
├── AdminTeamTab.tsx                 ← Admin team list + detail + invite modal
├── AdminAuditFraudTab.tsx           ← 5 sub-tabs: activityLog, investigation, anomalies, forensics, reports
└── AdminSettingsTab.tsx             ← Theme toggle, platform config toggles
```

### 2. New data/type files
```
src/constants/
├── adminData.ts                     ← Admin users, shops, team, announcements, audit log (basic)
├── adminFinances.ts                 ← 12-month revenue/expense arrays, expense categories, tax rates
├── adminInvestors.ts                ← Engagement, growth, cohort, milestones data
└── adminAuditData.ts                ← 30 audit events, investigations, anomalies, detection rules, forensics

src/types/
└── admin.types.ts                   ← All admin-specific interfaces
```

### 3. Reuse existing patterns
- **Charts**: Extend `MiniChart.tsx` pattern (inline SVG) for bar charts, heatmaps, and line charts
- **UI components**: Reuse `Card`, `Badge`, `Button`, `Input`, `Select`, `Paginator`, `ProgressBar`
- **Responsive**: Use `rv()`, `rg()`, `isMobile()`, `useBreakpoint()` throughout
- **Theme**: Admin tabs receive `C` (admin theme colors) as prop from orchestrator

---

## Implementation Phases

### Phase 1: Foundation — Types, Data & Refactor (Est. ~800 lines)

**Step 1.1: Create `src/types/admin.types.ts`**
Define all admin interfaces:
- `AdminUser`, `AdminShop` (enhance existing inline types)
- `AdminPlan` (extends `PlanTier` from `plan.types.ts` with lifecycle fields)
- `PlanLifecycle`: `'draft' | 'scheduled' | 'active' | 'retiring' | 'retired'`
- `AdminRole`: `'super_admin' | 'admin' | 'billing_manager' | 'support_agent' | 'auditor'`
- `AdminTeamMember` with permissions map
- `AdminAnnouncement` with target, priority, status
- `AuditEvent` with 15+ fields (ts, actor, actorId, role, cat, action, target, ip, device, session, location, risk, before, after, note)
- `Investigation` with status, priority, assignee, linked events/users, notes, findings
- `Anomaly` with rule, severity, entity, status, linked case
- `DetectionRule` with threshold, severity, enabled, triggers
- `FinanceRecord`, `ExpenseItem`, `InvestorMetric`, `Milestone`
- `ExemptionForm`, `AdminInviteForm`

**Step 1.2: Create `src/constants/adminData.ts`**
Port from wireframe:
- `ADMIN_DEMO_USERS` (8 users with full fields: avatar, phone, plan, status, shops, branches, joined, lastActive)
- `ADMIN_DEMO_SHOPS` (6 shops)
- `MOCK_PAYMENT_METHODS` (per-user, keyed by user ID)
- `MOCK_PAYMENT_HISTORY` (per-user, keyed by user ID)
- `MOCK_USER_USAGE` (per-user usage stats)
- `ADMIN_ROLES` (5 role definitions with permission maps)
- `PERMISSION_LABELS` (12 permission display names)
- `MOCK_ADMIN_TEAM` (5+ admin team members)

**Step 1.3: Create `src/constants/adminFinances.ts`**
Port from wireframe:
- `FIN_MONTHS`, `FIN_MONTH_LABELS` (12-month period)
- `FIN_REVENUE` (12 monthly revenue figures)
- `FIN_EXPENSES` (12 monthly expense totals)
- `FIN_EXPENSE_CATEGORIES` (8 categories with icons/colors)
- `FIN_EXPENSE_DETAIL` (16+ expense line items)
- `GH_TAX` (Ghana tax rates: corporate 25%, NHIL 2.5%, GETFund 2.5%, COVID levy 1%, VAT 15%)
- `FIN_CASHFLOW_OTHER` (owner investment, loan repayment, dividends, equipment, dev costs)

**Step 1.4: Create `src/constants/adminInvestors.ts`**
Port from wireframe:
- `INV_ENGAGEMENT` (12 months DAU/WAU/MAU)
- `INV_USER_GROWTH` (12 months new/churned/net)
- `INV_SHOP_GROWTH` (12 months)
- `INV_COHORT_RETENTION` (6 cohorts × 6 months)
- `INV_MILESTONES` (8+ milestone entries)
- `MILESTONE_ICONS` (16 emojis)

**Step 1.5: Create `src/constants/adminAuditData.ts`**
Port from wireframe:
- `AUDIT_CATEGORIES` (5 categories: auth, financial, data, admin, system)
- `AUDIT_RISK_LEVELS` (4 levels with color/range)
- `MOCK_AUDIT_LOG` (30 detailed events)
- `MOCK_INVESTIGATIONS` (4 investigation cases with notes)
- `MOCK_ANOMALIES` (8 detected anomalies)
- `AUDIT_DETECTION_RULES` (8 configurable rules)
- `MOCK_USER_FORENSIC_LOGINS` (10 login entries)
- `MOCK_HEATMAP` (7×24 activity grid)

**Step 1.6: Refactor `SuperAdminDashboard.tsx`**
- Extract existing Overview, Users, Shops sections into separate tab components
- Keep orchestrator with: admin nav, sidebar, theme toggle, tab routing
- Pass `C` (admin colors), `bp`, shared state down as props

---

### Phase 2: Admin Subscriptions Tab (Est. ~600 lines)

**File: `src/pages/admin/AdminSubscriptionsTab.tsx`**

4 sub-tabs:
1. **Overview**: MRR/ARPU/active subscriber KPI cards, plan breakdown table, payment exemptions list
2. **Plans**: Plan list with create/edit. Plan editor: name, price, icon picker (10 emojis), color selector, limits editor (+/- buttons, unlimited toggle for each of 8 limits), lifecycle management (draft → active → retiring → retired with date pickers, grandfather/migrate options)
3. **User Subs**: Searchable user list, per-user subscription view, change plan action, grant exemption modal (period, unlimited toggle, reason)
4. **Usage**: Per-user usage bars with plan limit percentages

---

### Phase 3: Admin Finances Tab (Est. ~800 lines)

**File: `src/pages/admin/AdminFinancesTab.tsx`**

6 sub-tabs:
1. **Dashboard**: 4 KPI cards (Total Revenue, Expenses, Net Income, Runway) + 12-month grouped bar chart (revenue vs expenses) + health indicators
2. **Revenue**: Revenue by plan breakdown, by payment method, transaction ledger (paginated)
3. **Expenses**: Category summary cards (8 categories), monthly trend chart, expense CRUD table with add/edit modal (category selector, date, amount, description, vendor, recurring toggle, reference, attachment zone)
4. **Cash Flow**: Operating/investing/financing sections, cash waterfall visualization, runway calculation
5. **Projections**: Growth slider (%), churn slider (%), expense growth slider (%), projected MRR display, runway months
6. **Reports**: P&L report with period selector, cash/accrual basis toggle, Ghana tax calculations (corporate, NHIL, GETFund, COVID levy), startup rebate toggle, gross margin, net income

---

### Phase 4: Admin Investors Tab (Est. ~500 lines)

**File: `src/pages/admin/AdminInvestorsTab.tsx`**

4 sub-tabs:
1. **Metrics**: Engagement KPIs (DAU/WAU/MAU, ratios), engagement trend chart, conversion funnel
2. **Growth**: Growth scorecard (6 cards), growth trajectory chart, cohort retention table, churn analysis
3. **Users & Shops**: User stats, growth charts, by-plan breakdown, shop stats, shop type breakdown, platform depth metrics
4. **Deck**: Company snapshot, 12-item key metrics summary table, milestones timeline with add/edit modal (icon picker, date, title, description)

---

### Phase 5: Admin Team Tab (Est. ~400 lines)

**File: `src/pages/admin/AdminTeamTab.tsx`**

- KPI cards (total, active, invited, suspended admins)
- Role breakdown pills
- Searchable/filterable admin list table
- Admin detail view: avatar, info, role assignment grid (5 roles), permission matrix (12 permissions, read-only based on role), recent activity, actions (save, suspend, reactivate, remove)
- Invite admin modal: name, email, phone, role selector (super_admin locked for non-super-admins), welcome message

---

### Phase 6: Admin Audit & Fraud Tab (Est. ~1,200 lines — largest)

**File: `src/pages/admin/AdminAuditFraudTab.tsx`**

5 sub-tabs:
1. **Activity Log**: Filters (search, category dropdown, risk level, date range buttons: 24h/7d/30d/90d). Table: timestamp, icon, action, actor, target, risk score badge, location, expand button. Expandable rows: session info (IP, device, session ID, location), before/after JSON comparison, risk score bar (0-100 with color gradient), action buttons (flag for investigation, copy event ID)
2. **Investigations**: KPI cards (open/in-progress/escalated/closed counts). Case list table. Create case modal (title, description, priority selector, assignee dropdown, link events checklist, link users). Case detail view: header with status dropdown, evidence timeline, linked users with risk scores, findings textarea, resolution buttons (no fraud/confirmed/inconclusive), investigation notes. Case report modal (summary, evidence table, persons of interest, timeline, findings)
3. **Anomalies**: Severity distribution KPIs. Detection rules grid (8 rules with name, description, threshold, triggers count, enabled toggle). Recent anomalies feed (severity pill, rule name, timestamp, status, entity, summary, actions: dismiss/create case/view case)
4. **Forensics**: Risk overview KPIs (total users, flagged, high+ risk, no 2FA). Filters (all/frontend/admin/flagged). Search. User forensic list (avatar, name, email, role, status, flags, risk score 0-100). User forensic detail: login history table, activity heatmap (7×24 SVG grid), linked investigations, risk breakdown
5. **Reports**: Investigation report generation with export options

---

### Phase 7: Admin Enhancements — Existing Tabs (Est. ~300 lines)

**A. Enhance Overview** (`AdminOverviewTab.tsx`):
- Add user growth mini-chart (12 months)
- Add revenue trend mini-chart
- Richer recent activity feed

**B. Enhance Shops** (`AdminShopsTab.tsx`):
- Add shop detail view (owner info, plan, products, branches, status actions)

**C. Enhance Announcements** (`AdminAnnouncementsTab.tsx`):
- Add create announcement form (title, body, target audience, priority)
- Add edit/delete functionality
- Add status toggle (active/inactive)

**D. Admin Settings** (`AdminSettingsTab.tsx`):
- Theme picker (dark/light)
- Admin profile display
- Platform toggles (maintenance mode, registrations, free trial)

---

### Phase 8: Shop Settings Enhancements (Est. ~200 lines)

**File: `src/pages/settings/ShopSettingsPage.tsx`**

Add to existing General tab (since Contact & Operations fields are already consolidated there):

1. **Geolocation integration**:
   - "Locate My Shop" button using browser Geolocation API
   - Permission handling with loading/error states
   - Map preview SVG (grid background, accuracy rings, center pin)
   - Coordinate display with copy-to-clipboard
   - "Open in Google Maps" link

2. **Receipt logo upload**:
   - Hidden file input triggered by styled button
   - Image preview with file size display
   - Replace/remove buttons
   - Accept: PNG, JPG, WebP; max 2MB; recommended 300×100px

3. **Enhanced weekly hours editor**:
   - Per-day open/close toggle with time inputs
   - Quick action buttons ("All Open 8–6", "Weekdays Only")

---

## Implementation Order & Dependencies

```
Phase 1 (Foundation) ──→ Phase 2 (Subscriptions)
         │                         │
         ├──→ Phase 3 (Finances)   │
         │                         │
         ├──→ Phase 4 (Investors)  │
         │                         │
         ├──→ Phase 5 (Admin Team) │
         │                         │
         └──→ Phase 6 (Audit & Fraud)
                                   │
Phase 7 (Enhance Existing) ←──────┘
Phase 8 (Shop Settings) — independent, can run in parallel
```

- **Phase 1 must come first** — all other phases depend on the types and data files
- **Phases 2–6 are independent** of each other and can be done in any order
- **Phase 7** polishes existing tabs after new ones are complete
- **Phase 8** is fully independent

---

## Files to Create (New)

| File | Est. Lines | Purpose |
|------|-----------|---------|
| `src/types/admin.types.ts` | ~150 | All admin interfaces |
| `src/constants/adminData.ts` | ~250 | Admin users, shops, team, roles, permissions |
| `src/constants/adminFinances.ts` | ~150 | Financial mock data, tax rates |
| `src/constants/adminInvestors.ts` | ~120 | Engagement, growth, cohort, milestones |
| `src/constants/adminAuditData.ts` | ~300 | Audit events, investigations, anomalies, rules, forensics |
| `src/pages/admin/AdminOverviewTab.tsx` | ~200 | Enhanced overview dashboard |
| `src/pages/admin/AdminUsersTab.tsx` | ~250 | Extracted + enhanced user management |
| `src/pages/admin/AdminShopsTab.tsx` | ~250 | Extracted + enhanced shop management |
| `src/pages/admin/AdminSubscriptionsTab.tsx` | ~600 | Plan CRUD, lifecycle, exemptions |
| `src/pages/admin/AdminFinancesTab.tsx` | ~800 | Revenue, expenses, projections, P&L |
| `src/pages/admin/AdminInvestorsTab.tsx` | ~500 | Metrics, growth, milestones |
| `src/pages/admin/AdminTeamTab.tsx` | ~400 | Admin team management |
| `src/pages/admin/AdminAuditFraudTab.tsx` | ~1,200 | Audit log, investigations, anomalies, forensics |
| `src/pages/admin/AdminAnnouncementsTab.tsx` | ~200 | Announcement CRUD |
| `src/pages/admin/AdminSettingsTab.tsx` | ~150 | Platform settings |

## Files to Modify (Existing)

| File | Changes |
|------|---------|
| `src/pages/admin/SuperAdminDashboard.tsx` | Refactor to orchestrator: sidebar + nav + tab routing, import sub-components |
| `src/pages/settings/ShopSettingsPage.tsx` | Add geolocation, receipt logo upload, enhanced hours editor |
| `src/types/index.ts` | Re-export admin types |
| `src/constants/index.ts` | Re-export new admin constants (if barrel exports exist) |

---

## Estimated Total

| Phase | New Lines | Description |
|-------|----------|-------------|
| Phase 1 | ~970 | Types + data files + refactor |
| Phase 2 | ~600 | Subscriptions tab |
| Phase 3 | ~800 | Finances tab |
| Phase 4 | ~500 | Investors tab |
| Phase 5 | ~400 | Admin team tab |
| Phase 6 | ~1,200 | Audit & Fraud tab |
| Phase 7 | ~300 | Enhance existing tabs |
| Phase 8 | ~200 | Shop Settings enhancements |
| **Total** | **~4,970** | |

---

## Verification

After each phase:
1. Run `npx tsc --noEmit` — must produce 0 errors
2. Run `npm run build` — must succeed
3. Run `npm run dev` and verify in browser:
   - Navigate to Admin Portal (via admin login)
   - Click through each admin tab
   - Test sub-tab navigation
   - Verify responsive layout (resize browser)
   - Confirm theme toggle works
   - For Shop Settings: test geolocation button, file upload, hours editor

After all phases:
- Full `npm run build` passes
- All admin tabs render without console errors
- All interactive elements (forms, modals, toggles, sliders) function correctly
- Mobile layout is usable for all admin screens
