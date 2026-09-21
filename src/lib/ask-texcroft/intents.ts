import "server-only";
import * as seed from "@/lib/seed";
import { calculateOrderRisk, calculateFactoryUtilisation, calculateOutstandingPayment } from "@/lib/calculations";
import type { AskAnswer } from "./shared";

export type { AskAnswer };

/**
 * Deterministic intent matching over the same data-access/calculation layer
 * every other screen uses — an answer here can never disagree with the
 * dashboard. See BUSINESS_RULES.md §14. The keyword matchers below are the
 * only piece that would be swapped for an LLM later; the underlying queries
 * would not change.
 */
export async function answerQuestion(question: string): Promise<AskAnswer> {
  const q = question.toLowerCase();

  if (q.includes("risk") || q.includes("at risk")) {
    const results = seed.orders
      .map((o) => {
        const factory = seed.factories.find((f) => f.id === o.factoryId);
        const risk = calculateOrderRisk(o, seed.productionEntries, seed.materials, seed.samples, seed.orderMilestones, factory, seed.productionAssignments, undefined, seed.productionIssues);
        return { o, risk };
      })
      .filter((r) => r.risk.level === "high" || r.risk.level === "critical")
      .sort((a, b) => (a.risk.level === b.risk.level ? 0 : a.risk.level === "critical" ? -1 : 1));

    return {
      summary: results.length > 0 ? `${results.length} order(s) are HIGH or CRITICAL risk right now.` : "No orders are currently at HIGH or CRITICAL risk.",
      rows: results.map((r) => ({ label: r.o.orderNo, detail: `${r.risk.level.toUpperCase()} — ${r.risk.reasons[0] ?? "See order for detail"}` })),
    };
  }

  if (q.includes("dispatch") && (q.includes("week") || q.includes("upcoming"))) {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 86400000);
    const results = seed.orders.filter((o) => {
      const d = new Date(o.expectedDispatchDate);
      return d >= today && d <= weekFromNow;
    });
    return {
      summary: results.length > 0 ? `${results.length} order(s) are dispatching within 7 days.` : "Nothing is scheduled to dispatch in the next 7 days.",
      rows: results.map((o) => ({ label: o.orderNo, detail: `Dispatch ${new Date(o.expectedDispatchDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` })),
    };
  }

  if (q.includes("workload") || q.includes("factory") || q.includes("capacity")) {
    const results = seed.factories
      .map((f) => ({ f, u: calculateFactoryUtilisation(f, seed.productionAssignments) }))
      .sort((a, b) => b.u.utilisationPercent - a.u.utilisationPercent);
    return {
      summary: `${results[0]?.f.name} has the highest workload at ${results[0]?.u.utilisationPercent.toFixed(0)}% of committed capacity.`,
      rows: results.map((r) => ({ label: r.f.name, detail: `${r.u.utilisationPercent.toFixed(0)}% committed (${r.u.committedPieces.toLocaleString("en-IN")} pcs)` })),
    };
  }

  if (q.includes("owe") || q.includes("receivable") || q.includes("outstanding")) {
    const byBuyer = new Map<string, number>();
    seed.invoices.forEach((inv) => {
      const outstanding = calculateOutstandingPayment(inv, seed.payments).outstandingAmount;
      if (outstanding > 0) byBuyer.set(inv.buyerId, (byBuyer.get(inv.buyerId) ?? 0) + outstanding);
    });
    const results = Array.from(byBuyer.entries())
      .map(([buyerId, amount]) => ({ buyer: seed.buyers.find((b) => b.id === buyerId), amount }))
      .filter((r) => r.buyer)
      .sort((a, b) => b.amount - a.amount);
    return {
      summary: results.length > 0 ? `${results[0].buyer!.companyName} owes the most, at ₹${results[0].amount.toLocaleString("en-IN")}.` : "No outstanding receivables.",
      rows: results.map((r) => ({ label: r.buyer!.companyName, detail: `₹${r.amount.toLocaleString("en-IN")} outstanding` })),
    };
  }

  if (q.includes("qc") || q.includes("quality") || q.includes("fail")) {
    const failures = seed.qualityInspections.filter((i) => i.result === "fail" || i.result === "hold");
    return {
      summary: failures.length > 0 ? `${failures.length} inspection(s) failed or are on hold.` : "No QC failures recorded.",
      rows: failures.map((i) => ({
        label: seed.orders.find((o) => o.id === i.orderId)?.orderNo ?? i.orderId,
        detail: `${i.inspectionType.replace(/_/g, " ")} — ${i.result.toUpperCase()} on ${new Date(i.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
      })),
    };
  }

  return {
    summary: "I can answer questions about order risk, upcoming dispatches, factory workload, outstanding receivables, and QC failures — try one of the suggestions below.",
    rows: [],
  };
}

