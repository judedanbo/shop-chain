import { useState, useEffect } from 'react';
import { BREAKPOINTS, type Breakpoint } from '@/constants/breakpoints';

function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS.xl2) return 'xl';
  return 'xl2';
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'xl';
    return getBreakpoint(window.innerWidth);
  });

  useEffect(() => {
    const onResize = () => {
      const next = getBreakpoint(window.innerWidth);
      setBp((prev) => (prev !== next ? next : prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}
