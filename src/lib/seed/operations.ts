import type {
  Material,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialReceipt,
  ProductionAssignment,
  ProductionEntry,
  ProductionStage,
  QualityInspection,
  QualityDefect,
  PackingRecord,
  Dispatch,
  Invoice,
  Payment,
} from "@/types";
import { orders } from "./orders";
import { suppliers } from "./reference";
import { addDaysIso, randInt, randFloat, pick } from "./rng";
import { ORDER_STAGES } from "@/lib/constants";

const STAGE_INDEX = Object.fromEntries(ORDER_STAGES.map((s, i) => [s, i])) as Record<string, number>;
const PRODUCTION_SEQUENCE: ProductionStage[] = [
  "fabric_ready",
  "cutting",
  "printing_embroidery",
  "stitching",
  "washing",
  "finishing",
  "qc",
  "packing",
];

// ---------- Materials, Purchase Orders, Receipts ----------

export const materials: Material[] = [];
export const purchaseOrders: PurchaseOrder[] = [];
export const purchaseOrderItems: PurchaseOrderItem[] = [];
export const materialReceipts: MaterialReceipt[] = [];

const materialOrders = orders.filter((o) => STAGE_INDEX[o.stage] >= STAGE_INDEX["sourcing"]);
let poCounter = 1;

materialOrders.forEach((order, idx) => {
  const materialCount = idx < 15 ? 2 : 1; // ~40 materials across ~25 orders
  for (let m = 0; m < materialCount; m++) {
    const materialId = `material-${order.id}-${m + 1}`;
    const supplier = suppliers[(idx + m) % suppliers.length];
    const category = m === 0 ? "fabric" : (pick(["thread", "labels", "zippers", "buttons", "packaging"] as const));
    const isFlagship = order.id === "order-014";
    const requiredQty = order.quantity * (m === 0 ? 1.03 : 0.05);
    const stageIdx = STAGE_INDEX[order.stage];
    const fullyReceived = stageIdx >= STAGE_INDEX["cutting"];
    const receivedQty = isFlagship
      ? requiredQty
      : fullyReceived
      ? requiredQty
      : Math.round(requiredQty * randFloat(0.3, 0.9));
    const allocatedQty = Math.round(receivedQty * randFloat(0.8, 1));
    const status = fullyReceived ? "received" : receivedQty > 0 ? "partial" : "ordered";

    materials.push({
      id: materialId,
      sku: `${category.slice(0, 3).toUpperCase()}-${order.id.slice(-3)}-${m}`,
      description:
        m === 0 ? `Fabric — ${order.currency === "INR" ? "Cotton" : "Cotton Blend"} for ${order.orderNo}` : `${category[0].toUpperCase()}${category.slice(1)} for ${order.orderNo}`,
      category,
      supplierId: supplier.id,
      orderId: order.id,
      unit: m === 0 ? "kg" : "pcs",
      requiredQty: Math.round(requiredQty),
      orderedQty: Math.round(requiredQty),
      receivedQty: Math.round(receivedQty),
      allocatedQty,
      cost: randInt(180, 620),
      expectedArrival: addDaysIso(order.createdAt, randInt(10, 30)),
      status,
    });

    const poId = `po-${String(poCounter).padStart(3, "0")}`;
    if (purchaseOrders.length < 15) {
      purchaseOrders.push({
        id: poId,
        poNo: `PO-26${String(poCounter).padStart(3, "0")}`,
        supplierId: supplier.id,
        orderDate: order.createdAt,
        eta: addDaysIso(order.createdAt, supplier.leadTimeDays),
        status: fullyReceived ? "received" : "partial",
        paymentStatus: fullyReceived ? "paid" : "partial",
        totalValue: Math.round(requiredQty * randInt(180, 620)),
        currency: "INR",
      });
      const itemId = `${poId}-item-1`;
      purchaseOrderItems.push({
        id: itemId,
        purchaseOrderId: poId,
        materialId,
        quantity: Math.round(requiredQty),
        rate: randInt(180, 620),
        receivedQuantity: Math.round(receivedQty),
      });
      if (receivedQty > 0) {
        materialReceipts.push({
          id: `receipt-${poId}`,
          purchaseOrderItemId: itemId,
          receivedQty: Math.round(receivedQty),
          receivedDate: addDaysIso(order.createdAt, supplier.leadTimeDays + randInt(-2, 4)),
          receivedBy: "user-src",
          qcHold: false,
        });
      }
      poCounter++;
    }
  }
});

