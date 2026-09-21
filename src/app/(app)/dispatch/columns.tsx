"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listDispatches } from "@/lib/data";
import { StatusBadge, DateDisplay } from "@/components/shared";

type DispatchRow = Awaited<ReturnType<typeof listDispatches>>[number];

export const dispatchColumns: ColumnDef<DispatchRow, unknown>[] = [
  {
    accessorKey: "orderNo",
    header: "Order",
    cell: ({ row }) => (
      <Link href={`/dispatch/${row.original.id}`} className="font-semibold hover:underline">
        {row.original.orderNo}
      </Link>
    ),
  },
  { accessorKey: "buyerName", header: "Buyer" },
  { accessorKey: "mode", header: "Mode", cell: ({ row }) => <span className="uppercase">{row.original.mode}</span> },
  { accessorKey: "forwarder", header: "Forwarder" },
  { accessorKey: "plannedDate", header: "Planned", cell: ({ row }) => <DateDisplay value={row.original.plannedDate} /> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];
