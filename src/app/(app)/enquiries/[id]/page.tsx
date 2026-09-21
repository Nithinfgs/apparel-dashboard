import { notFound } from "next/navigation";
import Link from "next/link";
import { getEnquiryById } from "@/lib/data";
import { PageHeader, DetailRow, StatusBadge, MoneyDisplay, DateDisplay, ActivityTimeline } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enquiry = await getEnquiryById(id);
  if (!enquiry) notFound();

  const canConvert = enquiry.status === "confirmed" && !enquiry.convertedOrderId;

  return (
    <div className="space-y-5">
      <PageHeader
        title={enquiry.enquiryNo}
        crumbs={[{ label: "Enquiries", href: "/enquiries" }, { label: enquiry.enquiryNo }]}
        description={`${enquiry.buyerName} · ${enquiry.productSummary}`}
        actions={
          enquiry.convertedOrderId ? (
            <Button asChild>
              <Link href={`/orders/${enquiry.convertedOrderId}`}>
                View Order <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : canConvert ? (
            <Button disabled title="Server action to convert would run here">
              Convert to Order
            </Button>
          ) : (
            <StatusBadge status={enquiry.status} />
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Enquiry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Buyer" value={<Link href={`/buyers/${enquiry.buyerId}`} className="hover:underline">{enquiry.buyerName}</Link>} />
            <DetailRow label="Merchandiser" value={enquiry.merchandiserName} />
            <DetailRow label="Expected Quantity" value={enquiry.expectedQuantity.toLocaleString("en-IN")} />
            <DetailRow
              label="Target Price"
              value={enquiry.targetPrice !== undefined ? <MoneyDisplay amount={enquiry.targetPrice} currency={enquiry.currency} /> : "Pending costing"}
            />
            <DetailRow
              label="Estimated Value"
              value={
                enquiry.targetPrice !== undefined ? (
                  <MoneyDisplay amount={enquiry.expectedQuantity * enquiry.targetPrice} currency={enquiry.currency} />
                ) : (
                  "Pending costing"
                )
              }
            />
            <DetailRow label="Delivery Deadline" value={<DateDisplay value={enquiry.deliveryDeadline} />} />
            <DetailRow label="Status" value={<StatusBadge status={enquiry.status} />} />
            {enquiry.source && enquiry.source !== "internal" && (
              <DetailRow
                label="Source"
                value={<Badge variant="outline">{enquiry.source === "design_lab" ? "Design Lab" : "Website Quote"}</Badge>}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Communication Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline
              items={[
                { id: "1", actorName: enquiry.merchandiserName, action: "created this enquiry", createdAt: enquiry.createdAt },
                { id: "2", actorName: enquiry.merchandiserName, action: `moved status to ${enquiry.status.replace(/_/g, " ")}`, createdAt: enquiry.updatedAt },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {enquiry.designConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-muted-foreground" /> Design Lab Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 gap-y-1 md:grid-cols-2">
            <DetailRow label="Garment" value={enquiry.designConfig.garmentType} />
            <DetailRow
              label="Colour"
              value={
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-border"
                    style={{ backgroundColor: enquiry.designConfig.baseColourHex }}
                  />
                  {enquiry.designConfig.baseColourName} ({enquiry.designConfig.baseColourHex})
                </span>
              }
            />
            {enquiry.designConfig.sleeveStyle && (
              <DetailRow label="Style" value={enquiry.designConfig.sleeveStyle === "half_sleeve" ? "Half Sleeve" : "Full Sleeve"} />
            )}
            <DetailRow label="Front Artwork" value={enquiry.designConfig.frontArtworkName ?? "No design"} />
            {enquiry.designConfig.backArtworkName && <DetailRow label="Back Artwork" value={enquiry.designConfig.backArtworkName} />}
            {enquiry.designConfig.fabricPreference && <DetailRow label="Fabric Preference" value={enquiry.designConfig.fabricPreference} />}
            {enquiry.designConfig.gsmPreference && <DetailRow label="GSM Preference" value={enquiry.designConfig.gsmPreference} />}
            {enquiry.designConfig.printMethod && <DetailRow label="Print Method" value={enquiry.designConfig.printMethod} />}
            <DetailRow label="Custom Measurements" value={enquiry.designConfig.hasCustomMeasurements ? "Provided" : "Not provided"} />
            {enquiry.sizeBreakdown && (
              <div className="col-span-full">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Size Breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(enquiry.sizeBreakdown)
                    .filter(([, qty]) => qty > 0)
                    .map(([size, qty]) => (
                      <span key={size} className="rounded-md border border-border px-2 py-1 text-xs">
                        {size}: {qty}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
