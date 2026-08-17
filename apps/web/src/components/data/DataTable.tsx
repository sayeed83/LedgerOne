"use client";

import type { ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Alert, EmptyState, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ledgerone/ui";

export interface DataTableProps<TData> {
  // `any` here is TanStack Table's own generic column-value parameter
  // (each column projects a different field type off `TData`) — a single
  // shared, cross-module wrapper cannot know every consumer's per-column
  // value types in advance, and TanStack's own public API types this the
  // same way.
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  onRowClick?: (row: TData) => void;
  getRowKey: (row: TData) => string;
}

// TBL-001: the one shared, cross-module table primitive wrapping TanStack
// Table — no module builds its own table from raw markup. TBL-003: this
// wraps client-side-only rendering (no virtualization/server pagination),
// the documented exception for genuinely small, bounded datasets — exactly
// what every Organization list is (a Tenant's Companies, a Company's
// Branches/Departments, all returned unpaginated by the backend). CMP-002:
// dumb/presentational — loading/error/data all arrive as props, no
// fetching of its own.
export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage = "Something went wrong. Please try again.",
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  onRowClick,
  getRowKey,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isError) {
    return <Alert variant="error" message={errorMessage} />;
  }

  if (isLoading) {
    return <DataTableSkeleton columnCount={columns.length} />;
  }

  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={getRowKey(row.original)}
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            className={onRowClick ? "cursor-pointer" : undefined}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// LOAD-001/002: a skeleton loader matched to `DataTable`'s own shape,
// living alongside it.
export function DataTableSkeleton({ columnCount, rowCount = 5 }: { columnCount: number; rowCount?: number }) {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columnCount }).map((__, columnIndex) => (
              <TableCell key={columnIndex}>
                <Skeleton variant="text" className="w-full max-w-[10rem]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
