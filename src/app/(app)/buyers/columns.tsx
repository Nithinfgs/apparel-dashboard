"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listBuyers } from "@/lib/data";
import { MoneyDisplay, PercentageDisplay } from "@/components/shared";

type BuyerRow = Awaited<ReturnType<typeof listBuyers>>[number];

export const buyerColumns: ColumnDef<BuyerRow, unknown>[] = [
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => (
      <Link href={`/buyers/${row.original.id}`} className="font-semibold hover:underline">
        {row.original.companyName}
      </Link>
    ),
  },
  { accessorKey: "country", header: "Country" },
  { accessorKey: "currency", header: "Currency" },
  {
    id: "lifetimeValue",
    header: "Lifetime Value",
    cell: ({ row }) => <MoneyDisplay amount={row.original.kpis.lifetimeOrderValue} currency="INR" compact />,
  },
  { id: "activeOrders", header: "Active Orders", cell: ({ row }) => row.original.kpis.activeOrders },
  {
    id: "onTime",
    header: "On-Time %",
    cell: ({ row }) => <PercentageDisplay value={row.original.kpis.onTimeDeliveryPercent} />,
  },
];
