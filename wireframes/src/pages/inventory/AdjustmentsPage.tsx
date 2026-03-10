import { useState } from 'react';
import { Search, Plus, X, Save, AlertTriangle } from 'lucide-react';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { paginate } from '@/utils/pagination';
import { formatDate, getExpiryStatus, getExpiryLabel } from '@/utils/formatters';
import { isBatchTracked } from '@/utils/batchUtils';
import { Card, Badge, StatusBadge, Button, Input, Select, Paginator, EmptyState } from '@/components/ui';
import { ADJUSTMENTS } from '@/constants/demoData';
import { clsx } from 'clsx';
import type { Product } from '@/types';

interface AdjustmentsPageProps {
  products: Product[];
}

export const AdjustmentsPage = ({ products }: AdjustmentsPageProps) => {
  const bp = useBreakpoint();
  const [showForm, setShowForm] = useState(false);
  const [tblPage, setTblPage] = useState(1);
  const [adjProductId, setAdjProductId] = useState('');

  // Count expired items: per-batch for batch-tracked, per-product for others
  const expiredAlerts: { label: string; detail: string }[] = [];
  products.forEach((p) => {
    if (isBatchTracked(p)) {
      p.batches.forEach((b) => {
        if (b.expiryDate && getExpiryStatus(b.expiryDate) === 'expired' && b.quantity > 0) {
          expiredAlerts.push({ label: `${p.name} (${b.batchNumber})`, detail: getExpiryLabel(b.expiryDate) });
        }
      });
    } else if (getExpiryStatus(p.expiryDate) === 'expired') {
      expiredAlerts.push({ label: p.name, detail: getExpiryLabel(p.expiryDate) });
    }
  });

  const selectedProduct = products.find((p) => p.id === adjProductId);
  const showBatchSelect = selectedProduct && isBatchTracked(selectedProduct);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {expiredAlerts.length > 0 && (
        <div className="bg-danger-bg border-danger/[0.20] flex items-center gap-3 rounded-xl border px-4 py-3">
          <AlertTriangle size={18} className="text-danger shrink-0" />
          <div className="flex-1">
            <div className="text-danger text-[13px] font-semibold">
              {expiredAlerts.length} item{expiredAlerts.length > 1 ? 's' : ''} expired — consider creating stock
              adjustments
            </div>
            <div className="text-text-muted mt-0.5 text-[11px]">
              {expiredAlerts.map((a) => `${a.label} (${a.detail})`).join(' · ')}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-1 flex-wrap gap-2.5">
          <Input icon={Search} placeholder="Search adjustments..." className="max-w-[300px] min-w-[150px] flex-1" />
          <Select
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'damage', label: 'Damage' },
              { value: 'recount', label: 'Recount' },
              { value: 'expired', label: 'Expired' },
              { value: 'theft', label: 'Theft' },
              { value: 'return', label: 'Return' },
            ]}
            className="min-w-[130px]"
          />
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowForm(!showForm)}>
          New Adjustment
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary-light">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-text m-0 text-[15px] font-semibold">Create Stock Adjustment</h3>
            <Button variant="ghost" icon={X} size="sm" onClick={() => setShowForm(false)} />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="text-text-muted mb-1.5 block text-xs">Product *</label>
              <Select
                value={adjProductId}
                onChange={(e) => setAdjProductId(e.target.value)}
                options={[
                  { value: '', label: 'Select product' },
                  ...products.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-xs">Adjustment Type *</label>
              <Select
                options={[
                  { value: '', label: 'Select type' },
                  { value: 'damage', label: 'Damage' },
                  { value: 'recount', label: 'Recount' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'theft', label: 'Theft/Shrinkage' },
                  { value: 'return', label: 'Return' },
                ]}
              />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-xs">Quantity *</label>
              <Input placeholder="\u00B10" type="number" />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-xs">Date</label>
              <Input type="date" defaultValue="2026-02-11" />
            </div>
          </div>
          {showBatchSelect && (
            <div className="mb-4">
              <label className="text-text-muted mb-1.5 block text-xs">Batch *</label>
              <Select
                options={[
                  { value: '', label: 'Select batch...' },
                  ...(selectedProduct.batches ?? [])
                    .filter((b) => b.status === 'active' || b.status === 'expired')
                    .map((b) => ({
                      value: b.id,
                      label: `${b.batchNumber} — ${b.quantity} ${selectedProduct.unit}${b.expiryDate ? ` — Exp: ${formatDate(b.expiryDate)}` : ''}`,
                    })),
                ]}
              />
            </div>
          )}
          <div className="mb-4">
            <label className="text-text-muted mb-1.5 block text-xs">Reason / Notes *</label>
            <textarea
              placeholder="Provide a reason for this adjustment..."
              rows={2}
              className="bg-surface-alt border-border text-text box-border w-full resize-y rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={Save}>
              Submit Adjustment
            </Button>
          </div>
        </Card>
      )}

      {/* Mobile card view */}
      {ADJUSTMENTS.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No adjustments found"
          description="Stock adjustments will appear here once created."
        />
      ) : isMobile(bp) ? (
        (() => {
          const pgd = paginate(ADJUSTMENTS, tblPage, 8);
          return (
            <div className="flex flex-col gap-2">
              {pgd.items.map((a) => (
                <Card key={a.id} className="p-3.5">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="text-text text-[13px] font-semibold">{a.product}</div>
                      <div className="text-text-dim font-mono text-[11px]">{a.id}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Type</div>
                      <Badge color={a.type === 'Return' || a.type === 'Recount' ? 'accent' : 'warning'}>{a.type}</Badge>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Qty</div>
                      <div
                        className={clsx('font-mono text-[13px] font-bold', a.qty > 0 ? 'text-success' : 'text-danger')}
                      >
                        {a.qty > 0 ? '+' : ''}
                        {a.qty}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Date</div>
                      <div className="text-text-muted text-xs">{formatDate(a.date)}</div>
                    </div>
                  </div>
                  <div className="text-text-dim border-border mt-2 border-t pt-1.5 text-[11px]">{a.reason}</div>
                </Card>
              ))}
              <Paginator {...pgd} perPage={8} onPage={(v) => setTblPage(v)} />
            </div>
          );
        })()
      ) : (
        <Card className="overflow-hidden p-0">
          {(() => {
            const pgd = paginate(ADJUSTMENTS, tblPage, 10);
            return (
              <>
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="border-border border-b">
                      {['Ref #', 'Product', 'Type', 'Quantity', 'Date', 'Adjusted By', 'Reason', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="text-text-dim px-4 py-3.5 text-left text-[11px] font-semibold tracking-[0.5px] uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pgd.items.map((a) => (
                      <tr key={a.id} className="border-border hover:bg-surface-alt border-b">
                        <td className="text-primary-light px-4 py-3 font-mono text-xs">{a.id}</td>
                        <td className="text-text px-4 py-3 text-[13px] font-medium">{a.product}</td>
                        <td className="px-4 py-3">
                          <Badge color={a.type === 'Return' || a.type === 'Recount' ? 'accent' : 'warning'}>
                            {a.type}
                          </Badge>
                        </td>
                        <td
                          className={clsx(
                            'px-4 py-3 font-mono text-[13px] font-bold',
                            a.qty > 0 ? 'text-success' : 'text-danger',
                          )}
                        >
                          {a.qty > 0 ? '+' : ''}
                          {a.qty}
                        </td>
                        <td className="text-text-muted px-4 py-3 text-xs">{formatDate(a.date)}</td>
                        <td className="text-text-muted px-4 py-3 text-xs">{a.by}</td>
                        <td className="text-text-muted max-w-[200px] overflow-hidden px-4 py-3 text-xs text-ellipsis whitespace-nowrap">
                          {a.reason}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-border border-t px-4">
                  <Paginator {...pgd} perPage={10} onPage={(v) => setTblPage(v)} />
                </div>
              </>
            );
          })()}
        </Card>
      )}
    </div>
  );
};
