import { AlertTriangle, Zap } from 'lucide-react';
import { useColors, useNavigation, useShop } from '@/context';
import type { UsageItem } from '@/types';

export function PlanUsageBanner() {
  const COLORS = useColors();
  const { page, setPage } = useNavigation();
  const { userPlan, planUsage, isDecisionMaker, setShowUpgradeModal } = useShop();

  if (userPlan === 'max') return null;
  if (planUsage.blocked.length === 0 && planUsage.warnings.length === 0) return null;
  if (['account', 'pos'].includes(page)) return null;

  const isBlocked = planUsage.blocked.length > 0;

  return (
    <div
      className="mb-3.5 flex flex-wrap items-center gap-2.5 rounded-xl px-4 py-2.5"
      style={{
        background: isBlocked ? COLORS.dangerBg : `${COLORS.warning}12`,
        border: `1px solid ${isBlocked ? COLORS.danger : COLORS.warning}30`,
      }}
    >
      <AlertTriangle size={16} className="shrink-0" style={{ color: isBlocked ? COLORS.danger : COLORS.warning }} />
      <div className="min-w-[200px] flex-1">
        {isBlocked ? (
          <div className="text-danger text-xs font-bold">
            Limit reached: {planUsage.blocked.map((b: UsageItem) => b.label).join(', ')}
          </div>
        ) : (
          <div className="text-warning text-xs font-bold">
            Approaching limit: {planUsage.warnings.map((w: UsageItem) => `${w.label} (${w.pct}%)`).join(', ')}
          </div>
        )}
      </div>
      {isDecisionMaker ? (
        <button
          type="button"
          onClick={() => setShowUpgradeModal(true)}
          className="flex items-center gap-1 rounded-lg border-none px-3.5 py-1.5 font-[inherit] text-[11px] font-bold whitespace-nowrap text-white"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
        >
          <Zap size={12} /> Upgrade Plan
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setPage('account')}
          className="border-border text-text-muted rounded-lg border bg-transparent px-3.5 py-1.5 font-[inherit] text-[11px] font-semibold whitespace-nowrap"
        >
          View Usage
        </button>
      )}
    </div>
  );
}
