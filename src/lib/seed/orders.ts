import type {
  Enquiry,
  Order,
  OrderItem,
  OrderMilestone,
  OrderStage,
  Costing,
  CostingItem,
  Sample,
  SampleApprovalLike,
} from "@/types";
import { buyers, factories } from "./reference";
import { styles } from "./styles";
import { isoDate, addDaysIso, randInt, randFloat, chance, pick } from "./rng";
import { MILESTONE_SEQUENCE } from "@/lib/constants";

const buyerIds = buyers.map((b) => b.id);
const factoryIds = factories.map((f) => f.id);

// One of these per order index (1-30), controlling how far each order has progressed.
// Order index 14 (the flagship TC-2609-014, brief §37/§57) falls in the
// "stitching" group by design.
export const STAGE_PLAN: OrderStage[] = [
  "costing", // 1
  "sampling", "sampling", // 2-3
  "sourcing", "sourcing", // 4-5
  "cutting", "cutting", "cutting", "cutting", // 6-9
  "stitching", "stitching", "stitching", "stitching", "stitching", // 10-14
  "finishing", "finishing", "finishing", "finishing", // 15-18
  "quality", "quality", "quality", // 19-21
  "packing", "packing", "packing", "packing", // 22-25
  "dispatch", "dispatch", "dispatch", // 26-28
  "completed", "completed", // 29-30
];

const STYLE_NAMES_BY_INDEX = styles;

export const enquiries: Enquiry[] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  const buyerId = buyerIds[i % buyerIds.length];
  const converted = n <= 8;
  const currency = buyers[i % buyers.length].currency;
  return {
    id: `enquiry-${String(n).padStart(2, "0")}`,
    enquiryNo: `ENQ-26${String(n).padStart(3, "0")}`,
    buyerId,
    merchandiserId: i % 2 === 0 ? "user-mrc-1" : "user-mrc-2",
    productSummary: STYLE_NAMES_BY_INDEX[i % STYLE_NAMES_BY_INDEX.length].name,
    expectedQuantity: randInt(1500, 8000),
    targetPrice: currency === "INR" ? randInt(280, 650) : randFloat(3, 15, 2),
    currency,
    deliveryDeadline: isoDate(2026, 10, 15),
    status: converted ? "confirmed" : (["new", "requirements_received", "quote_sent"] as const)[i % 3],
    convertedOrderId: converted ? `order-${String(n).padStart(3, "0")}` : undefined,
    createdAt: isoDate(2026, (i % 5) + 3, 5),
    updatedAt: isoDate(2026, (i % 5) + 4, 20),
  };
});

export const orders: Order[] = [];
export const orderItems: OrderItem[] = [];
export const orderMilestones: OrderMilestone[] = [];
export const costings: Costing[] = [];
export const costingItems: CostingItem[] = [];
export const samples: Sample[] = [];
export const sampleApprovals: SampleApprovalLike[] = [];

// MILESTONE_SEQUENCE lives in @/lib/constants (shared with the milestone
// dependency-impact calculation) so the two never disagree on adjacency.

const STAGE_INDEX: Record<OrderStage, number> = {
  costing: 0,
  sampling: 1,
  sourcing: 2,
  cutting: 3,
  stitching: 4,
  finishing: 5,
  quality: 6,
  packing: 7,
  dispatch: 8,
  completed: 9,
};

function buildMilestones(orderId: string, stage: OrderStage, orderStart: string, dispatchDate: string, ownerId: string): OrderMilestone[] {
  const stageIdx = STAGE_INDEX[stage];
  // How many of the 12 milestones should already be done, roughly proportional to stage progress.
  const doneCount = Math.min(MILESTONE_SEQUENCE.length, Math.round(((stageIdx + 1) / 10) * MILESTONE_SEQUENCE.length));
  const totalSpanDays = Math.max(20, Math.round((new Date(dispatchDate).getTime() - new Date(orderStart).getTime()) / 86400000));
  const step = totalSpanDays / MILESTONE_SEQUENCE.length;

  return MILESTONE_SEQUENCE.map((key, i) => {
    const plannedDate = addDaysIso(orderStart, Math.round(step * (i + 1)));
    const isDone = i < doneCount;
    const isInProgress = i === doneCount;
    return {
      id: `milestone-${orderId}-${key}`,
      orderId,
      milestoneKey: key,
      plannedDate,
      actualDate: isDone ? plannedDate : undefined,
      status: isDone ? "done" : isInProgress ? "in_progress" : "pending",
      ownerId,
    } satisfies OrderMilestone;
  });
}

