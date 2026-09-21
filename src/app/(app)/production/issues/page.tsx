import { listProductionIssues, listFactories, listActiveProductionOrders } from "@/lib/data";
import { PageHeader, DataTable, FilterBar } from "@/components/shared";
import { issueColumns } from "./columns";
import { IssueForm } from "./issue-form";
import { INTERNAL_STAFF_PROFILES } from "@/lib/auth/session";

export default async function ProductionIssuesPage({ searchParams }: { searchParams: Promise<{ status?: string; severity?: string }> }) {
  const { status, severity } = await searchParams;
  const [issues, factories, orders] = await Promise.all([
    listProductionIssues({ status, severity }),
    listFactories(),
    listActiveProductionOrders(),
  ]);
  const owners = INTERNAL_STAFF_PROFILES.map((p) => ({ id: p.id, fullName: p.fullName }));
  const openCount = issues.filter((i) => i.status === "open" || i.status === "in_progress").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Production Issues"
        description={`${issues.length} issues logged · ${openCount} open or in progress.`}
        actions={<IssueForm orders={orders} factories={factories.map((f) => ({ id: f.id, name: f.name }))} owners={owners} />}
      />

      <FilterBar
        filters={[
          {
            paramKey: "status",
            label: "Status",
            options: ["open", "in_progress", "resolved", "closed"].map((s) => ({ value: s, label: s.replace("_", " ") })),
          },
          {
            paramKey: "severity",
            label: "Severity",
            options: ["low", "medium", "high", "critical"].map((s) => ({ value: s, label: s })),
          },
        ]}
      />

      <DataTable columns={issueColumns} data={issues} emptyTitle="No production issues" emptyDescription="Report one from the button above when something needs escalation." pageSize={20} />
    </div>
  );
}
