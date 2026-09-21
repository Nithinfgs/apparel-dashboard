import { notFound } from "next/navigation";
import { resolvePortalBuyerId } from "@/lib/auth/portal-context";
import { getBuyerOrderById, getBuyerLatestUpdate, listDocumentsForEntity, getChangeRequestsForOrder } from "@/lib/data";
import { PageHeader, OrderProgress, StatusBadge, DateDisplay, DocumentList } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_STAGE_LABELS, CHANGE_REQUEST_FIELD_LABELS } from "@/lib/constants";

export default async function PortalOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buyerId = await resolvePortalBuyerId();
  const order = await getBuyerOrderById(buyerId, id);
  if (!order) notFound();

  const [latestUpdate, documents, changeRequests] = await Promise.all([
    getBuyerLatestUpdate(order.id),
    listDocumentsForEntity("order", order.id),
    getChangeRequestsForOrder(order.id),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={order.orderNo}
        crumbs={[{ label: "Orders", href: "/portal/orders" }, { label: order.orderNo }]}
        description={`${order.styleName} · ${order.quantity.toLocaleString("en-IN")} pcs · ${order.colours.join(", ")}`}
        actions={<StatusBadge status={order.stage} label={ORDER_STAGE_LABELS[order.stage]} />}
      />

      <Card>
        <CardContent className="py-1">
          <OrderProgress stages={order.stageProgress} currentStage={order.stage} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-0.5 py-1">
            <p className="text-xs text-muted-foreground">Expected Dispatch</p>
            <p className="text-lg font-semibold">
              <DateDisplay value={order.expectedDispatchDate} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-0.5 py-1">
            <p className="text-xs text-muted-foreground">Latest Update</p>
            <p className="text-sm font-medium">
              {latestUpdate ? `${latestUpdate.producedQty.toLocaleString("en-IN")} pieces ${latestUpdate.stage.replace(/_/g, " ")} on ${new Date(latestUpdate.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "No updates yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-0.5 py-1">
            <p className="text-xs text-muted-foreground">Latest QC Result</p>
            <p className="text-sm font-medium">
              {order.qcSummary ? <StatusBadge status={order.qcSummary.result} /> : "Not yet inspected"}
            </p>
          </CardContent>
        </Card>
      </div>

      {changeRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Change Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {changeRequests.map((cr) => (
              <div key={cr.id} className="rounded-md border border-border p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{CHANGE_REQUEST_FIELD_LABELS[cr.field]}</span>
                  <StatusBadge status={cr.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="line-through">{cr.oldValue}</span> → <span className="font-medium text-foreground">{cr.newValue}</span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList items={documents} />
        </CardContent>
      </Card>
    </div>
  );
}
