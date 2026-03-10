import React from 'react';
import clsx from 'clsx';
import { Banknote, CreditCard, Phone, Scissors, CheckCircle, X, Plus } from 'lucide-react';
import type { ThemeColors } from '@/types/theme.types';

export interface SplitEntry {
  method: 'cash' | 'card' | 'momo';
  amount: string;
  amountTendered?: string;
  cardType?: string;
  cardTransNo?: string;
  momoProvider?: string;
  momoPhone?: string;
  momoRef?: string;
}

export type PaymentMethodType = 'cash' | 'card' | 'momo' | null;

export interface POSPaymentFormProps {
  paymentMethod: PaymentMethodType;
  setPaymentMethod: (val: PaymentMethodType) => void;
  splitMode: boolean;
  setSplitMode: (val: boolean) => void;
  splits: SplitEntry[];
  setSplits: React.Dispatch<React.SetStateAction<SplitEntry[]>>;
  amountTendered: string;
  setAmountTendered: (val: string) => void;
  cardType: string;
  setCardType: (val: string) => void;
  cardTransNo: string;
  setCardTransNo: (val: string) => void;
  momoProvider: string;
  setMomoProvider: (val: string) => void;
  momoPhone: string;
  setMomoPhone: (val: string) => void;
  momoRef: string;
  setMomoRef: (val: string) => void;
  total: number;
  canPay: boolean;
  handlePayment: () => void;
  splitTotal: number;
  splitRemaining: number;
  addSplit: () => void;
  removeSplit: (idx: number) => void;
  updateSplit: (idx: number, patch: Partial<SplitEntry>) => void;
  isSplitEntryValid: (sp: SplitEntry) => boolean;
  COLORS: ThemeColors;
}

const MOMO_LABELS: Record<string, string> = {
  mtn: 'MTN MoMo',
  tcash: 'TCash',
  atcash: 'ATCash',
  gmoney: 'G-Money',
};

