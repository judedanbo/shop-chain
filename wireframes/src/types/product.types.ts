export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type ExpiryStatus = 'fresh' | 'expiring_soon' | 'expired' | 'no_expiry';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorder: number;
  unit: string;
  status: ProductStatus;
  location: string;
  image: string;
  barcode?: string;
  supplier?: string;
  description?: string;
  lastUpdated?: string;
  expiryDate?: string;
  batches?: import('./batch.types').Batch[];
  batchTracking?: boolean;
  skipKitchen?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  status: string;
  productCount?: number;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  type: string;
  description: string;
  status: string;
}

export interface StockAdjustment {
  id: string;
  product: string;
  type: string;
  qty: number;
  date: string;
  by: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface StockTransfer {
  id: string;
  product: string;
  qty: number;
  from: string;
  to: string;
  date: string;
  status: 'in_transit' | 'completed' | 'cancelled';
  by: string;
}
