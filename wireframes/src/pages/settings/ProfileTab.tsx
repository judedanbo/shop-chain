import type { ReactNode } from 'react';
import { User, Info, Save, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import type { ThemeColors } from '@/types';
import type { Breakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import type { ProfileData, PlanTierData } from './AccountPage';

// ─── Props ────────────────────────────────────────────────────

export interface ProfileTabProps {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  profileSaving: boolean;
  profileSaved: boolean;
  onSave: () => void;
  plan: PlanTierData;
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
    className="bg-surface border-border mb-4 rounded-[14px] border-[1.5px]"
    style={{
      padding: mobile ? 16 : 20,
      ...style,
    }}
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

const FieldRow = ({ label, children, readOnly }: { label: string; children: ReactNode; readOnly?: boolean }) => (
  <div className="mb-3.5">
    <label className="text-text-muted mb-1 block text-[11px] font-bold tracking-wide uppercase">
      {label}
      {readOnly && (
        <span className="bg-surface-alt text-text-dim ml-1.5 rounded px-[5px] py-px text-[9px]">Read-only</span>
      )}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full rounded-[10px] border-[1.5px] border-border bg-surface-alt px-3.5 py-2.5 text-[13px] text-text outline-none font-[inherit]';

const readOnlyCls =
  'w-full rounded-[10px] border-[1.5px] border-border px-3.5 py-2.5 text-[13px] outline-none font-[inherit] cursor-default';

// ─── Component ────────────────────────────────────────────────

export const ProfileTab = ({
  profile,
  setProfile,
  profileSaving,
  profileSaved,
  onSave,
  plan,
  COLORS,
  bp,
}: ProfileTabProps) => {
  const mobile = isMobile(bp);
  const up = (f: keyof ProfileData, v: string) => setProfile((p) => ({ ...p, [f]: v }));

  return (
    <div>
      <SectionCard mobile={mobile}>
        <SectionTitle icon={User} title="Personal Information" sub="Update your account details" />
        {/* Avatar */}
        <div className="mb-5 flex items-center gap-3.5">
          <div
            className="text-primary flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-extrabold"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.accent}15)`,
              border: `2px solid ${COLORS.primary}25`,
            }}
          >
            {profile.avatar}
          </div>
          <div>
            <div className="text-text text-sm font-bold">{profile.name}</div>
            <button
              type="button"
              className="border-border text-text-muted mt-1 rounded-md border bg-transparent px-3 py-1 font-[inherit] text-[11px] font-semibold"
            >
              Change Avatar
            </button>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 0 : 14 }}>
          <FieldRow label="Full Name">
            <input value={profile.name} onChange={(e) => up('name', e.target.value)} className={inputCls} />
          </FieldRow>
          <FieldRow label="Email">
            <input
              value={profile.email}
              onChange={(e) => up('email', e.target.value)}
              type="email"
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Phone">
            <input value={profile.phone} onChange={(e) => up('phone', e.target.value)} className={inputCls} />
          </FieldRow>
          <FieldRow label="Company (Optional)">
            <input value={profile.company} onChange={(e) => up('company', e.target.value)} className={inputCls} />
          </FieldRow>
          <FieldRow label="City / Region">
            <input value={profile.city} onChange={(e) => up('city', e.target.value)} className={inputCls} />
          </FieldRow>
        </div>
      </SectionCard>
      <SectionCard mobile={mobile}>
        <SectionTitle icon={Info} title="Account Info" />
        <div className="grid gap-3.5" style={{ gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr' }}>
          <FieldRow label="Account ID" readOnly>
            <div className={readOnlyCls} style={{ background: `${COLORS.surfaceAlt}80`, color: COLORS.textDim }}>
              USR-DEMO-001
            </div>
          </FieldRow>
          <FieldRow label="Member Since" readOnly>
            <div className={readOnlyCls} style={{ background: `${COLORS.surfaceAlt}80`, color: COLORS.textDim }}>
              June 15, 2025
            </div>
          </FieldRow>
          <FieldRow label="Current Plan" readOnly>
            <div
              className={clsx(readOnlyCls, 'flex items-center gap-1.5')}
              style={{ background: `${COLORS.surfaceAlt}80`, color: COLORS.textDim }}
            >
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{
                  background: `${plan.color}15`,
                  color: plan.color,
                }}
              >
                {plan.icon} {plan.name}
              </span>
            </div>
          </FieldRow>
        </div>
      </SectionCard>
      <button
        type="button"
        onClick={onSave}
        disabled={profileSaving}
        className={clsx(
          'flex items-center gap-2 rounded-[10px] border-none px-7 py-[11px] font-[inherit] text-[13px] font-bold text-white',
          profileSaving ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
        style={{
          background: profileSaved
            ? COLORS.success
            : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
          boxShadow: `0 4px 16px ${COLORS.primary}25`,
        }}
      >
        {profileSaving ? (
          <>
            <div
              className="h-3.5 w-3.5 rounded-full"
              style={{
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite',
              }}
            />{' '}
            Saving...
          </>
        ) : profileSaved ? (
          <>
            <CheckCircle size={14} /> Saved!
          </>
        ) : (
          <>
            <Save size={14} /> Save Changes
          </>
        )}
      </button>
    </div>
  );
};
