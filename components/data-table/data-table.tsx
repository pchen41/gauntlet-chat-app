'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FacetedFilter } from './faceted-filter';
import { JSX } from 'react';

export type DataTableSchema<DataType> = {
  key: string;
  label?: string;
  sortable?: boolean;
  facetedFilter?: { label: string; options: { label: string; value: string }[] };
  filterLabel?: string;
  renderFn?: (data: DataType) => JSX.Element;
  className?: string;
}[];

type ColumnMeta = {
  className?: string;
};

export function DataTable<DataType>({
  schema,
  data,
  emptyMessage,
  onRowClick,
  toolbar,
}: {
  schema: DataTableSchema<DataType>;
  data: DataType[];
  emptyMessage?: JSX.Element;
  onRowClick?: (row: DataType) => void;
  toolbar?: () => JSX.Element; // shown above the top of the table, on the right side
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const filterColumn = schema.find((column) => column.filterLabel);
  const facetedFilters = schema.filter((column) => column.facetedFilter);
  const columns: ColumnDef<DataType, ColumnMeta>[] = schema.map((value) => getColumnDef(value));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
    },
  });

  var fullToolbar = null;
  if (filterColumn || facetedFilters.length > 0 || toolbar) {
    fullToolbar = (
      <div className="flex flex-row items-center justify-between pb-4">
        <div className="flex flex-row gap-2">
          {filterColumn && (
            <Input
              placeholder={filterColumn.filterLabel}
              value={(table.getColumn(filterColumn.key)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(filterColumn.key)?.setFilterValue(event.target.value)
              }
              className="h-8 max-w-80 text-sm"
            />
          )}
          {facetedFilters &&
            facetedFilters.map((filter) => {
              const column = table.getColumn(filter.key);
              if (!column || !filter.facetedFilter) return null;

              return (
                <FacetedFilter
                  key={filter.key}
                  column={column}
                  title={filter.facetedFilter.label}
                  options={filter.facetedFilter.options}
                />
              );
            })}
        </div>
        {toolbar && toolbar()}
      </div>
    );
  }

  return (
    <>
      {fullToolbar}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                    ? (header.column.columnDef.meta as ColumnMeta)
                    : undefined;
                  const metaClassName = meta?.className ? meta.className : '';

                  return (
                    <TableHead
                      key={header.id}
                      className={'h-10 font-medium text-muted-foreground ' + metaClassName}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={onRowClick && 'hover:cursor-pointer'}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta
                      ? (cell.column.columnDef.meta as ColumnMeta)
                      : undefined;
                    const metaClassName = meta?.className ? meta.className : '';
                    return (
                      <TableCell key={cell.id} className={metaClassName}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage || 'No results.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function getColumnDef<DataType>(
  schema: DataTableSchema<DataType>[0],
): ColumnDef<DataType, ColumnMeta> {
  return {
    accessorKey: schema.key,
    header: ({ column }) => {
      if (schema.sortable) {
        const sorted = column.getIsSorted();
        var arrow = <ArrowUpDown className="ml-2 h-4 w-4" />;
        if (sorted === 'asc') {
          arrow = <ArrowUp className="ml-2 h-4 w-4" />;
        } else if (sorted === 'desc') {
          arrow = <ArrowDown className="ml-2 h-4 w-4" />;
        }

        return (
          <Button
            className="-ml-4"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {schema.label}
            {arrow}
          </Button>
        );
      }
      return schema.label;
    },
    cell: (context) => {
      return (
        (schema.renderFn && schema.renderFn(context.row.original as DataType)) ||
        context.renderValue()
      );
    },
    filterFn: (row, id, value) => {
      return schema.facetedFilter
        ? value.includes(row.getValue(id))
        : (row.getValue(id) as string).toLowerCase().includes(value);
    },
    meta: {
      className: schema.className,
    },
  };
}