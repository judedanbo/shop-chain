import React, { useState, useCallback, lazy, Suspense } from 'react';
import { Shield, Lock, Mail } from 'lucide-react';
import {
  useColors,
  useAuth,
  useNavigation,
  ShopProvider,
  KitchenOrderProvider,
  type AuthScreen,
  type AppShop,
  type AppBranch,
} from '@/context';
import { useBreakpoint } from '@/hooks';
import { MainLayout } from '@/components/layout';
import {
  INITIAL_PRODUCTS,
  INITIAL_POS,
  MOCK_CUSTOMERS,
  INITIAL_CATEGORIES,
  INITIAL_UNITS,
  INITIAL_TEAM,
  INITIAL_SALES,
} from '@/constants/demoData';
import type { Product, SaleRecord } from '@/types';

// Lazy-loaded pages (all named exports)
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('@/pages/products/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const AddProductPage = lazy(() =>
  import('@/pages/products/AddProductPage').then((m) => ({ default: m.AddProductPage })),
);
const ProductDetailPage = lazy(() =>
  import('@/pages/products/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
);
const CategoriesPage = lazy(() =>
  import('@/pages/products/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
);
const UnitsPage = lazy(() => import('@/pages/products/UnitsPage').then((m) => ({ default: m.UnitsPage })));
const AdjustmentsPage = lazy(() =>
  import('@/pages/inventory/AdjustmentsPage').then((m) => ({ default: m.AdjustmentsPage })),
);
const TransfersPage = lazy(() => import('@/pages/inventory/TransfersPage').then((m) => ({ default: m.TransfersPage })));
const ReceiveOrdersPage = lazy(() =>
  import('@/pages/inventory/ReceiveOrdersPage').then((m) => ({ default: m.ReceiveOrdersPage })),
);
const SuppliersPage = lazy(() => import('@/pages/suppliers/SuppliersPage').then((m) => ({ default: m.SuppliersPage })));
const SupplierDetailPage = lazy(() =>
  import('@/pages/suppliers/SupplierDetailPage').then((m) => ({ default: m.SupplierDetailPage })),
);
const PurchaseOrdersPage = lazy(() =>
  import('@/pages/purchaseOrders/PurchaseOrdersPage').then((m) => ({ default: m.PurchaseOrdersPage })),
);
const PODetailPage = lazy(() =>
  import('@/pages/purchaseOrders/PODetailPage').then((m) => ({ default: m.PODetailPage })),
);
const WarehousesPage = lazy(() =>
  import('@/pages/warehouse/WarehousesPage').then((m) => ({ default: m.WarehousesPage })),
);
const WarehouseDetailPage = lazy(() =>
  import('@/pages/warehouse/WarehouseDetailPage').then((m) => ({ default: m.WarehouseDetailPage })),
);
const POSPage = lazy(() => import('@/pages/pos/POSPage').then((m) => ({ default: m.POSPage })));
const BarPOSPage = lazy(() => import('@/pages/barPos/BarPOSPage').then((m) => ({ default: m.BarPOSPage })));
const KitchenDisplayPage = lazy(() =>
  import('@/pages/kitchen/KitchenDisplayPage').then((m) => ({ default: m.KitchenDisplayPage })),
);
const TillManagementPage = lazy(() =>
  import('@/pages/tillManagement/TillManagementPage').then((m) => ({ default: m.TillManagementPage })),
);
const SalesPage = lazy(() => import('@/pages/sales/SalesPage').then((m) => ({ default: m.SalesPage })));
const SalesAnalysisPage = lazy(() =>
  import('@/pages/sales/SalesAnalysisPage').then((m) => ({ default: m.SalesAnalysisPage })),
);
const NotificationsPage = lazy(() =>
  import('@/pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const TeamPage = lazy(() => import('@/pages/team/TeamPage').then((m) => ({ default: m.TeamPage })));
const RolePermissionsPage = lazy(() =>
  import('@/pages/team/RolePermissionsPage').then((m) => ({ default: m.RolePermissionsPage })),
);
const ShopSettingsPage = lazy(() =>
  import('@/pages/settings/ShopSettingsPage').then((m) => ({ default: m.ShopSettingsPage })),
);
const AccountPage = lazy(() => import('@/pages/settings/AccountPage').then((m) => ({ default: m.AccountPage })));

// Auth & onboarding pages
const AuthLayout = lazy(() => import('@/pages/auth/AuthLayout').then((m) => ({ default: m.AuthLayout })));
const LoginScreen = lazy(() => import('@/pages/auth/LoginScreen').then((m) => ({ default: m.LoginScreen })));
const RegisterScreen = lazy(() => import('@/pages/auth/RegisterScreen').then((m) => ({ default: m.RegisterScreen })));
const VerifyScreen = lazy(() => import('@/pages/auth/VerifyScreen').then((m) => ({ default: m.VerifyScreen })));
const ForgotPasswordScreen = lazy(() =>
  import('@/pages/auth/ForgotPasswordScreen').then((m) => ({ default: m.ForgotPasswordScreen })),
);
const ResetPasswordScreen = lazy(() =>
  import('@/pages/auth/ResetPasswordScreen').then((m) => ({ default: m.ResetPasswordScreen })),
);
const ShopSelectScreen = lazy(() =>
  import('@/pages/onboarding/ShopSelectScreen').then((m) => ({ default: m.ShopSelectScreen })),
);
const CreateShopWizard = lazy(() =>
  import('@/pages/onboarding/CreateShopWizard').then((m) => ({ default: m.CreateShopWizard })),
);
const SuperAdminDashboard = lazy(() =>
  import('@/pages/admin/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard })),
);

// Loading fallback
const PageLoader: React.FC = () => {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <div
        className="border-border border-t-primary h-8 w-8 rounded-full border-[3px]"
        style={{ animation: 'spin 0.8s linear infinite' }}
      />
    </div>
  );
};

export default function ShopChainApp() {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { authScreen, setAuthScreen, setActiveShop, setActiveBranch } = useAuth();
  const { page, selectedProduct, setSelectedProduct } = useNavigation();

  // Data state (stays in App — to be extracted to data context in future phase)
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [purchaseOrders, setPurchaseOrders] = useState(INITIAL_POS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [units, setUnits] = useState(INITIAL_UNITS);
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(INITIAL_SALES);

  const handleTillClose = useCallback((sale: SaleRecord) => {
    setSalesHistory((prev) => [sale, ...prev]);
  }, []);

  const addProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct({ ...selectedProduct, ...updates });
    }
  };

  const renderPage = () => {
    const fallback = <PageLoader />;
    return (
      <Suspense fallback={fallback}>
        {(() => {
          switch (page) {
            case 'dashboard':
              return <DashboardPage products={products} salesHistory={salesHistory} />;
            case 'products':
              return <ProductsPage products={products} />;
            case 'categories':
              return <CategoriesPage categories={categories} setCategories={setCategories} products={products} />;
            case 'units':
              return <UnitsPage units={units} setUnits={setUnits} products={products} />;
            case 'addProduct':
              return (
                <AddProductPage
                  products={products}
                  addProduct={addProduct}
                  categories={categories}
                  units={units}
                  setCategories={setCategories}
                  setUnits={setUnits}
                />
              );
            case 'editProduct':
              return (
                <AddProductPage
                  product={selectedProduct}
                  products={products}
                  addProduct={addProduct}
                  categories={categories}
                  units={units}
                  setCategories={setCategories}
                  setUnits={setUnits}
                />
              );
            case 'productDetail':
              return <ProductDetailPage updateProduct={updateProduct} products={products} />;
            case 'adjustments':
              return <AdjustmentsPage products={products} />;
            case 'transfers':
              return <TransfersPage products={products} />;
            case 'receiveOrders':
              return <ReceiveOrdersPage products={products} updateProduct={updateProduct} />;
            case 'suppliers':
              return <SuppliersPage products={products} />;
            case 'supplierDetail':
              return (
                <SupplierDetailPage
                  products={products}
                  addProduct={addProduct}
                  updateProduct={updateProduct}
                  categories={categories}
                  units={units}
                  setCategories={setCategories}
                  setUnits={setUnits}
                />
              );
            case 'purchaseOrders':
              return <PurchaseOrdersPage purchaseOrders={purchaseOrders} products={products} />;
            case 'poDetail':
              return (
                <PODetailPage
                  purchaseOrders={purchaseOrders}
                  setPurchaseOrders={setPurchaseOrders}
                  products={products}
                  updateProduct={updateProduct}
                />
              );
            case 'warehouses':
              return <WarehousesPage products={products} />;
            case 'warehouseDetail':
              return <WarehouseDetailPage products={products} />;
            case 'pos':
              return (
                <POSPage
                  products={products}
                  customers={customers}
                  setCustomers={setCustomers}
                  salesHistory={salesHistory}
                  setSalesHistory={setSalesHistory}
                />
              );
            case 'barPos':
              return <BarPOSPage products={products} />;
            case 'tillManagement':
              return <TillManagementPage products={products} />;
            case 'kitchen':
              return <KitchenDisplayPage />;
            case 'sales':
              return (
                <SalesPage
                  salesHistory={salesHistory}
                  setSalesHistory={setSalesHistory}
                  customers={customers}
                  setCustomers={setCustomers}
                />
              );
            case 'salesAnalysis':
              return <SalesAnalysisPage salesHistory={salesHistory} />;
            case 'notifications':
              return <NotificationsPage />;
            case 'customers':
              return <CustomersPage customers={customers} setCustomers={setCustomers} />;
            case 'team':
              return <TeamPage teamMembers={teamMembers} setTeamMembers={setTeamMembers} />;
            case 'permissions':
              return <RolePermissionsPage />;
            case 'settings':
              return (
                <ShopSettingsPage
                  onDeleteShop={() => {
                    setActiveShop(null);
                    setActiveBranch(null);
                    setAuthScreen('shopSelect');
                  }}
                />
              );
            case 'account':
              return <AccountPage />;
            default:
              return <DashboardPage products={products} salesHistory={salesHistory} />;
          }
        })()}
      </Suspense>
    );
  };

  // ─── AUTH GATE ───
  if (authScreen === 'adminDashboard') {
    return (
      <Suspense fallback={<PageLoader />}>
        <SuperAdminDashboard />
      </Suspense>
    );
  }

  if (authScreen === 'adminLogin') {
    return (
      <div className="bg-bg flex min-h-screen items-center justify-center p-5">
        <div className="w-full max-w-[400px]" style={{ animation: 'modalIn 0.3s ease' }}>
          <div className="mb-7 text-center">
            <div
              className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${COLORS.danger}, #FF6B6B)` }}
            >
              <Shield size={28} className="text-white" />
            </div>
            <div className="text-text text-[22px] font-extrabold">Admin Portal</div>
            <div className="text-text-dim text-xs">ShopChain Platform Administration</div>
          </div>
          <div className="bg-surface border-border rounded-[18px] border-[1.5px] p-6">
            <div className="mb-4">
              <label className="text-text-muted mb-[5px] block text-[11px] font-bold tracking-[0.5px] uppercase">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={14} className="text-text-dim absolute top-1/2 left-3 -translate-y-1/2" />
                <input
                  defaultValue="admin@shopchain.com"
                  className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] py-[11px] pr-3.5 pl-9 font-[inherit] text-[13px] outline-none"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-text-muted mb-[5px] block text-[11px] font-bold tracking-[0.5px] uppercase">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="text-text-dim absolute top-1/2 left-3 -translate-y-1/2" />
                <input
                  type="password"
                  defaultValue="admin123"
                  className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] py-[11px] pr-3.5 pl-9 font-[inherit] text-[13px] outline-none"
                />
              </div>
            </div>
            <div className="mb-5">
              <label className="text-text-muted mb-[5px] block text-[11px] font-bold tracking-[0.5px] uppercase">
                2FA Code
              </label>
              <div className="flex gap-1.5">
                {Array.from({ length: 6 }, (_, i) => (
                  <input
                    key={i}
                    maxLength={1}
                    defaultValue={String(i + 1)}
                    className="border-border bg-surface-alt text-text h-11 w-10 rounded-lg border-[1.5px] text-center font-mono text-lg font-bold outline-none"
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAuthScreen('adminDashboard')}
              className="w-full rounded-xl border-none px-5 py-[13px] font-[inherit] text-sm font-extrabold text-white"
              style={{
                background: `linear-gradient(135deg, ${COLORS.danger}, #FF6B6B)`,
                boxShadow: `0 6px 24px ${COLORS.danger}30`,
              }}
            >
              Access Admin Portal
            </button>
          </div>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setAuthScreen('login')}
              className="text-primary border-none bg-transparent font-[inherit] text-xs font-semibold"
            >
              Back to User Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authScreen === 'shopSelect') {
    return (
      <Suspense fallback={<PageLoader />}>
        <ShopSelectScreen
          bp={bp}
          onSelectShop={(shop: AppShop & { activeBranch?: AppBranch | null }) => {
            const branch = shop.activeBranch || null;
            const cleanShop: AppShop = {
              name: shop.name,
              type: shop.type,
              icon: shop.icon,
              logoUrl: shop.logoUrl,
              branches: shop.branches,
            };
            setActiveShop(cleanShop);
            setActiveBranch(branch);
            setAuthScreen('authenticated');
          }}
          onCreateShop={() => setAuthScreen('createShop')}
          onLogout={() => {
            setActiveShop(null);
            setActiveBranch(null);
            setAuthScreen('login');
          }}
        />
      </Suspense>
    );
  }

  if (authScreen === 'createShop') {
    return (
      <Suspense fallback={<PageLoader />}>
        <CreateShopWizard
          bp={bp}
          onComplete={(shop: AppShop) => {
            setActiveShop(shop);
            setActiveBranch(null);
            setAuthScreen('authenticated');
          }}
          onBack={() => setAuthScreen('shopSelect')}
        />
      </Suspense>
    );
  }

  if (authScreen !== 'authenticated') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthLayout>
          {authScreen === 'login' && (
            <LoginScreen
              setAuthScreen={(s: string) => setAuthScreen(s as AuthScreen)}
              onLogin={() => setAuthScreen('shopSelect')}
            />
          )}
          {authScreen === 'register' && (
            <RegisterScreen setAuthScreen={(s: string) => setAuthScreen(s as AuthScreen)} />
          )}
          {authScreen === 'verify' && (
            <VerifyScreen
              setAuthScreen={(s: string) => setAuthScreen(s as AuthScreen)}
              onVerified={() => setAuthScreen('shopSelect')}
            />
          )}
          {authScreen === 'forgot' && (
            <ForgotPasswordScreen setAuthScreen={(s: string) => setAuthScreen(s as AuthScreen)} />
          )}
          {authScreen === 'reset' && (
            <ResetPasswordScreen setAuthScreen={(s: string) => setAuthScreen(s as AuthScreen)} />
          )}
        </AuthLayout>
      </Suspense>
    );
  }

  // ─── AUTHENTICATED LAYOUT ───
  return (
    <KitchenOrderProvider onTillClose={handleTillClose}>
      <ShopProvider usageCounts={{ products: products.length, team: teamMembers.length }}>
        <MainLayout>{renderPage()}</MainLayout>
      </ShopProvider>
    </KitchenOrderProvider>
  );
}
