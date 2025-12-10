import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "../../../lib/utils";
import { Skeleton } from "../skeleton";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  error?: Error | null;
  emptyState?: React.ReactNode;

  // Row interactions
  onRowClick?: (row: TData) => void;

  // External sorting (server-side)
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  // External pagination (server-side)
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;

  // Column visibility
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;

  // Column filters
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;

  // Global filter
  globalFilter?: string;
  onGlobalFilterChange?: OnChangeFn<string>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  error = null,
  emptyState,
  onRowClick,
  sorting: externalSorting,
  onSortingChange,
  pageCount,
  pageIndex,
  pageSize,
  onPaginationChange,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange,
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({});
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});

  const sorting = externalSorting ?? internalSorting;
  const columnFilters = externalColumnFilters ?? internalColumnFilters;
  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;
  const globalFilter = externalGlobalFilter ?? internalGlobalFilter;

  const isServerSide = pageCount !== undefined;

  const table = useReactTable({
    data,
    columns,
    pageCount: isServerSide ? pageCount : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      ...(isServerSide && pageIndex !== undefined && pageSize !== undefined
        ? { pagination: { pageIndex, pageSize } }
        : {}),
    },
    onSortingChange: onSortingChange ?? setInternalSorting,
    onColumnFiltersChange: onColumnFiltersChange ?? setInternalColumnFilters,
    onColumnVisibilityChange: onColumnVisibilityChange ?? setInternalColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: onGlobalFilterChange ?? setInternalGlobalFilter,
    onPaginationChange: isServerSide && onPaginationChange
      ? (updater) => {
          const newPagination = typeof updater === 'function'
            ? updater({ pageIndex: pageIndex ?? 0, pageSize: pageSize ?? 10 })
            : updater;
          onPaginationChange(newPagination);
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: !isServerSide ? getSortedRowModel() : undefined,
    getFilteredRowModel: !isServerSide ? getFilteredRowModel() : undefined,
    getPaginationRowModel: !isServerSide ? getPaginationRowModel() : undefined,
    manualSorting: isServerSide,
    manualFiltering: isServerSide,
    manualPagination: isServerSide,
  });

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        <div className="text-center">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                      header.column.getCanSort() && "cursor-pointer select-none"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="ml-1 text-xs">
                            {{
                              asc: "↑",
                              desc: "↓",
                            }[header.column.getIsSorted() as string] ?? "↕"}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b transition-colors">
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="p-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyState ?? "No results."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
