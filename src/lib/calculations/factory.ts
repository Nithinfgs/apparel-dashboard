import type { Factory, ProductionAssignment } from "@/types";

export interface FactoryUtilisation {
  committedPieces: number;
  utilisationPercent: number;
}

/**
 * See BUSINESS_RULES.md §9. `production_assignments.assigned_quantity` is a
 * whole order's quantity, not a daily rate, so it is compared against the
 * factory's capacity over a planning horizon (default 30 days — a typical
 * order's production window) rather than a single day's capacity. Comparing
 * a multi-week order total against one day of capacity would make every
 * factory look permanently over capacity.
 */
export function calculateFactoryUtilisation(
  factory: Pick<Factory, "id" | "dailyCapacityPieces">,
  assignments: ProductionAssignment[],
  planningHorizonDays = 30
): FactoryUtilisation {
  const committedPieces = assignments
    .filter((a) => a.factoryId === factory.id && a.status === "active")
    .reduce((sum, a) => sum + a.assignedQuantity, 0);

  const horizonCapacity = factory.dailyCapacityPieces * planningHorizonDays;

  return {
    committedPieces,
    utilisationPercent: horizonCapacity > 0 ? (committedPieces / horizonCapacity) * 100 : 0,
  };
}
