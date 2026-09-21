import { resolvePortalFactoryId } from "@/lib/auth/portal-context";
import { getFactoryAssignedOrders, getFactoryInspections, getFactoryById, getIssuesForFactory } from "@/lib/data";
import { StatusBadge, RiskBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IssueForm } from "@/app/(app)/production/issues/issue-form";
import { INTERNAL_STAFF_PROFILES } from "@/lib/auth/session";
import { PRODUCTION_ISSUE_TYPE_LABELS, PRODUCTION_STAGE_LABELS } from "@/lib/constants";

export default async function PartnerIssuesPage() {
  const factoryId = await resolvePortalFactoryId();
  const [orders, inspections, factory, issues] = await Promise.all([
    getFactoryAssignedOrders(factoryId),
    getFactoryInspections(factoryId),
    getFactoryById(factoryId),
    getIssuesForFactory(factoryId),
  ]);
  const qcHolds = inspections.filter((i) => i.result === "fail" || i.result === "hold");
  const openIssues = issues.filter((i) => i.status === "open" || i.status === "in_progress");
  const owners = INTERNAL_STAFF_PROFILES.map((p) => ({ id: p.id, fullName: p.fullName }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Issues</h1>
          <p className="text-sm text-muted-foreground">{openIssues.length} open production issue(s) on your orders</p>
        </div>
        {factory && (
          <IssueForm
            orders={orders.map((o) => ({ id: o.id, orderNo: o.orderNo, factoryId }))}
            factories={[{ id: factory.id, name: factory.name }]}
            owners={owners}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Open Production Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {openIssues.length === 0 && <p className="text-sm text-muted-foreground">No open issues right now.</p>}
          {openIssues.map((issue) => (
            <div key={issue.id} className="rounded-md border border-border p-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{issue.orderNo}</span>
                <div className="flex items-center gap-1.5">
                  <RiskBadge level={issue.severity} />
                  <StatusBadge status={issue.status} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {PRODUCTION_ISSUE_TYPE_LABELS[issue.issueType]} · {PRODUCTION_STAGE_LABELS[issue.stage]}
              </p>
              <p className="mt-1 text-xs text-foreground">{issue.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reported <DateDisplay value={issue.createdAt} />
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">QC Holds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {qcHolds.length === 0 && <p className="text-sm text-muted-foreground">No QC holds right now.</p>}
          {qcHolds.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm">
              <span className="font-medium">{i.orderNo}</span>
              <StatusBadge status={i.result} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
