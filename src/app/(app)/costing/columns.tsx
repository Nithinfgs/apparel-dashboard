"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listCostings } from "@/lib/data";
import { MoneyDisplay, PercentageDisplay, StatusBadge } from "@/components/shared";

type CostingRow = Awaited<ReturnType<typeof listCostings>>[number];

export const costingColumns: ColumnDef<CostingRow, unknown>[] = [
  {
    id: "order",
    header: "Order",
    cell: ({ row }) =>
      row.original.orderNo ? (
        <Link href={`/orders/${row.original.orderId}`} className="font-semibold hover:underline">
          {row.original.orderNo}
        </Link>
      ) : (
        <span className="text-muted-foreground">Enquiry costing</span>
      ),
  },
  { accessorKey: "styleName", header: "Style" },
  { accessorKey: "versionNumber", header: "Version" },
  {
    id: "cost",
    header: "Cost / Piece",
    cell: ({ row }) => <MoneyDisplay amount={row.original.breakdown.costPerPiece} currency={row.original.currency} />,
  },
  {
    id: "price",
    header: "Selling Price",
    cell: ({ row }) => <MoneyDisplay amount={row.original.sellingPricePerPiece} currency={row.original.currency} />,
  },
  {
    id: "margin",
    header: "Margin %",
    cell: ({ row }) => <PercentageDisplay value={row.original.breakdown.marginPercent} digits={1} />,
  },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];
