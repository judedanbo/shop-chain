import React, { useState } from 'react';
import {
  Save,
  CheckCircle,
  Eye,
  Settings,
  Store,
  MapPin,
  GitBranch,
  CreditCard,
  Zap,
  AlertTriangle,
  Trash2,
  X,
  Plus,
  Phone,
  Building2,
  Archive,
  Bell,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useColors, useAuth, useShop, useNotifications, type AppBranch } from '@/context';
import { TabButton } from '@/components/ui';
import { ROLES, DEFAULT_PERMISSIONS, DISCOUNT_ROLE_LIMITS } from '@/constants/demoData';
import type { NotificationChannel } from '@/types';

/* ── Local constants ── */
const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail Store', icon: '🏪', desc: 'General retail' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊', desc: 'Drugs & health' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️', desc: 'Food & drinks' },
  { value: 'wholesale', label: 'Wholesale', icon: '📦', desc: 'Bulk distribution' },
  { value: 'electronics', label: 'Electronics', icon: '💻', desc: 'Tech & gadgets' },
  { value: 'fashion', label: 'Fashion', icon: '👗', desc: 'Clothing & accessories' },
];

const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

const NOTIF_CATEGORY_LABELS: Record<string, { label: string; desc: string }> = {
  stock_alert: { label: 'Stock Alerts', desc: 'Low stock, out of stock, expiring products' },
  order_update: { label: 'Order Updates', desc: 'Purchase order status changes, goods received' },
  sale_event: { label: 'Sale Events', desc: 'Discounts applied, reversals completed' },
  approval_request: { label: 'Approval Requests', desc: 'Reversal approvals, PO approvals' },
  team_update: { label: 'Team Updates', desc: 'New members, role changes, permissions' },
  system: { label: 'System', desc: 'Plan limits, billing, maintenance alerts' },
  customer: { label: 'Customer', desc: 'New customers, loyalty milestones' },
};

const CHANNEL_LABELS: Record<string, string> = {
  in_app: 'In-App',
  push: 'Push',
  email: 'Email',
  sms: 'SMS',
};

const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Oti',
  'Savannah',
  'North East',
  'Western North',
];

const LOGO_EMOJIS = ['🏪', '🛒', '🏬', '🏭', '💊', '🍽️', '📦', '🧴', '☕', '🥘', '🧊', '🍞', '🔧', '🌿', '💻', '👗'];

interface ShopSettingsPageProps {
  onDeleteShop: () => void;
  onArchiveShop?: () => void;
}

