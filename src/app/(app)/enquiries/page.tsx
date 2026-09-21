import Link from "next/link";
import { listEnquiries } from "@/lib/data";
import { PageHeader, StatusBadge, MoneyDisplay, DateDisplay } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const PIPELINE_ORDER = ["new", "requirements_received", "costing", "quote_sent", "negotiation", "confirmed", "lost"] as const;
const PIPELINE_LABELS: Record<string, string> = {
  new: "New",
  requirements_received: "Requirements Received",
  costing: "Costing",
  quote_sent: "Quote Sent",
  negotiation: "Negotiation",
  confirmed: "Confirmed",
  lost: "Lost",
};

export default async function EnquiriesPage() {
  const enquiries = await listEnquiries();

  return (
    <div className="space-y-5">
      <PageHeader title="Enquiries" description={`${enquiries.length} buyer enquiries in the pipeline.`} />

      <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-3 lg:grid-cols-7">
        {PIPELINE_ORDER.map((status) => {
          const items = enquiries.filter((e) => e.status === status);
          return (
            <div key={status} className="min-w-[180px] space-y-2">
              <p className="flex items-center justify-between text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {PIPELINE_LABELS[status]} <span className="rounded-full bg-muted px-1.5 text-[10px]">{items.length}</span>
              </p>
              <div className="space-y-2">
                {items.map((e) => (
                  <Link key={e.id} href={`/enquiries/${e.id}`}>
                    <Card className="transition-colors hover:bg-accent/40">
                      <CardContent className="space-y-1 py-1">
                        <p className="text-xs font-semibold">{e.enquiryNo}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.buyerName}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.productSummary}</p>
                        <p className="text-xs font-medium">
                          {e.targetPrice !== undefined ? (
                            <MoneyDisplay amount={e.expectedQuantity * e.targetPrice} currency={e.currency} compact />
                          ) : (
                            <span className="text-muted-foreground">Pending costing</span>
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {enquiries.map((e) => (
            <Link key={e.id} href={`/enquiries/${e.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/40">
              <div className="flex min-w-0 items-center gap-3">
                <span className="font-medium">{e.enquiryNo}</span>
                <span className="truncate text-muted-foreground">
                  {e.buyerName} · {e.productSummary}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <DateDisplay value={e.deliveryDeadline} className="text-xs text-muted-foreground" />
                <StatusBadge status={e.status} />
                {e.convertedOrderId && (
                  <Link href={`/orders/${e.convertedOrderId}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Order <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
