import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Product, Supplier, PurchaseOrder, PageId } from '@/types';
import type { Warehouse } from '@/types/shop.types';

// ─── Back-navigation map ───
const BACK_MAP: Partial<Record<PageId, PageId>> = {
  productDetail: 'products',
  addProduct: 'products',
  editProduct: 'products',
  supplierDetail: 'suppliers',
  addSupplier: 'suppliers',
  poDetail: 'purchaseOrders',
  createPO: 'purchaseOrders',
  warehouseDetail: 'warehouses',
  customerDetail: 'customers',
  salesAnalysis: 'dashboard',
  permissions: 'team',
  tillManagement: 'barPos',
  categories: 'products',
  units: 'products',
  adjustments: 'products',
  transfers: 'products',
};

// ─── Context value interface ───
interface NavigationContextValue {
  page: PageId;
  setPage: (page: PageId) => void;

  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  selectedSupplier: Supplier | null;
  setSelectedSupplier: (supplier: Supplier | null) => void;
  selectedPO: PurchaseOrder | null;
  setSelectedPO: (po: PurchaseOrder | null) => void;
  selectedWarehouse: Warehouse | null;
  setSelectedWarehouse: (warehouse: Warehouse | null) => void;

  goToProduct: (product: Product) => void;
  goToSupplier: (supplier: Supplier) => void;
  goToPO: (po: PurchaseOrder) => void;
  goToWarehouse: (warehouse: Warehouse) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

// ─── Provider ───
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [page, setPageState] = useState<PageId>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const setPage = useCallback((p: PageId) => setPageState(p), []);

  const goToProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setPageState('productDetail');
  }, []);

  const goToSupplier = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setPageState('supplierDetail');
  }, []);

  const goToPO = useCallback((po: PurchaseOrder) => {
    setSelectedPO(po);
    setPageState('poDetail');
  }, []);

  const goToWarehouse = useCallback((warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setPageState('warehouseDetail');
  }, []);

  const goBack = useCallback(() => {
    setPageState((prev) => BACK_MAP[prev] || 'dashboard');
  }, []);

  const value = useMemo<NavigationContextValue>(
    () => ({
      page,
      setPage,
      selectedProduct,
      setSelectedProduct,
      selectedSupplier,
      setSelectedSupplier,
      selectedPO,
      setSelectedPO,
      selectedWarehouse,
      setSelectedWarehouse,
      goToProduct,
      goToSupplier,
      goToPO,
      goToWarehouse,
      goBack,
    }),
    [
      page,
      setPage,
      selectedProduct,
      selectedSupplier,
      selectedPO,
      selectedWarehouse,
      goToProduct,
      goToSupplier,
      goToPO,
      goToWarehouse,
      goBack,
    ],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

// ─── Hook ───
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
  return context;
}
