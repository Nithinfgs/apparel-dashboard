import { notFound } from "next/navigation";
import Link from "next/link";
import { getSampleById } from "@/lib/data";
import { PageHeader, DetailRow, StatusBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSampleType } from "@/lib/utils/format";

export default async function SampleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = await getSampleById(id);
  if (!sample) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${formatSampleType(sample.sampleType)} Sample`}
        crumbs={[{ label: "Samples", href: "/samples" }, { label: `v${sample.versionNumber}` }]}
        description={sample.styleName}
        actions={<StatusBadge status={sample.status} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sample Details</CardTitle>
          </CardHeader>
          <CardContent>
            {sample.orderNo && (
              <DetailRow label="Order" value={<Link href={`/orders/${sample.orderId}`} className="hover:underline">{sample.orderNo}</Link>} />
            )}
            <DetailRow label="Version" value={sample.versionNumber} />
            <DetailRow label="Courier" value={sample.courier ?? "—"} />
            <DetailRow label="Sent Date" value={<DateDisplay value={sample.sentDate} />} />
            <DetailRow label="Buyer Response" value={<DateDisplay value={sample.buyerResponseDate} />} />
            <DetailRow label="Comments" value={sample.comments ?? "—"} />
          </CardContent>
        </Card>

        {sample.approval && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Buyer Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Decision" value={<StatusBadge status={sample.approval.decision} />} />
              <DetailRow label="Comments" value={sample.approval.comments ?? "—"} />
              <DetailRow label="Decided On" value={<DateDisplay value={sample.approval.decidedAt} />} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
