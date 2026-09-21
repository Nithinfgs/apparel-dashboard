import "server-only";
import * as seed from "@/lib/seed";
import { calculateMaterialAvailability } from "@/lib/calculations";

export async function listMaterials(filters: { status?: string; category?: string } = {}) {
  let items = seed.materials.map((m) => ({
    ...m,
    availability: calculateMaterialAvailability(m),
    supplierName: seed.suppliers.find((s) => s.id === m.supplierId)?.name ?? "Unknown",
    orderNo: seed.orders.find((o) => o.id === m.orderId)?.orderNo,
  }));
  if (filters.status) items = items.filter((m) => m.status === filters.status);
  if (filters.category) items = items.filter((m) => m.category === filters.category);
  return items;
}

export async function getMaterialById(id: string) {
  const material = seed.materials.find((m) => m.id === id);
  if (!material) return undefined;
  return { ...material, availability: calculateMaterialAvailability(material) };
}

export async function listPurchaseOrders() {
  return seed.purchaseOrders.map((po) => ({
    ...po,
    supplierName: seed.suppliers.find((s) => s.id === po.supplierId)?.name ?? "Unknown",
  }));
}

export async function getPurchaseOrderById(id: string) {
  const po = seed.purchaseOrders.find((p) => p.id === id);
  if (!po) return undefined;
  const items = seed.purchaseOrderItems.filter((i) => i.purchaseOrderId === id);
  const receipts = seed.materialReceipts.filter((r) => items.some((i) => i.id === r.purchaseOrderItemId));
  return {
    ...po,
    supplierName: seed.suppliers.find((s) => s.id === po.supplierId)?.name ?? "Unknown",
    items,
    receipts,
  };
}
