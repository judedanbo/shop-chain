import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-[60px] text-center">
      <div className="bg-surface-alt mb-4 flex size-16 items-center justify-center rounded-2xl">
        <Icon size={28} className="text-text-dim" />
      </div>
      <div className="text-text mb-1.5 text-base font-bold">{title}</div>
      {description && <div className="text-text-dim max-w-[400px] text-[13px] leading-normal">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
