import type { Batch, BatchStatus } from '@/types/batch.types';
import type { Product, ProductStatus } from '@/types/product.types';
import { getExpiryStatus } from './formatters';

let batchCounter = 100;

/** Generate a unique batch ID */
export function generateBatchId(): string {
  return `BT-${String(++batchCounter).padStart(3, '0')}`;
}

/** Compute batch status from quantity and expiry */
export function computeBatchStatus(batch: Pick<Batch, 'quantity' | 'expiryDate'>): BatchStatus {
  if (batch.quantity <= 0) return 'depleted';
  if (batch.expiryDate && getExpiryStatus(batch.expiryDate) === 'expired') return 'expired';
  return 'active';
}

/** Sum quantities across batches */
export function computeStockFromBatches(batches: Batch[]): number {
  return batches.reduce((sum, b) => sum + b.quantity, 0);
}

/** Find the earliest expiry date among active (non-depleted) batches */
export function computeEarliestExpiry(batches: Batch[]): string | undefined {
  const activeBatches = batches.filter((b) => b.quantity > 0 && b.expiryDate);
  if (activeBatches.length === 0) return undefined;
  return activeBatches.map((b) => b.expiryDate!).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

/** Sort batches FEFO: active first, then by expiry date ascending */
export function sortBatchesFEFO(batches: Batch[]): Batch[] {
  return [...batches].sort((a, b) => {
    // Active batches first
    const statusOrder: Record<BatchStatus, number> = { active: 0, expired: 1, depleted: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    // Then by expiry date ascending (earliest first)
    if (a.expiryDate && b.expiryDate) {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    if (a.expiryDate) return -1;
    if (b.expiryDate) return 1;
    return 0;
  });
}

/** Recompute product stock, expiryDate, and status from its batches */
export function updateProductFromBatches(product: Product): Partial<Product> {
  const batches = product.batches;
  if (!batches || batches.length === 0) return {};

  // Recompute batch statuses
  const updatedBatches = batches.map((b) => ({
    ...b,
    status: computeBatchStatus(b),
  }));

  const stock = computeStockFromBatches(updatedBatches);
  const expiryDate = computeEarliestExpiry(updatedBatches);

  let status: ProductStatus = 'in_stock';
  if (stock <= 0) status = 'out_of_stock';
  else if (stock <= product.reorder) status = 'low_stock';

  return {
    stock,
    expiryDate,
    status,
    batches: updatedBatches,
    batchTracking: true,
  };
}

/** Check if a product uses batch tracking (type guard narrows batches to non-empty array) */
export function isBatchTracked(product: Product): product is Product & { batches: Batch[] } {
  return !!product.batchTracking && Array.isArray(product.batches) && product.batches.length > 0;
}

/** Create a new Batch from input data */
export function createBatch(
  productId: string,
  input: {
    batchNumber: string;
    quantity: number;
    expiryDate?: string;
    condition?: string;
    notes?: string;
    sourcePoId?: string;
    location?: string;
  },
  receivedDate: string,
): Batch {
  const batch: Batch = {
    id: generateBatchId(),
    batchNumber: input.batchNumber,
    productId,
    quantity: input.quantity,
    initialQuantity: input.quantity,
    expiryDate: input.expiryDate || undefined,
    receivedDate,
    sourcePoId: input.sourcePoId,
    location: input.location || 'Main Store',
    status: 'active',
    notes: input.notes,
  };
  batch.status = computeBatchStatus(batch);
  return batch;
}

/** Generate a sequential lot number */
export function generateLotNumber(index: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const seq = String(index).padStart(4, '0');
  return `LOT-${year}-${seq}`;
}
