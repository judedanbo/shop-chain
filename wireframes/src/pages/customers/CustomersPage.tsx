import { useState } from 'react';
import {
  Search,
  Plus,
  X,
  ChevronRight,
  ArrowLeft,
  Edit,
  ShoppingCart,
  Users,
  User,
  Building2,
  DollarSign,
  TrendingUp,
  Star,
  UserPlus,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { paginate } from '@/utils/pagination';
import { Card, Button, Paginator, StatCard } from '@/components/ui';
import type { Customer } from '@/types';

interface CustomersPageProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export const CustomersPage = ({ customers, setCustomers }: CustomersPageProps) => {
  const bp = useBreakpoint();
  const { setPage } = useNavigation();
  const COLORS = useColors();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [custForm, setCustForm] = useState({ name: '', phone: '', email: '', type: 'regular', notes: '' });
  const [custPage, setCustPage] = useState(1);

  const mobile = isMobile(bp);

  const filtered = customers.filter((c) => {
    if (filter !== 'all' && c.type !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !c.name.toLowerCase().includes(s) &&
        !c.phone.includes(s) &&
        !(c.email && c.email.toLowerCase().includes(s)) &&
        !c.id.toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  const typeColors: Record<string, string> = { regular: '#3B82F6', wholesale: '#8B5CF6', 'walk-in': '#6B7280' };
  const typeIcons: Record<string, string> = { regular: '\u{1F464}', wholesale: '\u{1F3E2}', 'walk-in': '\u{1F6B6}' };
  const stats = {
    total: customers.length,
    regular: customers.filter((c) => c.type === 'regular').length,
    wholesale: customers.filter((c) => c.type === 'wholesale').length,
    totalRevenue: customers.reduce((s, c) => s + c.totalSpent, 0),
  };

  const handleAdd = () => {
    if (!custForm.name.trim() || !custForm.phone.trim()) return;
    const newCust: Customer = {
      id: `CUS-${String(customers.length + 1).padStart(3, '0')}`,
      name: custForm.name.trim(),
      phone: custForm.phone.trim(),
      email: custForm.email.trim(),
      type: custForm.type as Customer['type'],
      notes: custForm.notes.trim(),
      totalSpent: 0,
      visits: 0,
      lastVisit: null,
      createdAt: new Date().toISOString().slice(0, 10),
      loyaltyPts: 0,
    };
    setCustomers((prev) => [newCust, ...prev]);
    setShowAdd(false);
    setCustForm({ name: '', phone: '', email: '', type: 'regular', notes: '' });
  };

  // ── Customer Detail View ──
  if (selectedCustomer) {
    const c = customers.find((x) => x.id === selectedCustomer);
    if (!c) {
      setSelectedCustomer(null);
      return null;
    }
    const mockPurchases = [
      { id: 'TXN-20260212-0041', date: '2026-02-12', items: 5, total: 187.5, method: 'MoMo' },
      { id: 'TXN-20260209-0028', date: '2026-02-09', items: 3, total: 94.0, method: 'Cash' },
      { id: 'TXN-20260205-0015', date: '2026-02-05', items: 8, total: 312.5, method: 'Card' },
      { id: 'TXN-20260130-0092', date: '2026-01-30', items: 2, total: 53.0, method: 'Cash' },
      { id: 'TXN-20260125-0067', date: '2026-01-25', items: 6, total: 245.0, method: 'MoMo' },
      { id: 'TXN-20260118-0044', date: '2026-01-18', items: 4, total: 156.0, method: 'Cash' },
    ];
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 md:mb-5">
          <button
            type="button"
            onClick={() => setSelectedCustomer(null)}
            className="border-border text-text-muted flex items-center gap-1.5 rounded-[10px] border bg-transparent px-4 py-2 font-[inherit] text-xs font-semibold"
          >
            <ArrowLeft size={14} /> All Customers
          </button>
          <div className="flex gap-1.5">
            <Button variant="ghost" icon={Edit} size="sm">
              Edit
            </Button>
            <Button variant="primary" icon={ShoppingCart} size="sm" onClick={() => setPage('pos')}>
              New Sale
            </Button>
          </div>
        </div>

        {/* Customer Header */}
        <Card className="mb-4 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[18px] text-[28px] font-extrabold"
              style={{
                background: `${typeColors[c.type]}15`,
                color: typeColors[c.type],
              }}
            >
              {c.name[0]}
            </div>
            <div className="min-w-[200px] flex-1">
              <div className="text-text text-[18px] font-extrabold md:text-[22px]">{c.name}</div>
              <div className="text-text-dim mt-0.5 text-xs">
                {c.phone}
                {c.email ? ` \u00B7 ${c.email}` : ''}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className="rounded-[6px] px-2.5 py-[3px] text-[10px] font-bold capitalize"
                  style={{
                    background: `${typeColors[c.type]}15`,
                    color: typeColors[c.type],
                  }}
                >
                  {typeIcons[c.type]} {c.type}
                </span>
                <span className="bg-surface-alt text-text-dim rounded-[6px] px-2.5 py-[3px] text-[10px] font-semibold">
                  Since {c.createdAt}
                </span>
                {c.loyaltyPts > 0 && (
                  <span className="bg-warning/[0.08] text-warning rounded-[6px] px-2.5 py-[3px] text-[10px] font-bold">
                    {'\u2B50'} {c.loyaltyPts} pts
                  </span>
                )}
              </div>
            </div>
          </div>
          {c.notes && (
            <div className="bg-surface-alt border-border text-text-dim mt-3.5 rounded-[10px] border p-3 text-xs leading-relaxed">
              {'\u{1F4DD}'} {c.notes}
            </div>
          )}
        </Card>

        {/* KPIs */}
        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            {
              label: 'Total Spent',
              value: `GH\u20B5 ${c.totalSpent.toLocaleString()}`,
              color: COLORS.success,
              icon: DollarSign,
            },
            { label: 'Total Visits', value: c.visits, color: COLORS.primary, icon: ShoppingCart },
            {
              label: 'Avg per Visit',
              value: `GH\u20B5 ${c.visits > 0 ? (c.totalSpent / c.visits).toFixed(0) : 0}`,
              color: COLORS.accent,
              icon: TrendingUp,
            },
            { label: 'Loyalty Points', value: c.loyaltyPts, color: COLORS.warning, icon: Star },
          ].map((s, i) => (
            <StatCard key={i} {...s} glyphSize={18} labelFontSize={10} />
          ))}
        </div>

        {/* Purchase History */}
        <Card className="p-3.5 md:p-5">
          <div className="text-text mb-3.5 text-sm font-extrabold">Purchase History</div>
          <div className="border-border overflow-hidden rounded-[10px] border">
            {!mobile && (
              <div
                className="form-label bg-surface-alt grid px-4 py-2.5"
                style={{
                  gridTemplateColumns: '1.5fr 1fr 0.5fr 1fr 1fr',
                }}
              >
                <span>Transaction</span>
                <span>Date</span>
                <span>Items</span>
                <span>Total</span>
                <span>Payment</span>
              </div>
            )}
            {mockPurchases.map((p, i) => (
              <div
                key={p.id}
                className={clsx('px-4 py-3', i % 2 !== 0 && 'bg-surface-alt')}
                style={{
                  display: mobile ? 'flex' : 'grid',
                  gridTemplateColumns: mobile ? undefined : '1.5fr 1fr 0.5fr 1fr 1fr',
                  flexDirection: mobile ? 'column' : undefined,
                  gap: mobile ? 3 : 0,
                  borderTop: `1px solid ${COLORS.border}`,
                  alignItems: mobile ? 'flex-start' : 'center',
                }}
              >
                <span className="text-primary font-mono text-[11px] font-semibold">{p.id}</span>
                <span className="text-text-dim text-[11px]">{p.date}</span>
                <span className="text-text text-[11px] font-semibold">{p.items}</span>
                <span className="text-text font-mono text-xs font-bold">GH\u20B5 {p.total.toFixed(2)}</span>
                <span
                  className="inline-block w-fit rounded-[5px] px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background:
                      p.method === 'Cash'
                        ? `${COLORS.success}12`
                        : p.method === 'MoMo'
                          ? '#FFCB0518'
                          : `${COLORS.primary}12`,
                    color: p.method === 'Cash' ? COLORS.success : p.method === 'MoMo' ? '#B8860B' : COLORS.primary,
                  }}
                >
                  {p.method === 'Cash' ? '\u{1F4B5}' : p.method === 'MoMo' ? '\u{1F4F1}' : '\u{1F4B3}'} {p.method}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ── Main Customer List ──
  return (
    <div>
      {/* Page Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 md:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary-bg flex size-9 items-center justify-center rounded-[10px] md:size-[42px]">
            <UserPlus size={bp === 'sm' ? 18 : 22} className="text-primary" />
          </div>
          <div>
            <div className="text-text text-base font-bold md:text-xl">Customers</div>
            <div className="text-text-dim text-[11px]">Shared across all branches</div>
          </div>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setCustForm({ name: '', phone: '', email: '', type: 'regular', notes: '' });
            setShowAdd(true);
          }}
        >
          Add Customer
        </Button>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Total Customers', value: stats.total, color: COLORS.primary, icon: Users },
          { label: 'Regular', value: stats.regular, color: '#3B82F6', icon: User },
          { label: 'Wholesale', value: stats.wholesale, color: '#8B5CF6', icon: Building2 },
          {
            label: 'Total Revenue',
            value: `GH\u20B5 ${stats.totalRevenue.toLocaleString()}`,
            color: COLORS.success,
            icon: DollarSign,
          },
        ].map((s, i) => (
          <Card key={i} padding={16} className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: `${s.color}15`,
              }}
            >
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-xl font-black" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-text-dim text-[10px]">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'regular', label: '\u{1F464} Regular' },
            { id: 'wholesale', label: '\u{1F3E2} Wholesale' },
            { id: 'walk-in', label: '\u{1F6B6} Walk-in' },
          ].map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                'rounded-lg px-3.5 py-[7px] font-[inherit] text-[11px]',
                filter === f.id ? 'bg-primary-bg text-primary font-bold' : 'text-text-muted font-medium',
              )}
              style={{
                border: filter === f.id ? `1.5px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative min-w-[200px]">
          <Search
            size={14}
            className="text-text-dim absolute top-1/2 left-2.5"
            style={{ transform: 'translateY(-50%)' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone..."
            className="border-border bg-surface text-text w-full rounded-[10px] border-[1.5px] py-2 pr-3 pl-8 font-[inherit] text-xs outline-none"
          />
        </div>
      </div>

      {/* Customer Table */}
      <Card noPadding className="overflow-hidden">
        {!mobile && (
          <div
            className="form-label bg-surface-alt border-border grid border-b px-4 py-2.5"
            style={{
              gridTemplateColumns: '2fr 1.2fr 80px 1fr 80px 30px',
            }}
          >
            <span>Customer</span>
            <span>Phone</span>
            <span>Type</span>
            <span>Total Spent</span>
            <span>Visits</span>
            <span />
          </div>
        )}
        {paginate(filtered, custPage, 10).items.map((c, i) => (
          <div
            key={c.id}
            onClick={() => setSelectedCustomer(c.id)}
            className={clsx('cursor-pointer px-4 py-3', i % 2 !== 0 && 'bg-surface-alt')}
            style={{
              display: mobile ? 'flex' : 'grid',
              gridTemplateColumns: mobile ? undefined : '2fr 1.2fr 80px 1fr 80px 30px',
              flexDirection: mobile ? 'column' : undefined,
              gap: mobile ? 4 : 0,
              borderTop: i > 0 ? `1px solid ${COLORS.border}` : 'none',
              alignItems: mobile ? 'flex-start' : 'center',
            }}
          >
            {/* Name + Email */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold"
                style={{
                  background: `${typeColors[c.type]}15`,
                  color: typeColors[c.type],
                }}
              >
                {c.name[0]}
              </div>
              <div>
                <div className="text-text text-[13px] font-bold">{c.name}</div>
                <div className="text-text-dim text-[10px]">{c.email || c.id}</div>
              </div>
            </div>
            <span className="text-text-muted font-mono text-[11px]">{c.phone}</span>
            <span
              className="inline-block w-fit rounded-[5px] px-2 py-[3px] text-[9px] font-bold capitalize"
              style={{
                background: `${typeColors[c.type]}12`,
                color: typeColors[c.type],
              }}
            >
              {c.type}
            </span>
            <span className="text-text font-mono text-xs font-bold">GH\u20B5 {c.totalSpent.toLocaleString()}</span>
            <span className="text-text-muted text-[11px]">{c.visits}</span>
            <ChevronRight size={14} className="text-text-dim" />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-text-dim p-10 text-center text-xs">No customers match your search.</div>
        )}
      </Card>
      <Paginator {...paginate(filtered, custPage, 10)} perPage={10} onPage={(v: number) => setCustPage(v)} />

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <Card padding={24} className="w-full max-w-[480px]" style={{ animation: 'modalIn 0.2s ease' }}>
            <div className="mb-5 flex items-center justify-between">
              <div className="text-text text-base font-extrabold">Add Customer</div>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Close" className="text-text-dim">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-text-dim mb-1.5 block text-[11px] font-bold">Full Name *</label>
                <input
                  value={custForm.name}
                  onChange={(e) => setCustForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Kwame Mensah"
                  className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] px-3.5 py-2.5 font-[inherit] text-[13px] outline-none"
                />
              </div>
              <div>
                <label className="text-text-dim mb-1.5 block text-[11px] font-bold">Phone Number *</label>
                <input
                  value={custForm.phone}
                  onChange={(e) => setCustForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+233 24 XXX XXXX"
                  className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] px-3.5 py-2.5 font-[inherit] text-[13px] outline-none"
                />
              </div>
              <div>
                <label className="text-text-dim mb-1.5 block text-[11px] font-bold">Email (Optional)</label>
                <input
                  value={custForm.email}
                  onChange={(e) => setCustForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] px-3.5 py-2.5 font-[inherit] text-[13px] outline-none"
                />
              </div>
              <div>
                <label className="text-text-dim mb-1.5 block text-[11px] font-bold">Customer Type</label>
                <div className="flex gap-1.5">
                  {[
                    { v: 'regular', l: '\u{1F464} Regular' },
                    { v: 'wholesale', l: '\u{1F3E2} Wholesale' },
                    { v: 'walk-in', l: '\u{1F6B6} Walk-in' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.v}
                      onClick={() => setCustForm((p) => ({ ...p, type: t.v }))}
                      className="flex-1 rounded-[10px] px-2 py-2.5 font-[inherit] text-[11px] font-semibold"
                      style={{
                        border: `1.5px solid ${custForm.type === t.v ? typeColors[t.v] : COLORS.border}`,
                        background: custForm.type === t.v ? `${typeColors[t.v]}10` : 'transparent',
                        color: custForm.type === t.v ? typeColors[t.v] : COLORS.textMuted,
                      }}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-text-dim mb-1.5 block text-[11px] font-bold">Notes (Optional)</label>
                <textarea
                  value={custForm.notes}
                  onChange={(e) => setCustForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Special pricing, preferences..."
                  rows={2}
                  className="border-border bg-surface-alt text-text box-border w-full resize-y rounded-[10px] border-[1.5px] px-3.5 py-2.5 font-[inherit] text-xs outline-none"
                />
              </div>
            </div>
            <div className="border-border mt-5 flex justify-end gap-2.5 border-t pt-4">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={handleAdd}
                disabled={!custForm.name.trim() || !custForm.phone.trim()}
              >
                Add Customer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
