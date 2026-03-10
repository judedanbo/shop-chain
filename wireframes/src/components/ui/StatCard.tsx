import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  /** Icon container size in pixels (default 40) */
  iconSize?: number;
  /** Icon glyph size in pixels (default 20) */
  glyphSize?: number;
  /** Font size for the value (default 20) */
  valueFontSize?: number;
  /** Font size for the label (default 11) */
  labelFontSize?: number;
  /** Card padding override */
  padding?: number | string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  iconSize = 40,
  glyphSize = 20,
  valueFontSize = 20,
  labelFontSize = 11,
  padding = 16,
}: StatCardProps) {
  return (
    <Card style={{ padding }}>
      <div className="flex items-center gap-3">
        <div
          className="flex shrink-0 items-center justify-center rounded-xl"
          style={{ width: iconSize, height: iconSize, background: `${color}15` }}
        >
          <Icon size={glyphSize} style={{ color }} />
        </div>
        <div>
          <div className="text-text-muted font-semibold tracking-[0.4px] uppercase" style={{ fontSize: labelFontSize }}>
            {label}
          </div>
          <div className="text-text font-bold" style={{ fontSize: valueFontSize }}>
            {value}
          </div>
          {subtitle && <div className="text-text-dim mt-0.5 text-[10px]">{subtitle}</div>}
        </div>
      </div>
    </Card>
  );
}
