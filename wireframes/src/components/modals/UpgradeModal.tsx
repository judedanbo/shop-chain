import { X } from 'lucide-react';
import { useColors, useShop } from '@/context';
import { PLAN_TIERS, PLAN_ORDER } from '@/constants/plans';

export function UpgradeModal() {
  const COLORS = useColors();
  const { userPlan, setUserPlan, showUpgradeModal, setShowUpgradeModal } = useShop();

  if (!showUpgradeModal) return null;

  return (
    <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]">
      <div
        className="bg-surface border-border max-h-[85vh] w-full max-w-[600px] overflow-auto rounded-[18px] border-[1.5px]"
        style={{ animation: 'modalIn 0.2s ease' }}
      >
        <div className="border-border flex items-center justify-between border-b px-6 py-5">
          <div>
            <div className="text-text text-lg font-extrabold">Upgrade Your Plan</div>
            <div className="text-text-dim mt-0.5 text-xs">Unlock more capacity and features</div>
          </div>
          <button type="button" onClick={() => setShowUpgradeModal(false)} aria-label="Close" className="text-text-dim">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3.5 p-6 md:grid-cols-3">
          {PLAN_ORDER.map((pid) => {
            const p = PLAN_TIERS[pid as keyof typeof PLAN_TIERS];
            if (!p) return null;
            const isCurrent = pid === userPlan;
            const isUpgrade = PLAN_ORDER.indexOf(pid) > PLAN_ORDER.indexOf(userPlan as 'free' | 'basic' | 'max');
            return (
              <div
                key={pid}
                className="relative rounded-[14px] p-5"
                style={{
                  border: `1.5px solid ${isCurrent ? p.color : COLORS.border}`,
                  background: isCurrent ? `${p.color}08` : 'transparent',
                }}
              >
                {isCurrent && (
                  <div
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-md px-3 py-0.5 text-[9px] font-extrabold whitespace-nowrap text-white"
                    style={{ background: p.color }}
                  >
                    Current Plan
                  </div>
                )}
                <div className="mb-3.5 text-center">
                  <div className="text-[28px]">{p.icon}</div>
                  <div className="mt-1 text-base font-extrabold" style={{ color: p.color }}>
                    {p.name}
                  </div>
                  <div className="text-text mt-1 text-[22px] font-black">
                    {p.price === 0 ? (
                      'Free'
                    ) : (
                      <>
                        GH₵ {p.price}
                        <span className="text-text-dim text-xs font-medium">/mo</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isUpgrade || !isCurrent) {
                      setUserPlan(pid);
                      setShowUpgradeModal(false);
                    }
                  }}
                  disabled={isCurrent}
                  className="mt-3.5 w-full rounded-[10px] px-4 py-2.5 font-[inherit] text-xs font-bold"
                  style={{
                    border: isCurrent ? `1px solid ${COLORS.border}` : 'none',
                    background: isCurrent
                      ? 'transparent'
                      : isUpgrade
                        ? `linear-gradient(135deg, ${p.color}, ${p.color}dd)`
                        : COLORS.surfaceAlt,
                    color: isCurrent ? COLORS.textDim : isUpgrade ? '#fff' : COLORS.text,
                    cursor: isCurrent ? 'default' : 'pointer',
                  }}
                >
                  {isCurrent ? 'Current' : isUpgrade ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
