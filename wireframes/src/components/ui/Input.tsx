import type { InputHTMLAttributes, CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  containerStyle?: CSSProperties;
}

export function Input({ icon: Icon, style, containerStyle, className, ...props }: InputProps) {
  return (
    <div className="relative" style={containerStyle}>
      {Icon && (
        <Icon size={16} className="text-text-dim pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
      )}
      <input
        {...props}
        className={clsx(
          'bg-surface-alt border-border text-text focus:border-primary w-full rounded-[10px] border py-2.5 font-[inherit] text-[13px] transition-[border-color] duration-200 outline-none',
          Icon ? 'pr-3 pl-[38px]' : 'px-3',
          className,
        )}
        style={style}
      />
    </div>
  );
}
