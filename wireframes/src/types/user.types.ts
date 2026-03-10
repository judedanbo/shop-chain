import type { Nullable } from './common.types';

export type UserRole =
  | 'owner'
  | 'general_manager'
  | 'manager'
  | 'bar_manager'
  | 'waiter'
  | 'kitchen_staff'
  | 'cashier'
  | 'inventory_clerk'
  | 'viewer';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  joinedAt: string;
  lastActive?: string;
}

export interface TeamMember extends User {
  shopId: string;
  branchIds: string[];
  permissions: string[];
}

export interface AuthState {
  user: Nullable<User>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  plan: string;
  shops: number;
  branches: number;
  joined: string;
  lastActive: string;
  avatar: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  last4: string;
  name: string;
  isDefault: boolean;
  added: string;
  status: string;
  expiry?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  plan: string;
  method: string;
  status: string;
  txRef: string;
  note?: string;
}
