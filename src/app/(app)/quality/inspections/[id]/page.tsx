import { notFound } from "next/navigation";
import Link from "next/link";
import { getInspectionById } from "@/lib/data";
import { PageHeader, DetailRow, StatusBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inspection = await getInspectionById(id);
  if (!inspection) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${inspection.inspectionType.replace(/_/g, " ")} — ${inspection.orderNo}`.replace(/^\w/, (c) => c.toUpperCase())}
        crumbs={[{ label: "Inspections", href: "/quality/inspections" }, { label: inspection.orderNo }]}
        actions={<StatusBadge status={inspection.result} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inspection Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Order" value={<Link href={`/orders/${inspection.orderId}`} className="hover:underline">{inspection.orderNo}</Link>} />
            <DetailRow label="Factory" value={inspection.factoryName} />
            <DetailRow label="Date" value={<DateDisplay value={inspection.date} />} />
            <DetailRow label="Quantity Inspected" value={inspection.quantityInspected.toLocaleString("en-IN")} />
            <DetailRow label="Minor Defects" value={inspection.minorDefects} />
            <DetailRow label="Major Defects" value={inspection.majorDefects} />
            <DetailRow label="Critical Defects" value={inspection.criticalDefects} />
            <DetailRow label="Result" value={<StatusBadge status={inspection.result} />} />
          </CardContent>
        </Card>

        {inspection.defects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Defects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inspection.defects.map((d) => (
                <div key={d.id} className="rounded-md border border-border p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{d.category}</span>
                    <StatusBadge status={d.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground">{d.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
