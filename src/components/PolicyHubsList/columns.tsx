"use client"

import { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: number
  name: string
  // type: "pending" | "processing" | "success" | "failed"
  type: string
  fase: string
}

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "name",
    header: "Naam",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "fase",
    header: "Fase",
  },
]
