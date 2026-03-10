import React, { useState } from 'react';
import { Store, ArrowLeft, MapPin, Users, Plus, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { useColors } from '@/context';
import { isMobile } from '@/utils/responsive';
import { ShopLogo } from '@/components/features/ShopLogo';
import type { Breakpoint } from '@/constants/breakpoints';

interface DemoShopBranch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  gps: string;
  latitude: string;
  longitude: string;
  hours: string;
  customOpen: string;
  customClose: string;
  customDays: string;
  status: string;
  products: number;
  revenue: string;
  lastActive: string;
  team: unknown[];
}

interface DemoShop {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  members: number;
  role: string;
  city: string;
  lastActive: string;
  products: number;
  revenue: string;
  branches: DemoShopBranch[];
  logoUrl?: string;
  activeBranch?: DemoShopBranch;
}

const DEMO_SHOPS: DemoShop[] = [
  {
    id: 'shop-001',
    name: "Kofi's Mini Mart",
    type: 'Retail Store',
    icon: '🏪',
    color: '#6C5CE7',
    members: 5,
    role: 'Owner',
    city: 'Accra',
    lastActive: '2 hours ago',
    products: 124,
    revenue: 'GH₵ 45,200',
    branches: [
      {
        id: 'br-001',
        name: 'Osu Branch',
        city: 'Osu, Accra',
        address: '24 Oxford St, Osu',
        phone: '+233 24 555 1001',
        gps: 'GA-141-5522',
        latitude: '5.556380',
        longitude: '-0.182560',
        hours: 'same_as_parent',
        customOpen: '',
        customClose: '',
        customDays: '',
        status: 'active',
        products: 68,
        revenue: 'GH₵ 22,100',
        lastActive: '1 hour ago',
        team: [],
      },
      {
        id: 'br-002',
        name: 'Madina Branch',
        city: 'Madina, Accra',
        address: '15 Madina Market Rd',
        phone: '+233 24 555 1002',
        gps: 'GA-320-7890',
        latitude: '5.671200',
        longitude: '-0.170340',
        hours: 'custom',
        customOpen: '06:30',
        customClose: '21:00',
        customDays: 'Mon \u2013 Sat',
        status: 'active',
        products: 56,
        revenue: 'GH₵ 23,100',
        lastActive: '3 hours ago',
        team: [],
      },
    ],
  },
  {
    id: 'shop-002',
    name: 'Kumasi Wholesale Hub',
    type: 'Wholesale',
    icon: '🏭',
    color: '#2E86DE',
    members: 12,
    role: 'Manager',
    city: 'Kumasi',
    lastActive: 'Yesterday',
    products: 890,
    revenue: 'GH₵ 312,000',
    branches: [],
  },
  {
    id: 'shop-003',
    name: 'Adabraka Pharmacy',
    type: 'Pharmacy',
    icon: '💊',
    color: '#27AE60',
    members: 3,
    role: 'Inventory Manager',
    city: 'Accra',
    lastActive: '3 days ago',
    products: 456,
    revenue: 'GH₵ 89,750',
    branches: [],
  },
];

interface ShopSelectScreenProps {
  bp: Breakpoint;
  onSelectShop: (shop: DemoShop) => void;
  onCreateShop: () => void;
  onLogout: () => void;
}

