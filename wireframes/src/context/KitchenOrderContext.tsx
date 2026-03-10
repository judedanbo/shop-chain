import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type {
  KitchenOrder,
  KitchenOrderItem,
  Till,
  TillPayment,
  OrderType,
  HeldOrder,
  HeldOrderItem,
} from '@/types/kitchen.types';
import type { SaleRecord, SaleItem } from '@/types/sales.types';
import { useToast } from './ToastContext';

// ─── Context value interface ───

interface PlaceOrderParams {
  tillId: string;
  tillName: string;
  table?: string;
  orderType: OrderType;
  items: KitchenOrderItem[];
  serverName?: string;
  total?: number;
  barItems?: KitchenOrderItem[];
  barTotal?: number;
}

interface HoldOrderParams {
  tillId: string;
  items: HeldOrderItem[];
  table: string;
  orderType: OrderType;
  label?: string;
}

interface RecordPaymentParams {
  tillId: string;
  orderId: string;
  amount: number;
  method: 'cash' | 'card' | 'momo';
  amountTendered?: number;
  change?: number;
  cardType?: string;
  cardTransNo?: string;
  momoProvider?: string;
  momoPhone?: string;
  momoTransId?: string;
}

interface RecordBulkPaymentParams {
  tillId: string;
  orderPayments: Array<{ orderId: string; amount: number }>;
  totalAmount: number;
  method: 'cash' | 'card' | 'momo';
  amountTendered?: number;
  change?: number;
  cardType?: string;
  cardTransNo?: string;
  momoProvider?: string;
  momoPhone?: string;
  momoTransId?: string;
}

interface RecordTillPaymentParams {
  tillId: string;
  amount: number;
  method: 'cash' | 'card' | 'momo';
  amountTendered?: number;
  change?: number;
  cardType?: string;
  cardTransNo?: string;
  momoProvider?: string;
  momoPhone?: string;
  momoTransId?: string;
}

interface KitchenOrderContextValue {
  // Tills
  tills: Till[];
  openTill: (name: string, openedBy: string) => Till;
  closeTill: (id: string) => void;
  recordPayment: (params: RecordPaymentParams) => void;
  recordBulkPayment: (params: RecordBulkPaymentParams) => void;
  recordTillPayment: (params: RecordTillPaymentParams) => void;

  // Orders
  orders: KitchenOrder[];
  placeOrder: (params: PlaceOrderParams) => KitchenOrder;
  acceptOrder: (id: string) => void;
  rejectOrder: (id: string, reason: string) => void;
  completeOrder: (id: string) => void;
  serveOrder: (id: string) => void;
  returnOrder: (id: string, reason: string) => void;
  cancelOrder: (id: string, cancelledBy: string) => void;
  serveOrderItem: (orderId: string, productId: string) => void;

  // Held orders
  heldOrders: HeldOrder[];
  holdOrder: (params: HoldOrderParams) => HeldOrder;
  resumeOrder: (id: string) => HeldOrder | null;
  discardHeldOrder: (id: string) => void;

  // Notifications
  unseenUpdates: Record<string, number>;
  markOrdersSeen: (tillId: string) => void;

  // Helpers
  getOrdersForTill: (tillId: string) => KitchenOrder[];
  getPendingOrders: () => KitchenOrder[];
  getActiveOrders: () => KitchenOrder[];
  getHeldOrdersForTill: (tillId: string) => HeldOrder[];
  getKitchenNotificationsForTill: (tillId: string) => KitchenNotification[];
}

export interface KitchenNotification {
  id: string;
  orderId: string;
  type: 'accepted' | 'rejected' | 'completed' | 'returned';
  message: string;
  timestamp: string;
  read: boolean;
}

const KitchenOrderContext = createContext<KitchenOrderContextValue | null>(null);

// ─── ID generators (timestamp-based to avoid HMR collisions) ───

