import Link from "next/link";
import { listFactories } from "@/lib/data";
import { PageHeader, PercentageDisplay } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function FactoriesPage() {
  const factories = await listFactories();

  return (
    <div className="space-y-5">
      <PageHeader title="Factories" description={`${factories.length} manufacturing units.`} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {factories.map((f) => (
          <Link key={f.id} href={`/factories/${f.id}`}>
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardContent className="space-y-2.5 py-1">
                <div>
                  <p className="font-semibold text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.location}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {f.capabilities.map((c) => (
                    <Badge key={c} variant="secondary" className="text-[10px] capitalize">
                      {c}
                    </Badge>
                  ))}
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Load ({f.activeOrderCount} active orders)</span>
                    <PercentageDisplay value={f.utilisation.utilisationPercent} />
                  </div>
                  <Progress value={Math.min(100, f.utilisation.utilisationPercent)} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
