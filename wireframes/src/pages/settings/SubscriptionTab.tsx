import type { ReactNode } from 'react';
import clsx from 'clsx';
import {
  CreditCard,
  Calendar,
  Plus,
  X,
  Edit,
  Trash2,
  FileText,
  Clock,
  Info,
  AlertTriangle,
  CheckCircle,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ThemeColors } from '@/types';
import type { Breakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import type { PaymentMethodItem, PmFormData, PlanTierData, BillingEntry } from './AccountPage';

// ─── Props ────────────────────────────────────────────────────

export interface SubscriptionTabProps {
  plan: PlanTierData;
  payMethods: PaymentMethodItem[];
  setPayMethods: React.Dispatch<React.SetStateAction<PaymentMethodItem[]>>;
  autoPay: boolean;
  setAutoPay: React.Dispatch<React.SetStateAction<boolean>>;
  billingHistory: BillingEntry[];
  pmForm: PmFormData;
  setPmForm: React.Dispatch<React.SetStateAction<PmFormData>>;
  showAddPM: boolean;
  setShowAddPM: React.Dispatch<React.SetStateAction<boolean>>;
  editPM: string | null;
  setEditPM: React.Dispatch<React.SetStateAction<string | null>>;
  confirmRemovePM: PaymentMethodItem | null;
  setConfirmRemovePM: React.Dispatch<React.SetStateAction<PaymentMethodItem | null>>;
  profileName: string;
  renewalDate: Date;
  daysToRenew: number;
  setShowPlanModal: React.Dispatch<React.SetStateAction<boolean>>;
  COLORS: ThemeColors;
  bp: Breakpoint;
}

// ─── Internal helpers ─────────────────────────────────────────

const SectionCard = ({
  children,
  className: extraClassName,
  style,
  mobile,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  mobile: boolean;
}) => (
  <div
    className={clsx('bg-surface border-border mb-4 rounded-[14px] border-[1.5px]', extraClassName)}
    style={{
      padding: mobile ? 16 : 20,
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub?: string }) => (
  <div className="mb-4 flex items-center gap-2.5">
    <div className="border-primary/[0.08] bg-primary/[0.06] flex h-9 w-9 items-center justify-center rounded-[10px] border-[1.5px]">
      <Icon size={17} className="text-primary" />
    </div>
    <div>
      <div className="text-text text-sm font-extrabold">{title}</div>
      {sub && <div className="text-text-dim text-[11px]">{sub}</div>}
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────

export const SubscriptionTab = ({
  plan,
  payMethods,
  setPayMethods,
  autoPay,
  setAutoPay,
  billingHistory,
  pmForm,
  setPmForm,
  showAddPM,
  setShowAddPM,
  editPM,
  setEditPM,
  confirmRemovePM,
  setConfirmRemovePM,
  profileName,
  renewalDate,
  daysToRenew,
  setShowPlanModal,
  COLORS,
  bp,
}: SubscriptionTabProps) => {
  const mobile = isMobile(bp);

  return (
    <div>
      {/* Renewal Notification Banner */}
      {plan.price > 0 && daysToRenew <= 14 && (
        <div
          className="mb-4 flex items-center gap-2.5 rounded-xl px-4 py-3"
          style={{
            background:
              daysToRenew <= 3 ? COLORS.dangerBg : daysToRenew <= 7 ? `${COLORS.warning}12` : `${COLORS.primary}08`,
            border: `1.5px solid ${daysToRenew <= 3 ? COLORS.danger : daysToRenew <= 7 ? COLORS.warning : COLORS.primary}30`,
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
            style={{
              background:
                daysToRenew <= 3
                  ? `${COLORS.danger}15`
                  : daysToRenew <= 7
                    ? `${COLORS.warning}15`
                    : `${COLORS.primary}15`,
            }}
          >
            <Clock
              size={18}
              className={daysToRenew <= 3 ? 'text-danger' : daysToRenew <= 7 ? 'text-warning' : 'text-primary'}
            />
          </div>
          <div className="flex-1">
            <div
              className={clsx(
                'text-[13px] font-bold',
                daysToRenew <= 3 ? 'text-danger' : daysToRenew <= 7 ? 'text-warning' : 'text-text',
              )}
            >
              {daysToRenew === 0
                ? 'Subscription renews today!'
                : `${daysToRenew} day${daysToRenew !== 1 ? 's' : ''} until renewal`}
            </div>
            <div className="text-text-dim text-[11px]">
              {autoPay
                ? `GH\u20B5 ${plan.price} will be charged to your ${payMethods.find((p) => p.role === 'primary')?.provider || 'payment method'} on ${renewalDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : `Manual payment of GH\u20B5 ${plan.price} due by ${renewalDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </div>
          </div>
          {!autoPay && (
            <button
              type="button"
              className="rounded-lg border-none px-4 py-2 font-[inherit] text-[11px] font-bold whitespace-nowrap text-white"
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              }}
            >
              Pay Now
            </button>
          )}
        </div>
      )}

      {/* Current Plan Card */}
      <SectionCard className="relative overflow-hidden" mobile={mobile}>
        <div
          className="absolute top-0 right-0 left-0 h-[3px]"
          style={{
            background: `linear-gradient(90deg, ${plan.color}, ${COLORS.accent})`,
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-2xl"
              style={{
                background: `${plan.color}12`,
                border: `2px solid ${plan.color}25`,
              }}
            >
              {plan.icon}
            </div>
            <div>
              <div className="text-text text-lg font-extrabold">{plan.name} Plan</div>
              <div className="text-text-dim text-[13px]">
                {plan.price === 0 ? 'Free forever' : `GH\u20B5 ${plan.price}/month`}
              </div>
              {plan.price > 0 && (
                <div className="text-text-dim text-[11px]">
                  Renews {renewalDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPlanModal(true)}
            className="text-primary border-primary rounded-[10px] border-[1.5px] bg-transparent px-[22px] py-2.5 font-[inherit] text-[13px] font-bold"
          >
            Change Plan
          </button>
        </div>
      </SectionCard>

      {/* Payment Schedule */}
      {plan.price > 0 && (
        <SectionCard mobile={mobile}>
          <SectionTitle icon={Calendar} title="Payment Schedule" />
          <div className="flex flex-wrap gap-2.5">
            {[
              { id: 'auto', label: 'Auto-Pay', desc: 'Charged automatically on renewal date', icon: '\u26A1' },
              { id: 'manual', label: 'Pay Manually', desc: 'Reminder sent before due date', icon: '\u270B' },
            ].map((opt) => (
              <div
                key={opt.id}
                onClick={() => setAutoPay(opt.id === 'auto')}
                className="min-w-[180px] flex-1 cursor-pointer rounded-xl px-4 py-3.5 transition-all duration-150"
                style={{
                  border: `1.5px solid ${(opt.id === 'auto' ? autoPay : !autoPay) ? COLORS.primary : COLORS.border}`,
                  background: (opt.id === 'auto' ? autoPay : !autoPay) ? `${COLORS.primary}08` : 'transparent',
                }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-base">{opt.icon}</span>
                  <span className="text-text text-[13px] font-bold">{opt.label}</span>
                  {(opt.id === 'auto' ? autoPay : !autoPay) && (
                    <CheckCircle size={14} className="text-primary ml-auto" />
                  )}
                </div>
                <div className="text-text-dim text-[11px]">{opt.desc}</div>
              </div>
            ))}
          </div>
          {autoPay && (
            <div className="bg-surface-alt border-border text-text-dim mt-3 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[11px]">
              <Info size={13} className="text-primary shrink-0" />
              Your {payMethods.find((p) => p.role === 'primary')?.provider || 'primary payment method'} will be charged
              GH{'\u20B5'} {plan.price} on each renewal date. If it fails, your{' '}
              {payMethods.find((p) => p.role === 'backup')?.provider || 'backup method'} will be tried.
            </div>
          )}
          {!autoPay && (
            <div className="text-text-dim border-warning/[0.13] bg-warning/[0.03] mt-3 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[11px]">
              <AlertTriangle size={13} className="text-warning shrink-0" />
              You'll receive reminders at 7 days and 3 days before renewal. If not paid by the due date, your
              subscription may be downgraded.
            </div>
          )}
        </SectionCard>
      )}

      {/* Payment Methods */}
      <SectionCard mobile={mobile}>
        <div className="mb-3.5 flex items-center justify-between">
          <SectionTitle icon={CreditCard} title="Payment Methods" />
          <button
            type="button"
            onClick={() => {
              setPmForm({ type: 'momo', provider: '', last4: '', name: profileName, expiry: '' });
              setEditPM(null);
              setShowAddPM(true);
            }}
            className="flex items-center gap-1 rounded-lg border-none px-3.5 py-[7px] font-[inherit] text-[11px] font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            }}
          >
            <Plus size={13} /> Add Method
          </button>
        </div>

        {payMethods.length === 0 && (
          <div className="border-border bg-surface-alt rounded-xl border-[1.5px] border-dashed p-[30px] text-center">
            <CreditCard size={28} className="text-text-dim mb-2" />
            <div className="text-text text-[13px] font-semibold">No payment methods</div>
            <div className="text-text-dim mt-1 text-[11px]">
              Add a mobile money or card to manage your subscription.
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {payMethods.map((pm) => {
            const isPrimary = pm.role === 'primary';
            const isBackup = pm.role === 'backup';
            const isExpired =
              pm.status === 'expired' ||
              (pm.expiry
                ? (() => {
                    const [m, y] = pm.expiry.split('/');
                    return new Date(2000 + parseInt(y ?? '0'), parseInt(m ?? '0')) < new Date();
                  })()
                : false);
            return (
              <div
                key={pm.id}
                className="rounded-xl px-4 py-3.5 transition-all duration-150"
                style={{
                  border: `1.5px solid ${isPrimary ? COLORS.primary + '40' : isBackup ? COLORS.accent + '30' : COLORS.border}`,
                  background: isPrimary ? `${COLORS.primary}06` : 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] text-xl"
                    style={{
                      background: pm.type === 'momo' ? '#FBBF2415' : `${COLORS.primary}12`,
                    }}
                  >
                    {pm.type === 'momo' ? '\uD83D\uDCF1' : '\uD83D\uDCB3'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-text text-[13px] font-bold">{pm.provider}</span>
                      <span className="text-text-dim font-mono text-[11px]">
                        {'\u2022\u2022\u2022\u2022'} {pm.last4}
                      </span>
                      {isPrimary && (
                        <span className="text-primary bg-primary/[0.13] rounded-[5px] px-[7px] py-0.5 text-[9px] font-extrabold">
                          PRIMARY
                        </span>
                      )}
                      {isBackup && (
                        <span className="text-accent bg-accent/[0.13] rounded-[5px] px-[7px] py-0.5 text-[9px] font-extrabold">
                          BACKUP
                        </span>
                      )}
                      {isExpired && (
                        <span className="bg-danger-bg text-danger rounded-[5px] px-[7px] py-0.5 text-[9px] font-extrabold">
                          EXPIRED
                        </span>
                      )}
                    </div>
                    <div className="text-text-dim mt-0.5 text-[10px]">
                      {pm.name}
                      {pm.expiry && !isExpired ? ` \u00B7 Exp ${pm.expiry}` : ''}
                      {pm.expiry && isExpired ? ` \u00B7 Expired ${pm.expiry}` : ''} \u00B7 Added {pm.added}
                    </div>
                  </div>
                </div>
                {/* Actions Row */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() =>
                        setPayMethods((prev) =>
                          prev.map((p) => ({
                            ...p,
                            role:
                              p.id === pm.id
                                ? 'primary'
                                : p.role === 'primary'
                                  ? prev.find((x) => x.role === 'backup' && x.id !== pm.id)
                                    ? 'backup'
                                    : 'none'
                                  : p.role,
                          })),
                        )
                      }
                      className="text-primary border-primary/[0.19] bg-primary/[0.03] rounded-md border px-2.5 py-[5px] font-[inherit] text-[10px] font-bold"
                    >
                      Set as Primary
                    </button>
                  )}
                  {!isBackup && !isPrimary && payMethods.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPayMethods((prev) =>
                          prev.map((p) => ({
                            ...p,
                            role: p.id === pm.id ? 'backup' : p.role === 'backup' ? 'none' : p.role,
                          })),
                        )
                      }
                      className="text-accent border-accent/[0.19] bg-accent/[0.03] rounded-md border px-2.5 py-[5px] font-[inherit] text-[10px] font-bold"
                    >
                      Set as Backup
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPmForm({
                        type: pm.type,
                        provider: pm.provider,
                        last4: pm.last4,
                        name: pm.name,
                        expiry: pm.expiry || '',
                      });
                      setEditPM(pm.id);
                      setShowAddPM(true);
                    }}
                    className="border-border text-text-muted flex items-center gap-0.5 rounded-md border bg-transparent px-2.5 py-[5px] font-[inherit] text-[10px] font-semibold"
                  >
                    <Edit size={10} /> Update
                  </button>
                  {payMethods.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setConfirmRemovePM(pm)}
                      className="text-danger border-danger/[0.15] flex items-center gap-0.5 rounded-md border bg-transparent px-2.5 py-[5px] font-[inherit] text-[10px] font-semibold"
                    >
                      <Trash2 size={10} /> Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Billing History */}
      <SectionCard mobile={mobile}>
        <SectionTitle icon={FileText} title="Billing History" />
        <div className="border-border overflow-hidden rounded-[10px] border">
          {billingHistory.map((inv, i) => (
            <div
              key={inv.id}
              className={clsx('flex items-center gap-3 px-4 py-3', i % 2 !== 0 && 'bg-surface-alt')}
              style={{
                borderBottom: i < billingHistory.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="text-text text-xs font-semibold">{inv.desc}</div>
                <div className="text-text-dim text-[10px]">{inv.date}</div>
              </div>
              <div className="text-text text-[13px] font-bold">{inv.amount}</div>
              <span className="text-success bg-success/[0.07] rounded-[5px] px-2 py-0.5 text-[10px] font-bold">
                Paid
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Add / Edit Payment Method Modal */}
      {showAddPM && (
        <>
          <div
            onClick={() => setShowAddPM(false)}
            className="z-modal-backdrop fixed inset-0 backdrop-blur-[2px]"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
          <div
            className="bg-surface border-border z-modal fixed top-1/2 left-1/2 w-full max-w-[440px] rounded-[18px] border-[1.5px]"
            style={{
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'modalIn 0.2s ease',
            }}
          >
            <div className="border-border flex items-center justify-between border-b px-[22px] py-[18px]">
              <div className="text-text text-base font-extrabold">
                {editPM ? 'Update Payment Method' : 'Add Payment Method'}
              </div>
              <button type="button" onClick={() => setShowAddPM(false)} aria-label="Close" className="p-1">
                <X size={18} className="text-text-dim" />
              </button>
            </div>
            <div className="p-[22px]">
              {/* Type Selector */}
              <div className="mb-4">
                <div className="text-text-dim mb-1.5 text-[11px] font-bold tracking-wide uppercase">Payment Type</div>
                <div className="flex gap-2">
                  {[
                    { id: 'momo', label: 'Mobile Money', icon: '\uD83D\uDCF1' },
                    { id: 'card', label: 'Card (Paystack)', icon: '\uD83D\uDCB3' },
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setPmForm((p) => ({ ...p, type: t.id, provider: '' }))}
                      className="flex-1 cursor-pointer rounded-[10px] px-3.5 py-3 text-center transition-all duration-150"
                      style={{
                        border: `1.5px solid ${pmForm.type === t.id ? COLORS.primary : COLORS.border}`,
                        background: pmForm.type === t.id ? `${COLORS.primary}08` : 'transparent',
                      }}
                    >
                      <div className="mb-1 text-[22px]">{t.icon}</div>
                      <div
                        className={clsx(
                          'text-xs font-semibold',
                          pmForm.type === t.id ? 'text-primary' : 'text-text-muted',
                        )}
                      >
                        {t.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provider */}
              <div className="mb-3.5">
                <div className="text-text-dim mb-1.5 text-[11px] font-bold tracking-wide uppercase">
                  {pmForm.type === 'momo' ? 'Network Provider' : 'Card Network'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(pmForm.type === 'momo'
                    ? [
                        { id: 'MTN MoMo', label: 'MTN MoMo', color: '#FBBF24' },
                        { id: 'Vodafone Cash', label: 'Vodafone Cash', color: '#EF4444' },
                        { id: 'AirtelTigo Money', label: 'AirtelTigo', color: '#3B82F6' },
                      ]
                    : [
                        { id: 'Visa', label: 'Visa', color: '#1A1F71' },
                        { id: 'Mastercard', label: 'Mastercard', color: '#EB001B' },
                      ]
                  ).map((prov) => (
                    <div
                      key={prov.id}
                      onClick={() => setPmForm((p) => ({ ...p, provider: prov.id }))}
                      className="cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150"
                      style={{
                        border: `1.5px solid ${pmForm.provider === prov.id ? prov.color : COLORS.border}`,
                        background: pmForm.provider === prov.id ? `${prov.color}12` : 'transparent',
                        color: pmForm.provider === prov.id ? prov.color : COLORS.textMuted,
                      }}
                    >
                      {prov.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Number / Card Number */}
              <div className="mb-3.5">
                <div className="text-text-dim mb-1.5 text-[11px] font-bold tracking-wide uppercase">
                  {pmForm.type === 'momo' ? 'Phone Number (last 4 digits)' : 'Card Number (last 4 digits)'}
                </div>
                <input
                  value={pmForm.last4}
                  onChange={(e) => setPmForm((p) => ({ ...p, last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="e.g. 2222"
                  maxLength={4}
                  className="border-border bg-surface-alt text-text w-full max-w-[140px] rounded-[10px] border-[1.5px] px-3.5 py-2.5 text-center font-mono text-base font-semibold tracking-[4px] outline-none"
                />
              </div>

              {/* Name on account */}
              <div className="mb-3.5">
                <div className="text-text-dim mb-1.5 text-[11px] font-bold tracking-wide uppercase">
                  Account Holder Name
                </div>
                <input
                  value={pmForm.name}
                  onChange={(e) => setPmForm((p) => ({ ...p, name: e.target.value }))}
                  className="border-border bg-surface-alt text-text w-full rounded-[10px] border-[1.5px] px-3.5 py-2.5 font-[inherit] text-[13px] outline-none"
                />
              </div>

              {/* Expiry for cards */}
              {pmForm.type === 'card' && (
                <div className="mb-3.5">
                  <div className="text-text-dim mb-1.5 text-[11px] font-bold tracking-wide uppercase">Expiry Date</div>
                  <input
                    value={pmForm.expiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^\d/]/g, '');
                      if (v.length === 2 && !v.includes('/') && pmForm.expiry.length < 3) v += '/';
                      setPmForm((p) => ({ ...p, expiry: v.slice(0, 5) }));
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="border-border bg-surface-alt text-text w-full max-w-[120px] rounded-[10px] border-[1.5px] px-3.5 py-2.5 font-mono text-base font-semibold tracking-[3px] outline-none"
                  />
                </div>
              )}

              {/* Paystack info for cards */}
              {pmForm.type === 'card' && !editPM && (
                <div
                  className="text-text-dim border-primary/[0.08] mb-3.5 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[11px]"
                  style={{
                    background: `${COLORS.primary}06`,
                  }}
                >
                  <Shield size={14} className="text-primary shrink-0" />
                  Card details are processed securely via Paystack. We only store the last 4 digits.
                </div>
              )}

              <button
                type="button"
                disabled={
                  !pmForm.provider ||
                  pmForm.last4.length < 4 ||
                  !pmForm.name.trim() ||
                  (pmForm.type === 'card' && pmForm.expiry.length < 5)
                }
                onClick={() => {
                  if (editPM) {
                    setPayMethods((prev) =>
                      prev.map((p) =>
                        p.id === editPM
                          ? {
                              ...p,
                              type: pmForm.type,
                              provider: pmForm.provider,
                              last4: pmForm.last4,
                              name: pmForm.name,
                              expiry: pmForm.expiry || undefined,
                              status: 'active',
                            }
                          : p,
                      ),
                    );
                  } else {
                    const newId = 'pm' + Date.now();
                    const newMethod: PaymentMethodItem = {
                      id: newId,
                      type: pmForm.type,
                      provider: pmForm.provider,
                      last4: pmForm.last4,
                      name: pmForm.name,
                      role: payMethods.length === 0 ? 'primary' : 'none',
                      added: new Date().toISOString().slice(0, 10),
                      status: 'active',
                      ...(pmForm.type === 'card' ? { expiry: pmForm.expiry } : {}),
                    };
                    setPayMethods((prev) => [...prev, newMethod]);
                  }
                  setShowAddPM(false);
                  setEditPM(null);
                }}
                className={clsx(
                  'w-full rounded-[10px] border-none px-4 py-3 font-[inherit] text-sm font-bold',
                  !pmForm.provider || pmForm.last4.length < 4 ? 'text-text-dim' : 'text-white',
                )}
                style={{
                  background:
                    !pmForm.provider || pmForm.last4.length < 4
                      ? COLORS.surfaceAlt
                      : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                  cursor: !pmForm.provider || pmForm.last4.length < 4 ? 'default' : 'pointer',
                }}
              >
                {editPM ? 'Update Method' : 'Add Payment Method'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirm Remove Payment Method */}
      {confirmRemovePM && (
        <>
          <div
            onClick={() => setConfirmRemovePM(null)}
            className="z-modal-backdrop fixed inset-0"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
          <div
            className="bg-surface border-border z-modal fixed top-1/2 left-1/2 w-full max-w-[380px] rounded-2xl border-[1.5px] p-6"
            style={{
              transform: 'translate(-50%, -50%)',
              animation: 'modalIn 0.2s ease',
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-danger-bg flex h-11 w-11 items-center justify-center rounded-xl">
                <Trash2 size={20} className="text-danger" />
              </div>
              <div>
                <div className="text-text text-[15px] font-extrabold">Remove Payment Method?</div>
                <div className="text-text-dim mt-0.5 text-xs">
                  {confirmRemovePM.provider} {'\u2022\u2022\u2022\u2022'} {confirmRemovePM.last4}
                  {confirmRemovePM.role === 'primary' && ' (Primary)'}
                  {confirmRemovePM.role === 'backup' && ' (Backup)'}
                </div>
              </div>
            </div>
            {confirmRemovePM.role === 'primary' && payMethods.length > 1 && (
              <div className="text-warning border-warning/[0.13] bg-warning/[0.06] mb-3.5 rounded-lg border px-3.5 py-2.5 text-[11px] font-semibold">
                {'\u26A0'} This is your primary method. Another method will be promoted to primary.
              </div>
            )}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmRemovePM(null)}
                className="border-border text-text-muted flex-1 rounded-[10px] border bg-transparent px-4 py-2.5 font-[inherit] text-[13px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const wasPrimary = confirmRemovePM.role === 'primary';
                  setPayMethods((prev) => {
                    const remaining = prev.filter((p) => p.id !== confirmRemovePM.id);
                    if (wasPrimary && remaining.length > 0) {
                      const backupIdx = remaining.findIndex((p) => p.role === 'backup');
                      if (backupIdx >= 0)
                        remaining[backupIdx] = { ...remaining[backupIdx], role: 'primary' } as PaymentMethodItem;
                      else remaining[0] = { ...remaining[0], role: 'primary' } as PaymentMethodItem;
                    }
                    return remaining;
                  });
                  setConfirmRemovePM(null);
                }}
                className="bg-danger flex-1 rounded-[10px] border-none px-4 py-2.5 font-[inherit] text-[13px] font-bold text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
