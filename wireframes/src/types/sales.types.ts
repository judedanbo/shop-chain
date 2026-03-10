export type SaleStatus = 'completed' | 'reversed' | 'pending_reversal';

export interface SaleItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface SaleSplit {
  method: string;
  label: string;
  amount: number;
  detail?: string;
}

export interface SaleRecord {
  id: string;
  date: string;
  items: SaleItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  discount: number;
  discountType?: 'percent' | 'fixed';
  discountInput?: number;
  total: number;
  paymentMethod: string;
  payLabel: string;
  cashier: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  amountTendered?: number;
  change?: number;
  cardType?: string;
  cardTransNo?: string;
  momoProvider?: string;
  momoPhone?: string;
  momoRef?: string;
  splits?: SaleSplit[];
  // Verification
  verifyToken?: string;
  // Reversal tracking
  status: SaleStatus;
  source?: 'pos' | 'bar';
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
  reversalRequestedBy?: string;
  reversalRequestedAt?: string;
}
