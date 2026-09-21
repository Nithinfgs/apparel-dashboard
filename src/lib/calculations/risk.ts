import type {
  Order,
  ProductionEntry,
  Material,
  Sample,
  OrderMilestone,
  RiskLevel,
  Factory,
  ProductionAssignment,
  ProductionIssue,
} from "@/types";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { calculateProductionProgress, ORDER_TO_PRODUCTION_STAGE } from "./production";
import { calculateMaterialAvailability } from "./materials";
import { calculateFactoryUtilisation } from "./factory";
import { ORDER_STAGES, ORDER_STAGE_LABELS } from "@/lib/constants";

export interface OrderRisk {
  level: RiskLevel;
  reasons: string[];
}

const LEVEL_RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

function maxLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return LEVEL_RANK[b] > LEVEL_RANK[a] ? b : a;
}

/**
 * Deterministic, explainable risk engine. See BUSINESS_RULES.md §7.
 * Every contributing factor is returned as a human-readable reason string —
 * the UI never shows an unexplained risk badge.
 */
export function calculateOrderRisk(
  order: Order,
  entries: ProductionEntry[],
  materials: Material[],
  samples: Sample[],
  milestones: OrderMilestone[],
  factory?: Factory,
  assignments: ProductionAssignment[] = [],
  today: Date = new Date(),
  issues: ProductionIssue[] = []
): OrderRisk {
  let level: RiskLevel = "low";
  const reasons: string[] = [];

  // 1. Production behind plan — compare the order's *current* stage progress
  // against a linear expectation from creation to expected dispatch.
  const progress = calculateProductionProgress(order, entries);
  const mappedStage = ORDER_TO_PRODUCTION_STAGE[order.stage];
  const currentStageProgress = mappedStage ? progress.find((p) => p.stage === mappedStage) : undefined;
  if (currentStageProgress) {
    const totalSpan = differenceInCalendarDays(parseISO(order.expectedDispatchDate), parseISO(order.createdAt));
    const elapsed = differenceInCalendarDays(today, parseISO(order.createdAt));
    const expectedPercent = totalSpan > 0 ? Math.min(100, Math.max(0, (elapsed / totalSpan) * 100)) : 0;
    const gap = expectedPercent - currentStageProgress.percent;
    if (gap >= 25) {
      level = maxLevel(level, "high");
      reasons.push(
        `${ORDER_STAGE_LABELS[order.stage]} is ${gap.toFixed(0)}% behind planned completion.`
      );
    } else if (gap >= 10) {
      level = maxLevel(level, "medium");
      reasons.push(
        `${ORDER_STAGE_LABELS[order.stage]} is ${gap.toFixed(0)}% behind planned completion.`
      );
    }
  }

  // 2. Material ETA later than the planned cutting-start milestone.
  const cuttingStart = milestones.find((m) => m.orderId === order.id && m.milestoneKey === "cutting_start");
  if (cuttingStart) {
    const lateMaterial = materials.find(
      (m) =>
        m.orderId === order.id &&
        m.status !== "received" &&
        differenceInCalendarDays(parseISO(m.expectedArrival), parseISO(cuttingStart.plannedDate)) > 0
    );
    if (lateMaterial) {
      level = maxLevel(level, "high");
      reasons.push(`Material "${lateMaterial.description}" is expected after the planned cutting start date.`);
    }
  }
  // also flag plain shortages/overdue materials
  for (const m of materials.filter((m) => m.orderId === order.id)) {
    const availability = calculateMaterialAvailability(m, today);
    if (availability.status === "overdue") {
      level = maxLevel(level, "high");
      reasons.push(`Material "${m.description}" delivery is overdue.`);
    }
  }

  // 3. QC failure.
  // (quality_inspections are passed in by callers that have them; kept optional to avoid a hard dependency here)

  // 4. Buyer approval pending close to a dependent milestone.
  const buyerApproval = milestones.find((m) => m.orderId === order.id && m.milestoneKey === "buyer_approval");
  if (buyerApproval && buyerApproval.status !== "done") {
    const daysUntil = differenceInCalendarDays(parseISO(buyerApproval.plannedDate), today);
    if (daysUntil <= 7) {
      level = maxLevel(level, "medium");
      reasons.push("Buyer approval is pending and due within 7 days.");
    }
  }
  const pendingPpSample = samples.find(
    (s) => s.orderId === order.id && s.sampleType === "pp" && s.status !== "approved" && s.status !== "rejected"
  );
  if (pendingPpSample) {
    level = maxLevel(level, "medium");
    reasons.push("PP Sample approval from buyer is still pending.");
  }

  // 5. Dispatch proximity with incomplete stages.
  const daysToDispatch = differenceInCalendarDays(parseISO(order.expectedDispatchDate), today);
  const packingIndex = ORDER_STAGES.indexOf("packing");
  const orderStageIndex = ORDER_STAGES.indexOf(order.stage);
  if (daysToDispatch <= 5 && daysToDispatch >= 0 && orderStageIndex < packingIndex) {
    level = maxLevel(level, "critical");
    reasons.push(`Dispatch is ${daysToDispatch} day(s) away and earlier stages are not yet complete.`);
  }

  // 6. Factory overload.
  if (factory) {
    const utilisation = calculateFactoryUtilisation(factory, assignments);
    if (utilisation.utilisationPercent > 100) {
      level = maxLevel(level, "medium");
      reasons.push(`Assigned factory ${factory.name} is over capacity (${utilisation.utilisationPercent.toFixed(0)}% committed).`);
    }
  }

  // 7. Unresolved production issues/escalations — a `resolved`/`closed` issue
  // no longer represents live risk, so only `open`/`in_progress` ones count.
  // The issue's own severity is carried straight through as the risk
  // contribution, capped by the level it names (a "low" issue never forces
  // an escalation beyond what it claims). See BUSINESS_RULES.md §16.
  for (const issue of issues.filter((i) => i.orderId === order.id && (i.status === "open" || i.status === "in_progress"))) {
    level = maxLevel(level, issue.severity);
    reasons.push(`Open issue: ${issue.description}`);
  }

  return { level, reasons };
}
