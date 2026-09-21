"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { OrderWithContext } from "@/lib/data";
import { StatusBadge, RiskBadge, MoneyDisplay, DateDisplay, PercentageDisplay } from "@/components/shared";

export const orderColumns: ColumnDef<OrderWithContext, unknown>[] = [
  {
    accessorKey: "orderNo",
    header: "Order",
    cell: ({ row }) => (
      <Link href={`/orders/${row.original.id}`} className="font-semibold text-foreground hover:underline">
        {row.original.orderNo}
      </Link>
    ),
  },
  { accessorKey: "buyerName", header: "Buyer" },
  { accessorKey: "styleName", header: "Style" },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => <span className="tabular-nums">{row.original.quantity.toLocaleString("en-IN")}</span>,
  },
  {
    accessorKey: "orderValue",
    header: "Order Value",
    cell: ({ row }) => <MoneyDisplay amount={row.original.orderValue} currency={row.original.currency} compact />,
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => <StatusBadge status={row.original.stage} />,
  },
  {
    accessorKey: "progressPercent",
    header: "Progress",
    cell: ({ row }) => <PercentageDisplay value={row.original.progressPercent} />,
  },
  {
    accessorKey: "expectedDispatchDate",
    header: "Dispatch",
    cell: ({ row }) => <DateDisplay value={row.original.expectedDispatchDate} />,
  },
  {
    id: "risk",
    header: "Risk",
    cell: ({ row }) => <RiskBadge level={row.original.risk.level} reasons={row.original.risk.reasons} />,
  },
  { accessorKey: "factoryName", header: "Factory" },
];
