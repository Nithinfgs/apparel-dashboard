import "server-only";
import * as seed from "@/lib/seed";
import type { RiskLevel } from "@/types";
import { calculateMaterialAvailability, calculateFactoryUtilisation } from "@/lib/calculations";
import { listOrders, getUpcomingDispatches } from "./orders";
import { listSamples } from "./samples";
import { listInspections } from "./quality";
import { listInvoices } from "./finance";
import { listProductionIssues } from "./issues";

export type ExceptionCategory =
  | "production_delay"
  | "material_delay"
  | "buyer_approval"
  | "qc_failure"
  | "dispatch_approaching"
  | "invoice_overdue"
  | "factory_overload"
  | "production_issue";

export interface ExceptionItem {
  id: string;
  category: ExceptionCategory;
  issue: string;
  severity: RiskLevel;
  owner: string;
  dueDate?: string;
  status: string;
  nextAction: string;
  href: string;
}

const CATEGORY_LABELS: Record<ExceptionCategory, string> = {
  production_delay: "Delayed Production",
  material_delay: "Material Delay",
  buyer_approval: "Pending Buyer Approval",
  qc_failure: "QC Failure",
  dispatch_approaching: "Approaching Dispatch",
  invoice_overdue: "Overdue Invoice",
  factory_overload: "Factory Overload",
  production_issue: "Unresolved Production Issue",
};

/**
 * The Action / Exception Center is a read model over data every other page
 * already computes — it reuses `listOrders` (and the risk engine underneath
 * it), `listSamples`, `listInspections`, `listInvoices`, `calculateMaterialAvailability`,
 * `calculateFactoryUtilisation`, and `listProductionIssues`. It contains no
 * new business logic of its own beyond grouping and labelling. See
 * BUSINESS_RULES.md §18.
 */
