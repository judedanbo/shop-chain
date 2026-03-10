import { useState, useCallback, useMemo } from 'react';
import { paginate, type PaginationResult } from '@/utils/pagination';

interface UsePaginationOptions {
  perPage?: number;
  initialPage?: number;
}

interface UsePaginationReturn<T> extends PaginationResult<T> {
  setPage: (page: number) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPage: () => void;
}

export function usePagination<T>(items: T[], options: UsePaginationOptions = {}): UsePaginationReturn<T> {
  const { perPage = 10, initialPage = 1 } = options;
  const [page, setPageState] = useState(initialPage);

  const paginatedData = useMemo(() => paginate(items, page, perPage), [items, page, perPage]);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const goToPage = useCallback(
    (newPage: number) => {
      const safePage = Math.max(1, Math.min(newPage, paginatedData.totalPages));
      setPageState(safePage);
    },
    [paginatedData.totalPages],
  );

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);
  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);
  const resetPage = useCallback(() => {
    setPageState(initialPage);
  }, [initialPage]);

  return { ...paginatedData, setPage, goToPage, nextPage, prevPage, resetPage };
}
