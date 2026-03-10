import { useState } from 'react';
import { Search, Plus, Download, FileText, Clock, Truck, PackageCheck, Eye } from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { paginate } from '@/utils/pagination';
import { formatDate } from '@/utils/formatters';
import { Card, Badge, StatusBadge, Button, Input, Paginator } from '@/components/ui';
import { PurchaseOrderModal } from '@/components/modals';
import type { Product, PurchaseOrder } from '@/types';

interface PurchaseOrdersPageProps {
  purchaseOrders: PurchaseOrder[];
  products: Product[];
}

export const PurchaseOrdersPage = ({ purchaseOrders, products }: PurchaseOrdersPageProps) => {
  const bp = useBreakpoint();
  const { setPage, setSelectedPO } = useNavigation();
  const COLORS = useColors();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [tblPage, setTblPage] = useState(1);

  const filtered = purchaseOrders.filter((po) => {
    if (statusFilter !== 'all' && po.status !== statusFilter) return false;
    if (
      searchQ &&
      !po.id.toLowerCase().includes(searchQ.toLowerCase()) &&
      !po.supplierName.toLowerCase().includes(searchQ.toLowerCase())
    )
      return false;
    return true;
  });

  const poTotal = (po: PurchaseOrder) => po.items.reduce((a, li) => a + li.qty * li.unitCost, 0);
  const statusTabs = [
    { id: 'all', label: 'All', count: purchaseOrders.length },
    { id: 'draft', label: 'Draft', count: purchaseOrders.filter((p) => p.status === 'draft').length },
    { id: 'pending', label: 'Pending', count: purchaseOrders.filter((p) => p.status === 'pending').length },
    { id: 'approved', label: 'Approved', count: purchaseOrders.filter((p) => p.status === 'approved').length },
    { id: 'shipped', label: 'Shipped', count: purchaseOrders.filter((p) => p.status === 'shipped').length },
    { id: 'partial', label: 'Partial', count: purchaseOrders.filter((p) => p.status === 'partial').length },
    { id: 'received', label: 'Received', count: purchaseOrders.filter((p) => p.status === 'received').length },
    { id: 'cancelled', label: 'Cancelled', count: purchaseOrders.filter((p) => p.status === 'cancelled').length },
  ].filter((t) => t.id === 'all' || t.count > 0);

  const kpis = [
    { label: 'Total POs', value: purchaseOrders.length, icon: FileText, color: COLORS.primary },
    {
      label: 'Pending Value',
      value: `GH₵ ${purchaseOrders
        .filter((p) => ['pending', 'approved'].includes(p.status))
        .reduce((a, p) => a + poTotal(p), 0)
        .toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: COLORS.warning,
    },
    {
      label: 'Awaiting Delivery',
      value: purchaseOrders.filter((p) => ['approved', 'shipped'].includes(p.status)).length,
      icon: Truck,
      color: COLORS.accent,
    },
    {
      label: 'Received This Month',
      value: purchaseOrders.filter((p) => p.status === 'received' && p.receivedDate?.startsWith('2026-02')).length,
      icon: PackageCheck,
      color: COLORS.success,
    },
  ];

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <Card key={i} padding={16}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                style={{
                  background: `${k.color}15`,
                }}
              >
                <k.icon size={20} style={{ color: k.color }} />
              </div>
              <div>
                <div className="text-text-muted text-[11px]">{k.label}</div>
                <div className="text-text text-[20px] font-bold">{k.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col flex-wrap items-stretch justify-between gap-2.5 md:flex-row md:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <Input
            icon={Search}
            placeholder="Search POs..."
            containerStyle={{ flex: 1, minWidth: 150, maxWidth: 280 }}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <div className="bg-surface-alt flex max-w-full gap-1 overflow-x-auto rounded-[10px] p-[3px]">
            {statusTabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={clsx(
                  'flex shrink-0 items-center gap-1 rounded-lg border-none px-3 py-1.5 font-[inherit] text-[11px] font-semibold whitespace-nowrap transition-all duration-150',
                  statusFilter === tab.id ? 'bg-primary text-white' : 'text-text-muted',
                )}
              >
                {tab.label}
                <span className="text-[10px] opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download}>
            Export
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setShowCreatePO(true)}>
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* PO Table */}
      {isMobile(bp) ? (
        (() => {
          const pgd = paginate(filtered, tblPage, 8);
          return (
            <div className="flex flex-col gap-2">
              {pgd.items.map((po) => (
                <Card
                  key={po.id}
                  onClick={() => {
                    setSelectedPO(po);
                    setPage('poDetail');
                  }}
                  hover
                  padding={14}
                  className="cursor-pointer"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <div className="text-accent font-mono text-[13px] font-bold">{po.id}</div>
                      <div className="text-text text-[13px] font-semibold">{po.supplierName}</div>
                    </div>
                    <StatusBadge status={po.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Total</div>
                      <div className="text-text text-sm font-bold">
                        GH{'\u20B5'} {poTotal(po).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Items</div>
                      <Badge color="neutral">
                        {po.items.length} {po.items.length === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Created</div>
                      <div className="text-text-muted text-xs">{formatDate(po.createdDate)}</div>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Expected</div>
                      <div className="text-text-muted text-xs">
                        {po.expectedDate ? formatDate(po.expectedDate) : '\u2014'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {filtered.length === 0 && (
                <Card padding={48} className="text-center">
                  <FileText size={36} className="text-text-dim mb-2" />
                  <div className="text-text-dim text-[13px]">No purchase orders found</div>
                </Card>
              )}
              <Paginator {...pgd} perPage={8} onPage={(v) => setTblPage(v)} />
            </div>
          );
        })()
      ) : (
        <Card noPadding className="overflow-hidden">
          {(() => {
            const pgd = paginate(filtered, tblPage, 10);
            return (
              <>
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="border-border border-b">
                      {[
                        'PO #',
                        'Supplier',
                        'Items',
                        'Total Value',
                        'Created',
                        'Expected',
                        'Location',
                        'Status',
                        '',
                      ].map((h) => (
                        <th key={h} className="form-label px-4 py-3.5 text-left font-semibold tracking-[0.5px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pgd.items.map((po) => (
                      <tr
                        key={po.id}
                        className="border-border hover:bg-surface-alt cursor-pointer border-b transition-[background] duration-150"
                        onClick={() => {
                          setSelectedPO(po);
                          setPage('poDetail');
                        }}
                      >
                        <td className="text-accent px-4 py-3 font-mono text-[13px] font-semibold">{po.id}</td>
                        <td className="px-4 py-3">
                          <div className="text-text text-[13px] font-semibold">{po.supplierName}</div>
                          <div className="text-text-dim text-[11px]">{po.createdBy}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge color="neutral">
                            {po.items.length} {po.items.length === 1 ? 'item' : 'items'}
                          </Badge>
                        </td>
                        <td className="text-text px-4 py-3 text-sm font-bold">
                          GH{'\u20B5'} {poTotal(po).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-text-muted px-4 py-3 text-xs">{formatDate(po.createdDate)}</td>
                        <td className="text-text-muted px-4 py-3 text-xs">
                          {po.expectedDate ? formatDate(po.expectedDate) : '\u2014'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color="neutral">{po.location}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => {
                              setSelectedPO(po);
                              setPage('poDetail');
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-text-dim px-4 py-12 text-center text-[13px]">
                          <FileText size={36} className="text-text-dim mx-auto mb-2 block" />
                          No purchase orders found
                        </td>
                      </tr>
                    )}
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

      <PurchaseOrderModal
        isOpen={showCreatePO}
        onClose={() => setShowCreatePO(false)}
        products={products}
        supplier={null}
      />
    </div>
  );
};
