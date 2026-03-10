import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { AppNotification, NotificationCategory, NotificationChannel, NotificationPreferences } from '@/types';

// ─── Default Preferences ───

const DEFAULT_PREFS: NotificationPreferences = {
  categories: {
    stock_alert: { enabled: true, channels: ['in_app', 'push'] },
    order_update: { enabled: true, channels: ['in_app'] },
    sale_event: { enabled: true, channels: ['in_app'] },
    approval_request: { enabled: true, channels: ['in_app', 'push'] },
    team_update: { enabled: true, channels: ['in_app'] },
    system: { enabled: true, channels: ['in_app', 'email'] },
    customer: { enabled: true, channels: ['in_app'] },
  },
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

// ─── Demo Notifications ───

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NTF-001',
    title: 'Reversal Approval Needed',
    message:
      'Ama K. (salesperson) requested reversal of TXN-20260214-0028 (GH₵ 320.35) — Reason: Customer returned items',
    category: 'approval_request',
    priority: 'high',
    channels: ['in_app', 'push'],
    target: { type: 'role', roles: ['owner', 'general_manager', 'manager'] },
    read: false,
    createdAt: '2026-02-15T10:15:00.000Z',
    actor: 'Ama K.',
    actorRole: 'salesperson',
    actionUrl: 'sales',
    actionData: { saleId: 'TXN-20260214-0028' },
    requiresAction: true,
  },
  {
    id: 'NTF-002',
    title: 'Discount Applied — 10%',
    message: 'Kofi B. applied a 10% discount (GH₵ 24.50) on sale TXN-20260215-0039',
    category: 'sale_event',
    priority: 'medium',
    channels: ['in_app'],
    target: { type: 'role', roles: ['owner', 'general_manager', 'manager'] },
    read: false,
    createdAt: '2026-02-15T09:45:00.000Z',
    actor: 'Kofi B.',
    actorRole: 'salesperson',
    actionUrl: 'sales',
    actionData: { saleId: 'TXN-20260215-0039' },
  },
  {
    id: 'NTF-003',
    title: 'Low Stock Alert',
    message: 'Premium Basmati Rice (SKU-001) is down to 8 units — below the 20-unit threshold',
    category: 'stock_alert',
    priority: 'medium',
    channels: ['in_app'],
    target: { type: 'role', roles: ['owner', 'general_manager', 'manager', 'inventory_manager', 'inventory_officer'] },
    read: false,
    createdAt: '2026-02-15T08:30:00.000Z',
    actionUrl: 'products',
    actionData: { productId: 'SKU-001' },
  },
  {
    id: 'NTF-004',
    title: 'Sale Reversed',
    message: 'Manager reversed TXN-20260212-0019 (GH₵ 189.50) — Reason: Wrong product sold',
    category: 'sale_event',
    priority: 'high',
    channels: ['in_app', 'push'],
    target: { type: 'role', roles: ['owner', 'general_manager', 'manager'] },
    read: true,
    createdAt: '2026-02-14T16:20:00.000Z',
    actor: 'Kwame B.',
    actorRole: 'manager',
    actionUrl: 'sales',
    actionData: { saleId: 'TXN-20260212-0019' },
  },
  {
    id: 'NTF-005',
    title: 'New Team Member',
    message: 'Esi Appiah was added as Inventory Officer by Manager',
    category: 'team_update',
    priority: 'low',
    channels: ['in_app'],
    target: { type: 'role', roles: ['owner', 'general_manager'] },
    read: true,
    createdAt: '2026-02-14T11:00:00.000Z',
    actor: 'Kwame B.',
    actorRole: 'manager',
    actionUrl: 'team',
  },
  {
    id: 'NTF-006',
    title: 'Purchase Order Received',
    message: 'PO-2026-005 from Ghana Foods Ltd has been marked as received — 45 items',
    category: 'order_update',
    priority: 'medium',
    channels: ['in_app'],
    target: { type: 'role', roles: ['owner', 'general_manager', 'manager', 'inventory_manager'] },
    read: true,
    createdAt: '2026-02-13T14:30:00.000Z',
    actor: 'Yaw M.',
    actorRole: 'inventory_manager',
    actionUrl: 'purchaseOrders',
  },
  {
    id: 'NTF-007',
    title: 'Product Expiring Soon',
    message: 'Titus Sardines (125g) — Batch B-SAR-001 expires in 5 days (21 Feb 2026)',
    category: 'stock_alert',
    priority: 'high',
    channels: ['in_app', 'push'],
    target: { type: 'role', roles: ['owner', 'general_manager', 'manager', 'inventory_manager', 'inventory_officer'] },
    read: false,
    createdAt: '2026-02-15T07:00:00.000Z',
    actionUrl: 'products',
    actionData: { productId: 'SKU-006' },
  },
  {
    id: 'NTF-008',
    title: 'Reversal Approved',
    message: 'Your reversal request for TXN-20260213-0022 was approved by Manager',
    category: 'sale_event',
    priority: 'medium',
    channels: ['in_app'],
    target: { type: 'individual', userId: 'user-ama' },
    read: false,
    createdAt: '2026-02-14T17:10:00.000Z',
    actor: 'Kwame B.',
    actorRole: 'manager',
    actionUrl: 'sales',
  },
  {
    id: 'NTF-009',
    title: 'Plan Limit Approaching',
    message: 'You have used 85% of your monthly transactions (425/500). Consider upgrading.',
    category: 'system',
    priority: 'medium',
    channels: ['in_app', 'email'],
    target: { type: 'role', roles: ['owner', 'general_manager'] },
    read: true,
    createdAt: '2026-02-13T09:00:00.000Z',
  },
  {
    id: 'NTF-010',
    title: 'Discount Applied — 15%',
    message:
      'Ama K. applied a 15% discount (GH₵ 38.20) on sale TXN-20260213-0021. This exceeds the normal 10% limit for salespersons.',
    category: 'sale_event',
    priority: 'high',
    channels: ['in_app', 'push'],
    target: { type: 'role', roles: ['owner', 'general_manager', 'manager'] },
    read: true,
    createdAt: '2026-02-13T11:30:00.000Z',
    actor: 'Ama K.',
    actorRole: 'salesperson',
    actionUrl: 'sales',
    actionData: { saleId: 'TXN-20260213-0021' },
  },
];

