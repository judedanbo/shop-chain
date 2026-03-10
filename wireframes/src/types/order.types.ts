export type POStatus = 'draft' | 'pending' | 'approved' | 'shipped' | 'partial' | 'received' | 'cancelled';

export type PaymentTerms = 'cod' | 'net15' | 'net30' | 'net60';

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  qty: number;
  unitCost: number;
  receivedQty: number;
  image: string;
  unit: string;
  expiryDate?: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: number;
  supplierName: string;
  status: POStatus;
  createdDate: string;
  expectedDate: string | null;
  receivedDate: string | null;
  location: string;
  paymentTerms: PaymentTerms;
  notes: string;
  createdBy: string;
  items: PurchaseOrderItem[];
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  location: string;
  products: number;
  rating: number;
  status: 'active' | 'inactive';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'regular' | 'wholesale' | 'walk-in';
  totalSpent: number;
  visits: number;
  lastVisit: string | null;
  notes?: string;
  createdAt: string;
  loyaltyPts: number;
}
