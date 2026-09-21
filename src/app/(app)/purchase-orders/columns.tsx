"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listPurchaseOrders } from "@/lib/data";
import { StatusBadge, MoneyDisplay, DateDisplay } from "@/components/shared";

type PORow = Awaited<ReturnType<typeof listPurchaseOrders>>[number];

export const purchaseOrderColumns: ColumnDef<PORow, unknown>[] = [
  {
    accessorKey: "poNo",
    header: "PO Number",
    cell: ({ row }) => (
      <Link href={`/purchase-orders/${row.original.id}`} className="font-semibold hover:underline">
        {row.original.poNo}
      </Link>
    ),
  },
  { accessorKey: "supplierName", header: "Supplier" },
  { accessorKey: "orderDate", header: "Order Date", cell: ({ row }) => <DateDisplay value={row.original.orderDate} /> },
  { accessorKey: "eta", header: "ETA", cell: ({ row }) => <DateDisplay value={row.original.eta} /> },
  { accessorKey: "totalValue", header: "Value", cell: ({ row }) => <MoneyDisplay amount={row.original.totalValue} currency={row.original.currency} compact /> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "paymentStatus", header: "Payment", cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} /> },
];
