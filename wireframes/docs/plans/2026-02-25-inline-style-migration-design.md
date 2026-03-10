# Inline Style → Tailwind Migration Design

## Goal

Migrate all remaining 2,801 `style={{}}` inline props across 87 files to Tailwind utility classes. Only truly un-expressible values (complex gradients with theme colors, multi-stop computed values) remain inline.

## Approach: Layer-by-Layer

Migrate by property category across all files in each pass. Each pass is a single commit.

## Breakpoint Mapping

ShopChain's custom breakpoints align with Tailwind defaults (with one addition):

| ShopChain | Pixel | Tailwind Prefix | Note |
|-----------|-------|-----------------|------|
| `sm` | 0 | _(base, no prefix)_ | Mobile-first default |
| `md` | 640 | `sm:` | Tailwind sm = 640px |
| `lg` | 768 | `md:` | Tailwind md = 768px |
| `xl` | 1024 | `lg:` | Tailwind lg = 1024px |
| `xl2` | 1440 | `xl2:` | **Custom** — add `--breakpoint-xl2: 1440px` to `@theme` |

### rv()/rg() Conversion Examples

```tsx
// Before
style={{ padding: rv(bp, { sm: '12px 16px', lg: '14px 48px' }) }}
// After
className="px-4 py-3 md:px-12 md:py-3.5"

// Before
style={{ gridTemplateColumns: rg(bp, { sm: 1, md: 2, lg: 3, xl: 5 }) }}
// After
className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"

// Before
style={{ flexDirection: rv(bp, { sm: 'column', lg: 'row' }) }}
// After
className="flex-col md:flex-row"
```

## Hex-Alpha Opacity Mapping

Use Tailwind arbitrary opacity modifiers for exact fidelity:

| Hex Suffix | Decimal Opacity | Tailwind Modifier |
|------------|-----------------|-------------------|
| `08` | 0.031 | `/[0.03]` |
| `10` | 0.063 | `/[0.06]` |
| `12` | 0.071 | `/[0.07]` |
| `14` | 0.078 | `/[0.08]` |
| `15` | 0.082 | `/[0.08]` |
| `18` | 0.094 | `/[0.09]` |
| `20` | 0.125 | `/[0.13]` |
| `25` | 0.145 | `/[0.15]` |
| `30` | 0.188 | `/[0.19]` |
| `33` | 0.200 | `/[0.20]` |
| `35` | 0.208 | `/[0.21]` |
| `38` | 0.220 | `/[0.22]` |
| `40` | 0.251 | `/[0.25]` |
| `50` | 0.314 | `/[0.31]` |
| `60` | 0.376 | `/[0.38]` |
| `80` | 0.502 | `/50` |
| `90` | 0.565 | `/[0.56]` |
| `AD` | 0.678 | `/[0.68]` |
| `CC` | 0.800 | `/80` |
| `dd` | 0.867 | `/[0.87]` |

### Conversion Examples

```tsx
// Before
style={{ background: `${COLORS.primary}15` }}
// After
className="bg-primary/[0.08]"

// Before
style={{ border: `1px solid ${COLORS.primary}40` }}
// After
className="border border-primary/[0.25]"

// Before (color + string concat)
style={{ background: COLORS.success + '18' }}
// After
className="bg-success/[0.09]"
```

## Static Property Mapping (Top Patterns)

### Padding
| Inline | Tailwind |
|--------|----------|
| `padding: 0` | `p-0` |
| `padding: 14` | `p-3.5` |
| `padding: 16` | `p-4` |
| `padding: 18` | `p-[18px]` |
| `padding: 20` | `p-5` |
| `padding: 24` | `p-6` |
| `padding: 32` | `p-8` |
| `padding: 40` | `p-10` |
| `padding: '6px 8px'` | `px-2 py-1.5` |
| `padding: '6px 10px'` | `px-2.5 py-1.5` |
| `padding: '8px 10px'` | `px-2.5 py-2` |
| `padding: '8px 12px'` | `px-3 py-2` |
| `padding: '8px 16px'` | `px-4 py-2` |
| `padding: '10px 14px'` | `px-3.5 py-2.5` |
| `padding: '10px 16px'` | `px-4 py-2.5` |
| `padding: '12px 14px'` | `px-3.5 py-3` |
| `padding: '12px 16px'` | `px-4 py-3` |
| `padding: '14px 16px'` | `px-4 py-3.5` |
| `padding: '16px 20px'` | `px-5 py-4` |
| `padding: '20px 24px'` | `px-6 py-5` |

### Margin
| Inline | Tailwind |
|--------|----------|
| `margin: '0 0 Xpx'` | `mb-*` |
| `marginBottom: 4` | `mb-1` |
| `marginBottom: 6` | `mb-1.5` |
| `marginBottom: 8` | `mb-2` |
| `marginBottom: 10` | `mb-2.5` |
| `marginBottom: 12` | `mb-3` |
| `marginBottom: 14` | `mb-3.5` |
| `marginBottom: 16` | `mb-4` |
| `marginBottom: 20` | `mb-5` |
| `marginRight: 3` | `mr-[3px]` |
| `marginRight: 4` | `mr-1` |
| `marginRight: 6` | `mr-1.5` |

