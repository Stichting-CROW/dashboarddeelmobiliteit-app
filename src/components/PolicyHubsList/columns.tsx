"use client"

import markerMapIcon from './img/marker_map_icon.svg';

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "../ui/checkbox"
import { CheckedState } from "@radix-ui/react-checkbox"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  EyeNoneIcon,
} from "@radix-ui/react-icons";
import { Button } from "../ui/button"

import { DataTableColumnHeader } from "./column-headers";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Hub = {
  id: number
  name: string
  // type: "pending" | "processing" | "success" | "failed"
  type: string
  // fase: string
}

const flyTo = (area, zone_id) => {
  if(! area) return;
  if(! zone_id) return;

  // Trigger setSelectedZone custom event (see FilterbarZones.tsx)
  const event = new CustomEvent('flyToHubTrigger', {
    detail: {
      area,
      zone_id
    }
  });
  window.dispatchEvent(event);
}

export const columns: ColumnDef<Hub>[] = [
  {
    id: "select",
    header: ({ table, column }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() as CheckedState ||
            (table.getIsSomePageRowsSelected() && "indeterminate") as CheckedState
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
          }}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="block"
        />
      </>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  // {
  //   accessorKey: "fase",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Fase" />
  //   ),
  //   meta: {
  //     filterVariant: 'select',
  //   },
  // },
  {
    accessorKey: "fly_to_hub",
    header: ({ column }) => (
      <div className="flex justify-start whitespace-nowrap">
      </div>
    ),
    cell: (info: any) => {
      return <div className="cursor-pointer text-center" title="Bekijk zone op de kaart" onClick={() => {
        flyTo(info.row.original.area, info.row.original.id)
      }}>
        <img src={markerMapIcon} alt="marker" className="inline-block -mr-5" style={{maxWidth: '9999px', height: '20px'}} />
      </div>
    }
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    meta: {
      filterVariant: 'select',
    },
  },
  {
    accessorKey: "name",
    cell: info => info.getValue(),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Naam" />
    ),
  },
  {
    accessorKey: "internal_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lokale ID" />
    ),
  },
  {
    accessorKey: "is_virtual",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Virtueel / Fysiek" />
    ),
    meta: {
      filterVariant: 'select',
    },
  },
  {
    accessorKey: "published_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Publicatiedatum" />
    ),
  },
  {
    accessorKey: "effective_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Startdatum" />
    ),
  },
  {
    accessorKey: "retire_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Verwijderdatum" />
    ),
  },
  {
    accessorKey: "created_by",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Gemaakt door" />
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Gemaakt op" />
    ),
  },
  {
    accessorKey: "last_modified_by",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aangepast door" />
    ),
  },
  {
    accessorKey: "modified_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aangepast op" />
    ),
  }
]
