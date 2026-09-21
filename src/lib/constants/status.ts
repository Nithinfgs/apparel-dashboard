/**
 * Single source of truth for semantic status meaning -> colour mapping.
 * Never hardcode a status colour anywhere else (AGENTS.md §2.10).
 */

export type SemanticTone = "success" | "info" | "neutral" | "warning" | "danger";

export const TONE_CLASSES: Record<SemanticTone, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  neutral: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800/60 dark:text-neutral-400 dark:border-neutral-700",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  danger: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
};

export const TONE_DOT_CLASSES: Record<SemanticTone, string> = {
  success: "bg-emerald-500",
  info: "bg-blue-500",
  neutral: "bg-neutral-400",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

/** Maps every status/stage/result value used across the app to a semantic tone. */
export const STATUS_TONE: Record<string, SemanticTone> = {
  // Risk
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",

  // Order stage
  costing: "neutral",
  sampling: "info",
  sourcing: "info",
  cutting: "info",
  stitching: "info",
  finishing: "info",
  quality: "info",
  packing: "info",
  dispatch: "info",
  completed: "success",

  // Enquiry
  new: "neutral",
  requirements_received: "info",
  quote_sent: "info",
  negotiation: "warning",
  confirmed: "success",
  lost: "danger",

  // Sample
  requested: "neutral",
  in_development: "info",
  sent: "info",
  buyer_review: "warning",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",

  // Material / PO
  required: "neutral",
  rfq: "neutral",
  ordered: "info",
  partial: "warning",
  received: "success",
  qc_hold: "danger",
  draft: "neutral",
  closed: "success",

  // QC
  pass: "success",
  conditional_pass: "warning",
  hold: "warning",
  fail: "danger",

  // Milestone
  pending: "neutral",
  in_progress: "info",
  done: "success",
  delayed: "danger",

  // Dispatch
  preparing: "neutral",
  ready: "info",
  dispatched: "info",
  in_transit: "info",
  delivered: "success",

  // Invoice / payment
  paid: "success",
  partially_paid: "warning",
  overdue: "danger",

  // Style approval
  pending_approval: "warning",

  // Generic
  active: "info",
  inactive: "neutral",
  sufficient: "success",
  shortage: "warning",

  // Production issues (reuses `pending`/`in_progress`/`approved`/`rejected`
  // above where the meaning is identical — see AGENTS.md §2.10)
  open: "danger",
  resolved: "success",

  // Order change requests (reuses `pending`/`approved`/`rejected` above for
  // ChangeRequestStatus; these two are ChangeImplementationStatus-only)
  implemented: "success",
  not_applicable: "neutral",
};

export function toneFor(status: string): SemanticTone {
  return STATUS_TONE[status] ?? "neutral";
}
