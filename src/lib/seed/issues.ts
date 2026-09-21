import type { ProductionIssue, OrderChangeRequest } from "@/types";
import { orders } from "./orders";
import { addDaysIso } from "./rng";
import { ORDER_STAGES } from "@/lib/constants";

const STAGE_INDEX = Object.fromEntries(ORDER_STAGES.map((s, i) => [s, i])) as Record<string, number>;

const flagship = orders.find((o) => o.id === "order-014")!;

// Orders in cutting stage or beyond, excluding the flagship (handled explicitly
// below), used to distribute a handful of realistic issues/change requests
// across the seed set for the Production Issues list and Action Center.
const otherCandidates = orders.filter((o) => o.id !== flagship.id && STAGE_INDEX[o.stage] >= STAGE_INDEX["cutting"]);

// ---------- Production Issues / Escalations ----------

export const productionIssues: ProductionIssue[] = [];

// Flagship order carries one OPEN issue at MEDIUM severity — deliberately
// chosen so it does not push the flagship's risk level past the MEDIUM the
// rest of the app already demonstrates (brief §37/§57); it still shows up
// on Order 360 and contributes an additional, real MEDIUM reason.
productionIssues.push({
  id: "issue-order-014-1",
  orderId: flagship.id,
  factoryId: flagship.factoryId,
  stage: "stitching",
  issueType: "quality_defect",
  description: "Minor shade variation spotted on a stitched batch — held back for review before continuing to finishing.",
  severity: "medium",
  ownerId: "user-prod",
  status: "open",
  reportedBy: "user-factory",
  createdAt: addDaysIso(flagship.createdAt, 30),
  updatedAt: addDaysIso(flagship.createdAt, 30),
});

const criticalCandidate = otherCandidates[2];
if (criticalCandidate) {
  productionIssues.push({
    id: `issue-${criticalCandidate.id}-1`,
    orderId: criticalCandidate.id,
    factoryId: criticalCandidate.factoryId,
    stage: "stitching",
    issueType: "machine_breakdown",
    description: "Two stitching machines down on the assigned line — vendor called for repair.",
    severity: "critical",
    ownerId: "user-prod",
    status: "open",
    reportedBy: "user-factory",
    createdAt: addDaysIso(criticalCandidate.createdAt, 20),
    updatedAt: addDaysIso(criticalCandidate.createdAt, 20),
  });
}

const highCandidate = otherCandidates[5];
if (highCandidate) {
  productionIssues.push({
    id: `issue-${highCandidate.id}-1`,
    orderId: highCandidate.id,
    factoryId: highCandidate.factoryId,
    stage: "cutting",
    issueType: "material_shortage",
    description: "Fabric roll shortfall discovered mid-cutting — additional stock requested from supplier.",
    severity: "high",
    ownerId: "user-src",
    status: "in_progress",
    reportedBy: "user-factory",
    createdAt: addDaysIso(highCandidate.createdAt, 15),
    updatedAt: addDaysIso(highCandidate.createdAt, 18),
  });
}

const resolvedCandidate = otherCandidates[8];
if (resolvedCandidate) {
  productionIssues.push({
    id: `issue-${resolvedCandidate.id}-1`,
    orderId: resolvedCandidate.id,
    factoryId: resolvedCandidate.factoryId,
    stage: "finishing",
    issueType: "power_outage",
    description: "Unplanned power outage halted finishing for half a day.",
    severity: "low",
    ownerId: "user-prod",
    status: "resolved",
    resolution: "Generator backup restored power within 4 hours; lost time recovered over the following two days.",
    reportedBy: "user-factory",
    createdAt: addDaysIso(resolvedCandidate.createdAt, 10),
    updatedAt: addDaysIso(resolvedCandidate.createdAt, 11),
  });
}

// ---------- Order Change Requests ----------

export const orderChangeRequests: OrderChangeRequest[] = [];

orderChangeRequests.push({
  id: "cr-order-014-1",
  orderId: flagship.id,
  field: "colour",
  oldValue: "Black, Charcoal, Cream",
  newValue: "Black, Charcoal, Cream, Navy",
  requestedBy: "James Whitfield (North & Row Apparel)",
  reason: "Buyer added a fourth colourway after reviewing the approved PP sample.",
  status: "approved",
  approvedBy: "user-mrc-1",
  approvedAt: addDaysIso(flagship.createdAt, 5),
  implementationStatus: "implemented",
  createdAt: addDaysIso(flagship.createdAt, 3),
});

orderChangeRequests.push({
  id: "cr-order-014-2",
  orderId: flagship.id,
  field: "delivery_date",
  oldValue: "29 Sep 2026",
  newValue: "22 Sep 2026",
  requestedBy: "James Whitfield (North & Row Apparel)",
  reason: "Buyer's retail launch date moved up by a week.",
  status: "pending",
  implementationStatus: "pending",
  createdAt: addDaysIso(flagship.createdAt, 32),
});

const rejectedCandidate = otherCandidates[1];
if (rejectedCandidate) {
  orderChangeRequests.push({
    id: `cr-${rejectedCandidate.id}-1`,
    orderId: rejectedCandidate.id,
    field: "quantity",
    oldValue: `${rejectedCandidate.quantity.toLocaleString("en-IN")} pcs`,
    newValue: `${Math.round(rejectedCandidate.quantity * 1.15).toLocaleString("en-IN")} pcs`,
    requestedBy: "Buyer merchandising team",
    reason: "Buyer asked to add 15% quantity to the existing PO.",
    status: "rejected",
    approvedBy: "user-mrc-2",
    approvedAt: addDaysIso(rejectedCandidate.createdAt, 12),
    implementationStatus: "not_applicable",
    createdAt: addDaysIso(rejectedCandidate.createdAt, 10),
  });
}

const trimCandidate = otherCandidates[4];
if (trimCandidate) {
  orderChangeRequests.push({
    id: `cr-${trimCandidate.id}-1`,
    orderId: trimCandidate.id,
    field: "trims",
    oldValue: "Standard woven label",
    newValue: "Printed satin label with buyer's sustainability logo",
    requestedBy: "Buyer merchandising team",
    reason: "Buyer standardising label artwork across this season's styles.",
    status: "approved",
    approvedBy: "user-mrc-1",
    approvedAt: addDaysIso(trimCandidate.createdAt, 8),
    implementationStatus: "pending",
    createdAt: addDaysIso(trimCandidate.createdAt, 6),
  });
}
