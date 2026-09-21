import "server-only";
import * as seed from "@/lib/seed";
import { calculateFactoryUtilisation } from "@/lib/calculations";

export async function listFactories() {
  return seed.factories.map((f) => {
    const utilisation = calculateFactoryUtilisation(f, seed.productionAssignments);
    const activeOrders = seed.orders.filter((o) => o.factoryId === f.id && o.stage !== "completed");
    return { ...f, utilisation, activeOrderCount: activeOrders.length };
  });
}

export async function getFactoryById(id: string) {
  const factory = seed.factories.find((f) => f.id === id);
  if (!factory) return undefined;
  const utilisation = calculateFactoryUtilisation(factory, seed.productionAssignments);
  return { ...factory, utilisation };
}

export async function getFactoryOrders(factoryId: string) {
  return seed.orders.filter((o) => o.factoryId === factoryId);
}

export async function getFactoryProductionEntries(factoryId: string) {
  return seed.productionEntries.filter((e) => e.factoryId === factoryId);
}

export async function getFactoryInspections(factoryId: string) {
  return seed.qualityInspections
    .filter((q) => q.factoryId === factoryId)
    .map((q) => ({ ...q, orderNo: seed.orders.find((o) => o.id === q.orderId)?.orderNo ?? q.orderId }));
}
