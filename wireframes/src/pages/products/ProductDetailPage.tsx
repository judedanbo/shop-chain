import { useState } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Edit,
  Trash2,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  BarChart3,
  Layers,
  Download,
  ChevronRight,
  QrCode,
  MapPin,
  Building2,
  Calendar,
  Tag,
  Truck,
  ClipboardList,
  ArrowRightLeft,
  Clock,
  Package,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import { useBreakpoint } from '@/hooks';
import { formatDate, getExpiryStatus, getExpiryLabel, getDaysUntilExpiry } from '@/utils/formatters';
import { Card, Badge, StatusBadge, Button, Input, Select } from '@/components/ui';
import { ReorderLevelModal, PurchaseOrderModal, PrintPriceTagModal } from '@/components/modals';
import { PriceMovementChart } from './PriceMovementChart';
import {
  isBatchTracked,
  sortBatchesFEFO,
  createBatch,
  updateProductFromBatches,
  generateLotNumber,
} from '@/utils/batchUtils';
import { SUPPLIERS, WAREHOUSES } from '@/constants/demoData';
import type { Product } from '@/types';

interface ProductDetailPageProps {
  updateProduct: (id: string, updates: Partial<Product>) => void;
  products: Product[];
}

export const ProductDetailPage = ({ updateProduct, products }: ProductDetailPageProps) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { setPage, selectedProduct: product, setSelectedProduct } = useNavigation();
  const [showPriceChange, setShowPriceChange] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showPriceTagModal, setShowPriceTagModal] = useState(false);
  const [_showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [priceEffective, setPriceEffective] = useState('immediate');
  const [priceChangeSubmitted, setPriceChangeSubmitted] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newBatchQty, setNewBatchQty] = useState('');
  const [newBatchExpiry, setNewBatchExpiry] = useState('');
  const [newBatchLocation, setNewBatchLocation] = useState('');
  const [newBatchNotes, setNewBatchNotes] = useState('');
  const [addBatchSubmitted, setAddBatchSubmitted] = useState(false);

  if (!product) return null;
  const margin = ((1 - product.cost / product.price) * 100).toFixed(1);

  const priceHistory = [
    { date: 'Sep', selling: product.price * 0.82, cost: product.cost * 0.88 },
    { date: 'Oct', selling: product.price * 0.85, cost: product.cost * 0.9 },
    { date: 'Nov', selling: product.price * 0.88, cost: product.cost * 0.9 },
    { date: 'Dec', selling: product.price * 0.92, cost: product.cost * 0.93 },
    { date: 'Jan', selling: product.price * 0.95, cost: product.cost * 0.96 },
    { date: 'Feb', selling: product.price, cost: product.cost },
  ];

  const priceChangeHistory = [
    {
      date: '2026-02-01',
      oldSelling: (product.price * 0.95).toFixed(2),
      newSelling: product.price.toFixed(2),
      oldCost: (product.cost * 0.96).toFixed(2),
      newCost: product.cost.toFixed(2),
      by: 'Jude A.',
      reason: 'Supplier price increase',
      status: 'approved',
    },
    {
      date: '2025-12-15',
      oldSelling: (product.price * 0.88).toFixed(2),
      newSelling: (product.price * 0.92).toFixed(2),
      oldCost: (product.cost * 0.9).toFixed(2),
      newCost: (product.cost * 0.93).toFixed(2),
      by: 'Kofi M.',
      reason: 'Quarterly price review',
      status: 'approved',
    },
    {
      date: '2025-11-01',
      oldSelling: (product.price * 0.85).toFixed(2),
      newSelling: (product.price * 0.88).toFixed(2),
      oldCost: (product.cost * 0.88).toFixed(2),
      newCost: (product.cost * 0.9).toFixed(2),
      by: 'Jude A.',
      reason: 'Market adjustment',
      status: 'approved',
    },
    {
      date: '2025-10-01',
      oldSelling: (product.price * 0.82).toFixed(2),
      newSelling: (product.price * 0.85).toFixed(2),
      oldCost: (product.cost * 0.85).toFixed(2),
      newCost: (product.cost * 0.88).toFixed(2),
      by: 'Ama D.',
      reason: 'Initial pricing review',
      status: 'approved',
    },
  ];

  const previewNewMargin = () => {
    const s = parseFloat(newSellingPrice) || product.price;
    const c = parseFloat(newCostPrice) || product.cost;
    return ((1 - c / s) * 100).toFixed(1);
  };

  const previewPriceChange = () => {
    const s = parseFloat(newSellingPrice);
    const c = parseFloat(newCostPrice);
    return {
      sellingDelta: s ? (((s - product.price) / product.price) * 100).toFixed(1) : null,
      costDelta: c ? (((c - product.cost) / product.cost) * 100).toFixed(1) : null,
    };
  };

  const handleSubmitPriceChange = () => {
    setPriceChangeSubmitted(true);
    setTimeout(() => {
      setPriceChangeSubmitted(false);
      setShowPriceChange(false);
      setNewSellingPrice('');
      setNewCostPrice('');
      setPriceReason('');
    }, 2500);
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-col flex-wrap items-start justify-between gap-2.5 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setPage('products')} />
          <span className="text-[40px] md:text-[56px]">{product.image}</span>
          <div>
            <h2 className="text-text m-0 text-[17px] font-bold sm:text-[19px] md:text-[22px]">{product.name}</h2>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Badge color="neutral">{product.id}</Badge>
              <Badge color="neutral">{product.category}</Badge>
              <StatusBadge status={product.status} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={DollarSign} onClick={() => setShowPriceChange(!showPriceChange)}>
            {showPriceChange ? 'Cancel Price Change' : 'Change Price'}
          </Button>
          <Button
            variant="secondary"
            icon={Edit}
            onClick={() => {
              setSelectedProduct(product);
              setPage('editProduct');
            }}
          >
            Edit
          </Button>
          <Button variant="danger" icon={Trash2}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {(() => {
          const expiryStatus = getExpiryStatus(product.expiryDate);
          const expiryColor =
            expiryStatus === 'expired'
              ? COLORS.danger
              : expiryStatus === 'expiring_soon'
                ? COLORS.warning
                : expiryStatus === 'fresh'
                  ? COLORS.success
                  : COLORS.textDim;
          const expiryValue = product.expiryDate
            ? expiryStatus === 'expired'
              ? `Expired ${Math.abs(getDaysUntilExpiry(product.expiryDate))}d ago`
              : expiryStatus === 'expiring_soon'
                ? `${getDaysUntilExpiry(product.expiryDate)} days left`
                : `${getDaysUntilExpiry(product.expiryDate)} days`
            : 'N/A';

          return [
            { label: 'Selling Price', value: `GH₵ ${product.price.toFixed(2)}`, color: COLORS.primary },
            { label: 'Cost Price', value: `GH₵ ${product.cost.toFixed(2)}`, color: COLORS.textMuted },
            { label: 'Margin', value: `${margin}%`, color: COLORS.success },
            {
              label: 'Current Stock',
              value: `${product.stock} ${product.unit}`,
              color: product.stock <= product.reorder ? COLORS.warning : COLORS.accent,
            },
            {
              label: 'Reorder Point',
              value: `${product.reorder} ${product.unit}`,
              color: COLORS.textMuted,
              clickable: true,
            },
            {
              label: 'Expiry',
              value: expiryValue,
              color: expiryColor,
              subtitle: product.expiryDate ? formatDate(product.expiryDate) : 'No expiry set',
            },
          ];
        })().map(
          (
            item: { label: string; value: string; color: string; clickable?: boolean; subtitle?: string },
            i: number,
          ) => (
            <Card
              key={i}
              className="p-4 text-center transition-all duration-150"
              style={{
                cursor: item.clickable ? 'pointer' : 'default',
              }}
              hover={item.clickable}
              onClick={item.clickable ? () => setShowReorderModal(true) : undefined}
            >
              <div className="text-text-muted mb-1.5 text-[11px] font-medium">{item.label}</div>
              <div className="text-xl font-bold" style={{ color: item.color }}>
                {item.value}
              </div>
              {item.clickable && (
                <div className="text-text-dim mt-1 text-[9px] tracking-[0.5px] uppercase">Click to change</div>
              )}
              {item.subtitle && <div className="text-text-dim mt-1 text-[10px]">{item.subtitle}</div>}
            </Card>
          ),
        )}
      </div>

      {/* PRICE CHANGE FORM */}
      {showPriceChange && (
        <Card
          className={clsx(
            'relative overflow-hidden border',
            priceChangeSubmitted ? 'border-success' : 'border-primary',
          )}
        >
          {priceChangeSubmitted && (
            <div className="bg-success/[0.08] absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[13px] backdrop-blur-[2px]">
              <div className="bg-success-bg border-success mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2">
                <CheckCircle size={28} className="text-success" />
              </div>
              <div className="text-success text-base font-bold">Price Change Submitted</div>
              <div className="text-text-muted mt-1 text-xs">Awaiting manager approval</div>
            </div>
          )}

          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary-bg flex h-9 w-9 items-center justify-center rounded-[10px]">
                <DollarSign size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-text m-0 text-[15px] font-bold">Change Product Price</h3>
                <div className="text-text-muted mt-0.5 text-[11px]">Submit price change for approval</div>
              </div>
            </div>
            <Button variant="ghost" icon={X} size="sm" onClick={() => setShowPriceChange(false)} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {/* Left: Current prices */}
            <div>
              <div className="text-text-dim mb-3 text-[11px] font-semibold tracking-[0.5px] uppercase">
                Current Prices
              </div>
              <div className="bg-surface-alt mb-2.5 rounded-[10px] p-3.5">
                <div className="text-text-dim text-[11px]">Selling Price</div>
                <div className="text-text mt-1 text-[22px] font-bold">GH₵ {product.price.toFixed(2)}</div>
              </div>
              <div className="bg-surface-alt mb-2.5 rounded-[10px] p-3.5">
                <div className="text-text-dim text-[11px]">Cost Price</div>
                <div className="text-text mt-1 text-[22px] font-bold">GH₵ {product.cost.toFixed(2)}</div>
              </div>
              <div className="bg-success-bg border-success/[0.20] rounded-[10px] border p-3.5">
                <div className="text-success text-[11px]">Current Margin</div>
                <div className="text-success mt-1 text-[22px] font-bold">{margin}%</div>
              </div>
            </div>

            {/* Middle: New prices inputs */}
            <div>
              <div className="text-text-dim mb-3 text-[11px] font-semibold tracking-[0.5px] uppercase">New Prices</div>
              <div className="mb-3">
                <label className="text-text-muted mb-1.5 block text-xs font-medium">New Selling Price (GH₵) *</label>
                <Input
                  icon={DollarSign}
                  placeholder={product.price.toFixed(2)}
                  type="number"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(e.target.value)}
                />
                {newSellingPrice &&
                  (() => {
                    const delta = previewPriceChange().sellingDelta;
                    const up = parseFloat(delta!) > 0;
                    return (
                      <div className="mt-1.5 flex items-center gap-1">
                        {up ? (
                          <TrendingUp size={12} className="text-success" />
                        ) : (
                          <TrendingDown size={12} className="text-danger" />
                        )}
                        <span className={clsx('text-[11px] font-semibold', up ? 'text-success' : 'text-danger')}>
                          {up ? '+' : ''}
                          {delta}%
                        </span>
                        <span className="text-text-dim text-[11px]">change</span>
                      </div>
                    );
                  })()}
              </div>
              <div className="mb-3">
                <label className="text-text-muted mb-1.5 block text-xs font-medium">New Cost Price (GH₵)</label>
                <Input
                  icon={DollarSign}
                  placeholder={product.cost.toFixed(2)}
                  type="number"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                />
                {newCostPrice &&
                  (() => {
                    const delta = previewPriceChange().costDelta;
                    const up = parseFloat(delta!) > 0;
                    return (
                      <div className="mt-1.5 flex items-center gap-1">
                        {up ? (
                          <TrendingUp size={12} className="text-danger" />
                        ) : (
                          <TrendingDown size={12} className="text-success" />
                        )}
                        <span className={clsx('text-[11px] font-semibold', up ? 'text-danger' : 'text-success')}>
                          {up ? '+' : ''}
                          {delta}%
                        </span>
                        <span className="text-text-dim text-[11px]">change</span>
                      </div>
                    );
                  })()}
              </div>
              {(newSellingPrice || newCostPrice) && (
                <div
                  className={clsx(
                    'rounded-[10px] p-3.5 text-center',
                    parseFloat(previewNewMargin()) > parseFloat(margin) ? 'bg-success-bg' : 'bg-warning-bg',
                  )}
                  style={{
                    border: `1px solid ${parseFloat(previewNewMargin()) > parseFloat(margin) ? COLORS.success + '33' : COLORS.warning + '33'}`,
                  }}
                >
                  <div className="text-text-muted text-[11px]">New Margin</div>
                  <div
                    className={clsx(
                      'mt-0.5 text-xl font-bold',
                      parseFloat(previewNewMargin()) > parseFloat(margin) ? 'text-success' : 'text-warning',
                    )}
                  >
                    {previewNewMargin()}%
                    <span className="text-text-dim ml-1.5 text-[11px] font-medium">(was {margin}%)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Reason & Effective date */}
            <div>
              <div className="text-text-dim mb-3 text-[11px] font-semibold tracking-[0.5px] uppercase">
                Change Details
              </div>
              <div className="mb-3">
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Reason for Change *</label>
                <Select
                  value={priceReason}
                  onChange={(e) => setPriceReason(e.target.value)}
                  options={[
                    { value: '', label: 'Select reason...' },
                    { value: 'supplier_increase', label: 'Supplier price increase' },
                    { value: 'supplier_decrease', label: 'Supplier price decrease' },
                    { value: 'market_adjustment', label: 'Market price adjustment' },
                    { value: 'promotion', label: 'Promotional pricing' },
                    { value: 'seasonal', label: 'Seasonal adjustment' },
                    { value: 'competition', label: 'Competitive pricing' },
                    { value: 'quarterly_review', label: 'Quarterly price review' },
                    { value: 'currency', label: 'Currency fluctuation' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div className="mb-3">
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Effective Date</label>
                <Select
                  value={priceEffective}
                  onChange={(e) => setPriceEffective(e.target.value)}
                  options={[
                    { value: 'immediate', label: 'Immediate (upon approval)' },
                    { value: 'scheduled', label: 'Schedule for later' },
                  ]}
                />
                {priceEffective === 'scheduled' && <Input type="date" className="mt-2" />}
              </div>
              <div className="mb-3">
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Additional Notes</label>
                <textarea
                  placeholder="Optional notes..."
                  rows={2}
                  className="bg-surface-alt border-border text-text box-border w-full resize-y rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
                />
              </div>
              <Button
                variant="primary"
                icon={Save}
                className="w-full justify-center"
                onClick={handleSubmitPriceChange}
                disabled={!newSellingPrice || !priceReason}
              >
                Submit for Approval
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* PRICE MOVEMENT CHART */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart3 size={18} className="text-primary" />
            <span className="text-text text-[15px] font-semibold">Price Movement</span>
          </div>
          <div className="flex gap-1.5">
            {['3M', '6M', '1Y', 'All'].map((period, i) => (
              <button
                type="button"
                key={period}
                className={clsx(
                  'rounded-[6px] px-3 py-1 font-[inherit] text-[11px] font-semibold transition-all duration-150',
                  i !== 1 && 'hover:bg-surface-alt',
                  i === 1 ? 'bg-primary-bg text-primary-light' : 'text-text-dim',
                )}
                style={{
                  border: i === 1 ? `1px solid ${COLORS.primary}40` : `1px solid transparent`,
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <PriceMovementChart priceHistory={priceHistory} width={Math.min(680, 680)} height={240} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: '6-Month Change (Selling)',
              value: `+${(((product.price - product.price * 0.82) / (product.price * 0.82)) * 100).toFixed(1)}%`,
              color: COLORS.success,
              icon: TrendingUp,
            },
            {
              label: '6-Month Change (Cost)',
              value: `+${(((product.cost - product.cost * 0.88) / (product.cost * 0.88)) * 100).toFixed(1)}%`,
              color: COLORS.danger,
              icon: TrendingUp,
            },
            {
              label: 'Avg. Margin (6M)',
              value: `${(parseFloat(margin) * 0.96).toFixed(1)}%`,
              color: COLORS.accent,
              icon: BarChart3,
            },
            { label: 'Price Changes (6M)', value: '4', color: COLORS.orange, icon: Edit },
          ].map((stat, i) => (
            <div key={i} className="bg-surface-alt flex items-center gap-2.5 rounded-[10px] px-3.5 py-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${stat.color}15` }}
              >
                <stat.icon size={14} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-text-dim text-[10px]">{stat.label}</div>
                <div className="text-text text-[15px] font-bold">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* PRICE CHANGE HISTORY LOG */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers size={18} className="text-accent" />
            <span className="text-text text-[15px] font-semibold">Price Change History</span>
          </div>
          <Button variant="secondary" size="sm" icon={Download}>
            Export Log
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {priceChangeHistory.map((pc, i) => (
            <div
              key={i}
              className="bg-surface-alt grid grid-cols-2 items-center gap-3 rounded-[10px] px-3.5 py-3 md:grid-cols-[100px_1fr_1fr_120px_1fr_80px]"
              style={{
                borderLeft: `3px solid ${i === 0 ? COLORS.primary : COLORS.border}`,
              }}
            >
              <div>
                <div className="text-text text-xs font-semibold">{formatDate(pc.date)}</div>
                <div className="text-text-dim mt-0.5 text-[10px]">by {pc.by}</div>
              </div>
              <div>
                <div className="text-text-dim mb-0.5 text-[10px]">Selling Price</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-text-muted text-xs line-through">GH₵ {pc.oldSelling}</span>
                  <ChevronRight size={12} className="text-text-dim" />
                  <span
                    className={clsx(
                      'text-xs font-bold',
                      parseFloat(pc.newSelling) > parseFloat(pc.oldSelling) ? 'text-success' : 'text-danger',
                    )}
                  >
                    GH₵ {pc.newSelling}
                  </span>
                  <span
                    className={clsx(
                      'text-[10px] font-semibold',
                      parseFloat(pc.newSelling) > parseFloat(pc.oldSelling) ? 'text-success' : 'text-danger',
                    )}
                  >
                    ({parseFloat(pc.newSelling) > parseFloat(pc.oldSelling) ? '+' : ''}
                    {(
                      ((parseFloat(pc.newSelling) - parseFloat(pc.oldSelling)) / parseFloat(pc.oldSelling)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              </div>
              <div>
                <div className="text-text-dim mb-0.5 text-[10px]">Cost Price</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-text-muted text-xs line-through">GH₵ {pc.oldCost}</span>
                  <ChevronRight size={12} className="text-text-dim" />
                  <span className="text-text text-xs font-bold">GH₵ {pc.newCost}</span>
                </div>
              </div>
              <div>
                <div className="text-text-dim mb-0.5 text-[10px]">New Margin</div>
                <span className="text-success text-[13px] font-bold">
                  {((1 - parseFloat(pc.newCost) / parseFloat(pc.newSelling)) * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <Badge color="neutral">{pc.reason}</Badge>
              </div>
              <div className="text-right">
                <StatusBadge status={pc.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Details */}
        <Card>
          <h3 className="text-text mt-0 mb-4 text-sm font-semibold">Product Details</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Barcode', value: product.barcode, icon: QrCode },
              { label: 'Location', value: product.location, icon: MapPin },
              { label: 'Supplier', value: product.supplier, icon: Building2 },
              {
                label: 'Expiry Date',
                value: product.expiryDate
                  ? `${formatDate(product.expiryDate)} — ${getExpiryLabel(product.expiryDate)}`
                  : 'No expiry set',
                icon: Clock,
              },
              { label: 'Last Updated', value: formatDate(product.lastUpdated), icon: Calendar },
            ].map((d, i) => (
              <div key={i} className="bg-surface-alt flex items-center gap-3 rounded-lg px-3 py-2.5">
                <d.icon size={16} className="text-text-dim" />
                <div>
                  <div className="text-text-dim text-[11px]">{d.label}</div>
                  <div className="text-text text-[13px] font-medium">{d.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Stock Movement */}
        <Card>
          <h3 className="text-text mt-0 mb-4 text-sm font-semibold">Stock Movement History</h3>
          <div className="flex flex-col gap-2">
            {[
              { type: 'Sale', qty: -10, date: '11 Feb 2026', balance: 234 },
              { type: 'Transfer In', qty: +50, date: '10 Feb 2026', balance: 244 },
              { type: 'Adjustment', qty: -5, date: '09 Feb 2026', balance: 194 },
              { type: 'Purchase', qty: +100, date: '07 Feb 2026', balance: 199 },
              { type: 'Sale', qty: -25, date: '06 Feb 2026', balance: 99 },
            ].map((m, i) => (
              <div key={i} className="bg-surface-alt flex items-center justify-between rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className={clsx('h-1.5 w-1.5 rounded-full', m.qty > 0 ? 'bg-success' : 'bg-danger')} />
                  <span className="text-text text-xs">{m.type}</span>
                </div>
                <span className={clsx('font-mono text-xs font-semibold', m.qty > 0 ? 'text-success' : 'text-danger')}>
                  {m.qty > 0 ? '+' : ''}
                  {m.qty}
                </span>
                <span className="text-text-dim text-[11px]">{m.date}</span>
                <span className="text-text-muted text-[11px]">Bal: {m.balance}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Batches Table */}
      {isBatchTracked(product) &&
        (() => {
          const batches = sortBatchesFEFO(product.batches);
          const activeBatches = batches.filter((b) => b.status === 'active');
          const expiredBatches = batches.filter((b) => b.status === 'expired');
          const depletedBatches = batches.filter((b) => b.status === 'depleted');
          const totalQty = batches.reduce((s, b) => s + b.quantity, 0);
          return (
            <Card className="overflow-hidden p-0">
              <div className="border-border flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Package size={18} className="text-accent" />
                  <span className="text-text text-[15px] font-semibold">Batches</span>
                </div>
                <Badge color="primary">
                  {batches.length} batch{batches.length !== 1 ? 'es' : ''}
                </Badge>
              </div>
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-border border-b">
                    {['Batch #', 'Qty', 'Expiry', 'Status', 'Location', 'Source PO', 'Received'].map((h) => (
                      <th key={h} className="form-label px-4 py-3 text-left font-semibold tracking-[0.5px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr
                      key={b.id}
                      className="border-border hover:bg-surface-alt border-b"
                      style={{ opacity: b.status === 'depleted' ? 0.5 : 1 }}
                    >
                      <td className="px-4 py-3">
                        <div className="text-text font-mono text-[13px] font-semibold">{b.batchNumber}</div>
                        <div className="text-text-dim text-[10px]">{b.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-sm font-bold', b.quantity > 0 ? 'text-text' : 'text-text-dim')}>
                          {b.quantity}
                        </span>
                        <span className="text-text-dim text-[11px]">
                          {' '}
                          / {b.initialQuantity} {product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.expiryDate ? (
                          <div>
                            <div className="text-text text-xs">{formatDate(b.expiryDate)}</div>
                            <div
                              className={clsx(
                                'text-[10px]',
                                getExpiryStatus(b.expiryDate) === 'expired'
                                  ? 'text-danger'
                                  : getExpiryStatus(b.expiryDate) === 'expiring_soon'
                                    ? 'text-warning'
                                    : 'text-text-dim',
                              )}
                            >
                              {getExpiryLabel(b.expiryDate)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-text-dim text-[11px]">No expiry</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="accent" size="sm">
                          {b.location}
                        </Badge>
                      </td>
                      <td className="text-primary-light px-4 py-3 font-mono text-xs">{b.sourcePoId || '—'}</td>
                      <td className="text-text-muted px-4 py-3 text-xs">{formatDate(b.receivedDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-border bg-bg flex items-center justify-between border-t px-5 py-3.5">
                <span className="text-text-muted text-xs">
                  Total:{' '}
                  <span className="text-text font-bold">
                    {totalQty} {product.unit}
                  </span>{' '}
                  across {batches.length} batch{batches.length !== 1 ? 'es' : ''}
                </span>
                <div className="flex gap-3">
                  <span className="text-success text-[11px]">Active: {activeBatches.length}</span>
                  {expiredBatches.length > 0 && (
                    <span className="text-danger text-[11px]">Expired: {expiredBatches.length}</span>
                  )}
                  {depletedBatches.length > 0 && (
                    <span className="text-text-dim text-[11px]">Depleted: {depletedBatches.length}</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })()}

      {/* Quick Actions */}
      <Card>
        <h3 className="text-text mt-0 mb-4 text-sm font-semibold">Quick Actions</h3>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="primary" icon={DollarSign} onClick={() => setShowPriceChange(true)}>
            Change Price
          </Button>
          <Button variant="accent" icon={Layers} onClick={() => setShowReorderModal(true)}>
            Change Reorder Level
          </Button>
          <Button variant="secondary" icon={Tag} onClick={() => setShowPriceTagModal(true)}>
            Print Price Tag
          </Button>
          <Button variant="secondary" icon={QrCode} onClick={() => setShowBarcodeModal(true)}>
            Print Barcode
          </Button>
          <Button variant="secondary" icon={Truck} onClick={() => setShowPOModal(true)}>
            Create Purchase Order
          </Button>
          <Button
            variant="secondary"
            icon={Package}
            onClick={() => {
              setShowAddBatch(true);
              setNewBatchNumber('');
              setNewBatchQty('');
              setNewBatchExpiry('');
              setNewBatchLocation(product.location);
              setNewBatchNotes('');
              setAddBatchSubmitted(false);
            }}
          >
            Add Batch
          </Button>
          <Button variant="secondary" icon={ClipboardList} onClick={() => setPage('adjustments')}>
            New Adjustment
          </Button>
          <Button variant="secondary" icon={ArrowRightLeft} onClick={() => setPage('transfers')}>
            Transfer Stock
          </Button>
        </div>
      </Card>

      {/* Modals */}
      <ReorderLevelModal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        product={product}
        onSave={(id: string, level: number) =>
          updateProduct(id, {
            reorder: level,
            status: product.stock === 0 ? 'out_of_stock' : product.stock <= level ? 'low_stock' : 'in_stock',
          })
        }
      />
      <PurchaseOrderModal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        products={products}
        supplier={SUPPLIERS.find((s) => s.name === product.supplier)}
      />
      <PrintPriceTagModal
        isOpen={showPriceTagModal}
        onClose={() => setShowPriceTagModal(false)}
        product={product}
        bp={bp}
      />

      {/* ADD BATCH MODAL */}
      {showAddBatch && (
        <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center">
          <div
            onClick={() => setShowAddBatch(false)}
            className="absolute inset-0 backdrop-blur-[4px]"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          />
          <div
            className="bg-surface border-border relative flex max-h-screen w-full max-w-full flex-col overflow-hidden rounded-none border sm:max-h-[90vh] sm:w-[94%] sm:rounded-[18px] md:w-[520px]"
            style={{
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              animation: 'modalIn 0.25s ease',
            }}
          >
            {addBatchSubmitted && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[17px] backdrop-blur-[6px]"
                style={{
                  background: 'rgba(15,17,23,0.92)',
                }}
              >
                <div
                  className="bg-success-bg border-success mb-3.5 flex h-[60px] w-[60px] items-center justify-center rounded-full border-2"
                  style={{
                    animation: 'modalIn 0.3s ease',
                  }}
                >
                  <CheckCircle size={28} className="text-success" />
                </div>
                <div className="text-success text-base font-bold">Batch Added</div>
                <div className="text-text-muted mt-1 text-xs">
                  Stock updated to {product.stock + (parseInt(newBatchQty) || 0)} {product.unit}
                </div>
              </div>
            )}

            {/* Header */}
            <div className="border-border flex shrink-0 items-center justify-between border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` }}
                >
                  <Package size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-text m-0 text-base font-bold">Add Batch — {product.name}</h2>
                  <div className="text-text-muted mt-0.5 text-xs">Manually add inventory batch to this product</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBatch(false)}
                className="bg-surface-alt border-border text-text-muted flex h-8 w-8 items-center justify-center rounded-lg border"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Batch / Lot Number</label>
                  <input
                    value={newBatchNumber}
                    placeholder="Leave empty for auto-generated"
                    onChange={(e) => setNewBatchNumber(e.target.value)}
                    className="bg-surface-alt border-border text-text box-border w-full rounded-[10px] border px-3 py-2.5 font-mono text-[13px] font-semibold outline-none"
                  />
                  <div className="text-text-dim mt-1 text-[10px]">e.g. LOT-2026-0100 — auto-generated if blank</div>
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">
                    Quantity ({product.unit}) *
                  </label>
                  <input
                    type="number"
                    value={newBatchQty}
                    placeholder="0"
                    min="1"
                    onChange={(e) => setNewBatchQty(e.target.value)}
                    className="bg-surface-alt border-border text-text box-border w-full rounded-[10px] border px-3 py-2.5 font-[inherit] text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Expiry Date</label>
                  <input
                    type="date"
                    value={newBatchExpiry}
                    onChange={(e) => setNewBatchExpiry(e.target.value)}
                    className="bg-surface-alt border-border text-text box-border w-full rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Location</label>
                  <Select
                    value={newBatchLocation}
                    onChange={(e) => setNewBatchLocation(e.target.value)}
                    options={WAREHOUSES.map((w) => ({ value: w.name, label: `${w.name} (${w.type})` }))}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Notes</label>
                <textarea
                  placeholder="Optional notes about this batch..."
                  rows={2}
                  value={newBatchNotes}
                  onChange={(e) => setNewBatchNotes(e.target.value)}
                  className="bg-surface-alt border-border text-text box-border w-full resize-y rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-border bg-bg flex shrink-0 items-center justify-between border-t px-6 py-3.5">
              <div className="text-text-muted text-xs">
                Adding{' '}
                <span className="text-text font-bold">
                  {parseInt(newBatchQty) || 0} {product.unit}
                </span>{' '}
                · New total:{' '}
                <span className="text-text font-bold">
                  {product.stock + (parseInt(newBatchQty) || 0)} {product.unit}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowAddBatch(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Save}
                  disabled={!newBatchQty || parseInt(newBatchQty) <= 0}
                  onClick={() => {
                    const qty = parseInt(newBatchQty) || 0;
                    if (qty <= 0) return;
                    const today = new Date().toISOString().slice(0, 10);
                    const lotNumber = newBatchNumber.trim() || generateLotNumber(Date.now() % 10000);
                    const existingBatches = product.batches ? [...product.batches] : [];
                    const newBatch = createBatch(
                      product.id,
                      {
                        batchNumber: lotNumber,
                        quantity: qty,
                        expiryDate: newBatchExpiry || undefined,
                        location: newBatchLocation || product.location,
                        notes: newBatchNotes || undefined,
                      },
                      today,
                    );
                    const allBatches = [...existingBatches, newBatch];
                    const batchProduct = { ...product, batches: allBatches, batchTracking: true };
                    const batchUpdates = updateProductFromBatches(batchProduct);
                    updateProduct(product.id, { ...batchUpdates, lastUpdated: today });
                    const updatedProduct = { ...product, ...batchUpdates, lastUpdated: today };
                    setSelectedProduct(updatedProduct);
                    setAddBatchSubmitted(true);
                    setTimeout(() => {
                      setShowAddBatch(false);
                    }, 2200);
                  }}
                >
                  Add Batch
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
