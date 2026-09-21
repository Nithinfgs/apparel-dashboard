import "server-only";
import * as seed from "@/lib/seed";

export async function listInspections() {
  return seed.qualityInspections.map((q) => ({
    ...q,
    orderNo: seed.orders.find((o) => o.id === q.orderId)?.orderNo ?? q.orderId,
    factoryName: seed.factories.find((f) => f.id === q.factoryId)?.name ?? "Unknown",
  }));
}

export async function getInspectionById(id: string) {
  const inspection = seed.qualityInspections.find((q) => q.id === id);
  if (!inspection) return undefined;
  return {
    ...inspection,
    orderNo: seed.orders.find((o) => o.id === inspection.orderId)?.orderNo ?? inspection.orderId,
    factoryName: seed.factories.find((f) => f.id === inspection.factoryId)?.name ?? "Unknown",
    defects: seed.qualityDefects.filter((d) => d.qualityInspectionId === id),
  };
}

export async function listDefects() {
  return seed.qualityDefects.map((d) => ({
    ...d,
    inspection: seed.qualityInspections.find((q) => q.id === d.qualityInspectionId),
  }));
}

export async function getDefectTrends() {
  const byCategory = new Map<string, number>();
  seed.qualityDefects.forEach((d) => byCategory.set(d.category, (byCategory.get(d.category) ?? 0) + d.count));
  return Array.from(byCategory.entries()).map(([category, count]) => ({ category, count }));
}