// ─── Context Value ───

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  updateCategoryPref: (category: NotificationCategory, enabled: boolean, channels: NotificationChannel[]) => void;
  /** Dispatch helpers for common events */
  dispatch: {
    discountApplied: (actor: string, actorRole: string, percent: number, amount: number, saleId: string) => void;
    reversalRequested: (actor: string, actorRole: string, saleId: string, total: number, reason: string) => void;
    reversalApproved: (actor: string, actorRole: string, saleId: string, requestedBy: string) => void;
    reversalRejected: (actor: string, actorRole: string, saleId: string, requestedBy: string) => void;
    reversalDirect: (actor: string, actorRole: string, saleId: string, total: number, reason: string) => void;
  };
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ─── Provider ───

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentRole } = useAuth();
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFS);

  // Filter by current user's role
  const notifications = useMemo(() => {
    return allNotifications.filter((n) => {
      const t = n.target;
      if (t.type === 'role') return t.roles?.includes(currentRole) ?? false;
      if (t.type === 'individual') return true; // In demo, show all individual — backend would filter by userId
      if (t.type === 'role_and_individual') return (t.roles?.includes(currentRole) ?? false) || true;
      return false;
    });
  }, [allNotifications, currentRole]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const notification: AppNotification = {
      ...n,
      id: `NTF-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setAllNotifications((prev) => [notification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAllNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setAllNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setAllNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));
  }, []);

  const updateCategoryPref = useCallback(
    (category: NotificationCategory, enabled: boolean, channels: NotificationChannel[]) => {
      setPreferences((prev) => ({
        ...prev,
        categories: { ...prev.categories, [category]: { enabled, channels } },
      }));
    },
    [],
  );

  // ─── Dispatch helpers ───

  const dispatchDiscountApplied = useCallback(
    (actor: string, actorRole: string, percent: number, amount: number, saleId: string) => {
      const isLarge = percent >= 15;
      addNotification({
        title: `Discount Applied — ${percent}%`,
        message: `${actor} applied a ${percent}% discount (GH₵ ${amount.toFixed(2)}) on sale ${saleId}${isLarge ? `. This exceeds the normal limit for ${actorRole}s.` : ''}`,
        category: 'sale_event',
        priority: isLarge ? 'high' : 'medium',
        channels: isLarge ? ['in_app', 'push'] : ['in_app'],
        target: { type: 'role', roles: ['owner', 'general_manager', 'manager'] },
        actor,
        actorRole,
        actionUrl: 'sales',
        actionData: { saleId },
      });
    },
    [addNotification],
  );

  const dispatchReversalRequested = useCallback(
    (actor: string, actorRole: string, saleId: string, total: number, reason: string) => {
      addNotification({
        title: 'Reversal Approval Needed',
        message: `${actor} (${actorRole}) requested reversal of ${saleId} (GH₵ ${total.toFixed(2)}) — Reason: ${reason}`,
        category: 'approval_request',
        priority: 'high',
        channels: ['in_app', 'push'],
        target: { type: 'role', roles: ['owner', 'general_manager', 'manager'] },
        actor,
        actorRole,
        actionUrl: 'sales',
        actionData: { saleId },
        requiresAction: true,
      });
    },
    [addNotification],
  );

  const dispatchReversalApproved = useCallback(
    (actor: string, actorRole: string, saleId: string, requestedBy: string) => {
      // Notify the requester
      addNotification({
        title: 'Reversal Approved',
        message: `Your reversal request for ${saleId} was approved by ${actor} (${actorRole})`,
        category: 'sale_event',
        priority: 'medium',
        channels: ['in_app'],
        target: { type: 'role_and_individual', roles: ['owner', 'general_manager'], userId: requestedBy },
        actor,
        actorRole,
        actionUrl: 'sales',
        actionData: { saleId },
      });
    },
    [addNotification],
  );

  const dispatchReversalRejected = useCallback(
    (actor: string, actorRole: string, saleId: string, requestedBy: string) => {
      addNotification({
        title: 'Reversal Rejected',
        message: `Your reversal request for ${saleId} was rejected by ${actor} (${actorRole})`,
        category: 'sale_event',
        priority: 'medium',
        channels: ['in_app'],
        target: { type: 'role_and_individual', roles: ['owner', 'general_manager'], userId: requestedBy },
        actor,
        actorRole,
        actionUrl: 'sales',
        actionData: { saleId },
      });
    },
    [addNotification],
  );

  const dispatchReversalDirect = useCallback(
    (actor: string, actorRole: string, saleId: string, total: number, reason: string) => {
      addNotification({
        title: 'Sale Reversed',
        message: `${actor} (${actorRole}) reversed ${saleId} (GH₵ ${total.toFixed(2)}) — Reason: ${reason}`,
        category: 'sale_event',
        priority: 'high',
        channels: ['in_app', 'push'],
        target: { type: 'role', roles: ['owner', 'general_manager', 'manager'] },
        actor,
        actorRole,
        actionUrl: 'sales',
        actionData: { saleId },
      });
    },
    [addNotification],
  );

  const dispatch = useMemo(
    () => ({
      discountApplied: dispatchDiscountApplied,
      reversalRequested: dispatchReversalRequested,
      reversalApproved: dispatchReversalApproved,
      reversalRejected: dispatchReversalRejected,
      reversalDirect: dispatchReversalDirect,
    }),
    [
      dispatchDiscountApplied,
      dispatchReversalRequested,
      dispatchReversalApproved,
      dispatchReversalRejected,
      dispatchReversalDirect,
    ],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllRead,
      deleteNotification,
      preferences,
      updatePreferences,
      updateCategoryPref,
      dispatch,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllRead,
      deleteNotification,
      preferences,
      updatePreferences,
      updateCategoryPref,
      dispatch,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// ─── Hook ───

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
