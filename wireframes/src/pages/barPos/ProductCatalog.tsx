import React from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';
import { useColors } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isSmall } from '@/utils/responsive';
import type { Product } from '@/types';

interface CartItemRef {
  id: string;
  qty: number;
}

interface ProductCatalogProps {
  products: Product[];
  search: string;
  setSearch: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  categories: string[];
  onAddToCart: (product: Product) => void;
  currentCartItems: CartItemRef[];
  hasTill: boolean;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  search,
  setSearch,
  category,
  setCategory,
  categories,
  onAddToCart,
  currentCartItems,
  hasTill,
}) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const small = isSmall(bp);

  return (
    <>
      {/* Search + Category */}
      <div className="flex flex-col gap-2" style={{ padding: small ? '10px 12px' : '0 0 12px 0' }}>
        <div className="relative">
          <Search size={16} className="text-text-dim absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] py-2.5 pr-3.5 pl-[38px] font-[inherit] text-[13px] outline-none"
          />
          {search && (
            <X
              size={14}
              onClick={() => setSearch('')}
              className="text-text-dim absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
            />
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategory(cat)}
              className="rounded-[20px] px-3 py-[5px] font-[inherit] text-[11px] font-semibold whitespace-nowrap"
              style={{
                border: `1px solid ${cat === category ? COLORS.primary : COLORS.border}`,
                background: cat === category ? COLORS.primaryBg : 'transparent',
                color: cat === category ? COLORS.primary : COLORS.textMuted,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-auto" style={{ padding: small ? '0 12px 12px' : 0 }}>
        <div className="xl2:grid-cols-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4 lg:gap-3">
          {products.map((product) => {
            const inCart = currentCartItems.find((i) => i.id === product.id);
            return (
              <div
                key={product.id}
                onClick={() => onAddToCart(product)}
                className={clsx(
                  'relative flex flex-col gap-1.5 rounded-xl border-[1.5px] p-2.5 transition-all duration-150 sm:p-3 lg:p-[14px]',
                  inCart ? 'border-primary/[0.38] bg-primary-bg' : 'border-border bg-surface',
                  hasTill ? 'hover:border-primary cursor-pointer' : 'cursor-not-allowed',
                )}
              >
                <div className="text-center text-[28px] sm:text-[32px] lg:text-[36px]">{product.image}</div>
                <div className="text-text text-[11px] leading-[1.3] font-semibold sm:text-xs">{product.name}</div>
                <div className="text-text-dim flex items-center gap-1 text-[11px]">
                  {product.category}
                  {product.skipKitchen && (
                    <span className="text-accent bg-accent-bg rounded px-[5px] py-px text-[9px] font-bold">Bar</span>
                  )}
                </div>
                <div className="text-primary text-[13px] font-bold">GH₵ {product.price.toFixed(2)}</div>
                {product.stock <= product.reorder && (
                  <div className="text-warning text-[9px] font-semibold">{product.stock} left</div>
                )}
                {inCart && (
                  <div className="bg-primary absolute top-1.5 right-1.5 rounded-[10px] px-[7px] py-px text-[10px] font-bold text-white">
                    {inCart.qty}
                  </div>
                )}
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="text-text-dim col-span-full p-10 text-center">
              <Search size={24} className="mx-auto mb-2 opacity-40" />
              <div className="text-[13px]">No items found</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
