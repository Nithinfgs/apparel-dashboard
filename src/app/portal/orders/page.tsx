import Link from "next/link";
import { resolvePortalBuyerId } from "@/lib/auth/portal-context";
import { getBuyerOrders } from "@/lib/data";
import { PageHeader, StatusBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { ORDER_STAGE_LABELS } from "@/lib/constants";

export default async function PortalOrdersPage() {
  const buyerId = await resolvePortalBuyerId();
  const orders = await getBuyerOrders(buyerId);

  return (
    <div className="space-y-5">
      <PageHeader title="Orders" description={`${orders.length} orders with Texcroft.`} />
      <div className="space-y-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/portal/orders/${o.id}`}>
            <Card className="transition-colors hover:bg-accent/40">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-1">
                <div>
                  <p className="text-sm font-semibold">{o.orderNo}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.styleName} · {o.quantity.toLocaleString("en-IN")} pcs · {o.colours.join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={o.stage} label={ORDER_STAGE_LABELS[o.stage]} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dispatch <DateDisplay value={o.expectedDispatchDate} />
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
