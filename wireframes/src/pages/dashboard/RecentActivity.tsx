import { Receipt, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import { useColors } from '@/context';
import { formatCurrency } from '@/utils/formatters';
import { Card, Button } from '@/components/ui';
import type { SaleRecord } from '@/types';

interface RecentActivityProps {
  salesHistory: SaleRecord[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function RecentActivity({ salesHistory }: RecentActivityProps) {
  const COLORS = useColors();

  // Build activity items from real sales data
  const activities = salesHistory.slice(0, 6).map((s) => {
    if (s.status === 'reversed') {
      return {
        icon: RotateCcw,
        text: `Sale reversed: ${s.id} — ${formatCurrency(s.total)}`,
        time: timeAgo(s.reversedAt || s.date),
        colorKey: 'danger' as const,
      };
    }
    if (s.status === 'pending_reversal') {
      return {
        icon: AlertTriangle,
        text: `Reversal pending: ${s.id} — ${formatCurrency(s.total)}`,
        time: timeAgo(s.reversalRequestedAt || s.date),
        colorKey: 'warning' as const,
      };
    }
    return {
      icon: Receipt,
      text: `Sale: ${s.customerName} — ${formatCurrency(s.total)} (${s.payLabel})`,
      time: timeAgo(s.date),
      colorKey: 'success' as const,
    };
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-text text-[15px] font-semibold">Recent Activity</span>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </div>
      {activities.length === 0 ? (
        <div className="p-[30px] text-center">
          <Clock size={24} className="text-text-dim mb-2" />
          <div className="text-text-dim text-xs">No recent activity</div>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {activities.map((a, i) => {
            const color = COLORS[a.colorKey];
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${color}15` }}
                >
                  <a.icon size={14} style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="text-text overflow-hidden text-xs text-ellipsis whitespace-nowrap">{a.text}</div>
                  <div className="text-text-dim mt-0.5 text-[11px]">{a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
