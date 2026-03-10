import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  Package,
  Truck,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors } from '@/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { SUPPLIERS } from '@/constants/demoData';
import type { Product, Supplier } from '@/types';
import type { PaymentTerms } from '@/types/order.types';

interface LineItem {
  productId: string;
  name: string;
  qty: number;
  unitCost: number;
  image: string;
  unit: string;
}

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  supplier?: Supplier | null;
  onSubmit?: (order: {
    supplierId: number;
    supplierName: string;
    items: LineItem[];
    location: string;
    paymentTerms: PaymentTerms;
    expectedDate: string;
    notes: string;
  }) => void;
}

const PAYMENT_TERMS = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'net15', label: 'Net 15 Days' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'net60', label: 'Net 60 Days' },
];

const LOCATIONS = [
  { value: 'Warehouse A', label: 'Warehouse A - Main Storage' },
  { value: 'Warehouse B', label: 'Warehouse B - Secondary' },
  { value: 'Store Front', label: 'Store Front - Retail' },
];

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  supplier: initialSupplier,
  onSubmit,
}) => {
  const COLORS = useColors();

  const [step, setStep] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(initialSupplier || null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [location, setLocation] = useState('Warehouse A');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('net30');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const filteredSuppliers = SUPPLIERS.filter(
    (s) =>
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.contact.toLowerCase().includes(supplierSearch.toLowerCase()),
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const addLineItem = (product: Product) => {
    if (lineItems.some((li) => li.productId === product.id)) return;
    setLineItems((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        qty: 1,
        unitCost: product.cost,
        image: product.image,
        unit: product.unit,
      },
    ]);
    setProductSearch('');
  };

  const updateLineItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const removeLineItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitCost, 0);
  const totalItems = lineItems.reduce((sum, li) => sum + li.qty, 0);

  const canProceedStep1 = selectedSupplier !== null;
  const canProceedStep2 = lineItems.length > 0 && lineItems.every((li) => li.qty > 0 && li.unitCost > 0);
  const canSubmit = canProceedStep1 && canProceedStep2 && expectedDate !== '';

  const handleSubmit = () => {
    if (!selectedSupplier || !onSubmit) return;
    onSubmit({
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      items: lineItems,
      location,
      paymentTerms,
      expectedDate,
      notes,
    });
    onClose();
  };

  const steps = [
    { num: 1, label: 'Supplier', icon: Building2 },
    { num: 2, label: 'Line Items', icon: Package },
    { num: 3, label: 'Delivery & Review', icon: Truck },
  ];

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-[3px]"
      />
      <div
        className="bg-surface z-modal fixed top-1/2 left-1/2 flex max-h-screen w-full flex-col overflow-hidden rounded-none sm:max-h-[92vh] sm:w-[96%] sm:rounded-2xl md:w-[640px]"
        style={{
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'modalIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div className="border-b-border flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
            >
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <div className="text-text text-[15px] font-bold">New Purchase Order</div>
              <div className="text-text-dim text-[11px]">
                Step {step} of 3 — {steps[step - 1]?.label}
              </div>
            </div>
          </div>
          <div
            onClick={onClose}
            className="bg-surface-alt flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg"
          >
            <X size={16} className="text-text-muted" />
          </div>
        </div>

        {/* Step Progress */}
        <div className="border-b-border flex items-center gap-1 border-b px-5 py-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  className={clsx('flex items-center gap-1.5 rounded-lg px-2.5 py-1', isDone && 'cursor-pointer')}
                  style={{
                    background: isActive ? `${COLORS.primary}15` : isDone ? `${COLORS.success}10` : 'transparent',
                  }}
                  onClick={() => isDone && setStep(s.num)}
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-[6px]"
                    style={{
                      background: isActive ? COLORS.primary : isDone ? COLORS.success : COLORS.surfaceAlt,
                    }}
                  >
                    {isDone ? (
                      <CheckCircle size={12} className="text-white" />
                    ) : (
                      <Icon size={12} style={{ color: isActive ? '#fff' : COLORS.textDim }} />
                    )}
                  </div>
                  <span
                    className="hidden text-[11px] font-semibold sm:inline"
                    style={{ color: isActive ? COLORS.primary : isDone ? COLORS.success : COLORS.textDim }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="h-0.5 flex-1 rounded-sm transition-colors duration-300"
                    style={{ background: isDone ? COLORS.success : COLORS.border }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Step 1: Select Supplier */}
          {step === 1 && (
            <div>
              <Input
                icon={Search}
                placeholder="Search suppliers..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="mb-3"
              />
              <div className="flex flex-col gap-1.5">
                {filteredSuppliers.map((s) => {
                  const isSelected = selectedSupplier?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSupplier(s)}
                      className="cursor-pointer rounded-xl px-3.5 py-3 transition-all duration-200"
                      style={{
                        background: isSelected ? `${COLORS.primary}10` : COLORS.surfaceAlt,
                        border: `1.5px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-primary/[0.08] flex h-9 w-9 items-center justify-center rounded-lg">
                            <Building2 size={16} className="text-primary" />
                          </div>
                          <div>
                            <div className="text-text text-[13px] font-bold">{s.name}</div>
                            <div className="text-text-dim text-[11px]">
                              {s.contact} · {s.location}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge color={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Badge>
                          <div className="text-text-dim text-[11px]">{s.products} products</div>
                          {isSelected && <CheckCircle size={16} className="text-primary" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredSuppliers.length === 0 && (
                <div className="text-text-dim p-6 text-center text-xs">No suppliers found</div>
              )}
            </div>
          )}

          {/* Step 2: Line Items */}
          {step === 2 && (
            <div>
              {/* Add product search */}
              <div className="mb-3.5">
                <label className="form-label mb-1.5 block">Add Products</label>
                <Input
                  icon={Search}
                  placeholder="Search products to add..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <div className="border-border bg-surface mt-1 max-h-40 overflow-y-auto rounded-[10px] border">
                    {filteredProducts.slice(0, 8).map((p) => {
                      const alreadyAdded = lineItems.some((li) => li.productId === p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => !alreadyAdded && addLineItem(p)}
                          className={clsx(
                            'border-b-border flex items-center justify-between border-b px-3 py-2 transition-colors duration-150',
                            alreadyAdded ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface-alt cursor-pointer',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{p.image}</span>
                            <div>
                              <div className="text-text text-xs font-semibold">{p.name}</div>
                              <div className="text-text-dim text-[10px]">
                                {p.id} · GH&#x20B5; {p.cost.toFixed(2)}/{p.unit}
                              </div>
                            </div>
                          </div>
                          {alreadyAdded ? (
                            <Badge color="neutral">Added</Badge>
                          ) : (
                            <Plus size={14} className="text-primary" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Line items table */}
              {lineItems.length > 0 ? (
                <div className="border-border overflow-hidden rounded-xl border">
                  {/* Table header */}
                  <div className="form-label bg-surface-alt grid grid-cols-[1fr_60px_70px_30px] px-3 py-2 tracking-[0.8px] sm:grid-cols-[1fr_80px_100px_80px_30px]">
                    <span>Product</span>
                    <span className="text-center">Qty</span>
                    <span className="hidden text-right sm:block">Unit Cost</span>
                    <span className="text-right">Total</span>
                    <span />
                  </div>
                  {/* Table rows */}
                  {lineItems.map((li, idx) => (
                    <div
                      key={li.productId}
                      className="border-t-border grid grid-cols-[1fr_60px_70px_30px] items-center border-t px-3 py-2.5 sm:grid-cols-[1fr_80px_100px_80px_30px]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 text-base">{li.image}</span>
                        <div className="min-w-0">
                          <div className="text-text overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                            {li.name}
                          </div>
                          <div className="text-text-dim text-[10px]">{li.unit}</div>
                        </div>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={li.qty}
                        onChange={(e) => updateLineItem(idx, 'qty', parseInt(e.target.value) || 0)}
                        className="border-border bg-surface text-text box-border w-full rounded-[6px] border px-1.5 py-1 text-center font-mono text-xs font-semibold outline-none"
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={li.unitCost}
                        onChange={(e) => updateLineItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="border-border bg-surface text-text hidden w-full rounded-[6px] border px-1.5 py-1 text-right font-mono text-xs font-semibold outline-none sm:block"
                      />
                      <div className="text-primary text-right font-mono text-xs font-bold">
                        {(li.qty * li.unitCost).toFixed(0)}
                      </div>
                      <div
                        onClick={() => removeLineItem(idx)}
                        className="flex cursor-pointer items-center justify-center"
                      >
                        <Trash2 size={13} className="text-danger" />
                      </div>
                    </div>
                  ))}
                  {/* Totals */}
                  <div className="bg-surface-alt border-t-border flex items-center justify-between border-t px-3 py-2.5">
                    <span className="text-text-muted text-xs font-semibold">
                      {lineItems.length} items · {totalItems} units
                    </span>
                    <span className="text-text font-mono text-sm font-extrabold">GH&#x20B5; {subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-text-dim py-8 text-center">
                  <Package size={32} className="text-border mb-2" />
                  <div className="text-[13px] font-semibold">No items added yet</div>
                  <div className="mt-1 text-[11px]">Search for products above to add them</div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Delivery & Review */}
          {step === 3 && (
            <div className="flex flex-col gap-3.5">
              {/* Delivery Location */}
              <div>
                <label className="form-label mb-1.5 block">Delivery Location *</label>
                <Select value={location} onChange={(e) => setLocation(e.target.value)} options={LOCATIONS} />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="form-label mb-1.5 block">Payment Terms</label>
                <Select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                  options={PAYMENT_TERMS}
                />
              </div>

              {/* Expected Date */}
              <div>
                <label className="form-label mb-1.5 block">Expected Delivery Date *</label>
                <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
              </div>

              {/* Notes */}
              <div>
                <label className="form-label mb-1.5 block">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional instructions or notes..."
                  rows={3}
                  className="bg-surface-alt border-border text-text box-border w-full resize-none rounded-lg border px-3 py-2 font-[inherit] text-xs outline-none"
                />
              </div>

              {/* Order Summary */}
              <div className="bg-surface-alt border-border rounded-xl border p-3.5">
                <div className="form-label mb-2.5">Order Summary</div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Supplier</span>
                    <span className="text-text font-semibold">{selectedSupplier?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Items</span>
                    <span className="text-text font-semibold">
                      {lineItems.length} products · {totalItems} units
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Delivery To</span>
                    <span className="text-text font-semibold">{location}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Payment</span>
                    <span className="text-text font-semibold">
                      {PAYMENT_TERMS.find((p) => p.value === paymentTerms)?.label}
                    </span>
                  </div>
                  {expectedDate && (
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Expected</span>
                      <span className="text-text font-semibold">{expectedDate}</span>
                    </div>
                  )}
                  <div className="border-t-border mt-1.5 flex justify-between border-t pt-2">
                    <span className="text-text text-[13px] font-bold">Total</span>
                    <span className="text-primary font-mono text-base font-extrabold">
                      GH&#x20B5; {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Preview */}
              <div className="border-border overflow-hidden rounded-[10px] border">
                <div className="form-label bg-surface-alt px-3 py-2 tracking-[0.8px]">Items</div>
                {lineItems.map((li) => (
                  <div
                    key={li.productId}
                    className="border-t-border flex items-center justify-between border-t px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{li.image}</span>
                      <span className="text-text text-xs font-semibold">{li.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-text-dim text-[11px]">
                        {li.qty} x GH&#x20B5;{li.unitCost.toFixed(2)}
                      </span>
                      <span className="text-text font-mono text-xs font-bold">
                        GH&#x20B5;{(li.qty * li.unitCost).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-border flex justify-between gap-2 border-t px-5 py-3.5">
          <div>
            {step > 1 && (
              <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              >
                Next <ChevronRight size={14} />
              </Button>
            ) : (
              <Button variant="primary" size="sm" icon={CheckCircle} onClick={handleSubmit} disabled={!canSubmit}>
                Create Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
