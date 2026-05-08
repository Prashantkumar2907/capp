"use client";

import { useCallback, useMemo, useState } from "react";

export function usePagination<T>(items: T[], initialPageSize = 8) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = useState(initialPageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const goToPage = useCallback(
    (nextPage: number) => {
      setPage(Math.min(Math.max(1, nextPage), totalPages));
    },
    [totalPages]
  );

  const setPageSize = useCallback((nextPageSize: number) => {
    setPageSizeValue(nextPageSize);
    setPage(1);
  }, []);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  return {
    currentPage,
    pageItems,
    pageSize,
    setPage: goToPage,
    setPageSize,
    totalItems,
    totalPages,
  };
}
