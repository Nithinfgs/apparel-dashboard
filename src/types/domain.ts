/**
 * Domain types for Texcroft OS. Mirrors docs/DATA_MODEL.md exactly.
 * These types describe the shape of data regardless of source
 * (seed array today, Supabase row tomorrow) — see AGENTS.md §4.
 */

export type Currency = "INR" | "USD" | "GBP" | "EUR";

export type Role =
  | "admin"
  | "management"
  | "merchandiser"
  | "sourcing_manager"
  | "production_manager"
  | "qc_inspector"
  | "finance"
  | "factory_partner"
  | "buyer";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  buyerId?: string;
  factoryId?: string;
}

// ---------- Sales ----------

export interface Buyer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  currency: Currency;
  shippingLocation: string;
  paymentTerms: string;
  taxDetails: string;
  notes?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerContact {
  id: string;
  buyerId: string;
  name: string;
  roleTitle: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export type EnquiryStatus =
  | "new"
  | "requirements_received"
  | "costing"
  | "quote_sent"
  | "negotiation"
  | "confirmed"
  | "lost";

/** Where an enquiry originated. Internal (staff-entered) enquiries omit this. */
export type EnquirySource = "internal" | "website_quote" | "design_lab";

/** A single garment configured in the public Design Lab. Serializable, so staff can reopen exactly what a buyer designed. See docs/DATA_MODEL.md. */
export interface DesignLabConfig {
  productCategory: string;
  garmentType: string;
  sleeveStyle?: "half_sleeve" | "full_sleeve";
  baseColourName: string;
  baseColourHex: string;
  frontArtworkName?: string;
  backArtworkName?: string;
  hasCustomMeasurements: boolean;
  fabricPreference?: string;
  gsmPreference?: string;
  printMethod?: string;
  embroideryRequired?: boolean;
  packagingNotes?: string;
}

export interface Enquiry {
  id: string;
  enquiryNo: string;
  buyerId: string;
  merchandiserId: string;
  productSummary: string;
  expectedQuantity: number;
  /** Unknown until costing for public leads — never fabricated. */
  targetPrice?: number;
  currency: Currency;
  deliveryDeadline: string;
  status: EnquiryStatus;
  notes?: string;
  convertedOrderId?: string;
  createdAt: string;
  updatedAt: string;
  /** Public-website provenance. Absent/"internal" for staff-entered enquiries — see BUSINESS_RULES.md §20. */
  source?: EnquirySource;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Per-size quantity breakdown for a Design Lab or quote submission (e.g. { S: 20, M: 40 }). */
  sizeBreakdown?: Record<string, number>;
  /** Present only for source: "design_lab" submissions. */
  designConfig?: DesignLabConfig;
}

// ---------- Product ----------

export type StyleApprovalStatus = "draft" | "pending_approval" | "approved";

export interface StyleMeasurement {
  point: string;
  values: Record<string, number>; // size -> value (cm)
}

export interface Style {
  id: string;
  styleCode: string;
  name: string;
  category: string;
  buyerId: string;
  fabric: string;
  composition: string;
  gsm: number;
  colours: string[];
  sizes: string[];
  measurements: StyleMeasurement[];
  printDetails?: string;
  embroideryDetails?: string;
  washType?: string;
  labelInstructions?: string;
  packagingInstructions?: string;
  currentVersion: number;
  approvalStatus: StyleApprovalStatus;
  createdBy: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StyleVersion {
  id: string;
  styleId: string;
  versionNumber: number;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

// ---------- Costing ----------

export type CostingCategory =
  | "fabric"
  | "rib"
  | "thread"
  | "labels"
  | "buttons_zippers"
  | "printing"
  | "embroidery"
  | "washing"
  | "cutting"
  | "stitching"
  | "finishing"
  | "packing"
  | "freight"
  | "other";

export interface CostingItem {
  id: string;
  costingId: string;
  category: CostingCategory;
  unit: string;
  consumption: number;
  rate: number;
  wastePercent: number;
}

export interface Costing {
  id: string;
  orderId?: string;
  enquiryId?: string;
  styleId: string;
  versionNumber: number;
  sellingPricePerPiece: number;
  currency: Currency;
  status: "draft" | "final";
  createdBy: string;
  createdAt: string;
}

// ---------- Orders ----------

export type OrderStage =
  | "costing"
  | "sampling"
  | "sourcing"
  | "cutting"
  | "stitching"
  | "finishing"
  | "quality"
  | "packing"
  | "dispatch"
  | "completed";

export interface OrderItem {
  id: string;
  orderId: string;
  colour: string;
  size: string;
  quantity: number;
}

export type MilestoneKey =
  | "techpack_approved"
  | "fabric_ordered"
  | "fabric_arrival"
  | "pp_sample"
  | "buyer_approval"
  | "cutting_start"
  | "cutting_complete"
  | "stitching_complete"
  | "finishing_complete"
  | "final_qc"
  | "packing"
  | "dispatch";

export type MilestoneStatus = "pending" | "in_progress" | "done" | "delayed";

export interface OrderMilestone {
  id: string;
  orderId: string;
  milestoneKey: MilestoneKey;
  plannedDate: string;
  actualDate?: string;
  status: MilestoneStatus;
  ownerId: string;
}

export interface Order {
  id: string;
  orderNo: string;
  enquiryId?: string;
  buyerId: string;
  styleId: string;
  costingId: string;
  poNumber: string;
  quantity: number;
  pricePerPiece: number;
  currency: Currency;
  factoryId: string;
  stage: OrderStage;
  expectedDispatchDate: string;
  actualDispatchDate?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Sampling ----------

export type SampleType =
  | "development"
  | "proto"
  | "fit"
  | "lab_dip"
  | "size_set"
  | "pp";

export type SampleStatus =
  | "requested"
  | "in_development"
  | "sent"
  | "buyer_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export interface Sample {
  id: string;
  orderId?: string;
  styleId: string;
  sampleType: SampleType;
  versionNumber: number;
  status: SampleStatus;
  courier?: string;
  sentDate?: string;
  buyerResponseDate?: string;
  comments?: string;
  createdAt: string;
}

export interface SampleApprovalLike {
  id: string;
  sampleId: string;
  decision: "approved" | "changes_requested" | "rejected";
  comments?: string;
  decidedAt: string;
}

// ---------- Sourcing ----------

export type MaterialCategory =
  | "fabric"
  | "rib"
  | "thread"
  | "buttons"
  | "zippers"
  | "labels"
  | "packaging"
  | "other";

export type MaterialStatus =
  | "required"
  | "rfq"
  | "ordered"
  | "partial"
  | "received"
  | "qc_hold";

export interface Material {
  id: string;
  sku: string;
  description: string;
  category: MaterialCategory;
  supplierId: string;
  orderId?: string;
  colour?: string;
  gsm?: number;
  unit: string;
  requiredQty: number;
  orderedQty: number;
  receivedQty: number;
  allocatedQty: number;
  cost: number;
  expectedArrival: string;
  status: MaterialStatus;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  materialCategories: MaterialCategory[];
  leadTimeDays: number;
  paymentTerms: string;
}

export type PurchaseOrderStatus = "draft" | "sent" | "partial" | "received" | "closed";
export type PaymentStatus = "pending" | "partial" | "paid";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  materialId: string;
  quantity: number;
  rate: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierId: string;
  orderDate: string;
  eta: string;
  status: PurchaseOrderStatus;
  paymentStatus: PaymentStatus;
  totalValue: number;
  currency: Currency;
}

export interface MaterialReceipt {
  id: string;
  purchaseOrderItemId: string;
  receivedQty: number;
  receivedDate: string;
  receivedBy: string;
  qcHold: boolean;
  notes?: string;
}

// ---------- Manufacturing ----------

export type FactoryCapability =
  | "knits"
  | "wovens"
  | "printing"
  | "embroidery"
  | "washing"
  | "finishing";

export interface Factory {
  id: string;
  name: string;
  location: string;
  contactName: string;
  contactPhone: string;
  capabilities: FactoryCapability[];
  dailyCapacityPieces: number;
}

export interface ProductionAssignment {
  id: string;
  orderId: string;
  factoryId: string;
  assignedQuantity: number;
  assignedDate: string;
  status: "active" | "completed" | "reassigned";
}

export type ProductionStage =
  | "fabric_ready"
  | "cutting"
  | "printing_embroidery"
  | "stitching"
  | "washing"
  | "finishing"
  | "qc"
  | "packing";

export interface ProductionEntry {
  id: string;
  productionAssignmentId: string;
  orderId: string;
  factoryId: string;
  stage: ProductionStage;
  date: string;
  producedQty: number;
  rejectedQty: number;
  reworkedQty: number;
  workersCount?: number;
  notes?: string;
  enteredBy: string;
}

// ---------- Quality ----------

export type InspectionType =
  | "fabric_qc"
  | "inline_qc"
  | "endline_qc"
  | "measurement"
  | "final_inspection";

export type InspectionResult = "pass" | "conditional_pass" | "hold" | "fail";

export interface QualityInspection {
  id: string;
  orderId: string;
  factoryId: string;
  inspectorId: string;
  inspectionType: InspectionType;
  date: string;
  quantityInspected: number;
  minorDefects: number;
  majorDefects: number;
  criticalDefects: number;
  result: InspectionResult;
  notes?: string;
}

export type DefectCategory =
  | "stitching"
  | "measurement"
  | "fabric"
  | "colour"
  | "printing"
  | "embroidery"
  | "finishing"
  | "packing"
  | "other";

export type DefectSeverity = "minor" | "major" | "critical";

export interface QualityDefect {
  id: string;
  qualityInspectionId: string;
  category: DefectCategory;
  count: number;
  severity: DefectSeverity;
  description: string;
}

// ---------- Logistics ----------

export interface PackingRecord {
  id: string;
  orderId: string;
  cartonNumber: number;
  colour: string;
  size: string;
  quantity: number;
  packedDate: string;
  packedBy: string;
}

export type DispatchMode = "sea" | "air" | "road";
export type DispatchStatus = "preparing" | "ready" | "dispatched" | "in_transit" | "delivered";

export interface Dispatch {
  id: string;
  orderId: string;
  plannedDate: string;
  actualDate?: string;
  mode: DispatchMode;
  forwarder: string;
  awbOrBlNumber?: string;
  containerNumber?: string;
  trackingReference?: string;
  destination: string;
  status: DispatchStatus;
}

// ---------- Finance ----------

export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue";

export interface Invoice {
  id: string;
  invoiceNo: string;
  orderId: string;
  buyerId: string;
  amount: number;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: Currency;
  paidDate: string;
  method: string;
  reference: string;
  recordedBy: string;
}

// ---------- Cross-cutting ----------

export type DocumentEntityType =
  | "buyer"
  | "order"
  | "style"
  | "sample"
  | "purchase_order"
  | "quality_inspection"
  | "dispatch"
  | "production_entry"
  | "quality_defect";

export interface AppDocument {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  version?: number;
  uploadedBy: string;
  uploadedAt: string;
}

export type NotificationType =
  | "risk"
  | "material"
  | "sample"
  | "quality"
  | "finance"
  | "dispatch"
  | "general";

export interface AppNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export type InventoryCategory = "raw_material" | "wip" | "finished_goods";

export interface InventoryItem {
  id: string;
  sku: string;
  category: InventoryCategory;
  materialId?: string;
  orderId?: string;
}

export type InventoryMovementType =
  | "purchase_receipt"
  | "allocation"
  | "production_issue"
  | "return"
  | "adjustment"
  | "finished_production"
  | "dispatch";

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  movementType: InventoryMovementType;
  quantity: number;
  referenceEntityType: string;
  referenceEntityId: string;
  createdBy: string;
  createdAt: string;
}

// ---------- Production issues / escalations ----------

export type ProductionIssueType =
  | "material_shortage"
  | "machine_breakdown"
  | "quality_defect"
  | "labour_shortage"
  | "fabric_defect"
  | "power_outage"
  | "logistics_delay"
  | "other";

export type ProductionIssueStatus = "open" | "in_progress" | "resolved" | "closed";

export interface ProductionIssue {
  id: string;
  orderId: string;
  factoryId: string;
  stage: ProductionStage;
  issueType: ProductionIssueType;
  description: string;
  severity: RiskLevel;
  ownerId: string;
  status: ProductionIssueStatus;
  resolution?: string;
  attachmentDocumentId?: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Order change requests ----------

export type ChangeRequestField =
  | "quantity"
  | "colour"
  | "measurements"
  | "artwork"
  | "trims"
  | "packaging"
  | "delivery_date";

export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export type ChangeImplementationStatus = "pending" | "implemented" | "not_applicable";

export interface OrderChangeRequest {
  id: string;
  orderId: string;
  field: ChangeRequestField;
  oldValue: string;
  newValue: string;
  requestedBy: string;
  reason: string;
  status: ChangeRequestStatus;
  approvedBy?: string;
  approvedAt?: string;
  implementationStatus: ChangeImplementationStatus;
  createdAt: string;
}
