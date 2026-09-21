import Link from "next/link";
import { resolvePortalFactoryId } from "@/lib/auth/portal-context";
import { getFactoryAssignedOrders, getFactoryTodayEntries, getFactoryUpcomingDeadlines } from "@/lib/data";
import { StatusBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCTION_STAGE_LABELS } from "@/lib/constants";

export default async function PartnerDashboardPage() {
  const factoryId = await resolvePortalFactoryId();
  const [orders, todayEntries, deadlines] = await Promise.all([
    getFactoryAssignedOrders(factoryId),
    getFactoryTodayEntries(factoryId),
    getFactoryUpcomingDeadlines(factoryId),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Today&apos;s Work</h1>
        <p className="text-sm text-muted-foreground">{orders.length} assigned orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Logged Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayEntries.length === 0 && <p className="text-sm text-muted-foreground">No entries logged today yet.</p>}
          {todayEntries.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm">
              <span className="font-medium">{e.orderNo}</span>
              <span className="text-muted-foreground">
                {e.producedQty} pcs · {PRODUCTION_STAGE_LABELS[e.stage]}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {deadlines.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm">
              <span className="font-medium">{d.orderNo}</span>
              <span className="text-muted-foreground">
                <DateDisplay value={d.expectedDispatchDate} />
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assigned Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {orders.map((o) => (
            <Link key={o.id} href="/partner/production" className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm hover:bg-accent/40">
              <div>
                <p className="font-medium">{o.orderNo}</p>
                <p className="text-xs text-muted-foreground">
                  {o.styleName} · {o.quantity.toLocaleString("en-IN")} pcs
                </p>
              </div>
              <StatusBadge status={o.stage} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
