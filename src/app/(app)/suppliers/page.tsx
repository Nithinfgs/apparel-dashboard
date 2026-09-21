import Link from "next/link";
import { listSuppliers } from "@/lib/data";
import { PageHeader, PercentageDisplay, MoneyDisplay } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SuppliersPage() {
  const suppliers = await listSuppliers();

  return (
    <div className="space-y-5">
      <PageHeader title="Suppliers" description={`${suppliers.length} raw material and trim suppliers.`} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((s) => (
          <Link key={s.id} href={`/suppliers/${s.id}`}>
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardContent className="space-y-2.5 py-1">
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.location}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.materialCategories.map((c) => (
                    <Badge key={c} variant="secondary" className="text-[10px] capitalize">
                      {c}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <div>
                    <p className="text-muted-foreground">On-time</p>
                    <p className="font-semibold"><PercentageDisplay value={s.performance.onTimePercent} /></p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">QC accept</p>
                    <p className="font-semibold"><PercentageDisplay value={s.performance.qcAcceptancePercent} /></p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Value</p>
                    <p className="font-semibold"><MoneyDisplay amount={s.performance.totalPurchaseValue} compact /></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