export const ShopSettingsPage: React.FC<ShopSettingsPageProps> = ({ onDeleteShop }) => {
  const COLORS = useColors();
  const { activeShop, setActiveShop } = useAuth();
  const { hasFullAccess, rolePerms } = useShop();
  const canEdit = hasFullAccess('set_shop') || rolePerms['set_shop'] === 'partial';
  const { preferences: notifPrefs, updateCategoryPref, updatePreferences } = useNotifications();
  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [_deleteSuccess, setDeleteSuccess] = useState(false);
  const [_showArchive, setShowArchive] = useState(false);
  const [branches, setBranches] = useState<
    (AppBranch & { city?: string; phone?: string; address?: string; gps?: string })[]
  >(activeShop?.branches || []);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', city: '', address: '', phone: '', gps: '' });

  // Geolocation state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  // Receipt logo state
  const [receiptLogo, setReceiptLogo] = useState<{ url: string; name: string; size: string } | null>(null);

  const [form, setForm] = useState({
    name: activeShop?.name || '',
    type: BUSINESS_TYPES.find((b) => b.label === activeShop?.type)?.value || 'retail',
    description: '',
    logoEmoji: activeShop?.icon || '🏪',
    logoMode: 'emoji' as 'emoji' | 'upload',
    region: '',
    city: activeShop?.city || '',
    phone: '+233 24 111 2222',
    email: 'shop@shopchain.com',
    address: '14 Independence Ave, Osu',
    gps: 'GA-142-7890',
    currency: 'GHS',
    taxEnabled: true,
    taxRate: '15',
    inventoryMethod: 'fifo',
    receiptHeader: activeShop?.name || '',
    receiptFooter: 'Thank you for your patronage!',
    lowStockThreshold: '20',
    enableNotifications: true,
    enableBarcodeScan: true,
    discountEnabled: true,
    discountType: 'both' as 'percentage' | 'fixed' | 'both',
    maxDiscountPercent: '50',
    maxDiscountAmount: '500',
    discountRoleLimits: { ...DISCOUNT_ROLE_LIMITS } as Record<string, number>,
    hours: 'standard',
    customHours: {
      Mon: { open: true, from: '08:00', to: '18:00' },
      Tue: { open: true, from: '08:00', to: '18:00' },
      Wed: { open: true, from: '08:00', to: '18:00' },
      Thu: { open: true, from: '08:00', to: '18:00' },
      Fri: { open: true, from: '08:00', to: '18:00' },
      Sat: { open: true, from: '09:00', to: '14:00' },
      Sun: { open: false, from: '10:00', to: '14:00' },
    } as Record<string, { open: boolean; from: string; to: string }>,
  });
  const u = (field: string, val: string | boolean | number | Record<string, unknown>) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      const updatedShop = activeShop
        ? {
            ...activeShop,
            name: form.name,
            icon: form.logoEmoji,
            type: BUSINESS_TYPES.find((b) => b.value === form.type)?.label || activeShop.type,
            city: form.city || activeShop.city,
          }
        : null;
      setActiveShop(updatedShop);
      setTimeout(() => setSaved(false), 2500);
    }, 1000);
  };

  const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({
    label,
    description,
    children,
  }) => (
    <div className="border-border flex flex-col gap-2 border-b py-4 sm:flex-row sm:gap-5">
      <div className="w-full shrink-0 sm:w-[220px]">
        <div className="text-text text-[13px] font-bold">{label}</div>
        {description && <div className="text-text-dim mt-0.5 text-xs leading-snug">{description}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );

  const SettingInput: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
  }> = ({ value, onChange, placeholder, type = 'text', disabled }) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      disabled={disabled || !canEdit}
      className={clsx(
        'border-border text-text box-border w-full rounded-[10px] border-[1.5px] px-3.5 py-[11px] font-[inherit] text-sm outline-none',
        disabled || !canEdit ? 'bg-surface-alt opacity-60' : 'bg-surface',
      )}
    />
  );

  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
    enabled,
    onChange,
    disabled,
  }) => (
    <div
      onClick={() => {
        if (!disabled && canEdit) onChange(!enabled);
      }}
      className={clsx(
        'h-6 w-11 rounded-xl p-[3px] transition-all duration-200',
        enabled ? 'bg-primary' : 'bg-border',
        disabled || !canEdit ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
    >
      <div
        className="h-[18px] w-[18px] rounded-[9px] bg-white transition-all duration-200"
        style={{
          transform: enabled ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-[900px] p-4 sm:px-7 sm:py-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
        <div>
          <h2 className="text-text m-0 mb-1 text-xl font-extrabold sm:text-2xl">Shop Settings</h2>
          <p className="text-text-dim m-0 text-sm">Manage your shop&apos;s profile, contact info, and preferences.</p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-[10px] border-none px-[22px] py-2.5 font-[inherit] text-[13px] font-bold',
              saving
                ? 'text-text-dim cursor-not-allowed'
                : saved
                  ? 'text-success cursor-pointer'
                  : 'cursor-pointer text-white',
            )}
            style={{
              background: saving
                ? COLORS.surfaceAlt
                : saved
                  ? COLORS.successBg
                  : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              boxShadow: !saving && !saved ? `0 4px 16px ${COLORS.primary}35` : 'none',
            }}
          >
            {saving ? (
              <>
                <div
                  className="h-3.5 w-3.5 rounded-full"
                  style={{
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />{' '}
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle size={14} /> Saved
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
        )}
        {!canEdit && (
          <div className="bg-surface-alt border-border text-text-dim flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-xs font-semibold">
            <Eye size={14} /> View Only
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-border mb-6 flex overflow-x-auto border-b-2">
        {SETTINGS_TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          const isDanger = t.id === 'danger';
          return (
            <TabButton
              key={t.id}
              active={active}
              variant="underline"
              onClick={() => setTab(t.id)}
              activeColor={isDanger ? COLORS.danger : undefined}
              className="-mb-0.5 px-3.5 py-2.5 sm:px-5 sm:py-3"
            >
              <Icon size={15} /> {t.label}
            </TabButton>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ animation: 'modalIn 0.2s ease' }}>
        {/* ── General ── */}
        {tab === 'general' && (
          <div>
            <SettingRow label="Shop Logo" description="Choose an emoji for your shop">
              <div className="flex flex-wrap gap-2">
                {LOGO_EMOJIS.map((e) => (
                  <div
                    key={e}
                    onClick={() => canEdit && u('logoEmoji', e)}
                    className={clsx(
                      'flex h-11 w-11 items-center justify-center rounded-xl text-[22px] transition-all duration-150',
                      form.logoEmoji === e ? 'bg-primary-bg' : 'bg-surface-alt',
                      canEdit ? 'cursor-pointer' : 'cursor-default',
                    )}
                    style={{
                      border: `2px solid ${form.logoEmoji === e ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    {e}
                  </div>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Shop Name" description="The public name of your business">
              <SettingInput
                value={form.name}
                onChange={(e) => u('name', e.target.value)}
                placeholder="e.g. Kofi's Mini Mart"
              />
            </SettingRow>

            <SettingRow label="Business Type" description="What kind of business are you running?">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BUSINESS_TYPES.map((bt) => {
                  const sel = form.type === bt.value;
                  return (
                    <div
                      key={bt.value}
                      onClick={() => canEdit && u('type', bt.value)}
                      className={clsx(
                        'flex items-center gap-2 rounded-[10px] px-3 py-2.5 transition-all duration-200',
                        sel ? 'bg-primary-bg' : 'bg-surface-alt',
                        canEdit ? 'cursor-pointer' : 'cursor-not-allowed',
                        !canEdit && !sel && 'opacity-50',
                      )}
                      style={{
                        border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                      }}
                    >
                      <span className="text-lg">{bt.icon}</span>
                      <div>
                        <div className={clsx('text-xs font-bold', sel ? 'text-primary' : 'text-text')}>{bt.label}</div>
                        <div className="text-text-dim text-[10px]">{bt.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SettingRow>

            <SettingRow label="Description" description="A brief summary shown to team members">
              <textarea
                value={form.description}
                onChange={(e) => u('description', e.target.value)}
                placeholder="Tell us about your business…"
                disabled={!canEdit}
                className={clsx(
                  'border-border text-text box-border min-h-[80px] w-full resize-y rounded-[10px] border-[1.5px] px-3.5 py-[11px] font-[inherit] text-sm outline-none',
                  !canEdit ? 'bg-surface-alt' : 'bg-surface',
                )}
              />
            </SettingRow>

            <SettingRow label="Region" description="Where is your business located?">
              <select
                value={form.region}
                onChange={(e) => u('region', e.target.value)}
                disabled={!canEdit}
                className="border-border bg-surface text-text w-full rounded-[10px] border-[1.5px] px-3.5 py-[11px] font-[inherit] text-sm outline-none"
              >
                <option value="">Select region…</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </SettingRow>

            <SettingRow label="City" description="City or town">
              <SettingInput value={form.city} onChange={(e) => u('city', e.target.value)} placeholder="e.g. Accra" />
            </SettingRow>

            <SettingRow label="Phone Number">
              <SettingInput
                value={form.phone}
                onChange={(e) => u('phone', e.target.value)}
                placeholder="+233 XX XXX XXXX"
              />
            </SettingRow>

            <SettingRow label="Email">
              <SettingInput
                value={form.email}
                onChange={(e) => u('email', e.target.value)}
                placeholder="shop@example.com"
                type="email"
              />
            </SettingRow>

            <SettingRow label="Address">
              <SettingInput
                value={form.address}
                onChange={(e) => u('address', e.target.value)}
                placeholder="Street address"
              />
            </SettingRow>

            <SettingRow label="GPS Address">
              <SettingInput
                value={form.gps}
                onChange={(e) => u('gps', e.target.value)}
                placeholder="e.g. GA-142-7890"
              />
            </SettingRow>

            <SettingRow label="Operating Hours" description="Set your weekly operating schedule">
              <div className="flex flex-col gap-2.5">
                {/* Quick action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEdit) return;
                      const allOpen: Record<string, { open: boolean; from: string; to: string }> = {};
                      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d) => {
                        allOpen[d] = { open: true, from: '08:00', to: '18:00' };
                      });
                      u('customHours', allOpen);
                      u('hours', 'custom');
                    }}
                    className={clsx(
                      'border-border text-primary rounded-lg border-[1.5px] bg-transparent px-3.5 py-1.5 font-[inherit] text-xs font-semibold',
                      canEdit ? 'cursor-pointer' : 'cursor-not-allowed',
                    )}
                  >
                    All Open 8–6
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEdit) return;
                      const weekdays: Record<string, { open: boolean; from: string; to: string }> = {};
                      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach((d) => {
                        weekdays[d] = { open: true, from: '08:00', to: '18:00' };
                      });
                      ['Sat', 'Sun'].forEach((d) => {
                        weekdays[d] = { open: false, from: '08:00', to: '18:00' };
                      });
                      u('customHours', weekdays);
                      u('hours', 'custom');
                    }}
                    className={clsx(
                      'border-border text-primary rounded-lg border-[1.5px] bg-transparent px-3.5 py-1.5 font-[inherit] text-xs font-semibold',
                      canEdit ? 'cursor-pointer' : 'cursor-not-allowed',
                    )}
                  >
                    Weekdays Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEdit) return;
                      const allClosed: Record<string, { open: boolean; from: string; to: string }> = {};
                      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d) => {
                        allClosed[d] = { open: false, from: '08:00', to: '18:00' };
                      });
                      u('customHours', allClosed);
                      u('hours', 'custom');
                    }}
                    className={clsx(
                      'border-border text-primary rounded-lg border-[1.5px] bg-transparent px-3.5 py-1.5 font-[inherit] text-xs font-semibold',
                      canEdit ? 'cursor-pointer' : 'cursor-not-allowed',
                    )}
                  >
                    All Closed
                  </button>
                </div>

                {/* Mode selector */}
                {['standard', 'custom', '24h'].map((opt) => (
                  <div
                    key={opt}
                    onClick={() => canEdit && u('hours', opt)}
                    className={clsx(
                      'rounded-[10px] px-3.5 py-2.5 text-[13px]',
                      form.hours === opt ? 'bg-primary-bg text-primary font-bold' : 'text-text-muted font-medium',
                      canEdit ? 'cursor-pointer' : 'cursor-default',
                    )}
                    style={{
                      border: `1.5px solid ${form.hours === opt ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    {opt === 'standard'
                      ? '🕐 Standard (Mon–Fri 8am–6pm, Sat 9am–2pm)'
                      : opt === 'custom'
                        ? '⚙️ Custom hours per day'
                        : '🌙 Open 24/7'}
                  </div>
                ))}

                {/* Per-day editor */}
                {form.hours === 'custom' && (
                  <div className="bg-surface-alt border-border mt-2 rounded-xl border p-3.5">
                    {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((day) => {
                      const h = form.customHours[day] || { open: false, from: '08:00', to: '18:00' };
                      return (
                        <div key={day} className="border-border flex items-center gap-3 border-b py-2">
                          <div className="text-text w-10 text-xs font-bold">{day}</div>
                          <ToggleSwitch
                            enabled={h.open}
                            onChange={(v) => u('customHours', { ...form.customHours, [day]: { ...h, open: v } })}
                          />
                          <input
                            type="time"
                            value={h.from}
                            disabled={!h.open}
                            onChange={(e) =>
                              u('customHours', { ...form.customHours, [day]: { ...h, from: e.target.value } })
                            }
                            className="border-border bg-surface text-text rounded-lg border px-2 py-1.5 text-xs outline-none"
                            style={{
                              opacity: h.open ? 1 : 0.4,
                            }}
                          />
                          <span className="text-text-dim text-[11px]">to</span>
                          <input
                            type="time"
                            value={h.to}
                            disabled={!h.open}
                            onChange={(e) =>
                              u('customHours', { ...form.customHours, [day]: { ...h, to: e.target.value } })
                            }
                            className="border-border bg-surface text-text rounded-lg border px-2 py-1.5 text-xs outline-none"
                            style={{
                              opacity: h.open ? 1 : 0.4,
                            }}
                          />
                          {!h.open && <span className="text-text-dim ml-1 text-[11px]">Closed</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </SettingRow>

            <SettingRow label="Currency">
              <select
                value={form.currency}
                onChange={(e) => u('currency', e.target.value)}
                disabled={!canEdit}
                className="border-border bg-surface text-text w-full rounded-[10px] border-[1.5px] px-3.5 py-[11px] font-[inherit] text-sm outline-none"
              >
                <option value="GHS">GH₵ — Ghana Cedi</option>
                <option value="USD">$ — US Dollar</option>
                <option value="NGN">₦ — Nigerian Naira</option>
              </select>
            </SettingRow>

            <SettingRow label="Tax Settings" description="Configure sales tax">
              <div className="flex items-center gap-3.5">
                <ToggleSwitch enabled={form.taxEnabled} onChange={(v) => u('taxEnabled', v)} />
                <span className="text-text text-[13px]">{form.taxEnabled ? 'Tax enabled' : 'Tax disabled'}</span>
                {form.taxEnabled && (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={form.taxRate}
                      onChange={(e) => u('taxRate', e.target.value)}
                      type="number"
                      disabled={!canEdit}
                      className="border-border bg-surface text-text w-[60px] rounded-lg border-[1.5px] px-2.5 py-2 text-center text-[13px] outline-none"
                    />
                    <span className="text-text-dim text-xs">%</span>
                  </div>
                )}
              </div>
            </SettingRow>

            <SettingRow label="Discount Settings" description="Configure manual discounts at POS">
              <div className="flex items-center gap-3.5">
                <ToggleSwitch enabled={form.discountEnabled} onChange={(v) => u('discountEnabled', v)} />
                <span className="text-text text-[13px]">
                  {form.discountEnabled ? 'Discounts enabled' : 'Discounts disabled'}
                </span>
              </div>
            </SettingRow>

            {form.discountEnabled && (
              <SettingRow label="Discount Type" description="How discounts can be applied at POS">
                <div className="flex gap-2">
                  {(
                    [
                      { id: 'percentage', label: 'Percentage', desc: '% off subtotal' },
                      { id: 'fixed', label: 'Fixed Amount', desc: 'GH₵ amount off' },
                      { id: 'both', label: 'Both', desc: 'Cashier chooses' },
                    ] as const
                  ).map((m) => (
                    <div
                      key={m.id}
                      onClick={() => canEdit && u('discountType', m.id)}
                      className={clsx(
                        'flex-1 rounded-[10px] px-3 py-2.5 text-center',
                        form.discountType === m.id && 'bg-primary-bg',
                        canEdit ? 'cursor-pointer' : 'cursor-default',
                      )}
                      style={{
                        border: `1.5px solid ${form.discountType === m.id ? COLORS.primary : COLORS.border}`,
                      }}
                    >
                      <div
                        className={clsx(
                          'text-[13px] font-bold',
                          form.discountType === m.id ? 'text-primary' : 'text-text',
                        )}
                      >
                        {m.label}
                      </div>
                      <div className="text-text-dim text-[10px]">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </SettingRow>
            )}

            {form.discountEnabled && (
              <SettingRow label="Maximum Discount" description="Shop-wide caps on discount values">
                <div className="flex flex-wrap items-center gap-4">
                  {(form.discountType === 'percentage' || form.discountType === 'both') && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-dim text-xs">Max percentage</span>
                      <input
                        value={form.maxDiscountPercent}
                        onChange={(e) => u('maxDiscountPercent', e.target.value)}
                        type="number"
                        min="0"
                        max="100"
                        disabled={!canEdit}
                        className="border-border bg-surface text-text w-[60px] rounded-lg border-[1.5px] px-2.5 py-2 text-center text-[13px] outline-none"
                      />
                      <span className="text-text-dim text-xs">%</span>
                    </div>
                  )}
                  {(form.discountType === 'fixed' || form.discountType === 'both') && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-dim text-xs">Max amount</span>
                      <span className="text-text-dim text-xs">GH₵</span>
                      <input
                        value={form.maxDiscountAmount}
                        onChange={(e) => u('maxDiscountAmount', e.target.value)}
                        type="number"
                        min="0"
                        disabled={!canEdit}
                        className="border-border bg-surface text-text w-[80px] rounded-lg border-[1.5px] px-2.5 py-2 text-center text-[13px] outline-none"
                      />
                    </div>
                  )}
                </div>
              </SettingRow>
            )}

            {form.discountEnabled && (
              <SettingRow label="Role Discount Limits" description="Maximum discount each role can apply">
                <div className="border-border overflow-hidden rounded-xl border">
                  {ROLES.map((role, idx) => {
                    const limit = form.discountRoleLimits[role.id] ?? 0;
                    const hasPermission = DEFAULT_PERMISSIONS[role.id]?.pos_discount !== 'none';
                    return (
                      <div
                        key={role.id}
                        className={clsx(
                          'flex items-center justify-between px-3.5 py-2.5',
                          idx % 2 === 0 ? 'bg-surface' : 'bg-surface-alt',
                          !hasPermission && 'opacity-50',
                        )}
                        style={{
                          borderBottom: idx < ROLES.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span>{role.icon}</span>
                          <span className="text-text text-[13px] font-semibold">{role.label}</span>
                        </div>
                        {hasPermission ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              value={String(limit)}
                              type="number"
                              min="0"
                              max="100"
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                u('discountRoleLimits', { ...form.discountRoleLimits, [role.id]: val });
                              }}
                              disabled={!canEdit}
                              className="border-border bg-surface text-text w-[50px] rounded-lg border px-2 py-1.5 text-center font-[inherit] text-xs outline-none"
                            />
                            <span className="text-text-dim text-[11px]">%</span>
                          </div>
                        ) : (
                          <span className="text-text-dim text-[11px]">No discount access</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SettingRow>
            )}

            <SettingRow label="Inventory Method">
              <div className="flex gap-2">
                {[
                  { id: 'fifo', label: 'FIFO', desc: 'First In, First Out' },
                  { id: 'lifo', label: 'LIFO', desc: 'Last In, First Out' },
                  { id: 'avg', label: 'Weighted Avg', desc: 'Average cost' },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => canEdit && u('inventoryMethod', m.id)}
                    className={clsx(
                      'flex-1 rounded-[10px] px-3 py-2.5 text-center',
                      form.inventoryMethod === m.id && 'bg-primary-bg',
                      canEdit ? 'cursor-pointer' : 'cursor-default',
                    )}
                    style={{
                      border: `1.5px solid ${form.inventoryMethod === m.id ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    <div
                      className={clsx(
                        'text-[13px] font-bold',
                        form.inventoryMethod === m.id ? 'text-primary' : 'text-text',
                      )}
                    >
                      {m.label}
                    </div>
                    <div className="text-text-dim text-[10px]">{m.desc}</div>
                  </div>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Low Stock Threshold" description="Default reorder point for new products">
              <SettingInput
                value={form.lowStockThreshold}
                onChange={(e) => u('lowStockThreshold', e.target.value)}
                type="number"
              />
            </SettingRow>

            <SettingRow label="Notifications">
              <div className="flex items-center gap-3.5">
                <ToggleSwitch enabled={form.enableNotifications} onChange={(v) => u('enableNotifications', v)} />
                <span className="text-text text-[13px]">Enable push notifications</span>
              </div>
            </SettingRow>

            <SettingRow label="Barcode Scanning">
              <div className="flex items-center gap-3.5">
                <ToggleSwitch enabled={form.enableBarcodeScan} onChange={(v) => u('enableBarcodeScan', v)} />
                <span className="text-text text-[13px]">Enable barcode scanner</span>
              </div>
            </SettingRow>

            <SettingRow label="Receipt Header">
              <SettingInput
                value={form.receiptHeader}
                onChange={(e) => u('receiptHeader', e.target.value)}
                placeholder="Header text on receipts"
              />
            </SettingRow>

            <SettingRow label="Receipt Footer">
              <SettingInput
                value={form.receiptFooter}
                onChange={(e) => u('receiptFooter', e.target.value)}
                placeholder="Footer message"
              />
            </SettingRow>

            {/* ── Shop Location (Geolocation) ── */}
            <SettingRow label="Shop Location" description="Pinpoint your shop on the map">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!canEdit) return;
                    setGeoLoading(true);
                    setGeoError('');
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setGeoCoords({
                          lat: pos.coords.latitude,
                          lng: pos.coords.longitude,
                          accuracy: pos.coords.accuracy,
                        });
                        setGeoLoading(false);
                      },
                      (err) => {
                        setGeoError(err.message);
                        setGeoLoading(false);
                      },
                      { enableHighAccuracy: true },
                    );
                  }}
                  disabled={geoLoading || !canEdit}
                  className={clsx(
                    'border-border bg-primary-bg text-primary flex w-fit items-center gap-2 rounded-[10px] border-[1.5px] px-[18px] py-2.5 font-[inherit] text-[13px] font-bold',
                    geoLoading || !canEdit ? 'cursor-not-allowed' : 'cursor-pointer',
                  )}
                  style={{
                    opacity: geoLoading ? 0.7 : 1,
                  }}
                >
                  <MapPin size={15} />
                  {geoLoading ? 'Locating...' : 'Locate My Shop'}
                  {geoLoading && (
                    <div
                      className="h-3.5 w-3.5 rounded-full"
                      style={{
                        border: `2px solid ${COLORS.border}`,
                        borderTopColor: COLORS.primary,
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  )}
                </button>

                {geoError && <div className="text-danger text-xs font-semibold">{geoError}</div>}

                {geoCoords && (
                  <div className="flex flex-col gap-2.5">
                    {/* SVG Map Preview */}
                    <svg
                      viewBox="0 0 200 150"
                      width={200}
                      height={150}
                      className="border-border rounded-[10px] border-[1.5px] bg-[#f0f0f0]"
                    >
                      {/* Grid lines */}
                      {[30, 60, 90, 120, 150, 180].map((x) => (
                        <line key={`vx-${x}`} x1={x} y1={0} x2={x} y2={150} stroke="#ddd" strokeWidth={0.5} />
                      ))}
                      {[30, 60, 90, 120].map((y) => (
                        <line key={`hy-${y}`} x1={0} y1={y} x2={200} y2={y} stroke="#ddd" strokeWidth={0.5} />
                      ))}
                      {/* Accuracy circle */}
                      <circle
                        cx={100}
                        cy={75}
                        r={Math.min(geoCoords.accuracy / 2, 60)}
                        fill="rgba(59,130,246,0.15)"
                        stroke="rgba(59,130,246,0.4)"
                        strokeWidth={1.5}
                      />
                      {/* Center pin */}
                      <circle cx={100} cy={75} r={5} fill="#EF4444" stroke="#fff" strokeWidth={1.5} />
                    </svg>

                    {/* Coordinates */}
                    <div className="text-text text-xs font-semibold">
                      Lat: {geoCoords.lat.toFixed(6)}, Lng: {geoCoords.lng.toFixed(6)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Copy Coordinates */}
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(`${geoCoords.lat.toFixed(6)}, ${geoCoords.lng.toFixed(6)}`)
                        }
                        className="border-border text-primary rounded-lg border-[1.5px] bg-transparent px-3.5 py-1.5 font-[inherit] text-xs font-semibold"
                      >
                        Copy Coordinates
                      </button>

                      {/* Open in Google Maps */}
                      <a
                        href={`https://www.google.com/maps?q=${geoCoords.lat},${geoCoords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-border text-primary inline-flex cursor-pointer items-center rounded-lg border-[1.5px] bg-transparent px-3.5 py-1.5 font-[inherit] text-xs font-semibold no-underline"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </SettingRow>

            {/* ── Receipt Logo Upload ── */}
            <SettingRow
              label="Receipt Logo"
              description="Upload your shop logo for receipts (PNG, JPG, WebP — max 2MB, recommended 300×100px)"
            >
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  id="receipt-logo-upload"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      alert('File size exceeds 2MB limit.');
                      e.target.value = '';
                      return;
                    }
                    const url = URL.createObjectURL(file);
                    const sizeStr =
                      file.size < 1024
                        ? `${file.size} B`
                        : file.size < 1024 * 1024
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
                    setReceiptLogo({ url, name: file.name, size: sizeStr });
                    e.target.value = '';
                  }}
                />

                {!receiptLogo && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEdit) return;
                      document.getElementById('receipt-logo-upload')?.click();
                    }}
                    disabled={!canEdit}
                    className={clsx(
                      'border-border bg-primary-bg text-primary flex w-fit items-center gap-2 rounded-[10px] border-[1.5px] px-[18px] py-2.5 font-[inherit] text-[13px] font-bold',
                      canEdit ? 'cursor-pointer' : 'cursor-not-allowed',
                    )}
                  >
                    Upload Logo
                  </button>
                )}

                {receiptLogo && (
                  <div className="flex flex-col gap-2.5">
                    {/* Image preview */}
                    <img
                      src={receiptLogo.url}
                      alt="Receipt logo preview"
                      className="border-border max-h-[100px] max-w-[300px] rounded-lg border-[1.5px] object-contain"
                    />

                    {/* File info */}
                    <div className="text-text-dim text-xs">
                      {receiptLogo.name} ({receiptLogo.size})
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!canEdit) return;
                          document.getElementById('receipt-logo-upload')?.click();
                        }}
                        disabled={!canEdit}
                        className={clsx(
                          'border-border text-primary rounded-lg border-[1.5px] bg-transparent px-3.5 py-1.5 font-[inherit] text-xs font-semibold',
                          canEdit ? 'cursor-pointer' : 'cursor-not-allowed',
                        )}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!canEdit) return;
                          URL.revokeObjectURL(receiptLogo.url);
                          setReceiptLogo(null);
                        }}
                        disabled={!canEdit}
                        className={clsx(
                          'text-danger border-danger/[0.25] rounded-lg border-[1.5px] bg-transparent px-3.5 py-1.5 font-[inherit] text-xs font-semibold',
                          canEdit ? 'cursor-pointer' : 'cursor-not-allowed',
                        )}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SettingRow>
          </div>
        )}

        {/* ── Branches ── */}
        {tab === 'branches' && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-text text-base font-bold">Branch Management</div>
                <div className="text-text-dim text-xs">
                  {branches.length} branch{branches.length !== 1 ? 'es' : ''}
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowAddBranch(true)}
                  className="flex items-center gap-1.5 rounded-[10px] border-none px-[18px] py-[9px] font-[inherit] text-xs font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                  }}
                >
                  <Plus size={14} /> Add Branch
                </button>
              )}
            </div>
            {branches.length === 0 ? (
              <div className="text-text-dim p-10 text-center">
                <Building2 size={40} className="text-border mb-3" />
                <div className="text-sm font-semibold">No branches yet</div>
                <div className="mt-1 text-xs">Add your first branch to manage multiple locations</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {branches.map((b, i) => (
                  <div key={b.id || i} className="bg-surface border-border rounded-[14px] border-[1.5px] p-4">
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-primary-bg flex h-9 w-9 items-center justify-center rounded-[10px]">
                          <Store size={16} className="text-primary" />
                        </div>
                        <div>
                          <div className="text-text text-sm font-bold">{b.name}</div>
                          <div className="text-text-dim text-[11px]">{b.city || 'No city set'}</div>
                        </div>
                      </div>
                      <span
                        className={clsx(
                          'rounded-[5px] px-2 py-0.5 text-[10px] font-bold capitalize',
                          b.status === 'active' ? 'bg-success-bg text-success' : 'bg-surface-alt text-text-dim',
                        )}
                      >
                        {b.status || 'active'}
                      </span>
                    </div>
                    {b.phone && (
                      <div className="text-text-muted mb-1 flex items-center gap-1.5 text-[11px]">
                        <Phone size={11} /> {b.phone}
                      </div>
                    )}
                    {b.address && (
                      <div className="text-text-muted flex items-center gap-1.5 text-[11px]">
                        <MapPin size={11} /> {b.address}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Branch Modal */}
            {showAddBranch && (
              <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-4">
                <div
                  className="bg-surface border-border w-full max-w-[480px] rounded-[18px] border-[1.5px] p-6"
                  style={{ animation: 'modalIn 0.2s ease' }}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="text-text text-base font-bold">Add New Branch</div>
                    <button
                      type="button"
                      onClick={() => setShowAddBranch(false)}
                      aria-label="Close"
                      className="text-text-dim"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-text-muted mb-1 block text-[11px] font-bold">Branch Name *</label>
                      <SettingInput
                        value={branchForm.name}
                        onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Kumasi Branch"
                      />
                    </div>
                    <div>
                      <label className="text-text-muted mb-1 block text-[11px] font-bold">City</label>
                      <SettingInput
                        value={branchForm.city}
                        onChange={(e) => setBranchForm((p) => ({ ...p, city: e.target.value }))}
                        placeholder="e.g. Kumasi"
                      />
                    </div>
                    <div>
                      <label className="text-text-muted mb-1 block text-[11px] font-bold">Address</label>
                      <SettingInput
                        value={branchForm.address}
                        onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))}
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <label className="text-text-muted mb-1 block text-[11px] font-bold">Phone</label>
                      <SettingInput
                        value={branchForm.phone}
                        onChange={(e) => setBranchForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+233 XX XXX XXXX"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBranches((prev) => [...prev, { ...branchForm, id: `br-${Date.now()}`, status: 'active' }]);
                        setBranchForm({ name: '', city: '', address: '', phone: '', gps: '' });
                        setShowAddBranch(false);
                      }}
                      disabled={!branchForm.name.trim()}
                      className={clsx(
                        'mt-2 w-full rounded-xl border-none px-5 py-3 font-[inherit] text-sm font-bold',
                        branchForm.name.trim() ? 'cursor-pointer text-white' : 'text-text-dim cursor-not-allowed',
                      )}
                      style={{
                        background: branchForm.name.trim()
                          ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                          : COLORS.surfaceAlt,
                      }}
                    >
                      Create Branch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Billing ── */}
        {tab === 'billing' && (
          <div>
            <div className="text-text-dim p-10 text-center">
              <CreditCard size={40} className="text-border mb-3" />
              <div className="text-text text-base font-bold">Billing & Invoices</div>
              <div className="mt-1.5 text-[13px]">
                Manage your subscription billing, invoices, and payment history from the Account page.
              </div>
            </div>
          </div>
        )}

        {/* ── Integrations ── */}
        {tab === 'integrations' && (
          <div>
            <div className="text-text mb-4 text-base font-bold">Integrations & Connected Services</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { name: 'MTN MoMo', desc: 'Mobile money payments', icon: '📱', connected: true },
                { name: 'QuickBooks', desc: 'Accounting sync', icon: '📊', connected: false },
                { name: 'Shopify', desc: 'E-commerce sync', icon: '🛍️', connected: false },
                { name: 'WhatsApp', desc: 'Customer notifications', icon: '💬', connected: false },
              ].map((int) => (
                <div
                  key={int.name}
                  className="bg-surface border-border flex items-center gap-3.5 rounded-[14px] border-[1.5px] p-4"
                >
                  <div className="bg-surface-alt flex h-11 w-11 items-center justify-center rounded-xl text-[22px]">
                    {int.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-text text-sm font-bold">{int.name}</div>
                    <div className="text-text-dim text-[11px]">{int.desc}</div>
                  </div>
                  <button
                    type="button"
                    className={clsx(
                      'rounded-lg border-[1.5px] px-3.5 py-1.5 font-[inherit] text-[11px] font-bold',
                      int.connected ? 'border-success bg-success-bg text-success' : 'border-border text-text-muted',
                    )}
                  >
                    {int.connected ? '✓ Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Notifications ── */}
        {tab === 'notifications' && (
          <div>
            <div className="text-text-dim mb-5 text-xs">
              Configure which notifications you receive and through which channels. Changes apply to all users in your
              shop.
            </div>

            {/* Category Preferences */}
            <div className="mb-6">
              <div className="text-text mb-3.5 text-sm font-bold">Notification Categories</div>
              <div className="flex flex-col gap-2.5">
                {Object.entries(NOTIF_CATEGORY_LABELS).map(([cat, meta]) => {
                  const catKey = cat as keyof typeof notifPrefs.categories;
                  const pref = notifPrefs.categories[catKey];
                  if (!pref) return null;
                  return (
                    <div
                      key={cat}
                      className={clsx(
                        'border-border rounded-[14px] border-[1.5px] px-[18px] py-4 transition-all duration-150',
                        pref.enabled ? 'bg-surface' : 'bg-surface-alt',
                      )}
                      style={{
                        opacity: pref.enabled ? 1 : 0.7,
                      }}
                    >
                      {/* Header row: toggle + label */}
                      <div
                        className="flex items-center justify-between"
                        style={{ marginBottom: pref.enabled ? 12 : 0 }}
                      >
                        <div>
                          <div className="text-text text-[13px] font-bold">{meta.label}</div>
                          <div className="text-text-dim mt-0.5 text-[11px]">{meta.desc}</div>
                        </div>
                        <div
                          onClick={() => canEdit && updateCategoryPref(catKey, !pref.enabled, pref.channels)}
                          className={clsx(
                            'relative h-6 w-[44px] shrink-0 rounded-xl transition-[background] duration-200',
                            pref.enabled ? 'bg-success' : 'bg-border',
                            canEdit ? 'cursor-pointer' : 'cursor-default',
                          )}
                        >
                          <div
                            className="absolute h-[18px] w-[18px] rounded-full bg-white transition-[left] duration-200"
                            style={{
                              top: 3,
                              left: pref.enabled ? 23 : 3,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }}
                          />
                        </div>
                      </div>
                      {/* Channel toggles */}
                      {pref.enabled && (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(CHANNEL_LABELS).map(([ch, label]) => {
                            const isActive = pref.channels.includes(ch as NotificationChannel);
                            return (
                              <button
                                type="button"
                                key={ch}
                                onClick={() => {
                                  if (!canEdit) return;
                                  const newChannels = isActive
                                    ? pref.channels.filter((c) => c !== ch)
                                    : [...pref.channels, ch as NotificationChannel];
                                  if (newChannels.length === 0) return; // Must have at least one channel
                                  updateCategoryPref(catKey, true, newChannels);
                                }}
                                className={clsx(
                                  'rounded-md px-3 py-1 font-[inherit] text-[10px] font-semibold transition-all duration-150',
                                  isActive ? 'text-primary' : 'text-text-dim',
                                )}
                                style={{
                                  cursor: canEdit ? 'pointer' : 'default',
                                  border: isActive ? `1.5px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                                  background: isActive ? `${COLORS.primary}12` : 'transparent',
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="border-border bg-surface rounded-[14px] border-[1.5px] px-5 py-[18px]">
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: notifPrefs.quietHoursEnabled ? 14 : 0 }}
              >
                <div>
                  <div className="text-text text-[13px] font-bold">Quiet Hours</div>
                  <div className="text-text-dim mt-0.5 text-[11px]">
                    Suppress push and SMS notifications during off-hours
                  </div>
                </div>
                <div
                  onClick={() => canEdit && updatePreferences({ quietHoursEnabled: !notifPrefs.quietHoursEnabled })}
                  className={clsx(
                    'relative h-6 w-[44px] shrink-0 rounded-xl transition-[background] duration-200',
                    notifPrefs.quietHoursEnabled ? 'bg-success' : 'bg-border',
                    canEdit ? 'cursor-pointer' : 'cursor-default',
                  )}
                >
                  <div
                    className="absolute h-[18px] w-[18px] rounded-full bg-white transition-[left] duration-200"
                    style={{
                      top: 3,
                      left: notifPrefs.quietHoursEnabled ? 23 : 3,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              </div>
              {notifPrefs.quietHoursEnabled && (
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <div className="form-label mb-1 tracking-wide">From</div>
                    <input
                      type="time"
                      value={notifPrefs.quietHoursStart}
                      onChange={(e) => canEdit && updatePreferences({ quietHoursStart: e.target.value })}
                      className="border-border bg-surface-alt text-text rounded-lg border-[1.5px] px-3 py-2 font-[inherit] text-xs outline-none"
                    />
                  </div>
                  <div className="text-text-dim pt-[18px] text-xs">to</div>
                  <div>
                    <div className="form-label mb-1 tracking-wide">Until</div>
                    <input
                      type="time"
                      value={notifPrefs.quietHoursEnd}
                      onChange={(e) => canEdit && updatePreferences({ quietHoursEnd: e.target.value })}
                      className="border-border bg-surface-alt text-text rounded-lg border-[1.5px] px-3 py-2 font-[inherit] text-xs outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Danger Zone ── */}
        {tab === 'danger' && (
          <div>
            <div className="border-danger/[0.15] bg-danger/[0.03] mb-4 rounded-[14px] border-[1.5px] p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-danger" />
                <div className="text-danger text-base font-bold">Danger Zone</div>
              </div>
              <div className="text-text-dim mb-5 text-xs">
                These actions are destructive and may not be reversible. Please proceed with caution.
              </div>

              {/* Archive Shop */}
              <div className="bg-surface border-border mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] p-4">
                <div>
                  <div className="text-text text-sm font-bold">Archive Shop</div>
                  <div className="text-text-dim text-xs">Temporarily disable this shop. Data is preserved.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowArchive(true)}
                  className="text-warning border-warning flex items-center gap-1.5 rounded-[10px] border-[1.5px] bg-transparent px-[18px] py-2 font-[inherit] text-xs font-bold"
                >
                  <Archive size={14} /> Archive
                </button>
              </div>

              {/* Delete Shop */}
              <div className="bg-surface border-danger/[0.19] flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] p-4">
                <div>
                  <div className="text-danger text-sm font-bold">Delete Shop</div>
                  <div className="text-text-dim text-xs">
                    Permanently delete this shop and all its data. This cannot be undone.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 rounded-[10px] border-none px-[18px] py-2 font-[inherit] text-xs font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.danger}, #FF6B6B)`,
                  }}
                >
                  <Trash2 size={14} /> Delete Shop
                </button>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-4">
                <div
                  className="bg-surface border-danger/[0.19] w-full max-w-[420px] rounded-[18px] border-[1.5px] p-6"
                  style={{ animation: 'modalIn 0.2s ease' }}
                >
                  <div className="mb-5 text-center">
                    <div className="bg-danger/[0.07] mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
                      <Trash2 size={24} className="text-danger" />
                    </div>
                    <div className="text-danger text-lg font-extrabold">Delete {activeShop?.name}?</div>
                    <div className="text-text-dim mt-1.5 text-[13px]">
                      This action is irreversible. All data including products, orders, and team members will be
                      permanently deleted.
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-text-muted mb-1.5 block text-[11px] font-bold">
                      Type &quot;DELETE&quot; to confirm
                    </label>
                    <input
                      value={deleteText}
                      onChange={(e) => setDeleteText(e.target.value)}
                      placeholder="DELETE"
                      className="bg-surface-alt text-text border-danger/[0.25] box-border w-full rounded-[10px] border-[1.5px] px-3.5 py-[11px] text-center font-mono text-sm outline-none"
                    />
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteText('');
                      }}
                      className="border-border text-text-muted flex-1 rounded-[10px] border-[1.5px] bg-transparent px-5 py-[11px] font-[inherit] text-[13px] font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleteText !== 'DELETE'}
                      onClick={() => {
                        setDeleting(true);
                        setTimeout(() => {
                          setDeleting(false);
                          setDeleteSuccess(true);
                          setTimeout(() => onDeleteShop(), 1500);
                        }, 2000);
                      }}
                      className={clsx(
                        'flex-1 rounded-[10px] border-none px-5 py-[11px] font-[inherit] text-[13px] font-bold',
                        deleteText === 'DELETE' ? 'cursor-pointer text-white' : 'text-text-dim cursor-not-allowed',
                      )}
                      style={{
                        background:
                          deleteText === 'DELETE'
                            ? `linear-gradient(135deg, ${COLORS.danger}, #FF6B6B)`
                            : COLORS.surfaceAlt,
                      }}
                    >
                      {deleting ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
