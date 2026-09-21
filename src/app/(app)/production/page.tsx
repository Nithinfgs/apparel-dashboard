import Link from "next/link";
import { listProductionBoard, listProductionBoardByStage } from "@/lib/data";
import { PageHeader, StatusBadge, RiskBadge, PercentageDisplay, DateDisplay } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { PRODUCTION_STAGE_LABELS } from "@/lib/constants";

export default async function ProductionPage() {
  const [board, columns] = await Promise.all([listProductionBoard(), listProductionBoardByStage()]);

  return (
    <div className="space-y-5">
      <PageHeader title="Production Control Center" description={`${board.length} orders currently in production.`} />

      <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {columns.map(({ stage, items }) => (
          <div key={stage} className="min-w-[200px] space-y-2">
            <p className="flex items-center justify-between text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {PRODUCTION_STAGE_LABELS[stage]} <span className="rounded-full bg-muted px-1.5 text-[10px]">{items.length}</span>
            </p>
            <div className="space-y-2">
              {items.map(({ order, buyerName, factoryName, risk }) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="transition-colors hover:bg-accent/40">
                    <CardContent className="space-y-1 py-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">{order.orderNo}</p>
                        <RiskBadge level={risk.level} reasons={risk.reasons} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{buyerName}</p>
                      <p className="truncate text-xs text-muted-foreground">{factoryName}</p>
                      <p className="text-xs text-muted-foreground">
                        Dispatch <DateDisplay value={order.expectedDispatchDate} />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {board.map(({ order, buyerName, styleName, factoryName, currentPercent }) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/40">
              <div className="min-w-0">
                <span className="font-medium">{order.orderNo}</span>{" "}
                <span className="text-muted-foreground">
                  {buyerName} · {styleName} · {factoryName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.stage} />
                <PercentageDisplay value={currentPercent} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
