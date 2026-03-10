import { clsx } from 'clsx';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, size = 'md', disabled }: ToggleSwitchProps) {
  const isSm = size === 'sm';
  const w = isSm ? 36 : 44;
  const h = isSm ? 20 : 24;
  const dot = isSm ? 14 : 18;
  const pad = (h - dot) / 2;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        'relative shrink-0 border-none p-0 transition-[background] duration-200',
        checked ? 'bg-primary' : 'bg-border',
        disabled ? 'cursor-not-allowed opacity-50' : 'opacity-100',
      )}
      style={{ width: w, height: h, borderRadius: h }}
    >
      <span
        className="absolute rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] duration-200"
        style={{
          top: pad,
          left: checked ? w - dot - pad : pad,
          width: dot,
          height: dot,
        }}
      />
    </button>
  );
}
