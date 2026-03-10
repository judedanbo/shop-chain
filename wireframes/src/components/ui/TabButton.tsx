import React from 'react';
import { clsx } from 'clsx';

type TabButtonVariant = 'pill' | 'filter' | 'underline' | 'segment';

interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  variant?: TabButtonVariant;
  /**
   * Override the accent color used for active state styling.
   * Required in admin pages which use `ADMIN_THEMES` instead of the
   * app-level `ThemeContext` — without this, the component falls back
   * to the CSS variable `--sc-primary` which may not match the admin palette.
   */
  activeColor?: string;
}

export type { TabButtonProps, TabButtonVariant };

const variantClasses: Record<TabButtonVariant, (active: boolean) => string> = {
  pill: (active) =>
    clsx(
      'px-3 py-[5px] rounded-md text-xs font-semibold',
      active ? 'bg-tab-active text-white' : 'bg-transparent text-text-dim',
    ),
  filter: (active) =>
    clsx(
      'px-3 py-[7px] rounded-lg text-xs font-semibold border',
      active ? 'bg-primary-bg text-tab-active border-tab-active/[.25]' : 'bg-transparent text-text-muted border-border',
    ),
  underline: (active) =>
    clsx(
      'px-5 py-3 text-[13px] flex items-center gap-[7px] whitespace-nowrap rounded-none border-b-[2.5px]',
      active ? 'font-bold text-tab-active border-tab-active' : 'font-medium text-text-muted border-transparent',
    ),
  segment: (active) =>
    clsx(
      'px-3 py-[9px] text-xs capitalize rounded-none',
      active ? 'font-bold bg-primary-bg text-tab-active' : 'font-medium bg-surface text-text-muted',
    ),
};

export const TabButton: React.FC<TabButtonProps> = ({
  active,
  variant = 'pill',
  activeColor,
  style,
  children,
  className,
  ...rest
}) => {
  return (
    <button
      type="button"
      aria-selected={active}
      {...rest}
      className={clsx(
        'border-none bg-none p-0 font-[inherit] transition-all duration-150',
        variantClasses[variant](active),
        className,
      )}
      style={{ ...(activeColor ? ({ '--tab-active': activeColor } as React.CSSProperties) : {}), ...style }}
    >
      {children}
    </button>
  );
};
