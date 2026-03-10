export const BREAKPOINTS = {
  sm: 0,
  md: 640,
  lg: 768,
  xl: 1024,
  xl2: 1440,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
export const BREAKPOINT_ORDER: Breakpoint[] = ['sm', 'md', 'lg', 'xl', 'xl2'];
