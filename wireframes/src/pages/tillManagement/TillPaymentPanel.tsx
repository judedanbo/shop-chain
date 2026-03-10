import React from 'react';
import { Banknote, CreditCard, Smartphone, CheckCircle, Wallet, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Till, ThemeColors } from '@/types';
import type { PaymentMethod } from './TillManagementPage';

interface TillPaymentPanelProps {
  paymentComplete: boolean;
  payingAmount: number;
  paymentMethod: PaymentMethod;
  amountTendered: string;
  cardType: string;
  cardTransNo: string;
  momoProvider: string;
  momoPhone: string;
  momoTransId: string;
  change: number;
  canProcessPayment: boolean;
  selectedTill: Till | null;
  outstandingBalance: number;
  isClosingTill: boolean;
  canApplyDiscount: boolean;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  discountExceedsLimit: boolean;
  discountAmount: number;
  discountLabel: string;
  roleMaxDiscountPercent: number;
  COLORS: ThemeColors;
  onSetPaymentMethod: (method: PaymentMethod) => void;
  onSetAmountTendered: (value: string) => void;
  onSetCardType: (value: string) => void;
  onSetCardTransNo: (value: string) => void;
  onSetMomoProvider: (value: string) => void;
  onSetMomoPhone: (value: string) => void;
  onSetMomoTransId: (value: string) => void;
  onSetDiscountType: (type: 'percent' | 'fixed') => void;
  onSetDiscountValue: (value: string) => void;
  onProcessPayment: () => void;
  onCloseTill: () => void;
  onDone: () => void;
  onPayMore: () => void;
  onCancel: () => void;
}

