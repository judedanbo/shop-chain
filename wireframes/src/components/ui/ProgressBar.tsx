export interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
}

export function ProgressBar({ value, max, color }: ProgressBarProps) {
  return (
    <div className="bg-surface-alt mt-1.5 h-1.5 w-full overflow-hidden rounded-[3px]">
      <div
        className="h-full rounded-[3px] transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.min((value / max) * 100, 100)}%`,
          background: color || 'var(--sc-primary)',
        }}
      />
    </div>
  );
}
