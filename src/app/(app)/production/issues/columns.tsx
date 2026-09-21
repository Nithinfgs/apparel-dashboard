"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { listProductionIssues } from "@/lib/data";
import { StatusBadge, RiskBadge, DateDisplay } from "@/components/shared";
import { PRODUCTION_STAGE_LABELS, PRODUCTION_ISSUE_TYPE_LABELS } from "@/lib/constants";

type IssueRow = Awaited<ReturnType<typeof listProductionIssues>>[number];

export const issueColumns: ColumnDef<IssueRow, unknown>[] = [
  {
    accessorKey: "orderNo",
    header: "Order",
    cell: ({ row }) => (
      <Link href={`/production/issues/${row.original.id}`} className="font-semibold hover:underline">
        {row.original.orderNo}
      </Link>
    ),
  },
  { accessorKey: "factoryName", header: "Factory" },
  { accessorKey: "stage", header: "Stage", cell: ({ row }) => PRODUCTION_STAGE_LABELS[row.original.stage] },
  { accessorKey: "issueType", header: "Type", cell: ({ row }) => PRODUCTION_ISSUE_TYPE_LABELS[row.original.issueType] },
  { accessorKey: "severity", header: "Severity", cell: ({ row }) => <RiskBadge level={row.original.severity} /> },
  { accessorKey: "ownerName", header: "Owner" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "createdAt", header: "Reported", cell: ({ row }) => <DateDisplay value={row.original.createdAt} /> },
];