### Layout
| Inline | Tailwind |
|--------|----------|
| `display: 'flex'` | `flex` |
| `display: 'grid'` | `grid` |
| `display: 'block'` | `block` |
| `display: 'inline'` | `inline` |
| `flex: 1` | `flex-1` |
| `justifyContent: 'center'` | `justify-center` |
| `justifyContent: 'space-between'` | `justify-between` |
| `justifyContent: 'flex-end'` | `justify-end` |
| `justifyContent: 'flex-start'` | `justify-start` |
| `alignItems: 'center'` | `items-center` |
| `alignItems: 'flex-end'` | `items-end` |
| `alignItems: 'flex-start'` | `items-start` |
| `gap: 6` | `gap-1.5` |
| `gap: 8` | `gap-2` |
| `gap: 10` | `gap-2.5` |
| `gap: 12` | `gap-3` |
| `gap: 16` | `gap-4` |
| `gap: 20` | `gap-5` |

### Typography
| Inline | Tailwind |
|--------|----------|
| `fontSize: 6-9` | `text-[6px]`–`text-[9px]` |
| `fontSize: 10` | `text-[10px]` |
| `fontSize: 11` | `text-[11px]` |
| `fontSize: 12` | `text-xs` |
| `fontSize: 13` | `text-[13px]` |
| `fontSize: 14` | `text-sm` |
| `fontSize: 16` | `text-base` |
| `fontSize: 18` | `text-lg` |
| `fontSize: 20` | `text-xl` |
| `fontSize: 24` | `text-2xl` |
| `fontWeight: 500` | `font-medium` |
| `fontWeight: 600` | `font-semibold` |
| `fontWeight: 700` | `font-bold` |
| `fontWeight: 800` | `font-extrabold` |
| `textAlign: 'center'` | `text-center` |
| `textAlign: 'right'` | `text-right` |

### Borders
| Inline | Tailwind |
|--------|----------|
| `borderRadius: 4` | `rounded` |
| `borderRadius: 6` | `rounded-[6px]` |
| `borderRadius: 8` | `rounded-lg` |
| `borderRadius: 10` | `rounded-[10px]` |
| `borderRadius: 12` | `rounded-xl` |
| `borderRadius: 14` | `rounded-[14px]` |
| `borderRadius: 16` | `rounded-2xl` |
| `borderRadius: 18` | `rounded-[18px]` |
| `borderCollapse: 'collapse'` | `border-collapse` |

### Misc
| Inline | Tailwind |
|--------|----------|
| `overflow: 'hidden'` | `overflow-hidden` |
| `overflow: 'auto'` | `overflow-auto` |
| `whiteSpace: 'nowrap'` | `whitespace-nowrap` |
| `whiteSpace: 'pre-wrap'` | `whitespace-pre-wrap` |
| `resize: 'vertical'` | `resize-y` |
| `cursor: 'pointer'` | `cursor-pointer` |
| `cursor: 'not-allowed'` | `cursor-not-allowed` |
| `position: 'relative'` | `relative` |
| `position: 'absolute'` | `absolute` |
| `position: 'sticky'` | `sticky` |
| `width: '100%'` | `w-full` |
| `minWidth: 0` | `min-w-0` |
| `verticalAlign: -2` | `align-[-2px]` |

## What Stays Inline

These patterns cannot be expressed in Tailwind and remain as `style`:
- `linear-gradient(...)` with theme color variables
- `boxShadow` with theme color interpolation (e.g., `0 4px 12px ${COLORS.primary}30`)
- `animation` property (references `@keyframes` defined in globals.css)
- SVG coordinates and data-driven dimensions
- `backdropFilter` (only used with `blur()` values that could use `backdrop-blur-*`)
- Truly conditional multi-branch ternaries that depend on runtime data

## Migration Layers (Execution Order)

1. **Add `xl2` breakpoint** to globals.css `@theme`
2. **Static layout** — padding, margin, gap, display, flex, sizing, overflow, position
3. **Typography** — fontSize, fontWeight, textAlign, letterSpacing, textTransform
4. **Borders & radii** — borderRadius, borderCollapse, border widths
5. **rv()/rg() → Tailwind responsive** — replace responsive helpers with breakpoint prefixes
6. **Hex-alpha colors → Tailwind opacity modifiers** — `${COLORS.x}HH` → `bg-x/[opacity]`
7. **Theme color props** — `color: COLORS.primary` → `text-primary`, `background: COLORS.surface` → `bg-surface`
8. **Remaining static props** — cursor, opacity, transition, whiteSpace, verticalAlign, etc.
9. **Cleanup** — remove empty `style={{}}`, remove unused COLORS/useColors imports, remove unused rv/rg imports
10. **Format** — run `npm run format` for consistent class ordering
