import { useState } from 'react';
import { ArrowLeft, Hash, QrCode, Camera, Plus, DollarSign, Tag, Save, RotateCcw, X, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation, useShop } from '@/context';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { ScannerModal, QuickAddCategoryModal } from '@/components/modals';
import { SUPPLIERS } from '@/constants/demoData';
import type { Product, Category, UnitOfMeasure } from '@/types';

interface AddProductPageProps {
  product?: Product | null;
  products: Product[];
  addProduct?: (product: Product) => void;
  categories: Category[];
  units: UnitOfMeasure[];
  setCategories?: React.Dispatch<React.SetStateAction<Category[]>>;
  setUnits?: React.Dispatch<React.SetStateAction<UnitOfMeasure[]>>;
}

// Quick Add Unit Modal
const QuickAddUnitModal = ({
  units,
  onClose,
  onSave,
}: {
  units: UnitOfMeasure[];
  onClose: () => void;
  onSave: (unit: Omit<UnitOfMeasure, 'id'>) => void;
}) => {
  const COLORS = useColors();
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [type, setType] = useState('Count');
  const [desc, setDesc] = useState('');
  const UOM_TYPES = ['Weight', 'Volume', 'Length', 'Count'];
  const isDuplicate = units.some((u) => u.abbreviation.toLowerCase() === abbreviation.trim().toLowerCase());
  const isValid = name.trim() && abbreviation.trim() && desc.trim() && !isDuplicate;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-[3px]"
      />
      <div
        className="bg-surface z-modal fixed top-1/2 left-1/2 w-[96%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl sm:w-[440px]"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'modalIn 0.25s ease',
        }}
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="text-text text-[15px] font-bold">New Unit of Measure</div>
          <div
            onClick={onClose}
            className="bg-surface-alt flex h-7 w-7 cursor-pointer items-center justify-center rounded-md"
          >
            <X size={14} className="text-text-muted" />
          </div>
        </div>
        <div className="flex flex-col gap-3.5 px-5 py-4">
          <div className="grid grid-cols-[2fr_1fr] gap-2.5">
            <div>
              <label className="form-label mb-1 block">Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kilograms" />
            </div>
            <div>
              <label className="form-label mb-1 block">Abbreviation *</label>
              <Input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="e.g. kg" />
              {isDuplicate && <div className="text-danger mt-[3px] text-[11px]">Already exists</div>}
            </div>
          </div>
          <div>
            <label className="form-label mb-1 block">Type *</label>
            <div className="flex gap-[5px]">
              {UOM_TYPES.map((t) => {
                const sel = type === t;
                const icons: Record<string, string> = {
                  Weight: '\u2696\uFE0F',
                  Volume: '\uD83E\uDDEA',
                  Length: '\uD83D\uDCCF',
                  Count: '\uD83D\uDD22',
                };
                return (
                  <div
                    key={t}
                    onClick={() => setType(t)}
                    className={clsx(
                      'flex flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-lg px-1.5 py-2 transition-all duration-150',
                      sel ? 'bg-primary-bg' : 'bg-transparent',
                    )}
                    style={{
                      border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    <span className="text-sm">{icons[t]}</span>
                    <span className={clsx('text-[10px] font-semibold', sel ? 'text-primary' : 'text-text-muted')}>
                      {t}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className="form-label mb-1 block">Description *</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief description"
              rows={2}
              className="bg-surface-alt border-border text-text box-border w-full resize-none rounded-lg border px-2.5 py-2 font-[inherit] text-xs outline-none"
            />
          </div>
        </div>
        <div className="border-border flex justify-end gap-2 border-t px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() =>
              onSave({
                name: name.trim(),
                abbreviation: abbreviation.trim(),
                type,
                description: desc.trim(),
                status: 'active',
              })
            }
            disabled={!isValid}
          >
            Add Unit
          </Button>
        </div>
      </div>
    </>
  );
};

export const AddProductPage = ({
  product,
  products,
  categories = [],
  units = [],
  setCategories,
  setUnits,
}: AddProductPageProps) => {
  const { setPage } = useNavigation();
  const { canAdd: _canAdd, showLimitBlock: _showLimitBlock } = useShop();
  const isEdit = !!product;
  const [_showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplierAdded, _setNewSupplierAdded] = useState<string | null>(null);
  const [showQuickCat, setShowQuickCat] = useState(false);
  const [showQuickUnit, setShowQuickUnit] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => setPage('products')} />
        <h2 className="text-text m-0 text-xl font-bold">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr] md:gap-4">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Basic Info */}
          <Card>
            <h3 className="text-text mt-0 mb-4 text-sm font-semibold">Basic Information</h3>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Product Name *</label>
                <Input placeholder="Enter product name" defaultValue={isEdit ? product!.name : ''} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">SKU *</label>
                  <Input icon={Hash} placeholder="Auto-generated" defaultValue={isEdit ? product!.id : 'SKU-009'} />
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Barcode</label>
                  <div className="flex gap-2">
                    <Input
                      icon={QrCode}
                      placeholder="Scan or enter barcode"
                      value={scannedBarcode || (isEdit ? product!.barcode || '' : '')}
                      onChange={(e) => setScannedBarcode(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="secondary" icon={Camera} onClick={() => setShowScanner(true)}>
                      Scan
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Category *</label>
                  <Select
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
                  <label className="text-text-muted mb-1.5 block text-xs font-medium">Unit of Measure *</label>
                  <Select
                    options={[
                      { value: '', label: 'Select unit' },
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
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Description</label>
                <textarea
                  placeholder="Enter product description..."
                  rows={3}
                  className="bg-surface-alt border-border text-text box-border w-full resize-y rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card>
            <h3 className="text-text mt-0 mb-4 text-sm font-semibold">Pricing & Cost</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Cost Price (GH₵) *</label>
                <Input icon={DollarSign} placeholder="0.00" type="number" defaultValue={isEdit ? product!.cost : ''} />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Selling Price (GH₵) *</label>
                <Input icon={DollarSign} placeholder="0.00" type="number" defaultValue={isEdit ? product!.price : ''} />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Margin</label>
                <div className="bg-success-bg border-success/[0.20] rounded-[10px] border px-3 py-2.5 text-center">
                  <span className="text-success text-[15px] font-bold">
                    {isEdit ? ((1 - product!.cost / product!.price) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Inventory */}
          <Card>
            <h3 className="text-text mt-0 mb-4 text-sm font-semibold">Inventory Settings</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Opening Stock</label>
                <Input placeholder="0" type="number" defaultValue={isEdit ? product!.stock : ''} />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Reorder Point *</label>
                <Input placeholder="0" type="number" defaultValue={isEdit ? product!.reorder : ''} />
              </div>
              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Storage Location</label>
                <Select
                  options={[
                    { value: '', label: 'Select location' },
                    { value: 'wa', label: 'Warehouse A' },
                    { value: 'wb', label: 'Warehouse B' },
                    { value: 'sf', label: 'Store Front' },
                  ]}
                />
              </div>
            </div>
            <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Expiry Date (optional)</label>
                <Input type="date" defaultValue={isEdit ? product!.expiryDate || '' : ''} />
                <div className="text-text-dim mt-1 text-[11px]">Leave blank for non-perishable items</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Image Upload */}
          <Card>
            <h3 className="text-text mt-0 mb-4 text-sm font-semibold">Product Image</h3>
            <div className="border-border hover:border-primary flex h-[180px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors duration-200">
              {isEdit ? (
                <span className="text-[64px]">{product!.image}</span>
              ) : (
                <>
                  <Camera size={32} className="text-text-dim" />
                  <span className="text-text-muted text-xs">Click or drag to upload</span>
                  <span className="text-text-dim text-[11px]">PNG, JPG up to 5MB</span>
                </>
              )}
            </div>
          </Card>

          {/* Supplier */}
          <Card>
            <h3 className="text-text mt-0 mb-4 text-sm font-semibold">Supplier</h3>
            <Select
              options={[
                { value: '', label: 'Select supplier' },
                ...SUPPLIERS.map((s) => ({ value: String(s.id), label: s.name })),
                ...(newSupplierAdded ? [{ value: 'new', label: `${newSupplierAdded} (Pending Approval)` }] : []),
              ]}
              defaultValue={newSupplierAdded ? 'new' : ''}
            />
            {newSupplierAdded && (
              <div className="bg-success-bg border-success/[0.20] mt-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-2">
                <CheckCircle size={12} className="text-success" />
                <span className="text-success text-[11px] font-medium">New supplier submitted -- pending approval</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={Plus}
              className="mt-2 w-full"
              onClick={() => setShowSupplierModal(true)}
            >
              Add New Supplier
            </Button>
          </Card>

          {/* Tags */}
          <Card>
            <h3 className="text-text mt-0 mb-4 text-sm font-semibold">Tags</h3>
            <Input icon={Tag} placeholder="Add tags..." />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {['popular', 'imported', 'perishable'].map((t) => (
                <Badge key={t} color="primary">
                  {t} <X size={10} className="cursor-pointer" />
                </Badge>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="primary" icon={Save} className="w-full justify-center">
              {isEdit ? 'Update Product' : 'Save Product'}
            </Button>
            <Button variant="secondary" icon={RotateCcw} className="w-full justify-center">
              Reset Form
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Add Category Modal */}
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

      {/* Quick Add Unit Modal */}
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
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        products={products}
        mode="barcode"
        onScan={(result) => {
          const code = typeof result === 'string' ? result : 'code' in result ? result.code : '';
          setScannedBarcode(code);
        }}
      />
    </div>
  );
};
