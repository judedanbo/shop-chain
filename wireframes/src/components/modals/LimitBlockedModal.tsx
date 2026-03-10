import { Lock, Zap } from 'lucide-react';
import { useColors, useShop } from '@/context';
import { BaseModal } from './BaseModal';

export function LimitBlockedModal() {
  const COLORS = useColors();
  const { limitBlockedMsg, setLimitBlockedMsg, isDecisionMaker, setShowUpgradeModal } = useShop();

  if (!limitBlockedMsg) return null;

  return (
    <BaseModal isOpen={true} onClose={() => setLimitBlockedMsg(null)} showClose={false}>
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-danger-bg flex h-12 w-12 items-center justify-center rounded-[14px]">
          <Lock size={22} className="text-danger" />
        </div>
        <div>
          <div className="text-text text-base font-extrabold">{limitBlockedMsg.title}</div>
          <div className="text-text-dim mt-0.5 text-xs">{limitBlockedMsg.desc}</div>
        </div>
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => setLimitBlockedMsg(null)}
          className="border-border text-text-muted flex-1 rounded-[10px] border bg-transparent px-4 py-2.5 font-[inherit] text-[13px] font-semibold"
        >
          Close
        </button>
        {isDecisionMaker && (
          <button
            type="button"
            onClick={() => {
              setLimitBlockedMsg(null);
              setShowUpgradeModal(true);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border-none px-4 py-2.5 font-[inherit] text-[13px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
          >
            <Zap size={14} /> Upgrade Now
          </button>
        )}
      </div>
    </BaseModal>
  );
}
