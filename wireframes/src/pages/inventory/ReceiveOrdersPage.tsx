import { useState, Fragment } from 'react';
import {
  Search,
  Plus,
  X,
  PackageCheck,
  Trash2,
  CheckCircle,
  Save,
  Calendar,
  Package,
  ClipboardList,
} from 'lucide-react';
import { useColors } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { paginate } from '@/utils/pagination';
import { formatDate } from '@/utils/formatters';
import { createBatch, updateProductFromBatches, generateLotNumber } from '@/utils/batchUtils';
import { Card, Badge, StatusBadge, Button, Input, Select, Paginator } from '@/components/ui';
import { WAREHOUSES, RECEIVE_ORDERS } from '@/constants/demoData';
import type { Product } from '@/types';

interface ReceiveBatch {
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  condition: string;
  notes: string;
}

interface ReceiveItem {
  productId: string;
  name: string;
  image: string;
  unit: string;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  condition: string;
  batchMode: 'single' | 'multiple';
  receiveBatches: ReceiveBatch[];
}

interface ReceiveOrdersPageProps {
  products: Product[];
  updateProduct: (id: string, updates: Partial<Product>) => void;
}

export const ReceiveOrdersPage = ({ products, updateProduct }: ReceiveOrdersPageProps) => {
  const COLORS = useColors();
  const bp = useBreakpoint();

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [tblPage, setTblPage] = useState(1);
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0]?.name || '');
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [addProductId, setAddProductId] = useState('');

  const refNumber = `RCV-${new Date().getFullYear()}-${String(RECEIVE_ORDERS.length + 1).padStart(4, '0')}`;

  const resetForm = () => {
    setWarehouse(WAREHOUSES[0]?.name || '');
    setReceiveDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setReceiveItems([]);
    setAddProductId('');
    setSubmitted(false);
  };

  // --- Add product to receiving list ---
  const handleAddProduct = () => {
    if (!addProductId) return;
    if (receiveItems.some((r) => r.productId === addProductId)) return;
    const prod = products.find((p) => p.id === addProductId);
    if (!prod) return;
    setReceiveItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        image: prod.image,
        unit: prod.unit,
        quantity: 0,
        batchNumber: '',
        expiryDate: '',
        condition: 'good',
        batchMode: 'single',
        receiveBatches: [
          {
            batchNumber: generateLotNumber(Date.now() % 10000),
            quantity: 0,
            expiryDate: '',
            condition: 'good',
            notes: '',
          },
        ],
      },
    ]);
    setAddProductId('');
  };

  // --- Remove product from list ---
  const handleRemoveProduct = (idx: number) => {
    setReceiveItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Submit handler --- mirrors PODetailPage handleReceive ---
  const handleSubmit = () => {
    const today = new Date().toISOString().slice(0, 10);

    receiveItems.forEach((ri) => {
      const qty = ri.batchMode === 'multiple' ? ri.receiveBatches.reduce((s, b) => s + b.quantity, 0) : ri.quantity;
      if (qty <= 0) return;

      const prod = products.find((p) => p.id === ri.productId);
      if (!prod) return;

      if (ri.batchMode === 'multiple') {
        const existingBatches = prod.batches ? [...prod.batches] : [];
        const newBatches = ri.receiveBatches
          .filter((rb) => rb.quantity > 0)
          .map((rb) =>
            createBatch(
              ri.productId,
              {
                batchNumber: rb.batchNumber,
                quantity: rb.quantity,
                expiryDate: rb.expiryDate || undefined,
                condition: rb.condition,
                notes: rb.notes || undefined,
                location: warehouse,
              },
              today,
            ),
          );
        const allBatches = [...existingBatches, ...newBatches];
        const batchProduct = { ...prod, batches: allBatches, batchTracking: true };
        const batchUpdates = updateProductFromBatches(batchProduct);
        updateProduct(ri.productId, { ...batchUpdates, lastUpdated: today });
      } else {
        const shouldBatch = ri.batchNumber.trim() || prod.batchTracking;
        if (shouldBatch) {
          const lotNumber = ri.batchNumber.trim() || generateLotNumber(Date.now() % 10000);
          const existingBatches = prod.batches ? [...prod.batches] : [];
          const newBatch = createBatch(
            ri.productId,
            {
              batchNumber: lotNumber,
              quantity: ri.quantity,
              expiryDate: ri.expiryDate || undefined,
              condition: ri.condition,
              location: warehouse,
            },
            today,
          );
          const allBatches = [...existingBatches, newBatch];
          const batchProduct = { ...prod, batches: allBatches, batchTracking: true };
          const batchUpdates = updateProductFromBatches(batchProduct);
          updateProduct(ri.productId, { ...batchUpdates, lastUpdated: today });
        } else {
          const newStock = prod.stock + ri.quantity;
          const updates: Partial<Product> = {
            stock: newStock,
            status: newStock === 0 ? 'out_of_stock' : newStock <= prod.reorder ? 'low_stock' : 'in_stock',
            lastUpdated: today,
          };
          if (ri.expiryDate && (!prod.expiryDate || ri.expiryDate < prod.expiryDate)) {
            updates.expiryDate = ri.expiryDate;
          }
          updateProduct(ri.productId, updates);
        }
      }
    });

    setSubmitted(true);
    setTimeout(() => {
      setShowForm(false);
      resetForm();
    }, 2200);
  };

  // --- History data ---
  type RO = (typeof RECEIVE_ORDERS)[number];
  const filteredOrders: RO[] = RECEIVE_ORDERS.filter((ro) => {
    if (filterStatus !== 'all' && ro.status !== filterStatus) return false;
    if (
      searchQ &&
      !ro.reference.toLowerCase().includes(searchQ.toLowerCase()) &&
      !ro.notes.toLowerCase().includes(searchQ.toLowerCase()) &&
      !ro.warehouse.toLowerCase().includes(searchQ.toLowerCase())
    )
      return false;
    return true;
  });
  const perPage = isMobile(bp) ? 8 : 10;
  const pag = paginate(filteredOrders, tblPage, perPage);

  // --- Compute totals ---
  const totalItemQty = receiveItems.reduce((s, ri) => {
    if (ri.batchMode === 'multiple') return s + ri.receiveBatches.reduce((a, b) => a + b.quantity, 0);
    return s + ri.quantity;
  }, 0);
  const canSubmit = receiveItems.length > 0 && totalItemQty > 0 && warehouse;

  // --- KPI data ---
  const now = new Date();
  const thisMonth = RECEIVE_ORDERS.filter((ro) => {
    const d = new Date(ro.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total Receipts', value: RECEIVE_ORDERS.length, color: COLORS.primary, icon: ClipboardList },
          { label: 'This Month', value: thisMonth.length, color: COLORS.accent, icon: Calendar },
          {
            label: 'Units Received',
            value: RECEIVE_ORDERS.reduce((s, r) => s + r.totalQty, 0),
            color: COLORS.success,
            icon: Package,
          },
          {
            label: 'Avg Items / Receipt',
            value: (RECEIVE_ORDERS.reduce((s, r) => s + r.itemCount, 0) / Math.max(RECEIVE_ORDERS.length, 1)).toFixed(
              1,
            ),
            color: COLORS.orange,
            icon: PackageCheck,
          },
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${stat.color}15` }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="form-label font-semibold tracking-[0.5px]">{stat.label}</div>
                <div className="text-text text-[22px] font-extrabold">{stat.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-1 flex-wrap gap-2.5">
          <Input
            icon={Search}
            placeholder="Search receipts..."
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setTblPage(1);
            }}
            className="max-w-[300px] min-w-[150px] flex-1"
          />
          <Select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setTblPage(1);
            }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'draft', label: 'Draft' },
            ]}
            className="min-w-[130px]"
          />
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Cancel' : 'New Receipt'}
        </Button>
      </div>

      {/* --- INLINE FORM --- */}
      {showForm && (
        <Card className="border-accent relative overflow-hidden border">
          {/* Success overlay */}
          {submitted && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[13px] bg-[rgba(15,17,23,0.92)] backdrop-blur-[6px]">
              <div
                className="bg-success-bg mb-3.5 flex h-[60px] w-[60px] items-center justify-center rounded-full"
                style={{ border: `2px solid ${COLORS.success}`, animation: 'modalIn 0.3s ease' }}
              >
                <CheckCircle size={28} className="text-success" />
              </div>
              <div className="text-success text-base font-bold">Stock Received Successfully</div>
              <div className="text-text-muted mt-1 text-xs">
                {receiveItems.length} product{receiveItems.length !== 1 ? 's' : ''} updated · {totalItemQty} units added
              </div>
            </div>
          )}

          {/* Form header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` }}
              >
                <PackageCheck size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-text m-0 text-[15px] font-bold">Receive Goods</h3>
                <div className="text-text-muted mt-0.5 text-[11px]">Add stock without a Purchase Order</div>
              </div>
            </div>
            <Button
              variant="ghost"
              icon={X}
              size="sm"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            />
          </div>

          {/* Receipt details grid */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="text-text-muted mb-1.5 block text-xs font-medium">Reference #</label>
              <input
                value={refNumber}
                readOnly
                className="bg-surface-alt border-border text-text-dim box-border w-full cursor-not-allowed rounded-[10px] border px-3 py-2.5 font-mono text-[13px] font-semibold outline-none"
              />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-xs font-medium">Warehouse *</label>
              <Select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                options={WAREHOUSES.map((w) => ({ value: w.name, label: `${w.name} (${w.type})` }))}
              />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-xs font-medium">Date</label>
              <input
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="bg-surface-alt border-border text-text box-border w-full rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
              />
            </div>
            <div>
              <label className="text-text-muted mb-1.5 block text-xs font-medium">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="bg-surface-alt border-border text-text box-border w-full rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
              />
            </div>
          </div>

          {/* Add product row */}
          <div className="mb-4 flex items-end gap-2.5">
            <div className="flex-1">
              <label className="text-text-muted mb-1.5 block text-xs font-medium">Add Product</label>
              <Select
                value={addProductId}
                onChange={(e) => setAddProductId(e.target.value)}
                options={[
                  { value: '', label: 'Select product to add...' },
                  ...products
                    .filter((p) => !receiveItems.some((ri) => ri.productId === p.id))
                    .map((p) => ({ value: p.id, label: `${p.image} ${p.name} (${p.stock} ${p.unit} in stock)` })),
                ]}
              />
            </div>
            <Button variant="accent" icon={Plus} onClick={handleAddProduct} disabled={!addProductId}>
              Add
            </Button>
          </div>

          {/* Items table */}
          {receiveItems.length > 0 && (
            <div className="bg-surface-alt border-border mb-4 overflow-hidden rounded-xl border">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-border border-b">
                    {['Product', 'Qty', 'Batch #', 'Condition', 'Expiry Date', 'Batch Mode', ''].map((h) => (
                      <th key={h} className="form-label px-3.5 py-3 text-left font-semibold tracking-[0.5px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receiveItems.map((ri, idx) => {
                    const batchAllocated = ri.receiveBatches.reduce((s, b) => s + b.quantity, 0);
                    return (
                      <Fragment key={ri.productId}>
                        <tr
                          style={{
                            borderBottom: ri.batchMode === 'multiple' ? 'none' : `1px solid ${COLORS.border}`,
                          }}
                        >
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{ri.image}</span>
                              <div>
                                <div className="text-text text-[13px] font-semibold">{ri.name}</div>
                                <div className="text-text-dim text-[11px]">{ri.unit}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3.5 py-3">
                            {ri.batchMode === 'single' && (
                              <input
                                type="number"
                                value={ri.quantity}
                                min="0"
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setReceiveItems((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, quantity: val } : r)),
                                  );
                                }}
                                className="bg-bg border-border text-text w-20 rounded-lg border px-2 py-[7px] text-center font-[inherit] text-sm font-bold outline-none"
                              />
                            )}
                            {ri.batchMode === 'multiple' && (
                              <span className="text-text text-sm font-bold">{batchAllocated}</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3">
                            {ri.batchMode === 'single' && (
                              <input
                                value={ri.batchNumber}
                                placeholder="Auto"
                                onChange={(e) =>
                                  setReceiveItems((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, batchNumber: e.target.value } : r)),
                                  )
                                }
                                className="bg-bg border-border text-text w-[120px] rounded-lg border px-2 py-1.5 font-mono text-[11px] font-semibold outline-none"
                              />
                            )}
                            {ri.batchMode === 'multiple' && (
                              <span className="text-text-dim text-[11px]">Per batch ↓</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3">
                            {ri.batchMode === 'single' && (
                              <select
                                value={ri.condition}
                                onChange={(e) =>
                                  setReceiveItems((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, condition: e.target.value } : r)),
                                  )
                                }
                                className="bg-bg border-border text-text cursor-pointer rounded-lg border px-2.5 py-1.5 font-[inherit] text-[11px] font-medium outline-none"
                              >
                                <option value="good">Good</option>
                                <option value="damaged">Damaged</option>
                                <option value="short">Short Ship</option>
                              </select>
                            )}
                            {ri.batchMode === 'multiple' && (
                              <span className="text-text-dim text-[11px]">Per batch ↓</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3">
                            {ri.batchMode === 'single' && (
                              <input
                                type="date"
                                value={ri.expiryDate}
                                onChange={(e) =>
                                  setReceiveItems((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, expiryDate: e.target.value } : r)),
                                  )
                                }
                                className="bg-bg border-border text-text rounded-lg border px-2 py-1.5 font-[inherit] text-[11px] outline-none"
                              />
                            )}
                            {ri.batchMode === 'multiple' && (
                              <span className="text-text-dim text-[11px]">Per batch ↓</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3">
                            <select
                              value={ri.batchMode}
                              onChange={(e) =>
                                setReceiveItems((prev) =>
                                  prev.map((r, i) => {
                                    if (i !== idx) return r;
                                    const mode = e.target.value as 'single' | 'multiple';
                                    if (mode === 'multiple' && r.receiveBatches.length === 0) {
                                      return {
                                        ...r,
                                        batchMode: mode,
                                        receiveBatches: [
                                          {
                                            batchNumber: generateLotNumber(1),
                                            quantity: r.quantity,
                                            expiryDate: r.expiryDate,
                                            condition: r.condition,
                                            notes: '',
                                          },
                                        ],
                                      };
                                    }
                                    if (mode === 'multiple' && r.receiveBatches.length === 1 && r.receiveBatches[0]) {
                                      const rb0 = r.receiveBatches[0];
                                      return {
                                        ...r,
                                        batchMode: mode,
                                        receiveBatches: [
                                          {
                                            batchNumber: rb0.batchNumber,
                                            quantity: r.quantity,
                                            expiryDate: rb0.expiryDate || r.expiryDate,
                                            condition: rb0.condition || r.condition,
                                            notes: rb0.notes,
                                          },
                                        ],
                                      };
                                    }
                                    return { ...r, batchMode: mode };
                                  }),
                                )
                              }
                              className="bg-bg border-border text-text cursor-pointer rounded-lg border px-2.5 py-1.5 font-[inherit] text-[11px] font-medium outline-none"
                            >
                              <option value="single">Single</option>
                              <option value="multiple">Split Batches</option>
                            </select>
                          </td>
                          <td className="px-3.5 py-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(idx)}
                              className="bg-danger-bg text-danger border-danger/[0.20] flex h-7 w-7 items-center justify-center rounded-md border"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>

                        {/* Batch split sub-rows */}
                        {ri.batchMode === 'multiple' && (
                          <tr className="border-border border-b">
                            <td colSpan={7} className="px-3.5 pt-0 pb-3.5">
                              <div className="bg-bg border-primary/[0.20] rounded-[10px] border p-3">
                                <div className="mb-2.5 flex items-center justify-between">
                                  <span className="text-primary-light text-[11px] font-semibold">
                                    Batch Details — {ri.receiveBatches.length} batch
                                    {ri.receiveBatches.length !== 1 ? 'es' : ''}
                                  </span>
                                  <span className="text-success text-[11px] font-semibold">
                                    {batchAllocated} total units
                                  </span>
                                </div>
                                <div className="mb-1.5 grid grid-cols-[1fr_80px_1fr_1fr_1fr_32px] gap-2">
                                  <span className="text-text-dim text-[10px]">Batch #</span>
                                  <span className="text-text-dim text-center text-[10px]">Qty</span>
                                  <span className="text-text-dim text-[10px]">Expiry</span>
                                  <span className="text-text-dim text-[10px]">Condition</span>
                                  <span className="text-text-dim text-[10px]">Notes</span>
                                  <span />
                                </div>
                                {ri.receiveBatches.map((rb, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className="mb-2 grid grid-cols-[1fr_80px_1fr_1fr_1fr_32px] items-center gap-2"
                                  >
                                    <input
                                      value={rb.batchNumber}
                                      placeholder="LOT-2026-0001"
                                      onChange={(e) =>
                                        setReceiveItems((prev) =>
                                          prev.map((r, i) =>
                                            i !== idx
                                              ? r
                                              : {
                                                  ...r,
                                                  receiveBatches: r.receiveBatches.map((b, bi) =>
                                                    bi !== bIdx ? b : { ...b, batchNumber: e.target.value },
                                                  ),
                                                },
                                          ),
                                        )
                                      }
                                      className="bg-surface-alt border-border text-text rounded-lg border px-2 py-1.5 font-mono text-xs font-semibold outline-none"
                                    />
                                    <input
                                      type="number"
                                      value={rb.quantity}
                                      min="0"
                                      onChange={(e) => {
                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                        setReceiveItems((prev) =>
                                          prev.map((r, i) =>
                                            i !== idx
                                              ? r
                                              : {
                                                  ...r,
                                                  receiveBatches: r.receiveBatches.map((b, bi) =>
                                                    bi !== bIdx ? b : { ...b, quantity: val },
                                                  ),
                                                },
                                          ),
                                        );
                                      }}
                                      className="bg-surface-alt border-border text-text rounded-lg border px-2 py-1.5 text-center font-[inherit] text-xs font-bold outline-none"
                                    />
                                    <input
                                      type="date"
                                      value={rb.expiryDate}
                                      onChange={(e) =>
                                        setReceiveItems((prev) =>
                                          prev.map((r, i) =>
                                            i !== idx
                                              ? r
                                              : {
                                                  ...r,
                                                  receiveBatches: r.receiveBatches.map((b, bi) =>
                                                    bi !== bIdx ? b : { ...b, expiryDate: e.target.value },
                                                  ),
                                                },
                                          ),
                                        )
                                      }
                                      className="bg-surface-alt border-border text-text rounded-lg border px-2 py-1.5 font-[inherit] text-[11px] outline-none"
                                    />
                                    <select
                                      value={rb.condition}
                                      onChange={(e) =>
                                        setReceiveItems((prev) =>
                                          prev.map((r, i) =>
                                            i !== idx
                                              ? r
                                              : {
                                                  ...r,
                                                  receiveBatches: r.receiveBatches.map((b, bi) =>
                                                    bi !== bIdx ? b : { ...b, condition: e.target.value },
                                                  ),
                                                },
                                          ),
                                        )
                                      }
                                      className="bg-surface-alt border-border text-text cursor-pointer rounded-lg border px-2 py-1.5 font-[inherit] text-[11px] outline-none"
                                    >
                                      <option value="good">Good</option>
                                      <option value="damaged">Damaged</option>
                                      <option value="short">Short Ship</option>
                                    </select>
                                    <input
                                      placeholder="Notes..."
                                      value={rb.notes}
                                      onChange={(e) =>
                                        setReceiveItems((prev) =>
                                          prev.map((r, i) =>
                                            i !== idx
                                              ? r
                                              : {
                                                  ...r,
                                                  receiveBatches: r.receiveBatches.map((b, bi) =>
                                                    bi !== bIdx ? b : { ...b, notes: e.target.value },
                                                  ),
                                                },
                                          ),
                                        )
                                      }
                                      className="bg-surface-alt border-border text-text rounded-lg border px-2 py-1.5 font-[inherit] text-[11px] outline-none"
                                    />
                                    {ri.receiveBatches.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setReceiveItems((prev) =>
                                            prev.map((r, i) =>
                                              i !== idx
                                                ? r
                                                : {
                                                    ...r,
                                                    receiveBatches: r.receiveBatches.filter((_, bi) => bi !== bIdx),
                                                  },
                                            ),
                                          )
                                        }
                                        className="bg-danger-bg text-danger border-danger/[0.20] flex h-7 w-7 shrink-0 items-center justify-center rounded-md border"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <div className="mt-1 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReceiveItems((prev) =>
                                        prev.map((r, i) =>
                                          i !== idx
                                            ? r
                                            : {
                                                ...r,
                                                receiveBatches: [
                                                  ...r.receiveBatches,
                                                  {
                                                    batchNumber: generateLotNumber(r.receiveBatches.length + 1),
                                                    quantity: 0,
                                                    expiryDate: '',
                                                    condition: 'good',
                                                    notes: '',
                                                  },
                                                ],
                                              },
                                        ),
                                      )
                                    }
                                    className="bg-primary-bg text-primary-light border-primary/[0.20] flex items-center gap-1 rounded-lg border px-3 py-[5px] font-[inherit] text-[11px] font-semibold"
                                  >
                                    <Plus size={12} /> Add Batch
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {receiveItems.length === 0 && (
            <div className="bg-surface-alt mb-4 rounded-xl px-5 py-8 text-center">
              <PackageCheck size={32} className="text-text-dim mb-2" />
              <div className="text-text-dim text-[13px]">
                No products added yet. Select a product above to start receiving.
              </div>
            </div>
          )}

          {/* Form footer */}
          <div className="border-border flex items-center justify-between border-t pt-4">
            <div className="text-text-muted text-xs">
              Receiving{' '}
              <span className="text-text font-bold">
                {receiveItems.length} product{receiveItems.length !== 1 ? 's' : ''}
              </span>{' '}
              · <span className="text-text font-bold">{totalItemQty} units</span> total
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" icon={Save} disabled={!canSubmit} onClick={handleSubmit}>
                Receive Stock
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* --- HISTORY TABLE --- */}
      <Card className="overflow-hidden p-0">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <PackageCheck size={18} className="text-accent" />
            <span className="text-text text-[15px] font-semibold">Receipt History</span>
          </div>
          <Badge color="primary">
            {filteredOrders.length} receipt{filteredOrders.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {!isMobile(bp) ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-border border-b">
                {['Receipt #', 'Date', 'Warehouse', 'Items', 'Total Qty', 'Notes', 'Created By', 'Status'].map((h) => (
                  <th key={h} className="form-label px-4 py-3 text-left font-semibold tracking-[0.5px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pag.items.map((ro) => (
                <tr key={ro.id} className="border-border hover:bg-surface-alt border-b transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-primary-light font-mono text-[13px] font-semibold">{ro.reference}</span>
                  </td>
                  <td className="text-text px-4 py-3 text-xs">{formatDate(ro.date)}</td>
                  <td className="px-4 py-3">
                    <Badge color="accent" size="sm">
                      {ro.warehouse}
                    </Badge>
                  </td>
                  <td className="text-text px-4 py-3 text-[13px] font-semibold">{ro.itemCount}</td>
                  <td className="text-success px-4 py-3 text-[13px] font-bold">{ro.totalQty}</td>
                  <td className="text-text-muted max-w-[180px] overflow-hidden px-4 py-3 text-xs text-ellipsis whitespace-nowrap">
                    {ro.notes}
                  </td>
                  <td className="text-text px-4 py-3 text-xs">{ro.createdBy}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ro.status} />
                  </td>
                </tr>
              ))}
              {pag.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-text-dim px-4 py-8 text-center text-[13px]">
                    No receipts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col gap-2 p-3">
            {pag.items.map((ro) => (
              <div key={ro.id} className="bg-surface-alt border-border rounded-[10px] border p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-primary-light font-mono text-[13px] font-semibold">{ro.reference}</span>
                  <StatusBadge status={ro.status} />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <span className="text-text-dim text-[10px]">Date</span>
                    <div className="text-text text-xs">{formatDate(ro.date)}</div>
                  </div>
                  <div>
                    <span className="text-text-dim text-[10px]">Warehouse</span>
                    <div className="text-text text-xs">{ro.warehouse}</div>
                  </div>
                  <div>
                    <span className="text-text-dim text-[10px]">Items</span>
                    <div className="text-text text-xs font-semibold">{ro.itemCount}</div>
                  </div>
                  <div>
                    <span className="text-text-dim text-[10px]">Total Qty</span>
                    <div className="text-success text-xs font-bold">{ro.totalQty}</div>
                  </div>
                </div>
                {ro.notes && <div className="text-text-muted mt-1.5 text-[11px]">{ro.notes}</div>}
                <div className="text-text-dim mt-1.5 text-[10px]">by {ro.createdBy}</div>
              </div>
            ))}
            {pag.items.length === 0 && (
              <div className="text-text-dim px-4 py-8 text-center text-[13px]">No receipts found.</div>
            )}
          </div>
        )}

        {pag.totalPages > 1 && (
          <div className="border-border border-t px-4 py-3">
            <Paginator
              total={pag.total}
              page={pag.page}
              totalPages={pag.totalPages}
              perPage={10}
              start={pag.start}
              onPage={setTblPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