export const TillPaymentPanel: React.FC<TillPaymentPanelProps> = ({
  paymentComplete,
  payingAmount,
  paymentMethod,
  amountTendered,
  cardType,
  cardTransNo,
  momoProvider,
  momoPhone,
  momoTransId,
  change,
  canProcessPayment,
  selectedTill,
  outstandingBalance,
  isClosingTill,
  canApplyDiscount,
  discountType,
  discountValue,
  discountExceedsLimit,
  discountAmount,
  discountLabel,
  roleMaxDiscountPercent,
  COLORS,
  onSetPaymentMethod,
  onSetAmountTendered,
  onSetCardType,
  onSetCardTransNo,
  onSetMomoProvider,
  onSetMomoPhone,
  onSetMomoTransId,
  onSetDiscountType,
  onSetDiscountValue,
  onProcessPayment,
  onCloseTill,
  onDone,
  onPayMore,
  onCancel,
}) => {
  if (paymentComplete) {
    return (
      <div className="p-6 text-center">
        <div className="bg-success-bg mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
          <CheckCircle size={28} className="text-success" />
        </div>
        <div className="text-text mb-1 text-lg font-extrabold">Payment Recorded</div>
        <div className="text-text-dim mb-1 text-sm">GH₵ {payingAmount.toFixed(2)}</div>
        {paymentMethod === 'cash' && change > 0 && (
          <div className="text-success mb-3 text-[13px] font-bold">Change: GH₵ {change.toFixed(2)}</div>
        )}
        {selectedTill && (
          <div className="bg-surface-alt border-border my-3 rounded-[10px] border p-3">
            <div className="text-text-muted mb-1 text-[11px] font-semibold">Till Payment Summary</div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text">Total Payments</span>
              <span className="text-text font-bold">{selectedTill.totalPayments}</span>
            </div>
            <div className="mt-1 flex justify-between text-[13px]">
              <span className="text-text">Total Collected</span>
              <span className="text-success font-bold">GH₵ {selectedTill.totalPaymentAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
        <div className="flex justify-center gap-2">
          {isClosingTill ? (
            <Button variant="primary" icon={XCircle} onClick={onCloseTill}>
              Proceed to Close Till
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onDone}>
                Done
              </Button>
              {outstandingBalance > 0 && (
                <Button variant="primary" onClick={onPayMore}>
                  Pay More
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-surface-alt border-t p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-text text-sm font-bold">{isClosingTill ? 'Close Till — Payment' : 'Process Payment'}</div>
        <button
          type="button"
          onClick={onCancel}
          className="text-danger border-none bg-transparent font-[inherit] text-xs font-semibold"
        >
          {isClosingTill ? 'Back' : 'Cancel'}
        </button>
      </div>

      {selectedTill && selectedTill.totalPayments > 0 && (
        <div className="bg-success-bg border-success/[0.19] mb-3 flex items-center justify-between rounded-lg border p-2.5">
          <div className="text-success text-[11px]">
            <Wallet size={12} className="mr-1 align-middle" />
            {selectedTill.totalPayments} payment{selectedTill.totalPayments !== 1 ? 's' : ''} recorded
          </div>
          <div className="text-success text-[13px] font-bold">GH₵ {selectedTill.totalPaymentAmount.toFixed(2)}</div>
        </div>
      )}

      {/* Discount section */}
      {canApplyDiscount && outstandingBalance > 0 && (
        <div className="bg-surface border-border mb-3 rounded-[10px] border p-3">
          <div className="text-text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">Discount</div>
          <div className="mb-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => onSetDiscountType('percent')}
              className="flex-1 rounded-md px-2.5 py-1.5 font-[inherit] text-[11px] font-semibold"
              style={{
                border: `1.5px solid ${discountType === 'percent' ? COLORS.primary : COLORS.border}`,
                background: discountType === 'percent' ? COLORS.primaryBg : 'transparent',
                color: discountType === 'percent' ? COLORS.primary : COLORS.textMuted,
              }}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => onSetDiscountType('fixed')}
              className="flex-1 rounded-md px-2.5 py-1.5 font-[inherit] text-[11px] font-semibold"
              style={{
                border: `1.5px solid ${discountType === 'fixed' ? COLORS.primary : COLORS.border}`,
                background: discountType === 'fixed' ? COLORS.primaryBg : 'transparent',
                color: discountType === 'fixed' ? COLORS.primary : COLORS.textMuted,
              }}
            >
              Fixed (GH₵)
            </button>
          </div>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => onSetDiscountValue(e.target.value)}
            placeholder={discountType === 'percent' ? 'Enter %' : 'Enter amount'}
            className="bg-surface-alt text-text box-border w-full rounded-lg px-3 py-2 font-[inherit] text-[13px] outline-none"
            style={{
              border: `1.5px solid ${discountExceedsLimit ? COLORS.warning : COLORS.border}`,
            }}
          />
          {discountExceedsLimit && (
            <div className="text-warning mt-1 text-[10px]">
              Your role allows max {roleMaxDiscountPercent}% discount. Value will be clamped.
            </div>
          )}
          {discountAmount > 0 && (
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-text-muted">{discountLabel}</span>
              <span className="text-danger font-bold">-GH₵ {discountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      <div className="bg-primary-bg border-primary/[0.19] mb-3.5 rounded-[10px] border-[1.5px] p-3">
        <div className="text-primary mb-1.5 text-[11px] font-semibold tracking-wide uppercase">Outstanding Balance</div>
        {discountAmount > 0 && (
          <div className="mb-1 flex justify-between text-[13px]">
            <span className="text-text-muted">Original</span>
            <span className="text-text-muted line-through">GH₵ {outstandingBalance.toFixed(2)}</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="mb-1 flex justify-between text-[13px]">
            <span className="text-danger">{discountLabel}</span>
            <span className="text-danger font-semibold">-GH₵ {discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-extrabold">
          <span className="text-text">Amount Due</span>
          <span style={{ color: payingAmount > 0 ? COLORS.primary : COLORS.success }}>
            GH₵ {payingAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {payingAmount === 0 ? (
        <div className="p-4 text-center">
          <div className="text-success mb-3 text-[13px] font-semibold">All orders paid</div>
          {isClosingTill ? (
            <Button variant="primary" icon={XCircle} onClick={onCloseTill} className="w-full justify-center">
              Proceed to Close Till
            </Button>
          ) : (
            <Button variant="secondary" onClick={onDone} className="w-full justify-center">
              Done
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="text-text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">Payment Method</div>
          <div className="mb-3.5 flex gap-2">
            {[
              { key: 'cash' as const, icon: Banknote, label: 'Cash' },
              { key: 'card' as const, icon: CreditCard, label: 'Card' },
              { key: 'momo' as const, icon: Smartphone, label: 'MoMo' },
            ].map((m) => {
              const sel = paymentMethod === m.key;
              const Icon = m.icon;
              return (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => onSetPaymentMethod(m.key)}
                  className="flex flex-1 flex-col items-center gap-1 rounded-[10px] px-2 py-2.5 font-[inherit] text-[11px] font-semibold"
                  style={{
                    border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                    background: sel ? COLORS.primaryBg : COLORS.surface,
                    color: sel ? COLORS.primary : COLORS.textMuted,
                  }}
                >
                  <Icon size={18} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {paymentMethod === 'cash' && (
            <div className="mb-3">
              <label className="text-text-muted mb-1 block text-[11px] font-semibold">Amount Tendered</label>
              <input
                type="number"
                value={amountTendered}
                onChange={(e) => onSetAmountTendered(e.target.value)}
                placeholder={`Min GH₵ ${payingAmount.toFixed(2)}`}
                className="bg-surface text-text border-border box-border w-full rounded-lg border-[1.5px] px-3 py-[9px] font-[inherit] text-sm font-bold outline-none"
              />
              {amountTendered && parseFloat(amountTendered) >= payingAmount && (
                <div className="text-success mt-1.5 text-[13px] font-bold">Change: GH₵ {change.toFixed(2)}</div>
              )}
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="mb-3">
              <label className="text-text-muted mb-1 block text-[11px] font-semibold">Card Type</label>
              <div className="mb-2.5 flex gap-1.5">
                {['Visa', 'Mastercard', 'Other'].map((ct) => (
                  <button
                    type="button"
                    key={ct}
                    onClick={() => onSetCardType(ct)}
                    className="flex-1 rounded-lg px-2 py-[7px] font-[inherit] text-[11px] font-semibold"
                    style={{
                      border: `1.5px solid ${cardType === ct ? COLORS.primary : COLORS.border}`,
                      background: cardType === ct ? COLORS.primaryBg : COLORS.surface,
                      color: cardType === ct ? COLORS.primary : COLORS.textMuted,
                    }}
                  >
                    {ct}
                  </button>
                ))}
              </div>
              <label className="text-text-muted mb-1 block text-[11px] font-semibold">Transaction Number</label>
              <input
                value={cardTransNo}
                onChange={(e) => onSetCardTransNo(e.target.value)}
                placeholder="e.g. TXN-12345"
                className="bg-surface text-text border-border box-border w-full rounded-lg border-[1.5px] px-3 py-[9px] font-[inherit] text-[13px] outline-none"
              />
            </div>
          )}

          {paymentMethod === 'momo' && (
            <div className="mb-3">
              <label className="text-text-muted mb-1 block text-[11px] font-semibold">Provider</label>
              <div className="mb-2.5 flex gap-1.5">
                {['MTN MoMo', 'Vodafone Cash', 'AirtelTigo'].map((prov) => (
                  <button
                    type="button"
                    key={prov}
                    onClick={() => onSetMomoProvider(prov)}
                    className="flex-1 rounded-lg px-1.5 py-[7px] font-[inherit] text-[10px] font-semibold"
                    style={{
                      border: `1.5px solid ${momoProvider === prov ? COLORS.primary : COLORS.border}`,
                      background: momoProvider === prov ? COLORS.primaryBg : COLORS.surface,
                      color: momoProvider === prov ? COLORS.primary : COLORS.textMuted,
                    }}
                  >
                    {prov}
                  </button>
                ))}
              </div>
              <label className="text-text-muted mb-1 block text-[11px] font-semibold">Phone Number</label>
              <input
                value={momoPhone}
                onChange={(e) => onSetMomoPhone(e.target.value)}
                placeholder="e.g. 024 XXX XXXX"
                className="bg-surface text-text border-border mb-2.5 box-border w-full rounded-lg border-[1.5px] px-3 py-[9px] font-[inherit] text-[13px] outline-none"
              />
              <label className="text-text-muted mb-1 block text-[11px] font-semibold">Transaction ID</label>
              <input
                value={momoTransId}
                onChange={(e) => onSetMomoTransId(e.target.value)}
                placeholder="e.g. MOMO-XXXXXX"
                className="bg-surface text-text border-border box-border w-full rounded-lg border-[1.5px] px-3 py-[9px] font-[inherit] text-[13px] outline-none"
              />
            </div>
          )}

          {paymentMethod && (
            <Button
              variant="primary"
              icon={CheckCircle}
              onClick={onProcessPayment}
              disabled={!canProcessPayment}
              className="w-full justify-center px-4 py-[11px] text-sm"
            >
              Process GH₵ {payingAmount.toFixed(2)}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
