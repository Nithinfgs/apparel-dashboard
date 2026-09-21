import "server-only";
import * as seed from "@/lib/seed";
import { calculateSupplierPerformance } from "@/lib/calculations";

export async function listSuppliers() {
  return seed.suppliers.map((s) => ({
    ...s,
    performance: calculateSupplierPerformance(s, seed.purchaseOrders, seed.purchaseOrderItems, seed.materialReceipts),
  }));
}

export async function getSupplierById(id: string) {
  const supplier = seed.suppliers.find((s) => s.id === id);
  if (!supplier) return undefined;
  return {
    ...supplier,
    performance: calculateSupplierPerformance(supplier, seed.purchaseOrders, seed.purchaseOrderItems, seed.materialReceipts),
  };
}

export async function getSupplierPurchaseOrders(supplierId: string) {
  return seed.purchaseOrders.filter((po) => po.supplierId === supplierId);
}