export async function getActionCenterItems(): Promise<ExceptionItem[]> {
  const items: ExceptionItem[] = [];
  const behindScheduleRe = /(.+) is \d+% behind planned completion\./;

  // 1. Delayed production — reuses the risk engine's own "behind plan" reason text.
  const { items: allOrders } = await listOrders({ pageSize: 200 });
  for (const order of allOrders) {
    const reason = order.risk.reasons.find((r) => behindScheduleRe.test(r));
    if (reason) {
      items.push({
        id: `production_delay-${order.id}`,
        category: "production_delay",
        issue: `${order.orderNo}: ${reason}`,
        severity: order.risk.level,
        owner: order.ownerId,
        dueDate: order.expectedDispatchDate,
        status: order.stage,
        nextAction: "Review production plan with the factory and recover lost days.",
        href: `/orders/${order.id}`,
      });
    }
  }

  // 2. Material delays — reuses calculateMaterialAvailability.
  for (const material of seed.materials) {
    const availability = calculateMaterialAvailability(material);
    if (availability.status === "shortage" || availability.status === "overdue") {
      const order = seed.orders.find((o) => o.id === material.orderId);
      items.push({
        id: `material_delay-${material.id}`,
        category: "material_delay",
        issue: `${material.description}${order ? ` (${order.orderNo})` : ""} — ${availability.status === "overdue" ? "delivery overdue" : `short by ${availability.shortage.toLocaleString("en-IN")} ${material.unit}`}`,
        severity: availability.status === "overdue" ? "high" : "medium",
        owner: "user-src",
        dueDate: material.expectedArrival,
        status: material.status,
        nextAction: "Follow up with the supplier and confirm a revised delivery date.",
        href: order ? `/orders/${order.id}` : "/materials",
      });
    }
  }

  // 3. Pending buyer approvals — reuses listSamples (the same source the
  // dashboard's "Pending Buyer Approvals" KPI and the sampling gate use).
  const samples = await listSamples();
  for (const sample of samples) {
    if (sample.sampleType === "pp" && (sample.status === "buyer_review" || sample.status === "sent")) {
      const order = seed.orders.find((o) => o.id === sample.orderId);
      items.push({
        id: `buyer_approval-${sample.id}`,
        category: "buyer_approval",
        issue: `PP Sample awaiting buyer approval${sample.orderNo ? ` — ${sample.orderNo}` : ""}`,
        severity: "medium",
        owner: order?.ownerId ?? "user-mrc-1",
        status: sample.status,
        nextAction: "Follow up with the buyer for sample sign-off.",
        href: `/samples/${sample.id}`,
      });
    }
  }

  // 4. QC failures — reuses listInspections.
  const inspections = await listInspections();
  for (const inspection of inspections) {
    if (inspection.result === "fail" || inspection.result === "hold") {
      items.push({
        id: `qc_failure-${inspection.id}`,
        category: "qc_failure",
        issue: `${inspection.orderNo}: ${inspection.inspectionType.replace(/_/g, " ")} — ${inspection.result.toUpperCase()}`,
        severity: inspection.result === "fail" ? "high" : "medium",
        owner: inspection.inspectorId,
        dueDate: inspection.date,
        status: inspection.result,
        nextAction: "Review defects and decide on rework, re-inspection, or rejection.",
        href: `/quality/inspections/${inspection.id}`,
      });
    }
  }

  // 5. Approaching dispatches with incomplete stages — reuses getUpcomingDispatches.
  const upcoming = await getUpcomingDispatches(30);
  const today = new Date();
  for (const order of upcoming) {
    const daysToDispatch = Math.round((new Date(order.expectedDispatchDate).getTime() - today.getTime()) / 86400000);
    if (daysToDispatch <= 5 && order.stage !== "packing" && order.stage !== "dispatch") {
      items.push({
        id: `dispatch_approaching-${order.id}`,
        category: "dispatch_approaching",
        issue: `${order.orderNo} dispatches in ${daysToDispatch} day(s) — still at ${order.stage}`,
        severity: order.risk.level,
        owner: order.ownerId,
        dueDate: order.expectedDispatchDate,
        status: order.stage,
        nextAction: "Confirm packing readiness and forwarder booking.",
        href: `/orders/${order.id}`,
      });
    }
  }

  // 6. Overdue invoices — reuses listInvoices (its `status` is already
  // derived by calculateOutstandingPayment, never re-derived here).
  const invoices = await listInvoices();
  for (const invoice of invoices) {
    if (invoice.status === "overdue") {
      items.push({
        id: `invoice_overdue-${invoice.id}`,
        category: "invoice_overdue",
        issue: `${invoice.invoiceNo} (${invoice.buyerName}) overdue`,
        severity: "high",
        owner: "user-fin",
        dueDate: invoice.dueDate,
        status: invoice.status,
        nextAction: "Contact the buyer's finance team for payment.",
        href: "/finance/invoices",
      });
    }
  }

  // 7. Factory overload — reuses calculateFactoryUtilisation.
  for (const factory of seed.factories) {
    const utilisation = calculateFactoryUtilisation(factory, seed.productionAssignments);
    if (utilisation.utilisationPercent > 100) {
      items.push({
        id: `factory_overload-${factory.id}`,
        category: "factory_overload",
        issue: `${factory.name} is over capacity (${utilisation.utilisationPercent.toFixed(0)}% committed)`,
        severity: "medium",
        owner: "user-prod",
        status: "overloaded",
        nextAction: "Reassign or expedite orders to balance factory load.",
        href: `/factories/${factory.id}`,
      });
    }
  }

  // 8. Unresolved production issues — reuses listProductionIssues.
  const issues = await listProductionIssues();
  for (const issue of issues) {
    if (issue.status === "open" || issue.status === "in_progress") {
      items.push({
        id: `production_issue-${issue.id}`,
        category: "production_issue",
        issue: `${issue.orderNo}: ${issue.description}`,
        severity: issue.severity,
        owner: issue.ownerId,
        dueDate: undefined,
        status: issue.status,
        nextAction: "Investigate and resolve, or escalate to management.",
        href: `/production/issues/${issue.id}`,
      });
    }
  }

  // `owner` is pushed above as a profile id in most branches — resolve to a
  // display name in one place rather than repeating the lookup at each push.
  const resolved = items.map((item) => ({
    ...item,
    owner: seed.profiles.find((p) => p.id === item.owner)?.fullName ?? item.owner,
  }));

  const severityRank: Record<RiskLevel, number> = { critical: 3, high: 2, medium: 1, low: 0 };
  return resolved.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}

export function categoryLabel(category: ExceptionCategory): string {
  return CATEGORY_LABELS[category];
}
