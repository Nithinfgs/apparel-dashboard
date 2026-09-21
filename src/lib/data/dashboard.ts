import "server-only";
import * as seed from "@/lib/seed";
import { calculateOrderRisk } from "@/lib/calculations";
import { getAtRiskOrders, getUpcomingDispatches } from "./orders";
import { ORDER_STAGES } from "@/lib/constants";
import { getFinanceSummary } from "./finance";
import { getBuyerRevenueDistribution } from "./buyers";

function riskOf(order: (typeof seed.orders)[number]) {
  const factory = seed.factories.find((f) => f.id === order.factoryId);
  return calculateOrderRisk(
    order,
    seed.productionEntries,
    seed.materials,
    seed.samples,
    seed.orderMilestones,
    factory,
    seed.productionAssignments,
    undefined,
    seed.productionIssues
  );
}

export async function getDashboardKpis() {
  const activeOrders = seed.orders.filter((o) => o.stage !== "completed");
  const risks = seed.orders.map((o) => ({ order: o, risk: riskOf(o) }));
  const atRisk = risks.filter((r) => r.risk.level === "medium").length;
  const delayed = risks.filter((r) => r.risk.level === "high" || r.risk.level === "critical").length;

  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 86400000);
  const dispatchesThisWeek = seed.dispatches.filter((d) => {
    const planned = new Date(d.plannedDate);
    return planned >= today && planned <= weekFromNow;
  }).length;

  const productionValue = seed.orders.reduce((sum, o) => sum + o.quantity * o.pricePerPiece, 0);
  const pendingApprovals = seed.samples.filter((s) => s.status === "buyer_review" || s.status === "sent").length;
  const qcFailures = seed.qualityInspections.filter((q) => q.result === "fail").length;
  const financeSummary = await getFinanceSummary();

  return {
    activeOrders: activeOrders.length,
    atRisk,
    delayed,
    dispatchesThisWeek,
    productionValue,
    pendingApprovals,
    qcFailures,
    receivables: financeSummary.outstanding,
  };
}

export async function getPipelineSummary() {
  return ORDER_STAGES.map((stage) => {
    const ordersInStage = seed.orders.filter((o) => o.stage === stage);
    return {
      stage,
      count: ordersInStage.length,
      value: ordersInStage.reduce((s, o) => s + o.quantity * o.pricePerPiece, 0),
    };
  });
}

export async function getOrdersRequiringAttention(limit = 5) {
  return getAtRiskOrders(limit);
}

export async function getDashboardUpcomingDispatches(limit = 6) {
  return getUpcomingDispatches(limit);
}

const CHART_WINDOW_START = new Date("2026-08-01");
const WEEK_MS = 7 * 86400000;

/**
 * Planned vs actual, aggregated per week for the last 8 weeks across all
 * orders. `actual` sums real production_entries (event-sourced, per
 * BUSINESS_RULES.md §4). `planned` is derived from each order's own
 * timeline — quantity spread evenly across its createdAt→expectedDispatchDate
 * window — rather than a synthetic constant, so the two lines are answering
 * the same question ("how much should have happened this week") from real
 * order data, not an arbitrary target.
 */
export async function getProductionChartData() {
  const weeks = Array.from({ length: 8 }, (_, i) => i);
  return weeks.map((w) => {
    const weekLabel = `Wk ${w + 1}`;
    const weekStart = new Date(CHART_WINDOW_START.getTime() + w * WEEK_MS);
    const weekEnd = new Date(weekStart.getTime() + WEEK_MS);

    const planned = seed.orders.reduce((sum, o) => {
      const orderStart = new Date(o.createdAt);
      const orderEnd = new Date(o.expectedDispatchDate);
      const totalSpanDays = Math.max(1, (orderEnd.getTime() - orderStart.getTime()) / 86400000);
      const overlapStart = Math.max(weekStart.getTime(), orderStart.getTime());
      const overlapEnd = Math.min(weekEnd.getTime(), orderEnd.getTime());
      const overlapDays = Math.max(0, (overlapEnd - overlapStart) / 86400000);
      return sum + (o.quantity / totalSpanDays) * overlapDays;
    }, 0);

    const actual = seed.productionEntries
      .filter((e) => {
        const entryWeek = Math.floor((new Date(e.date).getTime() - CHART_WINDOW_START.getTime()) / WEEK_MS);
        return entryWeek === w;
      })
      .reduce((s, e) => s + e.producedQty, 0);

    return { week: weekLabel, planned: Math.round(planned), actual };
  });
}

export async function getBuyerRevenueChart() {
  return getBuyerRevenueDistribution();
}
