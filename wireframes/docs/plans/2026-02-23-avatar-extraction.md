# Avatar Component Extraction — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract repeated avatar/initials divs into a shared `Avatar` component and migrate all initials-based instances.

**Architecture:** Single `Avatar` component with numeric `size` prop and auto-scaled font/border-radius. Supports circle and rounded-square shapes, solid and gradient backgrounds. No theme hook dependency — color passed as prop.

**Tech Stack:** React 19, TypeScript (strict), inline styles.

**Design doc:** `docs/plans/2026-02-23-avatar-component-design.md`

---

## Migration Scope (10 instances, 5 files)

| # | File | Instances | Shape | Background |
|---|------|-----------|-------|------------|
| 1 | TeamPage.tsx | 3 | rounded | gradient + border, role color |
| 2 | AdminUsersTab.tsx | 2 | circle | solid primary, white text |
| 3 | CustomersPage.tsx | 2 | rounded | type-colored light bg (uses textColor override) |
| 4 | AdminTeamTab.tsx | 1 | circle | primary light bg (uses textColor override) |
| 5 | AccountPage.tsx | 1 | rounded | gradient + border |

---

### Task 1: Create the Avatar component

**Files:**
- Create: `src/components/ui/Avatar.tsx`
- Modify: `src/components/ui/index.ts`

**Step 1: Create `src/components/ui/Avatar.tsx`**

```tsx
import type { CSSProperties } from 'react';

export interface AvatarProps {
  initials: string;
  size: number;
  color: string;
  shape?: 'circle' | 'rounded';
  gradient?: boolean;
  border?: boolean;
  textColor?: string;
}

export function Avatar({
  initials,
  size,
  color,
  shape = 'circle',
  gradient = false,
  border = false,
  textColor,
}: AvatarProps) {
  const fontSize = Math.round(size * 0.36);
  const borderRadius = shape === 'circle' ? '50%' : Math.round(size * 0.28);
  const bg = gradient
    ? `linear-gradient(135deg, ${color}40, ${color}20)`
    : color;
  const fg = textColor ?? (gradient ? color : '#fff');

  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius,
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize,
    fontWeight: 800,
    color: fg,
    flexShrink: 0,
    ...(border ? { border: `2px solid ${color}25` } : {}),
  };

  return <div style={style}>{initials}</div>;
}
```

**Step 2: Add barrel export to `src/components/ui/index.ts`**

Add at the end:
```ts
export { Avatar, type AvatarProps } from './Avatar';
```

