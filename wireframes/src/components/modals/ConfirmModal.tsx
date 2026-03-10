import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { useColors } from '@/context';
import { BaseModal } from './BaseModal';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: LucideIcon;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  icon: Icon = AlertTriangle,
}: ConfirmModalProps) {
  const COLORS = useColors();

  const variantColors: Record<
    NonNullable<ConfirmModalProps['variant']>,
    { bg: string; text: string; gradient: string }
  > = {
    danger: {
      bg: COLORS.dangerBg,
      text: COLORS.danger,
      gradient: `linear-gradient(135deg, ${COLORS.danger}, ${COLORS.danger}dd)`,
    },
    warning: {
      bg: `${COLORS.warning}15`,
      text: COLORS.warning,
      gradient: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.warning}dd)`,
    },
    primary: {
      bg: COLORS.primaryBg,
      text: COLORS.primary,
      gradient: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
    },
  };

  const vc = variantColors[variant];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showClose={false}>
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: vc.bg }}
        >
          <Icon size={22} style={{ color: vc.text }} />
        </div>
        <div>
          <div className="text-text text-base font-extrabold">{title}</div>
          <div className="text-text-dim mt-0.5 text-xs">{message}</div>
        </div>
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="border-border text-text-muted flex-1 rounded-[10px] border bg-transparent px-4 py-2.5 font-[inherit] text-[13px] font-semibold"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="flex-1 rounded-[10px] border-none px-4 py-2.5 font-[inherit] text-[13px] font-bold text-white"
          style={{ background: vc.gradient }}
        >
          {confirmLabel}
        </button>
      </div>
    </BaseModal>
  );
}
