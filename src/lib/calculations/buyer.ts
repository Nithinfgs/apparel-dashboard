import type { Order, Buyer } from "@/types";
import { isAfter, parseISO } from "date-fns";

export interface BuyerKpis {
  lifetimeOrderValue: number;
  activeOrders: number;
  completedOrders: number;
  averageOrderSize: number;
  onTimeDeliveryPercent: number;
}

/** See BUSINESS_RULES.md §12. `orderValues` maps order.id -> order.quantity * order.pricePerPiece. */
export function calculateBuyerKpis(
  buyer: Pick<Buyer, "id">,
  orders: Order[],
  orderValueOf: (order: Order) => number
): BuyerKpis {
  const buyerOrders = orders.filter((o) => o.buyerId === buyer.id);
  const lifetimeOrderValue = buyerOrders.reduce((sum, o) => sum + orderValueOf(o), 0);
  const completed = buyerOrders.filter((o) => o.stage === "completed" || o.actualDispatchDate);
  const dispatched = buyerOrders.filter((o) => o.actualDispatchDate);
  const onTime = dispatched.filter(
    (o) => !isAfter(parseISO(o.actualDispatchDate as string), parseISO(o.expectedDispatchDate))
  );

  return {
    lifetimeOrderValue,
    activeOrders: buyerOrders.length - completed.length,
    completedOrders: completed.length,
    averageOrderSize: buyerOrders.length > 0 ? lifetimeOrderValue / buyerOrders.length : 0,
    onTimeDeliveryPercent: dispatched.length > 0 ? (onTime.length / dispatched.length) * 100 : 100,
  };
}
