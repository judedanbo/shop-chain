import { useState } from 'react';
import { Search, Plus, Upload, Download, QrCode, Eye, Edit } from 'lucide-react';
import { useColors, useNavigation, useShop } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { paginate } from '@/utils/pagination';
import { Card, Badge, StatusBadge, Button, Input, Select, Paginator, EmptyState } from '@/components/ui';
import { ScannerModal } from '@/components/modals';
import { getExpiryStatus, getExpiryLabel } from '@/utils/formatters';
import { isBatchTracked, sortBatchesFEFO } from '@/utils/batchUtils';
import type { Product } from '@/types';

interface ProductsPageProps {
  products: Product[];
}

export const ProductsPage = ({ products }: ProductsPageProps) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { setPage, setSelectedProduct } = useNavigation();
  const { canAdd, showLimitBlock } = useShop();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExpiry, setFilterExpiry] = useState('all');
  const [showScanner, setShowScanner] = useState(false);
  const [prodPage, setProdPage] = useState(1);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchExpiry = filterExpiry === 'all' || getExpiryStatus(p.expiryDate) === filterExpiry;
    return matchSearch && matchStatus && matchExpiry;
  });

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-1 flex-wrap gap-2.5">
          <Input
            icon={Search}
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[400px] flex-1"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'in_stock', label: 'In Stock' },
              { value: 'low_stock', label: 'Low Stock' },
              { value: 'out_of_stock', label: 'Out of Stock' },
            ]}
            className="min-w-[130px]"
          />
          <Select
            value={filterExpiry}
            onChange={(e) => setFilterExpiry(e.target.value)}
            options={[
              { value: 'all', label: 'All Expiry' },
              { value: 'expired', label: 'Expired' },
              { value: 'expiring_soon', label: 'Expiring Soon' },
              { value: 'fresh', label: 'Fresh' },
              { value: 'no_expiry', label: 'No Expiry' },
            ]}
            className="min-w-[140px]"
          />
          <Button variant="secondary" size="md" icon={QrCode} onClick={() => setShowScanner(true)}>
            Scan Barcode
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Upload} size="md">
            Import
          </Button>
          <Button variant="secondary" icon={Download} size="md">
            Export
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            size="md"
            onClick={() => {
              if (canAdd && !canAdd('products')) {
                showLimitBlock && showLimitBlock('Products');
                return;
              }
              setPage('addProduct');
            }}
          >
            Add Product
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products found"
          description="Try adjusting your search or filter criteria."
        />
      ) : isMobile(bp) ? (
        (() => {
          const pgd = paginate(filtered, prodPage, 8);
          return (
            <div className="flex flex-col gap-2">
              {pgd.items.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setPage('productDetail');
                  }}
                  hover
                  className="cursor-pointer p-3.5"
                >
                  <div className="mb-2.5 flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span className="text-[28px]">{p.image}</span>
                      <div className="min-w-0">
                        <div className="text-text overflow-hidden text-[13px] font-semibold text-ellipsis whitespace-nowrap">
                          {p.name}
                        </div>
                        <div className="text-text-dim font-mono text-[11px]">{p.id}</div>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.expiryDate && (
                    <div className="mb-2">
                      <StatusBadge status={getExpiryStatus(p.expiryDate)} />
                      <span className="text-text-dim ml-1.5 text-[11px]">{getExpiryLabel(p.expiryDate)}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Price</div>
                      <div className="text-text text-[13px] font-bold">GH₵ {p.price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Stock</div>
                      <div
                        className="text-[13px] font-bold"
                        style={{
                          color: p.stock <= p.reorder ? (p.stock === 0 ? COLORS.danger : COLORS.warning) : COLORS.text,
                        }}
                      >
                        {p.stock} <span className="text-[10px] font-normal">{p.unit}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px] uppercase">Location</div>
                      <Badge color="accent" size="sm">
                        {p.location}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
              <Paginator {...pgd} perPage={8} onPage={(v) => setProdPage(v)} />
            </div>
          );
        })()
      ) : (
        <Card className="overflow-hidden p-0">
          {(() => {
            const pgd = paginate(filtered, prodPage, 10);
            return (
              <>
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="border-border border-b">
                      {[
                        'Product',
                        'SKU',
                        'Category',
                        'Price (GH₵)',
                        'Stock',
                        'Reorder Pt.',
                        'Expiry',
                        'Location',
                        'Status',
                        'Actions',
                      ].map((h) => (
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
                    {pgd.items.map((p) => (
                      <tr
                        key={p.id}
                        className="border-border hover:bg-surface-alt cursor-pointer border-b transition-colors duration-150"
                        onClick={() => {
                          setSelectedProduct(p);
                          setPage('productDetail');
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{p.image}</span>
                            <span className="text-text text-[13px] font-semibold">{p.name}</span>
                          </div>
                        </td>
                        <td className="text-text-muted px-4 py-3 font-mono text-xs">{p.id}</td>
                        <td className="px-4 py-3">
                          <Badge color="neutral">{p.category}</Badge>
                        </td>
                        <td className="text-text px-4 py-3 text-[13px] font-semibold">{p.price.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div>
                            <span
                              className="text-[13px] font-bold"
                              style={{
                                color:
                                  p.stock <= p.reorder ? (p.stock === 0 ? COLORS.danger : COLORS.warning) : COLORS.text,
                              }}
                            >
                              {p.stock}
                            </span>
                            <span className="text-text-dim text-[11px]"> {p.unit}</span>
                          </div>
                          {isBatchTracked(p) && (
                            <div className="text-primary-light mt-0.5 text-[10px]">
                              {p.batches.filter((b) => b.status === 'active').length} batch
                              {p.batches.filter((b) => b.status === 'active').length !== 1 ? 'es' : ''}
                            </div>
                          )}
                        </td>
                        <td className="text-text-muted px-4 py-3 text-xs">{p.reorder}</td>
                        <td className="px-4 py-3">
                          {(() => {
                            const es = getExpiryStatus(p.expiryDate);
                            const color =
                              es === 'expired'
                                ? COLORS.danger
                                : es === 'expiring_soon'
                                  ? COLORS.warning
                                  : es === 'fresh'
                                    ? COLORS.success
                                    : COLORS.textDim;
                            if (isBatchTracked(p)) {
                              const earliest = sortBatchesFEFO(p.batches).find(
                                (b) => b.status === 'active' && b.expiryDate,
                              );
                              return (
                                <div>
                                  <span className="text-[11px] font-semibold" style={{ color }}>
                                    {getExpiryLabel(p.expiryDate)}
                                  </span>
                                  {earliest && (
                                    <div className="text-text-dim mt-0.5 text-[10px]">Batch {earliest.batchNumber}</div>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <span className="text-[11px] font-semibold" style={{ color }}>
                                {getExpiryLabel(p.expiryDate)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge color="accent" size="sm">
                            {p.location}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Eye}
                              onClick={() => {
                                setSelectedProduct(p);
                                setPage('productDetail');
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Edit}
                              onClick={() => {
                                setSelectedProduct(p);
                                setPage('editProduct');
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-border border-t px-4">
                  <Paginator {...pgd} perPage={10} onPage={(v) => setProdPage(v)} />
                </div>
              </>
            );
          })()}
        </Card>
      )}

      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        products={products}
        mode="search"
        onScan={(result) => {
          if (typeof result === 'object' && 'notFound' in result && result.notFound) {
            setSearch(result.code);
          } else if (typeof result === 'object' && 'id' in result) {
            setSelectedProduct(result);
            setPage('productDetail');
          }
        }}
      />
    </div>
  );
};
