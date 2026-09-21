import "server-only";
import * as seed from "@/lib/seed";
import { calculateSupplierPerformance, calculateFactoryUtilisation, calculateOutstandingPayment, calculateOrderRisk, calculateCosting } from "@/lib/calculations";

export async function getRevenueOverTime() {
  const byMonth = new Map<string, number>();
  seed.orders.forEach((o) => {
    const month = o.createdAt.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + o.quantity * o.pricePerPiece);
  });
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

export async function getOrdersOverTime() {
  const byMonth = new Map<string, number>();
  seed.orders.forEach((o) => {
    const month = o.createdAt.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  });
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export async function getTopBuyersByProfitability() {
  return seed.buyers
    .map((b) => {
      const orders = seed.orders.filter((o) => o.buyerId === b.id);
      const value = orders.reduce((s, o) => s + o.quantity * o.pricePerPiece, 0);
      const profit = orders.reduce((sum, o) => {
        const latestCosting = seed.costings
          .filter((c) => c.orderId === o.id)
          .sort((a, b2) => b2.versionNumber - a.versionNumber)[0];
        if (!latestCosting) return sum;
        const items = seed.costingItems.filter((i) => i.costingId === latestCosting.id);
        return sum + calculateCosting(items, latestCosting.sellingPricePerPiece, o.quantity).totalOrderProfit;
      }, 0);
      return { buyerName: b.companyName, orderValue: value, estimatedProfit: profit };
    })
    .sort((a, b) => b.estimatedProfit - a.estimatedProfit)
    .slice(0, 8);
}

export async function getFactoryUtilisationChart() {
  return seed.factories.map((f) => ({
    factoryName: f.name,
    utilisation: calculateFactoryUtilisation(f, seed.productionAssignments).utilisationPercent,
  }));
}

export async function getFactoryOnTimePerformance() {
  return seed.factories.map((f) => {
    const orders = seed.orders.filter((o) => o.factoryId === f.id && o.actualDispatchDate);
    const onTime = orders.filter((o) => o.actualDispatchDate! <= o.expectedDispatchDate);
    return {
      factoryName: f.name,
      onTimePercent: orders.length > 0 ? (onTime.length / orders.length) * 100 : 100,
    };
  });
}

export async function getSupplierLeadTimes() {
  return seed.suppliers.map((s) => ({
    supplierName: s.name,
    leadTimeDays: calculateSupplierPerformance(s, seed.purchaseOrders, seed.purchaseOrderItems, seed.materialReceipts).avgLeadTimeDays,
  }));
}

export async function getDefectTrendsByCategory() {
  const byCategory = new Map<string, number>();
  seed.qualityDefects.forEach((d) => byCategory.set(d.category, (byCategory.get(d.category) ?? 0) + d.count));
  return Array.from(byCategory.entries()).map(([category, count]) => ({ category, count }));
}

export async function getDelayedOrderReasons() {
  const reasonCounts = new Map<string, number>();
  seed.orders.forEach((o) => {
    const factory = seed.factories.find((f) => f.id === o.factoryId);
    const risk = calculateOrderRisk(
      o,
      seed.productionEntries,
      seed.materials,
      seed.samples,
      seed.orderMilestones,
      factory,
      seed.productionAssignments,
      undefined,
      seed.productionIssues
    );
    risk.reasons.forEach((r: string) => {
      const key = r.split(" is ")[0] || r;
      reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
    });
  });
  return Array.from(reasonCounts.entries()).map(([reason, count]) => ({ reason, count }));
}

export async function getOverallOnTimeDeliveryPercent() {
  const dispatched = seed.orders.filter((o) => o.actualDispatchDate);
  const onTime = dispatched.filter((o) => o.actualDispatchDate! <= o.expectedDispatchDate);
  return dispatched.length > 0 ? (onTime.length / dispatched.length) * 100 : 100;
}

export async function getOverallOutstanding() {
  return seed.invoices.reduce((sum, inv) => sum + calculateOutstandingPayment(inv, seed.payments).outstandingAmount, 0);
}
