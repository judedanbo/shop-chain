import { useState } from 'react';
import { Search, Plus, X, Truck, CheckCircle, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { useColors } from '@/context';
import { isMobile } from '@/utils/responsive';
import { paginate } from '@/utils/pagination';
import { formatDate } from '@/utils/formatters';
import { Card, Badge, StatusBadge, Button, Input, Select, Paginator, EmptyState, StatCard } from '@/components/ui';
import { TRANSFERS } from '@/constants/demoData';
import { useBreakpoint } from '@/hooks';
import type { Product } from '@/types';

interface TransfersPageProps {
  products: Product[];
}

export const TransfersPage = ({ products }: TransfersPageProps) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const [showForm, setShowForm] = useState(false);
  const [tblPage, setTblPage] = useState(1);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const sameLocation = transferFrom !== '' && transferFrom === transferTo;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-1 flex-wrap gap-2.5">
          <Input icon={Search} placeholder="Search transfers..." className="max-w-[300px] min-w-[150px] flex-1" />
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'in_transit', label: 'In Transit' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
            ]}
            className="min-w-[130px]"
          />
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowForm(!showForm)}>
          New Transfer
        </Button>
      </div>

      {showForm && (
        <Card className="border-accent border">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-text m-0 text-[15px] font-semibold">Create Stock Transfer</h3>
            <Button variant="ghost" icon={X} size="sm" onClick={() => setShowForm(false)} />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="text-text-muted mb-1.5 block text-xs">Product *</label>
              <Select
                options={[
                  { value: '', label: 'Select product' },
                  ...products.map((p) => ({ value: p.id, label: `${p.name} (${p.stock} avail.)` })),
                ]}
              />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-xs">From Location *</label>
              <Select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                options={[
                  { value: '', label: 'Select origin' },
                  { value: 'wa', label: 'Warehouse A' },
                  { value: 'wb', label: 'Warehouse B' },
                  { value: 'sf', label: 'Store Front' },
                ]}
              />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-xs">To Location *</label>
              <Select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                options={[
                  { value: '', label: 'Select destination' },
                  { value: 'wa', label: 'Warehouse A' },
                  { value: 'wb', label: 'Warehouse B' },
                  { value: 'sf', label: 'Store Front' },
                ]}
              />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-xs">Quantity *</label>
              <Input placeholder="0" type="number" />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-text-muted mb-1.5 block text-xs">Notes</label>
            <textarea
              placeholder="Transfer notes..."
              rows={2}
              className="bg-surface-alt border-border text-text box-border w-full resize-y rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
            />
          </div>
          {sameLocation && (
            <div className="bg-warning/[0.07] border-warning/[0.19] mb-3 flex items-center gap-2 rounded-lg border px-3 py-2">
              <AlertTriangle size={14} className="text-warning shrink-0" />
              <span className="text-warning text-xs font-medium">
                Origin and destination cannot be the same location.
              </span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={ArrowRightLeft} disabled={sameLocation}>
              Initiate Transfer
            </Button>
          </div>
        </Card>
      )}

      {/* Stats -- computed from data */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {[
          {
            label: 'In Transit',
            value: TRANSFERS.filter((t) => t.status === 'in_transit').length,
            color: COLORS.accent,
            icon: Truck,
          },
          {
            label: 'Completed',
            value: TRANSFERS.filter((t) => t.status === 'completed').length,
            color: COLORS.success,
            icon: CheckCircle,
          },
          {
            label: 'Total Units Moved',
            value: TRANSFERS.reduce((a, t) => a + t.qty, 0),
            color: COLORS.primary,
            icon: ArrowRightLeft,
          },
        ].map((s, i) => (
          <StatCard key={i} {...s} valueFontSize={22} />
        ))}
      </div>

      {/* Transfer list */}
      {TRANSFERS.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="No transfers yet"
          description="Stock transfers between locations will appear here."
        />
      ) : isMobile(bp) ? (
        (() => {
          const pgd = paginate(TRANSFERS, tblPage, 8);
          return (
            <div className="flex flex-col gap-2">
              {pgd.items.map((t) => (
                <Card key={t.id} className="p-3.5">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="text-text text-[13px] font-semibold">{t.product}</div>
                      <div className="text-text-dim font-mono text-[11px]">{t.id}</div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Qty</div>
                      <div className="text-text font-mono text-[13px] font-bold">{t.qty}</div>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">From</div>
                      <Badge color="neutral">{t.from}</Badge>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">To</div>
                      <Badge color="accent">{t.to}</Badge>
                    </div>
                  </div>
                  <div className="border-border mt-2 flex items-center justify-between border-t pt-1.5">
                    <span className="text-text-dim text-[11px]">{t.by}</span>
                    <span className="text-text-dim text-[11px]">{formatDate(t.date)}</span>
                  </div>
                </Card>
              ))}
              <Paginator {...pgd} perPage={8} onPage={(v) => setTblPage(v)} />
            </div>
          );
        })()
      ) : (
        <Card className="overflow-hidden p-0">
          {(() => {
            const pgd = paginate(TRANSFERS, tblPage, 10);
            return (
              <>
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="border-border border-b">
                      {['Transfer #', 'Product', 'Quantity', 'From', 'To', 'Date', 'Initiated By', 'Status'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-text-dim px-4 py-3.5 text-left text-[11px] font-semibold tracking-[0.5px] uppercase"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pgd.items.map((t) => (
                      <tr key={t.id} className="border-border hover:bg-surface-alt border-b transition-colors">
                        <td className="text-accent px-4 py-3 font-mono text-xs">{t.id}</td>
                        <td className="text-text px-4 py-3 text-[13px] font-medium">{t.product}</td>
                        <td className="text-text px-4 py-3 font-mono text-[13px] font-bold">{t.qty}</td>
                        <td className="px-4 py-3">
                          <Badge color="neutral">{t.from}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge color="accent">{t.to}</Badge>
                        </td>
                        <td className="text-text-muted px-4 py-3 text-xs">{formatDate(t.date)}</td>
                        <td className="text-text-muted px-4 py-3 text-xs">{t.by}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={t.status} />
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
