import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ShoppingBag, Clock, Receipt } from 'lucide-react';
import { INITIAL_SALES } from '@/constants/demoData';
import { getAllVerifiableSales } from '@/utils/verifyStore';
import type { SaleRecord } from '@/types';

// ─── Privacy helpers ───

/** Mask customer name: "Kwame Boateng" → "Kwame B.", "Walk-in" stays unchanged */
function maskName(name: string): string {
  if (!name || name === 'Walk-in') return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const first = parts[0]!;
  const lastInitial = parts[parts.length - 1]?.[0] ?? '';
  return `${first} ${lastInitial}.`;
}

/** Generic payment label without sensitive details */
function safePayLabel(method: string): string {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'card':
      return 'Card';
    case 'momo':
      return 'Mobile Money';
    case 'split':
      return 'Split Payment';
    default:
      return method;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
}

function fmt(n: number): string {
  return n.toFixed(2);
}

// ─── Colors (standalone — no theme context) ───
const C = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1F2937',
  textDim: '#6B7280',
  textMuted: '#9CA3AF',
  primary: '#3B82F6',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

// ─── Component ───

export const SaleVerificationPage: React.FC = () => {
  const [sale, setSale] = useState<SaleRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const prefix = '#/verify/';
      if (!hash.startsWith(prefix)) {
        setNotFound(true);
        return;
      }
      const tk = hash.slice(prefix.length);
      setToken(tk);

      if (!tk || tk.length < 8) {
        setNotFound(true);
        return;
      }

      // Search both initial (demo) and runtime sales
      const allSales = [...INITIAL_SALES, ...getAllVerifiableSales()];
      const found = allSales.find((s) => s.verifyToken === tk);
      if (found) {
        setSale(found);
        setNotFound(false);
      } else {
        setSale(null);
        setNotFound(true);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // ─── Not Found State ───
  if (notFound) {
    return (
      <div
        className="flex min-h-screen flex-col items-center px-4 py-6"
        style={{ background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      >
        <div
          className="w-full max-w-[480px] overflow-hidden rounded-2xl"
          style={{ background: C.surface, border: `1.5px solid ${C.border}` }}
        >
          <div className="px-5 py-12 text-center" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="bg-danger/[0.08] mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <XCircle size={32} style={{ color: C.danger }} />
            </div>
            <div className="mb-1.5 text-xl font-extrabold" style={{ color: C.text }}>
              Receipt Not Found
            </div>
            <div className="mx-auto max-w-[320px] text-[13px] leading-normal" style={{ color: C.textDim }}>
              The verification code{' '}
              <span className="rounded px-1.5 py-0.5 font-mono text-xs" style={{ background: '#F3F4F6' }}>
                {token || '—'}
              </span>{' '}
              does not match any receipt in our records.
            </div>
          </div>
          <div className="px-5 py-4 text-center">
            <div className="text-[11px]" style={{ color: C.textMuted }}>
              If you believe this is an error, please contact the merchant directly.
            </div>
          </div>
        </div>
        {renderBranding()}
      </div>
    );
  }

  // ─── Loading State ───
  if (!sale) {
    return (
      <div
        className="flex min-h-screen flex-col items-center px-4 py-6"
        style={{ background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      >
        <div
          className="w-full max-w-[480px] rounded-2xl p-12 text-center"
          style={{
            background: C.surface,
            border: `1.5px solid ${C.border}`,
          }}
        >
          <div
            className="mx-auto h-8 w-8 rounded-full"
            style={{
              border: `3px solid ${C.border}`,
              borderTopColor: C.primary,
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div className="mt-3 text-[13px]" style={{ color: C.textDim }}>
            Verifying receipt...
          </div>
        </div>
      </div>
    );
  }

  // ─── Status ───
  const isReversed = sale.status === 'reversed';
  const isPending = sale.status === 'pending_reversal';
  const statusColor = isReversed ? C.danger : isPending ? C.warning : C.success;
  const statusLabel = isReversed ? 'Reversed' : isPending ? 'Pending Review' : 'Verified';
  const StatusIcon = isReversed ? XCircle : isPending ? AlertTriangle : CheckCircle;

  return (
    <div
      className="flex min-h-screen flex-col items-center px-4 py-6"
      style={{ background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      <div
        className="w-full max-w-[480px] overflow-hidden rounded-2xl"
        style={{ background: C.surface, border: `1.5px solid ${C.border}` }}
      >
        {/* ─── Verification Header ─── */}
        <div className="px-5 py-6 text-center" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: `${statusColor}14` }}
          >
            <StatusIcon size={28} style={{ color: statusColor }} />
          </div>
          <div className="mb-0.5 text-lg font-extrabold" style={{ color: C.text }}>
            {statusLabel}
          </div>
          <div className="text-xs" style={{ color: C.textDim }}>
            {isReversed
              ? 'This transaction has been reversed'
              : isPending
                ? 'This transaction is under review'
                : 'This receipt is authentic and verified'}
          </div>
        </div>

        {/* ─── Transaction Info ─── */}
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="form-label mb-2 tracking-[0.8px]" style={{ color: C.textMuted }}>
            Transaction Details
          </div>
          <div className="flex items-center justify-between py-[5px] text-[13px]">
            <span className="flex items-center gap-1.5" style={{ color: C.textDim }}>
              <Receipt size={12} /> Receipt #
            </span>
            <span className="font-mono text-xs font-semibold" style={{ color: C.text }}>
              {sale.id}
            </span>
          </div>
          <div className="flex items-center justify-between py-[5px] text-[13px]">
            <span className="flex items-center gap-1.5" style={{ color: C.textDim }}>
              <Clock size={12} /> Date & Time
            </span>
            <span className="font-medium" style={{ color: C.text }}>
              {formatDate(sale.date)}
            </span>
          </div>
          <div className="flex items-center justify-between py-[5px] text-[13px]">
            <span style={{ color: C.textDim }}>Customer</span>
            <span className="font-medium" style={{ color: C.text }}>
              {maskName(sale.customerName)}
            </span>
          </div>
          <div className="flex items-center justify-between py-[5px] text-[13px]">
            <span style={{ color: C.textDim }}>Payment</span>
            <span className="font-medium" style={{ color: C.text }}>
              {safePayLabel(sale.paymentMethod)}
            </span>
          </div>
          <div className="flex items-center justify-between py-[5px] text-[13px]">
            <span style={{ color: C.textDim }}>Served by</span>
            <span className="font-medium" style={{ color: C.text }}>
              {sale.cashier}
            </span>
          </div>
        </div>

        {/* ─── Items ─── */}
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="form-label mb-2 tracking-[0.8px]" style={{ color: C.textMuted }}>
            <ShoppingBag size={11} className="mr-1 align-middle" />
            Items ({sale.itemCount})
          </div>
          <div className="flex flex-col gap-1.5">
            {sale.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px]"
                style={{ background: '#F9FAFB' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold" style={{ color: C.text }}>
                    {item.name}
                  </div>
                  <div className="text-[11px]" style={{ color: C.textDim }}>
                    {item.qty} x GH&#x20B5; {fmt(item.price)}
                  </div>
                </div>
                <div className="ml-3 font-bold whitespace-nowrap" style={{ color: C.text }}>
                  GH&#x20B5; {fmt(item.qty * item.price)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Totals ─── */}
        <div className="px-5 py-4">
          <div className="form-label mb-2 tracking-[0.8px]" style={{ color: C.textMuted }}>
            Summary
          </div>
          <div className="flex items-center justify-between py-[5px] text-[13px]">
            <span style={{ color: C.textDim }}>Subtotal</span>
            <span style={{ color: C.text }}>GH&#x20B5; {fmt(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex items-center justify-between py-[5px] text-[13px]">
              <span style={{ color: C.success }}>
                Discount{sale.discountType === 'percent' ? ` (${sale.discountInput}%)` : ''}
              </span>
              <span style={{ color: C.success }}>-GH&#x20B5; {fmt(sale.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-[5px] text-[13px]">
            <span style={{ color: C.textDim }}>Tax (NHIL/VAT)</span>
            <span style={{ color: C.text }}>GH&#x20B5; {fmt(sale.tax)}</span>
          </div>
          <div
            className="mt-1.5 flex items-center justify-between py-2.5 text-base font-extrabold"
            style={{
              borderTop: `1.5px solid ${C.border}`,
            }}
          >
            <span style={{ color: C.text }}>Total</span>
            <span className={isReversed ? 'line-through' : ''} style={{ color: isReversed ? C.danger : C.text }}>
              GH&#x20B5; {fmt(sale.total)}
            </span>
          </div>
        </div>

        {/* ─── Reversal Info (if applicable) ─── */}
        {(isReversed || isPending) && (
          <div
            className="mx-5 mt-0 mb-4 rounded-[10px] px-3.5 py-3"
            style={{
              background: `${statusColor}08`,
              border: `1px solid ${statusColor}30`,
            }}
          >
            <div className="mb-1 text-[11px] font-bold" style={{ color: statusColor }}>
              {isReversed ? 'Reversal Details' : 'Review Status'}
            </div>
            {sale.reversalReason && (
              <div className="text-xs" style={{ color: C.text }}>
                Reason: {sale.reversalReason}
              </div>
            )}
            {sale.reversedAt && (
              <div className="mt-0.5 text-[11px]" style={{ color: C.textDim }}>
                Reversed: {formatDate(sale.reversedAt)}
              </div>
            )}
          </div>
        )}
      </div>

      {renderBranding()}
    </div>
  );
};

function renderBranding() {
  return (
    <div className="mt-5 text-center opacity-50">
      <div className="text-[11px] font-bold" style={{ color: '#6B7280' }}>
        Powered by ShopChain&#x2122;
      </div>
      <div className="mt-0.5 text-[10px]" style={{ color: '#9CA3AF' }}>
        Receipt verification service
      </div>
    </div>
  );
}
