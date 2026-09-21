"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listInspections } from "@/lib/data";
import { StatusBadge, DateDisplay } from "@/components/shared";

type InspectionRow = Awaited<ReturnType<typeof listInspections>>[number];

export const inspectionColumns: ColumnDef<InspectionRow, unknown>[] = [
  {
    id: "order",
    header: "Order",
    cell: ({ row }) => (
      <Link href={`/quality/inspections/${row.original.id}`} className="font-semibold hover:underline">
        {row.original.orderNo}
      </Link>
    ),
  },
  {
    accessorKey: "inspectionType",
    header: "Type",
    cell: ({ row }) => <span className="capitalize">{row.original.inspectionType.replace(/_/g, " ")}</span>,
  },
  { accessorKey: "factoryName", header: "Factory" },
  { accessorKey: "date", header: "Date", cell: ({ row }) => <DateDisplay value={row.original.date} /> },
  { accessorKey: "quantityInspected", header: "Inspected", cell: ({ row }) => row.original.quantityInspected.toLocaleString("en-IN") },
  {
    id: "defects",
    header: "Defects (m/M/c)",
    cell: ({ row }) => `${row.original.minorDefects}/${row.original.majorDefects}/${row.original.criticalDefects}`,
  },
  { accessorKey: "result", header: "Result", cell: ({ row }) => <StatusBadge status={row.original.result} /> },
];
