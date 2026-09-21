import type { Supplier, PurchaseOrder, MaterialReceipt, PurchaseOrderItem } from "@/types";
import { differenceInCalendarDays, parseISO } from "date-fns";

export interface SupplierPerformance {
  onTimePercent: number;
  avgLeadTimeDays: number;
  qcAcceptancePercent: number;
  totalPurchaseValue: number;
  ordersSupplied: number;
}

/**
 * Computed only from real seeded PO/receipt data — never an arbitrary rating.
 * See BUSINESS_RULES.md §10.
 */
export function calculateSupplierPerformance(
  supplier: Pick<Supplier, "id">,
  purchaseOrders: PurchaseOrder[],
  purchaseOrderItems: PurchaseOrderItem[],
  receipts: MaterialReceipt[]
): SupplierPerformance {
  const supplierPOs = purchaseOrders.filter((po) => po.supplierId === supplier.id);
  const supplierPOIds = new Set(supplierPOs.map((po) => po.id));
  const supplierItems = purchaseOrderItems.filter((i) => supplierPOIds.has(i.purchaseOrderId));
  const supplierItemIds = new Set(supplierItems.map((i) => i.id));
  const supplierReceipts = receipts.filter((r) => supplierItemIds.has(r.purchaseOrderItemId));

  const totalPurchaseValue = supplierPOs.reduce((sum, po) => sum + po.totalValue, 0);

  if (supplierReceipts.length === 0) {
    return {
      onTimePercent: 0,
      avgLeadTimeDays: 0,
      qcAcceptancePercent: 0,
      totalPurchaseValue,
      ordersSupplied: supplierPOs.length,
    };
  }

  const itemToPO = new Map(supplierItems.map((i) => [i.id, i.purchaseOrderId]));
  const poById = new Map(supplierPOs.map((po) => [po.id, po]));

  let onTime = 0;
  let leadTimeTotal = 0;
  let qcAccepted = 0;

  for (const receipt of supplierReceipts) {
    const poId = itemToPO.get(receipt.purchaseOrderItemId);
    const po = poId ? poById.get(poId) : undefined;
    if (po) {
      const eta = parseISO(po.eta);
      const received = parseISO(receipt.receivedDate);
      if (received <= eta) onTime += 1;
      leadTimeTotal += differenceInCalendarDays(received, parseISO(po.orderDate));
    }
    if (!receipt.qcHold) qcAccepted += 1;
  }

  return {
    onTimePercent: (onTime / supplierReceipts.length) * 100,
    avgLeadTimeDays: leadTimeTotal / supplierReceipts.length,
    qcAcceptancePercent: (qcAccepted / supplierReceipts.length) * 100,
    totalPurchaseValue,
    ordersSupplied: supplierPOs.length,
  };
}
