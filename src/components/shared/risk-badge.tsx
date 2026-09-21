import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";
import { TONE_CLASSES, toneFor } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Every risk badge must be explainable — never a bare colour. Pass `reasons`
 * from `calculateOrderRisk()` and they show on hover. See BUSINESS_RULES.md §7.
 */
export function RiskBadge({ level, reasons, className }: { level: RiskLevel; reasons?: string[]; className?: string }) {
  const tone = toneFor(level);
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
    >
      {level}
    </span>
  );

  if (!reasons || reasons.length === 0) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <ul className="list-disc space-y-1 pl-3 text-xs">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
