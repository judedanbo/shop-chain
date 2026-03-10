import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '@/context';
import type { PageId } from '@/types';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: PageId;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backTo, onBack, actions }: PageHeaderProps) {
  const { setPage, goBack } = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      setPage(backTo);
    } else {
      goBack();
    }
  };

  const showBack = !!(backTo || onBack);

  return (
    <div className="mb-[14px] flex flex-wrap items-center justify-between gap-3 sm:mb-[18px] md:mb-[22px]">
      <div className="flex min-w-0 items-center gap-2.5">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="text-text-muted bg-surface-alt border-border flex size-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-150"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-text m-0 overflow-hidden text-base font-[800] text-ellipsis whitespace-nowrap sm:text-lg md:text-xl">
            {title}
          </h2>
          {subtitle && <div className="text-text-dim mt-0.5 text-xs">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
