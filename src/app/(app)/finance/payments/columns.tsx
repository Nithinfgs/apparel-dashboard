"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { listPayments } from "@/lib/data";
import { MoneyDisplay, DateDisplay } from "@/components/shared";

type PaymentRow = Awaited<ReturnType<typeof listPayments>>[number];

export const paymentColumns: ColumnDef<PaymentRow, unknown>[] = [
  { accessorKey: "invoiceNo", header: "Invoice" },
  { accessorKey: "buyerName", header: "Buyer" },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => <MoneyDisplay amount={row.original.amount} currency={row.original.currency} /> },
  { accessorKey: "method", header: "Method" },
  { accessorKey: "reference", header: "Reference" },
  { accessorKey: "paidDate", header: "Paid On", cell: ({ row }) => <DateDisplay value={row.original.paidDate} /> },
];
