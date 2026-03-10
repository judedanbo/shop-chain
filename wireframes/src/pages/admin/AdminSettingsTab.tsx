import { useState } from 'react';
import { Moon, Sun, Globe, Users, Zap, Bell, Lock } from 'lucide-react';
import { TabButton } from '@/components/ui';
import type { AdminThemeColors, AdminThemeId } from '@/constants/adminThemes';

interface AdminSettingsTabProps {
  C: AdminThemeColors;
  adminTheme: AdminThemeId;
  setAdminTheme: (theme: AdminThemeId) => void;
}

const toggles = [
  {
    key: 'maintenance',
    icon: Zap,
    label: 'Maintenance Mode',
    desc: 'Temporarily disable platform access for non-admins',
  },
  { key: 'registrations', icon: Users, label: 'Open Registrations', desc: 'Allow new user signups' },
  { key: 'freeTrial', icon: Globe, label: 'Free Trial', desc: 'Enable 14-day free trial for new signups' },
  { key: 'force2fa', icon: Lock, label: 'Force 2FA', desc: 'Require two-factor authentication for all admin accounts' },
  { key: 'emailNotifs', icon: Bell, label: 'Email Notifications', desc: 'Send system email notifications' },
] as const;

export function AdminSettingsTab({ C, adminTheme, setAdminTheme }: AdminSettingsTabProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(true);
  const [forceTwoFA, setForceTwoFA] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const stateMap: Record<string, boolean> = {
    maintenance: maintenanceMode,
    registrations: registrationsOpen,
    freeTrial: freeTrialEnabled,
    force2fa: forceTwoFA,
    emailNotifs: emailNotifications,
  };

  const setterMap: Record<string, (v: boolean) => void> = {
    maintenance: setMaintenanceMode,
    registrations: setRegistrationsOpen,
    freeTrial: setFreeTrialEnabled,
    force2fa: setForceTwoFA,
    emailNotifs: setEmailNotifications,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Admin Profile */}
      <div className="bg-surface border-border rounded-[14px] border-[1.5px] p-5">
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white"
            style={{ background: C.adminAccent }}
          >
            JA
          </div>
          <div>
            <div className="text-text text-base font-bold">Jude Appiah</div>
            <div className="text-warning text-xs font-semibold">Super Admin</div>
            <div className="text-text-dim text-xs">admin@shopchain.com</div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div>
        <div className="text-text mb-3.5 text-sm font-bold">Appearance</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'dark' as AdminThemeId, Icon: Moon, label: 'Dark' },
            { id: 'light' as AdminThemeId, Icon: Sun, label: 'Light' },
          ].map(({ id, Icon, label }) => {
            const active = adminTheme === id;
            return (
              <TabButton
                key={id}
                active={active}
                variant="filter"
                onClick={() => setAdminTheme(id)}
                className="flex items-center gap-3 rounded-[14px] p-5"
                style={{
                  background: active ? C.primaryBg : C.surface,
                  color: active ? C.primary : C.text,
                  border: `1.5px solid ${active ? C.primary : C.border}`,
                }}
              >
                <Icon size={18} color={active ? C.primary : C.textDim} />
                <span className="text-sm font-semibold">{label}</span>
              </TabButton>
            );
          })}
        </div>
      </div>

      {/* Platform Settings */}
      <div>
        <div className="text-text mb-3.5 text-sm font-bold">Platform Settings</div>
        <div className="bg-surface border-border rounded-[14px] border-[1.5px] p-5">
          {toggles.map(({ key, icon: Icon, label, desc }, i) => {
            const on = stateMap[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between py-3.5"
                style={{
                  borderBottom: i < toggles.length - 1 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Icon size={18} color={C.textDim} />
                  <div className="min-w-0">
                    <div className="text-text text-sm font-semibold">{label}</div>
                    <div className="text-text-dim mt-0.5 text-xs">{desc}</div>
                  </div>
                </div>
                <div
                  onClick={() => setterMap[key]?.(!on)}
                  className="relative h-6 w-11 shrink-0 cursor-pointer rounded-xl transition-[background] duration-200"
                  style={{
                    background: on ? C.primary : C.border,
                  }}
                >
                  <div
                    className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                    style={{
                      transform: on ? 'translateX(20px)' : 'translateX(0)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <div className="text-text mb-3.5 text-sm font-bold">Danger Zone</div>
        <div className="bg-danger-bg border-border rounded-[14px] border-[1.5px] p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {['Clear All Cache', 'Reset Platform Settings'].map((label) => (
              <button
                type="button"
                key={label}
                className="text-danger rounded-[10px] bg-transparent px-[18px] py-2.5 text-[13px] font-semibold"
                style={{
                  border: `1.5px solid ${C.danger}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
