"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listMaterials } from "@/lib/data";
import { StatusBadge, DateDisplay } from "@/components/shared";

type MaterialRow = Awaited<ReturnType<typeof listMaterials>>[number];

export const materialColumns: ColumnDef<MaterialRow, unknown>[] = [
  { accessorKey: "description", header: "Material" },
  {
    id: "order",
    header: "Order",
    cell: ({ row }) => (row.original.orderNo ? <Link href={`/orders/${row.original.orderId}`} className="hover:underline">{row.original.orderNo}</Link> : "—"),
  },
  { accessorKey: "supplierName", header: "Supplier" },
  { accessorKey: "requiredQty", header: "Required", cell: ({ row }) => row.original.requiredQty.toLocaleString("en-IN") },
  { accessorKey: "receivedQty", header: "Received", cell: ({ row }) => row.original.receivedQty.toLocaleString("en-IN") },
  { id: "shortage", header: "Shortage", cell: ({ row }) => row.original.availability.shortage.toLocaleString("en-IN") },
  { accessorKey: "expectedArrival", header: "Expected", cell: ({ row }) => <DateDisplay value={row.original.expectedArrival} /> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];
