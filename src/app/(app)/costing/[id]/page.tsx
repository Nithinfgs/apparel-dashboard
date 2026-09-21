import { notFound } from "next/navigation";
import Link from "next/link";
import { getCostingById, getCostingVersionsForOrder } from "@/lib/data";
import { PageHeader, DetailRow, MoneyDisplay, PercentageDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compareCostingVersions } from "@/lib/calculations";

export default async function CostingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const costing = await getCostingById(id);
  if (!costing) notFound();

  const versions = costing.orderId ? await getCostingVersionsForOrder(costing.orderId) : [costing];
  const previous = versions.find((v) => v.versionNumber === costing.versionNumber - 1);
  const diff = previous ? compareCostingVersions(previous.breakdown, costing.breakdown) : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Costing — ${costing.styleName}`}
        crumbs={[{ label: "Costing", href: "/costing" }, { label: `v${costing.versionNumber}` }]}
        description={costing.orderNo ? <Link href={`/orders/${costing.orderId}`} className="hover:underline">{costing.orderNo}</Link> : "Enquiry-stage costing"}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Cost Breakdown — Version {costing.versionNumber}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Consumption</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Waste %</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costing.breakdown.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium capitalize">{item.category.replace(/_/g, " ")}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.consumption}</TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay amount={item.rate} currency={costing.currency} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{item.wastePercent}%</TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay amount={item.calculatedCost} currency={costing.currency} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Margin Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Material Cost" value={<MoneyDisplay amount={costing.breakdown.materialCost} currency={costing.currency} />} />
            <DetailRow label="Processing Cost" value={<MoneyDisplay amount={costing.breakdown.processingCost} currency={costing.currency} />} />
            <DetailRow label="Manufacturing Cost" value={<MoneyDisplay amount={costing.breakdown.manufacturingCost} currency={costing.currency} />} />
            <DetailRow label="Packaging Cost" value={<MoneyDisplay amount={costing.breakdown.packagingCost} currency={costing.currency} />} />
            <DetailRow label="Logistics Cost" value={<MoneyDisplay amount={costing.breakdown.logisticsCost} currency={costing.currency} />} />
            <DetailRow label="Overhead Cost" value={<MoneyDisplay amount={costing.breakdown.overheadCost} currency={costing.currency} />} />
            <DetailRow label="Total Cost / Piece" value={<MoneyDisplay amount={costing.breakdown.costPerPiece} currency={costing.currency} className="font-semibold" />} />
            <DetailRow label="Selling Price / Piece" value={<MoneyDisplay amount={costing.breakdown.sellingPricePerPiece} currency={costing.currency} />} />
            <DetailRow label="Profit / Piece" value={<MoneyDisplay amount={costing.breakdown.profitPerPiece} currency={costing.currency} />} />
            <DetailRow label="Margin %" value={<PercentageDisplay value={costing.breakdown.marginPercent} digits={1} />} />
            <DetailRow label="Total Order Profit" value={<MoneyDisplay amount={costing.breakdown.totalOrderProfit} currency={costing.currency} compact />} />
          </CardContent>
        </Card>
      </div>

      {diff && previous && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Version Comparison — v{previous.versionNumber} → v{costing.versionNumber}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-sm">
            <DetailRow label="Cost / Piece Δ" value={<MoneyDisplay amount={diff.costPerPieceDelta} currency={costing.currency} />} />
            <DetailRow label="Selling Price Δ" value={<MoneyDisplay amount={diff.sellingPriceDelta} currency={costing.currency} />} />
            <DetailRow label="Margin % Δ" value={<PercentageDisplay value={diff.marginPercentDelta} digits={1} />} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
