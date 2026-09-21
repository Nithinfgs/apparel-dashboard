import type { Material } from "@/types";
import { differenceInCalendarDays, parseISO } from "date-fns";

export interface MaterialAvailability {
  availableQty: number;
  shortage: number;
  status: "sufficient" | "shortage" | "overdue";
}

/**
 * See BUSINESS_RULES.md §5. Shortage reflects procurement sufficiency
 * (received vs. required) — not leftover unconsumed stock. Once material has
 * been received and partly consumed by production, the remaining
 * (`availableQty`) will naturally fall below `requiredQty`; that is normal
 * utilisation, not a shortage, so it must never drive the shortage flag.
 */
export function calculateMaterialAvailability(material: Material, today: Date = new Date()): MaterialAvailability {
  const availableQty = Math.max(0, material.receivedQty - material.allocatedQty);
  const shortage = Math.max(0, material.requiredQty - material.receivedQty);
  const isOverdue =
    material.status !== "received" && differenceInCalendarDays(today, parseISO(material.expectedArrival)) > 0;

  return {
    availableQty,
    shortage,
    status: isOverdue ? "overdue" : shortage > 0 ? "shortage" : "sufficient",
  };
}
