import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { Currency } from "@/types";

/** Formats a number as currency using Indian lakh grouping for INR, standard grouping otherwise. */
export function formatMoney(amount: number, currency: Currency = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compact form for KPI tiles, e.g. ₹48.6L / $1.2M */
export function formatMoneyCompact(amount: number, currency: Currency = "INR"): string {
  const symbol = currency === "INR" ? "₹" : new Intl.NumberFormat("en-US", { style: "currency", currency }).formatToParts(0).find(p => p.type === "currency")?.value ?? "";
  if (currency === "INR") {
    if (amount >= 1_00_00_000) return `${symbol}${(amount / 1_00_00_000).toFixed(2)}Cr`;
    if (amount >= 1_00_000) return `${symbol}${(amount / 1_00_000).toFixed(1)}L`;
    if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
    return `${symbol}${amount.toFixed(0)}`;
  }
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount.toFixed(0)}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatDate(value: string | Date, pattern = "d MMM yyyy"): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern);
}

export function formatRelative(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true });
}

const SAMPLE_TYPE_LABELS: Record<string, string> = {
  development: "Development",
  proto: "Proto",
  fit: "Fit",
  lab_dip: "Lab Dip",
  size_set: "Size Set",
  pp: "PP",
};

/** "pp" -> "PP" (an abbreviation, not a normal word — CSS `capitalize` would render "Pp"). */
export function formatSampleType(sampleType: string): string {
  return SAMPLE_TYPE_LABELS[sampleType] ?? sampleType;
}

/**
 * Resolves a notification's click-through destination by entity type.
 * Single implementation shared by the notification bell popover and the
 * full `/notifications` page — see AGENTS.md §2.2 (no duplicate concepts).
 */
export function notificationHref(entityType: string, entityId: string): string {
  switch (entityType) {
    case "order":
      return `/orders/${entityId}`;
    case "quality_inspection":
      return `/quality/inspections/${entityId}`;
    case "sample":
      return `/samples/${entityId}`;
    case "dispatch":
      return `/dispatch/${entityId}`;
    case "invoice":
      return "/finance/invoices";
    default:
      return "#";
  }
}

export function formatVarianceDays(days: number): string {
  if (days === 0) return "On time";
  return days > 0 ? `+${days} days` : `${days} days`;
}
