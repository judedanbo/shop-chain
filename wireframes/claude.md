# ShopChain Wireframes

ShopChain is an inventory management system built as a React SPA. This repository contains the interactive wireframes/prototype for the platform, covering shop management, POS, inventory, suppliers, purchase orders, warehouses, sales analytics, team management, and a super-admin dashboard.

## Tech Stack

- **Framework**: React 19 with TypeScript (strict mode)
- **Build tool**: Vite 7 (ESM, `"type": "module"`)
- **Icons**: lucide-react
- **Styling**: Tailwind CSS v4 utility classes with a theme CSS variable bridge; residual inline `style` for dynamic/computed values
- **Conditional classes**: `clsx` for composing conditional class strings

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Typecheck (`tsc --noEmit`) then Vite production build
- `npm run typecheck` — TypeScript type checking only
- `npm run preview` — Preview production build
- `npm run format` — Format all `src/` files with Prettier
- `npm run format:check` — Check formatting without writing (CI-friendly)

Prettier is configured in `.prettierrc` (single quotes, trailing commas, 120 char print width, 2-space indent). There is no test runner or linter configured.

## Project Structure

```
src/
├── App.tsx                  # Root component, auth gate, page routing via switch
├── index.tsx                # Entry point, renders App inside AppProviders
├── components/
│   ├── ui/                  # Reusable primitives (Button, Card, Input, Badge, etc.)
│   ├── layout/              # Shell components (MainLayout, Header, Sidebar, MobileNav)
│   ├── features/            # Domain widgets (ThemePicker, RoleSwitcher, ShopLogo, etc.)
│   └── modals/              # Modal dialogs (BaseModal, ConfirmModal, UpgradeModal, etc.)
├── pages/
│   ├── admin/               # Super-admin dashboard and tabs
│   ├── auth/                # Login, register, forgot/reset password, verify
│   ├── onboarding/          # Shop selection, create-shop wizard
│   ├── dashboard/           # Main dashboard with KPIs, alerts
│   ├── products/            # Product list, detail, add/edit, categories, units
│   ├── inventory/           # Adjustments, transfers, receive orders
│   ├── suppliers/           # Supplier list and detail
│   ├── purchaseOrders/      # PO list and detail
│   ├── warehouse/           # Warehouse list and detail
│   ├── pos/                 # Point-of-sale interface
│   ├── sales/               # Sales history and analysis
│   ├── customers/           # Customer management
│   ├── team/                # Team members and role permissions
│   ├── settings/            # Shop settings and account page
│   ├── notifications/       # Notification center
│   └── verify/              # Sale verification page
├── context/                 # React context providers (Auth, Navigation, Theme, Shop, Toast, etc.)
├── hooks/                   # Custom hooks (useBreakpoint, useDebounce, useLocalStorage, usePagination)
├── types/                   # TypeScript type definitions per domain
├── constants/               # Mock/demo data and configuration (plans, themes, breakpoints)
└── utils/                   # Utility functions
```

## Architecture Notes

- **No router**: Navigation is managed via `NavigationContext` with a `page` string and a `switch` statement in `App.tsx`.
- **Lazy loading**: All pages use `React.lazy` + `Suspense` for code splitting.
- **State management**: React context + `useState` in `App.tsx` for data (products, POs, categories, etc.). No external state library.
- **Auth flow**: `AuthContext` manages an `authScreen` state that gates between auth screens, shop selection, admin portal, and the authenticated app.
- **Theme system**: `ThemeContext` + `useColors()` provides a color palette object. Theme colors are bridged to CSS variables (`--sc-primary`, `--sc-text`, `--sc-border`, etc.) in `src/index.css`, enabling Tailwind semantic classes like `bg-surface`, `text-text`, `border-border`, `text-primary`. Supports multiple themes.
- **Responsive**: `useBreakpoint()` hook returns the current breakpoint; components adapt layout accordingly.
- **Barrel exports**: Each directory has an `index.ts` re-exporting its public API.

## TypeScript Configuration

Strict mode is fully enabled with additional checks:
- `noUnusedLocals`, `noUnusedParameters`
- `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `noUncheckedIndexedAccess`

Path aliases are configured (`@/*` maps to `src/*`) in both `tsconfig.json` and `vite.config.ts`.

## Conventions

- Components are named exports (not default exports), except `App.tsx` which uses a default export.
- Types are organized by domain in `src/types/` (e.g., `product.types.ts`, `user.types.ts`, `plan.types.ts`).
- Mock data lives in `src/constants/demoData.ts` and domain-specific files in `src/constants/`.
- Modals extend `BaseModal` for consistent behavior.

## Styling Guide

The codebase uses **Tailwind CSS v4** utility classes as the primary styling approach, with inline `style` reserved for values that cannot be expressed statically.

**Use Tailwind classes for:**
- Layout: `flex`, `flex-col`, `items-center`, `justify-between`, `gap-*`, `grid`, etc.
- Spacing: `p-*`, `px-*`, `py-*`, `m-*`, `mb-*`, etc.
- Typography: `text-xs`, `text-sm`, `text-base`, `font-bold`, `font-mono`, `uppercase`, `tracking-*`, etc.
- Sizing: `w-full`, `h-8`, `min-w-0`, `max-w-[400px]`, etc.
- Borders: `border`, `border-border`, `border-b`, `rounded-lg`, `rounded-xl`, `rounded-[10px]`, etc.
- Position: `relative`, `absolute`, `fixed`, `sticky`, `inset-0`
- Semantic colors (mapped to theme CSS variables):
  - Text: `text-text`, `text-text-muted`, `text-text-dim`, `text-primary`, `text-success`, `text-warning`, `text-danger`, `text-accent`, `text-white`
  - Backgrounds: `bg-bg`, `bg-surface`, `bg-surface-alt`, `bg-primary-bg`, `bg-success-bg`, `bg-danger-bg`, `bg-warning-bg`, `bg-accent-bg`
  - Borders: `border-border`
- Interactivity: `cursor-pointer`, `hover:bg-surface-alt`, `transition-all`
- Lucide icon colors: `className="text-primary"` instead of `style={{ color: COLORS.primary }}`

**Keep as inline `style` for:**
- `rv()` / `rg()` responsive helper return values
- Computed hex alpha colors: `${COLORS.primary}15`, `${stat.color}20`
- Gradients with theme colors: `linear-gradient(135deg, ${COLORS.primary}, ...)`
- `boxShadow`, `animation`, `backdropFilter`
- Dynamic conditional colors that depend on runtime data
- `COLORS.bg` as SVG attribute (use `bg-bg` class for CSS backgrounds)
- SVG/chart coordinates and data-driven values
- `onMouseEnter`/`onMouseLeave` dynamic style manipulations

**Use `clsx` for conditional classes:**
```tsx
import clsx from 'clsx';
className={clsx('base-classes', isActive && 'text-primary', disabled && 'opacity-50 cursor-not-allowed')}
```
