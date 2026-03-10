import {
  ArrowLeft,
  ArrowRightLeft,
  Edit,
  Warehouse,
  Box,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  CircleDot,
  ClipboardList,
  Printer,
  Download,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import { isMobile } from '@/utils/responsive';
import { useBreakpoint } from '@/hooks';
import { formatDate } from '@/utils/formatters';
import { Card, Badge, StatusBadge, Button } from '@/components/ui';
import { TRANSFERS } from '@/constants/demoData';
import type { Product } from '@/types';

interface WarehouseDetailPageProps {
  products: Product[];
}

export const WarehouseDetailPage: React.FC<WarehouseDetailPageProps> = ({ products }) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { setPage, selectedWarehouse: warehouse, setSelectedProduct } = useNavigation();

  if (!warehouse) return null;

  const locProducts = products.filter((p) => p.location === warehouse.name);
  const unitCount = locProducts.reduce((a, p) => a + p.stock, 0);
  const stockValueCost = locProducts.reduce((a, p) => a + p.stock * p.cost, 0);
  const utilPct = warehouse.capacity > 0 ? ((unitCount / warehouse.capacity) * 100).toFixed(1) : '0';
  const lowStock = locProducts.filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock');
  const locationTransfers = TRANSFERS.filter((t) => t.from === warehouse.name || t.to === warehouse.name);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Header */}
      <div className="flex flex-col flex-wrap justify-between gap-2.5 md:flex-row md:items-center">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setPage('warehouses')} />
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-[14px] md:size-12"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            }}
          >
            <Warehouse size={bp === 'sm' ? 20 : 24} className="text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-text m-0 text-[17px] font-bold sm:text-[19px] md:text-[22px]">{warehouse.name}</h2>
              <Badge color="primary">{warehouse.type}</Badge>
            </div>
            <div className="text-text-muted mt-0.5 text-[11px] md:text-[13px]">{warehouse.address}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={ArrowRightLeft} onClick={() => setPage('transfers')}>
            New Transfer
          </Button>
          <Button variant="primary" icon={Edit}>
            Edit Location
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'SKUs Stored', value: locProducts.length, color: COLORS.primary },
          { label: 'Total Units', value: unitCount.toLocaleString(), color: COLORS.accent },
          {
            label: 'Utilization',
            value: `${utilPct}%`,
            color: parseFloat(utilPct as string) > 85 ? COLORS.warning : COLORS.success,
          },
          {
            label: 'Stock Value (Cost)',
            value: `GH₵ ${stockValueCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            color: COLORS.text,
          },
          {
            label: 'Low / Out of Stock',
            value: lowStock.length,
            color: lowStock.length > 0 ? COLORS.warning : COLORS.success,
          },
        ].map((k, i) => (
          <Card key={i} className="p-4 text-center">
            <div className="text-text-muted mb-1 text-[11px]">{k.label}</div>
            <div className="text-xl font-bold" style={{ color: k.color }}>
              {k.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
        {/* Left: Products Table */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Capacity Visual */}
          <Card>
            <h3 className="text-text mt-0 mb-3 text-sm font-semibold">Capacity Overview</h3>
            <div className="text-text-muted mb-1.5 flex justify-between text-xs">
              <span>{unitCount.toLocaleString()} units stored</span>
              <span>
                {(warehouse.capacity - unitCount).toLocaleString()} available of {warehouse.capacity.toLocaleString()}
              </span>
            </div>
            <div className="bg-border mb-3 h-2.5 overflow-hidden rounded-[5px]">
              <div
                className="h-full rounded-[5px] transition-[width] duration-300"
                style={{
                  width: `${Math.min(parseFloat(utilPct as string), 100)}%`,
                  background:
                    parseFloat(utilPct as string) > 85
                      ? `linear-gradient(90deg, ${COLORS.warning}, ${COLORS.danger})`
                      : `linear-gradient(90deg, ${COLORS.success}, ${COLORS.accent})`,
                }}
              />
            </div>
            {/* Zone breakdown */}
            <div
              className="grid grid-cols-2 gap-2"
              style={
                bp !== 'sm' && bp !== 'md'
                  ? { gridTemplateColumns: `repeat(${warehouse.zones.length}, 1fr)` }
                  : undefined
              }
            >
              {warehouse.zones.map((z, i) => (
                <div key={z} className="bg-surface-alt rounded-lg px-2 py-2.5 text-center">
                  <div className="text-text-dim mb-0.5 text-[10px]">{z}</div>
                  <div className="text-text text-sm font-bold">
                    {Math.round((unitCount / warehouse.zones.length) * (1 + (i - 1) * 0.15))}
                  </div>
                  <div className="text-text-dim text-[9px]">units</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Products at this location */}
          <Card className="overflow-hidden p-0">
            <div className="border-border flex flex-wrap items-center justify-between gap-2.5 border-b px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Box size={18} className="text-primary" />
                <span className="text-text text-[15px] font-semibold">Products at {warehouse.name}</span>
                <Badge color="primary">{locProducts.length}</Badge>
              </div>
            </div>
            {locProducts.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Box size={40} className="text-text-dim mb-3" />
                <div className="text-text-muted text-sm font-semibold">No products stored here</div>
              </div>
            ) : isMobile(bp) ? (
              <div className="flex flex-col">
                {locProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setPage('productDetail');
                    }}
                    className="border-border hover:bg-surface-alt cursor-pointer border-b p-3.5 transition-colors"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.image}</span>
                        <div>
                          <div className="text-text text-[13px] font-semibold">{p.name}</div>
                          <div className="text-text-dim font-mono text-[10px]">{p.id}</div>
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pl-7">
                      <div>
                        <div className="text-text-dim text-[9px] uppercase">Stock</div>
                        <div className={clsx('text-xs font-bold', p.stock <= p.reorder ? 'text-warning' : 'text-text')}>
                          {p.stock} {p.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-text-dim text-[9px] uppercase">Reorder</div>
                        <div className="text-text-muted text-xs">{p.reorder}</div>
                      </div>
                      <div>
                        <div className="text-text-dim text-[9px] uppercase">Value</div>
                        <div className="text-accent text-xs font-semibold">
                          GH₵ {(p.stock * p.cost).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-border border-b">
                    {['Product', 'SKU', 'Category', 'Stock', 'Reorder Pt.', 'Cost Value', 'Status'].map((h) => (
                      <th key={h} className="form-label px-4 py-3 text-left font-semibold tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {locProducts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-border hover:bg-surface-alt cursor-pointer border-b transition-colors"
                      onClick={() => {
                        setSelectedProduct(p);
                        setPage('productDetail');
                      }}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.image}</span>
                          <span className="text-text text-[13px] font-semibold">{p.name}</span>
                        </div>
                      </td>
                      <td className="text-text-muted px-4 py-2.5 font-mono text-xs">{p.id}</td>
                      <td className="px-4 py-2.5">
                        <Badge color="neutral">{p.category}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={clsx(
                            'text-sm font-bold',
                            p.stock <= p.reorder ? (p.stock === 0 ? 'text-danger' : 'text-warning') : 'text-text',
                          )}
                        >
                          {p.stock} <span className="text-text-dim text-[11px] font-normal">{p.unit}</span>
                        </span>
                      </td>
                      <td className="text-text-muted px-4 py-2.5 text-xs">{p.reorder}</td>
                      <td className="text-accent px-4 py-2.5 text-[13px] font-semibold">
                        GH₵ {(p.stock * p.cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Manager */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Location Manager</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { icon: User, label: 'Manager', value: warehouse.manager },
                { icon: Phone, label: 'Phone', value: warehouse.phone },
                { icon: Mail, label: 'Email', value: warehouse.email },
                { icon: MapPin, label: 'Address', value: warehouse.address },
              ].map((info, i) => (
                <div key={i} className="flex items-center gap-2">
                  <info.icon size={14} className="text-text-dim" />
                  <div>
                    <div className="text-text-dim text-[10px]">{info.label}</div>
                    <div className="text-text text-xs font-medium">{info.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Low Stock Alert */}
          {lowStock.length > 0 && (
            <Card className="border-warning/[0.25]">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning" />
                <h3 className="text-warning m-0 text-sm font-semibold">Needs Attention</h3>
                <Badge color="warning">{lowStock.length}</Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                {lowStock.slice(0, 5).map((p) => (
                  <div key={p.id} className="bg-surface-alt flex items-center justify-between rounded-lg px-2.5 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{p.image}</span>
                      <span className="text-text text-xs font-medium">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <div className={clsx('text-[13px] font-bold', p.stock === 0 ? 'text-danger' : 'text-warning')}>
                        {p.stock}
                      </div>
                      <div className="text-text-dim text-[9px]">reorder: {p.reorder}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Transfers */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Recent Transfers</h3>
            {locationTransfers.length === 0 ? (
              <div className="text-text-dim py-4 text-center text-xs">No recent transfers</div>
            ) : (
              <div className="flex flex-col gap-2">
                {locationTransfers.slice(0, 5).map((t) => (
                  <div key={t.id} className="bg-surface-alt rounded-lg px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div>
                        <div className="text-text text-xs font-semibold">{t.product}</div>
                        <div className="text-text-dim mt-0.5 text-[10px]">
                          {t.from === warehouse.name ? (
                            <span className="text-danger">
                              {'\u2192'} Out to {t.to}
                            </span>
                          ) : (
                            <span className="text-success">
                              {'\u2190'} In from {t.from}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={clsx(
                            'text-[13px] font-bold',
                            t.from === warehouse.name ? 'text-danger' : 'text-success',
                          )}
                        >
                          {t.from === warehouse.name ? '-' : '+'}
                          {t.qty}
                        </div>
                        <div className="text-text-dim text-[10px]">{formatDate(t.date)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Zones */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Zones</h3>
            <div className="flex flex-col gap-1.5">
              {warehouse.zones.map((z) => (
                <div key={z} className="bg-surface-alt flex items-center justify-between rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <CircleDot size={12} className="text-accent" />
                    <span className="text-text text-xs font-medium">{z}</span>
                  </div>
                  <Badge color="neutral">Active</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Quick Actions</h3>
            <div className="flex flex-col gap-1.5">
              <Button
                variant="secondary"
                icon={ArrowRightLeft}
                size="sm"
                className="w-full justify-start"
                onClick={() => setPage('transfers')}
              >
                Create Transfer
              </Button>
              <Button
                variant="secondary"
                icon={ClipboardList}
                size="sm"
                className="w-full justify-start"
                onClick={() => setPage('adjustments')}
              >
                Stock Adjustment
              </Button>
              <Button variant="secondary" icon={Printer} size="sm" className="w-full justify-start">
                Print Location Report
              </Button>
              <Button variant="secondary" icon={Download} size="sm" className="w-full justify-start">
                Export Inventory
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
