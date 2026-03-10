import React, { Fragment, useState } from 'react';
import { ArrowLeft, RotateCcw, Save, Check, Info } from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { ROLES, DEFAULT_PERMISSIONS, PERM_MODULES } from '@/constants/demoData';
import type { PermissionLevel, PermissionMap } from '@/constants/demoData';

// ─── Local constants ───

const PERMISSION_LEVELS: PermissionLevel[] = ['full', 'partial', 'view', 'none'];

interface PermDisplay {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

const PERM_DISPLAY: Record<PermissionLevel, PermDisplay> = {
  full: { label: 'Full', icon: '\u2713', color: '#10B981', bg: '#10B98115' },
  partial: { label: 'Partial', icon: '\u25D0', color: '#F59E0B', bg: '#F59E0B15' },
  view: { label: 'View', icon: '\u{1F441}', color: '#3B82F6', bg: '#3B82F615' },
  none: { label: 'None', icon: '\u2715', color: '#6B7280', bg: '#6B728015' },
};

// ─── RolePermissionsPage ───

export const RolePermissionsPage: React.FC = () => {
  const COLORS = useColors();
  const { goBack } = useNavigation();
  const bp = useBreakpoint();
  const mobile = isMobile(bp);

  const [perms, setPerms] = useState<Record<string, PermissionMap>>(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
  const [modified, setModified] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const togglePerm = (roleId: string, permKey: string) => {
    if (roleId === 'owner') return; // Owner always full
    setPerms((prev) => {
      const next = { ...prev, [roleId]: { ...prev[roleId] } };
      const rolePerms = next[roleId];
      if (!rolePerms) return prev;
      const cur: PermissionLevel = (rolePerms[permKey] as PermissionLevel) || 'none';
      const idx = PERMISSION_LEVELS.indexOf(cur);
      rolePerms[permKey] = PERMISSION_LEVELS[(idx + 1) % 4] ?? 'none';
      return next;
    });
    setModified((prev) => new Set([...prev, `${roleId}-${permKey}`]));
    setSaved(false);
  };

  const resetAll = () => {
    setPerms(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
    setModified(new Set());
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setModified(new Set());
    }, 1200);
  };

  const roleOrder = ROLES;

  return (
    <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-7 sm:py-6">
      {/* Header */}
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            onClick={goBack}
            className="bg-surface-alt border-border flex size-9 cursor-pointer items-center justify-center rounded-[10px] border"
          >
            <ArrowLeft size={16} className="text-text-muted" />
          </div>
          <div>
            <h2 className="text-text m-0 text-[18px] font-extrabold sm:text-[22px]">Role Permissions</h2>
            <p className="text-text-dim m-0 text-[13px]">
              Click cells to cycle: Full {'\u2192'} Partial {'\u2192'} View {'\u2192'} None
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetAll}
            disabled={modified.size === 0}
            className={clsx(
              'border-border flex items-center gap-1.5 rounded-[10px] border-[1.5px] bg-transparent px-4 py-[9px] font-[inherit] text-xs font-semibold',
              modified.size > 0 ? 'cursor-pointer' : 'cursor-not-allowed',
            )}
            style={{
              color: modified.size > 0 ? COLORS.textMuted : COLORS.textDim,
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={modified.size === 0 || saving}
            className={clsx(
              'flex items-center gap-1.5 rounded-[10px] border-none px-5 py-[9px] font-[inherit] text-xs font-bold',
              modified.size > 0 && !saving ? 'cursor-pointer' : 'cursor-not-allowed',
            )}
            style={{
              background:
                modified.size > 0 && !saving
                  ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                  : COLORS.surfaceAlt,
              color: modified.size > 0 && !saving ? '#fff' : COLORS.textDim,
              boxShadow: modified.size > 0 ? `0 4px 16px ${COLORS.primary}35` : 'none',
            }}
          >
            {saving ? (
              <>
                <div
                  className="size-[13px] rounded-full"
                  style={{
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />{' '}
                Saving...
              </>
            ) : saved ? (
              <>
                <Check size={13} /> Saved
              </>
            ) : (
              <>
                <Save size={13} /> Save Changes ({modified.size})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-2 sm:gap-4">
        {PERMISSION_LEVELS.map((level) => {
          const d = PERM_DISPLAY[level];
          return (
            <div key={level} className="text-text-dim flex items-center gap-1.5 text-xs">
              <div
                className="flex size-6 items-center justify-center rounded-md text-xs font-bold"
                style={{
                  background: d.bg,
                  color: d.color,
                  border: `1px solid ${d.color}25`,
                }}
              >
                {d.icon}
              </div>
              <span className="font-semibold">{d.label}</span>
            </div>
          );
        })}
      </div>

      {/* Matrix */}
      <div className="border-border bg-surface overflow-hidden rounded-[14px] border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: mobile ? 900 : 'auto' }}>
            <thead>
              <tr>
                <th className="text-text-dim bg-surface-alt border-border sticky left-0 z-[2] min-w-[160px] border-r px-3.5 py-3 text-left text-[11px] font-bold tracking-[0.5px] uppercase">
                  Permission
                </th>
                {roleOrder.map((r) => (
                  <th
                    key={r.id}
                    className="bg-surface-alt border-border min-w-[72px] border-l px-1.5 py-2.5 text-center text-[11px] font-bold"
                  >
                    <div className="flex flex-col items-center gap-[3px]">
                      <span className="text-base">{r.icon}</span>
                      <span className="text-[10px] leading-tight" style={{ color: r.color }}>
                        {r.label}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERM_MODULES.map((mod, mi) => (
                <Fragment key={mod.module}>
                  {/* Module header row */}
                  <tr>
                    <td
                      colSpan={roleOrder.length + 1}
                      className="text-text px-3.5 py-2.5 text-xs font-extrabold tracking-[0.3px]"
                      style={{
                        background: `${COLORS.primary}06`,
                        borderTop: mi > 0 ? `2px solid ${COLORS.border}` : 'none',
                      }}
                    >
                      {mod.module}
                    </td>
                  </tr>
                  {/* Permission rows */}
                  {mod.perms.map((perm) => (
                    <tr key={perm.key} className="border-border border-t">
                      <td className="text-text-muted bg-surface border-border sticky left-0 z-[1] border-r py-2 pr-3.5 pl-7 text-xs font-medium">
                        {perm.label}
                      </td>
                      {roleOrder.map((role) => {
                        const val: PermissionLevel = (perms[role.id]?.[perm.key] as PermissionLevel) || 'none';
                        const d = PERM_DISPLAY[val];
                        const isOwner = role.id === 'owner';
                        const isMod = modified.has(`${role.id}-${perm.key}`);
                        return (
                          <td
                            key={role.id}
                            onClick={() => togglePerm(role.id, perm.key)}
                            className={clsx(
                              'border-border border-l px-1 py-1.5 text-center transition-all duration-100',
                              isOwner ? 'cursor-not-allowed' : 'cursor-pointer',
                            )}
                            style={{
                              background: isMod ? `${COLORS.primary}08` : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!isOwner)
                                e.currentTarget.style.background = isMod ? `${COLORS.primary}12` : COLORS.surfaceAlt;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = isMod ? `${COLORS.primary}08` : 'transparent';
                            }}
                            title={isOwner ? 'Owner: always full access' : `Click to change (current: ${d.label})`}
                          >
                            <div
                              className="mx-auto flex size-[30px] items-center justify-center rounded-lg text-[13px] font-bold transition-all duration-150"
                              style={{
                                background: d.bg,
                                color: d.color,
                                border: isMod ? `2px solid ${COLORS.primary}60` : `1px solid ${d.color}20`,
                                opacity: isOwner ? 0.6 : 1,
                              }}
                            >
                              {d.icon}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info footer */}
      <div className="bg-surface-alt border-border mt-4 flex items-start gap-2.5 rounded-[10px] border px-4 py-3">
        <Info size={15} className="text-text-dim mt-px shrink-0" />
        <div className="text-text-dim text-xs leading-normal">
          <strong className="text-text">Owner</strong> permissions are locked and cannot be modified. Changes apply to
          all team members with the affected role. Use the <strong className="text-text">Demo Role Switcher</strong> in
          the top bar to preview how the app looks for each role.
        </div>
      </div>
    </div>
  );
};
