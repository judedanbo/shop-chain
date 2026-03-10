import { useState } from 'react';
import { Search, Plus, Download, Building2, CheckCircle, Box, Star, Phone, Mail, Eye } from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import { paginate } from '@/utils/pagination';
import { Card, StatusBadge, Button, Input, Select, Paginator } from '@/components/ui';
import { AddSupplierModal } from '@/components/modals';
import { SUPPLIERS } from '@/constants/demoData';
import type { Product } from '@/types';

interface SuppliersPageProps {
  products: Product[];
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({ products }) => {
  const COLORS = useColors();
  const { setPage, setSelectedSupplier } = useNavigation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tblPage, setTblPage] = useState(1);

  const filtered = SUPPLIERS.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getSupplierProducts = (supplierName: string) => products.filter((p) => p.supplier === supplierName);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex gap-2.5">
          <Input
            icon={Search}
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[300px] min-w-[150px] flex-1"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            className="w-[150px]"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} size="md">
            Export
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Suppliers', value: SUPPLIERS.length, icon: Building2, color: COLORS.primary },
          {
            label: 'Active',
            value: SUPPLIERS.filter((s) => s.status === 'active').length,
            icon: CheckCircle,
            color: COLORS.success,
          },
          {
            label: 'Total Products Supplied',
            value: SUPPLIERS.reduce((a, s) => a + s.products, 0),
            icon: Box,
            color: COLORS.accent,
          },
          {
            label: 'Avg. Rating',
            value: (SUPPLIERS.reduce((a, s) => a + s.rating, 0) / SUPPLIERS.length).toFixed(1),
            icon: Star,
            color: COLORS.warning,
          },
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{
                  background: `${stat.color}15`,
                }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-text-muted text-[11px]">{stat.label}</div>
                <div className="text-text text-[20px] font-bold">{stat.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="xl2:grid-cols-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginate(filtered, tblPage, 8).items.map((s) => {
          const supplierProducts = getSupplierProducts(s.name);
          const stockValue = supplierProducts.reduce((a, p) => a + p.stock * p.cost, 0);
          const lowStockCount = supplierProducts.filter(
            (p) => p.status === 'low_stock' || p.status === 'out_of_stock',
          ).length;

          return (
            <Card key={s.id} hover>
              <div className="mb-3.5 flex items-start justify-between">
                <div
                  className="flex cursor-pointer items-center gap-3"
                  onClick={() => {
                    setSelectedSupplier(s);
                    setPage('supplierDetail');
                  }}
                >
                  <div className="bg-primary-bg flex h-11 w-11 items-center justify-center rounded-xl">
                    <Building2 size={20} className="text-primary-light" />
                  </div>
                  <div>
                    <div className="text-text text-base font-bold">{s.name}</div>
                    <div className="text-text-muted mt-0.5 text-xs">
                      {s.contact} · {s.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={14} style={{ color: COLORS.warning, fill: COLORS.warning }} />
                  <span className="text-text text-[13px] font-semibold">{s.rating}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { icon: Phone, text: s.phone },
                  { icon: Mail, text: s.email },
                ].map((d, i) => (
                  <div key={i} className="bg-surface-alt flex items-center gap-2 rounded-lg px-2.5 py-1.5">
                    <d.icon size={13} className="text-text-dim" />
                    <span className="text-text-muted text-xs">{d.text}</span>
                  </div>
                ))}
              </div>

              {/* Product summary strip */}
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                <div className="bg-surface-alt rounded-lg px-2.5 py-1.5 text-center">
                  <div className="text-text-dim text-[10px]">In Catalog</div>
                  <div className="text-text text-sm font-bold">{supplierProducts.length}</div>
                </div>
                <div className="bg-surface-alt rounded-lg px-2.5 py-1.5 text-center">
                  <div className="text-text-dim text-[10px]">Stock Value</div>
                  <div className="text-accent text-sm font-bold">GH₵ {stockValue.toLocaleString()}</div>
                </div>
                <div
                  className={clsx(
                    'rounded-lg px-2.5 py-1.5 text-center',
                    lowStockCount > 0 ? 'bg-warning-bg' : 'bg-surface-alt',
                  )}
                >
                  <div className="text-text-dim text-[10px]">Low/Out</div>
                  <div className={clsx('text-sm font-bold', lowStockCount > 0 ? 'text-warning' : 'text-success')}>
                    {lowStockCount}
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="border-border mt-3.5 flex items-center justify-between border-t pt-3.5">
                <div className="flex gap-1.5">
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Box}
                    onClick={() => {
                      setSelectedSupplier(s);
                      setPage('supplierDetail');
                    }}
                  >
                    Products
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    onClick={() => {
                      setSelectedSupplier(s);
                      setPage('supplierDetail');
                    }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Paginator {...paginate(filtered, tblPage, 8)} perPage={8} onPage={(v) => setTblPage(v)} />

      <AddSupplierModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={() => {
          setShowAddModal(false);
        }}
      />
    </div>
  );
};
