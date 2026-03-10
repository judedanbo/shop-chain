export type KitchenOrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'served'
  | 'returned'
  | 'cancelled';

export type OrderType = 'dine_in' | 'takeaway';

export interface KitchenOrderItem {
  productId: string;
  name: string;
  qty: number;
  notes?: string;
  itemStatus?: 'pending' | 'served';
  servedAt?: string;
}

export interface KitchenOrder {
  id: string;
  tillName: string;
  tillId: string;
  table?: string;
  orderType: OrderType;
  items: KitchenOrderItem[];
  status: KitchenOrderStatus;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  serverName?: string;
  total?: number;
  barFulfilled?: boolean;
  servedAt?: string;
  returnedAt?: string;
  returnReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export interface HeldOrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorder: number;
  unit: string;
  status: string;
  location: string;
  image: string;
  qty: number;
  notes?: string;
  barcode?: string;
  supplier?: string;
}

export interface HeldOrder {
  id: string;
  tillId: string;
  items: HeldOrderItem[];
  table: string;
  orderType: OrderType;
  heldAt: string;
  label?: string;
}

export type TillPaymentMethod = 'cash' | 'card' | 'momo';

export interface TillPayment {
  id: string;
  orderId: string;
  amount: number;
  method: TillPaymentMethod;
  paidAt: string;
  /** Cash-specific */
  amountTendered?: number;
  change?: number;
  /** Card-specific */
  cardType?: string;
  cardTransNo?: string;
  /** MoMo-specific */
  momoProvider?: string;
  momoPhone?: string;
  momoTransId?: string;
}

export interface Till {
  id: string;
  name: string;
  openedAt: string;
  openedBy: string;
  isActive: boolean;
  orderCount: number;
  /** Total number of payments processed on this till */
  totalPayments: number;
  /** Running sum of all payment amounts on this till */
  totalPaymentAmount: number;
  /** Individual payment records */
  payments: TillPayment[];
  closedAt?: string;
  discount?: number;
  discountType?: 'percent' | 'fixed';
  discountInput?: number;
}
