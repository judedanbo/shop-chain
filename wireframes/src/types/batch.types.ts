export type BatchStatus = 'active' | 'expired' | 'depleted';

export interface Batch {
  id: string; // "BT-xxx"
  batchNumber: string; // User-facing lot number "LOT-2026-0045"
  productId: string;
  quantity: number;
  initialQuantity: number;
  expiryDate?: string; // ISO date, optional for non-perishables
  receivedDate: string;
  sourcePoId?: string;
  location: string;
  status: BatchStatus;
  notes?: string;
}