// ---------- Production ----------

export const productionAssignments: ProductionAssignment[] = [];
export const productionEntries: ProductionEntry[] = [];

const productionOrders = orders.filter((o) => STAGE_INDEX[o.stage] >= STAGE_INDEX["cutting"]);

productionOrders.forEach((order) => {
  const assignmentId = `assignment-${order.id}`;
  const stageIdx = STAGE_INDEX[order.stage];
  productionAssignments.push({
    id: assignmentId,
    orderId: order.id,
    factoryId: order.factoryId,
    assignedQuantity: order.quantity,
    assignedDate: order.createdAt,
    status: stageIdx >= STAGE_INDEX["completed"] ? "completed" : "active",
  });

  const isFlagship = order.id === "order-014";
  let entryCounter = 1;

  const addEntry = (stage: ProductionStage, qty: number, dayOffset: number, rejected = 0, reworked = 0) => {
    productionEntries.push({
      id: `${order.id}-entry-${entryCounter++}`,
      productionAssignmentId: assignmentId,
      orderId: order.id,
      factoryId: order.factoryId,
      stage,
      date: addDaysIso(order.createdAt, dayOffset),
      producedQty: Math.round(qty),
      rejectedQty: Math.round(rejected),
      reworkedQty: Math.round(reworked),
      workersCount: randInt(18, 45),
      enteredBy: "user-factory",
    });
  };

  if (isFlagship) {
    // Cutting 100%, Printing 100%, Stitching 72%, Finishing 18% — brief §37.
    addEntry("cutting", 2600, 4, 12, 4);
    addEntry("cutting", 2400, 6, 10, 3);
    addEntry("printing_embroidery", 2500, 8);
    addEntry("printing_embroidery", 2500, 10);
    addEntry("stitching", 1800, 20, 22, 14);
    addEntry("stitching", 1200, 24, 15, 9);
    addEntry("stitching", 600, 27, 8, 5);
    addEntry("finishing", 500, 29);
    addEntry("finishing", 400, 31);
    return;
  }

  const mappedCurrent: Record<string, ProductionStage> = {
    cutting: "cutting",
    stitching: "stitching",
    finishing: "finishing",
    quality: "qc",
    packing: "packing",
    dispatch: "packing",
    completed: "packing",
  };
  const currentStage = mappedCurrent[order.stage] ?? "cutting";
  const currentIdx = PRODUCTION_SEQUENCE.indexOf(currentStage);
  const fullyDone = order.stage === "dispatch" || order.stage === "completed";

  PRODUCTION_SEQUENCE.slice(0, currentIdx + 1).forEach((stage, i) => {
    const isCurrent = i === currentIdx;
    const percent = isCurrent && !fullyDone ? randFloat(0.35, 0.9) : 1;
    const qty = order.quantity * percent;
    addEntry(stage, qty, 5 + i * 4, qty * 0.015, qty * 0.01);
  });
});

// ---------- Quality ----------

export const qualityInspections: QualityInspection[] = [];
export const qualityDefects: QualityDefect[] = [];

const qcOrders = orders.filter((o) => STAGE_INDEX[o.stage] >= STAGE_INDEX["quality"]);
let failCount = 0;

qcOrders.forEach((order, idx) => {
  ["inline_qc", "final_inspection"].forEach((type, i) => {
    const inspectionId = `qc-${order.id}-${i + 1}`;
    const forceFail = failCount < 2 && idx === qcOrders.length - 1 - i;
    const result = forceFail ? "fail" : idx % 5 === 0 && i === 0 ? "conditional_pass" : "pass";
    if (result === "fail") failCount++;
    const minor = randInt(0, 6);
    const major = result === "pass" ? randInt(0, 1) : randInt(1, 4);
    const critical = result === "fail" ? randInt(1, 2) : 0;

    qualityInspections.push({
      id: inspectionId,
      orderId: order.id,
      factoryId: order.factoryId,
      inspectorId: "user-qc",
      inspectionType: type as QualityInspection["inspectionType"],
      date: addDaysIso(order.createdAt, 35 + i * 5),
      quantityInspected: Math.round(order.quantity * 0.1),
      minorDefects: minor,
      majorDefects: major,
      criticalDefects: critical,
      result: result as QualityInspection["result"],
    });

    if (result !== "pass") {
      const categories = ["stitching", "measurement", "fabric", "finishing"] as const;
      qualityDefects.push({
        id: `${inspectionId}-defect-1`,
        qualityInspectionId: inspectionId,
        category: pick([...categories]),
        count: major + critical,
        severity: critical > 0 ? "critical" : "major",
        description: critical > 0 ? "Critical measurement deviation found on inspected lot." : "Stitching alignment defect on inspected lot.",
      });
    }
  });
});

