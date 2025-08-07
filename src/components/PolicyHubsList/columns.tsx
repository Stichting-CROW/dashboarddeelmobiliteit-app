"use client"

import markerMapIcon from './img/marker_map_icon.svg';

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "../ui/checkbox"
import { CheckedState } from "@radix-ui/react-checkbox"

import { DataTableColumnHeader } from "./column-headers";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Hub = {
  id: number
  name: string
  type: string
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
      <div>
        <div className="flex items-center">
          <div className="mr-2">
            Selecteer alle
          </div>
          <label className="flex items-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() as CheckedState ||
                (table.getIsSomePageRowsSelected() && "indeterminate") as CheckedState
              }
              onCheckedChange={(value) => {
                table.toggleAllPageRowsSelected(!!value)
              }}
              aria-label="Selecteer alle zones"
            />
          </label>
        </div>
        <div>
          <select 
            className="w-36 px-1 border shadow rounded"
            onChange={(e) => {
              const value = e.target.value;
              if (value === "selected") {
                // Filter to show only selected rows
                table.setColumnFilters([
                  {
                    id: 'select',
                    value: 'selected'
                  }
                ])
              } else if (value === "unselected") {
                // Filter to show only unselected rows
                table.setColumnFilters([
                  {
                    id: 'select',
                    value: 'unselected'
                  }
                ])
              } else {
                // Show all rows (clear filter)
                table.setColumnFilters([])
              }
            }}
          >
            <option value="">Alle</option>
            <option value="selected">Geselecteerd</option>
            <option value="unselected">Niet geselecteerd</option>
          </select>
        </div>
      </div>
    ),
    cell: ({ row }) => (
      <>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecteer zone"
          className="block"
        />
      </>
    ),
    enableSorting: true,
    enableHiding: false,
    filterFn: (row, id, value) => {
      if (value === 'selected') {
        return row.getIsSelected();
      }
      if (value === 'unselected') {
        return !row.getIsSelected();
      }
      return true; // Show all rows when no filter is applied
    },
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
