import { notFound } from "next/navigation";
import { getPurchaseOrderById } from "@/lib/data";
import { PageHeader, DetailRow, StatusBadge, MoneyDisplay, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await getPurchaseOrderById(id);
  if (!po) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title={po.poNo}
        crumbs={[{ label: "Purchase Orders", href: "/purchase-orders" }, { label: po.poNo }]}
        description={po.supplierName}
        actions={<StatusBadge status={po.status} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">PO Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Supplier" value={po.supplierName} />
            <DetailRow label="Order Date" value={<DateDisplay value={po.orderDate} />} />
            <DetailRow label="ETA" value={<DateDisplay value={po.eta} />} />
            <DetailRow label="Total Value" value={<MoneyDisplay amount={po.totalValue} currency={po.currency} />} />
            <DetailRow label="Payment Status" value={<StatusBadge status={po.paymentStatus} />} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-right tabular-nums">{item.quantity.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay amount={item.rate} currency={po.currency} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{item.receivedQuantity.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {po.receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receipts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {po.receipts.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm">
                <span>{r.receivedQty.toLocaleString("en-IN")} units received</span>
                <DateDisplay value={r.receivedDate} className="text-xs text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
