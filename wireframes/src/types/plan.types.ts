export interface PlanLimits {
  shops: number;
  branchesPerShop: number;
  teamPerShop: number;
  productsPerShop: number;
  monthlyTransactions: number;
  storageMB: number;
  suppliers: number;
  warehouses: number;
}

export interface PlanFeatures {
  pos: 'basic' | 'full' | 'full_split';
  receipts: 'name_only' | 'logo_footer' | 'full_thermal';
  reports: 'basic' | 'advanced_csv' | 'advanced_all';
  barcode: boolean;
  purchaseOrders: 'view' | 'full' | 'auto_reorder';
  stockTransfers: boolean | 'branches' | 'full';
  lowStockAlerts: boolean | 'email' | 'all';
  twoFA: boolean;
  apiAccess: boolean;
  dataExport: boolean | 'csv' | 'all';
  customBranding: boolean;
  auditTrail: number;
  generalManager: boolean;
  support: 'community' | 'email_48h' | 'whatsapp_4h';
}

export interface PlanTier {
  id: PlanId;
  name: string;
  icon: string;
  color: string;
  price: number;
  badge: string;
  limits: PlanLimits;
  features: PlanFeatures;
}

export type PlanId = 'free' | 'basic' | 'max';

export interface UsageItem {
  key: string;
  label: string;
  used: number;
  max: number;
  unlimited: boolean;
  pct: number;
  warning: boolean;
  blocked: boolean;
  suffix?: string;
  formatMax?: (value: number) => string;
  formatUsed?: (value: number) => string;
}

export interface PlanUsage {
  items: UsageItem[];
  warnings: UsageItem[];
  blocked: UsageItem[];
  worstPct: number;
  plan: PlanTier;
}

export interface UsageData {
  shops?: number;
  branches?: number;
  team?: number;
  products?: number;
  transactions?: number;
  storageMB?: number;
  suppliers?: number;
  warehouses?: number;
}

export interface BillingRecord {
  id: string;
  date: string;
  desc: string;
  amount: string;
  status: string;
}

export interface PlanFeaturesTableItem {
  label: string;
  key: keyof PlanLimits;
  format: (v: number) => string | number;
}
