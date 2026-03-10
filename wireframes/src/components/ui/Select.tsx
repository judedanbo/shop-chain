import type { SelectHTMLAttributes, CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  containerStyle?: CSSProperties;
}

export function Select({ options, style, containerStyle, className, ...props }: SelectProps) {
  return (
    <div className="relative" style={containerStyle}>
      <select
        {...props}
        className={clsx(
          'bg-surface-alt border-border text-text w-full cursor-pointer appearance-none rounded-[10px] border py-2.5 pr-8 pl-3 font-[inherit] text-[13px] outline-none',
          className,
        )}
        style={style}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="text-text-dim pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2"
      />
    </div>
  );
}
