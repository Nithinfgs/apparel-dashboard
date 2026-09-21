import "server-only";
import * as seed from "@/lib/seed";
import { calculateCosting } from "@/lib/calculations";

export async function listCostings() {
  return seed.costings.map((c) => {
    const items = seed.costingItems.filter((i) => i.costingId === c.id);
    const breakdown = calculateCosting(items, c.sellingPricePerPiece, seed.orders.find((o) => o.id === c.orderId)?.quantity ?? 0);
    return {
      ...c,
      orderNo: seed.orders.find((o) => o.id === c.orderId)?.orderNo,
      styleName: seed.styles.find((s) => s.id === c.styleId)?.name ?? "Unknown",
      breakdown,
    };
  });
}

export async function getCostingById(id: string) {
  const costing = seed.costings.find((c) => c.id === id);
  if (!costing) return undefined;
  const items = seed.costingItems.filter((i) => i.costingId === id);
  const order = seed.orders.find((o) => o.id === costing.orderId);
  const breakdown = calculateCosting(items, costing.sellingPricePerPiece, order?.quantity ?? 0);
  return {
    ...costing,
    orderNo: order?.orderNo,
    styleName: seed.styles.find((s) => s.id === costing.styleId)?.name ?? "Unknown",
    breakdown,
  };
}

export async function getCostingVersionsForOrder(orderId: string) {
  const versions = seed.costings.filter((c) => c.orderId === orderId).sort((a, b) => a.versionNumber - b.versionNumber);
  return versions.map((c) => {
    const items = seed.costingItems.filter((i) => i.costingId === c.id);
    const order = seed.orders.find((o) => o.id === orderId);
    return { ...c, breakdown: calculateCosting(items, c.sellingPricePerPiece, order?.quantity ?? 0) };
  });
}
