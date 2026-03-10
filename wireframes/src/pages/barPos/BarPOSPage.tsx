import React, { useState, useMemo } from 'react';
import { Plus, Coffee, UtensilsCrossed, ShoppingBag, Clock, XCircle, Pause, Monitor, BarChart3 } from 'lucide-react';
import { useColors, useAuth, useNavigation, useKitchenOrders, useToast } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile, isSmall } from '@/utils/responsive';
import { Button } from '@/components/ui';
import type { Product, KitchenOrderItem, OrderType, HeldOrderItem } from '@/types';
import { ProductCatalog } from './ProductCatalog';
import { OrderPanel } from './OrderPanel';
import { TillOrdersDrawer, HeldOrdersDrawer } from './TillOrdersDrawer';

// ─── Date filter helper ───

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ─── Local types ───

interface CartItem extends Product {
  qty: number;
  notes?: string;
}

interface TillCart {
  items: CartItem[];
  table: string;
  orderType: OrderType;
}

interface BarPOSPageProps {
  products: Product[];
}

// ─── BarPOSPage ───

export const BarPOSPage: React.FC<BarPOSPageProps> = ({ products }) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { user, activeShop } = useAuth();
  const { setPage } = useNavigation();
  const { toast } = useToast();
  const {
    tills,
    openTill,
    closeTill,
    placeOrder,
    getOrdersForTill,
    holdOrder,
    resumeOrder,
    discardHeldOrder,
    getHeldOrdersForTill,
    unseenUpdates,
    markOrdersSeen,
  } = useKitchenOrders();

  const mobile = isMobile(bp);
  const small = isSmall(bp);

  // Filter tills to today only (daily fresh start)
  const todayTills = useMemo(() => tills.filter((t) => isToday(t.openedAt)), [tills]);

  // ─── State ───
  const [activeTillId, setActiveTillId] = useState<string | null>(null);
  const [showOpenTillModal, setShowOpenTillModal] = useState(false);
  const [newTillName, setNewTillName] = useState('');
  const [showCloseTillConfirm, setShowCloseTillConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [tillCarts, setTillCarts] = useState<Record<string, TillCart>>({});
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showTillOrders, setShowTillOrders] = useState(false);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');

  const activeTills = todayTills.filter((t) => t.isActive);
  const activeTill = activeTills.find((t) => t.id === activeTillId) ?? null;
  const currentCart: TillCart = activeTillId
    ? (tillCarts[activeTillId] ?? { items: [], table: '', orderType: 'dine_in' })
    : { items: [], table: '', orderType: 'dine_in' };

  // ─── Product filtering ───
  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category))], [products]);
  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchCat = category === 'All' || p.category === category;
        const matchSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toLowerCase().includes(search.toLowerCase()) ||
          (p.barcode && p.barcode.includes(search));
        return matchCat && matchSearch && p.stock > 0;
      }),
    [products, category, search],
  );

  // ─── Cart helpers ───
  const updateCart = (tillId: string, updater: (cart: TillCart) => TillCart) => {
    setTillCarts((prev) => {
      const current = prev[tillId] ?? { items: [], table: '', orderType: 'dine_in' };
      return { ...prev, [tillId]: updater(current) };
    });
  };

  const addToCart = (product: Product) => {
    if (!activeTillId) {
      toast.error('Open a till first');
      return;
    }
    updateCart(activeTillId, (cart) => {
      const exists = cart.items.find((i) => i.id === product.id);
      if (exists) {
        if (exists.qty >= product.stock) return cart;
        return { ...cart, items: cart.items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i)) };
      }
      return { ...cart, items: [...cart.items, { ...product, qty: 1 }] };
    });
  };

  const updateQty = (id: string, delta: number) => {
    if (!activeTillId) return;
    updateCart(activeTillId, (cart) => ({
      ...cart,
      items: cart.items.map((i) => {
        if (i.id !== id) return i;
        const newQty = i.qty + delta;
        if (newQty < 1) return i;
        const prod = products.find((p) => p.id === id);
        if (prod && newQty > prod.stock) return i;
        return { ...i, qty: newQty };
      }),
    }));
  };

  const removeFromCart = (id: string) => {
    if (!activeTillId) return;
    updateCart(activeTillId, (cart) => ({ ...cart, items: cart.items.filter((i) => i.id !== id) }));
  };

  const setTable = (table: string) => {
    if (!activeTillId) return;
    updateCart(activeTillId, (cart) => ({ ...cart, table }));
  };

  const setOrderType = (orderType: OrderType) => {
    if (!activeTillId) return;
    updateCart(activeTillId, (cart) => ({ ...cart, orderType }));
  };

  const saveItemNotes = (itemId: string) => {
    if (!activeTillId) return;
    updateCart(activeTillId, (cart) => ({
      ...cart,
      items: cart.items.map((i) => (i.id === itemId ? { ...i, notes: noteText || undefined } : i)),
    }));
    setEditingNotes(null);
    setNoteText('');
  };

  const clearCart = () => {
    if (!activeTillId) return;
    updateCart(activeTillId, () => ({ items: [], table: '', orderType: 'dine_in' }));
  };

  const totalItems = currentCart.items.reduce((s, i) => s + i.qty, 0);
  const totalAmount = currentCart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const hasKitchenItems = currentCart.items.some((i) => !i.skipKitchen);
  const hasBarOnlyItems = currentCart.items.some((i) => i.skipKitchen);

  // ─── Send to kitchen ───
  const sendToKitchen = () => {
    if (!activeTill || currentCart.items.length === 0) return;

    // Split items: kitchen items vs bar-direct items (skipKitchen)
    const kitchenCartItems = currentCart.items.filter((i) => !i.skipKitchen);
    const barCartItems = currentCart.items.filter((i) => i.skipKitchen);

    const kitchenItems: KitchenOrderItem[] = kitchenCartItems.map((i) => ({
      productId: i.id,
      name: i.name,
      qty: i.qty,
      notes: i.notes,
    }));
    const barItems: KitchenOrderItem[] = barCartItems.map((i) => ({
      productId: i.id,
      name: i.name,
      qty: i.qty,
      notes: i.notes,
    }));

    const kitchenTotal = kitchenCartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const barTotal = barCartItems.reduce((s, i) => s + i.price * i.qty, 0);

    placeOrder({
      tillId: activeTill.id,
      tillName: activeTill.name,
      table: currentCart.table || undefined,
      orderType: currentCart.orderType,
      items: kitchenItems,
      serverName: user?.name ?? 'Staff',
      total: kitchenTotal || undefined,
      barItems: barItems.length > 0 ? barItems : undefined,
      barTotal: barTotal || undefined,
    });
    updateCart(activeTill.id, () => ({ items: [], table: '', orderType: 'dine_in' }));
    if (mobile) setMobileView('catalog');
  };

  // ─── Held orders ───
  const tillHeldOrders = activeTillId ? getHeldOrdersForTill(activeTillId) : [];
  const unseenCount = activeTillId ? (unseenUpdates[activeTillId] ?? 0) : 0;

  const holdCurrentOrder = () => {
    if (!activeTillId || currentCart.items.length === 0) return;
    const heldItems: HeldOrderItem[] = currentCart.items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: i.price,
      cost: i.cost,
      stock: i.stock,
      reorder: i.reorder,
      unit: i.unit,
      status: i.status,
      location: i.location,
      image: i.image,
      qty: i.qty,
      notes: i.notes,
      barcode: i.barcode,
      supplier: i.supplier,
    }));
    holdOrder({
      tillId: activeTillId,
      items: heldItems,
      table: currentCart.table,
      orderType: currentCart.orderType,
      label: currentCart.table || undefined,
    });
    updateCart(activeTillId, () => ({ items: [], table: '', orderType: 'dine_in' }));
    if (mobile) setMobileView('catalog');
  };

  const resumeHeldOrder = (heldId: string) => {
    if (!activeTillId) return;
    const held = resumeOrder(heldId);
    if (!held) return;
    const restoredItems: CartItem[] = held.items.map((i) => ({
      ...i,
      status: i.status as Product['status'],
    }));
    updateCart(activeTillId, () => ({
      items: restoredItems,
      table: held.table,
      orderType: held.orderType,
    }));
    setShowHeldOrders(false);
    if (mobile) setMobileView('cart');
  };

  // ─── Till management ───
  const handleOpenTill = () => {
    if (!newTillName.trim()) return;
    const till = openTill(newTillName.trim(), user?.name ?? 'Staff');
    setActiveTillId(till.id);
    setNewTillName('');
    setShowOpenTillModal(false);
  };

  const handleCloseTill = () => {
    if (!activeTillId) return;
    closeTill(activeTillId);
    setShowCloseTillConfirm(false);
    const remaining = activeTills.filter((t) => t.id !== activeTillId);
    setActiveTillId(remaining.length > 0 ? remaining[0]!.id : null);
  };

  const tillOrders = activeTillId ? getOrdersForTill(activeTillId) : [];
  const tillOrdersSorted = [...tillOrders].reverse();

  // ─── No till prompt ───
  if (activeTills.length === 0 && !showOpenTillModal) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-5 p-10">
        <div
          className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px]"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }}
        >
          <Coffee size={36} className="text-white" />
        </div>
        <div className="text-center">
          <div className="text-text mb-2 text-[22px] font-extrabold">{activeShop?.name ?? 'Bar & Restaurant POS'}</div>
          <div className="text-text-dim max-w-[360px] text-sm">
            Open a till to start taking orders. Each till operates independently and stays open for your entire shift.
          </div>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowOpenTillModal(true)}>
          Open New Till
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ─── Top Bar ─── */}
      <div
        className="border-border bg-surface flex flex-wrap items-center gap-2.5 border-b"
        style={{ padding: small ? '10px 12px' : '12px 20px' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Coffee size={20} className="text-primary shrink-0" />
          <span className="text-text text-base font-bold whitespace-nowrap">
            {activeShop?.name ?? 'Bar & Restaurant'}
          </span>
        </div>

        {/* Till tabs */}
        <div className="flex flex-wrap gap-1">
          {activeTills.map((till) => (
            <button
              type="button"
              key={till.id}
              onClick={() => setActiveTillId(till.id)}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-[inherit] text-xs font-semibold"
              style={{
                border: `1.5px solid ${till.id === activeTillId ? COLORS.primary : COLORS.border}`,
                background: till.id === activeTillId ? COLORS.primaryBg : COLORS.surfaceAlt,
                color: till.id === activeTillId ? COLORS.primary : COLORS.textMuted,
              }}
            >
              {till.name}
              {till.orderCount > 0 && (
                <span className="bg-primary rounded-[10px] px-1.5 py-px text-[10px] font-bold text-white">
                  {till.orderCount}
                </span>
              )}
            </button>
          ))}
          <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowOpenTillModal(true)} />
        </div>

        {/* Till actions */}
        {activeTill && (
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Button variant="ghost" size="sm" icon={Pause} onClick={() => setShowHeldOrders(!showHeldOrders)}>
                {!small && 'Held'}
              </Button>
              {tillHeldOrders.length > 0 && (
                <span className="bg-warning absolute -top-1 -right-1 rounded-[10px] px-1.5 py-px text-[10px] leading-4 font-bold text-white">
                  {tillHeldOrders.length}
                </span>
              )}
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                icon={Clock}
                onClick={() => {
                  setShowTillOrders(!showTillOrders);
                  if (activeTillId) markOrdersSeen(activeTillId);
                }}
              >
                {!small && 'Orders'}
              </Button>
              {unseenCount > 0 && (
                <span className="bg-danger absolute -top-1 -right-1 rounded-[10px] px-1.5 py-px text-[10px] leading-4 font-bold text-white">
                  {unseenCount}
                </span>
              )}
            </div>
            <Button variant="danger" size="sm" icon={XCircle} onClick={() => setShowCloseTillConfirm(true)}>
              {!small && 'Close Till'}
            </Button>
            <Button variant="ghost" size="sm" icon={Monitor} onClick={() => setPage('tillManagement')}>
              {!small && 'Till Management'}
            </Button>
            <Button variant="ghost" size="sm" icon={BarChart3} onClick={() => setPage('salesAnalysis')}>
              {!small && 'Analysis'}
            </Button>
          </div>
        )}

        {/* Mobile cart toggle */}
        {mobile && activeTill && (
          <button
            type="button"
            onClick={() => setMobileView(mobileView === 'catalog' ? 'cart' : 'catalog')}
            className="text-primary bg-primary-bg border-primary flex items-center gap-1 rounded-lg border-[1.5px] px-3 py-1.5 font-[inherit] text-xs font-bold"
          >
            {mobileView === 'catalog' ? (
              <>
                <ShoppingBag size={14} /> Cart ({totalItems})
              </>
            ) : (
              <>
                <UtensilsCrossed size={14} /> Menu
              </>
            )}
          </button>
        )}
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 gap-0 overflow-hidden p-0 sm:gap-4 sm:p-4 lg:gap-5">
        {/* Product Catalog */}
        {(!mobile || mobileView === 'catalog') && (
          <div style={{ flex: mobile ? 1 : 0.65 }} className="flex flex-col overflow-hidden">
            <ProductCatalog
              products={filtered}
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              categories={categories}
              onAddToCart={addToCart}
              currentCartItems={currentCart.items}
              hasTill={!!activeTill}
            />
          </div>
        )}

        {/* Order Panel */}
        {(!mobile || mobileView === 'cart') && (
          <div style={{ flex: mobile ? 1 : 0.35 }} className="flex flex-col overflow-hidden">
            <OrderPanel
              activeTillName={activeTill?.name ?? null}
              items={currentCart.items}
              table={currentCart.table}
              orderType={currentCart.orderType}
              totalItems={totalItems}
              totalAmount={totalAmount}
              hasKitchenItems={hasKitchenItems}
              hasBarOnlyItems={hasBarOnlyItems}
              onUpdateQty={updateQty}
              onRemoveFromCart={removeFromCart}
              onSetTable={setTable}
              onSetOrderType={setOrderType}
              onSendToKitchen={sendToKitchen}
              onHoldOrder={holdCurrentOrder}
              onClearCart={clearCart}
              editingNotes={editingNotes}
              noteText={noteText}
              onEditNotes={(id, notes) => {
                setEditingNotes(id);
                setNoteText(notes);
              }}
              onSaveNotes={saveItemNotes}
              onCancelNotes={() => {
                setEditingNotes(null);
                setNoteText('');
              }}
              onSetNoteText={setNoteText}
              disabled={!activeTill || currentCart.items.length === 0}
            />
          </div>
        )}
      </div>

      {/* ─── Open Till Modal ─── */}
      {showOpenTillModal && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-5"
          onClick={() => setShowOpenTillModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-border w-full max-w-[400px] rounded-2xl border p-6"
            style={{ animation: 'modalIn 0.2s ease' }}
          >
            <div className="text-text mb-1 text-lg font-bold">Open New Till</div>
            <div className="text-text-dim mb-5 text-xs">Give this till a name so your team can identify it.</div>
            <input
              value={newTillName}
              onChange={(e) => setNewTillName(e.target.value)}
              placeholder="e.g. Bar Till 1, Main Register, Patio"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleOpenTill();
              }}
              className="border-border bg-surface-alt text-text mb-4 box-border w-full rounded-[10px] border-[1.5px] px-3.5 py-3 font-[inherit] text-sm outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowOpenTillModal(false);
                  setNewTillName('');
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" icon={Plus} onClick={handleOpenTill} disabled={!newTillName.trim()}>
                Open Till
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Close Till Confirm ─── */}
      {showCloseTillConfirm && activeTill && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-5"
          onClick={() => setShowCloseTillConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-border w-full max-w-[400px] rounded-2xl border p-6"
          >
            <div className="text-text mb-1 text-lg font-bold">Close Till?</div>
            <div className="text-text-dim mb-5 text-[13px]">
              Are you sure you want to close <strong>{activeTill.name}</strong>? This till processed{' '}
              {activeTill.orderCount} order(s).
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCloseTillConfirm(false)}>
                Keep Open
              </Button>
              <Button variant="danger" icon={XCircle} onClick={handleCloseTill}>
                Close Till
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Drawers */}
      {showTillOrders && activeTill && (
        <TillOrdersDrawer till={activeTill} orders={tillOrdersSorted} onClose={() => setShowTillOrders(false)} />
      )}
      {showHeldOrders && activeTill && (
        <HeldOrdersDrawer
          till={activeTill}
          heldOrders={tillHeldOrders}
          onResume={resumeHeldOrder}
          onDiscard={discardHeldOrder}
          onClose={() => setShowHeldOrders(false)}
        />
      )}
    </div>
  );
};
