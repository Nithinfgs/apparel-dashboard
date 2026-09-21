import "server-only";
import * as seed from "@/lib/seed";
import { ORDER_STAGES, PRODUCTION_STAGES } from "@/lib/constants";
import { calculateProductionProgress, calculateOrderRisk } from "@/lib/calculations";
import type { ProductionStage } from "@/types";

const STAGE_INDEX = Object.fromEntries(ORDER_STAGES.map((s, i) => [s, i])) as Record<string, number>;

export async function listProductionBoard() {
  return seed.orders
    .filter((o) => STAGE_INDEX[o.stage] >= STAGE_INDEX["cutting"] && o.stage !== "completed")
    .map((o) => {
      const factory = seed.factories.find((f) => f.id === o.factoryId);
      const progress = calculateProductionProgress(o, seed.productionEntries);
      const current = progress.find((p) => p.percent > 0 && p.percent < 100);
      const risk = calculateOrderRisk(o, seed.productionEntries, seed.materials, seed.samples, seed.orderMilestones, factory, seed.productionAssignments, undefined, seed.productionIssues);
      return {
        order: o,
        buyerName: seed.buyers.find((b) => b.id === o.buyerId)?.companyName ?? "Unknown",
        styleName: seed.styles.find((s) => s.id === o.styleId)?.name ?? "Unknown",
        factoryName: factory?.name ?? "Unassigned",
        currentStage: current?.stage,
        currentPercent: current?.percent ?? 0,
        risk,
      };
    });
}

export interface ProductionBoardColumn {
  stage: ProductionStage;
  items: Awaited<ReturnType<typeof listProductionBoard>>;
}

export async function listProductionBoardByStage(): Promise<ProductionBoardColumn[]> {
  const board = await listProductionBoard();
  return PRODUCTION_STAGES.map((stage) => ({
    stage,
    items: board.filter((b) => b.currentStage === stage),
  }));
}

export async function listProductionEntries(filters: { factoryId?: string; orderId?: string } = {}) {
  let items = [...seed.productionEntries].sort((a, b) => b.date.localeCompare(a.date));
  if (filters.factoryId) items = items.filter((e) => e.factoryId === filters.factoryId);
  if (filters.orderId) items = items.filter((e) => e.orderId === filters.orderId);
  return items;
}

export async function getOpenAssignmentsForFactory(factoryId: string) {
  return seed.productionAssignments.filter((a) => a.factoryId === factoryId && a.status === "active");
}

export async function listActiveProductionOrders() {
  return seed.orders
    .filter((o) => seed.productionAssignments.some((a) => a.orderId === o.id && a.status === "active"))
    .map((o) => ({ id: o.id, orderNo: o.orderNo, factoryId: o.factoryId }));
}

export async function getOrderNoMap() {
  return new Map(seed.orders.map((o) => [o.id, o.orderNo]));
}
