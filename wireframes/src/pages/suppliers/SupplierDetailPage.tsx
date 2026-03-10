import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Plus,
  Edit,
  Truck,
  Box,
  DollarSign,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Star,
  X,
  Save,
  CheckCircle,
  Eye,
  Tag,
  QrCode,
  Layers,
  Camera,
  User,
  Phone,
  Mail,
  MapPin,
  Download,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import { isMobile } from '@/utils/responsive';
import { useBreakpoint } from '@/hooks';
import { Card, Badge, StatusBadge, Button, Input, Select, ProgressBar } from '@/components/ui';
import {
  ReorderLevelModal,
  PurchaseOrderModal,
  PrintPriceTagModal,
  PrintBarcodeModal,
  QuickAddCategoryModal,
  QuickAddUnitModal,
  ScannerModal,
} from '@/components/modals';
import type { Product, Category, UnitOfMeasure } from '@/types';

interface SupplierDetailPageProps {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  categories: Category[];
  units: UnitOfMeasure[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setUnits: React.Dispatch<React.SetStateAction<UnitOfMeasure[]>>;
}

interface NewProductForm {
  name: string;
  category: string;
  price: string;
  cost: string;
  stock: string;
  reorder: string;
  unit: string;
  location: string;
  barcode: string;
}

const INITIAL_NEW_PROD: NewProductForm = {
  name: '',
  category: '',
  price: '',
  cost: '',
  stock: '',
  reorder: '',
  unit: 'packs',
  location: 'Warehouse A',
  barcode: '',
};

export const SupplierDetailPage: React.FC<SupplierDetailPageProps> = ({
  products,
  addProduct,
  updateProduct,
  categories = [],
  units = [],
  setCategories,
  setUnits,
}) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { setPage, selectedSupplier: supplier, setSelectedProduct } = useNavigation();
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [productAdded, setProductAdded] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderProduct, setReorderProduct] = useState<Product | null>(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showPriceTagModal, setShowPriceTagModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [printProduct, setPrintProduct] = useState<Product | null>(null);
  const [newProd, setNewProd] = useState<NewProductForm>(INITIAL_NEW_PROD);
  const [showQuickCat, setShowQuickCat] = useState(false);
  const [showQuickUnit, setShowQuickUnit] = useState(false);
  const [showScannerSupp, setShowScannerSupp] = useState(false);

  if (!supplier) return null;

  const supplierProducts = products.filter((p) => p.supplier === supplier.name);
  const totalStockValue = supplierProducts.reduce((a, p) => a + p.stock * p.cost, 0);
  const totalRetailValue = supplierProducts.reduce((a, p) => a + p.stock * p.price, 0);
  const avgMargin =
    supplierProducts.length > 0
      ? (supplierProducts.reduce((a, p) => a + (1 - p.cost / p.price) * 100, 0) / supplierProducts.length).toFixed(1)
      : '0.0';
  const lowStockProducts = supplierProducts.filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock');

  const EMOJIS = ['📦', '🛒', '🏷️', '📋', '🧴', '🍽️', '🧃', '🛍️'];

  const handleAddProduct = () => {
    const id = `SKU-${String(products.length + 1).padStart(3, '0')}`;
    const price = parseFloat(newProd.price) || 0;
    const cost = parseFloat(newProd.cost) || 0;
    const stock = parseInt(newProd.stock) || 0;
    const reorder = parseInt(newProd.reorder) || 0;
    const status = stock === 0 ? 'out_of_stock' : stock <= reorder ? 'low_stock' : 'in_stock';

    addProduct({
      id,
      name: newProd.name,
      category: newProd.category,
      price,
      cost,
      stock,
      reorder,
      location: newProd.location,
      supplier: supplier.name,
      barcode: newProd.barcode || `590${Date.now().toString().slice(-10)}`,
      status,
      image: EMOJIS[Math.floor(Math.random() * EMOJIS.length)] ?? '',
      unit: newProd.unit,
      lastUpdated: '2026-02-11',
    });

    setProductAdded(true);
    setTimeout(() => {
      setProductAdded(false);
      setShowAddProductForm(false);
      setNewProd(INITIAL_NEW_PROD);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Header */}
      <div className="flex flex-col flex-wrap justify-between gap-2.5 md:flex-row md:items-center">
        <div className="flex items-center gap-2.5 md:gap-3">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setPage('suppliers')} />
          <div
            className="flex size-[42px] shrink-0 items-center justify-center rounded-[14px] md:size-[52px]"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            }}
          >
            <Building2 size={bp === 'sm' ? 20 : 24} className="text-white" />
          </div>
          <div>
            <h2 className="text-text m-0 text-[17px] font-bold sm:text-[19px] md:text-[22px]">{supplier.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={supplier.status} />
              <span className="text-text-muted text-xs">
                {supplier.contact} · {supplier.location}
              </span>
              <div className="flex items-center gap-[3px]">
                <Star size={12} style={{ color: COLORS.warning, fill: COLORS.warning }} />
                <span className="text-text text-xs font-semibold">{supplier.rating}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={Plus} onClick={() => setShowAddProductForm(true)}>
            Add Product
          </Button>
          <Button variant="secondary" icon={Edit}>
            Edit Supplier
          </Button>
          <Button variant="accent" icon={Truck} onClick={() => setShowPOModal(true)}>
            Purchase Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Products in Catalog', value: supplierProducts.length, color: COLORS.primary, icon: Box },
          {
            label: 'Stock Value (Cost)',
            value: `GH₵ ${totalStockValue.toLocaleString()}`,
            color: COLORS.accent,
            icon: DollarSign,
          },
          {
            label: 'Retail Value',
            value: `GH₵ ${totalRetailValue.toLocaleString()}`,
            color: COLORS.success,
            icon: TrendingUp,
          },
          { label: 'Avg. Margin', value: `${avgMargin}%`, color: COLORS.success, icon: BarChart3 },
          {
            label: 'Low / Out of Stock',
            value: lowStockProducts.length,
            color: lowStockProducts.length > 0 ? COLORS.warning : COLORS.success,
            icon: AlertTriangle,
          },
        ].map((kpi, i) => (
          <Card key={i} padding={16}>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                style={{
                  background: `${kpi.color}15`,
                }}
              >
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
              <div>
                <div className="text-text-dim text-[10px]">{kpi.label}</div>
                <div className="text-text text-lg font-bold">{kpi.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
        {/* Left: Product list + Add form */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Add Product Form */}
          {showAddProductForm && (
            <Card className="border-primary relative overflow-hidden border">
              {/* Success overlay */}
              {productAdded && (
                <div className="bg-success/[0.08] absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[13px] backdrop-blur-[2px]">
                  <div className="bg-success-bg border-success mb-2.5 flex h-12 w-12 items-center justify-center rounded-full border-2">
                    <CheckCircle size={24} className="text-success" />
                  </div>
                  <div className="text-success text-[15px] font-bold">Product Added Successfully</div>
                  <div className="text-text-muted mt-1 text-xs">Now visible in the product catalog</div>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary-bg flex h-8 w-8 items-center justify-center rounded-lg">
                    <Plus size={16} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-text m-0 text-sm font-bold">Add Product from {supplier.name}</h3>
                    <div className="text-text-muted mt-px text-[11px]">Supplier is auto-linked to this product</div>
                  </div>
                </div>
                <Button variant="ghost" icon={X} size="sm" onClick={() => setShowAddProductForm(false)} />
              </div>

              <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="col-span-full">
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Product Name *</label>
                  <Input
                    icon={Box}
                    placeholder="Enter product name"
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Category *</label>
                  <Select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    options={[
                      { value: '', label: 'Select category' },
                      ...categories.filter((c) => c.status === 'active').map((c) => ({ value: c.name, label: c.name })),
                    ]}
                  />
                  <div
                    onClick={() => setShowQuickCat(true)}
                    className="text-primary mt-[5px] inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold"
                  >
                    <Plus size={12} /> Add new category
                  </div>
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Unit of Measure</label>
                  <Select
                    value={newProd.unit}
                    onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                    options={[
                      ...units
                        .filter((u) => u.status === 'active')
                        .map((u) => ({ value: u.abbreviation, label: `${u.name} (${u.abbreviation})` })),
                    ]}
                  />
                  <div
                    onClick={() => setShowQuickUnit(true)}
                    className="text-primary mt-[5px] inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold"
                  >
                    <Plus size={12} /> Add new unit
                  </div>
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Barcode</label>
                  <div className="flex gap-1.5">
                    <Input
                      icon={QrCode}
                      placeholder="Scan or enter"
                      value={newProd.barcode}
                      onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })}
                      containerStyle={{ flex: 1 }}
                    />
                    <Button variant="secondary" size="sm" icon={Camera} onClick={() => setShowScannerSupp(true)} />
                  </div>
                </div>
              </div>
              <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Cost Price (GH₵) *</label>
                  <Input
                    icon={DollarSign}
                    placeholder="0.00"
                    type="number"
                    value={newProd.cost}
                    onChange={(e) => setNewProd({ ...newProd, cost: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Selling Price (GH₵) *</label>
                  <Input
                    icon={DollarSign}
                    placeholder="0.00"
                    type="number"
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Opening Stock *</label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={newProd.stock}
                    onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Reorder Point</label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={newProd.reorder}
                    onChange={(e) => setNewProd({ ...newProd, reorder: e.target.value })}
                  />
                </div>
              </div>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Unit of Measure</label>
                  <Select
                    value={newProd.unit}
                    onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                    options={[
                      ...units
                        .filter((u) => u.status === 'active')
                        .map((u) => ({ value: u.abbreviation, label: `${u.name} (${u.abbreviation})` })),
                    ]}
                  />
                  <div
                    onClick={() => setShowQuickUnit(true)}
                    className="text-primary mt-[5px] inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold"
                  >
                    <Plus size={12} /> Add new unit
                  </div>
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Storage Location</label>
                  <Select
                    value={newProd.location}
                    onChange={(e) => setNewProd({ ...newProd, location: e.target.value })}
                    options={[
                      { value: 'Warehouse A', label: 'Warehouse A' },
                      { value: 'Warehouse B', label: 'Warehouse B' },
                      { value: 'Store Front', label: 'Store Front' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Margin Preview</label>
                  <div
                    className={clsx(
                      'rounded-[10px] px-3 py-2.5 text-center',
                      parseFloat(newProd.price) > 0 && parseFloat(newProd.cost) > 0
                        ? 'bg-success-bg'
                        : 'bg-surface-alt',
                    )}
                    style={{
                      border: `1px solid ${parseFloat(newProd.price) > 0 && parseFloat(newProd.cost) > 0 ? COLORS.success + '33' : COLORS.border}`,
                    }}
                  >
                    <span
                      className={clsx(
                        'text-[15px] font-bold',
                        parseFloat(newProd.price) > 0 && parseFloat(newProd.cost) > 0
                          ? 'text-success'
                          : 'text-text-dim',
                      )}
                    >
                      {parseFloat(newProd.price) > 0 && parseFloat(newProd.cost) > 0
                        ? `${((1 - parseFloat(newProd.cost) / parseFloat(newProd.price)) * 100).toFixed(1)}%`
                        : '\u2014'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Auto-linked supplier indicator */}
              <div className="border-primary/[0.20] bg-primary-bg mb-3.5 flex items-center gap-2 rounded-[10px] border px-3.5 py-2.5">
                <Building2 size={14} className="text-primary-light" />
                <span className="text-primary-light text-xs font-medium">Supplier: {supplier.name}</span>
                <span className="text-text-dim ml-auto text-[11px]">Auto-linked</span>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowAddProductForm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Save}
                  onClick={handleAddProduct}
                  disabled={!newProd.name || !newProd.category || !newProd.price || !newProd.cost}
                >
                  Save Product
                </Button>
              </div>
            </Card>
          )}

          {/* Supplier Product Table */}
          <Card noPadding className="overflow-hidden">
            <div className="border-border flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Box size={18} className="text-primary" />
                <span className="text-text text-[15px] font-semibold">Products from {supplier.name}</span>
                <Badge color="primary">{supplierProducts.length} items</Badge>
              </div>
              {!showAddProductForm && (
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowAddProductForm(true)}>
                  Add Product
                </Button>
              )}
            </div>

            {supplierProducts.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Box size={40} className="text-text-dim mb-3" />
                <div className="text-text-muted mb-1.5 text-sm font-semibold">No products yet</div>
                <div className="text-text-dim mb-4 text-xs">
                  Add the first product from this supplier to your catalog.
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setShowAddProductForm(true)}>
                  Add First Product
                </Button>
              </div>
            ) : isMobile(bp) ? (
              <div className="flex flex-col">
                {supplierProducts.map((p) => {
                  const margin = ((1 - p.cost / p.price) * 100).toFixed(1);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setPage('productDetail');
                      }}
                      className="border-border hover:bg-surface-alt cursor-pointer border-b p-3.5 transition-[background] duration-150"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[22px]">{p.image}</span>
                          <div>
                            <div className="text-text text-[13px] font-semibold">{p.name}</div>
                            <div className="text-text-dim font-mono text-[10px]">
                              {p.id} · {p.category}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="mb-2 grid grid-cols-4 gap-1.5">
                        <div>
                          <div className="text-text-dim text-[9px] uppercase">Cost</div>
                          <div className="text-text-muted text-xs">₵{p.cost.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-text-dim text-[9px] uppercase">Price</div>
                          <div className="text-text text-xs font-semibold">₵{p.price.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-text-dim text-[9px] uppercase">Margin</div>
                          <div
                            className={clsx(
                              'text-xs font-semibold',
                              parseFloat(margin) >= 20 ? 'text-success' : 'text-warning',
                            )}
                          >
                            {margin}%
                          </div>
                        </div>
                        <div>
                          <div className="text-text-dim text-[9px] uppercase">Stock</div>
                          <div
                            className={clsx('text-xs font-bold', p.stock <= p.reorder ? 'text-warning' : 'text-text')}
                          >
                            {p.stock} {p.unit}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
                          icon={Tag}
                          onClick={() => {
                            setPrintProduct(p);
                            setShowPriceTagModal(true);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={QrCode}
                          onClick={() => {
                            setPrintProduct(p);
                            setShowBarcodeModal(true);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-border border-b">
                    {[
                      'Product',
                      'SKU',
                      'Category',
                      'Cost (GH₵)',
                      'Price (GH₵)',
                      'Margin',
                      'Stock',
                      'Reorder Pt.',
                      'Status',
                      '',
                    ].map((h) => (
                      <th key={h} className="form-label px-4 py-3 text-left font-semibold tracking-[0.5px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {supplierProducts.map((p) => {
                    const margin = ((1 - p.cost / p.price) * 100).toFixed(1);
                    const stockPct = p.reorder > 0 ? Math.min((p.stock / p.reorder) * 100, 100) : 100;
                    return (
                      <tr
                        key={p.id}
                        className="border-border hover:bg-surface-alt cursor-pointer border-b transition-[background] duration-150"
                        onClick={() => {
                          setSelectedProduct(p);
                          setPage('productDetail');
                        }}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[20px]">{p.image}</span>
                            <span className="text-text text-[13px] font-semibold">{p.name}</span>
                          </div>
                        </td>
                        <td className="text-text-muted px-4 py-2.5 font-mono text-xs">{p.id}</td>
                        <td className="px-4 py-2.5">
                          <Badge color="neutral">{p.category}</Badge>
                        </td>
                        <td className="text-text-muted px-4 py-2.5 text-[13px]">{p.cost.toFixed(2)}</td>
                        <td className="text-text px-4 py-2.5 text-[13px] font-semibold">{p.price.toFixed(2)}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={clsx(
                              'text-xs font-semibold',
                              parseFloat(margin) >= 20 ? 'text-success' : 'text-warning',
                            )}
                          >
                            {margin}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={clsx(
                                'text-[13px] font-bold',
                                p.stock <= p.reorder ? (p.stock === 0 ? 'text-danger' : 'text-warning') : 'text-text',
                              )}
                            >
                              {p.stock}
                            </span>
                            <div className="bg-border h-1 w-8 overflow-hidden rounded-sm">
                              <div
                                className={clsx(
                                  'h-full rounded-sm',
                                  p.stock === 0 ? 'bg-danger' : p.stock <= p.reorder ? 'bg-warning' : 'bg-success',
                                )}
                                style={{ width: `${stockPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <div
                            className="bg-surface-alt border-border hover:border-accent flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 transition-all duration-150"
                            onClick={() => {
                              setReorderProduct(p);
                              setShowReorderModal(true);
                            }}
                          >
                            <Layers size={11} className="text-accent" />
                            <span className="text-text text-xs font-semibold">{p.reorder}</span>
                            <Edit size={9} className="text-text-dim" />
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
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
                              icon={Layers}
                              onClick={() => {
                                setReorderProduct(p);
                                setShowReorderModal(true);
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Tag}
                              onClick={() => {
                                setPrintProduct(p);
                                setShowPriceTagModal(true);
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={QrCode}
                              onClick={() => {
                                setPrintProduct(p);
                                setShowBarcodeModal(true);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Right Sidebar: Supplier Info */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Contact Card */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Contact Information</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { icon: User, label: 'Contact', value: supplier.contact },
                { icon: Phone, label: 'Phone', value: supplier.phone },
                { icon: Mail, label: 'Email', value: supplier.email },
                { icon: MapPin, label: 'Location', value: supplier.location },
              ].map((item, i) => (
                <div key={i} className="bg-surface-alt flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                  <item.icon size={14} className="text-text-dim" />
                  <div>
                    <div className="text-text-dim text-[10px]">{item.label}</div>
                    <div className="text-text text-xs font-medium">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Performance */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Supplier Performance</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Rating', value: supplier.rating, max: 5, color: COLORS.warning },
                { label: 'On-Time Delivery', value: 4.2, max: 5, color: COLORS.success },
                { label: 'Quality Score', value: 4.5, max: 5, color: COLORS.accent },
                { label: 'Response Time', value: 3.8, max: 5, color: COLORS.primary },
              ].map((m, i) => (
                <div key={i}>
                  <div className="text-text-muted mb-1 flex justify-between text-xs">
                    <span>{m.label}</span>
                    <span className="text-text font-semibold">
                      {m.value}/{m.max}
                    </span>
                  </div>
                  <ProgressBar value={m.value} max={m.max} color={m.color} />
                </div>
              ))}
            </div>
          </Card>

          {/* Low Stock Alerts */}
          {lowStockProducts.length > 0 && (
            <Card className="border-warning/[0.30] border">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning" />
                <h3 className="text-warning m-0 text-sm font-semibold">Needs Reorder</h3>
              </div>
              <div className="flex flex-col gap-2">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-surface-alt flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2"
                    onClick={() => {
                      setSelectedProduct(p);
                      setPage('productDetail');
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.image}</span>
                      <div>
                        <div className="text-text text-xs font-semibold">{p.name}</div>
                        <div className="text-text-dim text-[10px]">
                          {p.stock} / {p.reorder} {p.unit}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={Truck}
                className="mt-2.5 w-full justify-center"
                onClick={() => setShowPOModal(true)}
              >
                Create Purchase Order
              </Button>
            </Card>
          )}

          {/* Recent Orders */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Recent Purchase Orders</h3>
            <div className="flex flex-col gap-2">
              {[
                { id: 'PO-0041', date: '10 Feb 2026', amount: 'GH₵ 12,500', status: 'completed' as const, items: 8 },
                { id: 'PO-0038', date: '28 Jan 2026', amount: 'GH₵ 8,200', status: 'completed' as const, items: 5 },
                { id: 'PO-0033', date: '15 Jan 2026', amount: 'GH₵ 15,800', status: 'completed' as const, items: 12 },
              ].map((order, i) => (
                <div key={i} className="bg-surface-alt flex items-center justify-between rounded-lg px-2.5 py-2">
                  <div>
                    <div className="text-primary-light font-mono text-xs font-semibold">{order.id}</div>
                    <div className="text-text-dim mt-0.5 text-[10px]">
                      {order.date} · {order.items} items
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-text text-xs font-semibold">{order.amount}</div>
                    <StatusBadge status={order.status} />
                  </div>
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
                icon={Plus}
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowAddProductForm(true)}
              >
                Add New Product
              </Button>
              <Button
                variant="accent"
                icon={Truck}
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowPOModal(true)}
              >
                Create Purchase Order
              </Button>
              <Button
                variant="secondary"
                icon={Layers}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  if (supplierProducts.length > 0) {
                    setReorderProduct(supplierProducts[0] ?? null);
                    setShowReorderModal(true);
                  }
                }}
              >
                Change Reorder Level
              </Button>
              <Button
                variant="secondary"
                icon={Tag}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  if (supplierProducts.length > 0) {
                    setPrintProduct(supplierProducts[0] ?? null);
                    setShowPriceTagModal(true);
                  }
                }}
              >
                Print Price Tags
              </Button>
              <Button
                variant="secondary"
                icon={QrCode}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  if (supplierProducts.length > 0) {
                    setPrintProduct(supplierProducts[0] ?? null);
                    setShowBarcodeModal(true);
                  }
                }}
              >
                Print Barcodes
              </Button>
              <Button variant="secondary" icon={Download} size="sm" className="w-full justify-start">
                Export Product List
              </Button>
              <Button variant="secondary" icon={Mail} size="sm" className="w-full justify-start">
                Contact Supplier
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ReorderLevelModal
        isOpen={showReorderModal}
        onClose={() => {
          setShowReorderModal(false);
          setReorderProduct(null);
        }}
        product={reorderProduct}
        onSave={(id: string, level: number) => {
          const p = products.find((pr) => pr.id === id);
          if (p)
            updateProduct(id, {
              reorder: level,
              status: p.stock === 0 ? 'out_of_stock' : p.stock <= level ? 'low_stock' : 'in_stock',
            });
        }}
      />
      <PurchaseOrderModal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        products={products}
        supplier={supplier}
      />
      <PrintPriceTagModal
        isOpen={showPriceTagModal}
        onClose={() => {
          setShowPriceTagModal(false);
          setPrintProduct(null);
        }}
        product={printProduct}
        bp={bp}
      />
      <PrintBarcodeModal
        isOpen={showBarcodeModal}
        onClose={() => {
          setShowBarcodeModal(false);
          setPrintProduct(null);
        }}
        product={printProduct}
        bp={bp}
      />

      {showQuickCat && (
        <QuickAddCategoryModal
          categories={categories}
          onClose={() => setShowQuickCat(false)}
          onSave={(cat) => {
            if (setCategories)
              setCategories((prev) => [...prev, { ...cat, id: `cat-${String(Date.now()).slice(-6)}` }]);
            setShowQuickCat(false);
          }}
        />
      )}
      {showQuickUnit && (
        <QuickAddUnitModal
          units={units}
          onClose={() => setShowQuickUnit(false)}
          onSave={(unit) => {
            if (setUnits)
              setUnits((prev) => [...prev, { ...unit, id: `uom-${String(Date.now()).slice(-6)}`, status: 'active' }]);
            setShowQuickUnit(false);
          }}
        />
      )}

      <ScannerModal
        isOpen={showScannerSupp}
        onClose={() => setShowScannerSupp(false)}
        products={products}
        mode="barcode"
        onScan={(result) => {
          const code = typeof result === 'string' ? result : 'code' in result ? result.code : '';
          setNewProd((prev) => ({ ...prev, barcode: code }));
        }}
      />
    </div>
  );
};