function buildCosting(orderId: string, styleId: string, pricePerPiece: number, seedRatio: number, currency: Order["currency"], versionNumber: number): { costing: Costing; items: CostingItem[] } {
  const costingId = `costing-${orderId}-v${versionNumber}`;
  const targetCost = pricePerPiece * seedRatio;
  const weights: [CostingItem["category"], number][] = [
    ["fabric", 0.49],
    ["thread", 0.02],
    ["labels", 0.015],
    ["buttons_zippers", 0.01],
    ["embroidery", 0.04],
    ["washing", 0.03],
    ["cutting", 0.05],
    ["stitching", 0.16],
    ["finishing", 0.08],
    ["packing", 0.035],
    ["freight", 0.045],
    ["other", 0.025],
  ];
  const items: CostingItem[] = weights.map(([category, weight], i) => ({
    id: `${costingId}-item-${i + 1}`,
    costingId,
    category,
    unit: "pc",
    consumption: 1,
    rate: Number((targetCost * weight).toFixed(2)),
    wastePercent: 0,
  }));
  return {
    costing: {
      id: costingId,
      orderId,
      styleId,
      versionNumber,
      sellingPricePerPiece: pricePerPiece,
      currency,
      status: "final",
      createdBy: "user-mrc-1",
      createdAt: isoDate(2026, 7, 1),
    },
    items,
  };
}

function buildSample(orderId: string, styleId: string, stage: OrderStage): { sample: Sample; approval?: SampleApprovalLike } {
  const stageIdx = STAGE_INDEX[stage];
  const ppApproved = stageIdx >= STAGE_INDEX["cutting"];
  const status: Sample["status"] = ppApproved ? "approved" : stageIdx >= STAGE_INDEX["sampling"] ? "buyer_review" : "requested";
  const sample: Sample = {
    id: `sample-${orderId}-pp`,
    orderId,
    styleId,
    sampleType: "pp",
    versionNumber: 1,
    status,
    courier: "DHL Express",
    sentDate: isoDate(2026, 7, 10),
    buyerResponseDate: ppApproved ? isoDate(2026, 7, 18) : undefined,
    comments: ppApproved ? "Approved for bulk production." : "Awaiting buyer sign-off.",
    createdAt: isoDate(2026, 7, 5),
  };
  const approval: SampleApprovalLike | undefined = ppApproved
    ? {
        id: `approval-${orderId}-pp`,
        sampleId: sample.id,
        decision: "approved",
        comments: "Looks good, proceed to bulk.",
        decidedAt: isoDate(2026, 7, 18),
      }
    : undefined;
  return { sample, approval };
}

