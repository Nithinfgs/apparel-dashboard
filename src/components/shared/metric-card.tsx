import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SemanticTone } from "@/lib/constants";

const DELTA_CLASSES: Record<SemanticTone, string> = {
  success: "text-emerald-600",
  danger: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
  neutral: "text-muted-foreground",
};

export function MetricCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  sublabel,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  deltaTone?: SemanticTone;
  sublabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-none", className)}>
      <CardContent className="space-y-1.5 py-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        {(delta || sublabel) && (
          <p className="text-xs text-muted-foreground">
            {delta && <span className={cn("font-medium", DELTA_CLASSES[deltaTone])}>{delta}</span>}
            {delta && sublabel && " · "}
            {sublabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
