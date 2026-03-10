import type { TextareaHTMLAttributes, CSSProperties } from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerStyle?: CSSProperties;
}

export function Textarea({ style, containerStyle, className, ...props }: TextareaProps) {
  return (
    <div style={containerStyle}>
      <textarea
        {...props}
        className={clsx(
          'bg-surface-alt border-border text-text focus:border-primary w-full resize-y rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] transition-[border-color] duration-200 outline-none',
          className,
        )}
        style={style}
      />
    </div>
  );
}
