import { LayoutDashboard, ShoppingCart, Box, FileText, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import type { PageId } from '@/types';

export interface MobileNavProps {
  onOpenMenu: () => void;
}

export function MobileNav({ onOpenMenu }: MobileNavProps) {
  const COLORS = useColors();
  const { page, setPage } = useNavigation();

  const items = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Box },
    { id: 'purchaseOrders', label: 'Orders', icon: FileText },
    { id: 'more', label: 'More', icon: Menu },
  ];

  return (
    <div className="bg-surface border-border z-mobile-nav fixed right-0 bottom-0 left-0 flex h-[60px] items-center justify-around border-t pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-[12px] sm:hidden">
      {items.map((item) => {
        const isMore = item.id === 'more';
        const isActive =
          !isMore &&
          (page === item.id ||
            (item.id === 'products' && ['products', 'addProduct', 'editProduct', 'productDetail'].includes(page)) ||
            (item.id === 'purchaseOrders' && ['purchaseOrders', 'poDetail'].includes(page)));
        const Icon = item.icon;
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => (isMore ? onOpenMenu() : setPage(item.id as PageId))}
            className="flex min-w-[52px] flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-all duration-150"
            style={{ color: isActive ? COLORS.primary : COLORS.textMuted }}
          >
            <Icon size={20} style={{ color: isActive ? COLORS.primary : COLORS.textDim }} />
            <span className={clsx('text-[9px] tracking-[0.2px]', isActive ? 'font-bold' : 'font-medium')}>
              {item.label}
            </span>
            {isActive && <div className="bg-primary -mt-px size-1 rounded-full" />}
          </button>
        );
      })}
    </div>
  );
}
