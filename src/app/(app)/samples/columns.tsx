"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listSamples } from "@/lib/data";
import { StatusBadge, DateDisplay } from "@/components/shared";
import { formatSampleType } from "@/lib/utils/format";

type SampleRow = Awaited<ReturnType<typeof listSamples>>[number];

export const sampleColumns: ColumnDef<SampleRow, unknown>[] = [
  {
    id: "order",
    header: "Order",
    cell: ({ row }) => (row.original.orderNo ? <Link href={`/orders/${row.original.orderId}`} className="font-medium hover:underline">{row.original.orderNo}</Link> : "—"),
  },
  { accessorKey: "styleName", header: "Style" },
  {
    accessorKey: "sampleType",
    header: "Type",
    cell: ({ row }) => <span>{formatSampleType(row.original.sampleType)}</span>,
  },
  { accessorKey: "versionNumber", header: "Version" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "sentDate", header: "Sent", cell: ({ row }) => <DateDisplay value={row.original.sentDate} /> },
];
