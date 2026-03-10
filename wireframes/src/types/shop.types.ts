import type { PlanId } from './plan.types';

export type ShopStatus = 'active' | 'suspended' | 'pending';

export interface Shop {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  status: ShopStatus;
  plan: PlanId;
  ownerId: string;
  createdAt: string;
  settings?: ShopSettings;
}

export interface Branch {
  id: string;
  shopId: string;
  name: string;
  type: 'retail' | 'warehouse' | 'distribution';
  address: string;
  phone?: string;
  managerId?: string;
  isDefault: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  type: string;
  address: string;
  manager: string;
  phone: string;
  email: string;
  capacity: number;
  zones: string[];
}

export interface ShopSettings {
  currency: string;
  timezone: string;
  taxRate: number;
  receiptFooter?: string;
  lowStockThreshold: number;
}

export interface AdminShop {
  id: string;
  name: string;
  type: string;
  owner: string;
  ownerEmail: string;
  plan: string;
  branches: number;
  team: number;
  status: string;
  created: string;
  icon: string;
}
