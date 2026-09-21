import Link from "next/link";
import { listPackingRecords } from "@/lib/data";
import { PageHeader, DateDisplay } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PackingPage() {
  const records = await listPackingRecords();
  const byOrder = new Map<string, typeof records>();
  records.forEach((r) => byOrder.set(r.orderId, [...(byOrder.get(r.orderId) ?? []), r]));

  return (
    <div className="space-y-5">
      <PageHeader title="Packing" description={`${records.length} carton records across ${byOrder.size} orders.`} />

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from(byOrder.entries()).map(([orderId, cartons]) => {
          const total = cartons.reduce((s, c) => s + c.quantity, 0);
          return (
            <Card key={orderId}>
              <CardHeader>
                <CardTitle className="text-sm">
                  <Link href={`/orders/${orderId}`} className="hover:underline">
                    {cartons[0].orderNo}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {cartons.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span>Carton {String(c.cartonNumber).padStart(3, "0")}</span>
                    <span className="text-muted-foreground">
                      {c.quantity} pcs · <DateDisplay value={c.packedDate} />
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-1.5 text-sm font-semibold">
                  <span>Total</span>
                  <span>{total} pcs</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
