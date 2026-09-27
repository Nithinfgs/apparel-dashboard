import Link from "next/link";
import { resolvePortalBuyerId } from "@/lib/auth/portal-context";
import { getBuyerOrders, getBuyerApprovals } from "@/lib/data";
import { PageHeader, MetricCard, StatusBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_STAGE_LABELS } from "@/lib/constants";
import { formatSampleType } from "@/lib/utils/format";

export default async function PortalDashboardPage() {
  const buyerId = await resolvePortalBuyerId();
  const [orders, approvals] = await Promise.all([getBuyerOrders(buyerId), getBuyerApprovals(buyerId)]);

  const active = orders.filter((o) => o.stage !== "completed");
  const upcoming = [...active].sort((a, b) => a.expectedDispatchDate.localeCompare(b.expectedDispatchDate)).slice(0, 4);
  const recentlyCompleted = orders.filter((o) => o.stage === "completed").slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader title="Your Orders" description="A live view of every order currently in production for you." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Active Orders" value={active.length} />
        <MetricCard label="Upcoming Dispatches" value={upcoming.length} />
        <MetricCard label="Approvals Required" value={approvals.length} deltaTone={approvals.length > 0 ? "warning" : "neutral"} />
        <MetricCard label="Recently Completed" value={recentlyCompleted.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upcoming Dispatches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.map((o) => (
            <Link
              key={o.id}
              href={`/portal/orders/${o.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50"
            >
              <div>
                <p className="text-sm font-semibold">{o.orderNo}</p>
                <p className="text-xs text-muted-foreground">
                  {o.styleName} · {o.quantity.toLocaleString("en-IN")} pcs
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={o.stage} label={ORDER_STAGE_LABELS[o.stage]} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Dispatch <DateDisplay value={o.expectedDispatchDate} />
                </p>
              </div>
            </Link>
          ))}
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming dispatches right now.</p>}
        </CardContent>
      </Card>

      {approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Approvals Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvals.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                <div>
                  <p className="text-sm font-medium">{formatSampleType(a.sampleType)} Sample — {a.orderNo}</p>
                  <p className="text-xs text-muted-foreground">{a.comments}</p>
                </div>
                <Link href="/portal/approvals" className="text-xs font-medium text-primary hover:underline">
                  Review
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
