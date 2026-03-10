import type { ReactNode } from 'react';
import { Bell, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import type { ThemeColors } from '@/types';
import type { Breakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import type { NotifPrefs, QuietHoursData } from './AccountPage';

// ─── Props ────────────────────────────────────────────────────

export interface NotificationsTabProps {
  notifPrefs: NotifPrefs;
  setNotifPrefs: React.Dispatch<React.SetStateAction<NotifPrefs>>;
  quietHours: QuietHoursData;
  setQuietHours: React.Dispatch<React.SetStateAction<QuietHoursData>>;
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

const inputCls =
  'w-full rounded-[10px] border-[1.5px] border-border bg-surface-alt px-3.5 py-2.5 text-[13px] text-text outline-none font-[inherit]';

// ─── Component ────────────────────────────────────────────────

export const NotificationsTab = ({
  notifPrefs,
  setNotifPrefs,
  quietHours,
  setQuietHours,
  COLORS,
  bp,
}: NotificationsTabProps) => {
  const mobile = isMobile(bp);

  return (
    <div>
      <SectionCard mobile={mobile}>
        <SectionTitle icon={Bell} title="Notification Preferences" sub="Choose how you want to be notified" />
        {/* Header */}
        <div className="border-border mb-2 grid grid-cols-[1fr_50px_50px_50px] gap-1 border-b pb-2">
          <div className="form-label tracking-wide">Notification</div>
          {['App', 'Email', 'SMS'].map((ch) => (
            <div key={ch} className="form-label text-center tracking-wide">
              {ch}
            </div>
          ))}
        </div>
        {[
          { key: 'low_stock', label: 'Low Stock Alerts', icon: '\uD83D\uDCE6' },
          { key: 'new_member', label: 'New Team Member', icon: '\uD83D\uDC64' },
          { key: 'pos_summary', label: 'POS Daily Summary', icon: '\uD83D\uDED2' },
          { key: 'po_updates', label: 'Purchase Order Updates', icon: '\uD83D\uDCCB' },
          { key: 'billing', label: 'Subscription & Billing', icon: '\uD83D\uDCB3' },
          { key: 'security', label: 'Security Alerts', icon: '\uD83D\uDD12' },
          { key: 'announcements', label: 'Platform Announcements', icon: '\uD83D\uDCE2' },
          { key: 'weekly_digest', label: 'Weekly Business Digest', icon: '\uD83D\uDCCA' },
        ].map((item, i) => (
          <div
            key={item.key}
            className="grid grid-cols-[1fr_50px_50px_50px] items-center gap-1 py-2.5"
            style={{
              borderBottom: i < 7 ? `1px solid ${COLORS.border}08` : 'none',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              <span className="text-text text-xs font-semibold">{item.label}</span>
            </div>
            {(['app', 'email', 'sms'] as const).map((ch) => {
              const on = notifPrefs[item.key]?.[ch];
              return (
                <div key={ch} className="text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setNotifPrefs(
                        (p: NotifPrefs): NotifPrefs =>
                          ({ ...p, [item.key]: { ...p[item.key], [ch]: !on } }) as NotifPrefs,
                      )
                    }
                    className="relative h-5 w-9 rounded-[10px] border-none transition-[background] duration-200"
                    style={{
                      background: on ? COLORS.primary : COLORS.surfaceAlt,
                    }}
                  >
                    <div
                      className="absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white transition-[left] duration-200"
                      style={{
                        left: on ? 19 : 3,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </SectionCard>

      {/* Quiet Hours */}
      <SectionCard mobile={mobile}>
        <div className={clsx('flex items-center justify-between', quietHours.enabled && 'mb-3.5')}>
          <div className="flex items-center gap-2.5">
            <Moon size={16} className="text-text-dim" />
            <div>
              <div className="text-text text-[13px] font-bold">Quiet Hours</div>
              <div className="text-text-dim text-[11px]">Mute non-critical notifications</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQuietHours((p) => ({ ...p, enabled: !p.enabled }))}
            className="relative h-6 w-11 rounded-xl border-none transition-[background] duration-200"
            style={{
              background: quietHours.enabled ? COLORS.primary : COLORS.surfaceAlt,
            }}
          >
            <div
              className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-[left] duration-200"
              style={{
                left: quietHours.enabled ? 23 : 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>
        {quietHours.enabled && (
          <div className="flex items-center gap-3" style={{ animation: 'modalIn 0.15s ease' }}>
            <div>
              <label className="text-text-dim mb-1 block text-[10px] font-semibold">From</label>
              <input
                type="time"
                value={quietHours.from}
                onChange={(e) => setQuietHours((p) => ({ ...p, from: e.target.value }))}
                className={clsx(inputCls, 'w-[110px] px-2.5 py-2')}
              />
            </div>
            <span className="text-text-dim mt-4">{'\u2192'}</span>
            <div>
              <label className="text-text-dim mb-1 block text-[10px] font-semibold">To</label>
              <input
                type="time"
                value={quietHours.to}
                onChange={(e) => setQuietHours((p) => ({ ...p, to: e.target.value }))}
                className={clsx(inputCls, 'w-[110px] px-2.5 py-2')}
              />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
