import { formatMoney, formatMoneyCompact, formatPercent, formatDate, formatNumber } from "@/lib/utils/format";
import type { Currency } from "@/types";
import { cn } from "@/lib/utils";

export function MoneyDisplay({ amount, currency = "INR", compact = false, className }: { amount: number; currency?: Currency; compact?: boolean; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{compact ? formatMoneyCompact(amount, currency) : formatMoney(amount, currency)}</span>;
}

export function PercentageDisplay({ value, digits = 0, className }: { value: number; digits?: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatPercent(value, digits)}</span>;
}

export function DateDisplay({ value, pattern, className }: { value?: string; pattern?: string; className?: string }) {
  if (!value) return <span className={cn("text-muted-foreground", className)}>—</span>;
  return <span className={cn("tabular-nums", className)}>{formatDate(value, pattern)}</span>;
}

export function NumberDisplay({ value, className }: { value: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatNumber(value)}</span>;
}
