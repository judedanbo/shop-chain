import React from 'react';
import clsx from 'clsx';
import { FileText, X, User, RotateCcw, Clock, ChevronRight, Check } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import type { ThemeColors } from '@/types/theme.types';
import type { SaleRecord } from '@/types';

export interface POSSalesLogProps {
  salesHistory: SaleRecord[];
  showSalesLog: boolean;
  setShowSalesLog: (val: boolean) => void;
  // Computed values
  activeSales: SaleRecord[];
  reversedSales: SaleRecord[];
  pendingReversals: SaleRecord[];
  // Reversal state
  showPendingReversals: boolean;
  setShowPendingReversals: (val: boolean) => void;
  canInitiateReversal: boolean;
  canApproveReversal: boolean;
  currentRole: string;
  // Reversal actions
  handleReverseSale: (sale: SaleRecord) => void;
  executeReversal: (saleId: string, reason: string, approver?: string) => void;
  rejectReversal: (saleId: string) => void;
  COLORS: ThemeColors;
}

export const POSSalesLog: React.FC<POSSalesLogProps> = ({
  salesHistory,
  setShowSalesLog,
  activeSales,
  reversedSales,
  pendingReversals,
  showPendingReversals,
  setShowPendingReversals,
  canInitiateReversal,
  canApproveReversal,
  currentRole,
  handleReverseSale,
  executeReversal,
  rejectReversal,
  COLORS,
}) => {
  return (
    <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-surface border-border flex max-h-[85vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border"
        style={{ animation: 'modalIn 0.2s ease' }}
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <span className="text-text text-base font-extrabold">Sales Log</span>
            <Badge color="primary">{activeSales.length}</Badge>
          </div>
          <button type="button" onClick={() => setShowSalesLog(false)} aria-label="Close" className="text-text-dim">
            <X size={18} />
          </button>
        </div>
        {/* Summary KPIs */}
        <div className="border-border bg-surface-alt grid grid-cols-4 gap-2.5 border-b px-5 py-3">
          <div>
            <div className="text-success text-lg font-black">
              GH₵ {activeSales.reduce((s, x) => s + x.total, 0).toFixed(2)}
            </div>
            <div className="text-text-dim text-[9px]">Total Revenue</div>
          </div>
          <div>
            <div className="text-primary text-lg font-black">{activeSales.filter((s) => s.customerId).length}</div>
            <div className="text-text-dim text-[9px]">With Customer</div>
          </div>
          <div>
            <div className="text-text-muted text-lg font-black">{activeSales.filter((s) => !s.customerId).length}</div>
            <div className="text-text-dim text-[9px]">Walk-in</div>
          </div>
          <div>
            <div className="text-danger text-lg font-black">{reversedSales.length}</div>
            <div className="text-text-dim text-[9px]">Reversed</div>
          </div>
        </div>
        {/* Pending Reversals Banner */}
        {pendingReversals.length > 0 && canApproveReversal && (
          <>
            <div
              onClick={() => setShowPendingReversals(!showPendingReversals)}
              className="border-border bg-warning/[0.07] flex cursor-pointer items-center justify-between border-b px-5 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-warning" />
                <span className="text-warning text-xs font-bold">
                  {pendingReversals.length} Pending Reversal{pendingReversals.length > 1 ? 's' : ''}
                </span>
              </div>
              <ChevronRight
                size={14}
                className="text-warning transition-transform duration-150"
                style={{
                  transform: showPendingReversals ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              />
            </div>
            {showPendingReversals &&
              pendingReversals.map((s) => (
                <div key={`pending-${s.id}`} className="border-border bg-warning/[0.03] border-b px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-text text-xs font-bold">{s.customerName}</span>
                        <Badge color="warning">Pending</Badge>
                      </div>
                      <div className="text-text-dim mt-0.5 text-[10px]">
                        {s.id} · GH₵ {s.total.toFixed(2)} · Requested by {s.reversalRequestedBy}
                      </div>
                      {s.reversalReason && (
                        <div className="text-text-muted mt-0.5 text-[10px] italic">Reason: {s.reversalReason}</div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        variant="success"
                        size="sm"
                        icon={Check}
                        onClick={() => executeReversal(s.id, s.reversalReason || '', currentRole)}
                      >
                        Approve
                      </Button>
                      <Button variant="danger" size="sm" icon={X} onClick={() => rejectReversal(s.id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </>
        )}
        {/* Sales list */}
        <div className="flex-1 overflow-y-auto">
          {salesHistory.length === 0 ? (
            <div className="text-text-dim p-10 text-center text-xs">No sales recorded yet this session.</div>
          ) : (
            salesHistory.map((s, i) => {
              const saleStatus = s.status;
              const isReversed = saleStatus === 'reversed';
              const isPendingReversal = saleStatus === 'pending_reversal';
              return (
                <div
                  key={s.id}
                  className="border-border flex items-center gap-3 border-b px-5 py-3"
                  style={{
                    background: isReversed
                      ? `${COLORS.danger}08`
                      : isPendingReversal
                        ? `${COLORS.warning}08`
                        : i % 2 === 0
                          ? 'transparent'
                          : COLORS.surfaceAlt,
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{
                      background: isReversed
                        ? `${COLORS.danger}12`
                        : s.customerId
                          ? `${COLORS.primary}15`
                          : COLORS.surfaceAlt,
                    }}
                  >
                    {isReversed ? (
                      <RotateCcw size={16} className="text-danger" />
                    ) : s.customerId ? (
                      <User size={16} className="text-primary" />
                    ) : (
                      <span className="text-sm">{'\u{1F6B6}'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={clsx('text-xs font-bold', isReversed ? 'text-text-dim' : 'text-text')}>
                        {s.customerName}
                      </span>
                      {s.customerId ? (
                        <span className="text-primary bg-primary/[0.07] rounded-[4px] px-1.5 py-[1px] text-[8px] font-bold">
                          Linked
                        </span>
                      ) : (
                        <span className="bg-surface-alt text-text-dim rounded-[4px] px-1.5 py-[1px] text-[8px] font-bold">
                          Anonymous
                        </span>
                      )}
                      {isReversed && <Badge color="danger">Reversed</Badge>}
                      {isPendingReversal && <Badge color="warning">Pending Reversal</Badge>}
                    </div>
                    <div className="text-text-dim mt-0.5 text-[10px]">
                      {s.id} · {s.itemCount} items · {s.payLabel}
                    </div>
                    {isReversed && s.reversedAt && (
                      <div className="text-danger mt-0.5 text-[9px]">
                        Reversed {new Date(s.reversedAt).toLocaleTimeString()} by {s.reversedBy} — {s.reversalReason}
                      </div>
                    )}
                    {isPendingReversal && (
                      <div className="text-warning mt-0.5 text-[9px] italic">
                        {canApproveReversal
                          ? `Requested by ${s.reversalRequestedBy} — ${s.reversalReason}`
                          : 'Awaiting manager approval'}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <div
                        className={clsx(
                          'font-mono text-sm font-extrabold',
                          isReversed ? 'text-danger line-through opacity-60' : 'text-text',
                        )}
                      >
                        GH₵ {s.total.toFixed(2)}
                      </div>
                      <div className="text-text-dim text-[9px]">{new Date(s.date).toLocaleTimeString()}</div>
                    </div>
                    {canInitiateReversal && !isReversed && !isPendingReversal && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReverseSale(s);
                        }}
                        className="text-danger border-danger/[0.19] bg-danger/[0.03] cursor-pointer rounded-[7px] border px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap"
                      >
                        Reverse
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
