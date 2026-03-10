import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { computePlanUsage } from '@/utils/planUsage';
import { PLAN_TIERS, PLAN_ORDER } from '@/constants/plans';
import { DEFAULT_PERMISSIONS, DEMO_USAGE } from '@/constants/demoData';
import type { UsageItem, UsageData, PlanUsage, PlanId } from '@/types';
import type { PermissionMap } from '@/constants/demoData';

// ─── Types ───
export interface LimitBlockedMsg {
  title: string;
  desc: string;
}

export interface UsageCounts {
  products: number;
  team: number;
}

interface ShopContextValue {
  // Plan state
  userPlan: string;
  setUserPlan: (plan: string) => void;
  trialDaysLeft: number;

  // Modals
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  limitBlockedMsg: LimitBlockedMsg | null;
  setLimitBlockedMsg: (msg: LimitBlockedMsg | null) => void;

  // Computed usage
  liveUsage: UsageData;
  planUsage: PlanUsage;

  // Permission helpers
  isDecisionMaker: boolean;
  canAdd: (key: string) => boolean;
  showLimitBlock: (resourceLabel: string) => void;
  rolePerms: PermissionMap;
  canAccess: (permKey: string) => boolean;
  hasFullAccess: (permKey: string) => boolean;
}

const ShopContext = createContext<ShopContextValue | null>(null);

// ─── Provider ───
export function ShopProvider({ children, usageCounts }: { children: ReactNode; usageCounts: UsageCounts }) {
  const { currentRole } = useAuth();

  const [userPlan, setUserPlan] = useState('basic');
  const [trialDaysLeft] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitBlockedMsg, setLimitBlockedMsg] = useState<LimitBlockedMsg | null>(null);

  // Live usage — dynamic counts from props, static from constants
  const liveUsage = useMemo<UsageData>(
    () => ({
      shops: 1,
      branches: 2,
      team: usageCounts.team,
      products: usageCounts.products,
      transactions: DEMO_USAGE.transactions,
      storageMB: DEMO_USAGE.storageMB,
      suppliers: 6,
      warehouses: 1,
    }),
    [usageCounts.team, usageCounts.products],
  );

  const planUsage = useMemo<PlanUsage>(() => computePlanUsage(userPlan as PlanId, liveUsage), [userPlan, liveUsage]);

  // Role-based permissions
  const isDecisionMaker = useMemo(() => ['owner', 'manager', 'general_manager'].includes(currentRole), [currentRole]);

  const rolePerms = useMemo<PermissionMap>(
    () => DEFAULT_PERMISSIONS[currentRole] || DEFAULT_PERMISSIONS['viewer']!,
    [currentRole],
  );

  const canAccess = useCallback(
    (permKey: string) => {
      const level = rolePerms[permKey];
      return !!level && level !== 'none';
    },
    [rolePerms],
  );

  const hasFullAccess = useCallback((permKey: string) => rolePerms[permKey] === 'full', [rolePerms]);

  const canAdd = useCallback(
    (key: string) => {
      if (!isDecisionMaker) return true;
      const item = planUsage.items.find((i: UsageItem) => i.key === key);
      if (!item || item.unlimited) return true;
      return item.used < item.max;
    },
    [isDecisionMaker, planUsage.items],
  );

  const showLimitBlock = useCallback(
    (resourceLabel: string) => {
      const plan = PLAN_TIERS[userPlan as keyof typeof PLAN_TIERS];
      const idx = PLAN_ORDER.indexOf(userPlan as PlanId);
      const nextPlanId = idx >= 0 && idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : null;
      const nextPlan = nextPlanId ? PLAN_TIERS[nextPlanId] : null;
      setLimitBlockedMsg({
        title: `${resourceLabel} Limit Reached`,
        desc: isDecisionMaker
          ? `Your ${plan?.name} plan allows a maximum. ${nextPlan ? `Upgrade to ${nextPlan.name} for higher limits.` : ''}`
          : `The ${plan?.name} plan limit for ${resourceLabel.toLowerCase()} has been reached. Please contact the shop owner.`,
      });
    },
    [userPlan, isDecisionMaker],
  );

  const value = useMemo<ShopContextValue>(
    () => ({
      userPlan,
      setUserPlan,
      trialDaysLeft,
      showUpgradeModal,
      setShowUpgradeModal,
      limitBlockedMsg,
      setLimitBlockedMsg,
      liveUsage,
      planUsage,
      isDecisionMaker,
      canAdd,
      showLimitBlock,
      rolePerms,
      canAccess,
      hasFullAccess,
    }),
    [
      userPlan,
      trialDaysLeft,
      showUpgradeModal,
      limitBlockedMsg,
      liveUsage,
      planUsage,
      isDecisionMaker,
      canAdd,
      showLimitBlock,
      rolePerms,
      canAccess,
      hasFullAccess,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

// ─── Hook ───
export function useShop(): ShopContextValue {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
}
