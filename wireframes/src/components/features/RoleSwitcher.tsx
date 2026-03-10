import { Check, ChevronDown } from 'lucide-react';
import { useColors, useAuth, useToast } from '@/context';
import { ROLES, getRoleMeta } from '@/constants/demoData';

export interface RoleSwitcherProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function RoleSwitcher({ isOpen, onToggle, onClose }: RoleSwitcherProps) {
  const COLORS = useColors();
  const { currentRole, setCurrentRole } = useAuth();
  const { addToastWithTitle } = useToast();
  const meta = getRoleMeta(currentRole);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-[5px] rounded-lg px-2.5 py-[5px] text-[11px] font-bold transition-all duration-150"
        style={{
          background: `${meta.color}12`,
          border: `1.5px solid ${meta.color}30`,
          color: meta.color,
        }}
      >
        <span className="text-[13px]">{meta.icon}</span>
        <span className="hidden sm:inline">{meta.label}</span>
        <ChevronDown size={11} />
      </button>
      {isOpen && (
        <>
          <div onClick={onClose} aria-hidden="true" className="z-dropdown-backdrop fixed inset-0" />
          <div className="bg-surface border-border z-dropdown absolute top-[calc(100%+6px)] right-0 min-w-[220px] animate-[modalIn_0.15s_ease] rounded-[14px] border p-2 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <div className="form-label px-2.5 pt-2 pb-1.5 tracking-[0.5px]">Demo Role Switcher</div>
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => {
                  setCurrentRole(r.id);
                  onClose();
                  addToastWithTitle('Role Changed', `Now previewing as ${r.label}`, 'info');
                }}
                className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-[9px] text-left transition-[background] duration-100"
                style={{
                  background: currentRole === r.id ? `${r.color}12` : 'transparent',
                  border: currentRole === r.id ? `1px solid ${r.color}25` : '1px solid transparent',
                }}
              >
                <span className="text-base">{r.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-bold" style={{ color: currentRole === r.id ? r.color : COLORS.text }}>
                    {r.label}
                  </div>
                  <div className="text-text-dim overflow-hidden text-[10px] text-ellipsis whitespace-nowrap">
                    {r.description.split('—')[0]}
                  </div>
                </div>
                {currentRole === r.id && <Check size={14} style={{ color: r.color }} className="shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
