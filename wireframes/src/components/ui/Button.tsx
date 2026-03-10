import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'bg-surface-alt text-text border border-border',
  ghost: 'bg-transparent text-text-muted',
  danger: 'bg-danger-bg text-danger border border-danger/[.19]',
  success: 'bg-success-bg text-success border border-success/[.19]',
  accent: 'bg-accent-bg text-accent border border-accent/[.19]',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  style: s,
  disabled,
  loading,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const iconPx = size === 'sm' ? 14 : 16;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-[10px] border-none font-[inherit] font-semibold transition-all duration-200',
        isDisabled ? 'cursor-not-allowed opacity-50' : 'opacity-100 hover:-translate-y-px',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-[18px] py-2.5 text-[13px]',
        variant === 'ghost' && (size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2.5'),
        variantClasses[variant],
        className,
      )}
      style={{
        ...(variant === 'primary'
          ? {
              background: 'linear-gradient(135deg, var(--sc-primary), var(--sc-primary-dark))',
              boxShadow: '0 2px 12px color-mix(in srgb, var(--sc-primary) 31%, transparent)',
            }
          : {}),
        ...(variant === 'accent'
          ? { boxShadow: '0 2px 12px color-mix(in srgb, var(--sc-accent) 15%, transparent)' }
          : {}),
        ...s,
      }}
      {...props}
    >
      {loading && (
        <span
          className="animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-current border-t-transparent"
          style={{ width: iconPx, height: iconPx }}
        />
      )}
      {!loading && Icon && <Icon size={iconPx} />}
      {children}
    </button>
  );
}
