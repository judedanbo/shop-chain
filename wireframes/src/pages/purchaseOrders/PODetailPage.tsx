import { useState, useEffect, Fragment } from 'react';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  X,
  Printer,
  Box,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Download,
  Copy,
  Plus,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import { useBreakpoint } from '@/hooks';
import { formatDate } from '@/utils/formatters';
import { Card, Badge, StatusBadge, Button } from '@/components/ui';
import { SUPPLIERS } from '@/constants/demoData';
import { createBatch, updateProductFromBatches, generateLotNumber } from '@/utils/batchUtils';
import type { Product, PurchaseOrder } from '@/types';

interface PODetailPageProps {
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  products: Product[];
  updateProduct: (id: string, updates: Partial<Product>) => void;
}

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
  qty: number;
  unitCost: number;
  receivedQty: number;
  receivingQty: number;
  condition: string;
  expiryDate: string;
  batchNumber: string;
  batchMode: 'single' | 'multiple';
  receiveBatches: ReceiveBatch[];
}

export const PODetailPage = ({ setPurchaseOrders, products, updateProduct }: PODetailPageProps) => {
  const bp = useBreakpoint();
  const { setPage, selectedPO: po, setSelectedPO } = useNavigation();
  const COLORS = useColors();
  const [showPreview, setShowPreview] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveSubmitted, setReceiveSubmitted] = useState(false);
  const [printSent, setPrintSent] = useState(false);

  useEffect(() => {
    if (showReceive && po) {
      setReceiveItems(
        po.items.map((li, idx) => ({
          ...li,
          receivingQty: li.qty - (li.receivedQty || 0),
          condition: 'good',
          expiryDate: li.expiryDate || '',
          batchNumber: '',
          batchMode: 'single' as const,
          receiveBatches: [
            {
              batchNumber: generateLotNumber(idx + 1),
              quantity: li.qty - (li.receivedQty || 0),
              expiryDate: li.expiryDate || '',
              condition: 'good',
              notes: '',
            },
          ],
        })),
      );
      setReceiveNotes('');
      setReceiveSubmitted(false);
    }
  }, [showReceive]);

  if (!po) return null;

  const poTotal = po.items.reduce((a, li) => a + li.qty * li.unitCost, 0);
  const receivedTotal = po.items.reduce((a, li) => a + (li.receivedQty || 0) * li.unitCost, 0);
  const supplier = SUPPLIERS.find((s) => s.id === po.supplierId);
  const canReceive = ['approved', 'shipped', 'partial'].includes(po.status);
  const canApprove = po.status === 'pending';
  const canCancel = ['draft', 'pending'].includes(po.status);
  const paymentLabel =
    (
      {
        cod: 'Cash on Delivery',
        net7: 'Net 7 Days',
        net15: 'Net 15 Days',
        net30: 'Net 30 Days',
        net60: 'Net 60 Days',
        advance: 'Advance Payment',
      } as Record<string, string>
    )[po.paymentTerms] || po.paymentTerms;

  const updatePOStatus = (status: string, extra = {}) => {
    const updated = { ...po, status: status as PurchaseOrder['status'], ...extra };
    setPurchaseOrders((prev) => prev.map((p) => (p.id === po.id ? updated : p)));
    setSelectedPO(updated);
  };

  const handleReceive = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newItems = po.items.map((li) => {
      const ri = receiveItems.find((r) => r.productId === li.productId);
      const addQty = ri ? ri.receivingQty : 0;
      return { ...li, receivedQty: (li.receivedQty || 0) + addQty };
    });
    const allFull = newItems.every((li) => li.receivedQty >= li.qty);
    const updated = {
      ...po,
      items: newItems,
      status: (allFull ? 'received' : 'partial') as PurchaseOrder['status'],
      receivedDate: today,
    };
    setPurchaseOrders((prev) => prev.map((p) => (p.id === po.id ? updated : p)));
    setSelectedPO(updated);
    receiveItems.forEach((ri) => {
      if (ri.receivingQty > 0) {
        const prod = products.find((p) => p.id === ri.productId);
        if (prod) {
          if (ri.batchMode === 'multiple') {
            // Batch mode: create Batch objects
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
                    sourcePoId: po.id,
                    location: po.location,
                  },
                  today,
                ),
              );
            const allBatches = [...existingBatches, ...newBatches];
            const batchProduct = { ...prod, batches: allBatches, batchTracking: true };
            const batchUpdates = updateProductFromBatches(batchProduct);
            updateProduct(ri.productId, { ...batchUpdates, lastUpdated: today });
          } else {
            // Single mode: create a batch if batch number provided or product already batch-tracked
            const shouldBatch = ri.batchNumber.trim() || prod.batchTracking;
            if (shouldBatch) {
              const lotNumber = ri.batchNumber.trim() || generateLotNumber(Date.now() % 10000);
              const existingBatches = prod.batches ? [...prod.batches] : [];
              const newBatch = createBatch(
                ri.productId,
                {
                  batchNumber: lotNumber,
                  quantity: ri.receivingQty,
                  expiryDate: ri.expiryDate || undefined,
                  condition: ri.condition,
                  sourcePoId: po.id,
                  location: po.location,
                },
                today,
              );
              const allBatches = [...existingBatches, newBatch];
              const batchProduct = { ...prod, batches: allBatches, batchTracking: true };
              const batchUpdates = updateProductFromBatches(batchProduct);
              updateProduct(ri.productId, { ...batchUpdates, lastUpdated: today });
            } else {
              // No batch number, non-batched product: legacy stock update
              const newStock = prod.stock + ri.receivingQty;
              const updates: Partial<Product> = {
                stock: newStock,
                status: newStock === 0 ? 'out_of_stock' : newStock <= prod.reorder ? 'low_stock' : 'in_stock',
                lastUpdated: today,
              };
              if (ri.expiryDate) {
                if (!prod.expiryDate || ri.expiryDate < prod.expiryDate) {
                  updates.expiryDate = ri.expiryDate;
                }
              }
              updateProduct(ri.productId, updates);
            }
          }
        }
      }
    });
    setReceiveSubmitted(true);
    setTimeout(() => {
      setShowReceive(false);
    }, 2200);
  };

  const handlePrint = () => {
    setPrintSent(true);
    setTimeout(() => setPrintSent(false), 2000);
  };

  const timeline = [
    { label: 'Created', date: po.createdDate, done: true, icon: FileText },
    {
      label: 'Pending Approval',
      date: po.status !== 'draft' ? po.createdDate : null,
      done: ['pending', 'approved', 'shipped', 'partial', 'received'].includes(po.status),
      icon: Clock,
    },
    {
      label: 'Approved',
      date: ['approved', 'shipped', 'partial', 'received'].includes(po.status) ? po.createdDate : null,
      done: ['approved', 'shipped', 'partial', 'received'].includes(po.status),
      icon: CheckCircle,
    },
    {
      label: 'Shipped',
      date: ['shipped', 'partial', 'received'].includes(po.status) ? po.expectedDate : null,
      done: ['shipped', 'partial', 'received'].includes(po.status),
      icon: Truck,
    },
    { label: 'Received', date: po.receivedDate, done: ['received', 'partial'].includes(po.status), icon: PackageCheck },
  ];

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Header */}
      <div className="flex flex-col flex-wrap justify-between gap-2.5 md:flex-row md:items-center">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setPage('purchaseOrders')} />
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-[14px] md:size-12"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            }}
          >
            <FileText size={bp === 'sm' ? 20 : 24} className="text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-text m-0 text-[17px] font-bold sm:text-[19px] md:text-[22px]">{po.id}</h2>
              <StatusBadge status={po.status} />
            </div>
            <div className="text-text-muted mt-0.5 text-[11px] md:text-[13px]">
              {po.supplierName} · {po.createdBy} · {formatDate(po.createdDate)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Printer} onClick={() => setShowPreview(true)}>
            Preview & Print
          </Button>
          {canReceive && (
            <Button variant="primary" icon={PackageCheck} onClick={() => setShowReceive(true)}>
              Receive Goods
            </Button>
          )}
          {canApprove && (
            <Button variant="success" icon={CheckCircle} onClick={() => updatePOStatus('approved')}>
              Approve
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" icon={X} onClick={() => updatePOStatus('cancelled')}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[
          {
            label: 'Order Value',
            value: `GH₵ ${poTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            color: COLORS.primary,
          },
          { label: 'Line Items', value: po.items.length, color: COLORS.accent },
          { label: 'Total Units', value: po.items.reduce((a, li) => a + li.qty, 0), color: COLORS.text },
          {
            label: 'Received Value',
            value: `GH₵ ${receivedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            color: COLORS.success,
          },
          {
            label: 'Outstanding',
            value: `GH₵ ${(poTotal - receivedTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            color: poTotal - receivedTotal > 0 ? COLORS.warning : COLORS.success,
          },
        ].map((k, i) => (
          <Card key={i} className="p-4 text-center">
            <div className="text-text-muted mb-1 text-[11px]">{k.label}</div>
            <div className="text-lg font-bold" style={{ color: k.color }}>
              {k.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
        {/* Left: Line Items */}
        <div className="flex flex-col gap-3 md:gap-4">
          <Card className="overflow-hidden p-0">
            <div className="border-border flex items-center gap-2.5 border-b px-5 py-4">
              <Box size={18} className="text-primary" />
              <span className="text-text text-[15px] font-semibold">Line Items</span>
              <Badge color="primary">{po.items.length}</Badge>
            </div>
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-border border-b">
                  {['Product', 'Unit Cost', 'Ordered', 'Received', 'Line Total', 'Status'].map((h) => (
                    <th key={h} className="form-label px-4 py-3 text-left font-semibold tracking-[0.5px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {po.items.map((li) => {
                  const pct = li.qty > 0 ? ((li.receivedQty || 0) / li.qty) * 100 : 0;
                  return (
                    <tr key={li.productId} className="border-border border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[20px]">{li.image}</span>
                          <div>
                            <div className="text-text text-[13px] font-semibold">{li.name}</div>
                            <div className="text-text-dim text-[11px]">
                              {li.productId} · {li.unit}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-text-muted px-4 py-3 text-[13px]">GH₵ {li.unitCost.toFixed(2)}</td>
                      <td className="text-text px-4 py-3 text-sm font-bold">{li.qty}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={clsx(
                              'text-sm font-bold',
                              pct >= 100 ? 'text-success' : pct > 0 ? 'text-warning' : 'text-text-dim',
                            )}
                          >
                            {li.receivedQty || 0}
                          </span>
                          <div className="bg-border h-1 w-10 overflow-hidden rounded-sm">
                            <div
                              className={clsx('h-full rounded-sm', pct >= 100 ? 'bg-success' : 'bg-warning')}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="text-accent px-4 py-3 text-sm font-bold">
                        GH₵ {(li.qty * li.unitCost).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {pct >= 100 ? (
                          <Badge color="success">Fulfilled</Badge>
                        ) : pct > 0 ? (
                          <Badge color="warning">Partial</Badge>
                        ) : (
                          <Badge color="neutral">Pending</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-border bg-bg flex items-center justify-between border-t px-5 py-3.5">
              <span className="text-text-muted text-xs">
                {po.items.length} items · {po.items.reduce((a, li) => a + li.qty, 0)} units ordered
              </span>
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-xs">Grand Total:</span>
                <span className="text-text text-[22px] font-bold">
                  GH₵ {poTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>

          {po.notes && (
            <Card>
              <h3 className="text-text mt-0 mb-2.5 text-sm font-semibold">Notes</h3>
              <p className="text-text-muted m-0 text-[13px] leading-relaxed">{po.notes}</p>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Supplier Card */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Supplier</h3>
            {supplier && (
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: Building2, label: 'Company', value: supplier.name },
                  { icon: User, label: 'Contact', value: supplier.contact },
                  { icon: Phone, label: 'Phone', value: supplier.phone },
                  { icon: Mail, label: 'Email', value: supplier.email },
                  { icon: MapPin, label: 'Location', value: supplier.location },
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
            )}
          </Card>

          {/* Delivery Info */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Delivery Details</h3>
            <div className="flex flex-col gap-2">
              {[
                { l: 'Location', v: po.location },
                { l: 'Expected Date', v: po.expectedDate ? formatDate(po.expectedDate) : 'Not set' },
                { l: 'Received Date', v: po.receivedDate ? formatDate(po.receivedDate) : '\u2014' },
                { l: 'Payment Terms', v: paymentLabel },
                { l: 'Created By', v: po.createdBy },
              ].map((r, i) => (
                <div key={i} className="border-border flex justify-between border-b py-1.5">
                  <span className="text-text-dim text-xs">{r.l}</span>
                  <span className="text-text text-xs font-semibold">{r.v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Order Timeline</h3>
            <div className="flex flex-col gap-0">
              {timeline.map((step, i) => (
                <div key={i} className={clsx('relative flex gap-3', i < timeline.length - 1 ? 'pb-4' : 'pb-0')}>
                  {i < timeline.length - 1 && (
                    <div
                      className={clsx(
                        'absolute top-6 left-[11px] h-[calc(100%-8px)] w-0.5',
                        step.done && timeline[i + 1]?.done ? 'bg-success' : 'bg-border',
                      )}
                    />
                  )}
                  <div
                    className={clsx(
                      'z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                      step.done ? 'bg-success-bg' : 'bg-surface-alt',
                    )}
                    style={{
                      border: `2px solid ${step.done ? COLORS.success : COLORS.border}`,
                    }}
                  >
                    <step.icon size={10} className={step.done ? 'text-success' : 'text-text-dim'} />
                  </div>
                  <div>
                    <div
                      className={clsx('text-xs', step.done ? 'text-text font-semibold' : 'text-text-dim font-normal')}
                    >
                      {step.label}
                    </div>
                    {step.date && <div className="text-text-dim mt-px text-[10px]">{formatDate(step.date)}</div>}
                  </div>
                </div>
              ))}
              {po.status === 'cancelled' && (
                <div className="flex gap-3 pt-2">
                  <div className="bg-danger-bg border-danger flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2">
                    <X size={10} className="text-danger" />
                  </div>
                  <div className="text-danger text-xs font-semibold">Cancelled</div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-text mt-0 mb-3.5 text-sm font-semibold">Quick Actions</h3>
            <div className="flex flex-col gap-1.5">
              <Button
                variant="secondary"
                icon={Printer}
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowPreview(true)}
              >
                Preview & Print PO
              </Button>
              {canReceive && (
                <Button
                  variant="accent"
                  icon={PackageCheck}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowReceive(true)}
                >
                  Receive Goods
                </Button>
              )}
              <Button variant="secondary" icon={Copy} size="sm" className="w-full justify-start">
                Duplicate PO
              </Button>
              <Button variant="secondary" icon={Mail} size="sm" className="w-full justify-start">
                Email to Supplier
              </Button>
              <Button variant="secondary" icon={Download} size="sm" className="w-full justify-start">
                Export PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* PO PREVIEW / PRINT MODAL */}
      {showPreview && (
        <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center">
          <div
            onClick={() => setShowPreview(false)}
            className="absolute inset-0 backdrop-blur-[4px]"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          />
          <div
            className="bg-surface border-border relative flex w-full max-w-full flex-col overflow-hidden border sm:w-[94%] sm:rounded-[18px] md:w-[760px]"
            style={{
              maxHeight: bp === 'sm' ? '100vh' : '94vh',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              animation: 'modalIn 0.25s ease',
            }}
          >
            {printSent && (
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
                  <Printer size={28} className="text-success" />
                </div>
                <div className="text-success text-base font-bold">Sending to Printer</div>
              </div>
            )}

            {/* Header */}
            <div className="border-border flex shrink-0 items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2.5">
                <FileText size={20} className="text-primary" />
                <span className="text-text text-base font-bold">Purchase Order Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" icon={Printer} size="sm" onClick={handlePrint}>
                  Print
                </Button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="bg-surface-alt border-border text-text-muted flex h-8 w-8 items-center justify-center rounded-lg border"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Document */}
            <div className="flex-1 overflow-auto p-3 sm:p-5 md:p-6">
              <div className="min-h-[700px] rounded-lg bg-white p-4 text-[#1a1a2e] sm:p-7 md:p-10">
                {/* Company Header */}
                <div className="mb-7 flex flex-col justify-between gap-3 border-b-[3px] border-[#6C5CE7] pb-5 sm:flex-row sm:gap-0">
                  <div>
                    <div className="text-2xl font-extrabold tracking-[-0.5px] text-[#6C5CE7]">ShopChain</div>
                    <div className="text-[10px] tracking-[2px] text-[#888] uppercase">Supply Chain Management</div>
                    <div className="mt-1.5 text-[11px] leading-[1.6] text-[#666]">
                      15 Oxford Street, Osu, Accra
                      <br />
                      Ghana · +233 30 277 8800
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-[#1a1a2e]">PURCHASE ORDER</div>
                    <div className="mt-1 text-lg font-bold text-[#6C5CE7]">{po.id}</div>
                    <div className="mt-1 text-[11px] text-[#888]">Date: {formatDate(po.createdDate)}</div>
                    <div className="text-[11px] text-[#888]">
                      Expected: {po.expectedDate ? formatDate(po.expectedDate) : 'TBD'}
                    </div>
                  </div>
                </div>

                {/* Supplier Address Block */}
                <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#eee] bg-[#f8f8ff] p-4">
                    <div className="mb-1.5 text-[9px] tracking-[1px] text-[#999] uppercase">Ship To</div>
                    <div className="text-[13px] font-bold text-[#1a1a2e]">{po.location}</div>
                    <div className="mt-0.5 text-[11px] text-[#666]">ShopChain Inventory</div>
                  </div>
                  <div className="rounded-lg border border-[#eee] bg-[#f8f8ff] p-4">
                    <div className="mb-1.5 text-[9px] tracking-[1px] text-[#999] uppercase">Supplier</div>
                    <div className="text-[13px] font-bold text-[#1a1a2e]">{po.supplierName}</div>
                    {supplier && (
                      <div className="mt-0.5 text-[11px] text-[#666]">
                        {supplier.contact} · {supplier.phone}
                        <br />
                        {supplier.location}
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="mb-5 w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="bg-[#6C5CE7]">
                      {['#', 'Product', 'SKU', 'Unit', 'Qty', 'Unit Cost (GH₵)', 'Total (GH₵)'].map((h) => (
                        <th key={h} className="form-label px-3 py-2.5 text-left tracking-[0.5px] text-white">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map((li, i) => (
                      <tr
                        key={li.productId}
                        className={clsx('border-b border-[#eee]', i % 2 === 0 ? 'bg-white' : 'bg-[#fafafe]')}
                      >
                        <td className="px-3 py-2.5 text-xs text-[#888]">{i + 1}</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-[#1a1a2e]">{li.name}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-[#888]">{li.productId}</td>
                        <td className="px-3 py-2.5 text-[11px] text-[#666]">{li.unit}</td>
                        <td className="px-3 py-2.5 text-center text-[13px] font-bold text-[#1a1a2e]">{li.qty}</td>
                        <td className="px-3 py-2.5 text-right text-xs text-[#444]">{li.unitCost.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right text-[13px] font-bold text-[#1a1a2e]">
                          {(li.qty * li.unitCost).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mb-7 flex justify-end">
                  <div className="w-[260px]">
                    {[
                      { l: 'Subtotal', v: poTotal.toFixed(2) },
                      { l: 'Tax (0%)', v: '0.00' },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between border-b border-[#eee] py-1.5">
                        <span className="text-xs text-[#666]">{r.l}</span>
                        <span className="text-xs font-medium text-[#333]">GH₵ {r.v}</span>
                      </div>
                    ))}
                    <div className="mt-1 flex justify-between py-2.5">
                      <span className="text-sm font-bold text-[#1a1a2e]">Grand Total</span>
                      <span className="text-lg font-extrabold text-[#6C5CE7]">
                        GH₵ {poTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms & Signatures */}
                <div className="grid grid-cols-1 gap-8 border-t border-[#eee] pt-5 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 text-[10px] tracking-[1px] text-[#999] uppercase">Terms & Conditions</div>
                    <div className="text-[10px] leading-[1.7] text-[#888]">
                      Payment: {paymentLabel}
                      <br />
                      Delivery to: {po.location}
                      <br />
                      All goods subject to quality inspection upon receipt.
                      <br />
                      Damaged or defective items will be returned at supplier cost.
                    </div>
                  </div>
                  <div>
                    <div className="mb-6 text-[10px] tracking-[1px] text-[#999] uppercase">Authorized Signatures</div>
                    <div className="flex gap-7">
                      <div className="flex-1">
                        <div className="mb-1 h-8 border-b border-[#ccc]" />
                        <div className="text-[9px] text-[#999]">Prepared By</div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 h-8 border-b border-[#ccc]" />
                        <div className="text-[9px] text-[#999]">Approved By</div>
                      </div>
                    </div>
                  </div>
                </div>

                {po.notes && (
                  <div className="mt-4 rounded-[6px] border border-[#eee] bg-[#fffff0] px-3.5 py-2.5">
                    <div className="mb-1 text-[9px] tracking-[1px] text-[#999] uppercase">Notes</div>
                    <div className="text-[11px] text-[#666]">{po.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE PO MODAL */}
      {showReceive && (
        <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center">
          <div
            onClick={() => setShowReceive(false)}
            className="absolute inset-0 backdrop-blur-[4px]"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          />
          <div
            className="bg-surface border-border relative flex w-full max-w-full flex-col overflow-hidden border sm:w-[94%] sm:rounded-[18px] md:w-[780px]"
            style={{
              maxHeight: bp === 'sm' ? '100vh' : '92vh',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              animation: 'modalIn 0.25s ease',
            }}
          >
            {receiveSubmitted && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[17px] backdrop-blur-[6px]"
                style={{
                  background: 'rgba(15,17,23,0.92)',
                }}
              >
                <div
                  className="bg-success-bg border-success mb-3.5 flex h-16 w-16 items-center justify-center rounded-full border-2"
                  style={{
                    animation: 'modalIn 0.3s ease',
                  }}
                >
                  <PackageCheck size={32} className="text-success" />
                </div>
                <div className="text-success text-lg font-bold">Goods Received</div>
                <div className="text-text-muted mt-1 text-xs">
                  {receiveItems.reduce((a, r) => a + r.receivingQty, 0)} units received · Stock levels updated
                </div>
              </div>
            )}

            {/* Header */}
            <div className="border-border flex shrink-0 items-center justify-between border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.success}, ${COLORS.accent})`,
                  }}
                >
                  <PackageCheck size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-text m-0 text-base font-bold">Receive Goods — {po.id}</h2>
                  <div className="text-text-muted mt-0.5 text-xs">
                    From {po.supplierName} · Delivering to {po.location}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceive(false)}
                className="bg-surface-alt border-border text-text-muted flex h-8 w-8 items-center justify-center rounded-lg border"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-5">
              {/* Summary banner */}
              <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                <div className="bg-surface-alt rounded-[10px] px-3.5 py-3 text-center">
                  <div className="text-text-dim text-[10px]">Ordered</div>
                  <div className="text-text text-[20px] font-bold">
                    {po.items.reduce((a, li) => a + li.qty, 0)}{' '}
                    <span className="text-text-dim text-[11px] font-normal">units</span>
                  </div>
                </div>
                <div className="bg-surface-alt rounded-[10px] px-3.5 py-3 text-center">
                  <div className="text-text-dim text-[10px]">Previously Received</div>
                  <div className="text-success text-[20px] font-bold">
                    {po.items.reduce((a, li) => a + (li.receivedQty || 0), 0)}{' '}
                    <span className="text-text-dim text-[11px] font-normal">units</span>
                  </div>
                </div>
                <div className="border-primary/[0.20] bg-primary-bg rounded-[10px] border px-3.5 py-3 text-center">
                  <div className="text-text-dim text-[10px]">Receiving Now</div>
                  <div className="text-primary-light text-[20px] font-bold">
                    {receiveItems.reduce((a, r) => a + r.receivingQty, 0)}{' '}
                    <span className="text-text-dim text-[11px] font-normal">units</span>
                  </div>
                </div>
              </div>

              {/* Per-item receiving table */}
              <div className="bg-surface-alt border-border overflow-hidden rounded-xl border">
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="border-border border-b">
                      {[
                        'Product',
                        'Ordered',
                        'Prev. Received',
                        'Remaining',
                        'Receiving Now',
                        'Batch #',
                        'Condition',
                        'Expiry Date',
                        'Batch Mode',
                      ].map((h) => (
                        <th key={h} className="form-label px-3.5 py-3 text-left font-semibold tracking-[0.5px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {receiveItems.map((ri, idx) => {
                      const remaining = ri.qty - (ri.receivedQty || 0);
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
                            <td className="text-text px-3.5 py-3 text-sm font-bold">{ri.qty}</td>
                            <td className="text-success px-3.5 py-3 text-[13px] font-semibold">
                              {ri.receivedQty || 0}
                            </td>
                            <td
                              className={clsx(
                                'px-3.5 py-3 text-[13px] font-bold',
                                remaining > 0 ? 'text-warning' : 'text-success',
                              )}
                            >
                              {remaining}
                            </td>
                            <td className="px-3.5 py-3">
                              <input
                                type="number"
                                value={ri.receivingQty}
                                min="0"
                                max={remaining}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(remaining, parseInt(e.target.value) || 0));
                                  setReceiveItems((prev) =>
                                    prev.map((r, i) => {
                                      if (i !== idx) return r;
                                      const updated = { ...r, receivingQty: val };
                                      if (
                                        r.batchMode === 'multiple' &&
                                        r.receiveBatches.length === 1 &&
                                        r.receiveBatches[0]
                                      ) {
                                        updated.receiveBatches = [{ ...r.receiveBatches[0], quantity: val }];
                                      }
                                      return updated;
                                    }),
                                  );
                                }}
                                className="text-text bg-bg border-border w-[72px] rounded-lg border px-2 py-[7px] text-center font-[inherit] text-sm font-bold outline-none"
                              />
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
                                  className="text-text bg-bg border-border w-[120px] rounded-lg border px-2 py-1.5 font-mono text-[11px] font-semibold outline-none"
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
                                  className="text-text bg-bg border-border cursor-pointer rounded-lg border px-2.5 py-1.5 font-[inherit] text-[11px] font-medium outline-none"
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
                                  className="text-text bg-bg border-border rounded-lg border px-2 py-1.5 font-[inherit] text-[11px] outline-none"
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
                                              quantity: r.receivingQty,
                                              expiryDate: r.expiryDate,
                                              condition: r.condition,
                                              notes: '',
                                            },
                                          ],
                                        };
                                      }
                                      return { ...r, batchMode: mode };
                                    }),
                                  )
                                }
                                className="text-text bg-bg border-border cursor-pointer rounded-lg border px-2.5 py-1.5 font-[inherit] text-[11px] font-medium outline-none"
                              >
                                <option value="single">Single</option>
                                <option value="multiple">Split Batches</option>
                              </select>
                            </td>
                          </tr>
                          {/* Batch split sub-rows */}
                          {ri.batchMode === 'multiple' && (
                            <tr className="border-border border-b">
                              <td colSpan={9} className="px-3.5 pt-0 pb-3.5">
                                <div className="bg-bg border-primary/[0.20] rounded-[10px] border p-3">
                                  <div className="mb-2.5 flex items-center justify-between">
                                    <span className="text-primary-light text-[11px] font-semibold">
                                      Batch Details — {ri.receiveBatches.length} batch
                                      {ri.receiveBatches.length !== 1 ? 'es' : ''}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={clsx(
                                          'text-[11px] font-semibold',
                                          batchAllocated === ri.receivingQty ? 'text-success' : 'text-warning',
                                        )}
                                      >
                                        {batchAllocated} / {ri.receivingQty} allocated
                                      </span>
                                      {batchAllocated !== ri.receivingQty && (
                                        <span className="text-danger text-[10px]">
                                          ({ri.receivingQty - batchAllocated} remaining)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {ri.receiveBatches.map((rb, bIdx) => (
                                    <div
                                      key={bIdx}
                                      className="mb-2 grid items-center gap-2"
                                      style={{
                                        gridTemplateColumns: '1fr 80px 1fr 1fr 1fr 32px',
                                      }}
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
                                  <div
                                    className="mt-1.5 grid gap-2"
                                    style={{
                                      gridTemplateColumns: '1fr 80px 1fr 1fr 1fr 32px',
                                    }}
                                  >
                                    <span className="text-text-dim text-[10px]">Batch #</span>
                                    <span className="text-text-dim text-center text-[10px]">Qty</span>
                                    <span className="text-text-dim text-[10px]">Expiry</span>
                                    <span className="text-text-dim text-[10px]">Condition</span>
                                    <span className="text-text-dim text-[10px]">Notes</span>
                                    <span />
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

              {/* Quick fill */}
              <div className="mt-3 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setReceiveItems((prev) => prev.map((r) => ({ ...r, receivingQty: r.qty - (r.receivedQty || 0) })))
                  }
                >
                  Fill All Remaining
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReceiveItems((prev) => prev.map((r) => ({ ...r, receivingQty: 0 })))}
                >
                  Clear All
                </Button>
              </div>

              <div className="mt-4">
                <label className="text-text-muted mb-1.5 block text-xs font-medium">Receiving Notes</label>
                <textarea
                  placeholder="Condition notes, discrepancies, damage descriptions..."
                  rows={2}
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="bg-surface-alt border-border text-text box-border w-full resize-y rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-border bg-bg flex shrink-0 items-center justify-between border-t px-6 py-3.5">
              <div className="text-text-muted text-xs">
                Receiving{' '}
                <span className="text-text font-bold">{receiveItems.reduce((a, r) => a + r.receivingQty, 0)}</span>{' '}
                units · Value:{' '}
                <span className="text-text font-bold">
                  GH₵{' '}
                  {receiveItems
                    .reduce((a, r) => a + r.receivingQty * r.unitCost, 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowReceive(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={PackageCheck}
                  onClick={handleReceive}
                  disabled={receiveItems.every((r) => r.receivingQty === 0)}
                >
                  Confirm Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
