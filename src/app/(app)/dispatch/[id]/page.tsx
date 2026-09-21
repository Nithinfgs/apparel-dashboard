import { notFound } from "next/navigation";
import Link from "next/link";
import { getDispatchById } from "@/lib/data";
import { PageHeader, DetailRow, StatusBadge, DateDisplay, DocumentList } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DispatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dispatch = await getDispatchById(id);
  if (!dispatch) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title={dispatch.orderNo}
        crumbs={[{ label: "Dispatch", href: "/dispatch" }, { label: dispatch.orderNo }]}
        description={dispatch.buyerName}
        actions={<StatusBadge status={dispatch.status} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Shipment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Order" value={<Link href={`/orders/${dispatch.orderId}`} className="hover:underline">{dispatch.orderNo}</Link>} />
            <DetailRow label="Mode" value={<span className="uppercase">{dispatch.mode}</span>} />
            <DetailRow label="Forwarder" value={dispatch.forwarder} />
            <DetailRow label="AWB / BL Number" value={dispatch.awbOrBlNumber ?? "—"} />
            <DetailRow label="Tracking Reference" value={dispatch.trackingReference ?? "—"} />
            <DetailRow label="Destination" value={dispatch.destination} />
            <DetailRow label="Planned Date" value={<DateDisplay value={dispatch.plannedDate} />} />
            <DetailRow label="Actual Date" value={<DateDisplay value={dispatch.actualDate} />} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentList items={dispatch.documents} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
