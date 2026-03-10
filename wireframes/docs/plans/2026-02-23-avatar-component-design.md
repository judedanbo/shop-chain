# Avatar Component Extraction — Design

**Date:** 2026-02-23
**Status:** Approved

## Problem

Circular/rounded-square divs with initials are repeated across ~10 instances in 5 files. Each re-implements the same flexbox centering, border-radius, font sizing, and color logic with inline styles. No shared Avatar component exists.

## Decision

Single `Avatar` component with numeric `size` prop and auto-scaled font/border-radius. Supports both circle and rounded-square shapes, solid and gradient backgrounds.

## Component API

```tsx
export interface AvatarProps {
  initials: string;
  size: number;                        // pixel width & height
  color: string;                       // primary color for text/bg/border
  shape?: 'circle' | 'rounded';       // default: 'circle'
  gradient?: boolean;                  // linear-gradient background. Default: false
  border?: boolean;                    // 2px border from color. Default: false
  textColor?: string;                  // override derived text color
}
```

## Rendering

- **Background:**
  - `gradient={true}`: `linear-gradient(135deg, ${color}40, ${color}20)`
  - `gradient={false}`: solid `color`
- **Text color:**
  - With gradient: `color` (dark on light)
  - Without gradient: `'#fff'` (white on solid)
  - `textColor` overrides both
- **Border radius:**
  - `circle`: `'50%'`
  - `rounded`: `Math.round(size * 0.28)` — produces 10px@36, 12px@44, 14px@52, 18px@64
- **Border:** `2px solid ${color}25` when `border={true}`
- **Font size:** `Math.round(size * 0.36)` — produces 13px@36, 14px@40, 18px@52, 20px@56
- **Font weight:** `800`
- **Layout:** `display: 'flex'`, `alignItems: 'center'`, `justifyContent: 'center'`, `flexShrink: 0`

## File Location

- **New file:** `src/components/ui/Avatar.tsx`
- **Barrel export:** Added to `src/components/ui/index.ts`
- **No theme hook needed** — color passed as prop

## Migration Scope (~10 instances, 5 files)

| File | Instances | Pattern |
|------|-----------|---------|
| TeamPage.tsx | 3 | rounded + gradient + border, role color |
| AdminUsersTab.tsx | 2 | circle, solid primary, white text |
| CustomersPage.tsx | 2 | rounded, type-colored light bg |
| AdminTeamTab.tsx | 1 | circle, primary light bg |
| AccountPage.tsx | 1 | rounded + gradient + border |

**Not migrated** (icon/emoji content, not initials):
- TeamPage success indicator (CheckCircle icon)
- AccountPage payment method circles (emojis)
- AccountPage delete confirmation (Trash2 icon)
