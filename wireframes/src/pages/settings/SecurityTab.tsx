import type { ReactNode } from 'react';
import { KeyRound, Phone, Globe, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import type { ThemeColors } from '@/types';
import type { Breakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import type { PwFormData, DemoSession } from './AccountPage';

// ─── Props ────────────────────────────────────────────────────

export interface SecurityTabProps {
  pwForm: PwFormData;
  setPwForm: React.Dispatch<React.SetStateAction<PwFormData>>;
  pwSaving: boolean;
  pwSaved: boolean;
  onPwSave: () => void;
  twoFAEnabled: boolean;
  setTwoFAEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  showQR: boolean;
  setShowQR: React.Dispatch<React.SetStateAction<boolean>>;
  sessions: DemoSession[];
  onRevokeSession: (id: string) => void;
  onRevokeAllOther: () => void;
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

const FieldRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="mb-3.5">
    <label className="text-text-muted mb-1 block text-[11px] font-bold tracking-wide uppercase">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full rounded-[10px] border-[1.5px] border-border bg-surface-alt px-3.5 py-2.5 text-[13px] text-text outline-none font-[inherit]';

// ─── Component ────────────────────────────────────────────────

export const SecurityTab = ({
  pwForm,
  setPwForm,
  pwSaving,
  pwSaved,
  onPwSave,
  twoFAEnabled,
  setTwoFAEnabled,
  showQR,
  setShowQR,
  sessions,
  onRevokeSession,
  onRevokeAllOther,
  COLORS,
  bp,
}: SecurityTabProps) => {
  const mobile = isMobile(bp);

  const pwStrength = (pw: string) => {
    if (!pw) return { label: '', color: '#666', pct: 0 };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { label: 'Weak', color: COLORS.danger, pct: 25 };
    if (s === 2) return { label: 'Fair', color: '#F59E0B', pct: 50 };
    if (s === 3) return { label: 'Good', color: COLORS.accent, pct: 75 };
    return { label: 'Strong', color: COLORS.success, pct: 100 };
  };
  const strength = pwStrength(pwForm.newPw);

  return (
    <div>
      {/* Change Password */}
      <SectionCard mobile={mobile}>
        <SectionTitle icon={KeyRound} title="Change Password" sub="Last changed 30 days ago" />
        <div
          className="grid max-w-[500px]"
          style={{
            gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
            gap: mobile ? 0 : 14,
          }}
        >
          <FieldRow label="Current Password">
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
              className={inputCls}
              placeholder="Enter current password"
            />
          </FieldRow>
          <div />
          <FieldRow label="New Password">
            <input
              type="password"
              value={pwForm.newPw}
              onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
              className={inputCls}
              placeholder="Enter new password"
            />
            {pwForm.newPw && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="bg-surface-alt h-1 flex-1 overflow-hidden rounded-sm">
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{
                      width: `${strength.pct}%`,
                      background: strength.color,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </FieldRow>
          <FieldRow label="Confirm Password">
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              className={inputCls}
              placeholder="Re-enter new password"
            />
          </FieldRow>
        </div>
        <button
          type="button"
          onClick={onPwSave}
          disabled={!pwForm.current || !pwForm.newPw || pwForm.newPw !== pwForm.confirm || pwSaving}
          className={clsx(
            'mt-1 rounded-lg border-none px-[22px] py-[9px] font-[inherit] text-xs font-bold text-white',
            (!pwForm.current || !pwForm.newPw || pwForm.newPw !== pwForm.confirm) && 'opacity-50',
          )}
          style={{
            background: pwSaved ? COLORS.success : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
          }}
        >
          {pwSaving ? 'Updating...' : pwSaved ? '\u2713 Updated!' : 'Update Password'}
        </button>
      </SectionCard>

      {/* 2FA */}
      <SectionCard mobile={mobile}>
        <SectionTitle
          icon={Phone}
          title="Two-Factor Authentication"
          sub={twoFAEnabled ? 'Enabled \u2014 your account is extra secure' : 'Add an extra layer of security'}
        />
        <div
          className="flex items-center gap-3 rounded-[10px] p-3.5"
          style={{
            background: twoFAEnabled ? `${COLORS.success}08` : COLORS.surfaceAlt,
            border: `1px solid ${twoFAEnabled ? COLORS.success + '20' : COLORS.border}`,
          }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[10px]"
            style={{
              background: twoFAEnabled ? `${COLORS.success}15` : COLORS.surfaceAlt,
            }}
          >
            {twoFAEnabled ? (
              <Shield size={18} className="text-success" />
            ) : (
              <Shield size={18} className="text-text-dim" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-text text-[13px] font-bold">{twoFAEnabled ? '2FA is Active' : '2FA is Off'}</div>
            <div className="text-text-dim text-[11px]">Use Google Authenticator or Authy</div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!twoFAEnabled) {
                setShowQR(true);
                setTwoFAEnabled(true);
              } else {
                setTwoFAEnabled(false);
                setShowQR(false);
              }
            }}
            className="rounded-lg border-none px-4 py-[7px] font-[inherit] text-xs font-bold"
            style={{
              background: twoFAEnabled
                ? COLORS.dangerBg
                : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              color: twoFAEnabled ? COLORS.danger : '#fff',
            }}
          >
            {twoFAEnabled ? 'Disable' : 'Enable 2FA'}
          </button>
        </div>
        {showQR && twoFAEnabled && (
          <div
            className="bg-surface-alt border-border mt-3.5 rounded-[10px] border p-4 text-center"
            style={{
              animation: 'modalIn 0.2s ease',
            }}
          >
            <div className="text-text mb-2.5 text-xs font-bold">Scan this QR code with your authenticator app</div>
            {/* Placeholder QR */}
            <div className="border-border mx-auto mb-3 flex h-[140px] w-[140px] items-center justify-center rounded-xl border-2 bg-white">
              <div className="grid grid-cols-7 gap-0.5 p-3">
                {Array.from({ length: 49 }, (_, i) => (
                  <div
                    key={i}
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{
                      background: Math.random() > 0.4 ? '#1a1a2e' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="text-text-dim mb-2 text-[11px] font-semibold">
              Manual key: <code className="bg-surface rounded px-1.5 py-0.5 text-[10px]">DEMO-XXXX-XXXX-XXXX</code>
            </div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                className="border-border text-text-muted rounded-md border bg-transparent px-3.5 py-1.5 font-[inherit] text-[11px] font-semibold"
              >
                Download Backup Codes
              </button>
              <button
                type="button"
                onClick={() => setShowQR(false)}
                className="bg-primary rounded-md border-none px-3.5 py-1.5 font-[inherit] text-[11px] font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Active Sessions */}
      <SectionCard mobile={mobile}>
        <SectionTitle icon={Globe} title="Active Sessions" sub={`${sessions.length} devices`} />
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-[10px] px-3.5 py-3"
              style={{
                background: s.current ? `${COLORS.primary}06` : COLORS.surfaceAlt,
                border: `1px solid ${s.current ? COLORS.primary + '20' : COLORS.border}`,
              }}
            >
              <div className="bg-surface border-border flex h-9 w-9 items-center justify-center rounded-[10px] border">
                <Globe size={16} style={{ color: s.current ? COLORS.primary : COLORS.textDim }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-text flex items-center gap-1.5 text-xs font-bold">
                  {s.device}{' '}
                  {s.current && (
                    <span className="text-primary bg-primary/[0.08] rounded px-1.5 py-px text-[9px] font-bold">
                      This device
                    </span>
                  )}
                </div>
                <div className="text-text-dim text-[11px]">
                  {s.location} {'\u00B7'} {s.lastActive}
                </div>
              </div>
              {!s.current && (
                <button
                  type="button"
                  onClick={() => onRevokeSession(s.id)}
                  className="bg-danger-bg text-danger border-danger/[0.13] rounded-md border px-2.5 py-[5px] font-[inherit] text-[10px] font-semibold"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
        {sessions.filter((s) => !s.current).length > 0 && (
          <button
            type="button"
            onClick={onRevokeAllOther}
            className="bg-danger-bg text-danger border-danger/[0.13] mt-2.5 rounded-lg border px-4 py-2 font-[inherit] text-[11px] font-bold"
          >
            Log Out All Other Sessions
          </button>
        )}
      </SectionCard>
    </div>
  );
};
