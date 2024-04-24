"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
  VisibilityState
} from "@tanstack/react-table"

import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"

import ActionHeader from './action-header';

import {
  setSelectedPolicyHubs,
} from '../../actions/policy-hubs'

import React, { useEffect } from "react"
import { useDispatch, useSelector } from 'react-redux';

import './data-table.css';
import { StateType } from "../../types/StateType"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const dispatch = useDispatch()

  const selected_policy_hubs = useSelector((state: StateType) => state.policy_hubs ? state.policy_hubs.selected_policy_hubs : []);

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
    },
  });

  // On component load: Select selected hubs
  useEffect(() => {
    const rowIdsToSelect = [];
    const allRows = table.getRowModel().rowsById;
    Object.keys(allRows).map((key) => {
      const row: any = allRows[key];
      // index: 0/1/2
      // zone_id: row.original.id

      // Check if row should be selected
      if(selected_policy_hubs.indexOf(row.original?.id) > -1) {
        // If so: Add to rowIdsToSelect array
        rowIdsToSelect.push(row.index);
      }
    });
    // Set row selection
    // Should look like this: {0: true, 1: true, 3: true}
    const newRowSelectionObject = {};
    rowIdsToSelect.forEach(indexId => {
      newRowSelectionObject[indexId] = true;
    });
    setRowSelection(newRowSelectionObject);
  }, [
    table.getRowModel()
  ]);

  // If selection changes: Update selected hubs
  useEffect(() => {
    // Only continue if there are any rows
    if(table.getFilteredSelectedRowModel()?.rows?.length < 1) {
      return;
    }
    
    const hubIds = table.getFilteredSelectedRowModel()?.rows.map((x: any) => x.original?.id);
    dispatch(setSelectedPolicyHubs(hubIds));
  }, [
    table.getFilteredSelectedRowModel()
  ]);
console.log('table.getRowModel()', table.getRowModel())
  return (
    <>
      <div className="flex items-center py-4 mb-4">
        <Input
          placeholder="Filter"
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            // Filter every column
            table.getColumn('name')?.setFilterValue(event.target.value)

          //   columns.forEach((x: any) => {
          //     if(! x.accessorKey) return;
          //     console.log('x.accessorKey', x.accessorKey, event.target.value)
          //     table.getColumn(x.accessorKey)?.setFilterValue(event.target.value)
          //   });
          }}
          className="max-w-sm px-4"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border" style={{width: 'fit-content'}}>
        <Table style={{width: 'fit-content'}}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="py-2 px-5 flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} van de {" "}
            {table.getFilteredRowModel().rows.length} rij(en) geselecteerd
        </div>
      </div>
    </>
  )
}

