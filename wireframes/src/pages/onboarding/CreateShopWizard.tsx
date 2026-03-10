import React, { useState, Fragment } from 'react';
import {
  Store,
  MapPin,
  Settings,
  Zap,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Phone,
  Mail,
  Globe,
  Clock,
  DollarSign,
  Box,
  Upload,
  Info,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, type AppShop } from '@/context';
import { isMobile } from '@/utils/responsive';
import { AuthInput } from '@/pages/auth/AuthHelpers';
import { ShopLogo } from '@/components/features/ShopLogo';
import type { Breakpoint } from '@/constants/breakpoints';
import type { LucideIcon } from 'lucide-react';

interface WizardStep {
  id: number;
  title: string;
  desc: string;
  icon: LucideIcon;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Business Info', desc: 'Basic details', icon: Store },
  { id: 2, title: 'Contact & Location', desc: 'Where to find you', icon: MapPin },
  { id: 3, title: 'Preferences', desc: 'How you operate', icon: Settings },
  { id: 4, title: 'Review & Launch', desc: 'Confirm & go live', icon: Zap },
];

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail Store', icon: '🏪', desc: 'Shops, supermarkets, mini-marts' },
  { value: 'wholesale', label: 'Wholesale', icon: '🏭', desc: 'Bulk distribution, B2B' },
  { value: 'supermarket', label: 'Supermarket', icon: '🛒', desc: 'Large-format retail store' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊', desc: 'Drug store, health products' },
  { value: 'restaurant', label: 'Restaurant / Bar', icon: '🍽️', desc: 'Food service, hospitality' },
  { value: 'general', label: 'General Trading', icon: '📦', desc: 'Mixed goods, imports/exports' },
  { value: 'other', label: 'Other', icon: '🏢', desc: 'Custom business type' },
];

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Bono',
  'Upper East',
  'Upper West',
  'Ahafo',
  'Bono East',
  'North East',
  'Oti',
  'Savannah',
  'Western North',
];

const INVENTORY_METHODS = [
  { value: 'fifo', label: 'FIFO', desc: 'First In, First Out \u2014 oldest stock sold first', icon: '📤' },
  { value: 'lifo', label: 'LIFO', desc: 'Last In, First Out \u2014 newest stock sold first', icon: '📥' },
  { value: 'weighted', label: 'Weighted Average', desc: 'Cost averaged across all stock', icon: '⚖️' },
];

const OPERATING_HOURS = [
  { value: 'standard', label: 'Standard Hours', desc: 'Mon\u2013Fri, 8am \u2013 6pm' },
  { value: 'extended', label: 'Extended Hours', desc: 'Mon\u2013Sat, 7am \u2013 9pm' },
  { value: '24_7', label: '24/7 Operations', desc: 'Open round the clock' },
  { value: 'custom', label: 'Custom Hours', desc: 'Set your own schedule' },
];