for (let n = 1; n <= 30; n++) {
  const orderId = `order-${String(n).padStart(3, "0")}`;
  const orderNo = `TC-2609-${String(n).padStart(3, "0")}`;
  const stage = STAGE_PLAN[n - 1];

  let buyerId: string;
  let styleId: string;
  let factoryId: string;
  let quantity: number;
  let pricePerPiece: number;
  let createdAt: string;
  let expectedDispatchDate: string;
  let poNumber: string;

  if (n === 14) {
    // Flagship demo order — brief §37/§57. Hand-tuned so the deterministic
    // risk engine reproduces "MEDIUM / Stitching is 8% behind planned completion."
    buyerId = "buyer-01";
    styleId = "style-01";
    factoryId = "factory-02";
    quantity = 5000;
    pricePerPiece = 570;
    // Chosen so the deterministic risk engine's 10-24pt "MEDIUM" band fires
    // with the flagship's stitching progress (72%) — see BUSINESS_RULES.md §7.
    createdAt = isoDate(2026, 7, 20);
    expectedDispatchDate = isoDate(2026, 9, 29);
    poNumber = "NR-PO-8841";
  } else {
    buyerId = buyerIds[(n - 1) % buyerIds.length];
    const buyerStyles = styles.filter((s) => s.buyerId === buyerId);
    styleId = (buyerStyles[0] ?? pick(styles)).id;
    factoryId = factoryIds[(n - 1) % factoryIds.length];
    quantity = randInt(1200, 8000);
    pricePerPiece = randInt(180, 650);
    const stageIdx = STAGE_INDEX[stage];
    const today = isoDate(2026, 9, 20);
    const isPastTense = stage === "dispatch" || stage === "completed";

    if (isPastTense) {
      // Already shipped (or delivered) — both dates sit in the past relative to "today".
      createdAt = addDaysIso(today, -randInt(70, 110));
      expectedDispatchDate = addDaysIso(today, -randInt(0, 25));
    } else {
      // Still in progress — order started in the past, dispatch is upcoming.
      // Later stages started longer ago and have less runway left, so the
      // linear expected-vs-actual comparison in the risk engine stays sane.
      createdAt = addDaysIso(today, -(stageIdx * 9 + randInt(3, 12)));
      expectedDispatchDate = addDaysIso(today, randInt(35, 55) - stageIdx * 3);
    }
    poNumber = `PO-${randInt(1000, 9999)}`;
  }

  const actualDispatchDate =
    stage === "completed" || stage === "dispatch"
      ? stage === "completed"
        ? expectedDispatchDate
        : chance(0.5)
        ? expectedDispatchDate
        : undefined
      : undefined;

  const order: Order = {
    id: orderId,
    orderNo,
    enquiryId: n <= 8 ? `enquiry-${String(n).padStart(2, "0")}` : undefined,
    buyerId,
    styleId,
    costingId: `costing-${orderId}-v2`,
    poNumber,
    quantity,
    pricePerPiece,
    // Order value is always recorded in INR — Texcroft's internal
    // books-of-record currency, matching the ₹ figures used throughout the
    // dashboard and Order 360 (brief §37/§57). `buyer.currency` is separate
    // metadata: the buyer's own invoicing/remittance currency preference,
    // shown on the Buyer page, not used for internal order value sums —
    // mixing currencies in a KPI total would silently produce nonsense.
    currency: "INR",
    factoryId,
    stage,
    expectedDispatchDate,
    actualDispatchDate,
    ownerId: n % 2 === 0 ? "user-mrc-1" : "user-mrc-2",
    createdAt,
    updatedAt: isoDate(2026, 9, 18),
  };
  orders.push(order);

  const colours = STYLE_NAMES_BY_INDEX.find((s) => s.id === styleId)?.colours ?? ["Black"];
  const sizes = STYLE_NAMES_BY_INDEX.find((s) => s.id === styleId)?.sizes ?? ["S", "M", "L"];
  const perCombo = Math.floor(quantity / (colours.length * sizes.length)) || 1;
  colours.forEach((colour, ci) => {
    sizes.forEach((size, si) => {
      orderItems.push({
        id: `${orderId}-item-${ci}-${si}`,
        orderId,
        colour,
        size,
        quantity: perCombo,
      });
    });
  });

  const milestonesForOrder = buildMilestones(orderId, stage, createdAt, expectedDispatchDate, order.ownerId);
  if (n === 14) {
    // Flagship order carries one deliberately late milestone (PP Sample
    // approved 2 days after planned) so the milestone dependency-impact
    // calculation (BUSINESS_RULES.md §15) has a real, non-zero case to show
    // on Order 360 — every other seeded milestone lands exactly on time.
    const ppSample = milestonesForOrder.find((m) => m.milestoneKey === "pp_sample");
    if (ppSample && ppSample.actualDate) {
      ppSample.actualDate = addDaysIso(ppSample.plannedDate, 2);
    }
  }
  orderMilestones.push(...milestonesForOrder);

  const v1 = buildCosting(orderId, styleId, pricePerPiece, 0.82, order.currency, 1);
  const v2 = buildCosting(orderId, styleId, pricePerPiece, n === 14 ? 428 / 570 : 0.75, order.currency, 2);
  costings.push(v1.costing, v2.costing);
  costingItems.push(...v1.items, ...v2.items);

  const { sample, approval } = buildSample(orderId, styleId, stage);
  samples.push(sample);
  if (approval) sampleApprovals.push(approval);
}
