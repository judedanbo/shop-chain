import { Clock } from 'lucide-react';
import { useColors, useNavigation } from '@/context';
import { Card, Badge, StatusBadge, ProgressBar } from '@/components/ui';
import { getExpiryStatus, getExpiryLabel, getDaysUntilExpiry, formatDate } from '@/utils/formatters';
import { isBatchTracked } from '@/utils/batchUtils';
import type { Product } from '@/types';

interface AlertItem {
  key: string;
  productId: string;
  product: Product;
  image: string;
  name: string;
  subtitle: string;
  expiryDate: string;
  quantity?: number;
  unit?: string;
}

export interface ExpiryAlertsProps {
  products: Product[];
}

export function ExpiryAlerts({ products }: ExpiryAlertsProps) {
  const COLORS = useColors();
  const { setPage, setSelectedProduct } = useNavigation();

  // Build alert items: per-batch for batch-tracked products, per-product for others
  const alertItems: AlertItem[] = [];
  products.forEach((p) => {
    if (isBatchTracked(p)) {
      // Per-batch alerts
      p.batches.forEach((b) => {
        if (!b.expiryDate) return;
        const status = getExpiryStatus(b.expiryDate);
        if (status === 'expired' || status === 'expiring_soon') {
          alertItems.push({
            key: `${p.id}-${b.id}`,
            productId: p.id,
            product: p,
            image: p.image,
            name: p.name,
            subtitle: `Batch ${b.batchNumber} · ${b.quantity} ${p.unit}`,
            expiryDate: b.expiryDate,
            quantity: b.quantity,
            unit: p.unit,
          });
        }
      });
    } else {
      // Product-level alert
      const status = getExpiryStatus(p.expiryDate);
      if (status === 'expired' || status === 'expiring_soon') {
        alertItems.push({
          key: p.id,
          productId: p.id,
          product: p,
          image: p.image,
          name: p.name,
          subtitle: `${p.stock} ${p.unit}`,
          expiryDate: p.expiryDate!,
        });
      }
    }
  });

  // Sort by urgency: expired first, then by days ascending
  alertItems.sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));

  const expired = alertItems.filter((a) => getExpiryStatus(a.expiryDate) === 'expired').length;
  const expiringSoon = alertItems.filter((a) => getExpiryStatus(a.expiryDate) === 'expiring_soon').length;

  if (alertItems.length === 0) {
    return (
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-success" />
            <span className="text-text text-[15px] font-semibold">Expiry Alerts</span>
          </div>
          <Badge color="success">All fresh</Badge>
        </div>
        <div className="text-text-dim py-5 text-center text-[13px]">No products expiring soon</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-warning" />
          <span className="text-text text-[15px] font-semibold">Expiry Alerts</span>
        </div>
        <div className="flex gap-1.5">
          {expired > 0 && <Badge color="danger">{expired} expired</Badge>}
          {expiringSoon > 0 && <Badge color="warning">{expiringSoon} expiring</Badge>}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {alertItems.map((item) => {
          const days = getDaysUntilExpiry(item.expiryDate);
          const status = getExpiryStatus(item.expiryDate);
          const progressValue = status === 'expired' ? 0 : Math.max(0, days);
          const progressColor = status === 'expired' ? COLORS.danger : COLORS.warning;

          return (
            <button
              type="button"
              key={item.key}
              onClick={() => {
                setSelectedProduct(item.product);
                setPage('productDetail');
              }}
              className="bg-surface-alt hover:border-border flex w-full items-center gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-left transition-all duration-200"
            >
              <span className="text-2xl">{item.image}</span>
              <div className="flex-1">
                <div className="text-text text-[13px] font-semibold">{item.name}</div>
                <div className="text-text-muted mt-0.5 text-[11px]">
                  {item.subtitle} · {formatDate(item.expiryDate)} — {getExpiryLabel(item.expiryDate)}
                </div>
                <ProgressBar value={progressValue} max={30} color={progressColor} />
              </div>
              <StatusBadge status={status} />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
