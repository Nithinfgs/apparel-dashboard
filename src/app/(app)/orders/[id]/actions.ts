"use server";

import { revalidatePath } from "next/cache";
import { orderChangeRequests } from "@/lib/seed/issues";
import {
  changeRequestSchema,
  changeRequestDecisionSchema,
  type ChangeRequestInput,
  type ChangeRequestDecisionInput,
} from "@/lib/validation/change-requests";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Order change requests keep a full revision history rather than silently
 * overwriting the order's own quantity/colour/etc. fields (brief item 3) —
 * this action only ever appends a new request row; nothing on the `orders`
 * record itself is mutated here. Mutates the in-memory seed array — see
 * AGENTS.md §4.
 */
export async function createChangeRequest(input: ChangeRequestInput) {
  const parsed = changeRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid change request" };
  }

  orderChangeRequests.push({
    id: `cr-${Date.now()}`,
    orderId: parsed.data.orderId,
    field: parsed.data.field,
    oldValue: parsed.data.oldValue,
    newValue: parsed.data.newValue,
    requestedBy: parsed.data.requestedBy,
    reason: parsed.data.reason,
    status: "pending",
    implementationStatus: "pending",
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath(`/portal/orders/${parsed.data.orderId}`);
  revalidatePath("/action-center");

  return { success: true as const };
}

export async function decideChangeRequest(input: ChangeRequestDecisionInput) {
  const parsed = changeRequestDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid decision" };
  }

  const cr = orderChangeRequests.find((c) => c.id === parsed.data.changeRequestId);
  if (!cr) {
    return { success: false as const, error: "Change request not found." };
  }

  const user = await getCurrentUser();
  cr.status = parsed.data.decision;
  cr.approvedBy = user.id;
  cr.approvedAt = new Date().toISOString();
  if (parsed.data.decision === "rejected") cr.implementationStatus = "not_applicable";

  revalidatePath(`/orders/${cr.orderId}`);
  revalidatePath(`/portal/orders/${cr.orderId}`);
  revalidatePath("/action-center");

  return { success: true as const };
}

export async function markChangeRequestImplemented(changeRequestId: string) {
  const cr = orderChangeRequests.find((c) => c.id === changeRequestId);
  if (!cr) {
    return { success: false as const, error: "Change request not found." };
  }
  if (cr.status !== "approved") {
    return { success: false as const, error: "Only approved changes can be marked implemented." };
  }

  cr.implementationStatus = "implemented";

  revalidatePath(`/orders/${cr.orderId}`);
  revalidatePath(`/portal/orders/${cr.orderId}`);

  return { success: true as const };
}
