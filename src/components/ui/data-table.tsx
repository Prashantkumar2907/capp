import type * as React from "react";
import { cn } from "@/lib/utils";
import { SkeletonList } from "@/components/ui/skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T) => React.Key;
  className?: string;
  empty?: React.ReactNode;
  error?: string | null;
  loading?: boolean;
  loadingRows?: number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  className,
  columns,
  empty,
  error,
  getRowKey,
  loading = false,
  loadingRows = 5,
  onRowClick,
  rows,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn("rounded-2xl border bg-card p-3", className)} role="status" aria-label="Loading table">
        <SkeletonList count={loadingRows} itemClassName="h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-2xl border bg-card p-6 text-sm text-destructive", className)} role="alert">
        {error}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className={cn("rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground", className)}>
        {empty ?? "No records found."}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-secondary text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn("px-3 py-3 font-semibold", column.headerClassName)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const clickable = Boolean(onRowClick);
              return (
                <tr
                  key={getRowKey(row)}
                  className={cn("border-t transition-colors", clickable ? "cursor-pointer hover:bg-secondary/70" : undefined)}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => onRowClick?.(row) : undefined}
                  onKeyDown={
                    clickable
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick?.(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-3 py-3 align-middle", column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
