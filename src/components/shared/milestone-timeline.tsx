import { Check, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MILESTONE_LABELS } from "@/lib/constants";
import { calculateMilestoneVariance } from "@/lib/calculations";
import { formatVarianceDays } from "@/lib/utils/format";
import type { OrderMilestone } from "@/types";
import { DateDisplay } from "./displays";

export function MilestoneTimeline({ milestones }: { milestones: OrderMilestone[] }) {
  return (
    <ol className="space-y-0">
      {milestones.map((m) => {
        const variance = calculateMilestoneVariance(m);
        const Icon = variance.status === "done" ? Check : variance.status === "delayed" ? AlertCircle : Clock;
        const iconTone =
          variance.status === "done"
            ? "bg-emerald-100 text-emerald-700"
            : variance.status === "delayed"
            ? "bg-red-100 text-red-700"
            : variance.status === "in_progress"
            ? "bg-blue-100 text-blue-700"
            : "bg-neutral-100 text-neutral-500";

        return (
          <li key={m.id} className="flex gap-3 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", iconTone)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="mt-1 w-px flex-1 bg-border last:hidden" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium text-foreground">{MILESTONE_LABELS[m.milestoneKey]}</p>
                <p className="text-xs text-muted-foreground">
                  Planned <DateDisplay value={m.plannedDate} />
                  {m.actualDate && (
                    <>
                      {" · Actual "}
                      <DateDisplay value={m.actualDate} />
                    </>
                  )}
                </p>
              </div>
              {variance.status === "delayed" && (
                <p className="text-xs font-medium text-red-600">{formatVarianceDays(variance.varianceDays)} late</p>
              )}
              {variance.status === "done" && variance.varianceDays !== 0 && (
                <p className="text-xs text-muted-foreground">{formatVarianceDays(variance.varianceDays)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
