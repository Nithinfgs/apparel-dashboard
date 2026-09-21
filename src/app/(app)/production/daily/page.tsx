import { listFactories, listProductionEntries, listActiveProductionOrders, getOrderNoMap } from "@/lib/data";
import { PageHeader } from "@/components/shared";
import { DailyProductionForm } from "./daily-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative } from "@/lib/utils/format";
import { PRODUCTION_STAGE_LABELS } from "@/lib/constants";

export default async function DailyProductionPage() {
  const [factories, recentEntries, activeOrders, orderNoMap] = await Promise.all([
    listFactories(),
    listProductionEntries().then((entries) => entries.slice(0, 8)),
    listActiveProductionOrders(),
    getOrderNoMap(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Daily Production Update" description="Log today's output — totals update automatically." />

      <Card>
        <CardContent className="py-4">
          <DailyProductionForm factories={factories.map((f) => ({ id: f.id, name: f.name }))} orders={activeOrders} />
        </CardContent>
      </Card>

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-sm">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentEntries.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm">
              <div>
                <p className="font-medium">{orderNoMap.get(e.orderId)}</p>
                <p className="text-xs text-muted-foreground">
                  {e.producedQty.toLocaleString("en-IN")} pcs · {PRODUCTION_STAGE_LABELS[e.stage]}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{formatRelative(e.date)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
