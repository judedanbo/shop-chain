import type { Breakpoint } from '@/constants/breakpoints';

type ResponsiveValues<T> = Partial<Record<Breakpoint, T>>;

export function rv<T>(bp: Breakpoint, vals: ResponsiveValues<T>): T {
  const order: Breakpoint[] = ['sm', 'md', 'lg', 'xl', 'xl2'];
  const idx = order.indexOf(bp);
  for (let i = idx; i >= 0; i--) {
    const key = order[i];
    if (key !== undefined) {
      const value = vals[key];
      if (value !== undefined) return value;
    }
  }
  return vals.sm as T;
}

export function rg(bp: Breakpoint, vals: ResponsiveValues<number>): string {
  return `repeat(${rv(bp, vals)}, 1fr)`;
}

export const isMobile = (bp: Breakpoint): boolean => bp === 'sm';
export const isTablet = (bp: Breakpoint): boolean => bp === 'md' || bp === 'lg';
export const isSmall = (bp: Breakpoint): boolean => bp === 'sm' || bp === 'md';
export const isCompact = (bp: Breakpoint): boolean => bp === 'sm' || bp === 'md' || bp === 'lg';
export const isDesktop = (bp: Breakpoint): boolean => bp === 'xl' || bp === 'xl2';