**Step 3: Verify it builds**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/ui/Avatar.tsx src/components/ui/index.ts
git commit -m "feat: add Avatar component with auto-scaled font and shape variants"
```

---

### Task 2: Migrate TeamPage.tsx (3 instances)

**Files:**
- Modify: `src/pages/team/TeamPage.tsx`

Three avatar instances to replace:

**Instance 1 — Edit member modal header (~line 268):**
Current: 52x52, borderRadius 14, gradient + border, role color, initials
Replace with:
```tsx
<Avatar initials={member.avatar} size={52} color={roleMeta.color} shape="rounded" gradient border />
```

**Instance 2 — Mobile card avatar (~line 527):**
Current: 44x44, borderRadius 12, gradient + border, role color, initials
Replace with:
```tsx
<Avatar initials={member.avatar} size={44} color={role.color} shape="rounded" gradient border />
```

**Instance 3 — Desktop table avatar (~line 572):**
Current: 40x40, borderRadius 12, gradient + border, role color, initials
Replace with:
```tsx
<Avatar initials={member.avatar} size={40} color={role.color} shape="rounded" gradient border />
```

Note: These avatar instances may now be inside DataTable column render functions (from earlier DataTable migration). Read the file first to find exact locations.

**Step 1:** Read file, find all three avatar divs, replace each with `<Avatar>`
**Step 2:** Add `Avatar` to import from `@/components/ui`
**Step 3:** Run `npm run typecheck`
**Step 4:** Commit: `git commit -m "refactor: migrate TeamPage avatars to Avatar component"`

---

### Task 3: Migrate AdminUsersTab.tsx (2 instances)

**Files:**
- Modify: `src/pages/admin/AdminUsersTab.tsx`

**Instance 1 — User list avatar (~line 88):**
Current: 36x36, borderRadius 50%, solid `C.primary`, white text, single initial
Replace with:
```tsx
<Avatar initials={u.avatar} size={36} color={C.primary} />
```
(Defaults: shape='circle', gradient=false → solid primary bg, white text)

**Instance 2 — User detail header (~line 143):**
Current: 52x52, borderRadius 50%, solid `C.primary`, white text, single initial, fontWeight 700
Replace with:
```tsx
<Avatar initials={u.avatar} size={52} color={C.primary} />
```
Note: existing fontWeight is 700, Avatar uses 800. This is an acceptable minor change for consistency.

**Step 1:** Read file, find both avatar divs, replace with `<Avatar>`
**Step 2:** Add `Avatar` to import from `@/components/ui`
**Step 3:** Run `npm run typecheck`
**Step 4:** Commit: `git commit -m "refactor: migrate AdminUsersTab avatars to Avatar component"`

---

### Task 4: Migrate CustomersPage.tsx (2 instances)

**Files:**
- Modify: `src/pages/customers/CustomersPage.tsx`

**Instance 1 — Customer detail header (~line 84):**
Current: 64x64, borderRadius 18, `${typeColors[c.type]}15` background, type-colored text, first letter of name
Replace with:
```tsx
<Avatar initials={c.name[0]} size={64} color={typeColors[c.type]} shape="rounded" gradient textColor={typeColors[c.type]} />
```
Wait — the current background is `${typeColors[c.type]}15` (solid light wash), not a gradient. The `gradient` prop produces `linear-gradient(135deg, ${color}40, ${color}20)` which is close but different. Use `textColor` override and set background manually... Actually, let's check: the gradient flag produces a light wash via the 40/20 hex opacity suffixes. The existing pattern uses `15` suffix (even lighter). Close enough for wireframes.

Alternative: use `gradient` since it produces a similar light-colored background effect.

```tsx
<Avatar initials={c.name[0]} size={64} color={typeColors[c.type]} shape="rounded" gradient />
```
The gradient produces `linear-gradient(135deg, ${color}40, ${color}20)` which is visually similar to `${color}15`. Text color with gradient defaults to `color` itself (dark text on light bg). This matches the existing pattern.

**Instance 2 — Customer list/table row (~line 208, now inside DataTable column render):**
Current: 36x36, borderRadius 10, `${typeColors[c.type]}15` bg, type-colored text, first letter
Replace with:
```tsx
<Avatar initials={c.name[0]} size={36} color={typeColors[c.type]} shape="rounded" gradient />
```

**Step 1:** Read file, find both avatar divs, replace with `<Avatar>`
**Step 2:** Add `Avatar` to import from `@/components/ui`
**Step 3:** Run `npm run typecheck`
**Step 4:** Commit: `git commit -m "refactor: migrate CustomersPage avatars to Avatar component"`

---

### Task 5: Migrate AdminTeamTab.tsx (1 instance)

**Files:**
- Modify: `src/pages/admin/AdminTeamTab.tsx`

**Instance — Team member detail header (~line 120):**
Current: 56x56, borderRadius 50%, `C.primary + '15'` background, primary-colored text, two initials
Replace with:
```tsx
<Avatar initials={selectedMember.avatar} size={56} color={C.primary} gradient />
```
The gradient produces `linear-gradient(135deg, ${C.primary}40, ${C.primary}20)` vs the existing `C.primary + '15'` (solid light wash). Visually similar for wireframes.

**Step 1:** Read file, find avatar div, replace with `<Avatar>`
**Step 2:** Add `Avatar` to import from `@/components/ui`
**Step 3:** Run `npm run typecheck`
**Step 4:** Commit: `git commit -m "refactor: migrate AdminTeamTab avatar to Avatar component"`

---

### Task 6: Migrate AccountPage.tsx (1 instance)

**Files:**
- Modify: `src/pages/settings/AccountPage.tsx`

**Instance — Profile avatar (~line 259):**
Current: 56x56, borderRadius 16, gradient `linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.accent}15)` with `2px solid ${COLORS.primary}25` border, primary-colored text, two initials

This one has a two-color gradient (`primary` → `accent`). The Avatar component only supports single-color gradients. Two options:
- **a)** Use `<Avatar initials={profile.avatar} size={56} color={COLORS.primary} shape="rounded" gradient border />` — close enough (uses primary only)
- **b)** Skip this instance since the two-color gradient can't be represented

Recommend option (a) — it's a wireframe, visual parity doesn't need to be pixel-perfect.

**Step 1:** Read file, find avatar div, replace with `<Avatar>`
**Step 2:** Add `Avatar` to import from `@/components/ui`
**Step 3:** Run `npm run typecheck`
**Step 4:** Commit: `git commit -m "refactor: migrate AccountPage profile avatar to Avatar component"`

---

### Task 7: Final verification

**Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 2: Run build**

Run: `npm run build`
Expected: Successful production build

**Step 3: Commit any cleanup if needed**
