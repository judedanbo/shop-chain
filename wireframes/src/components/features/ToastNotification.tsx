import { X, CheckCircle, AlertTriangle, Info, Ban } from 'lucide-react';
import { useTheme } from '@/context';
import type { Toast, ToastType } from '@/context/ToastContext';

interface ToastNotificationProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

export function ToastNotification({ toasts, removeToast }: ToastNotificationProps) {
  const { colors } = useTheme();
  if (toasts.length === 0) return null;

  const iconMap: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
    deny: Ban,
  };
  const colorMap: Record<ToastType, string> = {
    success: colors.success,
    error: colors.danger,
    warning: colors.warning,
    info: colors.accent,
    deny: colors.danger,
  };

  return (
    <div className="z-toast fixed top-4 right-4 flex max-w-[360px] flex-col gap-2">
      {toasts.map((t) => {
        const Icon = iconMap[t.type] || Info;
        const color = colorMap[t.type] || colors.accent;
        return (
          <div
            key={t.id}
            className="bg-surface border-border flex animate-[modalIn_0.2s_ease] items-start gap-2.5 rounded-xl border px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
          >
            <Icon size={18} style={{ color }} className="mt-px shrink-0" />
            <div className="flex-1">
              {t.title && <div className="text-text mb-0.5 text-[13px] font-bold">{t.title}</div>}
              <span className="text-[13px] font-medium" style={{ color: t.title ? colors.textMuted : colors.text }}>
                {t.message}
              </span>
            </div>
            <button type="button" onClick={() => removeToast(t.id)} aria-label="Close notification">
              <X size={14} className="text-text-dim mt-px shrink-0" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
