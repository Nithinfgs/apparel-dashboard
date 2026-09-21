import { cn } from "@/lib/utils";
import { toneFor, TONE_CLASSES } from "@/lib/constants";

export function humanizeStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const tone = toneFor(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      {label ?? humanizeStatus(status)}
    </span>
  );
}
