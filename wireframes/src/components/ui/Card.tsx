import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: number | string;
  noPadding?: boolean;
}

export function Card({ children, style, onClick, hover, padding, noPadding, className, ...props }: CardProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={clsx(
        'bg-surface border-border overflow-x-auto rounded-[14px] border transition-all duration-200',
        (hover || onClick) && 'hover:border-primary-light cursor-pointer hover:-translate-y-px',
        !onClick && 'cursor-default',
        className,
      )}
      style={{ padding: noPadding ? 0 : (padding ?? 20), ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
