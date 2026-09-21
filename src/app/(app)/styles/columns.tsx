"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listStyles } from "@/lib/data";
import { StatusBadge } from "@/components/shared";

type StyleRow = Awaited<ReturnType<typeof listStyles>>[number];

export const styleColumns: ColumnDef<StyleRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Style",
    cell: ({ row }) => (
      <Link href={`/styles/${row.original.id}`} className="font-semibold hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "styleCode", header: "Code" },
  { accessorKey: "buyerName", header: "Buyer" },
  { accessorKey: "fabric", header: "Fabric" },
  { accessorKey: "gsm", header: "GSM" },
  {
    accessorKey: "approvalStatus",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} />,
  },
];
