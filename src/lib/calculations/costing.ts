import type { CostingItem, CostingCategory } from "@/types";

const MATERIAL_CATEGORIES: CostingCategory[] = ["fabric", "rib", "thread", "labels", "buttons_zippers"];
const PROCESSING_CATEGORIES: CostingCategory[] = ["printing", "embroidery", "washing"];
const MANUFACTURING_CATEGORIES: CostingCategory[] = ["cutting", "stitching", "finishing"];

export interface CostingItemResult extends CostingItem {
  calculatedCost: number;
}

export interface CostingBreakdown {
  items: CostingItemResult[];
  materialCost: number;
  processingCost: number;
  manufacturingCost: number;
  packagingCost: number;
  logisticsCost: number;
  overheadCost: number;
  costPerPiece: number;
  sellingPricePerPiece: number;
  profitPerPiece: number;
  marginPercent: number;
  totalOrderProfit: number;
}

/**
 * Single implementation of the costing → margin calculation.
 * See BUSINESS_RULES.md §8. Never re-derive this in a component.
 */
export function calculateCosting(
  items: CostingItem[],
  sellingPricePerPiece: number,
  quantity: number
): CostingBreakdown {
  const resolved: CostingItemResult[] = items.map((item) => ({
    ...item,
    calculatedCost: item.consumption * item.rate * (1 + item.wastePercent / 100),
  }));

  const sumBy = (categories: CostingCategory[]) =>
    resolved.filter((i) => categories.includes(i.category)).reduce((s, i) => s + i.calculatedCost, 0);

  const materialCost = sumBy(MATERIAL_CATEGORIES);
  const processingCost = sumBy(PROCESSING_CATEGORIES);
  const manufacturingCost = sumBy(MANUFACTURING_CATEGORIES);
  const packagingCost = sumBy(["packing"]);
  const logisticsCost = sumBy(["freight"]);
  const overheadCost = sumBy(["other"]);

  const costPerPiece =
    materialCost + processingCost + manufacturingCost + packagingCost + logisticsCost + overheadCost;
  const profitPerPiece = sellingPricePerPiece - costPerPiece;
  const marginPercent = sellingPricePerPiece > 0 ? (profitPerPiece / sellingPricePerPiece) * 100 : 0;

  return {
    items: resolved,
    materialCost,
    processingCost,
    manufacturingCost,
    packagingCost,
    logisticsCost,
    overheadCost,
    costPerPiece,
    sellingPricePerPiece,
    profitPerPiece,
    marginPercent,
    totalOrderProfit: profitPerPiece * quantity,
  };
}

export function compareCostingVersions(a: CostingBreakdown, b: CostingBreakdown) {
  return {
    costPerPieceDelta: b.costPerPiece - a.costPerPiece,
    sellingPriceDelta: b.sellingPricePerPiece - a.sellingPricePerPiece,
    marginPercentDelta: b.marginPercent - a.marginPercent,
  };
}

export type CostVarianceCategory = "fabric" | "production" | "rework" | "freight" | "other";

export interface CostVarianceBreakdownRow {
  category: CostVarianceCategory;
  estimated: number;
  current: number;
}

export interface CostVariance {
  estimatedCostPerPiece: number;
  currentCostPerPiece: number;
  costPerPieceVariance: number;
  originalMarginPercent: number;
  currentProjectedMarginPercent: number;
  reworkCostPerPiece: number;
  hasReworkData: boolean;
  breakdown: CostVarianceBreakdownRow[];
}

/**
 * Estimated vs. current/actual cost & margin (brief item 4). `estimated` is
 * the order's first costing version, `current` its latest — both are real
 * costing data already in the system, never fabricated. The one genuinely
 * "actual" signal available is rework: `reworkQty` (summed from real
 * production_entries) times `reworkRatePerPiece` (the order's own stitching
 * rate from its costing items, used as the labour-cost proxy for redoing a
 * piece). If no stitching rate exists on the costing, `reworkRatePerPiece`
 * is 0 and no rework cost is invented — `hasReworkData` tells the UI whether
 * to show that line as "no data" instead of a false zero. See
 * BUSINESS_RULES.md §17.
 */
export function calculateCostVariance(
  estimated: CostingBreakdown,
  current: CostingBreakdown,
  reworkQty: number,
  reworkRatePerPiece: number,
  quantity: number
): CostVariance {
  const reworkCostPerPiece = quantity > 0 ? (reworkQty * reworkRatePerPiece) / quantity : 0;
  const currentCostPerPiece = current.costPerPiece + reworkCostPerPiece;
  const costPerPieceVariance = currentCostPerPiece - estimated.costPerPiece;
  const currentProfitPerPiece = current.sellingPricePerPiece - currentCostPerPiece;
  const currentProjectedMarginPercent =
    current.sellingPricePerPiece > 0 ? (currentProfitPerPiece / current.sellingPricePerPiece) * 100 : 0;

  const breakdown: CostVarianceBreakdownRow[] = [
    { category: "fabric", estimated: estimated.materialCost, current: current.materialCost },
    {
      category: "production",
      estimated: estimated.manufacturingCost + estimated.processingCost,
      current: current.manufacturingCost + current.processingCost,
    },
    { category: "rework", estimated: 0, current: reworkCostPerPiece },
    { category: "freight", estimated: estimated.logisticsCost, current: current.logisticsCost },
    {
      category: "other",
      estimated: estimated.packagingCost + estimated.overheadCost,
      current: current.packagingCost + current.overheadCost,
    },
  ];

  return {
    estimatedCostPerPiece: estimated.costPerPiece,
    currentCostPerPiece,
    costPerPieceVariance,
    originalMarginPercent: estimated.marginPercent,
    currentProjectedMarginPercent,
    reworkCostPerPiece,
    hasReworkData: reworkQty > 0 && reworkRatePerPiece > 0,
    breakdown,
  };
}
