import { type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';

import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { Card } from './Card';

export interface DataTableColumn<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T, index: number) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  striped?: boolean;
  hoverable?: boolean;
  emptyMessage?: string;
  compact?: boolean;
  children?: ReactNode;
}

function defaultKeyExtractor<T>(row: T, index: number): string | number {
  const id = (row as Record<string, unknown>).id;
  if (id !== undefined && id !== null && (typeof id === 'string' || typeof id === 'number')) {
    return id;
  }
  return index;
}

function renderCell<T>(column: DataTableColumn<T>, row: T, index: number): ReactNode {
  if (column.render) return column.render(row, index);
  if (column.accessor !== undefined) return String(row[column.accessor] ?? '');
  return '';
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  keyExtractor = defaultKeyExtractor,
  striped = false,
  hoverable = true,
  emptyMessage = 'No data to display',
  compact = false,
  children,
}: DataTableProps<T>) {
  const bp = useBreakpoint();
  const mobile = isMobile(bp);

  const cellPadding = compact ? '6px 8px' : '12px 16px';
  const cellFontSize = compact ? 12 : undefined;

  // Empty state
  if (data.length === 0) {
    return (
      <div>
        <div className="text-text-dim p-10 text-center text-[13px]">{emptyMessage}</div>
        {children}
      </div>
    );
  }

  // Mobile card layout
  if (mobile) {
    const visibleColumns = columns.filter((c) => !c.hideOnMobile);
    return (
      <div className="flex flex-col gap-2">
        {data.map((row, rowIndex) => (
          <Card key={keyExtractor(row, rowIndex)} padding={14} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {visibleColumns.map((col, colIndex) => (
              <div key={colIndex} className={clsx(colIndex < visibleColumns.length - 1 && 'mb-2')}>
                <div className="text-text-dim mb-[2px] text-[10px] tracking-[0.5px] uppercase">{col.header}</div>
                <div>{renderCell(col, row, rowIndex)}</div>
              </div>
            ))}
          </Card>
        ))}
        {children}
      </div>
    );
  }

  // Desktop grid layout
  const gridTemplateColumns = columns.map((c) => c.width ?? '1fr').join(' ');

  const headerCellStyle = (col: DataTableColumn<T>): CSSProperties => ({
    padding: cellPadding,
    textAlign: col.align ?? 'left',
  });

  const dataCellStyle = (col: DataTableColumn<T>): CSSProperties => ({
    padding: cellPadding,
    fontSize: cellFontSize,
    textAlign: col.align ?? 'left',
  });

  return (
    <div className="overflow-auto">
      {/* Header row */}
      <div className="bg-surface-alt border-border grid border-b" style={{ gridTemplateColumns }}>
        {columns.map((col, i) => (
          <div
            key={i}
            className="text-text-dim text-[11px] font-bold tracking-[0.5px] uppercase"
            style={headerCellStyle(col)}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {data.map((row, rowIndex) => (
        <div
          key={keyExtractor(row, rowIndex)}
          className={clsx(
            'border-border grid items-center border-b transition-[background] duration-150',
            onRowClick && 'cursor-pointer',
            striped && rowIndex % 2 === 1 && 'bg-surface-alt',
            hoverable && (striped && rowIndex % 2 === 1 ? 'hover:bg-border' : 'hover:bg-surface-alt'),
          )}
          style={{ gridTemplateColumns }}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
        >
          {columns.map((col, colIndex) => (
            <div key={colIndex} className="self-center" style={dataCellStyle(col)}>
              {renderCell(col, row, rowIndex)}
            </div>
          ))}
        </div>
      ))}

      {children}
    </div>
  );
}
