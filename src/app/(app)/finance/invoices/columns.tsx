"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listInvoices } from "@/lib/data";
import { StatusBadge, MoneyDisplay, DateDisplay } from "@/components/shared";

type InvoiceRow = Awaited<ReturnType<typeof listInvoices>>[number];

export const invoiceColumns: ColumnDef<InvoiceRow, unknown>[] = [
  {
    accessorKey: "invoiceNo",
    header: "Invoice",
    cell: ({ row }) => (
      <Link href={`/orders/${row.original.orderId}`} className="font-semibold hover:underline">
        {row.original.invoiceNo}
      </Link>
    ),
  },
  { accessorKey: "buyerName", header: "Buyer" },
  { accessorKey: "orderNo", header: "Order" },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => <MoneyDisplay amount={row.original.amount} currency={row.original.currency} /> },
  {
    id: "outstanding",
    header: "Outstanding",
    cell: ({ row }) => <MoneyDisplay amount={row.original.outstandingAmount} currency={row.original.currency} />,
  },
  { accessorKey: "dueDate", header: "Due", cell: ({ row }) => <DateDisplay value={row.original.dueDate} /> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
];
