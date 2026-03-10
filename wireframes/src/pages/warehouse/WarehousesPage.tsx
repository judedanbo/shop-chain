import { useState } from 'react';
import {
  Plus,
  Warehouse,
  Box,
  BarChart3,
  Package,
  DollarSign,
  User,
  AlertTriangle,
  MapPin,
  Search,
} from 'lucide-react';
import { useColors, useNavigation } from '@/context';
import { Card, Badge, Button, EmptyState, Input, Select, StatCard } from '@/components/ui';
import { WAREHOUSES } from '@/constants/demoData';
import type { Product } from '@/types';

interface WarehousesPageProps {
  products: Product[];
}

export const WarehousesPage: React.FC<WarehousesPageProps> = ({ products }) => {
  const COLORS = useColors();
  const { setPage, setSelectedWarehouse } = useNavigation();
  const [whSearch, setWhSearch] = useState('');
  const [whTypeFilter, setWhTypeFilter] = useState('all');

  const getLocationProducts = (name: string) => products.filter((p) => p.location === name);
  const totalCapacity = WAREHOUSES.reduce((a, w) => a + w.capacity, 0);
  const totalStored = WAREHOUSES.reduce((a, w) => a + getLocationProducts(w.name).reduce((b, p) => b + p.stock, 0), 0);

  const whTypes = ['all', ...new Set(WAREHOUSES.map((w) => w.type))];
  const filteredWarehouses = WAREHOUSES.filter((wh) => {
    const q = whSearch.toLowerCase();
    const matchSearch =
      !q ||
      wh.name.toLowerCase().includes(q) ||
      wh.manager.toLowerCase().includes(q) ||
      wh.address.toLowerCase().includes(q);
    const matchType = whTypeFilter === 'all' || wh.type === whTypeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Locations', value: WAREHOUSES.length, icon: Warehouse, color: COLORS.primary },
          {
            label: 'Total Capacity',
            value: `${totalCapacity.toLocaleString()} units`,
            icon: Box,
            color: COLORS.accent,
          },
          {
            label: 'Current Utilization',
            value: `${totalCapacity > 0 ? ((totalStored / totalCapacity) * 100).toFixed(0) : 0}%`,
            icon: BarChart3,
            color: totalStored / totalCapacity > 0.85 ? COLORS.warning : COLORS.success,
          },
          { label: 'Units in Stock', value: totalStored.toLocaleString(), icon: Package, color: COLORS.text },
        ].map((k, i) => (
          <StatCard key={i} {...k} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-1 flex-wrap gap-2.5">
          <Input
            icon={Search}
            placeholder="Search locations..."
            value={whSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhSearch(e.target.value)}
            className="max-w-[280px] min-w-[150px] flex-1"
          />
          <Select
            value={whTypeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWhTypeFilter(e.target.value)}
            options={whTypes.map((t) => ({ value: t, label: t === 'all' ? 'All Types' : t }))}
            className="min-w-[130px]"
          />
        </div>
        <Button variant="primary" icon={Plus}>
          Add Location
        </Button>
      </div>

      {/* Warehouse Cards */}
      {WAREHOUSES.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="No locations yet"
          description="Add your first warehouse or storage location to get started."
        />
      ) : filteredWarehouses.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No locations match"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <div className="xl2:grid-cols-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredWarehouses.map((wh) => {
            const locProducts = getLocationProducts(wh.name);
            const unitCount = locProducts.reduce((a, p) => a + p.stock, 0);
            const stockValue = locProducts.reduce((a, p) => a + p.stock * p.cost, 0);
            const utilPct = wh.capacity > 0 ? (unitCount / wh.capacity) * 100 : 0;
            const lowStock = locProducts.filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock').length;
            return (
              <Card
                key={wh.id}
                hover
                className="cursor-pointer transition-all duration-200"
                onClick={() => {
                  setSelectedWarehouse(wh);
                  setPage('warehouseDetail');
                }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex size-[42px] items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${wh.type === 'Retail' ? COLORS.accent : wh.type === 'Main Storage' ? COLORS.primary : COLORS.success}, ${COLORS.primaryDark})`,
                      }}
                    >
                      <Warehouse size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-text text-[15px] font-bold">{wh.name}</div>
                      <div className="text-text-dim text-[11px]">{wh.type}</div>
                    </div>
                  </div>
                  <Badge color={utilPct > 85 ? 'warning' : utilPct > 60 ? 'primary' : 'success'}>
                    {utilPct.toFixed(0)}% full
                  </Badge>
                </div>

                {/* Capacity Bar */}
                <div className="mb-4">
                  <div className="text-text-dim mb-1 flex justify-between text-[11px]">
                    <span>
                      {unitCount.toLocaleString()} / {wh.capacity.toLocaleString()} units
                    </span>
                    <span>{(wh.capacity - unitCount).toLocaleString()} available</span>
                  </div>
                  <div className="bg-border h-1.5 overflow-hidden rounded-sm">
                    <div
                      className="h-full rounded-sm transition-[width] duration-300"
                      style={{
                        width: `${Math.min(utilPct, 100)}%`,
                        background: utilPct > 85 ? COLORS.warning : utilPct > 60 ? COLORS.primary : COLORS.success,
                      }}
                    />
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { l: 'SKUs', v: locProducts.length, icon: Box },
                    {
                      l: 'Stock Value',
                      v: `GH₵ ${stockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                      icon: DollarSign,
                    },
                    { l: 'Manager', v: wh.manager, icon: User },
                    { l: 'Low Stock', v: lowStock, icon: AlertTriangle, warn: lowStock > 0 },
                  ].map((inf, i) => (
                    <div key={i} className="bg-surface-alt flex items-center gap-1.5 rounded-lg px-2 py-1.5">
                      <inf.icon size={12} style={{ color: inf.warn ? COLORS.warning : COLORS.textDim }} />
                      <div>
                        <div className="text-text-dim text-[9px]">{inf.l}</div>
                        <div
                          className="text-[11px] font-semibold"
                          style={{ color: inf.warn ? COLORS.warning : COLORS.text }}
                        >
                          {inf.v}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Zones */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {wh.zones.map((z) => (
                    <Badge key={z} color="neutral">
                      {z}
                    </Badge>
                  ))}
                </div>

                {/* Address */}
                <div className="bg-bg mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-2">
                  <MapPin size={12} className="text-text-dim" />
                  <span className="text-text-muted text-[11px]">{wh.address}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
