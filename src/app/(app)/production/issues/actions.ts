"use server";

import { revalidatePath } from "next/cache";
import { productionIssues } from "@/lib/seed/issues";
import { productionIssueSchema, resolveIssueSchema, type ProductionIssueInput, type ResolveIssueInput } from "@/lib/validation/issues";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Shared by the internal Production Issues page and the Factory Partner
 * portal's Issues page — one implementation, not two copies (AGENTS.md
 * §2.2). Mutates the in-memory seed array, same pattern as
 * `recordProductionEntry` in production/daily/actions.ts; see its comment
 * for why (AGENTS.md §4).
 */
export async function createProductionIssue(input: ProductionIssueInput) {
  const parsed = productionIssueSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid issue" };
  }

  const user = await getCurrentUser();
  const now = new Date().toISOString();

  productionIssues.push({
    id: `issue-${Date.now()}`,
    orderId: parsed.data.orderId,
    factoryId: parsed.data.factoryId,
    stage: parsed.data.stage,
    issueType: parsed.data.issueType,
    description: parsed.data.description,
    severity: parsed.data.severity,
    ownerId: parsed.data.ownerId,
    status: "open",
    reportedBy: user.id,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/production/issues");
  revalidatePath("/partner/issues");
  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath("/action-center");
  revalidatePath("/dashboard");

  return { success: true as const };
}

export async function resolveProductionIssue(input: ResolveIssueInput) {
  const parsed = resolveIssueSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid resolution" };
  }

  const issue = productionIssues.find((i) => i.id === parsed.data.issueId);
  if (!issue) {
    return { success: false as const, error: "Issue not found." };
  }

  issue.status = "resolved";
  issue.resolution = parsed.data.resolution;
  issue.updatedAt = new Date().toISOString();

  revalidatePath("/production/issues");
  revalidatePath(`/production/issues/${issue.id}`);
  revalidatePath("/partner/issues");
  revalidatePath(`/orders/${issue.orderId}`);
  revalidatePath("/action-center");
  revalidatePath("/dashboard");

  return { success: true as const };
}