function generateTillId(): string {
  return `TILL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `KO-${date}-${Date.now().toString(36).slice(-4)}`;
}

function generateHeldOrderId(): string {
  return `HOLD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Seed data ───

const SEED_TILLS: Till[] = [
  {
    id: 'TILL-SEED-001',
    name: 'Bar Till 1',
    openedAt: new Date(Date.now() - 3600000).toISOString(),
    openedBy: 'Ama K.',
    isActive: true,
    orderCount: 3,
    totalPayments: 1,
    totalPaymentAmount: 95.0,
    payments: [
      {
        id: 'PAY-SEED-001',
        orderId: 'KO-SEED-0006',
        amount: 95.0,
        method: 'cash',
        paidAt: new Date(Date.now() - 2400000).toISOString(),
        amountTendered: 100,
        change: 5,
      },
    ],
  },
  {
    id: 'TILL-SEED-002',
    name: 'Patio Register',
    openedAt: new Date(Date.now() - 7200000).toISOString(),
    openedBy: 'Kwame B.',
    isActive: true,
    orderCount: 2,
    totalPayments: 0,
    totalPaymentAmount: 0,
    payments: [],
  },
];

const SEED_ORDERS: KitchenOrder[] = [
  {
    id: 'KO-SEED-0001',
    tillId: 'TILL-SEED-001',
    tillName: 'Bar Till 1',
    table: 'Table 3',
    orderType: 'dine_in',
    items: [
      { productId: 'SKU-001', name: 'Premium Basmati Rice', qty: 2 },
      { productId: 'SKU-006', name: 'Titus Sardines (125g)', qty: 3, notes: 'Extra crispy' },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 480000).toISOString(),
    serverName: 'Ama K.',
    total: 236.0,
  },
  {
    id: 'KO-SEED-0002',
    tillId: 'TILL-SEED-001',
    tillName: 'Bar Till 1',
    table: 'Bar Seat 7',
    orderType: 'dine_in',
    items: [
      { productId: 'SKU-003', name: 'Nestle Milo (400g)', qty: 2 },
      { productId: 'SKU-005', name: 'Golden Penny Spaghetti', qty: 1, notes: 'No pepper' },
    ],
    status: 'accepted',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    acceptedAt: new Date(Date.now() - 720000).toISOString(),
    serverName: 'Ama K.',
    total: 83.0,
  },
  {
    id: 'KO-SEED-0003',
    tillId: 'TILL-SEED-002',
    tillName: 'Patio Register',
    orderType: 'takeaway',
    items: [
      { productId: 'SKU-007', name: 'Voltic Water (1.5L)', qty: 6 },
      { productId: 'SKU-001', name: 'Premium Basmati Rice', qty: 1 },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 180000).toISOString(),
    serverName: 'Kwame B.',
    total: 115.0,
  },
  {
    id: 'KO-SEED-0004',
    tillId: 'TILL-SEED-001',
    tillName: 'Bar Till 1',
    table: 'Table 1',
    orderType: 'dine_in',
    items: [{ productId: 'SKU-005', name: 'Golden Penny Spaghetti', qty: 3 }],
    status: 'completed',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    acceptedAt: new Date(Date.now() - 1500000).toISOString(),
    completedAt: new Date(Date.now() - 600000).toISOString(),
    serverName: 'Ama K.',
    total: 54.0,
  },
  {
    id: 'KO-SEED-0005',
    tillId: 'TILL-SEED-002',
    tillName: 'Patio Register',
    table: 'Patio 2',
    orderType: 'dine_in',
    items: [{ productId: 'SKU-002', name: 'Organic Palm Oil (5L)', qty: 1 }],
    status: 'rejected',
    createdAt: new Date(Date.now() - 2400000).toISOString(),
    rejectedAt: new Date(Date.now() - 2100000).toISOString(),
    rejectionReason: 'Item unavailable today',
    serverName: 'Kwame B.',
    total: 120.0,
  },
  {
    id: 'KO-SEED-0006',
    tillId: 'TILL-SEED-001',
    tillName: 'Bar Till 1',
    table: 'Table 5',
    orderType: 'dine_in',
    items: [
      { productId: 'SKU-003', name: 'Nestle Milo (400g)', qty: 1 },
      { productId: 'SKU-001', name: 'Premium Basmati Rice', qty: 1 },
    ],
    status: 'served',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    acceptedAt: new Date(Date.now() - 3300000).toISOString(),
    completedAt: new Date(Date.now() - 2700000).toISOString(),
    servedAt: new Date(Date.now() - 2400000).toISOString(),
    serverName: 'Ama K.',
    total: 95.0,
  },
  {
    id: 'KO-SEED-0007',
    tillId: 'TILL-SEED-002',
    tillName: 'Patio Register',
    table: 'Patio 4',
    orderType: 'dine_in',
    items: [{ productId: 'SKU-005', name: 'Golden Penny Spaghetti', qty: 2 }],
    status: 'returned',
    createdAt: new Date(Date.now() - 4200000).toISOString(),
    acceptedAt: new Date(Date.now() - 3900000).toISOString(),
    completedAt: new Date(Date.now() - 3300000).toISOString(),
    returnedAt: new Date(Date.now() - 3000000).toISOString(),
    returnReason: 'Wrong order',
    serverName: 'Kwame B.',
    total: 36.0,
  },
];

// ─── Provider ───

interface KitchenOrderProviderProps {
  children: ReactNode;
  onTillClose?: (sale: SaleRecord) => void;
}

export function KitchenOrderProvider({ children, onTillClose }: KitchenOrderProviderProps) {
  const { toast } = useToast();
  const [tills, setTills] = useState<Till[]>(SEED_TILLS);
  const [orders, setOrders] = useState<KitchenOrder[]>(SEED_ORDERS);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [unseenUpdates, setUnseenUpdates] = useState<Record<string, number>>({});
  const [kitchenNotifications, setKitchenNotifications] = useState<KitchenNotification[]>([]);

  const addKitchenNotification = useCallback(
    (orderId: string, tillId: string, type: KitchenNotification['type'], message: string) => {
      const notif: KitchenNotification = {
        id: `KN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        orderId,
        type,
        message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setKitchenNotifications((prev) => [
        { ...notif, _tillId: tillId } as KitchenNotification & { _tillId: string },
        ...prev,
      ]);
    },
    [],
  );

  const openTill = useCallback((name: string, openedBy: string): Till => {
    const newTill: Till = {
      id: generateTillId(),
      name,
      openedAt: new Date().toISOString(),
      openedBy,
      isActive: true,
      orderCount: 0,
      totalPayments: 0,
      totalPaymentAmount: 0,
      payments: [],
    };
    setTills((prev) => [...prev, newTill]);
    return newTill;
  }, []);

  const closeTill = useCallback(
    (id: string) => {
      // Build a SaleRecord from the till before closing
      const till = tills.find((t) => t.id === id);
      if (till && onTillClose) {
        const tillOrders = orders.filter((o) => o.tillId === id && o.status !== 'rejected' && o.status !== 'cancelled');

        // Aggregate items from all valid orders
        const itemMap = new Map<string, SaleItem>();
        for (const order of tillOrders) {
          for (const item of order.items) {
            const existing = itemMap.get(item.productId);
            if (existing) {
              existing.qty += item.qty;
            } else {
              // Derive per-item price from order total / total qty in that order
              const orderTotalQty = order.items.reduce((sum, i) => sum + i.qty, 0);
              const perItemPrice = order.total ? order.total / orderTotalQty : 0;
              itemMap.set(item.productId, {
                id: item.productId,
                name: item.name,
                qty: item.qty,
                price: Math.round(perItemPrice * 100) / 100,
              });
            }
          }
        }

        const saleItems = Array.from(itemMap.values());
        const subtotal = tillOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
        const discount = till.discount ?? 0;
        const total = subtotal - discount;

        // Determine payment method from till payments
        let paymentMethod = 'cash';
        let payLabel = 'Cash';
        if (till.payments.length > 0) {
          const methodCounts = new Map<string, number>();
          for (const p of till.payments) {
            methodCounts.set(p.method, (methodCounts.get(p.method) ?? 0) + 1);
          }
          if (methodCounts.size > 1) {
            paymentMethod = 'split';
            payLabel = 'Split';
          } else {
            const method = till.payments[0]!.method;
            paymentMethod = method;
            payLabel = method === 'cash' ? 'Cash' : method === 'card' ? 'Card' : 'MoMo';
          }
        }

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const tillSuffix = id.slice(-4);

        const saleRecord: SaleRecord = {
          id: `BAR-${dateStr}-${tillSuffix}`,
          date: now.toISOString(),
          items: saleItems,
          itemCount: saleItems.reduce((sum, i) => sum + i.qty, 0),
          subtotal,
          tax: 0,
          discount,
          discountType: till.discountType,
          discountInput: till.discountInput,
          total,
          paymentMethod,
          payLabel,
          cashier: till.openedBy,
          customerId: null,
          customerName: `Till: ${till.name}`,
          customerPhone: null,
          status: 'completed',
          source: 'bar',
        };

        onTillClose(saleRecord);
      }

      setTills((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: false, closedAt: new Date().toISOString() } : t)),
      );
    },
    [tills, orders, onTillClose],
  );

  const placeOrder = useCallback(
    (params: PlaceOrderParams): KitchenOrder => {
      const now = new Date().toISOString();
      const newOrders: KitchenOrder[] = [];

      // Bar-direct items: auto-completed, never shown on kitchen display
      if (params.barItems && params.barItems.length > 0) {
        const barOrder: KitchenOrder = {
          id: generateOrderId(),
          tillId: params.tillId,
          tillName: params.tillName,
          table: params.table,
          orderType: params.orderType,
          items: params.barItems.map((item) => ({ ...item, itemStatus: 'served' as const, servedAt: now })),
          status: 'completed',
          createdAt: now,
          completedAt: now,
          serverName: params.serverName,
          total: params.barTotal,
          barFulfilled: true,
        };
        newOrders.push(barOrder);
      }

      // Kitchen items: sent as pending
      let kitchenOrder: KitchenOrder | null = null;
      if (params.items.length > 0) {
        kitchenOrder = {
          id: generateOrderId(),
          tillId: params.tillId,
          tillName: params.tillName,
          table: params.table,
          orderType: params.orderType,
          items: params.items.map((item) => ({ ...item, itemStatus: 'pending' as const })),
          status: 'pending',
          createdAt: now,
          serverName: params.serverName,
          total: params.total,
        };
        newOrders.push(kitchenOrder);
      }

      if (newOrders.length > 0) {
        setOrders((prev) => [...prev, ...newOrders]);
        setTills((prev) => prev.map((t) => (t.id === params.tillId ? { ...t, orderCount: t.orderCount + 1 } : t)));
      }

      // Toast messages
      const hasKitchen = params.items.length > 0;
      const hasBar = params.barItems && params.barItems.length > 0;
      if (hasKitchen && hasBar) {
        toast.success(`Order sent to kitchen — drinks ready to serve`);
      } else if (hasKitchen) {
        toast.success(`Order ${kitchenOrder!.id} sent to kitchen`);
      } else if (hasBar) {
        toast.success(`Bar order complete — serve drinks now`);
      }

      return kitchenOrder ?? newOrders[0]!;
    },
    [toast],
  );

  const acceptOrder = useCallback(
    (id: string) => {
      setOrders((prev) => {
        const order = prev.find((o) => o.id === id);
        if (order) {
          toast.success(`Order ${id} accepted by kitchen`);
          setUnseenUpdates((u) => ({ ...u, [order.tillId]: (u[order.tillId] ?? 0) + 1 }));
          addKitchenNotification(
            id,
            order.tillId,
            'accepted',
            `Order ${id} has been accepted by the kitchen and is being prepared`,
          );
        }
        return prev.map((o) =>
          o.id === id ? { ...o, status: 'accepted' as const, acceptedAt: new Date().toISOString() } : o,
        );
      });
    },
    [toast, addKitchenNotification],
  );

  const rejectOrder = useCallback(
    (id: string, reason: string) => {
      setOrders((prev) => {
        const order = prev.find((o) => o.id === id);
        if (order) {
          toast.error(`Order ${id} rejected: ${reason}`);
          setUnseenUpdates((u) => ({ ...u, [order.tillId]: (u[order.tillId] ?? 0) + 1 }));
          addKitchenNotification(id, order.tillId, 'rejected', `Order ${id} was rejected by kitchen: ${reason}`);
        }
        return prev.map((o) => {
          if (o.id !== id) return o;
          return { ...o, status: 'rejected' as const, rejectedAt: new Date().toISOString(), rejectionReason: reason };
        });
      });
    },
    [toast, addKitchenNotification],
  );

  const completeOrder = useCallback(
    (id: string) => {
      setOrders((prev) => {
        const order = prev.find((o) => o.id === id);
        if (order) {
          setUnseenUpdates((u) => ({ ...u, [order.tillId]: (u[order.tillId] ?? 0) + 1 }));
          addKitchenNotification(id, order.tillId, 'completed', `Order ${id} is ready for pickup!`);
        }
        return prev.map((o) =>
          o.id === id ? { ...o, status: 'completed' as const, completedAt: new Date().toISOString() } : o,
        );
      });
      toast.success(`Order ${id} is ready for pickup!`);
    },
    [toast, addKitchenNotification],
  );

  const serveOrder = useCallback(
    (id: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: 'served' as const, servedAt: new Date().toISOString() } : o)),
      );
      toast.success(`Order ${id} marked as served`);
    },
    [toast],
  );

  const returnOrder = useCallback(
    (id: string, reason: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          return { ...o, status: 'returned' as const, returnedAt: new Date().toISOString(), returnReason: reason };
        }),
      );
      toast.error(`Order ${id} returned: ${reason}`);
    },
    [toast],
  );

  const cancelOrder = useCallback(
    (id: string, cancelledBy: string) => {
      setOrders((prev) => {
        const order = prev.find((o) => o.id === id);
        if (!order || order.status !== 'pending') return prev;
        return prev.map((o) => {
          if (o.id !== id) return o;
          return { ...o, status: 'cancelled' as const, cancelledAt: new Date().toISOString(), cancelledBy };
        });
      });
      toast.success(`Order ${id} cancelled`);
    },
    [toast],
  );

  const serveOrderItem = useCallback((orderId: string, productId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedItems = o.items.map((item) =>
          item.productId === productId && item.itemStatus !== 'served'
            ? { ...item, itemStatus: 'served' as const, servedAt: new Date().toISOString() }
            : item,
        );
        const allServed = updatedItems.every((item) => item.itemStatus === 'served');
        if (allServed && (o.status === 'completed' || o.status === 'accepted')) {
          return { ...o, items: updatedItems, status: 'served' as const, servedAt: new Date().toISOString() };
        }
        return { ...o, items: updatedItems };
      }),
    );
  }, []);

  const holdOrder = useCallback(
    (params: HoldOrderParams): HeldOrder => {
      const held: HeldOrder = {
        id: generateHeldOrderId(),
        tillId: params.tillId,
        items: params.items,
        table: params.table,
        orderType: params.orderType,
        heldAt: new Date().toISOString(),
        label: params.label,
      };
      setHeldOrders((prev) => [...prev, held]);
      toast.success(`Order held${params.label ? ` — ${params.label}` : ''}`);
      return held;
    },
    [toast],
  );

  const resumeOrder = useCallback(
    (id: string): HeldOrder | null => {
      let found: HeldOrder | null = null;
      setHeldOrders((prev) => {
        found = prev.find((h) => h.id === id) ?? null;
        return prev.filter((h) => h.id !== id);
      });
      if (found) toast.success(`Held order resumed`);
      return found;
    },
    [toast],
  );

  const discardHeldOrder = useCallback(
    (id: string) => {
      setHeldOrders((prev) => prev.filter((h) => h.id !== id));
      toast.success('Held order discarded');
    },
    [toast],
  );

  const getOrdersForTill = useCallback(
    (tillId: string) => {
      return orders.filter((o) => o.tillId === tillId);
    },
    [orders],
  );

  const getPendingOrders = useCallback(() => {
    return orders.filter((o) => o.status === 'pending');
  }, [orders]);

  const getActiveOrders = useCallback(() => {
    return orders.filter((o) => o.status === 'pending' || o.status === 'accepted');
  }, [orders]);

  const getHeldOrdersForTill = useCallback(
    (tillId: string) => {
      return heldOrders.filter((h) => h.tillId === tillId);
    },
    [heldOrders],
  );

  const getKitchenNotificationsForTill = useCallback(
    (tillId: string): KitchenNotification[] => {
      return kitchenNotifications.filter((n) => (n as KitchenNotification & { _tillId?: string })._tillId === tillId);
    },
    [kitchenNotifications],
  );

  const recordPayment = useCallback(
    (params: RecordPaymentParams) => {
      const payment: TillPayment = {
        id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        orderId: params.orderId,
        amount: params.amount,
        method: params.method,
        paidAt: new Date().toISOString(),
        amountTendered: params.amountTendered,
        change: params.change,
        cardType: params.cardType,
        cardTransNo: params.cardTransNo,
        momoProvider: params.momoProvider,
        momoPhone: params.momoPhone,
        momoTransId: params.momoTransId,
      };
      setTills((prev) =>
        prev.map((t) => {
          if (t.id !== params.tillId) return t;
          return {
            ...t,
            totalPayments: t.totalPayments + 1,
            totalPaymentAmount: t.totalPaymentAmount + params.amount,
            payments: [...t.payments, payment],
          };
        }),
      );
      // Mark the order as served once paid
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== params.orderId) return o;
          if (o.status === 'completed' || o.status === 'served') {
            return { ...o, status: 'served' as const, servedAt: o.servedAt ?? new Date().toISOString() };
          }
          return o;
        }),
      );
      toast.success(`Payment of GH₵ ${params.amount.toFixed(2)} recorded`);
    },
    [toast],
  );

  const recordBulkPayment = useCallback(
    (params: RecordBulkPaymentParams) => {
      const now = new Date().toISOString();
      const payments: TillPayment[] = params.orderPayments.map((op, index) => ({
        id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${index}`,
        orderId: op.orderId,
        amount: op.amount,
        method: params.method,
        paidAt: now,
        amountTendered: params.method === 'cash' && index === 0 ? params.amountTendered : undefined,
        change: params.method === 'cash' && index === 0 ? params.change : undefined,
        cardType: params.method === 'card' ? params.cardType : undefined,
        cardTransNo: params.method === 'card' ? params.cardTransNo : undefined,
        momoProvider: params.method === 'momo' ? params.momoProvider : undefined,
        momoPhone: params.method === 'momo' ? params.momoPhone : undefined,
        momoTransId: params.method === 'momo' ? params.momoTransId : undefined,
      }));

      setTills((prev) =>
        prev.map((t) => {
          if (t.id !== params.tillId) return t;
          return {
            ...t,
            totalPayments: t.totalPayments + payments.length,
            totalPaymentAmount: t.totalPaymentAmount + params.totalAmount,
            payments: [...t.payments, ...payments],
          };
        }),
      );

      const orderIds = new Set(params.orderPayments.map((op) => op.orderId));
      setOrders((prev) =>
        prev.map((o) => {
          if (!orderIds.has(o.id)) return o;
          if (o.status === 'completed' || o.status === 'served') {
            return { ...o, status: 'served' as const, servedAt: o.servedAt ?? now };
          }
          return o;
        }),
      );

      toast.success(
        `Bulk payment of GH₵ ${params.totalAmount.toFixed(2)} recorded for ${payments.length} order${payments.length !== 1 ? 's' : ''}`,
      );
    },
    [toast],
  );

  const recordTillPayment = useCallback(
    (params: RecordTillPaymentParams) => {
      const payment: TillPayment = {
        id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        orderId: 'TILL',
        amount: params.amount,
        method: params.method,
        paidAt: new Date().toISOString(),
        amountTendered: params.amountTendered,
        change: params.change,
        cardType: params.cardType,
        cardTransNo: params.cardTransNo,
        momoProvider: params.momoProvider,
        momoPhone: params.momoPhone,
        momoTransId: params.momoTransId,
      };
      setTills((prev) =>
        prev.map((t) => {
          if (t.id !== params.tillId) return t;
          return {
            ...t,
            totalPayments: t.totalPayments + 1,
            totalPaymentAmount: t.totalPaymentAmount + params.amount,
            payments: [...t.payments, payment],
          };
        }),
      );
      toast.success(`Payment of GH₵ ${params.amount.toFixed(2)} recorded`);
    },
    [toast],
  );

  const markOrdersSeen = useCallback((tillId: string) => {
    setUnseenUpdates((prev) => {
      if (!prev[tillId]) return prev;
      const next = { ...prev };
      delete next[tillId];
      return next;
    });
    // Mark kitchen notifications as read for this till
    setKitchenNotifications((prev) =>
      prev.map((n) => {
        const tagged = n as KitchenNotification & { _tillId?: string };
        if (tagged._tillId === tillId) return { ...n, read: true };
        return n;
      }),
    );
  }, []);

  const value = useMemo<KitchenOrderContextValue>(
    () => ({
      tills,
      openTill,
      closeTill,
      recordPayment,
      recordBulkPayment,
      recordTillPayment,
      orders,
      placeOrder,
      acceptOrder,
      rejectOrder,
      completeOrder,
      serveOrder,
      returnOrder,
      cancelOrder,
      serveOrderItem,
      heldOrders,
      holdOrder,
      resumeOrder,
      discardHeldOrder,
      unseenUpdates,
      markOrdersSeen,
      getOrdersForTill,
      getPendingOrders,
      getActiveOrders,
      getHeldOrdersForTill,
      getKitchenNotificationsForTill,
    }),
    [
      tills,
      openTill,
      closeTill,
      recordPayment,
      recordBulkPayment,
      recordTillPayment,
      orders,
      placeOrder,
      acceptOrder,
      rejectOrder,
      completeOrder,
      serveOrder,
      returnOrder,
      cancelOrder,
      serveOrderItem,
      heldOrders,
      holdOrder,
      resumeOrder,
      discardHeldOrder,
      unseenUpdates,
      markOrdersSeen,
      getOrdersForTill,
      getPendingOrders,
      getActiveOrders,
      getHeldOrdersForTill,
      getKitchenNotificationsForTill,
    ],
  );

  return <KitchenOrderContext.Provider value={value}>{children}</KitchenOrderContext.Provider>;
}

// ─── Hook ───

export function useKitchenOrders(): KitchenOrderContextValue {
  const context = useContext(KitchenOrderContext);
  if (!context) throw new Error('useKitchenOrders must be used within a KitchenOrderProvider');
  return context;
}
