import { notFound } from "next/navigation";
import Link from "next/link";
import { getFactoryById, getFactoryOrders, getFactoryInspections } from "@/lib/data";
import { PageHeader, MetricCard, DetailRow, PercentageDisplay, StatusBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function FactoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const factory = await getFactoryById(id);
  if (!factory) notFound();
  const [orders, inspections] = await Promise.all([getFactoryOrders(id), getFactoryInspections(id)]);

  const activeOrders = orders.filter((o) => o.stage !== "completed");
  const onTimeOrders = orders.filter((o) => o.actualDispatchDate && o.actualDispatchDate <= o.expectedDispatchDate);
  const dispatchedOrders = orders.filter((o) => o.actualDispatchDate);
  const onTimePercent = dispatchedOrders.length > 0 ? (onTimeOrders.length / dispatchedOrders.length) * 100 : 100;
  const defectiveInspections = inspections.filter((i) => i.result !== "pass").length;
  const defectPercent = inspections.length > 0 ? (defectiveInspections / inspections.length) * 100 : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={factory.name}
        crumbs={[{ label: "Factories", href: "/factories" }, { label: factory.name }]}
        description={factory.location}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Daily Capacity" value={`${factory.dailyCapacityPieces.toLocaleString("en-IN")} pcs`} />
        <MetricCard label="Utilisation" value={<PercentageDisplay value={factory.utilisation.utilisationPercent} />} />
        <MetricCard label="On-Time %" value={<PercentageDisplay value={onTimePercent} />} />
        <MetricCard label="Defect Rate" value={<PercentageDisplay value={defectPercent} />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Capabilities</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {factory.capabilities.map((c) => (
            <Badge key={c} variant="secondary" className="capitalize">
              {c}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current &amp; Upcoming Orders ({activeOrders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Dispatch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    <Link href={`/orders/${o.id}`} className="hover:underline">
                      {o.orderNo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{o.quantity.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.stage} />
                  </TableCell>
                  <TableCell>
                    <DateDisplay value={o.expectedDispatchDate} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow label="Contact Name" value={factory.contactName} />
          <DetailRow label="Phone" value={factory.contactPhone} />
        </CardContent>
      </Card>
    </div>
  );
}
