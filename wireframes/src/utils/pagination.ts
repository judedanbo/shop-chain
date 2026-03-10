export interface PaginationResult<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  start: number;
  end: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function paginate<T>(arr: T[], page: number, perPage: number): PaginationResult<T> {
  const total = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const end = Math.min(start + perPage, total);
  return {
    items: arr.slice(start, end),
    page: safePage,
    totalPages,
    total,
    start,
    end,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}
