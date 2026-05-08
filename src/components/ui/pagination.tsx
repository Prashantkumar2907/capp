"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [8, 12, 24],
}: PaginationProps) {
  if (!totalItems) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(totalItems, page * pageSize);
  const canPrevious = page > 1;
  const canNext = page < totalPages;

  return (
    <nav
      className="flex flex-col gap-3 rounded-2xl border bg-card p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <p className="font-medium">
        Showing <span className="font-numbers text-foreground">{first}-{last}</span> of{" "}
        <span className="font-numbers text-foreground">{totalItems}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap">Rows</span>
          <Select
            aria-label="Rows per page"
            className="h-8 w-20 rounded-full px-2 text-xs"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canPrevious} aria-label="First page" onClick={() => onPageChange(1)}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canPrevious} aria-label="Previous page" onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-numbers min-w-16 text-center text-xs text-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canNext} aria-label="Next page" onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canNext} aria-label="Last page" onClick={() => onPageChange(totalPages)}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
