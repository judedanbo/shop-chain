import React from 'react';
import clsx from 'clsx';
import { Search, X, QrCode } from 'lucide-react';
import type { ThemeColors } from '@/types/theme.types';
import type { Product } from '@/types';

interface CartItem extends Product {
  qty: number;
}

export interface POSProductGridProps {
  search: string;
  setSearch: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  categories: string[];
  filtered: Product[];
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  setShowPosScanner: (val: boolean) => void;
  COLORS: ThemeColors;
}

export const POSProductGrid: React.FC<POSProductGridProps> = ({
  search,
  setSearch,
  category,
  setCategory,
  categories,
  filtered,
  products,
  cart,
  addToCart,
  setShowPosScanner,
  COLORS,
}) => {
  return (
    <>
      {/* Search + Scan */}
      <div className="mb-2.5 flex gap-2">
        <div className="border-border bg-surface flex flex-1 items-center gap-2 rounded-[10px] border-[1.5px] px-3 py-2">
          <Search size={16} className="text-text-dim shrink-0" />
          <input
            type="text"
            placeholder="Search product or scan barcode\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-text w-full border-none bg-transparent text-[13px] outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="shrink-0">
              <X size={14} className="text-text-dim" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowPosScanner(true)}
          aria-label="Scan barcode"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
        >
          <QrCode size={18} className="text-white" />
        </button>
      </div>

      {/* Category Chips */}
      <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setCategory(c)}
            className="rounded-[20px] px-3 py-[5px] text-[11px] font-semibold whitespace-nowrap transition-all duration-150"
            style={{
              background: category === c ? COLORS.primary : COLORS.surfaceAlt,
              color: category === c ? '#fff' : COLORS.textMuted,
              border: `1px solid ${category === c ? COLORS.primary : COLORS.border}`,
            }}
          >
            {c}
            <span className="ml-1 text-[9px] opacity-70">
              {c === 'All'
                ? products.filter((p) => p.stock > 0).length
                : products.filter((p) => p.category === c && p.stock > 0).length}
            </span>
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="xl2:grid-cols-5 grid flex-1 grid-cols-3 content-start gap-1.5 overflow-y-auto pt-2 pr-0.5 pb-[80px] md:gap-2 md:pb-2 lg:grid-cols-4">
        {filtered.map((p) => {
          const inCart = cart.find((i) => i.id === p.id);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-surface relative flex flex-col items-center gap-[3px] rounded-xl p-2 text-center transition-all duration-150 md:p-2.5"
              style={{
                border: `1.5px solid ${inCart ? COLORS.primary + '60' : COLORS.border}`,
              }}
            >
              <div className="bg-surface-alt flex size-9 items-center justify-center rounded-[10px] text-[18px] md:size-11 md:text-[22px]">
                {p.image}
              </div>
              <div className="text-text w-full overflow-hidden text-[10px] leading-tight font-semibold text-ellipsis whitespace-nowrap md:text-[11px]">
                {p.name}
              </div>
              <div className="flex w-full items-center justify-between">
                <span className="text-primary font-mono text-[10px] font-semibold md:text-[11px]">
                  GH₵ {p.price.toFixed(2)}
                </span>
                <span className={clsx('text-[9px]', p.stock < (p.reorder || 30) ? 'text-danger' : 'text-text-dim')}>
                  {p.stock < (p.reorder || 30) ? `\u26A0 ${p.stock}` : p.stock}
                </span>
              </div>
              {inCart && (
                <div className="bg-primary absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  {inCart.qty}
                </div>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-text-dim col-span-full p-10 text-center text-[13px]">
            No products found matching &quot;{search}&quot;
          </div>
        )}
      </div>
    </>
  );
};
