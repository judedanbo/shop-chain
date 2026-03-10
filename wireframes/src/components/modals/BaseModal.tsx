import React from 'react';
import { X } from 'lucide-react';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
  zIndex?: number;
  showClose?: boolean;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 420,
  zIndex = 1101,
  showClose = true,
}: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
      style={{ zIndex }}
    >
      <div
        className="bg-surface border-border max-h-[85vh] w-full animate-[modalIn_0.2s_ease] overflow-auto rounded-2xl border-[1.5px]"
        style={{ maxWidth }}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="border-border flex items-center justify-between gap-3 border-b px-6 py-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {icon}
              {title && (
                <div>
                  <div className="text-text text-base font-extrabold">{title}</div>
                  {subtitle && <div className="text-text-dim mt-0.5 text-xs">{subtitle}</div>}
                </div>
              )}
            </div>
            {showClose && (
              <button type="button" onClick={onClose} aria-label="Close" className="text-text-dim shrink-0">
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
