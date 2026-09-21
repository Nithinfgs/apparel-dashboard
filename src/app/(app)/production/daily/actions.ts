"use server";

import { revalidatePath } from "next/cache";
import { productionEntries } from "@/lib/seed/operations";
import { productionAssignments } from "@/lib/seed/operations";
import { productionEntrySchema, type ProductionEntryInput } from "@/lib/validation/production";

/**
 * Appends a production entry to the in-memory seed array. Production
 * totals are always derived by summing these entries (BUSINESS_RULES.md
 * §4) — this action never touches a cumulative total directly. Mutates the
 * seed module in place, so it only persists for the life of this server
 * process; a real backend replaces this with an INSERT (AGENTS.md §4).
 */
export async function recordProductionEntry(input: ProductionEntryInput) {
  const parsed = productionEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const assignment = productionAssignments.find((a) => a.orderId === parsed.data.orderId && a.status === "active");
  if (!assignment) {
    return { success: false as const, error: "No active production assignment found for this order." };
  }

  productionEntries.push({
    id: `entry-${Date.now()}`,
    productionAssignmentId: assignment.id,
    orderId: parsed.data.orderId,
    factoryId: parsed.data.factoryId,
    stage: parsed.data.stage,
    date: parsed.data.date,
    producedQty: parsed.data.producedQty,
    rejectedQty: parsed.data.rejectedQty,
    reworkedQty: parsed.data.reworkedQty,
    workersCount: parsed.data.workersCount,
    notes: parsed.data.notes,
    enteredBy: "user-factory",
  });

  revalidatePath("/production/daily");
  revalidatePath("/production");
  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath("/dashboard");

  return { success: true as const };
}
