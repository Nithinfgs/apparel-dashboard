import "server-only";
import * as seed from "@/lib/seed";
import type { Order, OrderStage, RiskLevel } from "@/types";
import {
  calculateOrderRisk,
  calculateProductionProgress,
  calculateOrderStageProgress,
  canEnterBulkProduction,
  calculateNextAction,
  calculateMilestoneImpacts,
  calculateCosting,
  calculateCostVariance,
} from "@/lib/calculations";

export interface OrderWithContext extends Order {
  buyerName: string;
  styleName: string;
  factoryName: string;
  orderValue: number;
  risk: { level: RiskLevel; reasons: string[] };
  progressPercent: number;
}

function enrich(order: Order): OrderWithContext {
  const buyer = seed.buyers.find((b) => b.id === order.buyerId);
  const style = seed.styles.find((s) => s.id === order.styleId);
  const factory = seed.factories.find((f) => f.id === order.factoryId);
  const risk = calculateOrderRisk(
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
  const progress = calculateProductionProgress(order, seed.productionEntries);
  const overallProgress = progress.reduce((s, p) => s + p.percent, 0) / progress.length;

  return {
    ...order,
    buyerName: buyer?.companyName ?? "Unknown Buyer",
    styleName: style?.name ?? "Unknown Style",
    factoryName: factory?.name ?? "Unassigned",
    orderValue: order.quantity * order.pricePerPiece,
    risk,
    progressPercent: overallProgress,
  };
}

export interface OrderFilters {
  search?: string;
  buyerId?: string;
  stage?: OrderStage;
  factoryId?: string;
  risk?: RiskLevel;
  page?: number;
  pageSize?: number;
  sortBy?: "orderNo" | "expectedDispatchDate" | "orderValue" | "progressPercent";
  sortDir?: "asc" | "desc";
}

export async function listOrders(filters: OrderFilters = {}): Promise<{ items: OrderWithContext[]; total: number }> {
  let items = seed.orders.map(enrich);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        o.styleName.toLowerCase().includes(q)
    );
  }
  if (filters.buyerId) items = items.filter((o) => o.buyerId === filters.buyerId);
  if (filters.stage) items = items.filter((o) => o.stage === filters.stage);
  if (filters.factoryId) items = items.filter((o) => o.factoryId === filters.factoryId);
  if (filters.risk) items = items.filter((o) => o.risk.level === filters.risk);

  const total = items.length;

  if (filters.sortBy) {
    const dir = filters.sortDir === "desc" ? -1 : 1;
    items = [...items].sort((a, b) => {
      const av = a[filters.sortBy as "orderNo"];
      const bv = b[filters.sortBy as "orderNo"];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  } else {
    items = [...items].sort((a, b) => a.expectedDispatchDate.localeCompare(b.expectedDispatchDate));
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  items = items.slice(start, start + pageSize);

  return { items, total };
}

export async function getOrderById(id: string): Promise<OrderWithContext | undefined> {
  const order = seed.orders.find((o) => o.id === id || o.orderNo === id);
  return order ? enrich(order) : undefined;
}

export async function getOrdersByBuyer(buyerId: string): Promise<OrderWithContext[]> {
  return seed.orders.filter((o) => o.buyerId === buyerId).map(enrich);
}

export async function getOrdersByFactory(factoryId: string): Promise<OrderWithContext[]> {
  return seed.orders.filter((o) => o.factoryId === factoryId).map(enrich);
}

export async function getOrderMilestones(orderId: string) {
  return seed.orderMilestones.filter((m) => m.orderId === orderId);
}

export async function getOrderItems(orderId: string) {
  return seed.orderItems.filter((i) => i.orderId === orderId);
}

export async function getOrderProductionProgress(orderId: string) {
  const order = seed.orders.find((o) => o.id === orderId);
  if (!order) return [];
  return calculateProductionProgress(order, seed.productionEntries);
}

export async function getOrderStageProgress(orderId: string) {
  const order = seed.orders.find((o) => o.id === orderId);
  if (!order) return [];
  return calculateOrderStageProgress(order, seed.productionEntries);
}

export async function getOrderMaterials(orderId: string) {
  return seed.materials.filter((m) => m.orderId === orderId);
}

export async function getOrderSamples(orderId: string) {
  return seed.samples.filter((s) => s.orderId === orderId);
}

export async function getOrderQualityInspections(orderId: string) {
  return seed.qualityInspections.filter((q) => q.orderId === orderId);
}

export async function getOrderInvoices(orderId: string) {
  return seed.invoices.filter((i) => i.orderId === orderId);
}

export async function getOrderDocuments(orderId: string) {
  return seed.documents.filter((d) => d.entityType === "order" && d.entityId === orderId);
}

export async function getOrderActivity(orderId: string) {
  return seed.activityLogs
    .filter((a) => a.entityId === orderId)
    .map((a) => ({ ...a, actorName: seed.profiles.find((p) => p.id === a.actorId)?.fullName ?? "System" }));
}

export async function checkBulkProductionGate(orderId: string) {
  const order = seed.orders.find((o) => o.id === orderId);
  if (!order) return { allowed: false, reason: "Order not found." };
  return canEnterBulkProduction(order, seed.samples);
}

export async function getAtRiskOrders(limit = 5): Promise<OrderWithContext[]> {
  const items = seed.orders
    .map(enrich)
    .filter((o) => o.risk.level === "high" || o.risk.level === "critical")
    .sort((a, b) => (a.risk.level === b.risk.level ? 0 : a.risk.level === "critical" ? -1 : 1));
  return items.slice(0, limit);
}

export async function getUpcomingDispatches(limit = 10): Promise<OrderWithContext[]> {
  const today = new Date();
  return seed.orders
    .map(enrich)
    .filter((o) => new Date(o.expectedDispatchDate) >= today && o.stage !== "completed")
    .sort((a, b) => a.expectedDispatchDate.localeCompare(b.expectedDispatchDate))
    .slice(0, limit);
}

/** "Next Action / Owner / Due Date" — derived from milestones, never a separate field. See BUSINESS_RULES.md §15. */
export async function getOrderNextAction(orderId: string) {
  const milestones = seed.orderMilestones.filter((m) => m.orderId === orderId);
  const next = calculateNextAction(milestones);
  if (!next) return undefined;
  return { ...next, ownerName: seed.profiles.find((p) => p.id === next.ownerId)?.fullName ?? "Unassigned" };
}

export async function getOrderMilestoneImpacts(orderId: string) {
  const milestones = seed.orderMilestones.filter((m) => m.orderId === orderId);
  return calculateMilestoneImpacts(milestones);
}

/** Estimated vs. current cost & margin — see calculateCostVariance for the derivation. */
export async function getOrderCostVariance(orderId: string) {
  const order = seed.orders.find((o) => o.id === orderId);
  if (!order) return undefined;

  const versions = seed.costings.filter((c) => c.orderId === orderId).sort((a, b) => a.versionNumber - b.versionNumber);
  if (versions.length === 0) return undefined;

  const firstVersion = versions[0];
  const latestVersion = versions[versions.length - 1];
  const firstItems = seed.costingItems.filter((i) => i.costingId === firstVersion.id);
  const latestItems = seed.costingItems.filter((i) => i.costingId === latestVersion.id);

  const estimated = calculateCosting(firstItems, firstVersion.sellingPricePerPiece, order.quantity);
  const current = calculateCosting(latestItems, latestVersion.sellingPricePerPiece, order.quantity);

  const reworkQty = seed.productionEntries.filter((e) => e.orderId === orderId).reduce((sum, e) => sum + e.reworkedQty, 0);
  const stitchingItem = latestItems.find((i) => i.category === "stitching");
  const reworkRatePerPiece = stitchingItem?.rate ?? 0;

  return {
    currency: latestVersion.currency,
    estimatedVersion: firstVersion.versionNumber,
    currentVersion: latestVersion.versionNumber,
    ...calculateCostVariance(estimated, current, reworkQty, reworkRatePerPiece, order.quantity),
  };
}
