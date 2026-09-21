import "server-only";
import * as seed from "@/lib/seed";
import { calculateOrderStageProgress } from "@/lib/calculations";

/**
 * Buyer-safe order projection — deliberately narrower than OrderWithContext.
 * Never include internal costs, supplier prices, margins, factory-sensitive
 * detail, or internal notes here. See brief §27 / docs/ROUTES.md portal section.
 */
function toBuyerOrder(order: (typeof seed.orders)[number]) {
  const style = seed.styles.find((s) => s.id === order.styleId);
  const stageProgress = calculateOrderStageProgress(order, seed.productionEntries);
  const latestInspection = [...seed.qualityInspections]
    .filter((q) => q.orderId === order.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  return {
    id: order.id,
    orderNo: order.orderNo,
    styleName: style?.name ?? "Unknown",
    colours: style?.colours ?? [],
    quantity: order.quantity,
    stage: order.stage,
    expectedDispatchDate: order.expectedDispatchDate,
    actualDispatchDate: order.actualDispatchDate,
    stageProgress,
    qcSummary: latestInspection
      ? { result: latestInspection.result, date: latestInspection.date }
      : undefined,
  };
}

export async function getBuyerOrders(buyerId: string) {
  return seed.orders.filter((o) => o.buyerId === buyerId).map(toBuyerOrder);
}

export async function getBuyerOrderById(buyerId: string, orderId: string) {
  const order = seed.orders.find((o) => o.id === orderId && o.buyerId === buyerId);
  return order ? toBuyerOrder(order) : undefined;
}

export async function getBuyerApprovals(buyerId: string) {
  const orderIds = new Set(seed.orders.filter((o) => o.buyerId === buyerId).map((o) => o.id));
  return seed.samples
    .filter((s) => s.orderId && orderIds.has(s.orderId) && (s.status === "buyer_review" || s.status === "sent"))
    .map((s) => ({
      ...s,
      orderNo: seed.orders.find((o) => o.id === s.orderId)?.orderNo,
    }));
}

export async function getBuyerDocuments(buyerId: string) {
  const orderIds = new Set(seed.orders.filter((o) => o.buyerId === buyerId).map((o) => o.id));
  return seed.documents.filter((d) => d.entityType === "order" && orderIds.has(d.entityId));
}

export async function getBuyerLatestUpdate(orderId: string) {
  const entries = seed.productionEntries.filter((e) => e.orderId === orderId).sort((a, b) => b.date.localeCompare(a.date));
  return entries[0];
}