export const POSPaymentForm: React.FC<POSPaymentFormProps> = ({
  paymentMethod,
  setPaymentMethod,
  splitMode,
  setSplitMode,
  splits,
  setSplits,
  amountTendered,
  setAmountTendered,
  cardType,
  setCardType,
  cardTransNo,
  setCardTransNo,
  momoProvider,
  setMomoProvider,
  momoPhone,
  setMomoPhone,
  momoRef,
  setMomoRef,
  total,
  canPay,
  handlePayment,
  splitRemaining,
  addSplit,
  removeSplit,
  updateSplit,
  isSplitEntryValid,
  COLORS,
}) => {
  return (
    <>
      {/* Payment Method Header + Split Toggle */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="form-label">Payment Method</div>
        <button
          type="button"
          onClick={() => {
            setSplitMode(!splitMode);
            if (!splitMode) {
              setPaymentMethod(null);
              setSplits([]);
            } else {
              setSplits([]);
            }
          }}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all duration-150"
          style={{
            border: `1.5px solid ${splitMode ? COLORS.primary : COLORS.border}`,
            background: splitMode ? COLORS.primaryBg : 'transparent',
            color: splitMode ? COLORS.primary : COLORS.textMuted,
          }}
        >
          <Scissors size={12} /> Split
        </button>
      </div>

      {/* Single Payment Mode */}
      {!splitMode && (
        <>
          <div className="mb-2.5 flex gap-1.5">
            {[
              { key: 'cash' as const, icon: Banknote, label: 'Cash' },
              { key: 'card' as const, icon: CreditCard, label: 'Card' },
              { key: 'momo' as const, icon: Phone, label: 'MoMo' },
            ].map((m) => {
              const sel = paymentMethod === m.key;
              return (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => {
                    setPaymentMethod(m.key);
                    if (m.key !== 'cash') setAmountTendered('');
                    if (m.key !== 'card') {
                      setCardType('');
                      setCardTransNo('');
                    }
                    if (m.key !== 'momo') {
                      setMomoProvider('');
                      setMomoPhone('');
                      setMomoRef('');
                    }
                  }}
                  className="flex flex-1 flex-col items-center gap-[3px] rounded-[10px] px-2 py-2.5 transition-all duration-150"
                  style={{
                    border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                    background: sel ? COLORS.primaryBg : 'transparent',
                  }}
                >
                  <m.icon size={20} style={{ color: sel ? COLORS.primary : COLORS.textMuted }} />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: sel ? COLORS.primary : COLORS.textMuted }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
          {paymentMethod === 'cash' && (
            <div className="mb-2.5">
              <label className="form-label">Amount Tendered (GH₵)</label>
              <input
                type="number"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder={total.toFixed(2)}
                className="border-border bg-surface-alt text-text mt-1.5 box-border w-full rounded-[10px] border-[1.5px] px-3 py-2.5 font-mono text-base outline-none"
              />
              {amountTendered && parseFloat(amountTendered) >= total && (
                <div className="text-success mt-1 font-mono text-[13px] font-semibold">
                  Change: GH₵ {(parseFloat(amountTendered) - total).toFixed(2)}
                </div>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[
                  Math.ceil(total),
                  Math.ceil(total / 10) * 10,
                  Math.ceil(total / 50) * 50,
                  Math.ceil(total / 100) * 100,
                ]
                  .filter((v, i, a) => a.indexOf(v) === i && v >= total)
                  .slice(0, 4)
                  .map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setAmountTendered(String(v))}
                      className="border-border bg-surface-alt text-text-muted rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold"
                    >
                      GH₵ {v}
                    </button>
                  ))}
              </div>
            </div>
          )}
          {paymentMethod === 'card' && (
            <div className="mb-2.5 flex flex-col gap-2">
              <div>
                <label className="form-label mb-1 block">Card Type *</label>
                <div className="flex flex-wrap gap-[5px]">
                  {['VISA', 'Mastercard', 'Amex', 'UnionPay'].map((ct) => {
                    const sel = cardType === ct;
                    return (
                      <button
                        type="button"
                        key={ct}
                        onClick={() => setCardType(ct)}
                        className="rounded-lg px-3 py-[7px] text-[11px] font-semibold whitespace-nowrap transition-all duration-150"
                        style={{
                          border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                          background: sel ? COLORS.primaryBg : 'transparent',
                          color: sel ? COLORS.primary : COLORS.textMuted,
                        }}
                      >
                        {ct === 'VISA'
                          ? '\u{1F4B3} VISA'
                          : ct === 'Mastercard'
                            ? '\u{1F4B3} Mastercard'
                            : ct === 'Amex'
                              ? '\u{1F4B3} Amex'
                              : '\u{1F4B3} UnionPay'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="form-label mb-1 block">Transaction No. *</label>
                <input
                  type="text"
                  value={cardTransNo}
                  onChange={(e) => setCardTransNo(e.target.value)}
                  placeholder="e.g. 4821-XXXX-XXXX"
                  className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] px-3 py-2.5 font-mono text-[13px] outline-none"
                />
              </div>
              {cardType && cardTransNo.trim() && (
                <div className="bg-success-bg border-success/[0.19] flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5">
                  <CheckCircle size={12} className="text-success" />
                  <span className="text-success text-[11px] font-semibold">
                    {cardType} {cardTransNo}
                  </span>
                </div>
              )}
            </div>
          )}
          {paymentMethod === 'momo' && (
            <div className="mb-2.5 flex flex-col gap-2">
              <div>
                <label className="form-label mb-1 block">Provider *</label>
                <div className="flex flex-wrap gap-[5px]">
                  {[
                    { key: 'mtn', label: 'MTN MoMo', color: '#FFCB05' },
                    { key: 'tcash', label: 'TCash', color: '#E4002B' },
                    { key: 'atcash', label: 'ATCash', color: '#0072CE' },
                    { key: 'gmoney', label: 'G-Money', color: '#4CAF50' },
                  ].map((pv) => {
                    const sel = momoProvider === pv.key;
                    return (
                      <button
                        type="button"
                        key={pv.key}
                        onClick={() => setMomoProvider(pv.key)}
                        className="rounded-lg px-3 py-[7px] text-[11px] font-semibold whitespace-nowrap transition-all duration-150"
                        style={{
                          border: `1.5px solid ${sel ? pv.color : COLORS.border}`,
                          background: sel ? pv.color + '18' : 'transparent',
                          color: sel ? pv.color : COLORS.textMuted,
                        }}
                      >
                        {'\u{1F4F1}'} {pv.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="form-label mb-1 block">Phone Number *</label>
                <input
                  type="tel"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  placeholder="e.g. 024 XXX XXXX"
                  className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] px-3 py-2.5 text-[13px] outline-none"
                />
              </div>
              <div>
                <label className="form-label mb-1 block">Reference No. *</label>
                <input
                  type="text"
                  value={momoRef}
                  onChange={(e) => setMomoRef(e.target.value)}
                  placeholder="e.g. MP24021100123"
                  className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border-[1.5px] px-3 py-2.5 font-mono text-[13px] outline-none"
                />
              </div>
              {momoProvider && momoPhone.trim() && momoRef.trim() && (
                <div className="bg-success-bg border-success/[0.19] flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5">
                  <CheckCircle size={12} className="text-success" />
                  <span className="text-success text-[11px] font-semibold">
                    {
                      {
                        mtn: 'MTN MoMo',
                        tcash: 'TCash',
                        atcash: 'ATCash',
                        gmoney: 'G-Money',
                      }[momoProvider]
                    }{' '}
                    {momoPhone} Ref: {momoRef}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Split Payment Mode */}
      {splitMode && (
        <div className="mb-2.5">
          {/* Remaining indicator */}
          <div
            className={clsx(
              'mb-2.5 flex items-center justify-between rounded-[10px] px-3 py-2',
              Math.abs(splitRemaining) < 0.01 ? 'bg-success-bg' : 'bg-surface-alt',
            )}
            style={{
              border: `1.5px solid ${Math.abs(splitRemaining) < 0.01 ? COLORS.success + '40' : COLORS.border}`,
            }}
          >
            <span
              className="text-[11px] font-semibold"
              style={{ color: Math.abs(splitRemaining) < 0.01 ? COLORS.success : COLORS.textMuted }}
            >
              {Math.abs(splitRemaining) < 0.01 ? '\u2713 Fully allocated' : 'Remaining'}
            </span>
            <span
              className="font-mono text-sm font-bold"
              style={{
                color:
                  Math.abs(splitRemaining) < 0.01 ? COLORS.success : splitRemaining < 0 ? COLORS.danger : COLORS.text,
              }}
            >
              GH₵ {splitRemaining.toFixed(2)}
            </span>
          </div>
          {/* Split entries */}
          {splits.map((sp, idx) => (
            <div
              key={idx}
              className="bg-surface mb-2 rounded-[10px] p-2.5"
              style={{
                border: `1.5px solid ${isSplitEntryValid(sp) ? COLORS.success + '40' : COLORS.border}`,
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="form-label">Split {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSplit(idx)}
                  aria-label={`Remove split ${idx + 1}`}
                  className="bg-surface-alt rounded-md px-1.5 py-0.5"
                >
                  <X size={12} className="text-danger" />
                </button>
              </div>
              {/* Method selector */}
              <div className="mb-2 flex gap-1.5">
                {(['cash', 'card', 'momo'] as const).map((m) => {
                  const sel = sp.method === m;
                  const Icon = m === 'cash' ? Banknote : m === 'card' ? CreditCard : Phone;
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={() =>
                        updateSplit(idx, {
                          method: m,
                          cardType: '',
                          cardTransNo: '',
                          momoProvider: '',
                          momoPhone: '',
                          momoRef: '',
                          amountTendered: '',
                        })
                      }
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg px-1 py-1.5 transition-all duration-150"
                      style={{
                        border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                        background: sel ? COLORS.primaryBg : 'transparent',
                      }}
                    >
                      <Icon size={14} style={{ color: sel ? COLORS.primary : COLORS.textMuted }} />
                      <span
                        className="text-[9px] font-semibold"
                        style={{ color: sel ? COLORS.primary : COLORS.textMuted }}
                      >
                        {m === 'cash' ? 'Cash' : m === 'card' ? 'Card' : 'MoMo'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Amount */}
              <div className="mb-1.5">
                <input
                  type="number"
                  value={sp.amount}
                  onChange={(e) => updateSplit(idx, { amount: e.target.value })}
                  placeholder="Amount (GH₵)"
                  className="border-border bg-surface-alt text-text box-border w-full rounded-lg border-[1.5px] px-2.5 py-2 font-mono text-sm outline-none"
                />
                {splits.length === 2 && idx === 1 && parseFloat(splits[0]?.amount || '0') > 0 && !sp.amount && (
                  <button
                    type="button"
                    onClick={() =>
                      updateSplit(idx, {
                        amount: Math.max(0, total - parseFloat(splits[0]?.amount || '0')).toFixed(2),
                      })
                    }
                    className="text-primary mt-[3px] text-[10px] font-semibold"
                  >
                    Fill remaining (GH₵ {Math.max(0, total - parseFloat(splits[0]?.amount || '0')).toFixed(2)})
                  </button>
                )}
              </div>
              {/* Cash details */}
              {sp.method === 'cash' && parseFloat(sp.amount) > 0 && (
                <div>
                  <input
                    type="number"
                    value={sp.amountTendered || ''}
                    onChange={(e) =>
                      updateSplit(idx, {
                        amountTendered: e.target.value,
                      })
                    }
                    placeholder={`Tendered (GH₵ ${parseFloat(sp.amount).toFixed(2)})`}
                    className="border-border bg-surface-alt text-text box-border w-full rounded-lg border-[1.5px] px-2.5 py-[7px] font-mono text-xs outline-none"
                  />
                  {sp.amountTendered && parseFloat(sp.amountTendered) >= parseFloat(sp.amount) && (
                    <div className="text-success mt-0.5 font-mono text-[10px] font-semibold">
                      Change: GH₵ {(parseFloat(sp.amountTendered) - parseFloat(sp.amount)).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
              {/* Card details */}
              {sp.method === 'card' && parseFloat(sp.amount) > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-1">
                    {['VISA', 'Mastercard', 'Amex'].map((ct) => (
                      <button
                        type="button"
                        key={ct}
                        onClick={() => updateSplit(idx, { cardType: ct })}
                        className="rounded-md px-2 py-1 text-[9px] font-semibold"
                        style={{
                          border: `1px solid ${sp.cardType === ct ? COLORS.primary : COLORS.border}`,
                          background: sp.cardType === ct ? COLORS.primaryBg : 'transparent',
                          color: sp.cardType === ct ? COLORS.primary : COLORS.textMuted,
                        }}
                      >
                        {ct}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={sp.cardTransNo || ''}
                    onChange={(e) => updateSplit(idx, { cardTransNo: e.target.value })}
                    placeholder="Trans No."
                    className="border-border bg-surface-alt text-text box-border w-full rounded-lg border-[1.5px] px-2.5 py-[7px] font-mono text-[11px] outline-none"
                  />
                </div>
              )}
              {/* MoMo details */}
              {sp.method === 'momo' && parseFloat(sp.amount) > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-1">
                    {[
                      { key: 'mtn', label: 'MTN', color: '#FFCB05' },
                      { key: 'tcash', label: 'TCash', color: '#E4002B' },
                      { key: 'atcash', label: 'ATCash', color: '#0072CE' },
                      { key: 'gmoney', label: 'G-Money', color: '#4CAF50' },
                    ].map((pv) => (
                      <button
                        type="button"
                        key={pv.key}
                        onClick={() => updateSplit(idx, { momoProvider: pv.key })}
                        className="rounded-md px-2 py-1 text-[9px] font-semibold"
                        style={{
                          border: `1px solid ${sp.momoProvider === pv.key ? pv.color : COLORS.border}`,
                          background: sp.momoProvider === pv.key ? pv.color + '18' : 'transparent',
                          color: sp.momoProvider === pv.key ? pv.color : COLORS.textMuted,
                        }}
                      >
                        {pv.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="tel"
                    value={sp.momoPhone || ''}
                    onChange={(e) => updateSplit(idx, { momoPhone: e.target.value })}
                    placeholder="Phone"
                    className="border-border bg-surface-alt text-text box-border w-full rounded-lg border-[1.5px] px-2.5 py-[7px] text-[11px] outline-none"
                  />
                  <input
                    type="text"
                    value={sp.momoRef || ''}
                    onChange={(e) => updateSplit(idx, { momoRef: e.target.value })}
                    placeholder="Ref No."
                    className="border-border bg-surface-alt text-text box-border w-full rounded-lg border-[1.5px] px-2.5 py-[7px] font-mono text-[11px] outline-none"
                  />
                </div>
              )}
              {/* Valid indicator */}
              {isSplitEntryValid(sp) && (
                <div className="text-success mt-1.5 flex items-center gap-1 text-[10px] font-semibold">
                  <CheckCircle size={10} /> GH₵ {parseFloat(sp.amount).toFixed(2)} via{' '}
                  {sp.method === 'cash'
                    ? 'Cash'
                    : sp.method === 'card'
                      ? sp.cardType
                      : MOMO_LABELS[sp.momoProvider || '']}
                </div>
              )}
            </div>
          ))}
          {/* Add split button */}
          {splits.length < 4 && (
            <button
              type="button"
              onClick={addSplit}
              className="text-primary hover:border-primary hover:bg-primary-bg flex w-full items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-xs font-semibold transition-all duration-150"
              style={{ border: `1.5px dashed ${COLORS.primary}40` }}
            >
              <Plus size={14} /> Add Payment Split
            </button>
          )}
        </div>
      )}

      {/* Pay Button */}
      <button
        type="button"
        onClick={handlePayment}
        disabled={!canPay}
        className={clsx(
          'w-full rounded-xl border-none p-3.5 font-[inherit] text-sm font-bold transition-all duration-200',
          canPay ? 'cursor-pointer' : 'cursor-not-allowed',
        )}
        style={{
          background: canPay ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` : COLORS.surfaceAlt,
          color: canPay ? '#fff' : COLORS.textDim,
          boxShadow: canPay ? `0 4px 16px ${COLORS.primary}40` : 'none',
        }}
      >
        {splitMode ? `Split Pay \u2014 GH₵ ${total.toFixed(2)}` : `Complete Sale \u2014 GH₵ ${total.toFixed(2)}`}
      </button>
    </>
  );
};
