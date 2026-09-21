import { resolvePortalBuyerId } from "@/lib/auth/portal-context";
import { getBuyerApprovals } from "@/lib/data";
import { PageHeader, StatusBadge, EmptyState } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageSquareWarning } from "lucide-react";
import { formatSampleType } from "@/lib/utils/format";

export default async function PortalApprovalsPage() {
  const buyerId = await resolvePortalBuyerId();
  const approvals = await getBuyerApprovals(buyerId);

  return (
    <div className="space-y-5">
      <PageHeader title="Approvals" description="Samples and documents waiting on your sign-off." />

      {approvals.length === 0 && <EmptyState title="Nothing pending" description="You're all caught up — no approvals are waiting on you." />}

      <div className="space-y-3">
        {approvals.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-1">
              <div>
                <p className="text-sm font-semibold">
                  {formatSampleType(a.sampleType)} Sample — {a.orderNo}
                </p>
                <p className="text-xs text-muted-foreground">{a.comments}</p>
                <StatusBadge status={a.status} className="mt-1.5" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">
                  <MessageSquareWarning className="h-3.5 w-3.5" /> Request Change
                </Button>
                <Button size="sm">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
