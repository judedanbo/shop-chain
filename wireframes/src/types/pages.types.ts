import type { Product, PurchaseOrder } from './index';

export type PageId =
  | 'dashboard'
  | 'products'
  | 'addProduct'
  | 'editProduct'
  | 'productDetail'
  | 'pos'
  | 'sales'
  | 'salesAnalysis'
  | 'notifications'
  | 'categories'
  | 'units'
  | 'inventory'
  | 'adjustments'
  | 'transfers'
  | 'warehouses'
  | 'warehouseDetail'
  | 'suppliers'
  | 'supplierDetail'
  | 'addSupplier'
  | 'purchaseOrders'
  | 'poDetail'
  | 'createPO'
  | 'receiveOrders'
  | 'customers'
  | 'customerDetail'
  | 'team'
  | 'permissions'
  | 'settings'
  | 'account'
  | 'barPos'
  | 'kitchen'
  | 'tillManagement';

export interface PageProps {
  setPage: (page: PageId) => void;
}

export interface ProductPageProps extends PageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
}

export interface POPageProps extends PageProps {
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  selectedPO: PurchaseOrder | null;
  setSelectedPO: (po: PurchaseOrder | null) => void;
}
