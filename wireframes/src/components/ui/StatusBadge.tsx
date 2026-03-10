import { Badge, type BadgeColor } from './Badge';

const STATUS_MAP: Record<string, [string, BadgeColor]> = {
  in_stock: ['In Stock', 'success'],
  low_stock: ['Low Stock', 'warning'],
  out_of_stock: ['Out of Stock', 'danger'],
  active: ['Active', 'success'],
  inactive: ['Inactive', 'neutral'],
  pending: ['Pending', 'orange'],
  approved: ['Approved', 'success'],
  rejected: ['Rejected', 'danger'],
  in_transit: ['In Transit', 'accent'],
  completed: ['Completed', 'success'],
  draft: ['Draft', 'neutral'],
  shipped: ['Shipped', 'accent'],
  partial: ['Partial', 'warning'],
  received: ['Received', 'success'],
  cancelled: ['Cancelled', 'danger'],
  suspended: ['Suspended', 'danger'],
  deactivated: ['Deactivated', 'neutral'],
  expired: ['Expired', 'danger'],
  expiring_soon: ['Expiring Soon', 'warning'],
  fresh: ['Fresh', 'success'],
  no_expiry: ['No Expiry', 'neutral'],
  depleted: ['Depleted', 'neutral'],
  reversed: ['Reversed', 'danger'],
  pending_reversal: ['Pending', 'warning'],
};

export interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const entry = STATUS_MAP[status];
  const [label, color] = entry ?? [status, 'neutral' as BadgeColor];
  return <Badge color={color}>{label}</Badge>;
}