interface ShopLogoImage {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

interface WizardForm {
  name: string;
  type: string;
  description: string;
  country: string;
  region: string;
  city: string;
  phone: string;
  email: string;
  address: string;
  gps: string;
  hours: string;
  currency: string;
  taxEnabled: boolean;
  taxRate: string;
  inventoryMethod: string;
  logoEmoji: string;
  logoMode: string;
  shopLogo: ShopLogoImage | null;
  receiptLogo: ShopLogoImage | null;
}

interface CreateShopWizardProps {
  bp: Breakpoint;
  onComplete: (shop: AppShop) => void;
  onBack: () => void;
}

export const CreateShopWizard: React.FC<CreateShopWizardProps> = ({ onComplete, onBack, bp }) => {
  const COLORS = useColors();
  const [step, setStep] = useState(1);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const mobile = isMobile(bp);

  const [form, setForm] = useState<WizardForm>({
    name: '',
    type: '',
    description: '',
    country: 'Ghana',
    region: '',
    city: '',
    phone: '',
    email: '',
    address: '',
    gps: '',
    hours: 'standard',
    currency: 'GHS',
    taxEnabled: true,
    taxRate: '15',
    inventoryMethod: 'fifo',
    logoEmoji: '🏪',
    logoMode: 'emoji',
    shopLogo: null,
    receiptLogo: null,
  });

  const u = (field: keyof WizardForm, val: unknown) => setForm((prev) => ({ ...prev, [field]: val }));

  const LOGO_EMOJIS = ['🏪', '🛒', '🏬', '🏭', '💊', '🍽️', '📦', '🧴', '☕', '🥘', '🧊', '🍞', '🔧', '🌿', '💻', '👗'];

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!(form.name.trim() && form.type && form.region);
      case 2:
        return !!(form.phone.trim() && form.email.trim());
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      setLaunched(true);
      setTimeout(() => {
        const shop: AppShop = {
          name: form.name,
          type: BUSINESS_TYPES.find((b) => b.value === form.type)?.label || form.type,
          icon: form.logoEmoji,
          logoUrl: form.logoMode === 'upload' && form.shopLogo ? form.shopLogo.dataUrl : undefined,
        };
        onComplete(shop);
      }, 2500);
    }, 2000);
  };

  // Launched success
  if (launched) {
    return (
      <div className="bg-bg flex min-h-screen items-center justify-center">
        <div className="px-6 py-10 text-center" style={{ animation: 'modalIn 0.5s ease' }}>
          <div
            className="bg-success-bg border-success/[0.25] mb-6 inline-flex h-[90px] w-[90px] items-center justify-center rounded-full border-[3px]"
            style={{
              boxShadow: `0 0 40px ${COLORS.success}20`,
            }}
          >
            <CheckCircle size={42} className="text-success" />
          </div>
          <h1 className="text-text m-0 mb-2 text-[28px] font-extrabold">🎉 You&apos;re all set!</h1>
          <p className="text-text-dim m-0 mb-2 text-base">
            <strong>{form.name}</strong> is ready to go.
          </p>
          <p className="text-text-dim m-0 text-[13px]">Taking you to your dashboard...</p>
          <div className="mt-6">
            <div
              className="border-border border-t-primary mx-auto h-5 w-5 rounded-full border-[2.5px]"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="bg-bg flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="border-border bg-surface flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-8 sm:py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            onClick={onBack}
            className="bg-surface-alt flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg"
          >
            <ArrowLeft size={16} className="text-text-muted" />
          </div>
          <div>
            <div className="text-text text-[15px] font-bold">Create Your Shop</div>
            <div className="text-text-dim text-[11px]">Step {step} of 4</div>
          </div>
        </div>
        <button type="button" onClick={onBack} className="text-text-muted text-[13px] font-semibold">
          Cancel
        </button>
      </div>

      {/* Progress stepper */}
      <div className="mx-auto w-full max-w-[720px] px-4 pt-4 sm:px-8 sm:pt-5 md:px-12">
        <div className="flex items-center gap-0">
          {WIZARD_STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            const Icon = s.icon;
            return (
              <Fragment key={s.id}>
                <div className="flex min-w-0 items-center gap-2" style={{ flex: mobile ? 'unset' : 1 }}>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-all duration-300"
                    style={{
                      background: done
                        ? COLORS.success
                        : active
                          ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                          : COLORS.surfaceAlt,
                      border: `1.5px solid ${done ? COLORS.success : active ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    {done ? (
                      <Check size={16} className="text-white" />
                    ) : (
                      <Icon size={16} className={active ? 'text-white' : 'text-text-dim'} />
                    )}
                  </div>
                  {!mobile && (
                    <div className="min-w-0">
                      <div
                        className={clsx(
                          'truncate text-xs font-bold',
                          active ? 'text-text' : done ? 'text-success' : 'text-text-dim',
                        )}
                      >
                        {s.title}
                      </div>
                      <div className="text-text-dim text-[10px]">{s.desc}</div>
                    </div>
                  )}
                </div>
                {i < 3 && (
                  <div
                    className={clsx(
                      'mx-1.5 h-0.5 rounded-sm transition-all duration-300',
                      done ? 'bg-success' : 'bg-border',
                    )}
                    style={{
                      flex: mobile ? 1 : 'unset',
                      width: mobile ? 'auto' : 32,
                    }}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto w-full max-w-[720px] flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 md:px-12">
        {/* Step 1: Business Info */}
        {step === 1 && (
          <div style={{ animation: 'modalIn 0.3s ease' }}>
            <h2 className="text-text m-0 mb-1 text-xl font-extrabold sm:text-2xl">Tell us about your business</h2>
            <p className="text-text-dim m-0 mb-6 text-sm">This helps us customise ShopChain for your needs.</p>

            <div className="flex flex-col gap-4">
              <AuthInput
                icon={Store}
                label="Shop / Business Name *"
                placeholder="e.g. Kofi's Mini Mart"
                value={form.name}
                onChange={(e) => u('name', e.target.value)}
              />

              <div>
                <label className="text-text-muted mb-2 block text-xs font-semibold">Business Type *</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BUSINESS_TYPES.map((bt) => {
                    const sel = form.type === bt.value;
                    return (
                      <div
                        key={bt.value}
                        onClick={() => u('type', bt.value)}
                        className={clsx(
                          'flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 transition-all duration-200',
                          sel ? 'bg-primary-bg' : 'bg-surface-alt',
                        )}
                        style={{
                          border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                        }}
                      >
                        <span className="text-[22px]">{bt.icon}</span>
                        <div>
                          <div className={clsx('text-[13px] font-bold', sel ? 'text-primary' : 'text-text')}>
                            {bt.label}
                          </div>
                          <div className="text-text-dim text-[10px]">{bt.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <AuthInput
                label="Description (optional)"
                placeholder="Brief description of your business"
                value={form.description}
                onChange={(e) => u('description', e.target.value)}
              />

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-semibold">Country</label>
                  <div className="bg-surface-alt text-text border-border flex items-center gap-2 rounded-xl border-[1.5px] px-3.5 py-[13px] text-sm">
                    <Globe size={16} className="text-text-dim" /> 🇬🇭 Ghana
                  </div>
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-semibold">Region *</label>
                  <select
                    value={form.region}
                    onChange={(e) => u('region', e.target.value)}
                    className={clsx(
                      'bg-surface-alt w-full cursor-pointer appearance-none rounded-xl px-3.5 py-[13px] font-[inherit] text-sm outline-none',
                      form.region ? 'text-text' : 'text-text-dim',
                    )}
                    style={{
                      border: `1.5px solid ${COLORS.border}`,
                    }}
                  >
                    <option value="">Select region</option>
                    {GHANA_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <AuthInput
                  label="City / Town"
                  placeholder="e.g. Osu, Accra"
                  value={form.city}
                  onChange={(e) => u('city', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact & Location */}
        {step === 2 && (
          <div style={{ animation: 'modalIn 0.3s ease' }}>
            <h2 className="text-text m-0 mb-1 text-xl font-extrabold sm:text-2xl">Contact & Location</h2>
            <p className="text-text-dim m-0 mb-6 text-sm">How customers and suppliers can reach you.</p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AuthInput
                  icon={Phone}
                  label="Business Phone *"
                  type="tel"
                  placeholder="+233 24 000 0000"
                  value={form.phone}
                  onChange={(e) => u('phone', e.target.value)}
                />
                <AuthInput
                  icon={Mail}
                  label="Business Email *"
                  type="email"
                  placeholder="shop@example.com"
                  value={form.email}
                  onChange={(e) => u('email', e.target.value)}
                />
              </div>

              <AuthInput
                icon={MapPin}
                label="Physical Address"
                placeholder="Street address, landmark, etc."
                value={form.address}
                onChange={(e) => u('address', e.target.value)}
              />

              <div>
                <label className="text-text-muted mb-1.5 block text-xs font-semibold">
                  GPS / Digital Address (optional)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <AuthInput
                      icon={Globe}
                      placeholder="e.g. GA-123-4567"
                      value={form.gps}
                      onChange={(e) => u('gps', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="text-primary border-border bg-surface-alt flex items-center gap-1.5 rounded-xl border-[1.5px] px-4 font-[inherit] text-xs font-semibold"
                  >
                    <MapPin size={14} /> Locate
                  </button>
                </div>
              </div>

              <div>
                <label className="text-text-muted mb-2 block text-xs font-semibold">Operating Hours</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {OPERATING_HOURS.map((oh) => {
                    const sel = form.hours === oh.value;
                    return (
                      <div
                        key={oh.value}
                        onClick={() => u('hours', oh.value)}
                        className={clsx(
                          'cursor-pointer rounded-xl px-3.5 py-3 transition-all duration-200',
                          sel ? 'bg-primary-bg' : 'bg-surface-alt',
                        )}
                        style={{
                          border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                        }}
                      >
                        <div className={clsx('text-[13px] font-bold', sel ? 'text-primary' : 'text-text')}>
                          {oh.label}
                        </div>
                        <div className="text-text-dim text-[11px]">{oh.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div style={{ animation: 'modalIn 0.3s ease' }}>
            <h2 className="text-text m-0 mb-1 text-xl font-extrabold sm:text-2xl">Shop Preferences</h2>
            <p className="text-text-dim m-0 mb-6 text-sm">
              Configure how your shop operates. You can change these later.
            </p>

            <div className="flex flex-col gap-5">
              {/* Shop logo - emoji picker */}
              <div>
                <label className="text-text-muted mb-2 block text-xs font-semibold">Shop Logo</label>
                <div className="flex flex-wrap gap-1.5">
                  {LOGO_EMOJIS.map((e) => {
                    const sel = form.logoEmoji === e;
                    return (
                      <div
                        key={e}
                        onClick={() => u('logoEmoji', e)}
                        className={clsx(
                          'flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] text-xl transition-all duration-200',
                          sel ? 'bg-primary-bg scale-110' : 'bg-surface-alt',
                        )}
                        style={{
                          border: `2px solid ${sel ? COLORS.primary : COLORS.border}`,
                        }}
                      >
                        {e}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Currency & Tax */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-semibold">Default Currency</label>
                  <div className="bg-surface-alt text-text border-border flex items-center gap-2 rounded-xl border-[1.5px] px-3.5 py-[13px] text-sm">
                    <DollarSign size={16} className="text-text-dim" /> 🇬🇭 Ghanaian Cedi (GH₵)
                  </div>
                </div>
                <div>
                  <label className="text-text-muted mb-1.5 block text-xs font-semibold">VAT / Tax</label>
                  <div className="flex gap-2">
                    <div
                      onClick={() => u('taxEnabled', !form.taxEnabled)}
                      className={clsx(
                        'flex flex-1 cursor-pointer items-center justify-between rounded-xl px-3.5 py-[13px] transition-all duration-200',
                        form.taxEnabled ? 'bg-primary-bg' : 'bg-surface-alt',
                      )}
                      style={{
                        border: `1.5px solid ${form.taxEnabled ? COLORS.primary : COLORS.border}`,
                      }}
                    >
                      <span
                        className={clsx(
                          'text-[13px] font-semibold',
                          form.taxEnabled ? 'text-primary' : 'text-text-muted',
                        )}
                      >
                        {form.taxEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <div
                        className={clsx(
                          'h-5 w-9 rounded-[10px] p-0.5 transition-all duration-200',
                          form.taxEnabled ? 'bg-primary' : 'bg-border',
                        )}
                      >
                        <div
                          className="h-4 w-4 rounded-full bg-white transition-all duration-200"
                          style={{
                            transform: form.taxEnabled ? 'translateX(16px)' : 'translateX(0)',
                          }}
                        />
                      </div>
                    </div>
                    {form.taxEnabled && (
                      <input
                        type="number"
                        value={form.taxRate}
                        onChange={(e) => u('taxRate', e.target.value)}
                        className="bg-surface-alt text-text border-border w-20 rounded-xl border-[1.5px] px-2.5 py-[13px] text-center font-[inherit] text-sm font-bold outline-none"
                        placeholder="%"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory method */}
              <div>
                <label className="text-text-muted mb-2 block text-xs font-semibold">Inventory Costing Method</label>
                <div className="flex flex-col gap-2">
                  {INVENTORY_METHODS.map((im) => {
                    const sel = form.inventoryMethod === im.value;
                    return (
                      <div
                        key={im.value}
                        onClick={() => u('inventoryMethod', im.value)}
                        className={clsx(
                          'flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200',
                          sel ? 'bg-primary-bg' : 'bg-surface-alt',
                        )}
                        style={{
                          border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                        }}
                      >
                        <span className="text-2xl">{im.icon}</span>
                        <div className="flex-1">
                          <div className={clsx('text-sm font-bold', sel ? 'text-primary' : 'text-text')}>
                            {im.label}
                          </div>
                          <div className="text-text-dim text-xs">{im.desc}</div>
                        </div>
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200"
                          style={{
                            border: `2px solid ${sel ? COLORS.primary : COLORS.border}`,
                          }}
                        >
                          {sel && <div className="bg-primary h-2.5 w-2.5 rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receipt logo upload */}
              <div>
                <label className="text-text-muted mb-2 block text-xs font-semibold">Receipt Logo (optional)</label>
                <input
                  id="wizardReceiptLogo"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || file.size > 2 * 1024 * 1024) return;
                    const reader = new FileReader();
                    reader.onload = (ev) =>
                      u('receiptLogo', {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        dataUrl: ev.target?.result as string,
                      });
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
                {!form.receiptLogo ? (
                  <div
                    onClick={() => document.getElementById('wizardReceiptLogo')?.click()}
                    className="bg-surface-alt border-border hover:border-primary hover:bg-primary-bg cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-all duration-150"
                  >
                    <Upload size={20} className="text-text-dim mx-auto mb-1.5" />
                    <div className="text-text-muted text-[13px] font-semibold">Click to upload receipt logo</div>
                    <div className="text-text-dim text-[11px]">PNG, JPG &middot; Max 2MB</div>
                  </div>
                ) : (
                  <div
                    className="border-border overflow-hidden rounded-xl border-[1.5px]"
                    style={{
                      animation: 'modalIn 0.2s ease',
                    }}
                  >
                    <div
                      className="flex min-h-[60px] justify-center p-3.5"
                      style={{
                        background: `repeating-conic-gradient(${COLORS.surfaceAlt} 0% 25%, ${COLORS.surface} 0% 50%) 50% / 12px 12px`,
                      }}
                    >
                      <img
                        src={form.receiptLogo.dataUrl}
                        alt="Receipt logo"
                        className="rounded object-contain"
                        style={{ maxWidth: 180, maxHeight: 55 }}
                      />
                    </div>
                    <div className="bg-surface border-border flex items-center gap-2 border-t px-3 py-2">
                      <CheckCircle size={13} className="text-success shrink-0" />
                      <div className="text-text flex-1 truncate text-[11px] font-semibold">{form.receiptLogo.name}</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById('wizardReceiptLogo')?.click();
                        }}
                        className="border-border text-text-muted rounded-md border bg-transparent px-2 py-1 font-[inherit] text-[10px] font-semibold"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          u('receiptLogo', null);
                        }}
                        className="bg-danger-bg text-danger border-danger/[0.13] rounded-md border px-2 py-1 font-[inherit] text-[10px] font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div style={{ animation: 'modalIn 0.3s ease' }}>
            <h2 className="text-text m-0 mb-1 text-xl font-extrabold sm:text-2xl">Review & Launch</h2>
            <p className="text-text-dim m-0 mb-6 text-sm">Everything looks good? Let&apos;s get your shop running.</p>

            {/* Shop preview card */}
            <div className="bg-surface border-border relative mb-5 overflow-hidden rounded-2xl border-[1.5px] p-6">
              <div
                className="absolute top-0 right-0 left-0 h-1"
                style={{
                  background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
                }}
              />
              <div className="mb-5 flex items-center gap-3.5">
                <ShopLogo
                  shop={{
                    icon: form.logoEmoji,
                    logoUrl: form.logoMode === 'upload' && form.shopLogo ? form.shopLogo.dataUrl : null,
                  }}
                  size={64}
                  borderRadius={18}
                  fontSize={32}
                />
                <div>
                  <div className="text-text text-xl font-extrabold">{form.name || 'Untitled Shop'}</div>
                  <div className="text-text-dim flex items-center gap-1.5 text-[13px]">
                    <span className="text-base">{BUSINESS_TYPES.find((b) => b.value === form.type)?.icon || '🏪'}</span>
                    {BUSINESS_TYPES.find((b) => b.value === form.type)?.label || 'Business'} &middot;{' '}
                    {form.city || form.region || 'Ghana'}
                  </div>
                </div>
              </div>

              {/* Details grid */}
              {[
                {
                  section: 'Contact',
                  items: [
                    { label: 'Phone', value: form.phone, icon: Phone },
                    { label: 'Email', value: form.email, icon: Mail },
                    { label: 'Address', value: form.address || 'Not set', icon: MapPin },
                    { label: 'GPS', value: form.gps || 'Not set', icon: Globe },
                  ],
                },
                {
                  section: 'Operations',
                  items: [
                    {
                      label: 'Hours',
                      value: OPERATING_HOURS.find((h) => h.value === form.hours)?.label || form.hours,
                      icon: Clock,
                    },
                    { label: 'Currency', value: 'Ghanaian Cedi (GH₵)', icon: DollarSign },
                    { label: 'VAT', value: form.taxEnabled ? `${form.taxRate}%` : 'Disabled', icon: Info },
                    {
                      label: 'Inventory Method',
                      value:
                        INVENTORY_METHODS.find((m) => m.value === form.inventoryMethod)?.label || form.inventoryMethod,
                      icon: Box,
                    },
                  ],
                },
              ].map((group) => (
                <div key={group.section} className="mb-4">
                  <div className="form-label mb-2">{group.section}</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="bg-surface-alt flex items-center gap-2.5 rounded-[10px] px-3 py-2.5"
                        >
                          <ItemIcon size={14} className="text-text-dim shrink-0" />
                          <div>
                            <div className="text-text-dim text-[10px] font-semibold">{item.label}</div>
                            <div
                              className={clsx(
                                'text-[13px] font-semibold',
                                item.value === 'Not set' ? 'text-text-dim' : 'text-text',
                              )}
                            >
                              {item.value || '\u2014'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Your role */}
              <div className="bg-primary-bg border-primary/[0.13] flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5">
                <span className="text-lg">👑</span>
                <div>
                  <div className="text-primary text-xs font-bold">Your Role: Owner</div>
                  <div className="text-text-dim text-[11px]">
                    Full access to all features, billing, and team management
                  </div>
                </div>
              </div>
            </div>

            {/* Edit warning */}
            <div className="bg-surface-alt border-border mb-5 flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3">
              <Info size={16} className="text-text-dim mt-px shrink-0" />
              <div className="text-text-dim text-xs leading-relaxed">
                You can update all shop details from <strong className="text-text">Settings</strong> after launch.
                Invite team members, configure payment methods, and customise your receipt layout anytime.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-border bg-surface flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3 sm:px-8 sm:py-3.5 md:px-12">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-text-muted border-border flex items-center gap-1.5 rounded-[10px] border-[1.5px] bg-transparent px-5 py-[11px] font-[inherit] text-[13px] font-semibold"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Step dots mobile */}
          {mobile && (
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={clsx(
                    'rounded-[3px] transition-all duration-300',
                    s === step ? 'bg-primary' : s < step ? 'bg-success' : 'bg-border',
                  )}
                  style={{
                    width: s === step ? 20 : 6,
                    height: 6,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={clsx(
                'flex items-center gap-1.5 rounded-[10px] border-none px-6 py-[11px] font-[inherit] text-[13px] font-bold',
                canProceed() ? 'cursor-pointer text-white' : 'text-text-dim cursor-not-allowed',
              )}
              style={{
                background: canProceed()
                  ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                  : COLORS.surfaceAlt,
                boxShadow: canProceed() ? `0 4px 16px ${COLORS.primary}40` : 'none',
              }}
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              disabled={launching}
              className="flex items-center gap-2 rounded-[10px] border-none px-7 py-[11px] font-[inherit] text-sm font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${COLORS.success}, #059669)`,
                boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
              }}
            >
              {launching ? (
                <>
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />{' '}
                  Launching...
                </>
              ) : (
                <>
                  <Zap size={16} /> Launch Your Shop
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
