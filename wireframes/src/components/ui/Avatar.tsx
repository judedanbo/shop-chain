import type { CSSProperties } from 'react';

export interface AvatarProps {
  initials: string;
  size: number;
  color: string;
  shape?: 'circle' | 'rounded';
  gradient?: boolean;
  border?: boolean;
  textColor?: string;
}

export function Avatar({
  initials,
  size,
  color,
  shape = 'circle',
  gradient = false,
  border = false,
  textColor,
}: AvatarProps) {
  const fontSize = Math.round(size * 0.36);
  const borderRadius = shape === 'circle' ? '50%' : Math.round(size * 0.28);
  const bg = gradient ? `linear-gradient(135deg, ${color}40, ${color}20)` : color;
  const fg = textColor ?? (gradient ? color : '#fff');

  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius,
    background: bg,
    fontSize,
    color: fg,
    ...(border ? { border: `2px solid ${color}25` } : {}),
  };

  return (
    <div className="flex shrink-0 items-center justify-center font-extrabold" style={style}>
      {initials}
    </div>
  );
}
