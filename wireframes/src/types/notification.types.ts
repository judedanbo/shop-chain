import type { PageId } from './pages.types';

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationCategory =
  | 'stock_alert'
  | 'order_update'
  | 'sale_event'
  | 'approval_request'
  | 'team_update'
  | 'system'
  | 'customer';

export type NotificationTargetType = 'role' | 'individual' | 'role_and_individual';

export interface NotificationTarget {
  type: NotificationTargetType;
  roles?: string[];
  userId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  target: NotificationTarget;
  read: boolean;
  createdAt: string;
  actionUrl?: PageId;
  actionData?: Record<string, string>;
  actor?: string;
  actorRole?: string;
  requiresAction?: boolean;
  actionTaken?: 'approved' | 'rejected' | 'acknowledged';
}

/** Per-category notification preference */
export interface NotificationCategoryPref {
  enabled: boolean;
  channels: NotificationChannel[];
}

/** Full notification preferences for a user/shop */
export interface NotificationPreferences {
  categories: Record<NotificationCategory, NotificationCategoryPref>;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}
