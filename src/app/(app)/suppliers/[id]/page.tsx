import { notFound } from "next/navigation";
import { getSupplierById, getSupplierPurchaseOrders } from "@/lib/data";
import { PageHeader, MetricCard, DetailRow, PercentageDisplay, MoneyDisplay, StatusBadge, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await getSupplierById(id);
  if (!supplier) notFound();
  const purchaseOrders = await getSupplierPurchaseOrders(id);

  return (
    <div className="space-y-5">
      <PageHeader
        title={supplier.name}
        crumbs={[{ label: "Suppliers", href: "/suppliers" }, { label: supplier.name }]}
        description={supplier.location}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="On-Time %" value={<PercentageDisplay value={supplier.performance.onTimePercent} />} />
        <MetricCard label="Avg. Lead Time" value={`${supplier.performance.avgLeadTimeDays.toFixed(0)} days`} />
        <MetricCard label="QC Acceptance" value={<PercentageDisplay value={supplier.performance.qcAcceptancePercent} />} />
        <MetricCard label="Total Purchase Value" value={<MoneyDisplay amount={supplier.performance.totalPurchaseValue} compact />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Supplier Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow label="Contact" value={supplier.contactName} />
          <DetailRow label="Email" value={supplier.contactEmail} />
          <DetailRow label="Phone" value={supplier.contactPhone} />
          <DetailRow label="Lead Time" value={`${supplier.leadTimeDays} days`} />
          <DetailRow label="Payment Terms" value={supplier.paymentTerms} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Purchase Order History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.poNo}</TableCell>
                  <TableCell>
                    <DateDisplay value={po.eta} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyDisplay amount={po.totalValue} currency={po.currency} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={po.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
