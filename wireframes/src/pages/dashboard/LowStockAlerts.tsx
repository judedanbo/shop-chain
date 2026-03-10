import { AlertTriangle } from 'lucide-react';
import { useColors, useNavigation } from '@/context';
import { Card, Badge, StatusBadge, ProgressBar } from '@/components/ui';
import type { Product } from '@/types';

export interface LowStockAlertsProps {
  products: Product[];
}

export function LowStockAlerts({ products }: LowStockAlertsProps) {
  const COLORS = useColors();
  const { setPage, setSelectedProduct } = useNavigation();

  const alertProducts = products.filter((p) => p.status !== 'in_stock');
  const lowStock = products.filter((p) => p.status === 'low_stock').length;
  const outOfStock = products.filter((p) => p.status === 'out_of_stock').length;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-warning" />
          <span className="text-text text-[15px] font-semibold">Low Stock Alerts</span>
        </div>
        <Badge color="warning">{lowStock + outOfStock} items</Badge>
      </div>
      <div className="flex flex-col gap-2.5">
        {alertProducts.map((p) => (
          <button
            type="button"
            key={p.id}
            onClick={() => {
              setSelectedProduct(p);
              setPage('productDetail');
            }}
            className="bg-surface-alt hover:border-border flex w-full items-center gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-left transition-all duration-200"
          >
            <span className="text-2xl">{p.image}</span>
            <div className="flex-1">
              <div className="text-text text-[13px] font-semibold">{p.name}</div>
              <div className="text-text-muted mt-0.5 text-[11px]">
                {p.stock} / {p.reorder} {p.unit} (reorder point)
              </div>
              <ProgressBar value={p.stock} max={p.reorder} color={p.stock === 0 ? COLORS.danger : COLORS.warning} />
            </div>
            <StatusBadge status={p.status} />
          </button>
        ))}
      </div>
    </Card>
  );
}
