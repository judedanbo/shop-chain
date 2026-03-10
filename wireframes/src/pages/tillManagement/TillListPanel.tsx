import React from 'react';
import { Monitor, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Till, ThemeColors } from '@/types';
import type { Breakpoint } from '@/hooks';
import { isSmall, isMobile } from '@/utils/responsive';

interface TillListPanelProps {
  allTills: Till[];
  selectedTillId: string | null;
  unseenUpdates: Record<string, number>;
  COLORS: ThemeColors;
  bp: Breakpoint;
  onSelectTill: (id: string) => void;
  onOpenTillModal: () => void;
  getOrdersForTill: (tillId: string) => unknown[];
}

export const TillListPanel: React.FC<TillListPanelProps> = ({
  allTills,
  selectedTillId,
  unseenUpdates,
  COLORS,
  bp,
  onSelectTill,
  onOpenTillModal,
  getOrdersForTill,
}) => {
  const mobile = isMobile(bp);
  const small = isSmall(bp);

  return (
    <div
      className="bg-surface flex flex-col overflow-hidden"
      style={{
        flex: mobile ? 1 : '0 0 320px',
        borderRadius: small ? 0 : 14,
        border: small ? 'none' : `1px solid ${COLORS.border}`,
      }}
    >
      <div className="border-border flex items-center justify-between border-b px-4 py-3.5">
        <div className="text-text text-sm font-bold">All Tills</div>
        <Button variant="primary" size="sm" icon={Plus} onClick={onOpenTillModal}>
          New Till
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {allTills.length === 0 ? (
          <div className="text-text-dim p-10 text-center">
            <Monitor size={24} className="mx-auto mb-2 opacity-40" />
            <div className="text-[13px]">No tills yet</div>
            <div className="mt-1 text-[11px]">Open a new till to get started</div>
          </div>
        ) : (
          allTills.map((till) => {
            const isSelected = till.id === selectedTillId;
            const tillOrderCount = getOrdersForTill(till.id).length;
            const unseenCount = unseenUpdates[till.id] ?? 0;
            return (
              <div
                key={till.id}
                onClick={() => onSelectTill(till.id)}
                className="relative mb-2 cursor-pointer rounded-[10px] p-3.5 transition-all duration-150"
                style={{
                  border: `1.5px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                  background: isSelected ? COLORS.primaryBg : COLORS.surfaceAlt,
                }}
              >
                {unseenCount > 0 && (
                  <span className="bg-danger absolute top-2 right-2 flex h-[18px] w-[18px] items-center justify-center rounded-[9px] text-[10px] font-bold text-white">
                    {unseenCount}
                  </span>
                )}
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[13px] font-bold" style={{ color: isSelected ? COLORS.primary : COLORS.text }}>
                    {till.name}
                  </span>
                  <span
                    className="rounded-[6px] px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: till.isActive ? COLORS.successBg : COLORS.surfaceAlt,
                      color: till.isActive ? COLORS.success : COLORS.textDim,
                      border: till.isActive ? `1px solid ${COLORS.success}30` : `1px solid ${COLORS.border}`,
                    }}
                  >
                    {till.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>
                <div className="text-text-dim text-[11px]">
                  Opened by {till.openedBy} · {new Date(till.openedAt).toLocaleTimeString()}
                </div>
                <div className="text-text-muted mt-1 flex gap-3 text-[11px]">
                  <span>
                    {till.orderCount} order{till.orderCount !== 1 ? 's' : ''} placed
                  </span>
                  <span>{tillOrderCount} total</span>
                </div>
                {/* Payment summary on till card */}
                {till.totalPayments > 0 && (
                  <div className="text-success mt-1 flex items-center gap-2 text-[11px]">
                    <Wallet size={10} />
                    <span>
                      {till.totalPayments} payment{till.totalPayments !== 1 ? 's' : ''}
                    </span>
                    <span className="font-bold">GH₵ {till.totalPaymentAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
