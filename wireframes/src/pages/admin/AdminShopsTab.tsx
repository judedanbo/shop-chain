import { useState } from 'react';
import { Search, ArrowLeft, Users as UsersIcon, GitBranch, Package, Calendar } from 'lucide-react';
import type { AdminShopRecord, AdminUserRecord } from '@/types/admin.types';
import { PLAN_TIERS } from '@/constants/plans';
import type { PlanId } from '@/types';
import type { AdminThemeColors } from '@/constants/adminThemes';

interface AdminShopsTabProps {
  C: AdminThemeColors;
  shops: AdminShopRecord[];
  users: AdminUserRecord[];
}

export function AdminShopsTab({ C, shops, users }: AdminShopsTabProps) {
  const [selectedShop, setSelectedShop] = useState<AdminShopRecord | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [shopFilter, setShopFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const filteredShops = shops.filter((s) => {
    if (shopFilter !== 'all' && s.status !== shopFilter) return false;
    if (
      shopSearch &&
      !s.name.toLowerCase().includes(shopSearch.toLowerCase()) &&
      !s.owner.toLowerCase().includes(shopSearch.toLowerCase())
    )
      return false;
    return true;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      active: { bg: `${C.success ?? ''}38`, color: C.success ?? '' },
      suspended: { bg: `${C.danger ?? ''}38`, color: C.danger ?? '' },
    };
    const s = map[status] ?? map['active']!;
    return (
      <span
        className="rounded-[5px] px-2 py-[2px] text-[10px] font-bold capitalize"
        style={{ background: s.bg, color: s.color }}
      >
        {status}
      </span>
    );
  };

  const planBadge = (planId: string) => {
    const p = PLAN_TIERS[planId as PlanId] ?? PLAN_TIERS.free;
    return (
      <span
        className="rounded-[5px] px-2 py-[2px] text-[10px] font-bold"
        style={{ background: `${p.color}35`, color: p.color }}
      >
        {p.icon} {p.name}
      </span>
    );
  };

  /* ── Shop Detail View ── */
  if (selectedShop) {
    const owner = users.find((u) => u.name === selectedShop.owner);
    return (
      <div>
        <div
          className="text-primary mb-5 flex cursor-pointer items-center gap-2 text-[13px] font-semibold"
          onClick={() => setSelectedShop(null)}
        >
          <ArrowLeft size={16} /> Back to Shops
        </div>

        {/* Header card */}
        <div className="bg-surface border-border mb-4 rounded-[14px] border-[1.5px] p-6">
          <div className="mb-5 flex items-center gap-4">
            <div className="bg-primary/[0.08] flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">
              {selectedShop.icon}
            </div>
            <div>
              <div className="text-text text-xl font-extrabold">{selectedShop.name}</div>
              <div className="text-text-dim text-xs">{selectedShop.type}</div>
              <div className="mt-1.5 flex gap-2">
                {planBadge(selectedShop.plan)} {statusBadge(selectedShop.status)}
              </div>
            </div>
          </div>

          {/* Owner info */}
          <div className="bg-surface-alt mb-4 rounded-[10px] p-3.5">
            <div className="form-label mb-2 font-semibold tracking-[0.5px]">Owner</div>
            <div className="flex flex-col gap-1">
              <div className="text-text text-[13px] font-bold">{owner?.name ?? selectedShop.owner}</div>
              <div className="text-text-muted text-xs">{owner?.email ?? 'N/A'}</div>
              <div className="text-text-muted text-xs">{owner?.phone ?? 'N/A'}</div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Created', value: selectedShop.created, icon: Calendar },
              { label: 'Plan', value: PLAN_TIERS[selectedShop.plan as PlanId]?.name ?? 'Free', icon: Package },
              { label: 'Branches', value: selectedShop.branches, icon: GitBranch },
              { label: 'Team', value: selectedShop.team, icon: UsersIcon },
            ].map((d, i) => (
              <div key={i} className="bg-surface-alt rounded-[10px] p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <d.icon size={12} className="text-text-dim" />
                  <span className="text-text-dim text-[10px] tracking-[0.5px] uppercase">{d.label}</span>
                </div>
                <div className="text-text text-sm font-bold">{d.value}</div>
              </div>
            ))}
          </div>

          {/* Status actions */}
          <div className="mt-4 flex gap-2">
            {selectedShop.status === 'active' ? (
              <button
                type="button"
                className="text-danger rounded-lg bg-transparent px-4 py-2 font-[inherit] text-xs font-bold"
                style={{
                  border: `1.5px solid ${C.danger}`,
                }}
              >
                Suspend Shop
              </button>
            ) : (
              <button
                type="button"
                className="text-success rounded-lg bg-transparent px-4 py-2 font-[inherit] text-xs font-bold"
                style={{
                  border: `1.5px solid ${C.success}`,
                }}
              >
                Reactivate Shop
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Shop List View ── */
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="text-text-dim absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            value={shopSearch}
            onChange={(e) => setShopSearch(e.target.value)}
            placeholder="Search shops..."
            className="bg-surface text-text border-border box-border w-full rounded-[10px] border-[1.5px] py-2.5 pr-3.5 pl-9 text-[13px] outline-none"
          />
        </div>
        <select
          value={shopFilter}
          onChange={(e) => setShopFilter(e.target.value as 'all' | 'active' | 'suspended')}
          className="bg-surface text-text border-border rounded-[10px] border-[1.5px] px-3.5 py-2.5 text-[13px] outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filteredShops.map((s) => (
          <div
            key={s.id}
            className="bg-surface border-border cursor-pointer rounded-[14px] border-[1.5px] p-[18px]"
            onClick={() => setSelectedShop(s)}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className="text-text text-[15px] font-bold">{s.name}</div>
                  <div className="text-text-dim text-[11px]">
                    {s.owner} · {s.type}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {planBadge(s.plan)} {statusBadge(s.status)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-alt rounded-lg px-2.5 py-2 text-center">
                <div className="mb-0.5 flex items-center justify-center gap-1">
                  <Package size={10} className="text-text-dim" />
                  <span className="text-text-dim text-[10px]">Products</span>
                </div>
                <div className="text-text text-base font-bold">&mdash;</div>
              </div>
              <div className="bg-surface-alt rounded-lg px-2.5 py-2 text-center">
                <div className="mb-0.5 flex items-center justify-center gap-1">
                  <GitBranch size={10} className="text-text-dim" />
                  <span className="text-text-dim text-[10px]">Branches</span>
                </div>
                <div className="text-text text-base font-bold">{s.branches}</div>
              </div>
              <div className="bg-surface-alt rounded-lg px-2.5 py-2 text-center">
                <div className="mb-0.5 flex items-center justify-center gap-1">
                  <UsersIcon size={10} className="text-text-dim" />
                  <span className="text-text-dim text-[10px]">Team</span>
                </div>
                <div className="text-text text-base font-bold">{s.team}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
