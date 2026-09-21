import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductionIssueById } from "@/lib/data";
import { PageHeader, DetailRow, StatusBadge, RiskBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCTION_STAGE_LABELS, PRODUCTION_ISSUE_TYPE_LABELS } from "@/lib/constants";
import { ResolveForm } from "../resolve-form";

export default async function ProductionIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await getProductionIssueById(id);
  if (!issue) notFound();

  const isOpen = issue.status === "open" || issue.status === "in_progress";

  return (
    <div className="space-y-5">
      <PageHeader
        title={PRODUCTION_ISSUE_TYPE_LABELS[issue.issueType]}
        crumbs={[{ label: "Production Issues", href: "/production/issues" }, { label: issue.orderNo }]}
        description={`${issue.orderNo} · ${issue.factoryName} · ${PRODUCTION_STAGE_LABELS[issue.stage]}`}
        actions={
          <>
            <RiskBadge level={issue.severity} />
            <StatusBadge status={issue.status} />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Issue Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Order" value={<Link href={`/orders/${issue.orderId}`} className="hover:underline">{issue.orderNo}</Link>} />
            <DetailRow label="Factory" value={issue.factoryName} />
            <DetailRow label="Stage" value={PRODUCTION_STAGE_LABELS[issue.stage]} />
            <DetailRow label="Type" value={PRODUCTION_ISSUE_TYPE_LABELS[issue.issueType]} />
            <DetailRow label="Description" value={issue.description} />
            <DetailRow label="Owner" value={issue.ownerName} />
            <DetailRow label="Reported By" value={issue.reportedByName} />
            <DetailRow label="Reported" value={<DateDisplay value={issue.createdAt} />} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {issue.resolution ? (
              <p className="text-sm text-foreground">{issue.resolution}</p>
            ) : isOpen ? (
              <ResolveForm issueId={issue.id} />
            ) : (
              <p className="text-sm text-muted-foreground">No resolution recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
