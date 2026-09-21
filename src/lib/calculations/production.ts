import type { Order, OrderStage, ProductionEntry, ProductionStage, Sample } from "@/types";
import { PRODUCTION_STAGES, ORDER_STAGES } from "@/lib/constants";

export interface StageProgress {
  stage: ProductionStage;
  completedQty: number;
  rejectedQty: number;
  reworkedQty: number;
  percent: number;
  dailyAverage: number;
}

/**
 * Production totals are event-sourced: they are always derived from
 * production_entries, never stored/mutated directly. See BUSINESS_RULES.md §4.
 */
export function calculateProductionProgress(
  order: Pick<Order, "id" | "quantity">,
  entries: ProductionEntry[]
): StageProgress[] {
  return PRODUCTION_STAGES.map((stage) => {
    const stageEntries = entries.filter((e) => e.orderId === order.id && e.stage === stage);
    const completedQty = stageEntries.reduce((sum, e) => sum + e.producedQty, 0);
    const rejectedQty = stageEntries.reduce((sum, e) => sum + e.rejectedQty, 0);
    const reworkedQty = stageEntries.reduce((sum, e) => sum + e.reworkedQty, 0);
    const distinctDays = new Set(stageEntries.map((e) => e.date)).size;
    return {
      stage,
      completedQty,
      rejectedQty,
      reworkedQty,
      percent: order.quantity > 0 ? Math.min(100, (completedQty / order.quantity) * 100) : 0,
      dailyAverage: distinctDays > 0 ? completedQty / distinctDays : 0,
    };
  });
}

export function getStageProgress(progress: StageProgress[], stage: ProductionStage): StageProgress {
  return (
    progress.find((p) => p.stage === stage) ?? {
      stage,
      completedQty: 0,
      rejectedQty: 0,
      reworkedQty: 0,
      percent: 0,
      dailyAverage: 0,
    }
  );
}

export const ORDER_TO_PRODUCTION_STAGE: Partial<Record<OrderStage, ProductionStage>> = {
  cutting: "cutting",
  stitching: "stitching",
  finishing: "finishing",
  quality: "qc",
  packing: "packing",
};

/**
 * Maps production-stage progress onto the order-lifecycle stages shown in
 * `OrderProgress` (the Order 360 lifecycle bar). Stages with no direct
 * production-stage equivalent (costing, sampling, sourcing, dispatch,
 * completed) are derived structurally from the order's current stage index.
 */
export function calculateOrderStageProgress(
  order: Pick<Order, "id" | "quantity" | "stage">,
  entries: ProductionEntry[]
): { stage: OrderStage; percent: number }[] {
  const productionProgress = calculateProductionProgress(order, entries);
  const currentIdx = ORDER_STAGES.indexOf(order.stage);

  return ORDER_STAGES.map((stage, i) => {
    const mapped = ORDER_TO_PRODUCTION_STAGE[stage];
    if (mapped) {
      const p = productionProgress.find((pp) => pp.stage === mapped);
      return { stage, percent: p?.percent ?? (i < currentIdx ? 100 : 0) };
    }
    return { stage, percent: i < currentIdx ? 100 : i === currentIdx && (stage === "dispatch" || stage === "completed") ? 100 : 0 };
  });
}

/**
 * Hard business rule: bulk production (stitching onward) cannot start until
 * a PP sample has been approved. See BUSINESS_RULES.md §3.
 */
export function canEnterBulkProduction(
  order: Pick<Order, "id">,
  samples: Sample[]
): { allowed: boolean; reason?: string } {
  const ppApproved = samples.some(
    (s) => s.orderId === order.id && s.sampleType === "pp" && s.status === "approved"
  );
  if (!ppApproved) {
    return {
      allowed: false,
      reason: "PP Sample must be approved by the buyer before bulk production can start.",
    };
  }
  return { allowed: true };
}
