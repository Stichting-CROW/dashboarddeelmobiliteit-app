"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "../ui/checkbox"
import { CheckedState } from "@radix-ui/react-checkbox"

import { DataTableColumnHeader } from "./column-headers";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Hub = {
  id: number
  name: string
  // type: "pending" | "processing" | "success" | "failed"
  type: string
  fase: string
}

export const columns: ColumnDef<Hub>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() as CheckedState ||
          (table.getIsSomePageRowsSelected() && "indeterminate") as CheckedState
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Naam" />
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
  },
  {
    accessorKey: "fase",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fase" />
    ),
  },
]
