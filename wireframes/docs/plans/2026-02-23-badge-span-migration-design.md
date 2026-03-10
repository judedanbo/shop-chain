# Badge Span Migration — Design

**Date:** 2026-02-23
**Status:** Approved

## Problem

~40 raw inline-styled `<span>` elements with badge-like styling (padding, borderRadius, background, fontSize, fontWeight) exist across ~12 files despite a shared Badge component being available.

## Decision

Replace raw spans that cleanly map to existing Badge colors. No changes to Badge or StatusBadge APIs. Leave custom-colored spans (hex colors, role colors, plan colors) as-is.

## Mapping Rule

A raw span is migratable if its colors match a Badge color:

| Badge color | Background pattern | Text color |
|---|---|---|
| primary | primaryBg / ${primary}XX | primary / primaryLight |
| success | successBg / ${success}XX | success |
| warning | warningBg / ${warning}XX | warning |
| danger | dangerBg / ${danger}XX | danger |
| accent | accentBg / ${accent}XX | accent |
| neutral | surfaceAlt | textDim / textMuted |

Size: `sm` for padding ~2px 8px, `md` for padding ~4px 12px.

## Migration Scope (~25 migratable instances)

| File | Count | Examples |
|------|-------|---------|
| AdminFinancesTab.tsx | 3 | "Recurring" (primary), cashRunway health (success/warning/danger), Active/Paused (success/neutral) |
| AdminSubscriptionsTab.tsx | 4 | "DEFAULT" (primary), at-limit (danger), near-limit (warning), payment status |
| AdminUsersTab.tsx | 2 | "DEFAULT" (primary), payment status |
| AdminAuditFraudTab.tsx | 1 | Investigation IDs (neutral) |
| CustomersPage.tsx | 4 | "Since..." (neutral), loyalty points (warning), customer type, payment method |
| AuthHelpers.tsx | 1 | Password requirement indicators (success/neutral) |
| OrderPanel.tsx (barPos) | 1 | "Serve from Bar" (accent) |
| ProductCatalog.tsx (barPos) | 1 | "Bar" (accent) |
| TillOrdersDrawer.tsx | 2 | Order status, "Held" (warning) |
| KitchenDisplayPage.tsx | 1 | Order status |

## Not Migrated (~15 instances)

- Spans with custom hex colors (#8B5CF6, FLAG_COLORS, role.color, plan.color)
- Spans inside existing local helper functions
- Spans with unique styling (textTransform uppercase + letterSpacing, borderRadius 8)
