export * from "./status";

import type { OrderStage, MilestoneKey, ProductionStage, Role, ProductionIssueType, ChangeRequestField } from "@/types";

export const ORDER_STAGES: OrderStage[] = [
  "costing",
  "sampling",
  "sourcing",
  "cutting",
  "stitching",
  "finishing",
  "quality",
  "packing",
  "dispatch",
  "completed",
];

export const ORDER_STAGE_LABELS: Record<OrderStage, string> = {
  costing: "Costing",
  sampling: "Sampling",
  sourcing: "Sourcing",
  cutting: "Cutting",
  stitching: "Stitching",
  finishing: "Finishing",
  quality: "QC",
  packing: "Packing",
  dispatch: "Dispatch",
  completed: "Completed",
};

export const PRODUCTION_STAGES: ProductionStage[] = [
  "fabric_ready",
  "cutting",
  "printing_embroidery",
  "stitching",
  "washing",
  "finishing",
  "qc",
  "packing",
];

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  fabric_ready: "Fabric Ready",
  cutting: "Cutting",
  printing_embroidery: "Printing / Embroidery",
  stitching: "Stitching",
  washing: "Washing",
  finishing: "Finishing",
  qc: "QC",
  packing: "Packing",
};

export const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  techpack_approved: "Tech Pack Approved",
  fabric_ordered: "Fabric Ordered",
  fabric_arrival: "Fabric Arrival",
  pp_sample: "PP Sample",
  buyer_approval: "Buyer Approval",
  cutting_start: "Cutting Start",
  cutting_complete: "Cutting Complete",
  stitching_complete: "Stitching Complete",
  finishing_complete: "Finishing Complete",
  final_qc: "Final QC",
  packing: "Packing",
  dispatch: "Dispatch",
};

/**
 * Canonical Time & Action milestone order — derived from MILESTONE_LABELS'
 * key order rather than duplicated, so seed generation and the milestone
 * dependency-impact calculation always agree on adjacency. See
 * BUSINESS_RULES.md §15.
 */
export const MILESTONE_SEQUENCE: MilestoneKey[] = Object.keys(MILESTONE_LABELS) as MilestoneKey[];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Founder / Admin",
  management: "Management",
  merchandiser: "Merchandiser",
  sourcing_manager: "Sourcing Manager",
  production_manager: "Production Manager",
  qc_inspector: "QC Inspector",
  finance: "Finance",
  factory_partner: "Factory Partner",
  buyer: "Buyer",
};

export const ORDER_PREFIX = "TC";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export const PRODUCTION_ISSUE_TYPE_LABELS: Record<ProductionIssueType, string> = {
  material_shortage: "Material Shortage",
  machine_breakdown: "Machine Breakdown",
  quality_defect: "Quality Defect",
  labour_shortage: "Labour Shortage",
  fabric_defect: "Fabric Defect",
  power_outage: "Power Outage",
  logistics_delay: "Logistics Delay",
  other: "Other",
};

export const CHANGE_REQUEST_FIELD_LABELS: Record<ChangeRequestField, string> = {
  quantity: "Quantity",
  colour: "Colour",
  measurements: "Measurements",
  artwork: "Artwork",
  trims: "Trims",
  packaging: "Packaging",
  delivery_date: "Delivery Date",
};