export const ShopSelectScreen: React.FC<ShopSelectScreenProps> = ({ onSelectShop, onCreateShop, onLogout, bp }) => {
  const COLORS = useColors();
  const mobile = isMobile(bp);
  const [expandedShops, setExpandedShops] = useState<Record<string, boolean>>({});

  return (
    <div className="bg-bg relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient blobs */}
      <div className="bg-primary/[0.02] pointer-events-none absolute top-[-140px] right-[-100px] h-[350px] w-[350px] rounded-full blur-[100px]" />
      <div className="bg-accent/[0.02] pointer-events-none absolute bottom-[-120px] left-[-60px] h-[280px] w-[280px] rounded-full blur-[100px]" />

      {/* Header bar */}
      <div className="bg-surface border-border relative z-[1] flex items-center justify-between border-b px-5 py-4 sm:px-8 md:px-12">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            }}
          >
            <Store size={18} className="text-white" />
          </div>
          <span className="text-text text-base font-bold">ShopChain</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
              }}
            >
              JA
            </div>
            {!mobile && <span className="text-text text-[13px] font-semibold">Jude Appiah</span>}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="border-border text-text-muted hover:border-danger hover:text-danger flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <ArrowLeft size={13} /> {!mobile && 'Log out'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-[900px] flex-1 px-5 py-7 sm:px-8 sm:py-10 md:px-12 md:py-12">
        {/* Welcome */}
        <div className="mb-7 sm:mb-9">
          <div className="text-primary mb-1.5 text-sm font-bold">👋 Welcome back</div>
          <h1 className="text-text mx-0 mt-0 mb-2 text-2xl font-extrabold tracking-[-0.5px] sm:text-[30px]">
            Choose your shop
          </h1>
          <p className="text-text-dim m-0 text-sm">Select a shop to manage, or create a new one to get started.</p>
        </div>

        {/* Shop list */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {DEMO_SHOPS.map((shop) => {
            const hasBranches = shop.branches && shop.branches.length > 0;
            const expanded = expandedShops[shop.id];
            return (
              <div key={shop.id}>
                {/* Parent shop card */}
                <div
                  className="bg-surface hover:border-primary hover:shadow-primary/[0.06] relative flex cursor-pointer flex-col gap-3.5 overflow-hidden p-[18px] transition-all duration-200 hover:shadow-lg sm:p-[22px]"
                  style={{
                    borderRadius: hasBranches && expanded ? '16px 16px 0 0' : 16,
                    border: `1.5px solid ${COLORS.border}`,
                  }}
                >
                  <div
                    className="absolute top-0 right-0 left-0 h-[3px]"
                    style={{
                      background: `linear-gradient(90deg, ${shop.color}, ${shop.color}80)`,
                    }}
                  />

                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => onSelectShop(shop)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <ShopLogo
                        shop={shop}
                        size={48}
                        borderRadius={14}
                        fontSize={24}
                        style={{
                          background: shop.logoUrl ? 'transparent' : `${shop.color}15`,
                          border: shop.logoUrl ? `1.5px solid ${COLORS.border}` : `2px solid ${shop.color}25`,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-text truncate text-base font-bold">{shop.name}</span>
                          {hasBranches && (
                            <span className="bg-primary-bg text-primary border-primary/[0.13] shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-bold">
                              HQ
                            </span>
                          )}
                        </div>
                        <div className="text-text-dim flex items-center gap-1 text-xs">
                          <MapPin size={11} /> {shop.city} &middot; {shop.type}
                        </div>
                      </div>
                    </button>

                    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                      <span
                        className="rounded-[20px] px-2.5 py-[3px] text-[11px] font-bold"
                        style={{
                          background: shop.role === 'Owner' ? COLORS.primaryBg : COLORS.surfaceAlt,
                          color: shop.role === 'Owner' ? COLORS.primary : COLORS.textMuted,
                          border: `1px solid ${shop.role === 'Owner' ? COLORS.primary + '30' : COLORS.border}`,
                        }}
                      >
                        {shop.role === 'Owner' ? '👑' : '🔹'} {shop.role}
                      </span>
                      <span className="bg-surface-alt text-text-muted rounded-[20px] px-2.5 py-[3px] text-[11px] font-medium">
                        <Users size={10} className="mr-[3px] align-middle" />
                        {shop.members}
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <button
                    type="button"
                    onClick={() => onSelectShop(shop)}
                    className="border-border flex w-full gap-0 border-t pt-3 text-left"
                  >
                    <div className="flex-1">
                      <div className="form-label font-semibold tracking-wide">Products</div>
                      <div className="text-text font-mono text-[15px] font-bold">{shop.products}</div>
                    </div>
                    <div className="flex-1">
                      <div className="form-label font-semibold tracking-wide">Revenue</div>
                      <div className="text-success font-mono text-[15px] font-bold">{shop.revenue}</div>
                    </div>
                    {hasBranches && (
                      <div className="flex-1">
                        <div className="form-label font-semibold tracking-wide">Branches</div>
                        <div className="text-primary font-mono text-[15px] font-bold">{shop.branches.length}</div>
                      </div>
                    )}
                  </button>

                  {/* Branch expand toggle */}
                  {hasBranches && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedShops((prev) => ({ ...prev, [shop.id]: !prev[shop.id] }));
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150"
                      style={{
                        background: expanded ? COLORS.primaryBg : COLORS.surfaceAlt,
                        border: `1px solid ${expanded ? COLORS.primary + '25' : COLORS.border}`,
                        color: expanded ? COLORS.primary : COLORS.textMuted,
                      }}
                    >
                      <Building2 size={13} />
                      {expanded ? 'Hide' : 'Show'} {shop.branches.length}{' '}
                      {shop.branches.length === 1 ? 'Branch' : 'Branches'}
                      <ChevronDown
                        size={13}
                        className="transition-transform duration-200"
                        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}
                      />
                    </button>
                  )}
                </div>

                {/* Expanded branches */}
                {hasBranches && expanded && (
                  <div
                    className="bg-surface-alt border-border overflow-hidden rounded-b-2xl border-[1.5px] border-t-0"
                    style={{
                      animation: 'modalIn 0.2s ease',
                    }}
                  >
                    {/* Tree connector header */}
                    <div className="bg-surface text-text-dim border-border flex items-center gap-2 border-b px-[18px] py-2.5 text-[11px] font-semibold">
                      <Building2 size={13} className="text-primary" />
                      Branches of {shop.name}
                    </div>
                    {shop.branches.map((branch, bi) => (
                      <button
                        type="button"
                        key={branch.id}
                        onClick={() => onSelectShop({ ...shop, activeBranch: branch })}
                        className="hover:bg-primary-bg relative flex w-full items-center gap-3 px-[18px] py-3.5 text-left transition-all duration-150"
                        style={{
                          borderBottom: bi < shop.branches.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                        }}
                      >
                        {/* Tree connector line */}
                        <div className="flex w-5 shrink-0 flex-col items-center">
                          <div className="bg-border w-[1.5px]" style={{ height: bi === 0 ? 10 : 20 }} />
                          <div className="bg-border h-[1.5px] w-2.5 self-end" />
                          {bi < shop.branches.length - 1 && <div className="bg-border w-[1.5px] flex-1" />}
                        </div>

                        <div className="border-primary/[0.08] bg-primary/[0.06] flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-[1.5px]">
                          <Building2 size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-text text-sm font-bold">{branch.name}</span>
                            <span
                              className="rounded-[6px] px-1.5 py-px text-[9px] font-bold"
                              style={{
                                background: branch.status === 'active' ? COLORS.successBg : '#F59E0B15',
                                color: branch.status === 'active' ? COLORS.success : '#F59E0B',
                              }}
                            >
                              {branch.status === 'active' ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div className="text-text-dim flex items-center gap-1 text-[11px]">
                            <MapPin size={10} /> {branch.city}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-4">
                          <div className="text-right">
                            <div className="text-text-dim text-[9px] font-semibold uppercase">Products</div>
                            <div className="text-text font-mono text-[13px] font-bold">{branch.products || 0}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-text-dim text-[9px] font-semibold uppercase">Revenue</div>
                            <div className="text-success font-mono text-[13px] font-bold">
                              {branch.revenue || 'GH₵ 0'}
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-text-dim shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Create New Shop card */}
          <button
            type="button"
            onClick={onCreateShop}
            className="border-border hover:border-primary hover:bg-primary-bg flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-[18px] text-center transition-all duration-200 sm:p-[22px]"
          >
            <div className="bg-surface-alt border-border flex h-14 w-14 items-center justify-center rounded-2xl border-[1.5px] transition-all duration-200">
              <Plus size={24} className="text-primary" />
            </div>
            <div>
              <div className="text-text mb-1 text-[15px] font-bold">Create a New Shop</div>
              <div className="text-text-dim text-xs">Set up a new business in minutes</div>
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-text-dim px-5 py-4 text-center text-[11px]">
        &copy; 2026 ShopChain &middot; <span className="text-text-muted cursor-pointer">Terms</span> &middot;{' '}
        <span className="text-text-muted cursor-pointer">Privacy</span> &middot;{' '}
        <span className="text-text-muted cursor-pointer">Help</span>
      </div>
    </div>
  );
};
