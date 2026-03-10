import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export type BadgeColor = 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'orange' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
}

const colorClasses: Record<BadgeColor, string> = {
  primary: 'bg-primary-bg text-primary-light border-primary-light/[.19]',
  success: 'bg-success-bg text-success border-success/[.19]',
  warning: 'bg-warning-bg text-warning border-warning/[.19]',
  danger: 'bg-danger-bg text-danger border-danger/[.19]',
  accent: 'bg-accent-bg text-accent border-accent/[.19]',
  orange: 'bg-orange-bg text-orange border-orange/[.19]',
  neutral: 'bg-surface-alt text-text-muted border-border',
};

export function Badge({ children, color = 'primary', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md border font-semibold tracking-[0.3px]',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        colorClasses[color],
      )}
    >
      {children}
    </span>
  );
}
