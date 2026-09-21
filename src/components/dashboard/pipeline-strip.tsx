import { ORDER_STAGE_LABELS } from "@/lib/constants";
import { MoneyDisplay } from "@/components/shared";
import type { OrderStage } from "@/types";

export function PipelineStrip({ data }: { data: { stage: OrderStage; count: number; value: number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
      {data.map((d) => (
        <div key={d.stage} className="rounded-lg border border-border bg-card px-3 py-2.5">
          <p className="truncate text-[11px] font-medium text-muted-foreground">{ORDER_STAGE_LABELS[d.stage]}</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{d.count}</p>
          <p className="text-[11px] text-muted-foreground">
            <MoneyDisplay amount={d.value} compact />
          </p>
        </div>
      ))}
    </div>
  );
}
