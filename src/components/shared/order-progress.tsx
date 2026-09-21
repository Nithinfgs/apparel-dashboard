import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STAGES, ORDER_STAGE_LABELS } from "@/lib/constants";
import type { OrderStage } from "@/types";

export interface OrderStageStatus {
  stage: OrderStage;
  percent: number; // 0-100; 100 = done, 0 = not started
}

/**
 * The order lifecycle bar shown at the top of Order 360 (brief §12/§57).
 * Renders every order stage with its computed percent — several stages can
 * show real concurrent progress (e.g. cutting 100%, stitching 72%).
 */
export function OrderProgress({ stages, currentStage }: { stages: OrderStageStatus[]; currentStage: OrderStage }) {
  const currentIdx = ORDER_STAGES.indexOf(currentStage);

  return (
    <div className="flex w-full items-stretch gap-1 overflow-x-auto pb-1">
      {ORDER_STAGES.map((stage, i) => {
        const s = stages.find((st) => st.stage === stage);
        const percent = s?.percent ?? (i < currentIdx ? 100 : 0);
        const isDone = percent >= 100;
        const isCurrent = stage === currentStage;

        return (
          <div key={stage} className="flex min-w-[92px] flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className={cn("truncate", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {ORDER_STAGE_LABELS[stage]}
              </span>
              {isDone ? (
                <Check className="h-3 w-3 shrink-0 text-emerald-600" />
              ) : percent > 0 ? (
                <span className="shrink-0 text-blue-600">{Math.round(percent)}%</span>
              ) : null}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", isDone ? "bg-emerald-500" : percent > 0 ? "bg-blue-500" : "bg-transparent")}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
