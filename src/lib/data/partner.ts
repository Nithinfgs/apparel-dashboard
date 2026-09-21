import "server-only";
import * as seed from "@/lib/seed";

/**
 * Factory-partner-safe projection — a factory sees only its own assigned
 * orders and never another factory's data. See brief §28.
 */
export async function getFactoryAssignedOrders(factoryId: string) {
  return seed.orders
    .filter((o) => o.factoryId === factoryId && o.stage !== "completed")
    .map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      styleName: seed.styles.find((s) => s.id === o.styleId)?.name ?? "Unknown",
      quantity: o.quantity,
      stage: o.stage,
      expectedDispatchDate: o.expectedDispatchDate,
    }));
}

export async function getFactoryTodayEntries(factoryId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return seed.productionEntries
    .filter((e) => e.factoryId === factoryId && e.date === today)
    .map((e) => ({ ...e, orderNo: seed.orders.find((o) => o.id === e.orderId)?.orderNo ?? e.orderId }));
}

export async function getFactoryUpcomingDeadlines(factoryId: string, limit = 5) {
  return seed.orders
    .filter((o) => o.factoryId === factoryId && o.stage !== "completed")
    .sort((a, b) => a.expectedDispatchDate.localeCompare(b.expectedDispatchDate))
    .slice(0, limit)
    .map((o) => ({ id: o.id, orderNo: o.orderNo, expectedDispatchDate: o.expectedDispatchDate, stage: o.stage }));
}
