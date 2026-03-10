import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useColors } from '@/context';
import { Card, MiniChart } from '@/components/ui';

export interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend: string;
  trendUp: boolean;
  chartData: number[];
}

export function KPICard({ label, value, icon: Icon, color, trend, trendUp, chartData }: KPICardProps) {
  const COLORS = useColors();

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-text-muted mb-2 text-xs font-medium">{label}</div>
          <div className="text-text text-2xl font-bold tracking-[-0.5px]">{value}</div>
          <div className="mt-2 flex items-center gap-1">
            {trendUp ? (
              <TrendingUp size={12} className="text-success" />
            ) : (
              <TrendingDown size={12} className="text-danger" />
            )}
            <span className="text-[11px] font-semibold" style={{ color: trendUp ? COLORS.success : COLORS.danger }}>
              {trend}
            </span>
            <span className="text-text-dim text-[11px]">vs last week</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[10px]"
            style={{ background: `${color}18` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          <MiniChart data={chartData} color={color} />
        </div>
      </div>
    </Card>
  );
}