// ---------- Packing & Dispatch ----------

export const packingRecords: PackingRecord[] = [];
export const dispatches: Dispatch[] = [];

const packingOrders = orders.filter((o) => STAGE_INDEX[o.stage] >= STAGE_INDEX["packing"]);
const forwarders = ["Maersk Line Agency", "DHL Global Forwarding", "Kuehne+Nagel", "CMA CGM Agency"];

packingOrders.forEach((order) => {
  const cartonQty = 50;
  const cartons = Math.max(1, Math.round((order.quantity * 0.6) / cartonQty));
  for (let c = 1; c <= Math.min(cartons, 6); c++) {
    packingRecords.push({
      id: `${order.id}-carton-${c}`,
      orderId: order.id,
      cartonNumber: c,
      colour: "Assorted",
      size: "Assorted",
      quantity: cartonQty,
      packedDate: addDaysIso(order.createdAt, 40 + c),
      packedBy: "user-factory",
    });
  }

  const stageIdx = STAGE_INDEX[order.stage];
  const status: Dispatch["status"] =
    order.stage === "completed" ? "delivered" : order.stage === "dispatch" ? "in_transit" : "preparing";
  dispatches.push({
    id: `dispatch-${order.id}`,
    orderId: order.id,
    plannedDate: order.expectedDispatchDate,
    actualDate: order.actualDispatchDate,
    mode: pick(["sea", "air", "road"] as const),
    forwarder: forwarders[stageIdx % forwarders.length],
    awbOrBlNumber: `AWB${randInt(100000, 999999)}`,
    trackingReference: `TRK-${order.orderNo}`,
    destination: "Buyer nominated port",
    status,
  });
});

// ---------- Finance ----------

export const invoices: Invoice[] = [];
export const payments: Payment[] = [];

const financeOrders = orders.filter((o) => STAGE_INDEX[o.stage] >= STAGE_INDEX["cutting"]).slice(0, 10);

financeOrders.forEach((order) => {
  const orderValue = order.quantity * order.pricePerPiece;
  const advanceAmount = Math.round(orderValue * 0.3);
  const balanceAmount = orderValue - advanceAmount;
  const stageIdx = STAGE_INDEX[order.stage];
  const isComplete = stageIdx >= STAGE_INDEX["completed"];
  const isDispatched = stageIdx >= STAGE_INDEX["dispatch"];

  const advanceInvoiceId = `invoice-${order.id}-advance`;
  invoices.push({
    id: advanceInvoiceId,
    invoiceNo: `INV-${order.orderNo}-A`,
    orderId: order.id,
    buyerId: order.buyerId,
    amount: advanceAmount,
    currency: order.currency,
    issueDate: order.createdAt,
    dueDate: addDaysIso(order.createdAt, 15),
    status: "paid",
  });
  payments.push({
    id: `payment-${order.id}-advance`,
    invoiceId: advanceInvoiceId,
    amount: advanceAmount,
    currency: order.currency,
    paidDate: addDaysIso(order.createdAt, 10),
    method: "Bank Transfer",
    reference: `TXN-${randInt(100000, 999999)}`,
    recordedBy: "user-fin",
  });

  const balanceInvoiceId = `invoice-${order.id}-balance`;
  invoices.push({
    id: balanceInvoiceId,
    invoiceNo: `INV-${order.orderNo}-B`,
    orderId: order.id,
    buyerId: order.buyerId,
    amount: balanceAmount,
    currency: order.currency,
    issueDate: order.expectedDispatchDate,
    dueDate: addDaysIso(order.expectedDispatchDate, 30),
    status: isComplete ? "paid" : isDispatched ? "sent" : "draft",
  });
  if (isComplete) {
    payments.push({
      id: `payment-${order.id}-balance`,
      invoiceId: balanceInvoiceId,
      amount: balanceAmount,
      currency: order.currency,
      paidDate: addDaysIso(order.expectedDispatchDate, 20),
      method: "Bank Transfer",
      reference: `TXN-${randInt(100000, 999999)}`,
      recordedBy: "user-fin",
    });
  }
});
