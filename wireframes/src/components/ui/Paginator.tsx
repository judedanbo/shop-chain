import { clsx } from 'clsx';

export interface PaginatorProps {
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  start: number;
  onPage: (page: number) => void;
}

export function Paginator({ total, page, totalPages, perPage, start, onPage }: PaginatorProps) {
  if (total <= perPage) return null;
  const end = Math.min(start + perPage, total);
  const maxVis = 5;
  let pStart = Math.max(1, page - Math.floor(maxVis / 2));
  const pEnd = Math.min(totalPages, pStart + maxVis - 1);
  if (pEnd - pStart + 1 < maxVis) pStart = Math.max(1, pEnd - maxVis + 1);
  const pageNums: number[] = [];
  for (let i = pStart; i <= pEnd; i++) pageNums.push(i);

  const navBtnCls = (disabled: boolean) =>
    clsx(
      'size-7 rounded-md border border-border bg-transparent text-[10px] font-[inherit] flex items-center justify-center',
      disabled ? 'text-text-dim opacity-40 cursor-default' : 'text-text-muted cursor-pointer',
    );

  return (
    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 py-2.5">
      <span className="text-text-dim text-[11px]">
        Showing {start + 1}–{end} of {total}
      </span>
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={() => onPage(1)} disabled={page <= 1} className={navBtnCls(page <= 1)}>
          «
        </button>
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={navBtnCls(page <= 1)}
        >
          ‹
        </button>
        {pStart > 1 && <span className="text-text-dim px-0.5 text-[10px]">…</span>}
        {pageNums.map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => onPage(n)}
            className={clsx(
              'size-7 rounded-md font-[inherit] text-[11px]',
              n === page
                ? 'border-primary bg-primary/[.13] text-primary border-[1.5px] font-bold'
                : 'border-border text-text-muted border bg-transparent font-medium',
            )}
          >
            {n}
          </button>
        ))}
        {pEnd < totalPages && <span className="text-text-dim px-0.5 text-[10px]">…</span>}
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={navBtnCls(page >= totalPages)}
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => onPage(totalPages)}
          disabled={page >= totalPages}
          className={navBtnCls(page >= totalPages)}
        >
          »
        </button>
      </div>
    </div>
  );
}
