import type { ReactNode } from 'react';
import { BarChart3, Info, Lock, AlertTriangle, Zap, Crown } from 'lucide-react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ThemeColors } from '@/types';
import type { Breakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import type { DemoUsageData, UsageItemRow, RoleInfo, PlanTierData } from './AccountPage';

// ─── Props ────────────────────────────────────────────────────

export interface UsageTabProps {
  usage: DemoUsageData;
  plan: PlanTierData;
  usageItems: UsageItemRow[];
  warnings: UsageItemRow[];
  blocked: UsageItemRow[];
  isDecisionMaker: boolean;
  roleMeta: RoleInfo | undefined;
  currentRole: string;
  userPlan: string;
  setShowPlanModal: React.Dispatch<React.SetStateAction<boolean>>;
  COLORS: ThemeColors;
  bp: Breakpoint;
}

// ─── Internal helpers ─────────────────────────────────────────

const SectionCard = ({
  children,
  style,
  mobile,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  mobile: boolean;
}) => (
  <div
    className={clsx('bg-surface border-border mb-4 rounded-[14px] border-[1.5px]', mobile ? 'p-4' : 'p-5')}
    style={style}
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

export const UsageTab = ({
  plan,
  usageItems,
  warnings,
  blocked,
  isDecisionMaker,
  roleMeta,
  currentRole,
  userPlan,
  setShowPlanModal,
  COLORS,
  bp,
}: UsageTabProps) => {
  const mobile = isMobile(bp);

  return (
    <div>
      <SectionCard mobile={mobile}>
        <SectionTitle
          icon={BarChart3}
          title="Usage & Limits"
          sub={`${plan.name} Plan \u2014 ${plan.price === 0 ? 'Free' : `GH\u20B5 ${plan.price}/mo`}`}
        />

        {/* Role context banner for non-decision-makers */}
        {!isDecisionMaker && (
          <div className="bg-surface-alt border-border mb-4 flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5">
            <Info size={15} className="text-primary shrink-0" />
            <div>
              <div className="text-text text-xs font-semibold">
                Viewing as {roleMeta?.icon} {roleMeta?.label || currentRole}
              </div>
              <div className="text-text-dim text-[11px]">
                Usage information is shown for reference. Contact the shop owner or manager to adjust plan limits.
              </div>
            </div>
          </div>
        )}

        {/* Alert banners for decision-makers */}
        {isDecisionMaker && blocked.length > 0 && (
          <div className="bg-danger-bg border-danger/[0.15] mb-3.5 flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5">
            <Lock size={15} className="text-danger shrink-0" />
            <div className="flex-1">
              <div className="text-danger text-xs font-bold">
                Limits reached: {blocked.map((b) => b.label).join(', ')}
              </div>
              <div className="text-text-dim text-[11px]">Further additions are blocked until you upgrade.</div>
            </div>
          </div>
        )}
        {isDecisionMaker && blocked.length === 0 && warnings.length > 0 && (
          <div className="border-warning/[0.15] bg-warning/[0.06] mb-3.5 flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5">
            <AlertTriangle size={15} className="text-warning shrink-0" />
            <div className="flex-1">
              <div className="text-warning text-xs font-bold">
                Approaching limits: {warnings.map((w) => w.label).join(', ')}
              </div>
              <div className="text-text-dim text-[11px]">Consider upgrading before you hit the cap.</div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3.5">
          {usageItems.map((item, i) => {
            const unlimited = item.max === -1;
            const hidden = item.max === 0;
            if (hidden)
              return (
                <div key={i} className="opacity-50">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-text text-xs font-semibold">{item.label}</span>
                    <span className="text-text-dim text-[11px] font-semibold italic">Not available on {plan.name}</span>
                  </div>
                  <div className="bg-surface-alt h-2 rounded" />
                </div>
              );
            const pct = unlimited ? 15 : item.max > 0 ? Math.min((item.used / item.max) * 100, 100) : 0;
            const barColor = unlimited
              ? COLORS.primary
              : pct >= 90
                ? COLORS.danger
                : pct >= 70
                  ? '#F59E0B'
                  : COLORS.success;
            const overLimit = !unlimited && item.max > 0 && item.used >= item.max;
            return (
              <div key={i}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-text text-xs font-semibold">{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: overLimit ? COLORS.danger : COLORS.text }}>
                    {item.formatUsed
                      ? item.formatUsed(item.used)
                      : item.suffix
                        ? `${item.used} ${item.suffix}`
                        : item.used}{' '}
                    / {unlimited ? '\u221E' : item.formatMax ? item.formatMax(item.max) : item.max}
                    {overLimit && isDecisionMaker && (
                      <span className="bg-danger-bg text-danger ml-1.5 rounded px-1.5 py-px text-[9px] font-bold">
                        Limit reached
                      </span>
                    )}
                    {overLimit && !isDecisionMaker && (
                      <span className="bg-surface-alt text-text-dim ml-1.5 rounded px-1.5 py-px text-[9px] font-bold">
                        At capacity
                      </span>
                    )}
                    {!overLimit && !unlimited && pct >= 80 && (
                      <span className="text-warning ml-1.5 text-[9px]">({Math.round(pct)}%)</span>
                    )}
                  </span>
                </div>
                <div className="bg-surface-alt h-2 overflow-hidden rounded">
                  <div
                    className="h-full rounded transition-[width] duration-500 ease-in-out"
                    style={{
                      width: `${pct}%`,
                      background: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade button -- only for decision-makers */}
        {isDecisionMaker && userPlan !== 'max' && (
          <button
            type="button"
            onClick={() => setShowPlanModal(true)}
            className="mt-[18px] flex items-center gap-2 rounded-[10px] border-none px-[22px] py-2.5 font-[inherit] text-[13px] font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              boxShadow: `0 4px 16px ${COLORS.primary}25`,
            }}
          >
            <Zap size={14} /> Upgrade to Unlock More
          </button>
        )}
        {/* Info nudge for non-decision-makers when limits are tight */}
        {!isDecisionMaker && (blocked.length > 0 || warnings.length > 0) && (
          <div className="border-border bg-surface-alt mt-4 flex items-center gap-2.5 rounded-[10px] border border-dashed px-3.5 py-2.5">
            <Crown size={15} className="text-warning shrink-0" />
            <div className="text-text-dim text-[11px]">
              {blocked.length > 0
                ? 'Some resources have reached their limit.'
                : 'Some resources are approaching their limit.'}{' '}
              Reach out to the shop owner to request a plan upgrade.
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
