import "server-only";
import * as seed from "@/lib/seed";

export async function listPackingRecords(orderId?: string) {
  let items = seed.packingRecords.map((p) => ({
    ...p,
    orderNo: seed.orders.find((o) => o.id === p.orderId)?.orderNo ?? p.orderId,
  }));
  if (orderId) items = items.filter((p) => p.orderId === orderId);
  return items;
}

export async function listDispatches() {
  return seed.dispatches.map((d) => ({
    ...d,
    orderNo: seed.orders.find((o) => o.id === d.orderId)?.orderNo ?? d.orderId,
    buyerName: seed.buyers.find((b) => b.id === seed.orders.find((o) => o.id === d.orderId)?.buyerId)?.companyName ?? "Unknown",
  }));
}

export async function getDispatchById(id: string) {
  const dispatch = seed.dispatches.find((d) => d.id === id);
  if (!dispatch) return undefined;
  const order = seed.orders.find((o) => o.id === dispatch.orderId);
  return {
    ...dispatch,
    orderNo: order?.orderNo ?? dispatch.orderId,
    buyerName: seed.buyers.find((b) => b.id === order?.buyerId)?.companyName ?? "Unknown",
    documents: seed.documents.filter((doc) => doc.entityType === "dispatch" && doc.entityId === id),
  };
}
